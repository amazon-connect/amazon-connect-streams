require("../unit/test-setup.js");
const SAMPLE_SNAPSHOTS = require("./sample-snapshots.js");

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

    describe('detectNewVoiceContactInSync', () => {
      it('should return true if there is a new inbound voice contact via softphone', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.inboundVoiceContactSoftphone;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.true;
      });

      it('should return true if there is a new inbound voice contact via deskphone', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.inboundVoiceContactDeskphone;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.true;
      });

      it('should return true if there is a voice contact for monitoring', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.monitoringVoiceContact;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.true;
      });

      it('should return true if there is a new outbound voice contact', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.outboundVoiceContact;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.true;
      });

      it('should return true if there is a new incoming queued callback contact', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.queuedCallbackContactIncoming;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.true;
      });

      it('should return false if there is a new chat contact', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.chatContact;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.false;
      });

      it('should return false if there is a new task contact', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.noContacts;
        const newSnapshot = SAMPLE_SNAPSHOTS.taskContact;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.false;
      });

      it('should return false if there is a voice contact but not a new one', () => {
        const prevSnapshot = SAMPLE_SNAPSHOTS.inboundVoiceContactSoftphone;
        const newSnapshot = SAMPLE_SNAPSHOTS.inboundVoiceContactSoftphone;
        const result = connect.worker.clientEngine.detectNewVoiceContactInSync(prevSnapshot, newSnapshot);
        expect(result).to.be.false;
      });
    });

    describe('handleTabFocusEvent', () => {
      const TAB_A = 'tab-A';
      const TAB_B = 'tab-B';
      afterEach(() => {
        connect.worker.clientEngine.focusedTabMap = {};
      });
      it('should add tabId to the focusedTabMap', () => {
        const stream = {};
        expect(connect.worker.clientEngine.focusedTabMap[TAB_A]).to.be.undefined;
        expect(connect.worker.clientEngine.focusedTabMap[TAB_B]).to.be.undefined;
        connect.worker.clientEngine.handleTabFocusEvent(stream, { tabId: TAB_A });
        expect(connect.worker.clientEngine.focusedTabMap[TAB_A]).to.be.true;
        expect(connect.worker.clientEngine.focusedTabMap[TAB_B]).to.be.undefined;
        connect.worker.clientEngine.handleTabFocusEvent(stream, { tabId: TAB_B });
        expect(connect.worker.clientEngine.focusedTabMap[TAB_A]).to.be.true;
        expect(connect.worker.clientEngine.focusedTabMap[TAB_B]).to.be.true;
      });
      it('should add streamId to the focusedTabMap in case tabId is missing', () => {
        const stream = { getId: () => 'A' };
        const expectedKey = 'streamId-A';
        expect(connect.worker.clientEngine.focusedTabMap[expectedKey]).to.be.undefined;
        connect.worker.clientEngine.handleTabFocusEvent(stream, { tabId: null });
        expect(connect.worker.clientEngine.focusedTabMap[expectedKey]).to.be.true;
      });
    });

    describe('handleMissedCallInfoEvent', () => {
      let portConduit;
      before(() => {
        portConduit = { sendDownstream: sandbox.stub() };
      });
      afterEach(() => {
        connect.worker.clientEngine.focusedTabMap = {};
        sandbox.resetHistory();
      });
      it('should send SOFTPHONE_ERROR event to downstream if contact accepted but no ccp tabs have received focus', () => {
        const data = {
          contactId: 'contact-123',
          autoAcceptEnabled: false,
          contactHasBeenAccepted: true
        };
        connect.worker.clientEngine.handleMissedCallInfoEvent(portConduit, data);
        sinon.assert.calledWith(portConduit.sendDownstream, connect.AgentEvents.SOFTPHONE_ERROR);
      });
      it('should send SOFTPHONE_ERROR event to downstream if auto-accept enabled but no ccp tabs have received focus', () => {
        const data = {
          contactId: 'contact-123',
          autoAcceptEnabled: true,
          contactHasBeenAccepted: false
        };
        connect.worker.clientEngine.handleMissedCallInfoEvent(portConduit, data);
        sinon.assert.calledWith(portConduit.sendDownstream, connect.AgentEvents.SOFTPHONE_ERROR);
      });
      it('should NOT send SOFTPHONE_ERROR event to downstream if there is a ccp tab that has received focus', () => {
        const data = {
          contactId: 'contact-123',
          autoAcceptEnabled: true,
          contactHasBeenAccepted: false
        };
        connect.worker.clientEngine.focusedTabMap['tab-A'] = true;
        connect.worker.clientEngine.handleMissedCallInfoEvent(portConduit, data);
        sinon.assert.calledOnceWithMatch(portConduit.sendDownstream, connect.EventType.CLIENT_METRIC);
      });
      it('should NOT send SOFTPHONE_ERROR event to downstream if contact has not been accepted', () => {
        const data = {
          contactId: 'contact-123',
          autoAcceptEnabled: false,
          contactHasBeenAccepted: false
        };
        connect.worker.clientEngine.focusedTabMap['tab-A'] = true;
        connect.worker.clientEngine.handleMissedCallInfoEvent(portConduit, data);
        sinon.assert.calledOnceWithMatch(portConduit.sendDownstream, connect.EventType.CLIENT_METRIC);
      });
    });

    describe('MasterTopicCoordinator', () => {
      const PORT_A = 'port-A';
      const PORT_B = 'port-B';
      const PORT_C = 'port-C';
      const defaultMap = {
        softphone: PORT_A,
        ringtone: PORT_A,
        metrics: PORT_B
      };
      before(() => {
        sandbox.stub(connect, 'assertNotNull');
      });
      after(() => {
        connect.worker.clientEngine.masterCoord.topicMasterMap = {};
        sandbox.restore();
      });
      describe('getMaster', () => {
        before(() => {
          connect.worker.clientEngine.masterCoord.topicMasterMap = defaultMap;
        });
        afterEach(() => {
          sandbox.resetHistory();
        });
        it('should assert if no topic is passed in', () => {
          connect.worker.clientEngine.masterCoord.getMaster();
          sinon.assert.calledOnce(connect.assertNotNull);
        });
        it('should return the port id if a given topic exists in the map', () => {
          let portId = connect.worker.clientEngine.masterCoord.getMaster('softphone');
          expect(portId).to.equal(PORT_A);
          portId = connect.worker.clientEngine.masterCoord.getMaster('metrics');
          expect(portId).to.equal(PORT_B);
        });
        it('should return null if a given topic does NOT exist in the map', () => {
          const portId = connect.worker.clientEngine.masterCoord.getMaster('sendLogs');
          expect(portId).to.be.null;
        });
      });
      describe('setMaster', () => {
        beforeEach(() => {
          connect.worker.clientEngine.masterCoord.topicMasterMap = defaultMap;
        });
        afterEach(() => {
          sandbox.resetHistory();
        });
        it('should assert if topic is NOT passed in', () => {
          connect.worker.clientEngine.masterCoord.setMaster();
          sinon.assert.called(connect.assertNotNull);
        });
        it('should assert if id is NOT passed in', () => {
          connect.worker.clientEngine.masterCoord.setMaster('softphone');
          sinon.assert.called(connect.assertNotNull);
        });
        it('should set a master for a given new topic', () => {
          connect.worker.clientEngine.masterCoord.setMaster('sendLogs', PORT_C);
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['sendLogs']).to.equal(PORT_C);
        });
        it('should overwrite a master for a given existing topic', () => {
          connect.worker.clientEngine.masterCoord.setMaster('softphone', PORT_C);
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['softphone']).to.equal(PORT_C);
        });
      });
      describe('removeMasterWithTopic', () => {
        beforeEach(() => {
          connect.worker.clientEngine.masterCoord.topicMasterMap = defaultMap;
        });
        afterEach(() => {
          sandbox.resetHistory();
        });
        it('should assert if no topic is passed in', () => {
          connect.worker.clientEngine.masterCoord.removeMasterWithTopic();
          sinon.assert.called(connect.assertNotNull);
        });
        it('should remove a master with a given topic', () => {
          connect.worker.clientEngine.masterCoord.removeMasterWithTopic('softphone');
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['softphone']).to.be.undefined;
        });
      });
      describe('removeMasterWithId', () => {
        beforeEach(() => {
          connect.worker.clientEngine.masterCoord.topicMasterMap = defaultMap;
        });
        afterEach(() => {
          sandbox.resetHistory();
        });
        it('should assert if no id is passed in', () => {
          connect.worker.clientEngine.masterCoord.removeMasterWithId();
          sinon.assert.called(connect.assertNotNull);
        });
        it('should remove all fields whose value is a given id', () => {
          connect.worker.clientEngine.masterCoord.removeMasterWithId(PORT_A);
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['softphone']).to.be.undefined;
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['ringtone']).to.be.undefined;
          expect(connect.worker.clientEngine.masterCoord.topicMasterMap['metrics']).to.equal(PORT_B);
        });
      });
    });
  });

  describe('TODO', function () {
    it("include test case for auth token polling");
  });
});

