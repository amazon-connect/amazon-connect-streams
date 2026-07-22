// Shared helpers for the softphone Jest test files. Not picked up by
// jest.config.js (testMatch only matches *.test.js).

const VDI_PLATFORMS = {
  OMNISSA: 'OMNISSA',
  AWS_WORKSPACE: 'AWS_WORKSPACE',
  CITRIX: 'CITRIX',
  CITRIX_413: 'CITRIX_413',
};

const installCommonMocks = () => {
  const bus = new connect.EventBus();
  jest.spyOn(connect.core, 'getEventBus').mockReturnValue(bus);
  jest.spyOn(bus, 'subscribe');
  const upstream = { sendUpstream: jest.fn() };
  jest.spyOn(connect.core, 'getUpstream').mockReturnValue(upstream);
  jest.spyOn(connect.core, 'getSkew').mockReturnValue(100);
  jest.spyOn(connect.core, 'getClient').mockReturnValue({
    call: (_endpoint, _params, callbacks) => {
      callbacks.success({ softphoneTransport: { softphoneMediaConnections: 'iceServer' } });
    },
  });

  // Keep `function` for constructor mocks: arrows can't be invoked with `new`.
  jest.spyOn(connect, 'RtcPeerConnectionFactory').mockImplementation(function () {
    this.close = jest.fn();
  });
  jest.spyOn(connect, 'RtcPeerConnectionManager').mockImplementation(function () {
    this.close = jest.fn();
    this.handlePersistentPeerConnectionToggle = jest.fn();
  });
  jest.spyOn(connect, 'RtcPeerConnectionManagerV2').mockImplementation(function () {
    this.close = jest.fn();
    this.handlePersistentPeerConnectionToggle = jest.fn();
  });
  const stubbedRTCSessionConnect = jest.fn();
  const stubbedReplaceTrack = jest.fn().mockResolvedValue();
  jest.spyOn(connect, 'RTCSession').mockImplementation(function () {
    this.connect = stubbedRTCSessionConnect;
    this._pc = { getSenders: () => [{ replaceTrack: stubbedReplaceTrack }] };
  });

  jest.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue({
    getAudioTracks: () => [{ kind: 'audio', enabled: true }],
    removeTrack: jest.fn(),
    addTrack: jest.fn(),
  });
  jest.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([]);
  jest.spyOn(navigator.mediaDevices, 'addEventListener').mockImplementation(() => {});
  jest.spyOn(navigator.permissions, 'query').mockResolvedValue({ state: 'granted' });

  jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
  jest.spyOn(connect, 'SoftphoneError').mockImplementation(function () {});
  jest.spyOn(connect.SoftphoneManager, 'isBrowserSoftPhoneSupported').mockReturnValue(true);
  jest.spyOn(connect, 'isChromeBrowser').mockReturnValue(true);
  jest.spyOn(connect, 'getChromeBrowserVersion').mockReturnValue(60);
  jest.spyOn(connect, 'isFirefoxBrowser').mockReturnValue(false);
  jest.spyOn(connect, 'hasOtherConnectedCCPs').mockReturnValue(false);
  jest.spyOn(connect.Agent.prototype, 'getContacts').mockReturnValue([]);
  connect.agent.initialized = true;

  const enhancedStream = { getAudioTracks: () => [{ kind: 'enhanced' }], id: 'enhanced' };
  const getVoiceEnhancedUserMediaSpy = jest
    .spyOn(connect.VoiceFocusProvider, 'getVoiceEnhancedUserMedia')
    .mockResolvedValue(enhancedStream);

  if (!connect.core.voiceFocus) connect.core.voiceFocus = {};
  connect.core.voiceFocus.isEnabled = () => false;

  return {
    bus,
    upstream,
    stubbedRTCSessionConnect,
    stubbedReplaceTrack,
    getVoiceEnhancedUserMediaSpy,
    enhancedStream,
  };
};

const commonAfterEach = () => {
  if (connect.core.softphoneManager) {
    try {
      connect.core.softphoneManager.terminate();
    } catch (_e) { /* best-effort teardown */ }
    connect.core.softphoneManager = null;
  }
  connect.agent.initialized = false;
};

const makeAgentConnection = (connectionId, overrides = {}) => ({
  isMute: jest.fn(),
  getSoftphoneMediaInfo: jest.fn().mockReturnValue({ callConfigJson: '{}' }),
  connectionId,
  getConnectionId: () => connectionId,
  onParticipantResume: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  ...overrides,
});

// opts.realContactSubtype = true: leave Contact.getContactSubtype unstubbed so it
// derives from connect.core.getAgentDataProvider().getContactData(...).segmentAttributes.
// Use this when the test is asserting on the derivation chain itself.
const makeContact = (contactId, opts = {}) => {
  const contact = new connect.Contact(contactId);
  jest.spyOn(contact, 'isSoftphoneCall').mockReturnValue(opts.isSoftphoneCall ?? true);
  jest.spyOn(contact, 'isInbound').mockReturnValue(opts.isInbound ?? true);
  if (!opts.realContactSubtype) {
    jest.spyOn(contact, 'getContactSubtype').mockReturnValue(opts.contactSubtype ?? 'VoIP');
  }
  jest.spyOn(contact, 'getAgentConnection').mockReturnValue(
    opts.agentConnection ?? makeAgentConnection(opts.connectionId ?? '0987654321')
  );
  const status = opts.status ?? { type: connect.ContactStatusType.CONNECTING };
  jest.spyOn(contact, 'getStatus').mockReturnValue(status);
  if (opts.contactType) {
    jest.spyOn(contact, 'getType').mockReturnValue(opts.contactType);
  }
  return contact;
};

module.exports = {
  VDI_PLATFORMS,
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
};
