require("../unit/test-setup.js");
const { assert } = require("chai");

describe('Worker', function () {
  var LOG_BUFFER_CAP_SIZE = 400;
  var sandbox = sinon.createSandbox();

  describe('#connect.worker.main()', function () {

    before(function () {
      connect.worker.main();
      this.clock = sinon.useFakeTimers();
      this.initData = {
        authToken: "fake-token",
        authTokenExpiration: new Date(),
        endpoint: "/connect/api",
        refreshToken: "fake-refresh-token",
        region: "us-east-1",
        authorizeEndpoint: "/connect/authorize"
      };
      sandbox.spy(connect.rootLogger, "pushLogsDownstream");
      sandbox.spy(connect.worker.clientEngine, "handleSendLogsRequest");
      sandbox.spy(connect.worker.clientEngine.conduit, "sendDownstream");
      this.wsm = {
        init: sandbox.stub().resolves({ webSocketConnectionFailed: false }),
        onInitFailure: sandbox.stub(),
        onConnectionOpen: sandbox.stub(),
        onConnectionClose: sandbox.stub(),
        onConnectionGain: sandbox.stub(),
        onConnectionLost: sandbox.stub(),
        onSubscriptionUpdate: sandbox.stub(),
        onSubscriptionFailure: sandbox.stub(),
        onAllMessage: sandbox.stub(),
        subscribeTopics: sandbox.stub(),
        sendMessage: sandbox.stub(),
      };
      sandbox.stub(connect.WebSocketManager, "create").returns(this.wsm);
      this.client = { 
        call: sandbox.spy(),
        _sendAPIMetrics: connect.worker.clientEngine.client._sendAPIMetrics,
      };
      connect.worker.clientEngine.client = this.client;
      connect.core.init = sandbox.stub();
    });

    after(function () {
      this.clock.restore();
      sandbox.restore();
    });

    it("worker initialization", function () {
      expect(connect.worker).to.have.property('clientEngine');
    });

    describe("reports master logs to the client", function () {
      var logEntry = new connect.LogEntry("test", connect.LogLevel.LOG, "some log", "some-logger-id");

      it('does not send logs to CTI service when logsBuffer does not exceed cap size', function () {
        var logs = [];
        for (var i = 0; i < LOG_BUFFER_CAP_SIZE; i++) {
          logs.push(logEntry);
        }
        connect.worker.clientEngine.conduit.downstreamBus.trigger(connect.EventType.SEND_LOGS, logs);
        assert.isTrue(connect.worker.clientEngine.handleSendLogsRequest.notCalled);
        assert.isTrue(connect.rootLogger.pushLogsDownstream.calledWith(logs));
        assert.lengthOf(connect.worker.clientEngine.logsBuffer, LOG_BUFFER_CAP_SIZE);
      });
  
      it('sends logs to CTI service when logsBuffer exceeds cap size', function () {
        connect.worker.clientEngine.conduit.downstreamBus.trigger(connect.EventType.SEND_LOGS, [logEntry]);
        assert.isTrue(connect.worker.clientEngine.handleSendLogsRequest.calledOnce);
        assert.isTrue(connect.rootLogger.pushLogsDownstream.calledWith([logEntry]));
        assert.lengthOf(connect.worker.clientEngine.logsBuffer, 0);
      });
    });

    it("creates a webSocketManager if it doesn't exist", function () {
      connect.worker.clientEngine.conduit.downstreamBus.trigger(connect.EventType.CONFIGURE, this.initData);
      var newInitData = connect.merge({}, this.initData, { authToken: "other-fake-token" });
      connect.worker.clientEngine.conduit.downstreamBus.trigger(connect.EventType.CONFIGURE, newInitData);
      assert.isTrue(connect.WebSocketManager.create.calledOnce);
    });

    it("polls for agent snapshot and config", function () {
      assert.isTrue(this.client.call.calledWith(connect.ClientMethods.GET_AGENT_SNAPSHOT));
      assert.isTrue(this.client.call.calledWith(connect.ClientMethods.GET_AGENT_CONFIGURATION));
    });

    describe("handleMasterRequest", function () {
      it("sets master topic", function () {
        var portConduit = { sendDownstream: sinon.spy() };
        var request = { method: connect.MasterMethods.BECOME_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        connect.worker.clientEngine.handleMasterRequest(
          portConduit,
          "portId_A", 
          request
        );
        var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: "portId_A",
          takeOver: false,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        assert.isTrue(portConduit.sendDownstream.calledWith(expected.event, expected));
        assert.isTrue(connect.worker.clientEngine.conduit.sendDownstream.neverCalledWith(expected.event, expected));
      });
  
      it("takes over master topic", function () {
        var portConduit = { sendDownstream: sinon.spy() };
        var request = { method: connect.MasterMethods.BECOME_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        connect.worker.clientEngine.handleMasterRequest(
          portConduit,
          "portId_B", 
          request
        );
        var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: "portId_B",
          takeOver: true,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        assert.isTrue(portConduit.sendDownstream.calledWith(expected.event, expected));
        assert.isTrue(connect.worker.clientEngine.conduit.sendDownstream.calledWith(expected.event, expected));
      });
  
      it("returns isMaster as false in MASTER_RESPONSE if not master topic", function () {
        var portConduit = { sendDownstream: sinon.spy() };
        var request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
        connect.worker.clientEngine.handleMasterRequest(
          portConduit,
          "portId_C",
          request
        );
        var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: "portId_B",
          isMaster: false,
          topic: connect.MasterTopics.SOFTPHONE,
        });
        assert.isTrue(portConduit.sendDownstream.calledWith(expected.event, expected));
      });

      it("becomes master if there's no master tab when checking it", function () {
        var portConduit = { sendDownstream: sinon.spy() };
        var request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.RINGTONE } };
        connect.worker.clientEngine.handleMasterRequest(
          portConduit,
          "portId_D",
          request
        );
        var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: "portId_D",
          isMaster: true,
          topic: connect.MasterTopics.RINGTONE,
        });
        assert.isTrue(portConduit.sendDownstream.calledWith(expected.event, expected));
      });

      it("shouldn't become master if there's no master tab when checking it with a shouldNotBecomeMasterIfNone flag", function () {
        var portConduit = { sendDownstream: sinon.spy() };
        var request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.METRICS, shouldNotBecomeMasterIfNone: true } };
        connect.worker.clientEngine.handleMasterRequest(
          portConduit,
          "portId_E",
          request
        );
        var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: null,
          isMaster: false,
          topic: connect.MasterTopics.METRICS,
        });
        assert.isTrue(portConduit.sendDownstream.calledWith(expected.event, expected));
      });
    });
    describe('handleTabIdEvent', function() {
      let stream, stream2, stream3;
      let fakeConduit = {sendDownstream: sandbox.fake()};
      before(() => {
        sandbox.reset();
        stream = { getId: () => "fakeStream"};
        stream2 = { getId: () => "fakeStream2"};
        stream3 = { getId: () => "fakeStream3"};
      });
      it('does not emit an event when there is a bad streamMapByTabId', function() {
        connect.worker.clientEngine.streamMapByTabId = null;
        connect.worker.clientEngine.handleTabIdEvent(stream, { tabId: 'tabId1' }); // should not throw an exception
        sinon.assert.notCalled(connect.worker.clientEngine.conduit.sendDownstream);
      });
      it('emits an update connected ccps event with the right data object when a new tabId is communicated by a stream', function () {
        connect.worker.clientEngine.streamMapByTabId = {};
        connect.worker.clientEngine.portConduitMap = {"fakeStream": fakeConduit};
        connect.worker.clientEngine.handleTabIdEvent(stream, { tabId: 'tabId1' });
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId1'], ["fakeStream"]);
        sinon.assert.calledWith(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 1, tabId: 'tabId1', streamsTabsAcrossBrowser: 1, 'tabId1': { length: 1}});

        connect.worker.clientEngine.portConduitMap = {"fakeStream": fakeConduit, "fakeStream2": fakeConduit};
        connect.worker.clientEngine.handleTabIdEvent(stream2, { tabId: 'tabId1' });
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId1'], ["fakeStream", "fakeStream2"]);
        sinon.assert.calledWith(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 2, tabId: 'tabId1', streamsTabsAcrossBrowser: 1, 'tabId1': { length: 2}});

        connect.worker.clientEngine.portConduitMap = {"fakeStream": fakeConduit, "fakeStream2": fakeConduit, "fakeStream3": fakeConduit};
        connect.worker.clientEngine.handleTabIdEvent(stream3, { tabId: 'tabId2'});
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId2'], ["fakeStream3"]);
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId1'], ["fakeStream", "fakeStream2"]);
        sinon.assert.calledWith(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 3, tabId: 'tabId2', streamsTabsAcrossBrowser: 2, "tabId2": { length: 1}});

        connect.worker.clientEngine.handleTabIdEvent(stream3, { tabId: 'tabId2'});
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId2'], ["fakeStream3"]);
        assert.deepEqual(connect.worker.clientEngine.streamMapByTabId['tabId1'], ["fakeStream", "fakeStream2"]);

        sinon.assert.calledThrice(connect.worker.clientEngine.conduit.sendDownstream);
        connect.worker.clientEngine.portConduitMap = {};
      });
    });
    describe('handleCloseEvent', function () {
      let stream, stream2, stream3;
      let fakeConduit = {sendDownstream: sandbox.fake()};
      before(() => {
        stream = { getId: () => "fakeStream" };
        stream2 = { getId: () => "fakeStream2" };
        sandbox.reset();
      });
      after(() => {
        connect.worker.clientEngine.portConduitMap = {};
        connect.worker.clientEngine.streamMapByTabId = {};
      })
      it('emits a data object with the UPDATE_CONNECTED_CCPS event to notify CCP of the change in connected ccps, without tab-specific info if the table does not contain this tab id', function() {
        connect.worker.clientEngine.portConduitMap = {"fakeStream": fakeConduit};
        connect.worker.clientEngine.streamMapByTabId = {};
        connect.worker.clientEngine.handleCloseEvent(stream);
        sinon.assert.calledOnceWithExactly(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 0, streamsTabsAcrossBrowser: 0});
      });
      it('removes the stream from this tab\'s list and emits a data object with the UPDATE_CONNECTED_CCPS event to notify CCP of that change', function() {
        let streamHandleCloseEvent = connect.hitch(connect.worker.clientEngine, connect.worker.clientEngine.handleCloseEvent, stream);
        connect.worker.clientEngine.portConduitMap = {"fakeStream1": fakeConduit, "fakeStream": fakeConduit, "fakeStream2": fakeConduit};
        connect.worker.clientEngine.streamMapByTabId = {'tabId1': ["fakeStream", "fakeStream2"]};
        streamHandleCloseEvent();
        assert.isTrue(connect.worker.clientEngine.streamMapByTabId['tabId1'].length === 1);
        sinon.assert.calledTwice(connect.worker.clientEngine.conduit.sendDownstream);
        sinon.assert.calledWith(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 2, 'tabId1': { length: 1 }, tabId: 'tabId1', streamsTabsAcrossBrowser: 1});
        let stream2HandleCloseEvent = connect.hitch(connect.worker.clientEngine, connect.worker.clientEngine.handleCloseEvent, stream2);
        stream2HandleCloseEvent();
        sinon.assert.calledWith(connect.worker.clientEngine.conduit.sendDownstream, connect.EventType.UPDATE_CONNECTED_CCPS, {length: 1, 'tabId1': { length: 0 }, tabId: 'tabId1', streamsTabsAcrossBrowser: 0});
      });
    });

    describe('global.onconnect()', function () {
      var dummyEvent;
      beforeEach(function() {
        sandbox.reset();
        dummyEvent = {
          ports: [
            {
              addEventListener: sandbox.stub(),
              postMessage: sandbox.stub(),
              start: sandbox.spy()
            }
          ]
        };
      });
      it('global.onconnect() exists', function () {
        expect(global).to.have.property('onconnect');
      });
      it('UPDATE_CONNECTED_CCPS is called with an incremented value', function () {
        global.onconnect(dummyEvent);
        assert.isTrue(connect.worker.clientEngine.conduit.sendDownstream.calledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 }));
        global.onconnect(dummyEvent);
        assert.isTrue(connect.worker.clientEngine.conduit.sendDownstream.calledWith(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 2 }));
      });
      it('sends ACK event to the downstream with the port id', function () {
        global.onconnect(dummyEvent);
        expect(connect.worker.clientEngine.conduit.sendDownstream.calledWithMatch(connect.EventType.ACKNOWLEDGE, sinon.match.string));
      });
    });
  });

  describe('WorkerClient', () => {
    let portConduit;
    let sendDownstreamSpy;
    beforeEach(() => {
      sendDownstreamSpy = sandbox.spy();
      portConduit = { sendDownstream: sendDownstreamSpy };
      connect.worker.clientEngine.client.conduit = portConduit;
    });
    afterEach(() => {
      sandbox.resetHistory();
    });      

    describe('_sendAPIMetrics', () => {
      it('emits an API_METRIC event with api call data, time, error, success http status code and NONE retry status dimensions when none provided in error', () => {
        const successStatusCode = 200;
        const method = 'some_method';
        const time = new Date().getTime();
        const error = {};
        const expectedEventData = {
          name: method,
          time,
          error: error,
          dimensions: [
            {
              name: 'Category',
              value: 'API',
            },
          ],
          optionalDimensions: [
            {
              name: 'HttpStatusCode',
              value: successStatusCode,
            },
            {
              name: 'HttpGenericStatusCode',
              value: `${successStatusCode.toString().charAt(0)}XX`,
            },
            {
              name: 'RetryStatus',
              value: connect.RetryStatus.NONE,
            },
          ]
        };
        connect.worker.clientEngine.client._sendAPIMetrics(method, time, error);

        sandbox.assert.calledOnceWithMatch(
          sendDownstreamSpy,
          connect.EventType.API_METRIC, 
          expectedEventData
        );
      });
      
      it('emits an API_METRIC event with api call data, time, error, provided error http status code and retry status dimensions that are included in error object', () => {
        const method = 'some_method';
        const time = new Date().getTime();
        const statusCode = 401;
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
          error: error,
          dimensions: [
            {
              name: 'Category',
              value: 'API',
            },
          ], 
          optionalDimensions: [
            {
              name: 'HttpStatusCode',
              value: statusCode,
            },
            {
              name: 'HttpGenericStatusCode',
              value: `${statusCode.toString().charAt(0)}XX`,
            },
            {
              name: 'RetryStatus',
              value: retryStatus,
            },
          ],
        };

        connect.worker.clientEngine.client._sendAPIMetrics(method, time, error);

        sandbox.assert.calledOnceWithMatch(
          sendDownstreamSpy,
          connect.EventType.API_METRIC, 
          expectedEventData
        );          
      });
    });
  });

  describe('ClientEngine', () => {
    beforeEach(function () {
      connect.worker.main();
      this.clock = sinon.useFakeTimers();
      this.initData = {
        authToken: "fake-token",
        authTokenExpiration: new Date(),
        endpoint: "/connect/api",
        refreshToken: "fake-refresh-token",
        region: "us-east-1",
        authorizeEndpoint: "/connect/authorize"
      };
      sandbox.spy(connect.rootLogger, "pushLogsDownstream");
      sandbox.spy(connect.worker.clientEngine, "handleSendLogsRequest");
      sandbox.spy(connect.worker.clientEngine.conduit, "sendDownstream");
      const wsmInitPromiseStub = sandbox.stub().callsArgWith(0, { webSocketConnectionFailed: false });
      this.wsm = {
        init: sandbox.stub().returns({then: wsmInitPromiseStub}),
        onInitFailure: sandbox.stub(),
        onConnectionOpen: sandbox.stub(),
        onConnectionClose: sandbox.stub(),
        onConnectionGain: sandbox.stub(),
        onConnectionLost: sandbox.stub(),
        onSubscriptionUpdate: sandbox.stub(),
        onSubscriptionFailure: sandbox.stub(),
        onAllMessage: sandbox.stub(),
        onDeepHeartbeatSuccess: sandbox.stub(),
        onDeepHeartbeatFailure: sandbox.stub(),
        onTopicFailure: sandbox.stub(),
        subscribeTopics: sandbox.stub(),
        sendMessage: sandbox.stub(),
        deepHeartbeatHandler: sandbox.stub(),
      };
      sandbox.stub(connect.WebSocketManager, "create").returns(this.wsm);
      this.client = { 
        call: sandbox.spy(),
        _sendAPIMetrics: connect.worker.clientEngine.client._sendAPIMetrics,
      };
      connect.worker.clientEngine.client = this.client;
      connect.core.init = sandbox.stub();
    });
  
    afterEach(function () {
      this.clock.restore();
      sandbox.restore();
    });
    
    describe('polling cti calls', () => {
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
        setTimeoutSpy = sandbox.spy(global, 'setTimeout');
        hitchSpy = sandbox.spy(connect, 'hitch');
        updateAgentSpy = sandbox.spy(connect.worker.clientEngine, 'updateAgent');
        pollForAgentPermissionsSpy = sandbox.spy(connect.worker.clientEngine, 'pollForAgentPermissions');
        pollForAgentStatesSpy = sandbox.spy(connect.worker.clientEngine, 'pollForAgentStates');
        pollForDialableCountryCodesSpy = sandbox.spy(connect.worker.clientEngine, 'pollForDialableCountryCodes');
        pollForRoutingProfileQueuesSpy = sandbox.spy(connect.worker.clientEngine, 'pollForRoutingProfileQueues');
        updateAgentConfigurationSpy = sandbox.spy(connect.worker.clientEngine, 'updateAgentConfiguration');
        callStub = sandbox.stub();
        connect.worker.clientEngine.client.call = callStub;
      });

      afterEach(() => {
        sandbox.resetHistory();
      }); 

      describe('.pollForAgent', () => {
        it('makes a cti call to getAgentSnapshot', () => {
          connect.worker.clientEngine.pollForAgent();

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_AGENT_SNAPSHOT            
          );
        });

        it('when response is success, it updates agent data and re-calls getAgentSnapshot with a 100ms delay', () => {
          connect.worker.clientEngine.pollForAgent();
          const snapshotData = {
            snapshot: {
              snapshotTimestamp: new Date(),
              localTimesamp: new Date(),
              nextToken: 12345,
            }
          };
          callStub.yieldTo('success', snapshotData);

          sandbox.assert.calledOnce(updateAgentSpy);

          sandbox.assert.calledWith(
            setTimeoutSpy,
            // TODO: need to test that hitch is called by setTimeout
            sandbox.match.any, 
            100,
          );
          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.pollForAgent,
          );
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          connect.worker.clientEngine.pollForAgent();
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          connect.worker.clientEngine.pollForAgent();
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

        it('when response is other than 401 or 403 it logs the error and re-calls getAgentSnapshot with a 5 second delay', () => {
          connect.worker.clientEngine.pollForAgent();
          callStub.yieldTo('failure');

          // TODO: test logs error

          sandbox.assert.calledWith(
            setTimeoutSpy,
            // TODO: need to test that hitch is called by setTimeout
            sandbox.match.any, 
            5000,
          );
          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.pollForAgent,
          );
        });
      });

      describe('.pollForAgentConfiguration', () => {
        it('makes a cti call to getAgentConfiguration', () => {
          connect.worker.clientEngine.pollForAgentConfiguration();

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_AGENT_CONFIGURATION            
          );
        });

        describe('when response is success', () => {
          it('initiates calls passing configuration to pollForAgentPermissions, pollForAgentStates, pollForDialableCountryCodes and pollForRoutingProfileQueues', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
              maxResults: 123,
            };
            const returnData = { configuration };

            connect.worker.clientEngine.pollForAgentConfiguration();
            callStub.yieldTo('success', returnData);
            
            sandbox.assert.calledWith(
              pollForAgentPermissionsSpy,
              configuration,
            );
            sandbox.assert.calledWith(
              pollForAgentStatesSpy,
              configuration,
            );
            sandbox.assert.calledWith(
              pollForDialableCountryCodesSpy,
              configuration,
            );
            sandbox.assert.calledWith(
              pollForRoutingProfileQueuesSpy,
              configuration,
            );
          });

          it('re-calls getAgentConfiguration with a 30 second delay, when repeatForever param = true', () => {
            const params = { repeatForever: true };
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
              maxResults: 123,
            };
            const returnData = { configuration };

            connect.worker.clientEngine.pollForAgentConfiguration(params);
            callStub.yieldTo('success', returnData);
  
            sandbox.assert.calledWith(
              setTimeoutSpy,
              // TODO: need to test that hitch is called by setTimeout
              sandbox.match.any, 
              30000,
            );
            sandbox.assert.calledWith(
              hitchSpy,
              sandbox.match.any,
              connect.worker.clientEngine.pollForAgentConfiguration,
              params,
            );
          });

          it('does NOT re-call getAgentConfiguration when repeatForever param = false', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
              maxResults: 123,
            };
            const returnData = { configuration };

            connect.worker.clientEngine.pollForAgentConfiguration();
            callStub.yieldTo('success', returnData);
  
            sandbox.assert.notCalled(setTimeoutSpy);
            sandbox.assert.neverCalledWith(
              hitchSpy,
              sandbox.match.any,
              connect.worker.clientEngine.pollForAgentConfiguration,
              sandbox.any,
            );
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          connect.worker.clientEngine.pollForAgentConfiguration();
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          connect.worker.clientEngine.pollForAgentConfiguration();
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

        describe('when response is other than 401 or 403', () => {
          it('logs the error and re-calls getAgentConfiguration with a 30 second delay when params.repeatForever=true', () => {
            const params = { repeatForever: true };
            connect.worker.clientEngine.pollForAgentConfiguration(params);
            callStub.yieldTo('failure');

            // TODO: test logs error

            sandbox.assert.calledWith(
              setTimeoutSpy,
              // TODO: need to test that hitch is called by setTimeout
              sandbox.match.any, 
              30000,
              params,
            );
            sandbox.assert.calledWith(
              hitchSpy,
              sandbox.match.any,
              connect.worker.clientEngine.pollForAgentConfiguration,
            );
          });

          it('logs the error and does NOT call getAgentConfiguration when params.repeatForever=false', () => {
            connect.worker.clientEngine.pollForAgentConfiguration();
            callStub.yieldTo('failure');

            // TODO: test logs error

            sandbox.assert.notCalled(setTimeoutSpy);
            sandbox.assert.neverCalledWith(
              hitchSpy,
              sandbox.match.any,
              connect.worker.clientEngine.pollForAgentConfiguration,
            );
          });
        });
      });

      describe('.pollForAgentPermissions', () => {
        it('makes a cti call to getAgentPermissions', () => {
          connect.worker.clientEngine.pollForAgentPermissions();

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_AGENT_PERMISSIONS,       
          );
        });

        describe('when response is success', () => {
          it('re-calls getAgentPermissions when there is more data available (nextToken)', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              permissions: ['foo', 'bar'],
              nextToken: 456,
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForAgentPermissions(configuration, params);
            callStub.yieldTo('success', returnData);
            
            sandbox.assert.calledWithExactly(
              pollForAgentPermissionsSpy.getCall(1),
              configuration, 
              {
                permissions: returnData.permissions,
                nextToken: returnData.nextToken,
                maxResults: params.maxResults,
              }
            );
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              permissions: ['foo', 'bar'],
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForAgentPermissions(configuration, params);
            callStub.yieldTo('success', returnData);;
  
            sandbox.assert.calledWith(
              updateAgentConfigurationSpy,
              {
                ...configuration,
                permissions: returnData.permissions,
              },
            );
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          connect.worker.clientEngine.pollForAgentPermissions();
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          connect.worker.clientEngine.pollForAgentPermissions();
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

       xit('when response is other than 401 or 403 it logs the error', () => {
          connect.worker.clientEngine.pollForAgentPermissions();
          callStub.yieldTo('failure');

          // TODO: test logs error
        });
      });

      describe('.pollForAgentStates', () => {
        it('makes a cti call to getAgentStates', () => {
          const params = {
            nextToken: 1234,
            maxResults: 678,
          };
          connect.worker.clientEngine.pollForAgentStates({}, params);

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_AGENT_STATES,
            {
              nextToken: params.nextToken,
              maxResults: params.maxResults,
            }       
          );
        });

        describe('when response is success', () => {
          it('re-calls getAgentStates when there is more data available (nextToken)', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              states: ['foo', 'bar'],
              nextToken: 456,
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForAgentStates(configuration, params);
            callStub.yieldTo('success', returnData);
            
            sandbox.assert.calledWithExactly(
              pollForAgentStatesSpy.getCall(1),
              configuration, 
              {
                states: returnData.states,
                nextToken: returnData.nextToken,
                maxResults: params.maxResults,
              }
            );
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              states: ['foo', 'bar'],
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForAgentStates(configuration, params);
            callStub.yieldTo('success', returnData);;
  
            sandbox.assert.calledWith(
              updateAgentConfigurationSpy,
              {
                ...configuration,
                agentStates: returnData.states,
              },
            );
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          connect.worker.clientEngine.pollForAgentStates();
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          connect.worker.clientEngine.pollForAgentStates();
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

       xit('when response is other than 401 or 403 it logs the error', () => {
          connect.worker.clientEngine.pollForAgentStates();
          callStub.yieldTo('failure');

          // TODO: test logs error
        });
      });

      describe('.pollForDialableCountryCodes', () => {
        it('makes a cti call to getDialableCountryCodes', () => {
          const params = {
            nextToken: 1234,
            maxResults: 678,
          };
          connect.worker.clientEngine.pollForDialableCountryCodes({}, params);

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_DIALABLE_COUNTRY_CODES,
            {
              nextToken: params.nextToken,
              maxResults: params.maxResults,
            }       
          );
        });

        describe('when response is success', () => {
          it('re-calls getDialableCountryCodes when there is more data available (nextToken)', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              countryCodes: ['foo', 'bar'],
              nextToken: 456,
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForDialableCountryCodes(configuration, params);
            callStub.yieldTo('success', returnData);
            
            sandbox.assert.calledWithExactly(
              pollForDialableCountryCodesSpy.getCall(1),
              configuration, 
              {
                countryCodes: returnData.countryCodes,
                nextToken: returnData.nextToken,
                maxResults: params.maxResults,
              }
            );
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              countryCodes: ['foo', 'bar'],
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForDialableCountryCodes(configuration, params);
            callStub.yieldTo('success', returnData);;
  
            sandbox.assert.calledWith(
              updateAgentConfigurationSpy,
              {
                ...configuration,
                dialableCountries: returnData.countryCodes,
              },
            );
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          connect.worker.clientEngine.pollForDialableCountryCodes();
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          connect.worker.clientEngine.pollForDialableCountryCodes();
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

       xit('when response is other than 401 or 403 it logs the error', () => {
          connect.worker.clientEngine.pollForDialableCountryCodes();
          callStub.yieldTo('failure');

          // TODO: test logs error
        });
      });

      describe('.pollForRoutingProfileQueues', () => {
        it('makes a cti call to getRoutingProfileQueues', () => {
          const params = {
            nextToken: 1234,
            maxResults: 678,
          };
          const configuration = {
            lorem: 'ipsum',
            routingProfile: {
              routingProfileARN: 'someArn',
            },
          };
          connect.worker.clientEngine.pollForRoutingProfileQueues(configuration, params);

          sandbox.assert.calledWith(
            connect.worker.clientEngine.client.call,
            connect.ClientMethods.GET_ROUTING_PROFILE_QUEUES,
            {
              routingProfileARN: configuration.routingProfile.routingProfileARN,
              nextToken: params.nextToken,
              maxResults: params.maxResults,
            }       
          );
        });

        describe('when response is success', () => {
          it('re-calls pollForRoutingProfileQueues when there is more data available (nextToken)', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              queues: ['queue1', 'quque2'],
              nextToken: 456,
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForRoutingProfileQueues(configuration, params);
            callStub.yieldTo('success', returnData);
            
            sandbox.assert.calledWithExactly(
              pollForRoutingProfileQueuesSpy.getCall(1),
              configuration, 
              {
                countryCodes: returnData.queues,
                nextToken: returnData.nextToken,
                maxResults: params.maxResults,
              }
            );
          });

          it('updates agent configuration when no more data available', () => {
            const configuration = {
              lorem: 'ipsum',
              routingProfile: {
                routingProfileARN: 'someArn',
              },
            };
            const returnData = { 
              countryCodes: ['foo', 'bar'],
              queues: ['queue1', 'quque2'],
            };
            const params = {
              maxResults: 123,
            }

            connect.worker.clientEngine.pollForRoutingProfileQueues(configuration, params);
            callStub.yieldTo('success', returnData);
  
            sandbox.assert.calledWith(
              updateAgentConfigurationSpy,
              {
                ...configuration,
                routingProfile: {
                  ...configuration.routingProfile,
                  queues: returnData.queues,
                },
              },
            );
          });
        });

        it('when response is 401, it calls the cti authorization fail handler', () => {
          const configuration = {
            lorem: 'ipsum',
            routingProfile: {
              routingProfileARN: 'someArn',
            },
          };
          connect.worker.clientEngine.pollForRoutingProfileQueues(configuration, {});
          callStub.yieldTo('authFailure');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handlePollingAuthFail,
          );
        });
        
        it('when response is 403, it calls the access denied handler', () => {
          const configuration = {
            lorem: 'ipsum',
            routingProfile: {
              routingProfileARN: 'someArn',
            },
          };
          connect.worker.clientEngine.pollForRoutingProfileQueues(configuration, {});
          callStub.yieldTo('accessDenied');

          sandbox.assert.calledWith(
            hitchSpy,
            sandbox.match.any,
            connect.worker.clientEngine.handleAccessDenied,
          );          
        });

       xit('when response is other than 401 or 403 it logs the error', () => {
          connect.worker.clientEngine.pollForRoutingProfileQueues();
          callStub.yieldTo('failure');

          // TODO: test logs error
        });
      });      
    });

    describe('cti call handlers', () => {
      let sendDownstreamSpy;
      let clientConduit;
      beforeEach(() => {
        sendDownstreamSpy = sandbox.spy();
        clientConduit = { sendDownstream: sendDownstreamSpy };
        connect.worker.clientEngine.conduit = clientConduit;
      });

      afterEach(() => {
        sandbox.resetHistory();
      });

      describe('.handlePollingAuthFail', () => {
        it('emits a CTI_AUTHORIZE_RETRIES_EXHAUSTED event', () => {
          connect.worker.clientEngine.handlePollingAuthFail();

          sandbox.assert.calledOnceWithExactly(
            sendDownstreamSpy,
            connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED,
          );
        });
      });

      describe('.handleAuthFail', () => {
        it('emits an AUTH_FAIL event with no data when none provided', () => {
          connect.worker.clientEngine.handleAuthFail();

          sandbox.assert.calledOnceWithExactly(
            sendDownstreamSpy,
            connect.EventType.AUTH_FAIL,
          );         
        });

        it('emits an AUTH_FAIL event with data when provided', () => {
          const data = { lorem: 'ipsum' };
          connect.worker.clientEngine.handleAuthFail(data);

          sandbox.assert.calledOnceWithExactly(
            sendDownstreamSpy,
            connect.EventType.AUTH_FAIL,
            data,
          );        
        });
      });

      describe('.handleAccessDenied', () => {
        it('emits an ACCESS_DENIED event', () => {
          connect.worker.clientEngine.handleAccessDenied();

          sandbox.assert.calledOnceWithExactly(
            sendDownstreamSpy,
            connect.EventType.ACCESS_DENIED,
          );
        });
      });      
    });
  });

  describe('TODO', function () {
    it("include test case for auth token polling");
  });
});

