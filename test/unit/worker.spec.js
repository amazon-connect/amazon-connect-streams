require("../unit/test-setup.js");

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
      this.client = { call: sandbox.spy() };
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

  describe('TODO', function () {
    it("include test case for auth token polling");
  });
});

