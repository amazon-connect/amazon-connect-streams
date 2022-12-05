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
  let connectionState;
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
        monitorCapabilities: monitorCapabilities,
        state: { type: connectionState },
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

    it('should return true for isBarge when the connection state type is hold and monitor status is BARGE', () => {
      connectionState = connect.ConnectionStateType.HOLD;
      voiceConnection.getMonitorStatus = sinon.stub().returns(connect.MonitoringMode.BARGE);
      assert.equal(voiceConnection.isBarge(), true);
    });

    it('should return true for isSilentMonitor when monitor status is SILENT_MONITOR', () => {
      voiceConnection.getMonitorStatus = sinon.stub().returns(connect.MonitoringMode.SILENT_MONITOR);
      assert.equal(voiceConnection.isSilentMonitor(), true);
    });

    it('should return true for isSilentMonitorEnabled', () => {
      assert.equal(voiceConnection.isSilentMonitorEnabled(), true);
    });

    it('should return true for isBargeEnabled', () => {
      assert.equal(voiceConnection.isBargeEnabled(), true);
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
        targetMonitorMode: (connect.MonitoringMode.BARGE).toUpperCase()
      };
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal(expectedParameters);
    });
  });
});