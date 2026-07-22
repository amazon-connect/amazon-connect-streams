// Jest port of #connect.core.initCCP() describe and its inner sub-describes.

const {
  commonAfterEach,
  defaultRingtoneUrl,
  makeContainerDiv,
  setLocation,
} = require('./core-test-helpers');

const setupInitCCPParams = () => {
  const softphoneParams = { ringtoneUrl: 'customVoiceRingtone.amazon.com' };
  const chatParams = { ringtoneUrl: 'customChatRingtone.amazon.com' };
  const taskParams = { ringtoneUrl: 'customTaskRingtone.amazon.com' };
  const autoAcceptToneParams = { ringtoneUrl: 'customAutoAcceptTone.amazon.com' };
  const logConfigParams = { echoLevel: 'warn', logLevel: 'info' };
  const pageOptionsParams = {
    enableAudioDeviceSettings: false,
    enableVideoDeviceSettings: false,
    enablePhoneTypeSettings: true,
  };
  return {
    ccpUrl: 'url.com',
    loginUrl: 'loginUrl.com',
    softphone: softphoneParams,
    chat: chatParams,
    task: taskParams,
    autoAcceptTone: autoAcceptToneParams,
    loginOptions: { autoClose: true },
    logConfig: logConfigParams,
    pageOptions: pageOptionsParams,
    shouldAddNamespaceToLogs: false,
    showInactivityModal: true,
  };
};

const setupInitCCPCommon = () => {
  setLocation('http://localhost');
  jest.useFakeTimers();
  jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
  jest.spyOn(connect, 'UpstreamConduitClient').mockImplementation(function () {});
  jest.spyOn(connect, 'UpstreamConduitMasterClient').mockImplementation(function () {});
  jest.spyOn(connect, 'isFramed').mockReturnValue(true);
  jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});
  // Stub every ringtone engine constructor: the real RingtoneEngineBase
  // constructs an Audio() and schedules a setOutputDevice promise that
  // rejects in jsdom (audio not found), surfacing as an unhandled rejection.
  jest.spyOn(connect, 'VoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AdditionalVoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'QueueCallbackRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'ChatRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'TaskRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'EmailRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AutoAcceptedRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(document, 'createElement');
  jest.spyOn(connect.core, '_refreshIframeOnTimeout').mockImplementation(() => {});
  jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({
    clear: jest.fn(),
    open: jest.fn().mockReturnValue({ close: jest.fn() }),
  });
  jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({ getAgentData: () => ({}) });
  connect.numberOfConnectedCCPs = 0;
  connect.agent.initialized = true;
  connect.core.eventBus = new connect.EventBus({ logEvents: true });
};

describe('connect.core.initCCP() - basic initialization', () => {
  let containerDiv;
  let params;

  beforeEach(() => {
    setupInitCCPCommon();
    containerDiv = makeContainerDiv();
    params = setupInitCCPParams();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('initializes CCP - creates an iframe and appends to the container', () => {
    connect.core.initCCP(containerDiv, params);

    expect(params.ccpUrl).not.toBeNull();
    expect(containerDiv).not.toBeNull();
    expect(connect.core.checkNotInitialized).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalled();
    expect(containerDiv.appendChild).toHaveBeenCalledTimes(1);
  });

  it('replicates new logs received upstream and ignores duplicates by loggerId', () => {
    connect.core.initCCP(containerDiv, params);
    const logger = connect.getLog();
    const loggerId = logger.getLoggerId();
    const originalLength = logger._logs.length;
    const newLogs = [
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some log', 'some-logger-id'),
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some log with no logger id', null),
      new connect.LogEntry('test', connect.LogLevel.INFO, 'some log info', 'some-logger-id'),
      new connect.LogEntry('test', connect.LogLevel.ERROR, 'some log error', 'some-logger-id'),
    ];
    const dupLogs = [
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some dup log', loggerId),
      new connect.LogEntry('test', connect.LogLevel.INFO, 'some dup log info', loggerId),
      new connect.LogEntry('test', connect.LogLevel.ERROR, 'some dup log error', loggerId),
    ];
    [...newLogs, ...dupLogs].forEach((log) => {
      connect.core.getUpstream().upstreamBus.trigger(connect.EventType.LOG, log);
    });

    jest.advanceTimersByTime(2000);
    expect(logger._logs).toHaveLength(originalLength + newLogs.length);
  });

  it('updates connected CCP counts on UPDATE_CONNECTED_CCPS', () => {
    connect.core.initCCP(containerDiv, params);
    expect(connect.numberOfConnectedCCPs).toBe(0);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
    expect(connect.numberOfConnectedCCPs).toBe(1);
  });

  it('multiple calls to initCCP do not append multiple CCP iframes', () => {
    connect.core.initCCP(containerDiv, params);
    jest.spyOn(window.document, 'getElementsByTagName').mockReturnValue([{ name: 'Amazon Connect CCP' }]);
    containerDiv.appendChild.mockClear();

    connect.core.initCCP(containerDiv, params);
    connect.core.initCCP(containerDiv, params);
    connect.core.initCCP(containerDiv, params);

    expect(containerDiv.appendChild).not.toHaveBeenCalled();
  });
});

describe('connect.core.initCCP() - CONFIGURE event drives ringtone init', () => {
  let containerDiv;
  let params;

  beforeEach(() => {
    setupInitCCPCommon();
    containerDiv = makeContainerDiv();
    params = setupInitCCPParams();
    connect.core.initCCP(containerDiv, params);
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('sets up ringtone engines on CONFIGURE event using initCCP params', () => {
    connect.core.initRingtoneEngines({
      ringtone: {
        voice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
        additionalVoice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
        chat: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
        task: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      },
    });
    const customParams = {
      softphone: { disabled: false, ringtoneUrl: 'custom-softphone.mp3' },
      ringtone: {
        chat: { disabled: false, ringtoneUrl: 'custom-chat.mp3' },
        task: { disabled: false, ringtoneUrl: 'custom-task.mp3' },
        queue_callback: { disabled: false, ringtoneUrl: 'custom-qcb.mp3' },
        additionalVoice: { disabled: false, ringtoneUrl: 'custom-softphone.mp3' },
      },
    };
    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, customParams);
    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
    const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
    masterFn();

    expect(connect.VoiceRingtoneEngine).toHaveBeenCalledWith(customParams.softphone);
    expect(connect.AdditionalVoiceRingtoneEngine).toHaveBeenCalledWith(customParams.ringtone.additionalVoice);
    expect(connect.ChatRingtoneEngine).toHaveBeenCalledWith(customParams.ringtone.chat);
  });
});

describe('connect.core.listenForConfigureRequest', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('sets up listener for REQUEST_CONFIGURE and responds with provided params', () => {
    const onUpstreamSpy = jest.fn();
    const sendUpstreamSpy = jest.fn();
    const conduit = { onUpstream: onUpstreamSpy, sendUpstream: sendUpstreamSpy };
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue(conduit);

    const params = { softphone: { ringtoneUrl: 'test-softphone.mp3' } };
    connect.core.listenForConfigureRequest(params, conduit, false);

    expect(onUpstreamSpy).toHaveBeenCalledTimes(1);
    expect(onUpstreamSpy).toHaveBeenCalledWith(connect.EventType.REQUEST_CONFIGURE, expect.any(Function));

    const requestHandler = onUpstreamSpy.mock.calls[0][1];
    requestHandler();

    expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.EventType.CONFIGURE, {
      softphone: { ringtoneUrl: 'test-softphone.mp3' },
      chat: undefined,
      task: undefined,
      autoAcceptTone: undefined,
      pageOptions: undefined,
      shouldAddNamespaceToLogs: undefined,
      disasterRecoveryOn: undefined,
      showInactivityModal: undefined,
    });
  });
});

describe('connect.core.initCCP() - on ACK', () => {
  let containerDiv;
  let params;
  let fakeOnInitHandler;

  beforeEach(() => {
    setupInitCCPCommon();
    jest.spyOn(connect.WindowIOStream.prototype, 'send').mockReturnValue(null);
    containerDiv = makeContainerDiv();
    params = setupInitCCPParams();
    connect.core.initCCP(containerDiv, params);
    fakeOnInitHandler = jest.fn();
    connect.core.onInitialized(fakeOnInitHandler);
    jest.spyOn(connect.core.getUpstream(), 'sendUpstream');
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('sets portStreamId on ACK', () => {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    expect(connect.core.portStreamId).toBe('portId');
  });

  it('triggers INIT event on first ACK', () => {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    expect(fakeOnInitHandler).toHaveBeenCalledTimes(1);
  });

  it('sends CONFIGURE event upstream with config params on ACK', () => {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    const configureCalls = connect.core.getUpstream().sendUpstream.mock.calls
      .filter(([event]) => event === connect.EventType.CONFIGURE);
    expect(configureCalls.length).toBeGreaterThan(0);
    const payload = configureCalls[0][1];
    expect(payload.softphone).toEqual(params.softphone);
    expect(payload.chat).toEqual(params.chat);
    expect(payload.task).toEqual(params.task);
    expect(payload.autoAcceptTone).toEqual(params.autoAcceptTone);
    expect(payload.pageOptions).toEqual(params.pageOptions);
    expect(payload.shouldAddNamespaceToLogs).toBe(params.shouldAddNamespaceToLogs);
    expect(payload.showInactivityModal).toBe(params.pageOptions?.showInactivityModal);
  });

  it('does NOT send INIT_DISASTER_RECOVERY upstream when DR is off', () => {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    const sentEvents = connect.core.getUpstream().sendUpstream.mock.calls.map(([event]) => event);
    expect(sentEvents).not.toContain(connect.DisasterRecoveryEvents.INIT_DISASTER_RECOVERY);
  });
});

describe('connect.core.initCCP() - on ACK_TIMEOUT and openPopupWithLock', () => {
  let containerDiv;
  let params;
  const popupIntervalTime = 1000;

  beforeEach(() => {
    setupInitCCPCommon();
    containerDiv = makeContainerDiv();
    params = setupInitCCPParams();
    connect.core.initCCP(containerDiv, params);
  });

  afterEach(() => {
    if (navigator.locks) delete navigator.locks;
    connect.core._shouldHoldPopupLock = undefined;
    connect.core.loginWindow = null;
    jest.useRealTimers();
    commonAfterEach();
  });

  it('calls _refreshIframeOnTimeout on ACK_TIMEOUT', () => {
    const openPopupWithLockSpy = jest.spyOn(connect.core, '_openPopupWithLock');
    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);

    expect(connect.core._refreshIframeOnTimeout).toHaveBeenCalledTimes(1);
    expect(openPopupWithLockSpy).toHaveBeenCalledTimes(1);
  });

  it('clears iframe refresh timeout, popupManager.clear, and loginWindow.close on ACK after ACK_TIMEOUT', () => {
    const closeSpy = jest.fn();
    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
    connect.core.loginWindow = { close: closeSpy };

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });

    expect(connect.core.iframeRefreshTimeout).toBeNull();
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(connect.core.loginWindow).toBeNull();
  });

  it('calls navigator.locks.request with correct parameters', () => {
    const requestSpy = jest.fn();
    navigator.locks = { request: requestSpy };

    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);

    expect(requestSpy).toHaveBeenCalledWith(
      'connect-login-popup-lockloginUrl.com',
      { mode: 'exclusive', ifAvailable: true },
      expect.any(Function)
    );
  });

  it('opens popup when no other tab holds the lock', () => {
    navigator.locks = {
      request: (_name, _opts, cb) => cb(true),
    };
    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);

    expect(connect.core._shouldHoldPopupLock).toBe(true);
    expect(connect.core.loginWindow).toBeTruthy();
  });

  it('does not open popup when another tab holds the lock', () => {
    navigator.locks = {
      request: (_name, _opts, cb) => cb(false),
    };
    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);

    expect(connect.core._shouldHoldPopupLock).toBeFalsy();
    expect(connect.core.loginWindow).toBeFalsy();
  });

  it('opens popup when Web Lock API is not supported (request throws)', () => {
    navigator.locks = {
      request: () => { throw new Error('Not supported'); },
    };
    connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);

    expect(connect.core.loginWindow).toBeTruthy();
    // The web-lock-throws path never sets _shouldHoldPopupLock; falsy is enough
    // (resetCoreState pre-zeros it to false).
    expect(connect.core._shouldHoldPopupLock).toBeFalsy();
  });
});

describe('connect.core.setupAuthenticationEventHandlers - authenticate event subscriptions', () => {
  let containerDiv;
  let conduit;
  let authenticateSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    containerDiv = makeContainerDiv();
    conduit = { sendUpstream: jest.fn() };
    authenticateSpy = jest.spyOn(connect.core, 'authenticate').mockImplementation(() => {});
    connect.agent.initialized = true;
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  describe('when disableAuthPopupAfterLogout is NOT set', () => {
    it('subscribes to TERMINATED and calls authenticate after CCP_ACK_TIMEOUT (3s default)', () => {
      const params = { ccpUrl: 'url.com', loginOptions: {} };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.TERMINATED);
      jest.advanceTimersByTime(3000);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(authenticateSpy).toHaveBeenCalledWith(params, containerDiv, conduit);
    });

    it('subscribes to AUTH_FAIL and calls authenticate after CCP_ACK_TIMEOUT (3s default)', () => {
      const params = { ccpUrl: 'url.com', loginOptions: {} };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
      jest.advanceTimersByTime(3000);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(authenticateSpy).toHaveBeenCalledWith(params, containerDiv, conduit);
    });

    it('uses ccpAckTimeout init param when provided (TERMINATED)', () => {
      const params = { ccpUrl: 'url.com', loginOptions: {}, ccpAckTimeout: 1000 };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.TERMINATED);
      jest.advanceTimersByTime(1000);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
    });

    it('uses ccpAckTimeout init param when provided (AUTH_FAIL)', () => {
      const params = { ccpUrl: 'url.com', loginOptions: {}, ccpAckTimeout: 1000 };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
      jest.advanceTimersByTime(1000);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
    });

    it('subscribes to both events when disableAuthPopupAfterLogout is false', () => {
      const params = { ccpUrl: 'url.com', loginOptions: { disableAuthPopupAfterLogout: false } };
      const subscribeSpy = jest.spyOn(connect.core.eventBus, 'subscribe');
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);

      const events = subscribeSpy.mock.calls.map(([eventName]) => eventName);
      expect(events).toContain(connect.EventType.TERMINATED);
      expect(events).toContain(connect.EventType.AUTH_FAIL);
    });
  });

  describe('when disableAuthPopupAfterLogout IS set', () => {
    it('does NOT subscribe to TERMINATED or AUTH_FAIL events', () => {
      const params = { ccpUrl: 'url.com', loginOptions: { disableAuthPopupAfterLogout: true } };
      const subscribeSpy = jest.spyOn(connect.core.eventBus, 'subscribe');
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);

      const events = subscribeSpy.mock.calls.map(([eventName]) => eventName);
      expect(events).not.toContain(connect.EventType.TERMINATED);
      expect(events).not.toContain(connect.EventType.AUTH_FAIL);
    });

    it('does NOT call authenticate when TERMINATED is triggered', () => {
      const params = { ccpUrl: 'url.com', loginOptions: { disableAuthPopupAfterLogout: true } };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.TERMINATED);
      jest.runAllTimers();
      expect(authenticateSpy).not.toHaveBeenCalled();
    });

    it('does NOT call authenticate when AUTH_FAIL is triggered', () => {
      const params = { ccpUrl: 'url.com', loginOptions: { disableAuthPopupAfterLogout: true } };
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
      connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
      jest.runAllTimers();
      expect(authenticateSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('subscribes to events when loginOptions is undefined', () => {
      const params = { ccpUrl: 'url.com' };
      const subscribeSpy = jest.spyOn(connect.core.eventBus, 'subscribe');
      connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);

      const events = subscribeSpy.mock.calls.map(([eventName]) => eventName);
      expect(events).toContain(connect.EventType.TERMINATED);
      expect(events).toContain(connect.EventType.AUTH_FAIL);
    });
  });
});


// ----------------------------------------------------------------------------
// initCCP ACK publishMetric block (lines 2053-2089) and IFRAME_RETRIES_EXHAUSTED
// handler (2115-2141). These run when iframe init succeeds or fails.
// ----------------------------------------------------------------------------
describe('connect.core.initCCP() - publishMetric paths after ACK', () => {
  let containerDiv;
  let params;
  let publishMetricSpy;

  beforeEach(() => {
    setupInitCCPCommon();
    publishMetricSpy = jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
    jest.spyOn(connect.WindowIOStream.prototype, 'send').mockReturnValue(null);
    containerDiv = makeContainerDiv();
    params = setupInitCCPParams();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('publishes IFRAME_INITIALIZATION_SUCCESS + IFRAME_REFRESH_ATTEMPTS + IFRAME_INITIALIZATION_TIME after ACK', () => {
    connect.core.initCCP(containerDiv, params);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    jest.advanceTimersByTime(1100);

    const metricNames = publishMetricSpy.mock.calls.map(([m]) => m.name);
    expect(metricNames).toEqual(
      expect.arrayContaining([
        'IframeRefreshAttempts',
        'IframeInitializationSuccess',
        'IframeInitializationTime',
      ])
    );
  });

  it('publishes _DR metrics on ACK when disasterRecoveryOn=true', () => {
    const drParams = { ...params, disasterRecoveryOn: true };
    connect.core.initCCP(containerDiv, drParams);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    jest.advanceTimersByTime(1100);

    const metricNames = publishMetricSpy.mock.calls.map(([m]) => m.name);
    expect(metricNames).toEqual(
      expect.arrayContaining([
        'IframeRefreshAttemptsDr',
        'IframeInitializationSuccessDr',
        'IframeInitializationTimeDr',
      ])
    );
  });

  it('publishes IframeInitializationSuccess=0 when IFRAME_RETRIES_EXHAUSTED fires before ACK', () => {
    connect.core.initCCP(containerDiv, params);
    connect.core.iframeRefreshAttempt = 5;
    connect.core.getEventBus().trigger(connect.EventType.IFRAME_RETRIES_EXHAUSTED);

    const failureMetric = publishMetricSpy.mock.calls
      .map(([m]) => m)
      .find((m) => m.name === 'IframeInitializationSuccess');
    expect(failureMetric).toBeDefined();
    expect(failureMetric.data.count).toBe(0);
  });

  it('publishes _DR failure metrics when IFRAME_RETRIES_EXHAUSTED fires with disasterRecoveryOn=true', () => {
    const drParams = { ...params, disasterRecoveryOn: true };
    connect.core.initCCP(containerDiv, drParams);
    connect.core.iframeRefreshAttempt = 3;
    connect.core.getEventBus().trigger(connect.EventType.IFRAME_RETRIES_EXHAUSTED);

    const metricNames = publishMetricSpy.mock.calls.map(([m]) => m.name);
    expect(metricNames).toContain('IframeRefreshAttemptsDr');
    expect(metricNames).toContain('IframeInitializationSuccessDr');
  });

  it('honours params.onViewContact by subscribing it to ContactEvents.VIEW', () => {
    const onViewContact = jest.fn();
    connect.core.initCCP(containerDiv, { ...params, onViewContact });
    // Driving ACK so the initCCP body runs to the onViewContact subscription.
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    connect.core.getEventBus().trigger(connect.ContactEvents.VIEW, { contactId: 'c-1' });
    expect(onViewContact).toHaveBeenCalledTimes(1);
    expect(onViewContact.mock.calls[0][0]).toEqual({ contactId: 'c-1' });
  });

  it('updates connect.numberOfConnectedCCPs on UPDATE_CONNECTED_CCPS upstream after ACK', () => {
    connect.core.initCCP(containerDiv, params);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    connect.numberOfConnectedCCPs = 0;
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, {
      length: 3,
    });
    expect(connect.numberOfConnectedCCPs).toBe(3);
  });

  it('updates connect.core.voiceIdDomainId on UPDATE_DOMAIN_ID upstream', () => {
    connect.core.initCCP(containerDiv, params);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    connect.core.voiceIdDomainId = null;
    connect.core
      .getUpstream()
      .upstreamBus.trigger(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, { domainId: 'voiceid-x' });
    expect(connect.core.voiceIdDomainId).toBe('voiceid-x');
  });

  it('replicates upstream LOG entries with a different loggerId into the local logger', () => {
    connect.core.initCCP(containerDiv, params);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    const logger = connect.getLog();
    const before = logger._logs.length;
    connect.core.getUpstream().upstreamBus.trigger(
      connect.EventType.LOG,
      new connect.LogEntry('test', connect.LogLevel.INFO, 'remote log', 'other-logger-id')
    );
    expect(logger._logs.length).toBeGreaterThan(before);
  });
});
