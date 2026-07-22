// Jest port of the initSoftphoneManager describe.

const {
  commonAfterEach,
  defaultRingtoneUrl,
  setLocation,
} = require('./core-test-helpers');

const voiceEnabledConfig = {
  configuration: { routingProfile: { channelConcurrencyMap: { CHAT: 0, VOICE: 1 } } },
};
const voiceDisabledConfig = {
  configuration: { routingProfile: { channelConcurrencyMap: { CHAT: 1, VOICE: 0 } } },
};

const setupCommon = () => {
  setLocation('http://localhost');
  connect.core.eventBus = new connect.EventBus();
  connect.agent.initialized = true;

  jest.spyOn(connect.core, 'getAgentDataProvider');
  jest.spyOn(connect, 'ifMaster');
  jest.spyOn(connect.Agent.prototype, 'isSoftphoneEnabled');
  jest.spyOn(connect, 'isFramed');
  jest.spyOn(connect, 'isCCP');
  // SoftphoneManager constructor stub - returns {} so `new` produces a usable obj.
  jest.spyOn(connect, 'SoftphoneManager').mockImplementation(function () {});
  jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
    sendUpstream: jest.fn(),
    sendDownstream: jest.fn(),
    onUpstream: jest.fn(),
  });
  jest.spyOn(connect, 'becomeMaster').mockImplementation(() => {});
  jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
  jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(null);
  jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
  jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
};

describe('connect.core.initSoftphoneManager - standalone CCP', () => {
  beforeEach(() => {
    setupCommon();
    connect.isFramed.mockReturnValue(false);
    connect.isCCP.mockReturnValue(true);

    connect.core.softphoneManager = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('creates SoftphoneManager on first agent refresh when this tab is master', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).toHaveBeenCalledTimes(1);
  });

  it('does NOT create SoftphoneManager when the voice channel is not enabled', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceDisabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).not.toHaveBeenCalled();
  });

  it('does NOT create SoftphoneManager when this tab is not the master', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, _fTrue, fElse) => fElse && fElse());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).not.toHaveBeenCalled();
  });

  it('does NOT create SoftphoneManager when the agent is configured for deskphone', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(false);

    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).not.toHaveBeenCalled();
  });

  it('does NOT create another SoftphoneManager when initSoftphoneManager is called twice', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager();
    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).toHaveBeenCalledTimes(1);
  });
});

describe('connect.core.initSoftphoneManager - embedded CCP', () => {
  const softphoneParams = { allowFramedSoftphone: true, ringtoneUrl: defaultRingtoneUrl };
  const softphoneParamsKey = `SoftphoneParamsStorage::${new URL('https://test-fra.awsapps.com/connect/home').origin}`;

  beforeEach(() => {
    setupCommon();
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);
    connect.isFramed.mockReturnValue(true);
    connect.isCCP.mockReturnValue(true);

    connect.core.softphoneManager = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  describe('embedded CCP refreshed (configure not delivered)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      connect.core.getUpstream.mockReturnValue({
        onUpstream: (event, fn) => connect.core.eventBus.subscribe(event, fn),
        upstreamBus: connect.core.eventBus,
        sendUpstream: jest.fn(),
        sendDownstream: jest.fn(),
      });
      window.localStorage.__proto__.getItem.mockReturnValue(JSON.stringify(softphoneParams));
      connect.core.initSoftphoneManager();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('uses stored softphone params when configure message is not delivered before timeout', () => {
      connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
      jest.advanceTimersByTime(2100);
      connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
      connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

      // Drive ifMaster's first callback (master path).
      const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
      masterFn();

      expect(window.localStorage.__proto__.getItem).toHaveBeenCalledWith(softphoneParamsKey);
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'EmbeddedCCPRefreshedWithoutInitCCP',
        data: { count: 1 },
      });
      expect(connect.SoftphoneManager).toHaveBeenCalled();
      expect(connect.SoftphoneManager.mock.instances.length).toBeGreaterThan(0);
    });

    it('does not use stored softphone params when configure message is delivered before timeout', () => {
      connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
      jest.advanceTimersByTime(99); // below 2000ms timeout
      connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
      connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
      connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
      const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
      masterFn();

      expect(connect.publishMetric).not.toHaveBeenCalled();
      expect(connect.SoftphoneManager).toHaveBeenCalled();
    });

    it('only listens for shared worker ACK to re-init the softphone manager', () => {
      connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE);
      connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
      connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
      connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
      const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
      masterFn();

      expect(connect.publishMetric).not.toHaveBeenCalled();
      expect(connect.SoftphoneManager).toHaveBeenCalled();
    });
  });

  it('pushes softphone params to localStorage on first embedded init', () => {
    window.localStorage.__proto__.getItem.mockReturnValue(null);
    connect.core.initSoftphoneManager();
    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
    const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
    masterFn();

    expect(window.localStorage.__proto__.setItem).toHaveBeenCalledWith(
      softphoneParamsKey,
      JSON.stringify(softphoneParams)
    );
    expect(connect.publishMetric).not.toHaveBeenCalled();
    expect(connect.SoftphoneManager).toHaveBeenCalled();
  });

  it('cleans up softphone params on every initCCP call', () => {
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
    const container = { appendChild: jest.fn() };
    connect.core.initCCP(container, {
      ccpUrl: 'ccpURL',
      softphone: { allowFramedSoftphone: true },
    });

    expect(window.localStorage.__proto__.removeItem).toHaveBeenCalledWith(softphoneParamsKey);
  });
});

describe('connect.core.initSoftphoneManager - called from CRM layer', () => {
  beforeEach(() => {
    setupCommon();
    connect.isFramed.mockReturnValue(false);
    connect.isCCP.mockReturnValue(false);

    connect.core.softphoneManager = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('creates SoftphoneManager when allowedFramedSoftphone is true', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).toHaveBeenCalledTimes(1);
  });

  it('creates SoftphoneManager even when allowedFramedSoftphone is false (CRM context)', () => {
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: false } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).toHaveBeenCalledTimes(1);
  });

  it('creates SoftphoneManager when CRM is embedded in an iframe', () => {
    connect.isFramed.mockReturnValue(true);
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: false } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(connect.SoftphoneManager).toHaveBeenCalledTimes(1);
  });
});

// ----------------------------------------------------------------------------
// Firefox-specific multi-tab event handlers (lines 924-988 in core.js).
// Production code wires these only when connect.isFirefoxBrowser()=true.
// ----------------------------------------------------------------------------
describe('connect.core.initSoftphoneManager - Firefox multi-tab event handlers', () => {
  beforeEach(() => {
    setupCommon();
    jest.spyOn(connect, 'isFirefoxBrowser').mockReturnValue(true);
    connect.core.getAgentDataProvider.mockReturnValue({ getAgentData: () => voiceEnabledConfig });
    connect.Agent.prototype.isSoftphoneEnabled.mockReturnValue(true);
    connect.isFramed.mockReturnValue(false);
    connect.isCCP.mockReturnValue(false);

    connect.core.softphoneManager = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('subscribes to MASTER_RESPONSE upstream and registers a READY_TO_START_SESSION handler when in Firefox', () => {
    const onUpstreamSpy = jest.fn();
    connect.core.getUpstream.mockReturnValue({
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
      onUpstream: onUpstreamSpy,
    });
    const subscribeSpy = jest.spyOn(connect.core.eventBus, 'subscribe');
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    const upstreamEvents = onUpstreamSpy.mock.calls.map(([eventName]) => eventName);
    expect(upstreamEvents).toContain(connect.EventType.MASTER_RESPONSE);
    const subscribedEvents = subscribeSpy.mock.calls.map(([eventName]) => eventName);
    expect(subscribedEvents).toContain(connect.ConnectionEvents.READY_TO_START_SESSION);
  });

  it('terminates softphone manager when MASTER_RESPONSE indicates another tab took over', () => {
    let masterResponseHandler;
    connect.core.getUpstream.mockReturnValue({
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
      onUpstream: (event, handler) => {
        if (event === connect.EventType.MASTER_RESPONSE) {
          masterResponseHandler = handler;
        }
      },
    });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.core.portStreamId = 'this-tab';
    const unsubSpy = jest.fn();
    connect.core.softphoneManager = { onInitContactSub: { unsubscribe: unsubSpy } };

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(typeof masterResponseHandler).toBe('function');
    masterResponseHandler({
      data: {
        topic: connect.MasterTopics.SOFTPHONE,
        takeOver: true,
        masterId: 'other-tab',
      },
    });

    expect(unsubSpy).toHaveBeenCalledTimes(1);
    expect(connect.core.softphoneManager).toBeUndefined();
  });

  it('ignores MASTER_RESPONSE when this tab is the master (masterId === portStreamId)', () => {
    let masterResponseHandler;
    connect.core.getUpstream.mockReturnValue({
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
      onUpstream: (event, handler) => {
        if (event === connect.EventType.MASTER_RESPONSE) {
          masterResponseHandler = handler;
        }
      },
    });
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());
    connect.core.portStreamId = 'this-tab';
    const unsubSpy = jest.fn();
    connect.core.softphoneManager = { onInitContactSub: { unsubscribe: unsubSpy } };

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    masterResponseHandler({
      data: {
        topic: connect.MasterTopics.SOFTPHONE,
        takeOver: true,
        masterId: 'this-tab',
      },
    });

    expect(unsubSpy).not.toHaveBeenCalled();
  });

  it('on READY_TO_START_SESSION as master, calls softphoneManager.startSession()', () => {
    connect.core.getUpstream.mockReturnValue({
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
      onUpstream: jest.fn(),
    });
    const startSessionSpy = jest.fn();
    connect.core.softphoneManager = { startSession: startSessionSpy };
    connect.ifMaster.mockImplementation((_topic, fTrue) => fTrue && fTrue());

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
    connect.core.getEventBus().trigger(connect.ConnectionEvents.READY_TO_START_SESSION);

    expect(startSessionSpy).toHaveBeenCalled();
  });

  it('on READY_TO_START_SESSION as non-master, calls becomeMaster and creates a new SoftphoneManager', () => {
    connect.core.getUpstream.mockReturnValue({
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
      onUpstream: jest.fn(),
    });
    const spStartSessionSpy = jest.fn();
    connect.SoftphoneManager.mockImplementation(function () {
      this.startSession = spStartSessionSpy;
    });
    // First, drop softphoneManager. Then arrange ifMaster to route into the
    // non-master (else) callback so the becomeMaster branch fires and
    // constructs a new SoftphoneManager.
    connect.core.softphoneManager = null;
    connect.ifMaster.mockImplementation((_topic, _fTrue, fFalse) => fFalse && fFalse());
    connect.becomeMaster.mockImplementation((_topic, cb) => cb && cb());

    connect.core.initSoftphoneManager({ softphone: { allowFramedSoftphone: true } });
    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
    connect.core.getEventBus().trigger(connect.ConnectionEvents.READY_TO_START_SESSION);

    expect(connect.becomeMaster).toHaveBeenCalledWith(
      connect.MasterTopics.SOFTPHONE,
      expect.any(Function)
    );
    // The becomeMaster success callback (production core.js:958-964) must
    // construct a new SoftphoneManager and call startSession() on it.
    expect(connect.SoftphoneManager).toHaveBeenCalled();
    expect(connect.core.softphoneManager).toBeDefined();
    expect(spStartSessionSpy).toHaveBeenCalled();
  });
});
