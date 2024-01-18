require("./test-setup.js");

describe('ChatBargeIn', () => {
  const sandbox = sinon.createSandbox();
  const connectionId = "connectionId";
  const contactId = "contactId";
  const monitorCapabilities = [connect.MonitoringMode.BARGE, connect.MonitoringMode.SILENT_MONITOR];
  let mockedClientChat;
  let chatConnection;
  let connectionState;
  before(() => {
    mockedClientChat = sinon.stub();
    sandbox.stub(connect.core, 'getClient').callsFake(() => ({
      call: mockedClientChat
    }));
    sandbox.stub(connect.core, 'getAgentDataProvider').returns({
      getContactData: () => ({ connections: [{ state: { type: "connected" }}]}),
      getConnectionData: () => ({
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
    mockedClientChat.resetHistory();
  });

  describe('Connection APIs', ()=> { 
    beforeEach(() => {
      chatConnection = new connect.ChatConnection(contactId, connectionId);
    });

    it('should return true for isSilentMonitorEnabled', () => {
      assert.equal(chatConnection.isSilentMonitorEnabled(), true);
    });

    it('should return true for isBargeEnabled', () => {
      assert.equal(chatConnection.isBargeEnabled(), true);
    });

    it('should return value of the monitorCapabilities field', () => {
      assert.equal(chatConnection.getMonitorCapabilities(), monitorCapabilities);
    });
  });
});