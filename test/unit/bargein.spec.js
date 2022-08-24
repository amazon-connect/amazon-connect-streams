require("./test-setup.js");

describe('BargeIn', () => {
  const sandbox = sinon.createSandbox();
  const connectionId = "connectionId";
  const contactId = "contactId";
  const monitorCapabilities = [connect.MonitoringMode.BARGE, connect.MonitoringMode.SILENT_MONITOR];
  const stubbedSuccessCallback = sinon.stub()
  const stubbedFailureCallback = sinon.stub()
  let mockedClientCall;
  let voiceContact;
  let voiceConnection;

  const callbacks = {
    success: stubbedSuccessCallback,
    failure: stubbedFailureCallback
  }
  before(() => {
    mockedClientCall = sinon.stub();
    sandbox.stub(connect.core, 'getClient').callsFake(() => ({
      call: mockedClientCall
    }));
    sandbox.stub(connect.core, 'getAgentDataProvider').returns({
      getContactData: () => ({ connections: [{ state: { type: "connected" }}]}),
      getConnectionData: () => ({
        forcedMute: true,
        monitorState: connect.MonitoringMode.BARGE,
        monitorCapabilities: monitorCapabilities,
        state: {},
        getMediaController: () => {}
      })
    });

    sandbox.stub(connect.core, "getUpstream").returns({
      sendUpstream: sandbox.stub(),
    });
  });

  after(() => {
    sandbox.restore();
  });

  afterEach(() => {
    connect.core.getClient.resetHistory();
    stubbedSuccessCallback.resetHistory();
    stubbedFailureCallback.resetHistory();
    mockedClientCall.resetHistory();
  });

  describe('Connection APIs', ()=> { 
    beforeEach(() => {
      voiceConnection = new connect.VoiceConnection(contactId, connectionId);
    });

    it('should return value of the forcedMute field', () => {
      assert.equal(voiceConnection.isForcedMute(), true);
    });

    it('should return value of the monitorState field', () => {
      assert.equal(voiceConnection.getMonitorState(), connect.MonitoringMode.BARGE);
    });

    it('should return value of the monitorCapabilities field', () => {
      assert.equal(voiceConnection.getMonitorCapabilities(), monitorCapabilities);
    });
  });

  describe('Contact APIs', ()=> { 
    beforeEach(() => {
      voiceContact = new connect.Contact(contactId);
    });

    it('should return error if target state undefined', () => {
      voiceContact.updateMonitorParticipantState(undefined, callbacks)
      assert.isTrue(callbacks.failure.calledWith(connect.MonitoringErrorTypes.INVALID_TARGET_STATE));
      expect(mockedClientCall.called).not.to.be.true;
    });
  
    it('should return error if target state is null', () => {
      voiceContact.updateMonitorParticipantState(null, callbacks)
      assert.isTrue(callbacks.failure.calledWith(connect.MonitoringErrorTypes.INVALID_TARGET_STATE));
      expect(mockedClientCall.called).not.to.be.true;
    });
  
    it('should return error if target state is not a part of enum', () => {
      voiceContact.updateMonitorParticipantState('invalid state', callbacks);
      assert.isTrue(callbacks.failure.calledWith(connect.MonitoringErrorTypes.INVALID_TARGET_STATE));
      expect(mockedClientCall.called).not.to.be.true;
    });
  
    it('should call callback success if target state is a part of enum', () => {
      voiceContact.updateMonitorParticipantState(connect.MonitoringMode.BARGE, callbacks);
      const expectedParameters = {
        contactId: contactId,
        targetMonitorMode: connect.MonitoringMode.BARGE
      };
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal(expectedParameters);
    });
  });
});