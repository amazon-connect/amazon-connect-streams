describe('BargeIn', () => {
  const connectionId = 'connectionId';
  const contactId = 'contactId';
  const monitorCapabilities = [connect.MonitoringMode.BARGE, connect.MonitoringMode.SILENT_MONITOR];

  let mockedClientCall;
  let stubbedSuccessCallback;
  let stubbedFailureCallback;
  let callbacks;
  let connectionData;

  beforeEach(() => {
    // connectionData drives what _getData() returns; tests set the fields they exercise.
    connectionData = {
      forcedMute: true,
      monitorCapabilities,
      monitorStatus: undefined,
      state: { type: undefined },
      getMediaController: () => {},
    };
    mockedClientCall = jest.fn();
    stubbedSuccessCallback = jest.fn();
    stubbedFailureCallback = jest.fn();
    callbacks = {
      success: stubbedSuccessCallback,
      failure: stubbedFailureCallback,
    };

    jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
      call: mockedClientCall,
    }));
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
      getContactData: () => ({ connections: [{ state: { type: 'connected' } }] }),
      getConnectionData: () => connectionData,
    });
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      sendUpstream: jest.fn(),
    });
  });

  describe('Connection APIs', () => {
    let voiceConnection;

    beforeEach(() => {
      voiceConnection = new connect.VoiceConnection(contactId, connectionId);
    });

    it('isForcedMute returns the forcedMute field', () => {
      connectionData.forcedMute = true;
      expect(voiceConnection.isForcedMute()).toBe(true);
      connectionData.forcedMute = false;
      expect(voiceConnection.isForcedMute()).toBe(false);
    });

    it('isBarge is true only when the monitor status is BARGE', () => {
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(voiceConnection.isBarge()).toBe(true);
      connectionData.monitorStatus = connect.MonitoringMode.SILENT_MONITOR;
      expect(voiceConnection.isBarge()).toBe(false);
    });

    it('isSilentMonitor is true only when the monitor status is SILENT_MONITOR', () => {
      connectionData.monitorStatus = connect.MonitoringMode.SILENT_MONITOR;
      expect(voiceConnection.isSilentMonitor()).toBe(true);
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(voiceConnection.isSilentMonitor()).toBe(false);
    });

    it('isBargeEnabled reflects whether BARGE is in the monitor capabilities', () => {
      connectionData.monitorCapabilities = [connect.MonitoringMode.BARGE];
      expect(voiceConnection.isBargeEnabled()).toBe(true);
      connectionData.monitorCapabilities = [connect.MonitoringMode.SILENT_MONITOR];
      expect(voiceConnection.isBargeEnabled()).toBe(false);
    });

    it('isSilentMonitorEnabled reflects whether SILENT_MONITOR is in the monitor capabilities', () => {
      connectionData.monitorCapabilities = [connect.MonitoringMode.SILENT_MONITOR];
      expect(voiceConnection.isSilentMonitorEnabled()).toBe(true);
      connectionData.monitorCapabilities = [connect.MonitoringMode.BARGE];
      expect(voiceConnection.isSilentMonitorEnabled()).toBe(false);
    });

    it('getMonitorCapabilities returns the monitorCapabilities field', () => {
      expect(voiceConnection.getMonitorCapabilities()).toBe(monitorCapabilities);
    });

    it('getMonitorStatus returns the monitorStatus field', () => {
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(voiceConnection.getMonitorStatus()).toBe(connect.MonitoringMode.BARGE);
    });
  });

  describe('Contact APIs', () => {
    let voiceContact;

    beforeEach(() => {
      voiceContact = new connect.Contact(contactId);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['not part of the enum', 'invalid state'],
    ])('fails with INVALID_TARGET_STATE without calling the client when the target state is %s', (_label, targetState) => {
      voiceContact.updateMonitorParticipantState(targetState, callbacks);
      expect(callbacks.failure).toHaveBeenCalledWith(connect.MonitoringErrorTypes.INVALID_TARGET_STATE);
      expect(mockedClientCall).not.toHaveBeenCalled();
    });

    it('does not throw on an invalid target state when no failure callback is provided', () => {
      expect(() => voiceContact.updateMonitorParticipantState(undefined)).not.toThrow();
      expect(mockedClientCall).not.toHaveBeenCalled();
    });

    it('calls the client with the upper-cased target mode for a valid target state', () => {
      voiceContact.updateMonitorParticipantState(connect.MonitoringMode.BARGE, callbacks);
      expect(mockedClientCall).toHaveBeenCalledWith(
        connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE,
        { contactId, targetMonitorMode: connect.MonitoringMode.BARGE.toUpperCase() },
        callbacks
      );
    });

    it('bargeIn requests the BARGE monitor state', () => {
      voiceContact.bargeIn(callbacks);
      expect(mockedClientCall).toHaveBeenCalledWith(
        connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE,
        { contactId, targetMonitorMode: connect.MonitoringMode.BARGE.toUpperCase() },
        callbacks
      );
    });

    it('silentMonitor requests the SILENT_MONITOR monitor state', () => {
      voiceContact.silentMonitor(callbacks);
      expect(mockedClientCall).toHaveBeenCalledWith(
        connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE,
        { contactId, targetMonitorMode: connect.MonitoringMode.SILENT_MONITOR.toUpperCase() },
        callbacks
      );
    });
  });
});
