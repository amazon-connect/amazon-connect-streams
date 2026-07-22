describe('ChatBargeIn', () => {
  const connectionId = 'connectionId';
  const contactId = 'contactId';
  const monitorCapabilities = [connect.MonitoringMode.BARGE, connect.MonitoringMode.SILENT_MONITOR];

  let connectionData;

  beforeEach(() => {
    connectionData = {
      monitorCapabilities,
      monitorStatus: undefined,
      state: { type: undefined },
      getMediaController: () => {},
    };

    jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({ call: jest.fn() }));
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
      getContactData: () => ({ connections: [{ state: { type: 'connected' } }] }),
      getConnectionData: () => connectionData,
    });
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream: jest.fn() });
  });

  describe('Connection APIs', () => {
    let chatConnection;

    beforeEach(() => {
      chatConnection = new connect.ChatConnection(contactId, connectionId);
    });

    it('isBargeEnabled reflects whether BARGE is in the monitor capabilities', () => {
      connectionData.monitorCapabilities = [connect.MonitoringMode.BARGE];
      expect(chatConnection.isBargeEnabled()).toBe(true);
      connectionData.monitorCapabilities = [connect.MonitoringMode.SILENT_MONITOR];
      expect(chatConnection.isBargeEnabled()).toBe(false);
    });

    it('isSilentMonitorEnabled reflects whether SILENT_MONITOR is in the monitor capabilities', () => {
      connectionData.monitorCapabilities = [connect.MonitoringMode.SILENT_MONITOR];
      expect(chatConnection.isSilentMonitorEnabled()).toBe(true);
      connectionData.monitorCapabilities = [connect.MonitoringMode.BARGE];
      expect(chatConnection.isSilentMonitorEnabled()).toBe(false);
    });

    it('isBarge is true only when the monitor status is BARGE', () => {
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(chatConnection.isBarge()).toBe(true);
      connectionData.monitorStatus = connect.MonitoringMode.SILENT_MONITOR;
      expect(chatConnection.isBarge()).toBe(false);
    });

    it('isSilentMonitor is true only when the monitor status is SILENT_MONITOR', () => {
      connectionData.monitorStatus = connect.MonitoringMode.SILENT_MONITOR;
      expect(chatConnection.isSilentMonitor()).toBe(true);
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(chatConnection.isSilentMonitor()).toBe(false);
    });

    it('getMonitorStatus returns the monitorStatus field', () => {
      connectionData.monitorStatus = connect.MonitoringMode.BARGE;
      expect(chatConnection.getMonitorStatus()).toBe(connect.MonitoringMode.BARGE);
    });

    it('getMonitorCapabilities returns the monitorCapabilities field', () => {
      expect(chatConnection.getMonitorCapabilities()).toBe(monitorCapabilities);
    });
  });
});
