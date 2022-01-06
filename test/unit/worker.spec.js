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

    describe('global.onconnect()', function () {
      var dummyEvent;
      beforeEach(function() {
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

