
// Migrated from worker.spec.js (Mocha/sinon/chai) to Jest.
//
// Notes on the migration:
// - sinon sandbox/spies/stubs -> jest.fn()/jest.spyOn().
// - chai `assert`/`expect` -> jest `expect`.
// - The repo's jest config uses clearMocks + restoreMocks and jest.setup.js
//   calls jest.restoreAllMocks() in afterEach, so any spy is torn down between
//   tests. Spies are therefore (re)established per-test, and tests that relied
//   on state carried over from a previous test are made self-contained.

// Invokes a named callback (success/failure/authFailure/accessDenied) passed in
// an options object to a jest.fn() mock -- the Jest equivalent of sinon's
// stub.yieldTo(). Uses the first recorded call, matching how these tests drive
// a single client.call() before resolving its callback.
function yieldTo(mockFn, name, ...args) {
  const call = mockFn.mock.calls[0];
  const cbObj = call.find(
    (arg) => arg && typeof arg === 'object' && typeof arg[name] === 'function'
  );
  return cbObj[name](...args);
}

// Flush pending microtasks. ClientEngine.authorize() does not return its
// promise chain, so awaiting it isn't enough -- several .then/.catch hops need
// to settle before assertions run.
async function flushPromises() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe('Worker', () => {
  const LOG_BUFFER_CAP_SIZE = 400;

  const makeInitData = () => ({
    authToken: 'fake-token',
    authTokenExpiration: new Date(),
    endpoint: '/connect/api',
    refreshToken: 'fake-refresh-token',
    region: 'us-east-1',
    authorizeEndpoint: '/connect/authorize',
  });

  const makeWsm = () => ({
    init: jest.fn().mockResolvedValue({ webSocketConnectionFailed: false }),
    onInitFailure: jest.fn(),
    onConnectionOpen: jest.fn(),
    onConnectionClose: jest.fn(),
    onConnectionGain: jest.fn(),
    onConnectionLost: jest.fn(),
    onSubscriptionUpdate: jest.fn(),
    onSubscriptionFailure: jest.fn(),
    onAllMessage: jest.fn(),
    subscribeTopics: jest.fn(),
    sendMessage: jest.fn(),
  });

  describe('#connect.worker.main()', () => {
    let engine;
    let initData;
    let clientStub;

    beforeAll(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
    });

    beforeEach(() => {
      jest.useFakeTimers();
      initData = makeInitData();
      jest.spyOn(connect.rootLogger, 'pushLogsDownstream');
      jest.spyOn(engine, 'handleSendLogsRequest');
      jest.spyOn(engine.conduit, 'sendDownstream');
      jest.spyOn(connect.WebSocketManager, 'create').mockReturnValue(makeWsm());
      clientStub = {
        call: jest.fn(),
        _sendAPIMetrics: engine.client._sendAPIMetrics,
      };
      engine.client = clientStub;
      jest.spyOn(connect.core, 'init').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('worker initialization', () => {
      expect(connect.worker).toHaveProperty('clientEngine');
    });

    describe('reports master logs to the client', () => {
      const logEntry = new connect.LogEntry('test', connect.LogLevel.LOG, 'some log', 'some-logger-id');

      it('does not send logs to CTI service when logsBuffer does not exceed cap size', () => {
        engine.logsBuffer = [];
        const logs = [];
        for (let i = 0; i < LOG_BUFFER_CAP_SIZE; i++) {
          logs.push(logEntry);
        }
        engine.conduit.downstreamBus.trigger(connect.EventType.SEND_LOGS, logs);
        expect(engine.handleSendLogsRequest).not.toHaveBeenCalled();
        expect(connect.rootLogger.pushLogsDownstream).toHaveBeenCalledWith(logs);
        expect(engine.logsBuffer).toHaveLength(LOG_BUFFER_CAP_SIZE);
      });

      it('sends logs to CTI service when logsBuffer exceeds cap size', () => {
        // Fill the buffer to the cap first, then clear spy history so the
        // assertions target only the overflow trigger.
        engine.logsBuffer = [];
        const logs = [];
        for (let i = 0; i < LOG_BUFFER_CAP_SIZE; i++) {
          logs.push(logEntry);
        }
        engine.conduit.downstreamBus.trigger(connect.EventType.SEND_LOGS, logs);
        connect.rootLogger.pushLogsDownstream.mockClear();
        engine.handleSendLogsRequest.mockClear();

        engine.conduit.downstreamBus.trigger(connect.EventType.SEND_LOGS, [logEntry]);
        expect(engine.handleSendLogsRequest).toHaveBeenCalledTimes(1);
        expect(connect.rootLogger.pushLogsDownstream).toHaveBeenCalledWith([logEntry]);
        expect(engine.logsBuffer).toHaveLength(0);
      });
    });

    it("creates a webSocketManager if it doesn't exist", () => {
      engine.conduit.downstreamBus.trigger(connect.EventType.CONFIGURE, initData);
      const newInitData = connect.merge({}, initData, { authToken: 'other-fake-token' });
      engine.conduit.downstreamBus.trigger(connect.EventType.CONFIGURE, newInitData);
      expect(connect.WebSocketManager.create).toHaveBeenCalledTimes(1);
    });

    it('polls for agent snapshot and config', () => {
      // The CONFIGURE handler only creates the WebSocketManager and starts
      // polling on the first CONFIGURE for a given ClientEngine (guarded by an
      // `if (!webSocketManager)` closure flag). A prior test already consumed
      // that path on the shared engine, so start from a fresh engine here.
      connect.worker.main();
      engine = connect.worker.clientEngine;
      jest.spyOn(engine.conduit, 'sendDownstream');
      clientStub = { call: jest.fn(), _sendAPIMetrics: engine.client._sendAPIMetrics };
      engine.client = clientStub;

      // pollForAgent/pollForAgentConfiguration only run inside
      // webSocketManager.init(...).then(...). Use a synchronous `.then` stub so
      // the callback fires within the test rather than on a later microtask.
      const wsm = makeWsm();
      wsm.init = jest.fn().mockReturnValue({ then: (cb) => cb({ webSocketConnectionFailed: false }) });
      connect.WebSocketManager.create.mockReturnValue(wsm);

      engine.conduit.downstreamBus.trigger(connect.EventType.CONFIGURE, initData);
      expect(clientStub.call).toHaveBeenCalledWith(
        connect.ClientMethods.GET_AGENT_SNAPSHOT,
        expect.anything(),
        expect.anything()
      );
      expect(clientStub.call).toHaveBeenCalledWith(
        connect.ClientMethods.GET_AGENT_CONFIGURATION,
        expect.anything(),
        expect.anything()
      );
    });

    describe('handleMasterRequest', () => {
      it('sets master topic', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: connect.MasterMethods.BECOME_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        engine.handleMasterRequest(portConduit, 'portId_A', request);
        const expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: 'portId_A',
          takeOver: false,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
        expect(engine.conduit.sendDownstream).not.toHaveBeenCalledWith(expected.event, expected);
      });

      it('takes over master topic', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: connect.MasterMethods.BECOME_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        engine.handleMasterRequest(portConduit, 'portId_B', request);
        const expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: 'portId_B',
          takeOver: true,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
      });

      it('returns isMaster as false in MASTER_RESPONSE if not master topic', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        engine.handleMasterRequest(portConduit, 'portId_C', request);
        const expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: 'portId_B',
          isMaster: false,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
      });

      it('becomes master if there\'s no master tab when checking it', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.RINGTONE } };
        engine.handleMasterRequest(portConduit, 'portId_D', request);
        const expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: 'portId_D',
          isMaster: true,
          topic: connect.MasterTopics.RINGTONE,
        });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
      });

      it('shouldn\'t become master if there\'s no master tab when checking it with a shouldNotBecomeMasterIfNone flag', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.METRICS, shouldNotBecomeMasterIfNone: true } };
        engine.handleMasterRequest(portConduit, 'portId_E', request);
        const expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: null,
          isMaster: false,
          topic: connect.MasterTopics.METRICS,
        });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(expected.event, expected);
      });
    });

    describe('handleTabIdEvent', () => {
      const fakeConduit = { sendDownstream: jest.fn() };
      const stream = { getId: () => 'fakeStream' };
      const stream2 = { getId: () => 'fakeStream2' };
      const stream3 = { getId: () => 'fakeStream3' };

      it('does not emit an event when there is a bad streamMapByTabId', () => {
        engine.streamMapByTabId = null;
        engine.handleTabIdEvent(stream, { tabId: 'tabId1' }); // should not throw
        expect(engine.conduit.sendDownstream).not.toHaveBeenCalled();
      });

      it('emits an update connected ccps event with the right data object when a new tabId is communicated by a stream', () => {
        engine.streamMapByTabId = {};
        engine.portConduitMap = { fakeStream: fakeConduit };
        engine.handleTabIdEvent(stream, { tabId: 'tabId1' });
        expect(engine.streamMapByTabId['tabId1']).toEqual(['fakeStream']);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1, tabId: 'tabId1', streamsTabsAcrossBrowser: 1, tabId1: { length: 1 } });

        engine.portConduitMap = { fakeStream: fakeConduit, fakeStream2: fakeConduit };
        engine.handleTabIdEvent(stream2, { tabId: 'tabId1' });
        expect(engine.streamMapByTabId['tabId1']).toEqual(['fakeStream', 'fakeStream2']);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 2, tabId: 'tabId1', streamsTabsAcrossBrowser: 1, tabId1: { length: 2 } });

        engine.portConduitMap = { fakeStream: fakeConduit, fakeStream2: fakeConduit, fakeStream3: fakeConduit };
        engine.handleTabIdEvent(stream3, { tabId: 'tabId2' });
        expect(engine.streamMapByTabId['tabId2']).toEqual(['fakeStream3']);
        expect(engine.streamMapByTabId['tabId1']).toEqual(['fakeStream', 'fakeStream2']);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 3, tabId: 'tabId2', streamsTabsAcrossBrowser: 2, tabId2: { length: 1 } });

        engine.handleTabIdEvent(stream3, { tabId: 'tabId2' });
        expect(engine.streamMapByTabId['tabId2']).toEqual(['fakeStream3']);
        expect(engine.streamMapByTabId['tabId1']).toEqual(['fakeStream', 'fakeStream2']);

        expect(engine.conduit.sendDownstream).toHaveBeenCalledTimes(3);
        engine.portConduitMap = {};
      });
    });

    describe('handleCloseEvent', () => {
      const fakeConduit = { sendDownstream: jest.fn() };
      const stream = { getId: () => 'fakeStream' };
      const stream2 = { getId: () => 'fakeStream2' };

      afterEach(() => {
        engine.portConduitMap = {};
        engine.streamMapByTabId = {};
      });

      it('emits a data object with the UPDATE_CONNECTED_CCPS event to notify CCP of the change in connected ccps, without tab-specific info if the table does not contain this tab id', () => {
        engine.portConduitMap = { fakeStream: fakeConduit };
        engine.streamMapByTabId = {};
        engine.handleCloseEvent(stream);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledTimes(1);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 0, streamsTabsAcrossBrowser: 0 });
      });

      it('removes the stream from this tab\'s list and emits a data object with the UPDATE_CONNECTED_CCPS event to notify CCP of that change', () => {
        const streamHandleCloseEvent = connect.hitch(engine, engine.handleCloseEvent, stream);
        engine.portConduitMap = { fakeStream1: fakeConduit, fakeStream: fakeConduit, fakeStream2: fakeConduit };
        engine.streamMapByTabId = { tabId1: ['fakeStream', 'fakeStream2'] };
        streamHandleCloseEvent();
        expect(engine.streamMapByTabId['tabId1'].length).toBe(1);
        // One UPDATE_CONNECTED_CCPS emission per close event.
        expect(engine.conduit.sendDownstream).toHaveBeenCalledTimes(1);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 2, tabId1: { length: 1 }, tabId: 'tabId1', streamsTabsAcrossBrowser: 1 });
        const stream2HandleCloseEvent = connect.hitch(engine, engine.handleCloseEvent, stream2);
        stream2HandleCloseEvent();
        expect(engine.conduit.sendDownstream).toHaveBeenCalledTimes(2);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1, tabId1: { length: 0 }, tabId: 'tabId1', streamsTabsAcrossBrowser: 0 });
      });
    });

    describe('global.onconnect()', () => {
      let dummyEvent;
      beforeEach(() => {
        dummyEvent = {
          ports: [
            {
              addEventListener: jest.fn(),
              postMessage: jest.fn(),
              start: jest.fn(),
            },
          ],
        };
      });

      it('global.onconnect() exists', () => {
        expect(global.onconnect).toBeDefined();
      });

      it('UPDATE_CONNECTED_CCPS is called with an incremented value', () => {
        global.onconnect(dummyEvent);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
        global.onconnect(dummyEvent);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 2 });
      });

      it('sends ACK event to the downstream with the port id', () => {
        // The ACK is sent on the per-port Conduit created inside onconnect(),
        // not engine.conduit, so spy at the Conduit prototype level.
        const portSendDownstream = jest.spyOn(connect.Conduit.prototype, 'sendDownstream');
        global.onconnect(dummyEvent);
        expect(portSendDownstream).toHaveBeenCalledWith(
          connect.EventType.ACKNOWLEDGE,
          expect.objectContaining({ id: expect.any(String) })
        );
      });
    });
  });

  describe('WorkerClient', () => {
    let engine;
    let portConduit;
    let sendDownstreamSpy;

    beforeAll(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
    });

    beforeEach(() => {
      sendDownstreamSpy = jest.fn();
      portConduit = { sendDownstream: sendDownstreamSpy };
      engine.client.conduit = portConduit;
    });

    describe('_sendAPIMetrics', () => {
      it('emits an API_METRIC event with api call data, time, error, success http status code and NONE retry status dimensions when none provided in error', () => {
        const successStatusCode = 200;
        const method = 'some_method';
        const time = new Date().getTime();
        const error = {};
        const params = {};
        const expectedEventData = {
          name: method,
          time,
          error,
          dimensions: [{ name: 'Category', value: 'API' }],
          optionalDimensions: [
            { name: 'HttpStatusCode', value: successStatusCode },
            { name: 'HttpGenericStatusCode', value: `${successStatusCode.toString().charAt(0)}XX` },
            { name: 'RetryStatus', value: connect.RetryStatus.NONE },
          ],
        };
        engine.client._sendAPIMetrics(method, time, params, error);
        expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.API_METRIC, expect.objectContaining(expectedEventData));
      });

      it('emits an API_METRIC event with api call data, time, error, provided error http status code and retry status dimensions that are included in error object', () => {
        const method = 'some_method';
        const time = new Date().getTime();
        const statusCode = 401;
        const params = {};
        const retryStatus = connect.RetryStatus.RETRYING;
        const error = {
          type: 'someType',
          message: 'some error message',
          stack: ['some', 'stack'],
          statusCode,
          retryStatus,
        };
        const expectedEventData = {
          name: method,
          time,
          error,
          dimensions: [{ name: 'Category', value: 'API' }],
          optionalDimensions: [
            { name: 'HttpStatusCode', value: statusCode },
            { name: 'HttpGenericStatusCode', value: `${statusCode.toString().charAt(0)}XX` },
            { name: 'RetryStatus', value: retryStatus },
          ],
        };
        engine.client._sendAPIMetrics(method, time, params, error);
        expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.API_METRIC, expect.objectContaining(expectedEventData));
      });

      it('marks error5xx and fault for a 5xx status code', () => {
        engine.client._sendAPIMetrics('some_method', 1, {}, { statusCode: 503 });
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.EventType.API_METRIC,
          expect.objectContaining({ error5xx: 1, fault: 1 })
        );
      });

      it('emits an additional WithRelatedContactId metric for related-contact methods', () => {
        engine.client._sendAPIMetrics('createTaskContact', 1, { relatedContactId: 'rc-1' }, {});
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.EventType.API_METRIC,
          expect.objectContaining({ name: 'createTaskContactWithRelatedContactId' })
        );
      });
    });
  });

  describe('ClientEngine', () => {
    let engine;
    let clientStub;
    let callStub;
    let setTimeoutSpy;
    let hitchSpy;
    let updateAgentSpy;
    let pollForAgentPermissionsSpy;
    let pollForAgentStatesSpy;
    let pollForDialableCountryCodesSpy;
    let pollForRoutingProfileQueuesSpy;
    let updateAgentConfigurationSpy;

    beforeEach(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
      jest.useFakeTimers();
      jest.spyOn(connect.rootLogger, 'pushLogsDownstream');
      jest.spyOn(engine, 'handleSendLogsRequest');
      jest.spyOn(engine.conduit, 'sendDownstream');
      const wsm = makeWsm();
      wsm.init = jest.fn().mockReturnValue({ then: jest.fn((cb) => cb({ webSocketConnectionFailed: false })) });
      wsm.onDeepHeartbeatSuccess = jest.fn();
      wsm.onDeepHeartbeatFailure = jest.fn();
      wsm.onTopicFailure = jest.fn();
      wsm.deepHeartbeatHandler = jest.fn();
      jest.spyOn(connect.WebSocketManager, 'create').mockReturnValue(wsm);
      clientStub = {
        call: jest.fn(),
        _sendAPIMetrics: engine.client._sendAPIMetrics,
      };
      engine.client = clientStub;
      jest.spyOn(connect.core, 'init').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('polling cti calls', () => {
      beforeEach(() => {
        setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        hitchSpy = jest.spyOn(connect, 'hitch');
        updateAgentSpy = jest.spyOn(engine, 'updateAgent');
        pollForAgentPermissionsSpy = jest.spyOn(engine, 'pollForAgentPermissions');
        pollForAgentStatesSpy = jest.spyOn(engine, 'pollForAgentStates');
        pollForDialableCountryCodesSpy = jest.spyOn(engine, 'pollForDialableCountryCodes');
        pollForRoutingProfileQueuesSpy = jest.spyOn(engine, 'pollForRoutingProfileQueues');
        updateAgentConfigurationSpy = jest.spyOn(engine, 'updateAgentConfiguration');
        callStub = jest.fn();
        engine.client.call = callStub;
      });

      describe('.pollForAgent', () => {
        it('makes a cti call to getAgentSnapshot', () => {
          engine.pollForAgent();
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_AGENT_SNAPSHOT,
            expect.anything(),
            expect.anything()
          );
        });

        it('when response is success, it updates agent data and re-calls getAgentSnapshot with a 100ms delay', () => {
          engine.pollForAgent();
          const snapshotData = {
            snapshot: {
              snapshotTimestamp: new Date(),
              localTimesamp: new Date(),
              nextToken: 12345,
            },
          };
          yieldTo(callStub, 'success', snapshotData);

          expect(updateAgentSpy).toHaveBeenCalledTimes(1);
          expect(setTimeoutSpy).toHaveBeenCalledWith(expect.anything(), 100);
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.pollForAgent);
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          engine.pollForAgent();
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          engine.pollForAgent();
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        it('when response is other than 401 or 403 it logs the error and re-calls getAgentSnapshot with a 5 second delay', () => {
          engine.pollForAgent();
          yieldTo(callStub, 'failure');
          expect(setTimeoutSpy).toHaveBeenCalledWith(expect.anything(), 5000);
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.pollForAgent);
        });
      });

      describe('.pollForAgentConfiguration', () => {
        it('makes a cti call to getAgentConfiguration', () => {
          engine.pollForAgentConfiguration();
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_AGENT_CONFIGURATION,
            expect.anything(),
            expect.anything()
          );
        });

        describe('when response is success', () => {
          it('initiates calls passing configuration to pollForAgentPermissions, pollForAgentStates, pollForDialableCountryCodes and pollForRoutingProfileQueues', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' }, maxResults: 123 };
            const returnData = { configuration };
            engine.pollForAgentConfiguration();
            yieldTo(callStub, 'success', returnData);
            expect(pollForAgentPermissionsSpy).toHaveBeenCalledWith(configuration);
            expect(pollForAgentStatesSpy).toHaveBeenCalledWith(configuration);
            expect(pollForDialableCountryCodesSpy).toHaveBeenCalledWith(configuration);
            expect(pollForRoutingProfileQueuesSpy).toHaveBeenCalledWith(configuration);
          });

          it('re-calls getAgentConfiguration with a 30 second delay, when repeatForever param = true', () => {
            const params = { repeatForever: true };
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' }, maxResults: 123 };
            const returnData = { configuration };
            engine.pollForAgentConfiguration(params);
            yieldTo(callStub, 'success', returnData);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.anything(), 30000);
            expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.pollForAgentConfiguration, params);
          });

          it('does NOT re-call getAgentConfiguration when repeatForever param = false', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' }, maxResults: 123 };
            const returnData = { configuration };
            engine.pollForAgentConfiguration();
            yieldTo(callStub, 'success', returnData);
            expect(setTimeoutSpy).not.toHaveBeenCalled();
            expect(hitchSpy).not.toHaveBeenCalledWith(expect.anything(), engine.pollForAgentConfiguration, expect.anything());
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          engine.pollForAgentConfiguration();
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          engine.pollForAgentConfiguration();
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        describe('when response is other than 401 or 403', () => {
          it('logs the error and re-calls getAgentConfiguration with a 30 second delay when params.repeatForever=true', () => {
            const params = { repeatForever: true };
            engine.pollForAgentConfiguration(params);
            yieldTo(callStub, 'failure');
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.anything(), 30000, params);
            expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.pollForAgentConfiguration);
          });

          it('logs the error and does NOT call getAgentConfiguration when params.repeatForever=false', () => {
            engine.pollForAgentConfiguration();
            yieldTo(callStub, 'failure');
            expect(setTimeoutSpy).not.toHaveBeenCalled();
            expect(hitchSpy).not.toHaveBeenCalledWith(expect.anything(), engine.pollForAgentConfiguration);
          });
        });
      });

      describe('.pollForAgentPermissions', () => {
        it('makes a cti call to getAgentPermissions', () => {
          engine.pollForAgentPermissions();
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_AGENT_PERMISSIONS,
            expect.anything(),
            expect.anything()
          );
        });

        describe('when response is success', () => {
          it('re-calls getAgentPermissions when there is more data available (nextToken)', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { permissions: ['foo', 'bar'], nextToken: 456 };
            const params = { maxResults: 123 };
            engine.pollForAgentPermissions(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(pollForAgentPermissionsSpy.mock.calls[1]).toEqual([
              configuration,
              { permissions: returnData.permissions, nextToken: returnData.nextToken, maxResults: params.maxResults },
            ]);
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { permissions: ['foo', 'bar'] };
            const params = { maxResults: 123 };
            engine.pollForAgentPermissions(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(updateAgentConfigurationSpy).toHaveBeenCalledWith({ ...configuration, permissions: returnData.permissions });
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          engine.pollForAgentPermissions();
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          engine.pollForAgentPermissions();
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        it.skip('when response is other than 401 or 403 it logs the error', () => {
          engine.pollForAgentPermissions();
          yieldTo(callStub, 'failure');
        });
      });

      describe('.pollForAgentStates', () => {
        it('makes a cti call to getAgentStates', () => {
          const params = { nextToken: 1234, maxResults: 678 };
          engine.pollForAgentStates({}, params);
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_AGENT_STATES,
            { nextToken: params.nextToken, maxResults: params.maxResults },
            expect.anything()
          );
        });

        describe('when response is success', () => {
          it('re-calls getAgentStates when there is more data available (nextToken)', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { states: ['foo', 'bar'], nextToken: 456 };
            const params = { maxResults: 123 };
            engine.pollForAgentStates(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(pollForAgentStatesSpy.mock.calls[1]).toEqual([
              configuration,
              { states: returnData.states, nextToken: returnData.nextToken, maxResults: params.maxResults },
            ]);
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { states: ['foo', 'bar'] };
            const params = { maxResults: 123 };
            engine.pollForAgentStates(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(updateAgentConfigurationSpy).toHaveBeenCalledWith({ ...configuration, agentStates: returnData.states });
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          engine.pollForAgentStates();
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          engine.pollForAgentStates();
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        it.skip('when response is other than 401 or 403 it logs the error', () => {
          engine.pollForAgentStates();
          yieldTo(callStub, 'failure');
        });
      });

      describe('.pollForDialableCountryCodes', () => {
        it('makes a cti call to getDialableCountryCodes', () => {
          const params = { nextToken: 1234, maxResults: 678 };
          engine.pollForDialableCountryCodes({}, params);
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_DIALABLE_COUNTRY_CODES,
            { nextToken: params.nextToken, maxResults: params.maxResults },
            expect.anything()
          );
        });

        describe('when response is success', () => {
          it('re-calls getDialableCountryCodes when there is more data available (nextToken)', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { countryCodes: ['foo', 'bar'], nextToken: 456 };
            const params = { maxResults: 123 };
            engine.pollForDialableCountryCodes(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(pollForDialableCountryCodesSpy.mock.calls[1]).toEqual([
              configuration,
              { countryCodes: returnData.countryCodes, nextToken: returnData.nextToken, maxResults: params.maxResults },
            ]);
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { countryCodes: ['foo', 'bar'] };
            const params = { maxResults: 123 };
            engine.pollForDialableCountryCodes(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(updateAgentConfigurationSpy).toHaveBeenCalledWith({ ...configuration, dialableCountries: returnData.countryCodes });
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          engine.pollForDialableCountryCodes();
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          engine.pollForDialableCountryCodes();
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        it.skip('when response is other than 401 or 403 it logs the error', () => {
          engine.pollForDialableCountryCodes();
          yieldTo(callStub, 'failure');
        });
      });

      describe('.pollForRoutingProfileQueues', () => {
        it('makes a cti call to getRoutingProfileQueues', () => {
          const params = { nextToken: 1234, maxResults: 678 };
          const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
          engine.pollForRoutingProfileQueues(configuration, params);
          expect(engine.client.call).toHaveBeenCalledWith(
            connect.ClientMethods.GET_ROUTING_PROFILE_QUEUES,
            { routingProfileARN: configuration.routingProfile.routingProfileARN, nextToken: params.nextToken, maxResults: params.maxResults },
            expect.anything()
          );
        });

        describe('when response is success', () => {
          it('re-calls pollForRoutingProfileQueues when there is more data available (nextToken)', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { queues: ['queue1', 'quque2'], nextToken: 456 };
            const params = { maxResults: 123 };
            engine.pollForRoutingProfileQueues(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(pollForRoutingProfileQueuesSpy.mock.calls[1]).toEqual([
              configuration,
              { countryCodes: returnData.queues, nextToken: returnData.nextToken, maxResults: params.maxResults },
            ]);
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
            const returnData = { countryCodes: ['foo', 'bar'], queues: ['queue1', 'quque2'] };
            const params = { maxResults: 123 };
            engine.pollForRoutingProfileQueues(configuration, params);
            yieldTo(callStub, 'success', returnData);
            expect(updateAgentConfigurationSpy).toHaveBeenCalledWith({
              ...configuration,
              routingProfile: { ...configuration.routingProfile, queues: returnData.queues },
            });
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
          engine.pollForRoutingProfileQueues(configuration, {});
          yieldTo(callStub, 'authFailure');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handlePollingAuthFail);
        });

        it('when response is 403, it calls the access denied handler', () => {
          const configuration = { lorem: 'ipsum', routingProfile: { routingProfileARN: 'someArn' } };
          engine.pollForRoutingProfileQueues(configuration, {});
          yieldTo(callStub, 'accessDenied');
          expect(hitchSpy).toHaveBeenCalledWith(expect.anything(), engine.handleAccessDenied);
        });

        it.skip('when response is other than 401 or 403 it logs the error', () => {
          engine.pollForRoutingProfileQueues();
          yieldTo(callStub, 'failure');
        });
      });
    });

    describe('cti call handlers', () => {
      let sendDownstreamSpy;
      beforeEach(() => {
        sendDownstreamSpy = jest.fn();
        engine.conduit = { sendDownstream: sendDownstreamSpy };
      });

      describe('.handlePollingAuthFail', () => {
        it('emits a CTI_AUTHORIZE_RETRIES_EXHAUSTED event', () => {
          engine.handlePollingAuthFail();
          expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
          expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED);
        });
      });

      describe('.handleAuthFail', () => {
        it('emits an AUTH_FAIL event with no data when none provided', () => {
          engine.handleAuthFail();
          expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
          expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.AUTH_FAIL);
        });

        it('emits an AUTH_FAIL event with data when provided', () => {
          const data = { lorem: 'ipsum' };
          engine.handleAuthFail(data);
          expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
          expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.AUTH_FAIL, data);
        });
      });

      describe('.handleAccessDenied', () => {
        it('emits an ACCESS_DENIED event', () => {
          engine.handleAccessDenied();
          expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
          expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.ACCESS_DENIED);
        });
      });
    });
  });

  // Additional coverage for ClientEngine methods not exercised by the original
  // worker.spec.js: request/response handlers, agent snapshot construction,
  // websocket URL retrieval, log flushing, and auth token refresh.
  describe('ClientEngine methods (extra coverage)', () => {
    let engine;
    let sendDownstreamSpy;

    beforeEach(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
      sendDownstreamSpy = jest.fn();
      engine.conduit = { sendDownstream: sendDownstreamSpy };
    });

    describe('handleAPIRequest', () => {
      let portConduit;
      let request;

      beforeEach(() => {
        portConduit = { sendDownstream: jest.fn() };
        request = { method: 'someMethod', params: { foo: 'bar' } };
        engine.client = { call: jest.fn() };
      });

      it('sends an API_RESPONSE downstream on success', () => {
        engine.handleAPIRequest(portConduit, request);
        yieldTo(engine.client.call, 'success', { result: 'ok' });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(
          connect.EventType.API_RESPONSE,
          expect.objectContaining({ event: connect.EventType.API_RESPONSE })
        );
      });

      it('sends an API_RESPONSE downstream on failure and logs the error', () => {
        engine.handleAPIRequest(portConduit, request);
        yieldTo(engine.client.call, 'failure', { code: 'BadThing' }, { data: 1 });
        expect(portConduit.sendDownstream).toHaveBeenCalledWith(
          connect.EventType.API_RESPONSE,
          expect.objectContaining({ event: connect.EventType.API_RESPONSE })
        );
      });
    });

    describe('filterAuthToken', () => {
      it('strips the authentication field from params but keeps other fields', () => {
        const request = {
          method: 'someMethod',
          params: { authentication: 'secret', foo: 'bar' },
        };
        const filtered = engine.filterAuthToken(request);
        expect(filtered).toEqual({ method: 'someMethod', params: { foo: 'bar' } });
        expect(filtered.params.authentication).toBeUndefined();
      });
    });

    describe('updateAgentConfiguration', () => {
      it('sets agent configuration and calls updateAgent when all config data is present', () => {
        const updateAgentSpy = jest.spyOn(engine, 'updateAgent').mockImplementation(() => {});
        const configuration = {
          permissions: ['p'],
          dialableCountries: ['US'],
          agentStates: ['available'],
          routingProfile: { queues: ['q1'] },
        };
        engine.updateAgentConfiguration(configuration);
        expect(engine.agent.configuration).toBe(configuration);
        expect(updateAgentSpy).toHaveBeenCalledTimes(1);
      });

      it('does not update when configuration is incomplete', () => {
        const updateAgentSpy = jest.spyOn(engine, 'updateAgent').mockImplementation(() => {});
        engine.updateAgentConfiguration({ permissions: ['p'], routingProfile: {} });
        expect(updateAgentSpy).not.toHaveBeenCalled();
      });
    });

    describe('updateAgent', () => {
      it('waits when there is no agent', () => {
        engine.agent = null;
        engine.updateAgent();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(connect.AgentEvents.UPDATE, expect.anything());
      });

      it('waits when there is no snapshot', () => {
        engine.agent = {};
        engine.updateAgent();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(connect.AgentEvents.UPDATE, expect.anything());
      });

      it('waits when there is no configuration', () => {
        engine.agent = { snapshot: {} };
        engine.updateAgent();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(connect.AgentEvents.UPDATE, expect.anything());
      });

      it('emits an AgentEvents.UPDATE with aliased ids when fully constructed', () => {
        engine.agent = {
          state: { type: 'available' },
          snapshot: {
            contacts: [
              {
                state: { timestamp: new Date(1) },
                connections: [{ endpoint: 'ep1' }],
                queue: { queueARN: 'qARN' },
              },
            ],
          },
          configuration: {
            routingProfile: {
              defaultOutboundQueue: { queueARN: 'defARN' },
              queues: [{ queueARN: 'q1ARN' }],
              routingProfileARN: 'rpARN',
            },
          },
        };
        engine.updateAgent();

        const contact = engine.agent.snapshot.contacts[0];
        expect(contact.status).toBe(contact.state);
        expect(contact.connections[0].address).toBe('ep1');
        expect(contact.queue.queueId).toBe('qARN');
        expect(engine.agent.configuration.routingProfile.defaultOutboundQueue.queueId).toBe('defARN');
        expect(engine.agent.configuration.routingProfile.queues[0].queueId).toBe('q1ARN');
        expect(engine.agent.configuration.routingProfile.routingProfileId).toBe('rpARN');
        expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.AgentEvents.UPDATE, engine.agent);
      });

      it('filters contacts and forces offline when suppressed and forceOffline set', () => {
        engine.suppress = true;
        engine.forceOffline = true;
        engine.agent = {
          state: { type: 'offline' },
          snapshot: {
            contacts: [
              { state: { type: connect.ContactStateType.CONNECTED, timestamp: new Date(1) }, connections: [], queue: undefined },
              { state: { type: 'routable', timestamp: new Date(2) }, connections: [], queue: undefined },
            ],
          },
          configuration: {
            routingProfile: {
              defaultOutboundQueue: { queueARN: 'defARN' },
              queues: [],
              routingProfileARN: 'rpARN',
            },
          },
        };
        engine.updateAgent();
        // only the CONNECTED contact survives the suppression filter
        expect(engine.agent.snapshot.contacts).toHaveLength(1);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.DisasterRecoveryEvents.FORCE_OFFLINE);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.AgentEvents.UPDATE, engine.agent);
      });
    });

    describe('getWebSocketUrl', () => {
      beforeEach(() => {
        jest.spyOn(connect.core, 'getClient').mockReturnValue({ call: jest.fn() });
      });

      it('resolves with data on success', async () => {
        const client = connect.core.getClient();
        const promise = engine.getWebSocketUrl();
        yieldTo(client.call, 'success', { url: 'wss://example' });
        await expect(promise).resolves.toEqual({ url: 'wss://example' });
      });

      it('rejects on failure', async () => {
        const client = connect.core.getClient();
        const promise = engine.getWebSocketUrl();
        yieldTo(client.call, 'failure', { code: 'err' }, {});
        await expect(promise).rejects.toEqual(expect.objectContaining({ reason: 'getWebSocketUrl failed' }));
      });

      it('rejects and calls handleAuthFail on authFailure', async () => {
        const handleAuthFailSpy = jest.spyOn(engine, 'handleAuthFail').mockImplementation(() => {});
        const client = connect.core.getClient();
        const promise = engine.getWebSocketUrl();
        yieldTo(client.call, 'authFailure');
        await expect(promise).rejects.toThrow();
        expect(handleAuthFailSpy).toHaveBeenCalled();
      });

      it('rejects and calls handleAccessDenied on accessDenied', async () => {
        const handleAccessDeniedSpy = jest.spyOn(engine, 'handleAccessDenied').mockImplementation(() => {});
        const client = connect.core.getClient();
        const promise = engine.getWebSocketUrl();
        yieldTo(client.call, 'accessDenied');
        await expect(promise).rejects.toThrow();
        expect(handleAccessDeniedSpy).toHaveBeenCalled();
      });
    });

    describe('handleSendLogsRequest', () => {
      it('flushes the logs buffer into a SEND_CLIENT_LOGS call and empties the buffer', () => {
        engine.client = { call: jest.fn() };
        engine.logsBuffer = [
          { time: 't1', component: 'c1', text: 'm1' },
          { time: 't2', component: 'c2', text: 'm2' },
        ];
        engine.handleSendLogsRequest();
        expect(engine.logsBuffer).toHaveLength(0);
        expect(engine.client.call).toHaveBeenCalledWith(
          connect.ClientMethods.SEND_CLIENT_LOGS,
          { logEvents: [
            { timestamp: 't1', component: 'c1', message: 'm1' },
            { timestamp: 't2', component: 'c2', message: 'm2' },
          ] },
          expect.anything()
        );
      });
    });

    describe('checkAuthToken', () => {
      it('refreshes the token when it expires within 30 minutes', () => {
        const backoffSpy = jest.spyOn(connect, 'backoff').mockImplementation(() => {});
        engine.initData = { authTokenExpiration: new Date(Date.now() + 60 * 1000).toISOString() };
        engine.checkAuthToken();
        expect(backoffSpy).toHaveBeenCalled();
      });

      it('does not refresh when the token is far from expiry', () => {
        const backoffSpy = jest.spyOn(connect, 'backoff').mockImplementation(() => {});
        engine.initData = { authTokenExpiration: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
        engine.checkAuthToken();
        expect(backoffSpy).not.toHaveBeenCalled();
      });
    });

    describe('authorize', () => {
      it('updates init data and re-inits clients on success', async () => {
        const expiration = new Date(Date.now() + 3600 * 1000);
        jest.spyOn(connect.core, 'authorize').mockResolvedValue({ accessToken: 'newToken', expiration: expiration.toISOString() });
        const initClientSpy = jest.spyOn(connect.core, 'initClient').mockImplementation(() => {});
        const initAgentAppClientSpy = jest.spyOn(connect.core, 'initAgentAppClient').mockImplementation(() => {});
        engine.initData = { authorizeEndpoint: '/authorize' };
        const callbacks = { success: jest.fn(), failure: jest.fn() };

        await engine.authorize(callbacks);
        await flushPromises();

        expect(engine.initData.authToken).toBe('newToken');
        expect(initClientSpy).toHaveBeenCalled();
        expect(initAgentAppClientSpy).toHaveBeenCalled();
        expect(callbacks.success).toHaveBeenCalled();
      });

      it('calls handleAuthFail on a 401 failure', async () => {
        jest.spyOn(connect.core, 'authorize').mockRejectedValue({ status: 401 });
        const handleAuthFailSpy = jest.spyOn(engine, 'handleAuthFail').mockImplementation(() => {});
        engine.initData = { authorizeEndpoint: '/authorize' };
        const callbacks = { success: jest.fn(), failure: jest.fn() };

        await engine.authorize(callbacks);
        await flushPromises();

        expect(handleAuthFailSpy).toHaveBeenCalled();
        expect(callbacks.failure).not.toHaveBeenCalled();
      });

      it('calls the failure callback on a non-401 failure', async () => {
        jest.spyOn(connect.core, 'authorize').mockRejectedValue({ status: 500 });
        engine.initData = { authorizeEndpoint: '/authorize' };
        const callbacks = { success: jest.fn(), failure: jest.fn() };

        await engine.authorize(callbacks);
        await flushPromises();

        expect(callbacks.failure).toHaveBeenCalled();
      });
    });

    describe('MasterTopicCoordinator via handleMasterRequest', () => {
      it('throws on an unknown master method', () => {
        const portConduit = { sendDownstream: jest.fn() };
        const request = { method: 'NOT_A_METHOD', params: { topic: connect.MasterTopics.SOFTPHONE } };
        expect(() => engine.handleMasterRequest(portConduit, 'portId', request)).toThrow();
      });
    });

    describe('getPresignedDiscoveryUrl', () => {
      beforeEach(() => {
        engine.client = { call: jest.fn() };
        engine.thisArn = 'arn:this';
      });

      it('resolves with the presigned url on success', async () => {
        const promise = engine.getPresignedDiscoveryUrl();
        yieldTo(engine.client.call, 'success', { agentDiscoveryTransport: { presignedUrl: 'https://signed' } });
        await expect(promise).resolves.toBe('https://signed');
      });

      it('rejects when success data is empty/invalid', async () => {
        const promise = engine.getPresignedDiscoveryUrl();
        yieldTo(engine.client.call, 'success', {});
        await expect(promise).rejects.toThrow('getPresignedDiscoveryUrl received empty/invalid data');
      });

      it('rejects on failure', async () => {
        const promise = engine.getPresignedDiscoveryUrl();
        yieldTo(engine.client.call, 'failure', new Error('boom'), {});
        await expect(promise).rejects.toThrow('Failed to get presigned URL');
      });

      it('rejects and calls handleAuthFail on authFailure', async () => {
        const handleAuthFailSpy = jest.spyOn(engine, 'handleAuthFail').mockImplementation(() => {});
        const promise = engine.getPresignedDiscoveryUrl();
        yieldTo(engine.client.call, 'authFailure');
        await expect(promise).rejects.toThrow();
        expect(handleAuthFailSpy).toHaveBeenCalled();
      });

      it('rejects and calls handleAccessDenied on accessDenied', async () => {
        const handleAccessDeniedSpy = jest.spyOn(engine, 'handleAccessDenied').mockImplementation(() => {});
        const promise = engine.getPresignedDiscoveryUrl();
        yieldTo(engine.client.call, 'accessDenied');
        await expect(promise).rejects.toThrow();
        expect(handleAccessDeniedSpy).toHaveBeenCalled();
      });
    });

    describe('pollForActiveRegion', () => {
      beforeEach(() => {
        engine.client = { _recordAPILatency: jest.fn() };
        engine.thisArn = 'arn:this';
        engine.otherArn = 'arn:other';
        engine.drPollingUrl = 'https://dr-polling';
      });

      it('throws a StateError when DR polling is not initialized', () => {
        engine.drPollingUrl = null;
        expect(() => engine.pollForActiveRegion(true, true)).toThrow(connect.StateError);
      });

      it('sends a FAILOVER event when this instance is the active primary on first CCP poll', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({
          TerminateActiveContacts: false,
          InstanceArn: 'arn:this',
        });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          { nextActiveArn: 'arn:this' }
        );
      });

      it('forces this instance offline when the other instance is active', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({
          TerminateActiveContacts: true,
          InstanceArn: 'arn:other',
        });
        await engine.pollForActiveRegion(true, true);
        await flushPromises();
        expect(engine.suppress).toBe(true);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FORCE_OFFLINE,
          expect.objectContaining({ nextActiveArn: 'arn:other' })
        );
      });

      it('returns without action when TerminateActiveContacts is not a boolean', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({ InstanceArn: 'arn:this' });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          expect.anything()
        );
      });

      it('returns without action when the response has no InstanceArn', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({ TerminateActiveContacts: false });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          expect.anything()
        );
      });

      it('fetches a new polling URL and retries when the poll is unauthorized', async () => {
        jest.spyOn(engine, 'getPresignedDiscoveryUrl').mockResolvedValue('https://dr-polling-new');
        jest.spyOn(connect, 'fetchWithTimeout')
          .mockRejectedValueOnce({ status: connect.HTTP_STATUS_CODES.ACCESS_DENIED })
          .mockResolvedValueOnce({ TerminateActiveContacts: false, InstanceArn: 'arn:this' });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(engine.getPresignedDiscoveryUrl).toHaveBeenCalled();
        expect(engine.drPollingUrl).toBe('https://dr-polling-new');
      });

      it('logs an error and rejects when the poll returns an unexpected status', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockRejectedValue({ status: 500 });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(engine.client._recordAPILatency).toHaveBeenCalled();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          expect.anything()
        );
      });

      it('records a -1 latency when the poll times out with no status', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockRejectedValue({});
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(engine.client._recordAPILatency).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          { statusCode: -1 }
        );
      });

      it('queues a soft failover with a UI FAILOVER signal for a new window when the other instance is active', async () => {
        engine.suppress = false;
        engine.pendingFailover = false;
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({
          TerminateActiveContacts: false,
          InstanceArn: 'arn:other',
        });
        // isFirstPollForWorker=false, isFirstPollForCCP=true triggers the soft-failover branch
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(engine.pendingFailover).toBe(true);
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          { nextActiveArn: 'arn:this' }
        );
        expect(sendDownstreamSpy).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FORCE_OFFLINE,
          expect.objectContaining({ softFailover: true, nextActiveArn: 'arn:other' })
        );
      });

      it('logs an error when the active instance is in neither this nor the other region', async () => {
        jest.spyOn(connect, 'fetchWithTimeout').mockResolvedValue({
          TerminateActiveContacts: false,
          InstanceArn: 'arn:unknown',
        });
        await engine.pollForActiveRegion(true, false);
        await flushPromises();
        expect(sendDownstreamSpy).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FORCE_OFFLINE,
          expect.anything()
        );
      });
    });
  });

  // Coverage for the downstream event handlers wired up in the ClientEngine
  // constructor (DR suppress/force-offline/init-polling and log buffering).
  describe('ClientEngine downstream handlers', () => {
    let engine;

    beforeEach(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
      jest.spyOn(engine.conduit, 'sendDownstream');
    });

    function trigger(event, data) {
      engine.conduit.downstreamBus.trigger(event, data);
    }

    describe('SEND_LOGS', () => {
      it('flushes to CTI when the buffer exceeds the cap', () => {
        jest.spyOn(engine, 'handleSendLogsRequest').mockImplementation(() => {});
        engine.logsBuffer = [];
        const logEntry = new connect.LogEntry('test', connect.LogLevel.LOG, 'msg', 'id');
        const logs = new Array(401).fill(logEntry);
        trigger(connect.EventType.SEND_LOGS, logs);
        expect(engine.handleSendLogsRequest).toHaveBeenCalled();
      });
    });

    describe('DisasterRecoveryEvents.SUPPRESS', () => {
      it('sets suppress true and signals a non-primary failover', () => {
        trigger(connect.DisasterRecoveryEvents.SUPPRESS, { suppress: true });
        expect(engine.suppress).toBe(true);
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          { isPrimary: false }
        );
      });

      it('clears forceOffline when unsuppressing', () => {
        engine.forceOffline = true;
        trigger(connect.DisasterRecoveryEvents.SUPPRESS, { suppress: false });
        expect(engine.suppress).toBe(false);
        expect(engine.forceOffline).toBe(false);
      });

      it('does not signal failover when shouldSendFailoverDownstream is false', () => {
        trigger(connect.DisasterRecoveryEvents.SUPPRESS, { suppress: true, shouldSendFailoverDownstream: false });
        expect(engine.conduit.sendDownstream).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          expect.anything()
        );
      });
    });

    describe('DisasterRecoveryEvents.FORCE_OFFLINE', () => {
      it('signals a failover and sets forceOffline when not already offline', () => {
        engine.forceOffline = false;
        trigger(connect.DisasterRecoveryEvents.FORCE_OFFLINE, { offline: true, nextActiveArn: 'arn:next' });
        expect(engine.conduit.sendDownstream).toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          { isPrimary: false, nextActiveArn: 'arn:next' }
        );
        expect(engine.forceOffline).toBe(true);
      });

      it('does not re-signal failover when already forced offline (retry)', () => {
        engine.forceOffline = true;
        trigger(connect.DisasterRecoveryEvents.FORCE_OFFLINE, { offline: true, nextActiveArn: 'arn:next' });
        expect(engine.conduit.sendDownstream).not.toHaveBeenCalledWith(
          connect.DisasterRecoveryEvents.FAILOVER,
          expect.anything()
        );
      });
    });

    describe('DisasterRecoveryEvents.INIT_DR_POLLING', () => {
      it('adds this CCP to existing polling when a polling URL is already set', () => {
        engine.drPollingUrl = 'https://existing';
        const pollSpy = jest.spyOn(engine, 'pollForActiveRegion').mockImplementation(() => {});
        trigger(connect.DisasterRecoveryEvents.INIT_DR_POLLING, { instanceArn: 'arn:this' });
        expect(pollSpy).toHaveBeenCalledWith(true, false);
      });

      it('initializes polling by fetching a presigned URL when none is set', async () => {
        engine.drPollingUrl = null;
        jest.spyOn(engine, 'getPresignedDiscoveryUrl').mockResolvedValue('https://new-url');
        const pollSpy = jest.spyOn(engine, 'pollForActiveRegion').mockImplementation(() => {});
        trigger(connect.DisasterRecoveryEvents.INIT_DR_POLLING, { instanceArn: 'arn:this', otherArn: 'arn:other' });
        await flushPromises();
        expect(engine.drPollingUrl).toBe('https://new-url');
        expect(pollSpy).toHaveBeenCalledWith(true, true);
      });

      it('suppresses this worker when the presigned URL fetch fails', async () => {
        engine.drPollingUrl = null;
        jest.spyOn(engine, 'getPresignedDiscoveryUrl').mockRejectedValue(new Error('no url'));
        trigger(connect.DisasterRecoveryEvents.INIT_DR_POLLING, { instanceArn: 'arn:this', otherArn: 'arn:other' });
        await flushPromises();
        expect(engine.suppress).toBe(true);
      });
    });
  });

  describe('WorkerClient._callImpl', () => {
    let engine;
    let workerClient;

    beforeEach(() => {
      connect.worker.main();
      engine = connect.worker.clientEngine;
      workerClient = engine.client; // the real WorkerClient instance
    });

    it('routes AgentApp methods to the agent app client and records latency on success', () => {
      const innerCall = jest.fn();
      jest.spyOn(connect.core, 'getAgentAppClient').mockReturnValue({ _callImpl: innerCall });
      const recordSpy = jest.spyOn(workerClient, '_recordAPILatency');
      const callbacks = { success: jest.fn(), failure: jest.fn() };

      const method = connect.AgentAppClientMethods.GET_CONTACT;
      workerClient._callImpl(method, { a: 1 }, callbacks);
      yieldTo(innerCall, 'success', { ok: true });

      expect(connect.core.getAgentAppClient).toHaveBeenCalled();
      expect(recordSpy).toHaveBeenCalledWith(method, expect.any(Number), { a: 1 });
      expect(callbacks.success).toHaveBeenCalledWith({ ok: true });
    });

    it('routes AgentApp method failures through _recordAPILatency and the failure callback', () => {
      const innerCall = jest.fn();
      jest.spyOn(connect.core, 'getAgentAppClient').mockReturnValue({ _callImpl: innerCall });
      const callbacks = { success: jest.fn(), failure: jest.fn() };

      const method = connect.AgentAppClientMethods.GET_CONTACT;
      workerClient._callImpl(method, {}, callbacks);
      yieldTo(innerCall, 'failure', new Error('nope'));

      expect(callbacks.failure).toHaveBeenCalled();
    });

    it('routes TaskTemplates methods to the task templates client', () => {
      const innerCall = jest.fn();
      jest.spyOn(connect.core, 'getTaskTemplatesClient').mockReturnValue({ _callImpl: innerCall });
      const callbacks = { success: jest.fn(), failure: jest.fn() };

      const method = connect.TaskTemplatesClientMethods.GET_TASK_TEMPLATE;
      workerClient._callImpl(method, {}, callbacks);
      yieldTo(innerCall, 'success', { template: 1 });

      expect(connect.core.getTaskTemplatesClient).toHaveBeenCalled();
      expect(callbacks.success).toHaveBeenCalledWith({ template: 1 });
    });

    it('routes standard methods to the default client and handles all callback types', () => {
      const innerCall = jest.fn();
      jest.spyOn(connect.core, 'getClient').mockReturnValue({ _callImpl: innerCall });
      const callbacks = {
        success: jest.fn(),
        failure: jest.fn(),
        authFailure: jest.fn(),
        accessDenied: jest.fn(),
      };

      workerClient._callImpl(connect.ClientMethods.GET_AGENT_SNAPSHOT, {}, callbacks);
      yieldTo(innerCall, 'success', { data: 1 }, { attr: 2 });
      expect(callbacks.success).toHaveBeenCalledWith({ data: 1 }, { attr: 2 });

      workerClient._callImpl(connect.ClientMethods.GET_AGENT_SNAPSHOT, {}, callbacks);
      yieldTo(innerCall, 'authFailure', {}, {});
      expect(callbacks.authFailure).toHaveBeenCalled();

      workerClient._callImpl(connect.ClientMethods.GET_AGENT_SNAPSHOT, {}, callbacks);
      yieldTo(innerCall, 'accessDenied', {}, {});
      expect(callbacks.accessDenied).toHaveBeenCalled();
    });
  });

  describe('TODO', () => {
    it.todo('include test case for auth token polling');
  });
});
