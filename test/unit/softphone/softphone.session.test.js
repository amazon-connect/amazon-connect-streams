// Jest port of softphone.spec.js (split file). Mocha spec stays in place; this
// file runs under `npm run test-jest`.

const {
  VDI_PLATFORMS,
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
} = require('./softphone-test-helpers');

describe('SoftphoneManager - startSession', () => {
  let bus;
  let upstream;
  let stubbedRTCSessionConnect;
  let stubbedReplaceTrack;
  let pcmConnect;
  let pcmCreateSession;
  let contact;
  let agentConnectionId;
  let getStatusSpy;
  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream, stubbedRTCSessionConnect, stubbedReplaceTrack } = installCommonMocks());

    connect.RtcPeerConnectionFactory.mockImplementation(function () {
      this.close = jest.fn();
      this.get = jest.fn();
    });

    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: stubbedRTCSessionConnect,
      _pc: { getSenders: () => [{ replaceTrack: stubbedReplaceTrack }] },
    });
    const pcmMock = {
      createSession: pcmCreateSession,
      connect: pcmConnect,
      getPeerConnection: jest.fn(),
      close: jest.fn(),
      handlePersistentPeerConnectionToggle: jest.fn(),
    };
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      Object.assign(this, pcmMock);
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      Object.assign(this, pcmMock);
    });

    contact = makeContact('contact-startSession', {
      contactType: connect.ContactType.VOICE,
    });
    agentConnectionId = 'abcdefg-startSession';
    getStatusSpy = contact.getStatus;
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  describe('chrome (no VDI, default PCM path)', () => {
    it('creates RTC session and calls pcm.connect() via the contact INIT/REFRESH bus events', () => {
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      bus.trigger(connect.ContactEvents.INIT, contact);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contact.contactId), contact);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });

    it('does NOT create another RTC session if startSession is called twice', () => {
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      bus.trigger(connect.ContactEvents.INIT, contact);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contact.contactId), contact);
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTED });
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contact.contactId), contact);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('firefox', () => {
    beforeEach(() => {
      connect.isChromeBrowser.mockReturnValue(false);
      connect.isFirefoxBrowser.mockReturnValue(true);
    });

    it('creates RTC session immediately for single-tab scenario', () => {
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      connect.hasOtherConnectedCCPs.mockReturnValue(false);
      new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      bus.trigger(connect.ContactEvents.INIT, contact);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contact.contactId), contact);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });

    it('postpones creating RTC session until startSession is called for multi-tab scenario', () => {
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      connect.hasOtherConnectedCCPs.mockReturnValue(true);
      const sm = new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      bus.trigger(connect.ContactEvents.INIT, contact);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contact.contactId), contact);
      expect(pcmConnect).not.toHaveBeenCalled();

      sm.startSession();
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe.each([
    ['AWS_WORKSPACE', VDI_PLATFORMS.AWS_WORKSPACE],
    ['OMNISSA', VDI_PLATFORMS.OMNISSA],
    ['CITRIX', VDI_PLATFORMS.CITRIX],
    ['CITRIX_413', VDI_PLATFORMS.CITRIX_413],
  ])('VDIPlatform: %s', (_label, platform) => {
    beforeEach(() => {
      jest.spyOn(connect, 'CitrixVDIStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'CitrixVDIStrategy';
      });
      jest.spyOn(connect, 'DCVWebRTCStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'DCVStrategy';
      });
      jest.spyOn(connect, 'OmnissaVDIStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'OmnissaVDIStrategy';
      });
    });

    it('creates RTC session and calls pcm.connect()', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: platform });
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });

    it('throws "duplicate session detected" if startSession is called twice', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: platform });
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTED });

      expect(() => sm.startSession(contact, agentConnectionId)).toThrow(
        'duplicate session detected, refusing to setup new connection'
      );
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });

    if (platform === VDI_PLATFORMS.CITRIX || platform === VDI_PLATFORMS.CITRIX_413) {
      it('sets userMedia on the session when passed in', () => {
        const sm = new connect.SoftphoneManager({ VDIPlatform: platform });
        getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
        const dummyUserMedia = { id: 'dummy' };
        sm.startSession(contact, agentConnectionId, dummyUserMedia);
        const session = sm.getSession(agentConnectionId);
        expect(session.mediaStream).toBe(dummyUserMedia);
      });
    }
  });

  describe('disableEchoCancellation', () => {
    it('sets session.echoCancellation = !disableEchoCancellation', () => {
      const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const session = sm.getSession(agentConnectionId);
      expect(session.echoCancellation).toBe(false);
    });
  });

  describe('SoftphoneManager with rtcPeerConnectionManager', () => {
    it('calls rtcPeerConnectionManager.createSession and rtcPeerConnectionManager.connect', async () => {
      const sm = new connect.SoftphoneManager();
      await jest.advanceTimersByTimeAsync(0);
      pcmCreateSession.mockReturnValue(connect.RTCSession);
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      expect(pcmCreateSession).toHaveBeenCalledTimes(1);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
      expect(connect.RTCSession).not.toHaveBeenCalled();
      expect(stubbedRTCSessionConnect).not.toHaveBeenCalled();
    });

    it('throws "duplicate session detected" if startSession is called twice', async () => {
      const sm = new connect.SoftphoneManager();
      await jest.advanceTimersByTimeAsync(0);
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTED });

      expect(() => sm.startSession(contact, agentConnectionId)).toThrow(
        'duplicate session detected, refusing to setup new connection'
      );
      expect(pcmCreateSession).toHaveBeenCalledTimes(1);
      expect(pcmConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto-accept behavior', () => {
    it('broadcasts ContactEvents.ACCEPTED exactly once when auto-accept is enabled', () => {
      contact.isAutoAcceptEnabled = () => true;
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      const sm = new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const rtcSession = pcmCreateSession.mock.results[0].value;
      rtcSession.onSessionConnected({});

      const acceptedCalls = upstream.sendUpstream.mock.calls.filter(
        ([eventType, payload]) =>
          eventType === connect.EventType.BROADCAST &&
          payload.event === connect.ContactEvents.ACCEPTED
      );
      expect(acceptedCalls).toHaveLength(1);
    });

    it('does not broadcast ContactEvents.ACCEPTED when auto-accept is disabled', () => {
      contact.isAutoAcceptEnabled = () => false;
      jest.spyOn(contact, 'getType').mockReturnValue(connect.ContactType.VOICE);
      const sm = new connect.SoftphoneManager();
      getStatusSpy.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const rtcSession = pcmCreateSession.mock.results[0].value;
      rtcSession.onSessionConnected({});

      const acceptedCalls = upstream.sendUpstream.mock.calls.filter(
        ([eventType, payload]) =>
          eventType === connect.EventType.BROADCAST &&
          payload.event === connect.ContactEvents.ACCEPTED
      );
      expect(acceptedCalls).toHaveLength(0);
    });
  });
});

describe('SoftphoneManager - RTC Session callbacks', () => {
  let bus;
  let upstream;
  let stubbedRTCSessionConnect;
  let stubbedReplaceTrack;
  let pcmConnect;
  let pcmCreateSession;
  let contact;
  let agentConnectionId;
  let getVoiceEnhancedUserMediaSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream, stubbedRTCSessionConnect, stubbedReplaceTrack, getVoiceEnhancedUserMediaSpy } =
      installCommonMocks());

    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: stubbedRTCSessionConnect,
      _pc: { getSenders: () => [{ replaceTrack: stubbedReplaceTrack }] },
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionFactory.mockImplementation(function () {
      this.get = jest.fn();
      this.close = jest.fn();
    });

    connect.RTCErrors = {
      ICE_COLLECTION_TIMEOUT: 'ICE_COLLECTION_TIMEOUT',
      USER_BUSY: 'USER_BUSY',
      SIGNALLING_HANDSHAKE_FAILURE: 'SIGNALLING_HANDSHAKE_FAILURE',
      GUM_TIMEOUT_FAILURE: 'GUM_TIMEOUT_FAILURE',
      GUM_OTHER_FAILURE: 'GUM_OTHER_FAILURE',
      SIGNALLING_CONNECTION_FAILURE: 'SIGNALLING_CONNECTION_FAILURE',
      CALL_NOT_FOUND: 'CALL_NOT_FOUND',
    };

    contact = makeContact('contact-RTCSessionCallbacks', { contactType: connect.ContactType.VOICE });
    agentConnectionId = 'abcdefg-RTCSessionCallbacks';

    jest.spyOn(connect.Agent.prototype, 'getPermissions').mockReturnValue([]);
    jest.spyOn(connect.VoiceFocusProvider, 'publishMetrics').mockImplementation(() => {});
    jest.spyOn(connect.VoiceFocusProvider, 'cleanVoiceFocus').mockImplementation(() => {});
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  describe('onLocalStreamAdded', () => {
    it('does not override local stream when voice enhancement is disabled', async () => {
      connect.core.voiceFocus.isEnabled = () => false;
      const sm = new connect.SoftphoneManager();
      jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const session = sm.getSession(agentConnectionId);
      const inputStream = { getAudioTracks: () => [{ kind: 'dummy' }] };

      session.onLocalStreamAdded(session, inputStream);

      expect(getVoiceEnhancedUserMediaSpy).not.toHaveBeenCalled();
      expect(sm.replaceLocalMediaTrack).not.toHaveBeenCalled();
    });

    it('overrides the media stream with enhanced audio when voice enhancement is enabled', async () => {
      connect.core.voiceFocus.isEnabled = () => true;
      const sm = new connect.SoftphoneManager();
      jest.spyOn(sm, 'replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia').mockResolvedValue();
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const session = sm.getSession(agentConnectionId);

      session.onLocalStreamAdded(session, { getAudioTracks: () => [{ kind: 'dummy' }], id: 'input' });
      await jest.advanceTimersByTimeAsync(0);

      expect(sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSessionCompleted', () => {
    it('calls publishMetrics and cleanVoiceFocus when session completes', () => {
      const sm = new connect.SoftphoneManager();
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const session = sm.getSession(agentConnectionId);
      session.onSessionCompleted({ sessionReport: {} });

      expect(connect.VoiceFocusProvider.publishMetrics).toHaveBeenCalledWith({
        contactId: 'contact-RTCSessionCallbacks',
      });
      expect(connect.VoiceFocusProvider.cleanVoiceFocus).toHaveBeenCalledTimes(1);
    });

    it('invokes the onSessionCompleted callback when provided', () => {
      const onSessionCompletedCallback = jest.fn();
      const sm = new connect.SoftphoneManager();
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId, undefined, {
        onSessionCompleted: onSessionCompletedCallback,
      });
      const session = sm.getSession(agentConnectionId);
      session.onSessionCompleted({ sessionReport: {} });

      expect(onSessionCompletedCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSessionFailed', () => {
    it('calls publishMetrics and cleanVoiceFocus when session fails', () => {
      const sm = new connect.SoftphoneManager();
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId);
      const session = sm.getSession(agentConnectionId);
      session.onSessionFailed({ sessionReport: {} });

      expect(connect.VoiceFocusProvider.publishMetrics).toHaveBeenCalledWith({
        contactId: 'contact-RTCSessionCallbacks',
      });
      expect(connect.VoiceFocusProvider.cleanVoiceFocus).toHaveBeenCalledTimes(1);
    });

    it('invokes the onSessionFailed callback when provided', () => {
      const onSessionFailedCallback = jest.fn();
      const sm = new connect.SoftphoneManager();
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, agentConnectionId, undefined, {
        onSessionFailed: onSessionFailedCallback,
      });
      const session = sm.getSession(agentConnectionId);
      session.onSessionFailed({ sessionReport: {} });

      expect(onSessionFailedCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SoftphoneManager - sanityCheckActiveSessions', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  const mockContacts = [
    {
      getContactId: () => 'id1',
      isSoftphoneCall: () => true,
      getType: () => 'voice',
      getAgentConnection: () => ({ getConnectionId: () => 'agentConn1' }),
    },
    {
      getContactId: () => 'id2',
      isSoftphoneCall: () => true,
      getType: () => 'queue_callback',
      getAgentConnection: () => ({ getConnectionId: () => 'agentConn2' }),
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('throws and destroys stale sessions not in the snapshot', () => {
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    const destroySpy = jest.spyOn(sm, 'destroySession');
    const publishMultiple = jest.spyOn(connect.SoftphoneManager, 'publishMultipleSessionsEvent');

    connect.Agent.prototype.getContacts.mockReturnValue(mockContacts);
    const sessions = {
      agentConn1: { connectionId: 'agentConn1' },
      staleConn: { connectionId: 'staleConn', callId: 'mock-id' },
    };

    expect(() => sm.sanityCheckActiveSessions(sessions)).toThrow(
      'duplicate session detected, refusing to setup new connection'
    );
    expect(publishMultiple).toHaveBeenCalledWith('MultiSessionHangUp', 'mock-id', 'staleConn');
    expect(destroySpy).toHaveBeenCalledWith('staleConn');
  });

  it('does not destroy any sessions that are present in the snapshot', () => {
    connect.Agent.prototype.getContacts.mockReturnValue([]);
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    const destroySpy = jest.spyOn(sm, 'destroySession');
    connect.Agent.prototype.getContacts.mockReturnValue(mockContacts);

    sm.sanityCheckActiveSessions({ agentConn1: { connectionId: 'agentConn1' } });
    expect(destroySpy).not.toHaveBeenCalled();
  });

  // For QCB the agentConnectionId changes between INIT and CONNECTED;
  // sanityCheckActiveSessions must keep the session alive when contactAgentConnectionIdMap
  // still maps the original key to a contactId that is active. The closure-scoped map
  // is populated by driving INIT -> onRefresh -> onConnected.
  it('does not destroy session for a queued callback whose agentConnectionId changed', () => {
    const queueCallbackContactId = 'qc-contact-sanity-123';
    const initialAgentConnectionId = 'initial-qc-agent-conn-sanity';
    const newAgentConnectionId = 'connected-qc-agent-conn-sanity';

    const qc = new connect.Contact(queueCallbackContactId);
    jest.spyOn(qc, 'getType').mockReturnValue(connect.ContactType.QUEUE_CALLBACK);
    jest.spyOn(qc, 'isSoftphoneCall').mockReturnValue(true);
    jest.spyOn(qc, 'getContactId').mockReturnValue(queueCallbackContactId);
    jest.spyOn(qc, 'getStatus').mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    jest.spyOn(qc, 'getAgentConnection').mockReturnValue({
      getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
      connectionId: newAgentConnectionId,
      getConnectionId: () => newAgentConnectionId,
      onParticipantResume: () => ({ unsubscribe: jest.fn() }),
    });
    let onRefreshCb;
    let onConnectedCb;
    jest.spyOn(qc, 'onRefresh').mockImplementation((cb) => {
      onRefreshCb = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(qc, 'onConnected').mockImplementation((cb) => {
      onConnectedCb = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(qc, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(qc, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(qc, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    // Construct with empty getContacts so the initial-snapshot loop doesn't call
    // setLastActiveContactId before we drive the lifecycle ourselves.
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    connect.core.softphoneManager = sm;
    const destroySpy = jest.spyOn(sm, 'destroySession');

    // INIT fires with the INITIAL agentConnectionId; onInitContact captures it.
    qc.getAgentConnection.mockReturnValue({
      getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
      connectionId: initialAgentConnectionId,
      getConnectionId: () => initialAgentConnectionId,
      onParticipantResume: () => ({ unsubscribe: jest.fn() }),
    });
    bus.trigger(connect.ContactEvents.INIT, qc);
    onRefreshCb(qc);
    onConnectedCb(qc);

    // After connect: agentConnection moves to the new id (mirrors QCB lifecycle).
    qc.getAgentConnection.mockReturnValue({
      getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
      connectionId: newAgentConnectionId,
      getConnectionId: () => newAgentConnectionId,
      onParticipantResume: () => ({ unsubscribe: jest.fn() }),
    });
    connect.Agent.prototype.getContacts.mockReturnValue([qc]);

    sm.sanityCheckActiveSessions({
      [initialAgentConnectionId]: { connectionId: initialAgentConnectionId, callId: 'qc-call' },
    });
    expect(destroySpy).not.toHaveBeenCalled();
  });

  it('destroys session when the mapped contact is no longer active', () => {
    connect.Agent.prototype.getContacts.mockReturnValue([]);
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    const destroySpy = jest.spyOn(sm, 'destroySession');

    const oldAgentConnectionId = 'old-agent-conn-456';
    const sessions = {
      [oldAgentConnectionId]: { connectionId: oldAgentConnectionId, callId: 'inactive-call-id' },
    };

    expect(() => sm.sanityCheckActiveSessions(sessions)).toThrow(
      'duplicate session detected, refusing to setup new connection'
    );
    expect(destroySpy).toHaveBeenCalledWith(oldAgentConnectionId);
  });
});

describe('SoftphoneManager - Queue Callback agentConnectionId handling', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let upstream;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('uses the initial agentConnectionId for session creation and event callbacks', () => {
    const queueCallbackContactId = 'queuecallback-test-1234';
    const queueCallbackAgentConnectionId = 'initial-qc-agent-conn-id';
    const qc = new connect.Contact(queueCallbackContactId);
    jest.spyOn(qc, 'isSoftphoneCall').mockReturnValue(true);
    jest.spyOn(qc, 'getType').mockReturnValue(connect.ContactType.QUEUE_CALLBACK);
    jest.spyOn(qc, 'getContactId').mockReturnValue(queueCallbackContactId);
    jest.spyOn(qc, 'getAgentConnection').mockReturnValue({
      getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
      connectionId: queueCallbackAgentConnectionId,
      getConnectionId: () => queueCallbackAgentConnectionId,
      onParticipantResume: () => ({ unsubscribe: jest.fn() }),
    });
    let onRefreshCallback;
    let onConnectedCallback;
    jest.spyOn(qc, 'onConnected').mockImplementation((cb) => {
      onConnectedCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(qc, 'onRefresh').mockImplementation((cb) => {
      onRefreshCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(qc, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(qc, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(qc, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(qc, 'getStatus').mockReturnValue({ type: connect.ContactStatusType.CONNECTING });

    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;

    bus.trigger(connect.ContactEvents.INIT, qc);
    onRefreshCallback(qc);

    const session = sm.getSession(queueCallbackAgentConnectionId);
    expect(session).toBeDefined();

    session.onLocalStreamAdded(session, {
      getAudioTracks: () => [{ kind: 'audio', enabled: true }],
      id: 'mock-stream-id',
    });
    qc.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTED });
    session.onSessionConnected(session);
    onConnectedCallback(qc);

    upstream.sendUpstream.mockClear();
    connect.publishMetric.mockClear();
    bus.trigger(connect.EventType.MUTE, { mute: true });

    const muteToggleBroadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(muteToggleBroadcasts).toHaveLength(1);
    expect(muteToggleBroadcasts[0][1].data.muted).toBe(true);
    const muteFailures = connect.publishMetric.mock.calls.filter(
      ([m]) => m && m.name === 'MuteOperationFailed'
    );
    expect(muteFailures).toHaveLength(0);
  });
});

describe('SoftphoneManager - Mute Operation Monitoring', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let testContact;
  const testContactId = 'monitoring-test-contact';
  const testAgentConnectionId = 'monitoring-test-agent-conn';

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });

    testContact = new connect.Contact(testContactId);
    jest.spyOn(testContact, 'getContactId').mockReturnValue(testContactId);
    jest.spyOn(testContact, 'getType').mockReturnValue(connect.ContactType.VOICE);
    jest.spyOn(testContact, 'hasTwoActiveParticipants').mockReturnValue(true);
    jest.spyOn(testContact, 'isSoftphoneCall').mockReturnValue(true);
    jest.spyOn(testContact, 'getStatus').mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    jest.spyOn(testContact, 'getAgentConnection').mockReturnValue(makeAgentConnection(testAgentConnectionId));
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  const arrangeContactForMute = () => {
    let onRefreshCallback;
    let onConnectedCallback;
    jest.spyOn(testContact, 'onConnected').mockImplementation((cb) => {
      onConnectedCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(testContact, 'onRefresh').mockImplementation((cb) => {
      onRefreshCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(testContact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(testContact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(testContact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });
    return {
      fireRefresh: () => onRefreshCallback(testContact),
      fireConnected: () => onConnectedCallback(testContact),
    };
  };

  it('takes mute action when active contact mapping is present (no failure metric)', () => {
    testContact.getAgentConnection().isMute.mockReturnValue(true);
    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'sanityCheckActiveSessions').mockReturnValue();

    connect.Agent.prototype.getContacts.mockReturnValue([testContact]);
    const { fireRefresh, fireConnected } = arrangeContactForMute();
    bus.trigger(connect.ContactEvents.INIT, testContact);
    fireRefresh();

    const session = sm.getSession(testAgentConnectionId);
    expect(session).toBeDefined();
    session.onLocalStreamAdded(session, { getAudioTracks: () => [{ enabled: true }], id: 'm1' });
    session.onSessionConnected(session);
    fireConnected();

    connect.publishMetric.mockClear();
    bus.trigger(connect.EventType.MUTE, { mute: false });

    const failures = connect.publishMetric.mock.calls.filter(
      ([m]) => m && m.name === 'MuteOperationFailed'
    );
    expect(failures).toHaveLength(0);
  });

  it('does NOT publish MuteOperationFailed when no localMediaStream (early return)', () => {
    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    const { fireRefresh, fireConnected } = arrangeContactForMute();
    bus.trigger(connect.ContactEvents.INIT, testContact);
    fireRefresh();
    const session = sm.getSession(testAgentConnectionId);
    expect(session).toBeDefined();
    // SKIP onLocalStreamAdded -> no localMediaStream entry.
    session.onSessionConnected(session);
    fireConnected();

    connect.publishMetric.mockClear();
    bus.trigger(connect.EventType.MUTE, { mute: true });
    expect(connect.publishMetric).not.toHaveBeenCalled();
  });

  // softphone.js's localMediaStream / contactAgentConnectionIdMap / lastActiveContactID
  // are module-level closures that leak across SoftphoneManager instances. Drive an
  // "anchor" contact to overwrite lastActiveContactID, then start a "failure" contact
  // whose mapping won't match - every iterator hit resolves isActiveContact=false.
  // muteToggle does NOT publish MuteOperationFailed.
  // It simply skips the track toggle (because isActiveContact is false) and still
  // broadcasts MUTE_TOGGLE with the requested mute status.
  it('does not publish MuteOperationFailed when localMediaStream exists but no active contact matches', () => {
    const anchorContactId = 'mute-anchor-contact-' + Math.floor(performance.now());
    const anchorAgentConnId = 'mute-anchor-agent-conn-' + Math.floor(performance.now());

    const anchorContact = new connect.Contact(anchorContactId);
    jest.spyOn(anchorContact, 'getContactId').mockReturnValue(anchorContactId);
    jest.spyOn(anchorContact, 'getType').mockReturnValue(connect.ContactType.VOICE);
    jest.spyOn(anchorContact, 'isSoftphoneCall').mockReturnValue(true);
    jest.spyOn(anchorContact, 'getStatus').mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    jest.spyOn(anchorContact, 'getAgentConnection').mockReturnValue(makeAgentConnection(anchorAgentConnId));
    let anchorOnRefresh;
    let anchorOnConnected;
    jest.spyOn(anchorContact, 'onConnected').mockImplementation((cb) => {
      anchorOnConnected = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(anchorContact, 'onRefresh').mockImplementation((cb) => {
      anchorOnRefresh = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(anchorContact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(anchorContact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(anchorContact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'sanityCheckActiveSessions').mockReturnValue();

    // Anchor: drive INIT -> onRefresh -> onConnected only (no onLocalStreamAdded
    // so we don't re-poison localMediaStream with a matching mapping).
    bus.trigger(connect.ContactEvents.INIT, anchorContact);
    anchorOnRefresh(anchorContact);
    anchorOnConnected(anchorContact); // -> lastActiveContactID = anchorContactId

    // Failure contact: register a stream but never fire onConnected.
    const failContactId = 'mute-fail-contact-' + Math.floor(performance.now());
    const failAgentConnId = 'mute-fail-agent-conn-' + Math.floor(performance.now());
    const failContact = new connect.Contact(failContactId);
    jest.spyOn(failContact, 'getContactId').mockReturnValue(failContactId);
    jest.spyOn(failContact, 'getType').mockReturnValue(connect.ContactType.VOICE);
    jest.spyOn(failContact, 'isSoftphoneCall').mockReturnValue(true);
    jest.spyOn(failContact, 'getStatus').mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    jest.spyOn(failContact, 'getAgentConnection').mockReturnValue(makeAgentConnection(failAgentConnId));
    let failOnRefresh;
    jest.spyOn(failContact, 'onRefresh').mockImplementation((cb) => {
      failOnRefresh = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(failContact, 'onConnected').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(failContact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(failContact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(failContact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    bus.trigger(connect.ContactEvents.INIT, failContact);
    failOnRefresh(failContact);
    const failSession = sm.getSession(failAgentConnId);
    failSession.onLocalStreamAdded(failSession, { getAudioTracks: () => [{ enabled: true }], id: 'fail-stream' });

    connect.publishMetric.mockClear();
    const upstream = connect.core.getUpstream();
    upstream.sendUpstream.mockClear();
    bus.trigger(connect.EventType.MUTE, { mute: true });

    // muteToggle does NOT publish MuteOperationFailed - it simply skips
    // the track toggle for non-active entries and still broadcasts MUTE_TOGGLE.
    const failures = connect.publishMetric.mock.calls.filter(
      ([m]) => m && m.name === 'MuteOperationFailed'
    );
    expect(failures).toHaveLength(0);

    // MUTE_TOGGLE broadcast still fires with the requested mute status.
    const muteToggleBroadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(muteToggleBroadcasts).toHaveLength(1);
    expect(muteToggleBroadcasts[0][1].data.muted).toBe(true);
  });
});

describe('SoftphoneManager - destroySession & onRefreshContact terminated path', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let pcmHangup;
  let testContact;
  const testAgentConnectionId = 'destroy-test-agent-conn';

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmHangup = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
      hangup: jest.fn(),
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.hangup = pcmHangup;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.hangup = pcmHangup;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    testContact = makeContact('destroy-test-contact', { contactType: connect.ContactType.VOICE });
    testContact.getAgentConnection.mockReturnValue(makeAgentConnection(testAgentConnectionId));
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('destroySession routes hangup through rtcPeerConnectionManager when present', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    testContact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(testContact, testAgentConnectionId);
    expect(sm.getSession(testAgentConnectionId)).toBeDefined();

    sm.destroySession(testAgentConnectionId);
    await jest.advanceTimersByTimeAsync(0);

    expect(pcmHangup).toHaveBeenCalledWith(testAgentConnectionId);
    expect(sm.getSession(testAgentConnectionId)).toBeUndefined();
  });

  it('destroySession is a no-op for an unknown connectionId', () => {
    const sm = new connect.SoftphoneManager();
    expect(() => sm.destroySession('unknown')).not.toThrow();
    expect(pcmHangup).not.toHaveBeenCalled();
  });

  it('onRefreshContact destroys an active session when the contact is terminated', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'sanityCheckActiveSessions').mockReturnValue();

    let onRefresh;
    jest.spyOn(testContact, 'onRefresh').mockImplementation((cb) => {
      onRefresh = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(testContact, 'onConnected').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(testContact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(testContact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(testContact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    testContact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    bus.trigger(connect.ContactEvents.INIT, testContact);
    onRefresh(testContact);
    expect(sm.getSession(testAgentConnectionId)).toBeDefined();

    testContact.getStatus.mockReturnValue({ type: connect.ContactStatusType.ENDED });
    onRefresh(testContact);
    await jest.advanceTimersByTimeAsync(0);

    expect(pcmHangup).toHaveBeenCalledWith(testAgentConnectionId);
  });
});

describe('SoftphoneManager - muteToggle stored-state branch', () => {
  let bus;
  let upstream;
  let pcmCreateSession;
  let pcmConnect;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('falls back to stored localMediaStream[connId].muted when data.mute is undefined', () => {
    const contactId = 'mute-toggle-stored';
    const agentConnId = 'mute-toggle-stored-conn';
    const contact = makeContact(contactId, { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection(agentConnId));

    let onRefresh;
    let onConnected;
    jest.spyOn(contact, 'onConnected').mockImplementation((cb) => {
      onConnected = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onRefresh').mockImplementation((cb) => {
      onRefresh = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'sanityCheckActiveSessions').mockReturnValue();

    bus.trigger(connect.ContactEvents.INIT, contact);
    onRefresh(contact);
    onConnected(contact);

    const session = sm.getSession(agentConnId);
    expect(session).toBeDefined();
    session.onLocalStreamAdded(session, { getAudioTracks: () => [{ enabled: true }], id: 'm-stored' });

    // First call records muted=true on the entry; second call (no mute value)
    // should reuse that stored state.
    bus.trigger(connect.EventType.MUTE, { mute: true });
    upstream.sendUpstream.mockClear();
    bus.trigger(connect.EventType.MUTE, {});

    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(broadcasts.length).toBeGreaterThan(0);
    expect(broadcasts.at(-1)[1].data.muted).toBe(true);
  });
});

describe('SoftphoneManager._clearAllSessions', () => {
  let bus;
  let pcmHangup;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmHangup = jest.fn();
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = jest.fn().mockReturnValue({
        connect: jest.fn(),
        _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
        hangup: jest.fn(),
      });
      this.connect = jest.fn();
      this.hangup = pcmHangup;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('hangs up every session currently tracked by the manager', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;

    const c1 = makeContact('clear-c1', { contactType: connect.ContactType.VOICE });
    const c2 = makeContact('clear-c2', { contactType: connect.ContactType.VOICE });
    c1.getAgentConnection.mockReturnValue(makeAgentConnection('clear-a1'));
    c2.getAgentConnection.mockReturnValue(makeAgentConnection('clear-a2'));
    c1.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    c2.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    connect.Agent.prototype.getContacts.mockReturnValue([c1, c2]);
    sm.startSession(c1, 'clear-a1');
    sm.startSession(c2, 'clear-a2');

    sm._clearAllSessions();
    await jest.advanceTimersByTimeAsync(0);

    expect(pcmHangup).toHaveBeenCalledWith('clear-a1');
    expect(pcmHangup).toHaveBeenCalledWith('clear-a2');
  });
});

describe('SoftphoneManager.destroySession - legacy session.hangup branch', () => {
  let bus;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  // The legacy session.hangup() path is exercised by nulling
  // rtcPeerConnectionManager AFTER startSession completes.
  beforeEach(() => {
    const pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
      hangup: jest.fn(),
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = jest.fn();
      this.hangup = jest.fn();
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  it('calls session.hangup() when no rtcPeerConnectionManager is present', async () => {
    const sm = new connect.SoftphoneManager();
    const sessionHangup = jest.fn();
    const contact = makeContact('legacy-hangup', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('legacy-hangup-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'legacy-hangup-conn');
    expect(sm.getSession('legacy-hangup-conn')).toBeDefined();

    sm.rtcPeerConnectionManager = null;
    sm.getSession('legacy-hangup-conn').hangup = sessionHangup;
    sm.destroySession('legacy-hangup-conn');
    await jest.advanceTimersByTimeAsync(0);
    expect(sessionHangup).toHaveBeenCalled();
  });

  it('catches errors thrown by hangup and logs a warning (does not propagate)', async () => {
    const sm = new connect.SoftphoneManager();
    const contact = makeContact('legacy-hangup-err', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('legacy-hangup-err-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'legacy-hangup-err-conn');

    sm.rtcPeerConnectionManager = null;
    sm.getSession('legacy-hangup-err-conn').hangup = () => {
      throw new Error('already hung up');
    };
    expect(() => sm.destroySession('legacy-hangup-err-conn')).not.toThrow();
    await jest.advanceTimersByTimeAsync(0);
  });
});

describe('SoftphoneManager - fireContactAcceptedEvent guard', () => {
  let bus;
  let upstream;
  let pcmCreateSession;
  let pcmConnect;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('does not broadcast ContactEvents.ACCEPTED when agentConnection is null at fire time', () => {
    const contact = makeContact('null-agent-conn', { contactType: connect.ContactType.VOICE });
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    contact.isAutoAcceptEnabled = () => true;
    const realAgentConn = makeAgentConnection('null-agent-conn-id');
    contact.getAgentConnection.mockReturnValue(realAgentConn);

    const sm = new connect.SoftphoneManager();
    sm.startSession(contact, 'null-agent-conn-id');
    const session = sm.getSession('null-agent-conn-id');

    // startStatsCollectionJob + startStatsReportingJob each call
    // contact.getAgentConnection().getConnectionId() before fireContactAcceptedEvent
    // reads agentConnection. Keep the first two calls valid; null on the third.
    contact.getAgentConnection
      .mockReturnValueOnce(realAgentConn)
      .mockReturnValueOnce(realAgentConn)
      .mockReturnValue(null);

    upstream.sendUpstream.mockClear();
    session.onSessionConnected({});

    const accepted = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) =>
        payload && payload.event === connect.ContactEvents.ACCEPTED
    );
    expect(accepted).toHaveLength(0);
  });
});

describe('SoftphoneManager - onInitContact onEnded teardown', () => {
  let bus;
  let pcmCreateSession;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = jest.fn();
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('unsubscribes onParticipantResume / onConnected / onEnded when onEnded fires', () => {
    const contact = makeContact('ended-contact', { contactType: connect.ContactType.VOICE });
    const aConn = makeAgentConnection('ended-conn');
    const resumeUnsub = jest.fn();
    aConn.onParticipantResume = jest.fn().mockReturnValue({ unsubscribe: resumeUnsub });
    contact.getAgentConnection.mockReturnValue(aConn);

    let onEndedCb;
    const connectedUnsub = jest.fn();
    const endedUnsub = jest.fn();
    // onInitContact calls contact.onConnected exactly once
    // (for setLastActiveContactId). There is no separate "errors flush" onConnected.
    jest.spyOn(contact, 'onConnected').mockReturnValue({ unsubscribe: connectedUnsub });
    jest.spyOn(contact, 'onEnded').mockImplementation((cb) => {
      onEndedCb = cb;
      return { unsubscribe: endedUnsub };
    });
    jest.spyOn(contact, 'onRefresh').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });

    new connect.SoftphoneManager();
    bus.trigger(connect.ContactEvents.INIT, contact);
    expect(typeof onEndedCb).toBe('function');

    onEndedCb();
    expect(resumeUnsub).toHaveBeenCalled();
    expect(connectedUnsub).toHaveBeenCalled();
    expect(endedUnsub).toHaveBeenCalled();
  });
});
