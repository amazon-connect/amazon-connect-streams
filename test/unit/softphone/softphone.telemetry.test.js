// Jest port of softphone.spec.js (split file). Mocha spec stays in place; this
// file runs under `npm run test-jest`.

const {
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
} = require('./softphone-test-helpers');

describe('SoftphoneManager - sendSoftphoneReport', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let publishSoftphoneReportSpy;
  let stubbedGetAgentDataProvider;

  const setupRTC = () => {
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
    connect.RtcPeerConnectionFactory.mockImplementation(function () {
      this.get = jest.fn();
      this.close = jest.fn();
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    setupRTC();
    publishSoftphoneReportSpy = jest.spyOn(connect, 'publishSoftphoneReport').mockImplementation(() => {});
    stubbedGetAgentDataProvider = jest.spyOn(connect.core, 'getAgentDataProvider');
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  const startAndCompleteSession = (contactSubtypeAttr, sessionReport = {}) => {
    stubbedGetAgentDataProvider.mockReturnValue({
      getContactData: () => ({
        segmentAttributes: contactSubtypeAttr ? { 'connect:Subtype': { ValueString: contactSubtypeAttr } } : {},
      }),
    });
    const contact = makeContact('contact-sendSoftphoneReport', {
      contactType: connect.ContactType.VOICE,
      contactSubtype: contactSubtypeAttr ?? 'VoIP',
    });
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'abcdefg-sendSoftphoneReport');
    const session = sm.getSession('abcdefg-sendSoftphoneReport');
    session.onSessionCompleted({ sessionReport });
    return contact;
  };

  // Drives the real Contact.getContactSubtype derivation chain
  // (getSegmentAttributes -> _getData -> AgentDataProvider) instead of
  // short-circuiting it with a stub. Used by tests asserting on the contactSubtype
  // field itself; the rest of the suite uses the stubbed makeContact for speed.
  const startAndCompleteSessionWithRealSubtype = (segmentAttributes, sessionReport = {}) => {
    const contact = makeContact('contact-real-subtype', {
      contactType: connect.ContactType.VOICE,
      realContactSubtype: true,
    });
    stubbedGetAgentDataProvider.mockReturnValue({
      getContactData: () => ({ segmentAttributes }),
    });
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'abcdefg-sendSoftphoneReport-real');
    const session = sm.getSession('abcdefg-sendSoftphoneReport-real');
    session.onSessionCompleted({ sessionReport });
    return contact;
  };

  it('reports contactSubtype derived from segmentAttributes', () => {
    startAndCompleteSessionWithRealSubtype({ 'connect:Subtype': { ValueString: 'connect:VoIP' } });
    expect(publishSoftphoneReportSpy.mock.calls[0][0].report.contactSubtype).toBe('connect:VoIP');
  });

  it('reports contactSubtype as null when segmentAttributes ValueString is null', () => {
    startAndCompleteSessionWithRealSubtype({ 'connect:Subtype': { ValueString: null } });
    expect(publishSoftphoneReportSpy.mock.calls[0][0].report.contactSubtype).toBeNull();
  });

  it('includes activePeerConnectionCount in the telemetry report', () => {
    connect.activePeerConnectionCount = 3;
    try {
      startAndCompleteSession();
      const report = publishSoftphoneReportSpy.mock.calls[0][0].report;
      expect(report.activePeerConnectionCount).toBe(3);
    } finally {
      delete connect.activePeerConnectionCount;
    }
  });

});

describe('SoftphoneManager - Per-Agent Connection Stats Tracking', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let publishSoftphoneReportSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    }));
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
    publishSoftphoneReportSpy = jest.spyOn(connect, 'publishSoftphoneReport').mockImplementation(() => {});
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('handles stats for multiple simultaneous connections independently', async () => {
    const contact1 = makeContact('contact-123', { contactType: connect.ContactType.VOICE });
    const contact2 = makeContact('contact-456', { contactType: connect.ContactType.VOICE });
    contact1.getAgentConnection.mockReturnValue(makeAgentConnection('agent-conn-123'));
    contact2.getAgentConnection.mockReturnValue(makeAgentConnection('agent-conn-456'));
    jest.spyOn(contact1, 'sendSoftphoneReport').mockImplementation((_r, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact2, 'sendSoftphoneReport').mockImplementation((_r, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact1, 'sendSoftphoneMetrics').mockImplementation((_m, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact2, 'sendSoftphoneMetrics').mockImplementation((_m, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact1, 'isAutoAcceptEnabled').mockReturnValue(false);
    jest.spyOn(contact2, 'isAutoAcceptEnabled').mockReturnValue(false);

    const sm = new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);

    const rtcSession1 = {
      getUserAudioStats: jest.fn().mockResolvedValue({
        packetsCount: 300,
        packetsLost: 15,
        audioLevel: 0.9,
        timestamp: 1,
      }),
      getRemoteAudioStats: jest.fn().mockResolvedValue({
        packetsCount: 285,
        packetsLost: 5,
        audioLevel: 0.85,
        timestamp: 1,
      }),
      mediaStream: { getAudioTracks: () => [{ enabled: true }] },
      sessionReport: { sessionStartTime: 0, sessionEndTime: 60000 },
      _iceServers: [{ urls: ['stun:stun.example.com'] }],
    };
    const rtcSession2 = {
      getUserAudioStats: jest.fn().mockResolvedValue({
        packetsCount: 150,
        packetsLost: 25,
        audioLevel: 0.1,
        timestamp: 1,
      }),
      getRemoteAudioStats: jest.fn().mockResolvedValue({
        packetsCount: 125,
        packetsLost: 15,
        audioLevel: 0.05,
        timestamp: 1,
      }),
      mediaStream: { getAudioTracks: () => [{ enabled: false }] },
      sessionReport: { sessionStartTime: 0, sessionEndTime: 30000 },
      _iceServers: [{ urls: ['stun:stun.example.com'] }],
    };
    pcmCreateSession.mockReturnValueOnce(rtcSession1).mockReturnValueOnce(rtcSession2);

    contact1.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    contact2.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    // Both contacts must be in the snapshot before the second startSession or
    // sanityCheckActiveSessions tears down the first.
    connect.Agent.prototype.getContacts.mockReturnValue([contact1, contact2]);
    sm.startSession(contact1, 'agent-conn-123');
    sm.startSession(contact2, 'agent-conn-456');

    const session1 = sm.getSession('agent-conn-123');
    const session2 = sm.getSession('agent-conn-456');
    session1.onSessionConnected(rtcSession1);
    session2.onSessionConnected(rtcSession2);

    await jest.advanceTimersByTimeAsync(4000);
    session1.onSessionCompleted(rtcSession1);
    await jest.advanceTimersByTimeAsync(2000);
    session2.onSessionCompleted(rtcSession2);

    expect(publishSoftphoneReportSpy).toHaveBeenCalledTimes(2);
    const report1 = publishSoftphoneReportSpy.mock.calls[0][0];
    const report2 = publishSoftphoneReportSpy.mock.calls[1][0];

    expect(report1.contactId).toBe('contact-123');
    expect(report2.contactId).toBe('contact-456');

    expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsCount).toContain(300);
    expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsLost).toContain(15);
    expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.audioLevel).toContain(0.9);

    expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsCount).toContain(150);
    expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.audioLevel).toContain(0.1);
  });

  it('allows sendSoftphoneMetrics to succeed for calls < 30 seconds', async () => {
    const contact = makeContact('short-call-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('short-call-agent-conn'));
    const metricsSpy = jest.spyOn(contact, 'sendSoftphoneMetrics').mockImplementation((metrics, cb) => {
      expect(Array.isArray(metrics)).toBe(true);
      cb && cb.success && cb.success();
    });

    const sm = new connect.SoftphoneManager();
    const rtcSession = {
      getUserAudioStats: jest.fn().mockResolvedValue({ packetsCount: 25, packetsLost: 1, audioLevel: 0.8, timestamp: 1 }),
      getRemoteAudioStats: jest.fn().mockResolvedValue({ packetsCount: 20, packetsLost: 0, audioLevel: 0.7, timestamp: 1 }),
      mediaStream: { getAudioTracks: () => [{ enabled: true }] },
      sessionReport: { sessionStartTime: 0, sessionEndTime: 20000 },
    };
    pcmCreateSession.mockReturnValue(rtcSession);
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'short-call-agent-conn');
    const session = sm.getSession('short-call-agent-conn');
    session.onSessionConnected(rtcSession);
    await jest.advanceTimersByTimeAsync(2000);
    session.onSessionCompleted(rtcSession);

    expect(metricsSpy).toHaveBeenCalledTimes(1);
  });

  it('includes jitterBufferMillis and roundTripTimeMillis in per-second stats', async () => {
    const contact = makeContact('extended-stats-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('extended-stats-agent-conn'));
    jest.spyOn(contact, 'sendSoftphoneReport').mockImplementation((_r, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact, 'sendSoftphoneMetrics').mockImplementation((_m, cb) => cb && cb.success && cb.success());

    let userCount = 0;
    let remoteCount = 0;
    const rtcSession = {
      getUserAudioStats: jest.fn().mockImplementation(() => {
        userCount += 1;
        return Promise.resolve({
          packetsCount: 100 * userCount,
          packetsLost: 5 * userCount,
          audioLevel: 0.8,
          timestamp: 1,
          jbMilliseconds: 200 * userCount,
          rttMilliseconds: null,
        });
      }),
      getRemoteAudioStats: jest.fn().mockImplementation(() => {
        remoteCount += 1;
        return Promise.resolve({
          packetsCount: 90 * remoteCount,
          packetsLost: 2 * remoteCount,
          audioLevel: 0.7,
          timestamp: 1,
          jbMilliseconds: null,
          rttMilliseconds: 45,
        });
      }),
      mediaStream: { getAudioTracks: () => [{ enabled: true }] },
      sessionReport: { sessionStartTime: 0, sessionEndTime: 10000 },
      _iceServers: [{ urls: ['stun:stun.example.com'] }],
    };
    pcmCreateSession.mockReturnValue(rtcSession);

    const sm = new connect.SoftphoneManager();
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'extended-stats-agent-conn');
    const session = sm.getSession('extended-stats-agent-conn');
    session.onSessionConnected(rtcSession);
    await jest.advanceTimersByTimeAsync(3000);
    session.onSessionCompleted(rtcSession);

    expect(publishSoftphoneReportSpy.mock.calls.length).toBeGreaterThan(0);
    const report = publishSoftphoneReportSpy.mock.calls.at(-1)[0];
    const perSec = report.report.softphoneStreamPerSecondStatistics;

    // AUDIO_INPUT has jitterBufferMillis from jbMilliseconds
    expect(Array.isArray(perSec.AUDIO_INPUT.jitterBufferMillis)).toBe(true);
    perSec.AUDIO_INPUT.jitterBufferMillis.forEach((v) => {
      expect(typeof v).toBe('number');
    });

    // AUDIO_OUTPUT has roundTripTimeMillis from rttMilliseconds
    expect(Array.isArray(perSec.AUDIO_OUTPUT.roundTripTimeMillis)).toBe(true);
    perSec.AUDIO_OUTPUT.roundTripTimeMillis.forEach((v) => {
      expect(v).toBe(45);
    });
  });
});

describe('SoftphoneManager - publishSoftphoneFailureLogs (onSessionFailed reason branches)', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;

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
    connect.RTCErrors = {
      ICE_COLLECTION_TIMEOUT: 'ICE_COLLECTION_TIMEOUT',
      USER_BUSY: 'USER_BUSY',
      SIGNALLING_HANDSHAKE_FAILURE: 'SIGNALLING_HANDSHAKE_FAILURE',
      GUM_TIMEOUT_FAILURE: 'GUM_TIMEOUT_FAILURE',
      GUM_OTHER_FAILURE: 'GUM_OTHER_FAILURE',
      SIGNALLING_CONNECTION_FAILURE: 'SIGNALLING_CONNECTION_FAILURE',
      CALL_NOT_FOUND: 'CALL_NOT_FOUND',
    };
    // onSessionFailed calls publishSoftphoneFailureLogs directly
    // which calls publishError -> new connect.SoftphoneError(). No batching.
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  // INIT -> onRefresh -> startSession -> onSessionFailed -> publishSoftphoneFailureLogs
  // -> publishError -> connect.SoftphoneError.
  let failSessionCounter = 0;
  const failSessionWith = (reason, rtcSessionOverrides = {}) => {
    failSessionCounter += 1;
    const contactId = 'failure-logs-' + failSessionCounter;
    const agentConnId = 'failure-logs-conn-' + failSessionCounter;
    const contact = makeContact(contactId, { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection(agentConnId));

    let onRefreshCb;
    jest.spyOn(contact, 'onRefresh').mockImplementation((cb) => {
      onRefreshCb = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onConnected').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onDestroy').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });

    const sm = new connect.SoftphoneManager();
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    bus.trigger(connect.ContactEvents.INIT, contact);
    onRefreshCb(contact);
    const session = sm.getSession(agentConnId);

    const rtcSession = {
      sessionReport: {},
      _iceServers: [{ urls: ['stun:a.example', 'turn:b.example'] }],
      ...rtcSessionOverrides,
    };
    session.onSessionFailed(rtcSession, reason);
  };

  it('emits ICE_COLLECTION_TIMEOUT softphone error and includes endpoint URLs', () => {
    failSessionWith(connect.RTCErrors.ICE_COLLECTION_TIMEOUT);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.ICE_COLLECTION_TIMEOUT,
      expect.any(String),
      expect.stringContaining('stun:a.example')
    );
  });

  it('emits USER_BUSY_ERROR for USER_BUSY', () => {
    failSessionWith(connect.RTCErrors.USER_BUSY);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.USER_BUSY_ERROR,
      expect.any(String),
      expect.any(String)
    );
  });

  it('emits SIGNALLING_HANDSHAKE_FAILURE for SIGNALLING_HANDSHAKE_FAILURE', () => {
    failSessionWith(connect.RTCErrors.SIGNALLING_HANDSHAKE_FAILURE, { _signalingUri: 'wss://signal.example' });
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.SIGNALLING_HANDSHAKE_FAILURE,
      expect.any(String),
      'wss://signal.example'
    );
  });

  it.each([
    ['GUM_TIMEOUT_FAILURE', 'GUM_TIMEOUT_FAILURE'],
    ['GUM_OTHER_FAILURE', 'GUM_OTHER_FAILURE'],
  ])('emits MICROPHONE_NOT_SHARED for %s', (_label, key) => {
    failSessionWith(connect.RTCErrors[key]);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
      expect.any(String),
      expect.any(String)
    );
  });

  it('emits SIGNALLING_CONNECTION_FAILURE for SIGNALLING_CONNECTION_FAILURE', () => {
    failSessionWith(connect.RTCErrors.SIGNALLING_CONNECTION_FAILURE, { _signalingUri: 'wss://signal.example' });
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.SIGNALLING_CONNECTION_FAILURE,
      expect.any(String),
      'wss://signal.example'
    );
  });

  it('does NOT emit a softphone error for CALL_NOT_FOUND (CCP UX handles it)', () => {
    connect.SoftphoneError.mockClear();
    failSessionWith(connect.RTCErrors.CALL_NOT_FOUND);
    expect(connect.SoftphoneError).not.toHaveBeenCalled();
  });

  it('emits WEBRTC_ERROR for an unrecognised reason', () => {
    failSessionWith('SOMETHING_ELSE');
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.WEBRTC_ERROR,
      expect.any(String),
      expect.any(String)
    );
  });
});

describe('SoftphoneManager - stats collection rejection paths', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn();
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

  it('logs failures from getUserAudioStats and getRemoteAudioStats without throwing', async () => {
    const contact = makeContact('stats-fail-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('stats-fail-conn'));
    jest.spyOn(contact, 'sendSoftphoneReport').mockImplementation((_r, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact, 'sendSoftphoneMetrics').mockImplementation((_m, cb) => cb && cb.success && cb.success());
    jest.spyOn(connect, 'publishSoftphoneReport').mockImplementation(() => {});

    const rtcSession = {
      getUserAudioStats: jest.fn().mockRejectedValue(new Error('user stats boom')),
      getRemoteAudioStats: jest.fn().mockRejectedValue(new Error('remote stats boom')),
      mediaStream: { getAudioTracks: () => [{ enabled: false }] }, // exercises the else of consecutiveAudioOutputMuteDurationSeconds
      sessionReport: { sessionStartTime: 0, sessionEndTime: 1000 },
    };
    pcmCreateSession.mockReturnValue(rtcSession);

    const sm = new connect.SoftphoneManager();
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'stats-fail-conn');
    const session = sm.getSession('stats-fail-conn');
    session.onSessionConnected(rtcSession);

    await jest.advanceTimersByTimeAsync(1500);
    session.onSessionCompleted(rtcSession);

    expect(rtcSession.getUserAudioStats).toHaveBeenCalled();
    expect(rtcSession.getRemoteAudioStats).toHaveBeenCalled();
  });

  it('exercises getTimeSeriesStats no-previous-stats branch via the very first interval tick', async () => {
    const contact = makeContact('stats-firsttick-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('stats-firsttick-conn'));
    jest.spyOn(contact, 'sendSoftphoneReport').mockImplementation((_r, cb) => cb && cb.success && cb.success());
    jest.spyOn(contact, 'sendSoftphoneMetrics').mockImplementation((_m, cb) => cb && cb.success && cb.success());
    jest.spyOn(connect, 'publishSoftphoneReport').mockImplementation(() => {});

    // First-tick stats (no previousStats) hit the else-branch of getTimeSeriesStats:
    // jitterBufferMillis is passed through directly from currentStats.jbMilliseconds.
    const firstTickStats = {
      packetsCount: 100,
      packetsLost: 5,
      audioLevel: 0.5,
      timestamp: 1,
      jbMilliseconds: 200,
      rttMilliseconds: 40,
    };

    const rtcSession = {
      getUserAudioStats: jest.fn().mockResolvedValue(firstTickStats),
      getRemoteAudioStats: jest.fn().mockResolvedValue(firstTickStats),
      mediaStream: { getAudioTracks: () => [{ enabled: true }] },
      sessionReport: { sessionStartTime: 0, sessionEndTime: 5000 },
      _iceServers: [{ urls: ['stun:x'] }],
    };
    pcmCreateSession.mockReturnValue(rtcSession);

    const sm = new connect.SoftphoneManager();
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'stats-firsttick-conn');
    const session = sm.getSession('stats-firsttick-conn');
    session.onSessionConnected(rtcSession);

    await jest.advanceTimersByTimeAsync(1500);
    session.onSessionCompleted(rtcSession);

    expect(connect.publishSoftphoneReport).toHaveBeenCalled();
    const lastReport = connect.publishSoftphoneReport.mock.calls.at(-1)[0].report;
    const perSec = lastReport.softphoneStreamPerSecondStatistics;
    // jitterBufferMillis = raw jbMilliseconds (no division)
    expect(perSec.AUDIO_INPUT.jitterBufferMillis[0]).toBe(200);
  });
});
