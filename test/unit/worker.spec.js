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

    it("sets master topic", function () {
      var conduit = { sendDownstream: sinon.spy() };
      var request = { method: connect.MasterMethods.BECOME_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
      connect.worker.clientEngine.handleMasterRequest(
        conduit, 
        "portId", 
        request
      );
      var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
        masterId: "portId",
        isMaster: true,
        topic: connect.MasterTopics.SOFTPHONE,
      });
      assert.isTrue(conduit.sendDownstream.calledWith(expected.event, expected));
    });

    it("returns isMaster as false in MASTER_RESPONSE if not master topic", function () {
      var conduit = { sendDownstream: sinon.spy() };
      var request = { method: connect.MasterMethods.CHECK_MASTER, params: { topic: connect.MasterTopics.SOFTPHONE } };
      connect.worker.clientEngine.handleMasterRequest(
        conduit,
        "someOtherPortId",
        request
      );
      var expected = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
        masterId: "portId",
        isMaster: false,
        topic: connect.MasterTopics.SOFTPHONE,
      });
      assert.isTrue(conduit.sendDownstream.calledWith(expected.event, expected));
    });
  });

  describe('TODO', function () {
    it("include test case for auth token polling");
  });
});

