// Jest port of softphone.spec.js (split file). Mocha spec stays in place; this
// file runs under `npm run test-jest`.

const {
  VDI_PLATFORMS,
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
} = require('./softphone-test-helpers');

describe('SoftphoneManager - requestIceAccess failure paths', () => {
  let bus;
  let getClientSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    getClientSpy = connect.core.getClient;
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('publishes multiple_softphone_active_sessions on SoftphoneConnectionLimitBreachedException', async () => {
    let capturedFailure;
    getClientSpy.mockReturnValue({
      call: (_endpoint, _params, callbacks) => {
        capturedFailure = callbacks.failure;
      },
    });
    let factoryThis;
    connect.RtcPeerConnectionFactory.mockImplementation(function (_logger, _ws, _id, transportHandle) {
      factoryThis = this;
      this.close = jest.fn();
      this.transportHandle = transportHandle;
    });
    new connect.SoftphoneManager();
    factoryThis.transportHandle().catch(() => {}); // primes capturedFailure
    capturedFailure({ message: 'SoftphoneConnectionLimitBreachedException' });

    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      'multiple_softphone_active_sessions',
      'Number of active sessions are more then allowed limit.',
      ''
    );
  });

  it('rejects with "Authentication failed while requestIceAccess" on authFailure', async () => {
    let capturedAuthFailure;
    getClientSpy.mockReturnValue({
      call: (_endpoint, _params, callbacks) => {
        capturedAuthFailure = callbacks.authFailure;
      },
    });
    let factoryThis;
    connect.RtcPeerConnectionFactory.mockImplementation(function (_l, _w, _i, transportHandle) {
      factoryThis = this;
      this.close = jest.fn();
      this.transportHandle = transportHandle;
    });
    new connect.SoftphoneManager();
    const p = factoryThis.transportHandle();
    capturedAuthFailure();
    await expect(p).rejects.toThrow('Authentication failed while requestIceAccess');
  });

  it('rejects with "Access Denied while requestIceAccess" on accessDenied', async () => {
    let capturedAccessDenied;
    getClientSpy.mockReturnValue({
      call: (_endpoint, _params, callbacks) => {
        capturedAccessDenied = callbacks.accessDenied;
      },
    });
    let factoryThis;
    connect.RtcPeerConnectionFactory.mockImplementation(function (_l, _w, _i, transportHandle) {
      factoryThis = this;
      this.close = jest.fn();
      this.transportHandle = transportHandle;
    });
    new connect.SoftphoneManager();
    const p = factoryThis.transportHandle();
    capturedAccessDenied();
    await expect(p).rejects.toThrow('Access Denied while requestIceAccess');
  });

  it('rejects with "requestIceAccess failed" on a generic non-quota failure', async () => {
    let capturedFailure;
    getClientSpy.mockReturnValue({
      call: (_endpoint, _params, callbacks) => {
        capturedFailure = callbacks.failure;
      },
    });
    let factoryThis;
    connect.RtcPeerConnectionFactory.mockImplementation(function (_l, _w, _i, transportHandle) {
      factoryThis = this;
      this.close = jest.fn();
      this.transportHandle = transportHandle;
    });
    new connect.SoftphoneManager();
    const p = factoryThis.transportHandle();
    capturedFailure({ message: 'something else' });
    await expect(p).rejects.toThrow('requestIceAccess failed');
  });
});

describe('SoftphoneManager.isBrowserSoftPhoneSupported', () => {
  beforeEach(() => {
    installCommonMocks();
  });

  afterEach(() => {
    commonAfterEach();
  });

  it.each([
    ['Opera > 17',     { opera: 18, chrome: 0, firefox: 0 }, true],
    ['Opera <= 17',    { opera: 17, chrome: 0, firefox: 0 }, false],
    ['Chrome > 22',    { opera: 0, chrome: 23, firefox: 0 }, true],
    ['Chrome <= 22',   { opera: 0, chrome: 22, firefox: 0 }, false],
    ['Firefox > 21',   { opera: 0, chrome: 0, firefox: 22 }, true],
    ['Firefox <= 21',  { opera: 0, chrome: 0, firefox: 21 }, false],
    ['none of the supported browsers', { opera: 0, chrome: 0, firefox: 0 }, false],
  ])('%s -> %s', (_label, { opera, chrome, firefox }, expected) => {
    jest.spyOn(connect, 'isOperaBrowser').mockReturnValue(opera > 0);
    jest.spyOn(connect, 'getOperaBrowserVersion').mockReturnValue(opera);
    connect.isChromeBrowser.mockReturnValue(chrome > 0);
    connect.getChromeBrowserVersion.mockReturnValue(chrome);
    connect.isFirefoxBrowser.mockReturnValue(firefox > 0);
    jest.spyOn(connect, 'getFirefoxBrowserVersion').mockReturnValue(firefox);

    // Restore the real implementation - installCommonMocks stubs it to true.
    connect.SoftphoneManager.isBrowserSoftPhoneSupported.mockRestore();

    expect(connect.SoftphoneManager.isBrowserSoftPhoneSupported()).toBe(expected);
  });
});

describe('SoftphoneManager - monitorMicrophonePermission error branches', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    installCommonMocks();
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('does not throw when navigator.permissions.query throws synchronously', () => {
    connect.isChromeBrowser.mockReturnValue(true);
    connect.getChromeBrowserVersion.mockReturnValue(60);
    navigator.permissions.query.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => new connect.SoftphoneManager()).not.toThrow();
  });

  it('skips the listener wiring on non-chrome browsers', async () => {
    connect.isChromeBrowser.mockReturnValue(false);
    navigator.permissions.query.mockClear();
    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    expect(navigator.permissions.query).not.toHaveBeenCalled();
  });

  it('skips the listener wiring on chrome <= 43', async () => {
    connect.isChromeBrowser.mockReturnValue(true);
    connect.getChromeBrowserVersion.mockReturnValue(43);
    navigator.permissions.query.mockClear();
    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    expect(navigator.permissions.query).not.toHaveBeenCalled();
  });
});

describe('SoftphoneManager - _initiateRtcPeerConnectionManager legacy/active-pc branches', () => {
  let bus;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('uses RtcPeerConnectionManager V1 when V2 is unavailable', () => {
    const v1Spy = connect.RtcPeerConnectionManager;
    const originalV2 = connect.RtcPeerConnectionManagerV2;
    connect.RtcPeerConnectionManagerV2 = undefined;
    try {
      const sm = new connect.SoftphoneManager();
      expect(v1Spy).toHaveBeenCalled();
      expect(sm.rtcPeerConnectionManager).toBeDefined();
    } finally {
      connect.RtcPeerConnectionManagerV2 = originalV2;
    }
  });

  it('exercises the existing-PCM-with-active-_pc branch in _initiateRtcPeerConnectionManager', () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    // _pc non-null -> hasActivePeerConnection=true -> shouldUseV2=false -> V1 ctor.
    sm.rtcPeerConnectionManager._pc = { id: 'active-pc' };
    sm.rtcPeerConnectionManager._rtcSession = { _state: { name: 'CONNECTED' } };

    const ctorCallCountBefore = connect.RtcPeerConnectionManager.mock.calls.length;
    sm._initiateRtcPeerConnectionManager();

    expect(connect.RtcPeerConnectionManager.mock.calls.length).toBeGreaterThan(ctorCallCountBefore);
  });
});

describe('SoftphoneManager - agent config update flips V1<->V2', () => {
  let bus;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('calls handlePersistentPeerConnectionToggle when manager type matches shouldUseV2', async () => {
    jest.spyOn(connect.Agent.prototype, 'getConfiguration').mockReturnValue({ softphonePersistentConnection: true });
    const sm = new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());
    expect(sm.rtcPeerConnectionManager.handlePersistentPeerConnectionToggle).toHaveBeenCalledWith(true);
  });
});

describe('SoftphoneLogger tee', () => {
  let upstream;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ upstream } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('routes info through the underlying logger with the SOFTPHONE component', () => {
    const logger = connect.getLog();
    const infoSpy = jest.spyOn(logger, 'info').mockReturnValue({ sendInternalLogToServer: jest.fn() });

    new connect.SoftphoneManager();
    expect(infoSpy).toHaveBeenCalled();
  });
});

describe('SoftphoneManager - legacy RTCSession (no PCM) startSession', () => {
  let bus;
  let stubbedRTCSessionConnect;
  let stubbedReplaceTrack;
  let factoryGet;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, stubbedRTCSessionConnect, stubbedReplaceTrack } = installCommonMocks());
    factoryGet = jest.fn().mockReturnValue('factory-pc');
    connect.RtcPeerConnectionFactory.mockImplementation(function () {
      this.close = jest.fn();
      this.get = factoryGet;
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('uses session.connect(rtcPeerConnectionFactory.get(iceServers)) when factory present and no PCM', () => {
    const sm = new connect.SoftphoneManager();
    sm.rtcPeerConnectionManager = null;
    // _initiateRtcPeerConnectionManager nulls the factory during construction; re-attach.
    sm.rtcPeerConnectionFactory = { get: factoryGet, close: jest.fn() };

    const contact = makeContact('legacy-rtc-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('legacy-rtc-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });

    const originalV2 = connect.RtcPeerConnectionManagerV2;
    connect.RtcPeerConnectionManagerV2 = undefined;
    const originalV1 = connect.RtcPeerConnectionManager;
    connect.RtcPeerConnectionManager = undefined;
    try {
      sm.startSession(contact, 'legacy-rtc-conn');
      expect(connect.RTCSession).toHaveBeenCalled();
      expect(stubbedRTCSessionConnect).toHaveBeenCalledWith('factory-pc');
    } finally {
      connect.RtcPeerConnectionManagerV2 = originalV2;
      connect.RtcPeerConnectionManager = originalV1;
    }
  });

  it('uses session.connect() (no args) when neither PCM nor factory present', () => {
    const sm = new connect.SoftphoneManager();
    sm.rtcPeerConnectionFactory = null;
    sm.rtcPeerConnectionManager = null;
    const contact = makeContact('legacy-rtc-noFactory', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('legacy-rtc-noFactory-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });

    const originalV2 = connect.RtcPeerConnectionManagerV2;
    connect.RtcPeerConnectionManagerV2 = undefined;
    const originalV1 = connect.RtcPeerConnectionManager;
    connect.RtcPeerConnectionManager = undefined;
    try {
      sm.startSession(contact, 'legacy-rtc-noFactory-conn');
      expect(stubbedRTCSessionConnect).toHaveBeenCalledWith();
    } finally {
      connect.RtcPeerConnectionManagerV2 = originalV2;
      connect.RtcPeerConnectionManager = originalV1;
    }
  });

  it('passes rtcJsStrategy positional arg to RTCSession when set (no PCM path)', () => {
    jest.spyOn(connect, 'CitrixVDIStrategy').mockImplementation(function () {
      this.getStrategyName = () => 'CitrixVDIStrategy';
    });
    const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
    sm.rtcPeerConnectionManager = null;
    const contact = makeContact('legacy-rtc-vdi', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('legacy-rtc-vdi-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });

    const originalV2 = connect.RtcPeerConnectionManagerV2;
    connect.RtcPeerConnectionManagerV2 = undefined;
    const originalV1 = connect.RtcPeerConnectionManager;
    connect.RtcPeerConnectionManager = undefined;
    try {
      sm.startSession(contact, 'legacy-rtc-vdi-conn');
      // 8th positional arg of RTCSession is the rtcJsStrategy when set.
      const ctorCall = connect.RTCSession.mock.calls.at(-1);
      expect(ctorCall.length).toBe(8);
      expect(ctorCall[7]).toBeDefined();
      expect(ctorCall[7].getStrategyName()).toBe('CitrixVDIStrategy');
    } finally {
      connect.RtcPeerConnectionManagerV2 = originalV2;
      connect.RtcPeerConnectionManager = originalV1;
    }
  });
});

describe('SoftphoneManager - fetchUserMedia branches', () => {
  let bus;
  let originalMediaDevices;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    originalMediaDevices = navigator.mediaDevices;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: originalMediaDevices,
    });
    commonAfterEach();
    jest.useRealTimers();
  });

  it('falls back to webkitGetUserMedia when navigator.mediaDevices.getUserMedia is unavailable', async () => {
    const webkitGUM = jest.fn((_constraint, success) =>
      success({ getAudioTracks: () => [{ kind: 'audio', enabled: true }] })
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: { addEventListener: jest.fn(), enumerateDevices: jest.fn() },
    });
    Object.defineProperty(navigator, 'webkitGetUserMedia', {
      configurable: true,
      writable: true,
      value: webkitGUM,
    });

    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);

    expect(webkitGUM).toHaveBeenCalled();
    delete navigator.webkitGetUserMedia;
  });

  it('publishes UNSUPPORTED_BROWSER when neither mediaDevices.getUserMedia nor webkitGetUserMedia is present', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: { addEventListener: jest.fn(), enumerateDevices: jest.fn() },
    });
    delete navigator.webkitGetUserMedia;

    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
      expect.any(String),
      expect.any(String)
    );
  });
});

describe('SoftphoneManager - publishTelemetryEvent error path', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    installCommonMocks();
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('does not throw when connect.publishMetric throws (publishTelemetryEvent catch)', () => {
    connect.publishMetric.mockImplementation(() => {
      throw new Error('metric publish failed');
    });
    expect(() => new connect.SoftphoneManager()).not.toThrow();
  });
});
