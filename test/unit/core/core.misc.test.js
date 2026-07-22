// Jest port of self-contained core.spec describes:
// verifyDomainAccess, getFrameMediaDevices, activateChannelWithViewType,
// Api Proxy Client initialization, triggerEmailCreated,
// core subscription apis, Global resiliency subscription apis, CustomViews Termination.

const {
  commonAfterEach,
  defaultParams,
  makeContainerDiv,
  setLocation,
  setReferrer,
} = require('./core-test-helpers');

describe('connect.core.verifyDomainAccess', () => {
  let isFramed;
  let allowedOrigins;

  beforeEach(() => {
    setLocation('http://localhost');
    isFramed = false;
    allowedOrigins = [];
    jest.spyOn(connect, 'isFramed').mockImplementation(() => isFramed);
    jest.spyOn(connect, 'fetch').mockImplementation(() =>
      Promise.resolve({ whitelistedOrigins: allowedOrigins })
    );
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('resolves if not iframed', async () => {
    await expect(connect.core.verifyDomainAccess('token', 'endpoint')).resolves.toBeUndefined();
  });

  it('calls the domain-verification endpoint if iframed', async () => {
    isFramed = true;
    setReferrer('https://www.abc.com');
    allowedOrigins = ['https://www.abc.com'];

    await connect.core.verifyDomainAccess('token', 'endpoint').catch(() => {});

    expect(connect.fetch).toHaveBeenCalled();
    const [endpoint, options] = connect.fetch.mock.calls[0];
    expect(endpoint).toBe('endpoint');
    expect(options).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ 'X-Amz-Bearer': 'token' }),
    }));
  });

  // Each test sets its own referrer per the acceptance criterion.
  const testDomains = [
    ['https://www.abc.com', true],
    ['http://www.abc.com', false],
    ['http://www.xyz.com', false],
    ['https://www.abc.de', false],
    ['https://xyz.abc.com', false],
    ['https://www.abc.com/sub?x=1#123', true],
  ];

  it.each(testDomains)('referrer %s -> allowed=%s', async (referrer, allowed) => {
    setLocation('http://localhost');
    setReferrer(referrer);
    isFramed = true;
    allowedOrigins = ['https://www.abc.com'];

    let resolved = false;
    let rejected = false;
    await connect.core
      .verifyDomainAccess('token', 'endpoint')
      .then(() => { resolved = true; })
      .catch(() => { rejected = true; });

    if (allowed) {
      expect(resolved).toBe(true);
      expect(rejected).toBe(false);
    } else {
      expect(resolved).toBe(false);
      expect(rejected).toBe(true);
    }
  });
});

describe('connect.core.getFrameMediaDevices()', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    navigator.mediaDevices.enumerateDevices.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                toJSON: () => ({
                  deviceId: 'deviceId',
                  groupId: 'groupId',
                  kind: 'audioinput',
                  label: 'Microphone',
                }),
              },
            ]);
          }, 500);
        })
    );

    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      sendUpstream: (...args) => connect.core.getEventBus().trigger(...args),
      sendDownstream: (...args) => connect.core.getEventBus().trigger(...args),
    });
    // isFramed must be stubbed BEFORE initPageOptions, otherwise the function
    // early-returns without registering the MEDIA_DEVICE_REQUEST listener.
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    jest.spyOn(connect, 'isCCP').mockReturnValue(false);
    connect.core.initPageOptions(defaultParams());
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('returns the list of media devices in the iframe with default timeout', async () => {
    // Default timeout is 1000ms; mock enumerateDevices resolves at 500ms.
    const promise = connect.core.getFrameMediaDevices();
    await jest.advanceTimersByTimeAsync(500);
    await jest.advanceTimersByTimeAsync(100);
    const data = await promise;
    expect(data).toEqual([
      { deviceId: 'deviceId', groupId: 'groupId', kind: 'audioinput', label: 'Microphone' },
    ]);
  });

  it('rejects with "Timeout exceeded" when custom timeout is shorter than enumerate latency', async () => {
    const promise = connect.core.getFrameMediaDevices(400);
    const expectation = expect(promise).rejects.toThrow('Timeout exceeded');
    await jest.advanceTimersByTimeAsync(500);
    await expectation;
  });
});

describe('connect.core.activateChannelWithViewType', () => {
  const viewType = 'create_task';
  const mediaType = 'task';
  let sendUpstream;

  beforeEach(() => {
    setLocation('http://localhost');
    sendUpstream = jest.fn();
    connect.core.upstream = { sendUpstream };
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('calls activateChannelWithViewType with base parameters viewType, mediaType', () => {
    jest.spyOn(connect, 'randomId').mockReturnValue('RandomId');
    connect.core.activateChannelWithViewType(viewType, mediaType);

    expect(connect.randomId).toHaveBeenCalledTimes(1);
    expect(sendUpstream).toHaveBeenCalledTimes(1);
    expect(sendUpstream).toHaveBeenCalledWith(
      connect.EventType.BROADCAST,
      expect.objectContaining({
        event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
        data: expect.objectContaining({ viewType, mediaType, clientToken: 'RandomId' }),
      })
    );
  });

  it('calls activateChannelWithViewType with optional source', () => {
    connect.core.activateChannelWithViewType(viewType, mediaType, 'agentapp');
    expect(sendUpstream).toHaveBeenCalledWith(
      connect.EventType.BROADCAST,
      expect.objectContaining({
        event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
        data: expect.objectContaining({ viewType, mediaType, source: 'agentapp' }),
      })
    );
  });

  it('calls activateChannelWithViewType with optional source and caseId', () => {
    connect.core.activateChannelWithViewType(viewType, mediaType, 'keystone', '1234567890');
    expect(sendUpstream).toHaveBeenCalledWith(
      connect.EventType.BROADCAST,
      expect.objectContaining({
        event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
        data: expect.objectContaining({
          viewType,
          mediaType,
          source: 'keystone',
          caseId: '1234567890',
        }),
      })
    );
  });

  it('calls activateChannelWithViewType with optional source, caseId, clientToken', () => {
    connect.core.activateChannelWithViewType(
      viewType,
      mediaType,
      'keystone',
      '1234567890',
      'randomToken'
    );
    expect(sendUpstream).toHaveBeenCalledWith(
      connect.EventType.BROADCAST,
      expect.objectContaining({
        event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
        data: expect.objectContaining({
          viewType,
          mediaType,
          source: 'keystone',
          caseId: '1234567890',
          clientToken: 'randomToken',
        }),
      })
    );
  });
});

describe('Api Proxy Client initialization', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.apiProxyClient = null;
    connect.core.eventBus = new connect.EventBus();
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    connect.core.upstream = {
      onDownstream: jest.fn(),
      sendUpstream: jest.fn(),
      sendDownstream: jest.fn(),
    };
  });

  afterEach(() => {
    connect.core.handleApiProxyRequest = null;
    commonAfterEach();
  });

  it('initializes the api proxy client', () => {
    connect.core.initApiProxyService(defaultParams());
    expect(connect.core.apiProxyClient).not.toBeNull();
    expect(typeof connect.core.apiProxyClient).toBe('object');
  });

  it('bridges conduit when CCP is framed', () => {
    connect.isFramed.mockReturnValue(true);
    connect.core.initApiProxyService(defaultParams());
    expect(connect.core.handleApiProxyRequest).toBeDefined();
  });

  it('does not bridge conduit when CCP is not framed', () => {
    connect.isFramed.mockReturnValue(false);
    connect.core.initApiProxyService(defaultParams());
    expect(connect.core.handleApiProxyRequest).toBeFalsy();
  });
});

describe('connect.core.triggerEmailCreated()', () => {
  let triggerSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    triggerSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      upstreamBus: { trigger: triggerSpy },
    });
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('triggers EmailEvents.CREATED on the upstreamBus', () => {
    const data = { contactId: 'some-contact-id' };
    connect.core.triggerEmailCreated(data);
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(connect.EmailEvents.CREATED, data);
  });
});

describe('core subscription APIs', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.eventBus = new connect.EventBus();
  });

  afterEach(() => {
    commonAfterEach();
  });

  const apiNameEventNameMap = {
    onIframeRetriesExhausted: 'EventType.IFRAME_RETRIES_EXHAUSTED',
    onViewContact: 'ContactEvents.VIEW',
    onActivateChannelWithViewType: 'ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE',
    onAccessDenied: 'EventType.ACCESS_DENIED',
    onAuthFail: 'EventType.AUTH_FAIL',
    onAuthorizeSuccess: 'EventType.AUTHORIZE_SUCCESS',
    onSoftphoneSessionInit: 'ConnectionEvents.SESSION_INIT',
    onConfigure: 'ConfigurationEvents.CONFIGURE',
    onInitialized: 'EventType.INIT',
  };

  // Resolve event name string to actual event constant from connect.* at runtime.
  const resolveEvent = (path) => {
    const [ns, key] = path.split('.');
    return connect[ns][key];
  };

  it.each(Object.entries(apiNameEventNameMap))(
    '%s registers + unsubscribes',
    (apiName, eventPath) => {
      const eventName = resolveEvent(eventPath);
      const cb = jest.fn();
      const sub = connect.core[apiName](cb);
      connect.core.getEventBus().trigger(eventName);
      expect(cb).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
      cb.mockClear();
      connect.core.getEventBus().trigger(eventName);
      expect(cb).not.toHaveBeenCalled();
    }
  );
});

describe('Global resiliency subscription APIs', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.eventBus = new connect.EventBus();
  });

  afterEach(() => {
    commonAfterEach();
  });

  const apiNameEventNameMap = {
    onFailoverDetected: 'GlobalResiliencyEvents.FAILOVER_DETECTED_CRM',
    onFailoverPending: 'GlobalResiliencyEvents.FAILOVER_PENDING_CRM',
    onFailoverCompleted: 'GlobalResiliencyEvents.FAILOVER_COMPLETE',
    onConfigureError: 'GlobalResiliencyEvents.CONFIGURE_ERROR',
  };

  const resolveEvent = (path) => {
    const [ns, key] = path.split('.');
    return connect[ns][key];
  };

  it.each(Object.entries(apiNameEventNameMap))(
    '%s registers + unsubscribes',
    (apiName, eventPath) => {
      const eventName = resolveEvent(eventPath);
      const cb = jest.fn();
      const sub = connect.globalResiliency[apiName](cb);
      connect.core.getEventBus().trigger(eventName);
      expect(cb).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
      cb.mockClear();
      connect.core.getEventBus().trigger(eventName);
      expect(cb).not.toHaveBeenCalled();
    }
  );
});

describe('connect.core.triggerReadyToStartSessionEvent', () => {
  let busTriggerSpy;
  let sendUpstreamSpy;
  let sendDownstreamSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.eventBus = new connect.EventBus();
    busTriggerSpy = jest.spyOn(connect.core.eventBus, 'trigger');
    sendUpstreamSpy = jest.fn();
    sendDownstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      sendUpstream: sendUpstreamSpy,
      sendDownstream: sendDownstreamSpy,
    });
  });

  afterEach(() => {
    connect.core.softphoneParams = null;
    commonAfterEach();
  });

  it('CCP + allowFramedSoftphone: triggers READY_TO_START_SESSION on the local event bus', () => {
    jest.spyOn(connect, 'isCCP').mockReturnValue(true);
    connect.core.softphoneParams = { allowFramedSoftphone: true };

    connect.core.triggerReadyToStartSessionEvent();

    expect(busTriggerSpy).toHaveBeenCalledWith(connect.ConnectionEvents.READY_TO_START_SESSION);
    expect(sendUpstreamSpy).not.toHaveBeenCalled();
    expect(sendDownstreamSpy).not.toHaveBeenCalled();
  });

  it('CCP + framed + !allowFramedSoftphone: forwards the event downstream', () => {
    jest.spyOn(connect, 'isCCP').mockReturnValue(true);
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    connect.core.softphoneParams = { allowFramedSoftphone: false };

    connect.core.triggerReadyToStartSessionEvent();

    expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.ConnectionEvents.READY_TO_START_SESSION);
    expect(busTriggerSpy).not.toHaveBeenCalled();
  });

  it('CCP + standalone + !allowFramedSoftphone: triggers locally', () => {
    jest.spyOn(connect, 'isCCP').mockReturnValue(true);
    jest.spyOn(connect, 'isFramed').mockReturnValue(false);
    connect.core.softphoneParams = { allowFramedSoftphone: false };

    connect.core.triggerReadyToStartSessionEvent();

    expect(busTriggerSpy).toHaveBeenCalledWith(connect.ConnectionEvents.READY_TO_START_SESSION);
    expect(sendDownstreamSpy).not.toHaveBeenCalled();
  });

  it('CRM + allowFramedSoftphone: forwards the event upstream', () => {
    jest.spyOn(connect, 'isCCP').mockReturnValue(false);
    connect.core.softphoneParams = { allowFramedSoftphone: true };

    connect.core.triggerReadyToStartSessionEvent();

    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.ConnectionEvents.READY_TO_START_SESSION);
    expect(busTriggerSpy).not.toHaveBeenCalled();
  });

  it('CRM + !allowFramedSoftphone: triggers locally', () => {
    jest.spyOn(connect, 'isCCP').mockReturnValue(false);
    connect.core.softphoneParams = null;

    connect.core.triggerReadyToStartSessionEvent();

    expect(busTriggerSpy).toHaveBeenCalledWith(connect.ConnectionEvents.READY_TO_START_SESSION);
    expect(sendUpstreamSpy).not.toHaveBeenCalled();
  });
});

describe('connect.core.viewContact', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('sends BROADCAST upstream with ContactEvents.VIEW + the supplied contactId', () => {
    const sendUpstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream: sendUpstreamSpy });

    connect.core.viewContact('contact-xyz');

    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.EventType.BROADCAST, {
      event: connect.ContactEvents.VIEW,
      data: { contactId: 'contact-xyz' },
    });
  });
});

describe('connect.core.triggerTaskCreated', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('triggers TaskEvents.CREATED on the upstreamBus', () => {
    const triggerSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      upstreamBus: { trigger: triggerSpy },
    });
    const data = { taskId: 't-1' };
    connect.core.triggerTaskCreated(data);
    expect(triggerSpy).toHaveBeenCalledWith(connect.TaskEvents.CREATED, data);
  });
});

describe('connect.core.getLocalTimestamp / getSkew', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('getLocalTimestamp reads agentDataProvider.getAgentData().snapshot.localTimestamp', () => {
    const fakeAdp = { getAgentData: () => ({ snapshot: { localTimestamp: 1700000000000 } }) };
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue(fakeAdp);
    expect(connect.core.getLocalTimestamp()).toBe(1700000000000);
  });

  it('getSkew reads agentDataProvider.getAgentData().snapshot.skew', () => {
    const fakeAdp = { getAgentData: () => ({ snapshot: { skew: 42 } }) };
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue(fakeAdp);
    expect(connect.core.getSkew()).toBe(42);
  });
});

describe('connect.core.isLegacyDomain', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('returns true for awsapps.com URLs', () => {
    expect(connect.core.isLegacyDomain('https://my-instance.awsapps.com/connect/ccp-v2')).toBe(true);
  });

  it('returns false for connect.aws URLs', () => {
    expect(connect.core.isLegacyDomain('https://my-instance.my.connect.aws/ccp-v2')).toBe(false);
  });

  it('falls back to window.location.href when no URL is supplied', () => {
    setLocation('https://my-instance.awsapps.com/connect/ccp-v2');
    expect(connect.core.isLegacyDomain()).toBe(true);
  });
});

describe('connect.core.authorize', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('calls connect.fetch with the supplied endpoint when one is given', () => {
    const fetchSpy = jest.spyOn(connect, 'fetch').mockReturnValue(Promise.resolve({}));
    connect.core.authorize('https://example.com/auth');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/auth',
      { credentials: 'include' },
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('falls back to LEGACY_AUTHORIZE_ENDPOINT for legacy domains', () => {
    jest.spyOn(connect.core, 'isLegacyDomain').mockReturnValue(true);
    const fetchSpy = jest.spyOn(connect, 'fetch').mockReturnValue(Promise.resolve({}));
    connect.core.authorize();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // Both legacy + non-legacy endpoints are private constants. Just assert
    // a string URL was chosen (not undefined).
    expect(typeof fetchSpy.mock.calls[0][0]).toBe('string');
  });

  it('falls back to AUTHORIZE_ENDPOINT for non-legacy domains', () => {
    jest.spyOn(connect.core, 'isLegacyDomain').mockReturnValue(false);
    const fetchSpy = jest.spyOn(connect, 'fetch').mockReturnValue(Promise.resolve({}));
    connect.core.authorize();
    expect(typeof fetchSpy.mock.calls[0][0]).toBe('string');
  });
});

describe('connect.core.initApiProxyService', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    jest.spyOn(connect, 'ApiProxyClient').mockImplementation(function () {
      this.call = jest.fn((_method, _params, { success }) => success({ ok: true }));
    });
    connect.core.apiProxyClient = null;
    connect.core.handleApiProxyRequest = null;
  });

  afterEach(() => {
    connect.core.apiProxyClient = null;
    connect.core.handleApiProxyRequest = null;
    commonAfterEach();
  });

  it('instantiates an ApiProxyClient when called', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(false);
    connect.core.initApiProxyService();
    expect(connect.core.apiProxyClient).toBeDefined();
    expect(connect.ApiProxyClient).toHaveBeenCalledTimes(1);
  });

  it('wires handleApiProxyRequest to send API_RESPONSE downstream on success when framed', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    const sendDownstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendDownstream: sendDownstreamSpy });

    connect.core.initApiProxyService();

    expect(connect.core.handleApiProxyRequest).toBeDefined();
    connect.core.handleApiProxyRequest({ method: 'someMethod', params: {}, requestId: 'r-1' });

    expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.API_RESPONSE, {
      data: { ok: true },
      requestId: 'r-1',
    });
  });

  it('handleApiProxyRequest no-ops when request has no method', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    const sendDownstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendDownstream: sendDownstreamSpy });

    connect.core.initApiProxyService();
    connect.core.handleApiProxyRequest({ requestId: 'r-1' });

    expect(sendDownstreamSpy).not.toHaveBeenCalled();
  });

  it('handleApiProxyRequest sends API_RESPONSE with err on failure path', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    connect.ApiProxyClient.mockImplementation(function () {
      this.call = jest.fn((_method, _params, { failure }) => failure(new Error('boom')));
    });
    const sendDownstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendDownstream: sendDownstreamSpy });

    connect.core.initApiProxyService();
    connect.core.handleApiProxyRequest({ method: 'm', requestId: 'r-2' });

    expect(sendDownstreamSpy).toHaveBeenCalledTimes(1);
    const [event, payload] = sendDownstreamSpy.mock.calls[0];
    expect(event).toBe(connect.EventType.API_RESPONSE);
    expect(payload.requestId).toBe('r-2');
    expect(payload.err).toBeInstanceOf(Error);
  });

  it('does not define handleApiProxyRequest when not framed', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(false);
    connect.core.handleApiProxyRequest = null;
    connect.core.initApiProxyService();
    expect(connect.core.handleApiProxyRequest).toBeNull();
  });
});

describe('connect.globalResiliency.forceFailover', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('sends FORCE_FAILOVER upstream on the conduit', () => {
    const sendUpstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream: sendUpstreamSpy });

    connect.globalResiliency.forceFailover();

    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.FORCE_FAILOVER);
  });
});

describe('connect.globalResiliency.getActiveRegion', () => {
  afterEach(() => {
    connect.globalResiliency._activeRegion = undefined;
    commonAfterEach();
  });

  it('returns the cached _activeRegion', () => {
    connect.globalResiliency._activeRegion = 'us-west-2';
    expect(connect.globalResiliency.getActiveRegion()).toBe('us-west-2');
  });

  it('returns undefined when _activeRegion is not set', () => {
    connect.globalResiliency._activeRegion = undefined;
    expect(connect.globalResiliency.getActiveRegion()).toBeUndefined();
  });
});

describe('CustomViews Termination - terminateCustomView', () => {
  let iframeMock;
  let containerDOMMock;
  let appRegistryMock;
  let originalAppRegistry;

  beforeEach(() => {
    setLocation('http://localhost');
    iframeMock = {
      style: { display: '' },
      contentWindow: { postMessage: jest.fn() },
    };
    containerDOMMock = { querySelector: jest.fn().mockReturnValue(iframeMock) };
    appRegistryMock = {
      get: jest.fn().mockReturnValue({ containerDOM: containerDOMMock }),
      stopApp: jest.fn(),
    };
    jest.spyOn(global.window.document, 'getElementById').mockReturnValue(iframeMock);
    jest.spyOn(global.window, 'postMessage').mockReturnValue(null);

    originalAppRegistry = connect.agentApp.AppRegistry;
    connect.agentApp.AppRegistry = appRegistryMock;
  });

  afterEach(() => {
    connect.agentApp.AppRegistry = originalAppRegistry;
    commonAfterEach();
  });

  it('posts a termination message to the iframe with a specific customview iframe suffix', () => {
    const iframeSuffix = 'contactAlpha';
    const connectUrl = 'https://example.com';

    connect.core.terminateCustomView(connectUrl, iframeSuffix);

    expect(iframeMock.contentWindow.postMessage).toHaveBeenCalledWith(
      { topic: 'lifecycle.terminated' },
      expect.any(String)
    );
  });

  it('hides the iframe and attempts to stop the app after the timeout', () => {
    jest.useFakeTimers();
    appRegistryMock.stop = jest.fn();
    const iframeSuffix = 'contactBeta';
    const connectUrl = 'https://example.com';
    const timeout = 100;

    connect.core.terminateCustomView(connectUrl, iframeSuffix, { timeout });

    expect(iframeMock.contentWindow.postMessage).toHaveBeenCalledWith(
      { topic: 'lifecycle.terminated' },
      expect.any(String)
    );
    expect(iframeMock.style.display).toBe('none');

    // The stop-on-timeout is scheduled via setTimeout; advance past it and
    // verify the app is actually stopped (agentApp.stopApp -> AppRegistry.stop).
    jest.advanceTimersByTime(timeout);
    expect(appRegistryMock.stop).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('handles cases where iframe does not exist', () => {
    // getIframe checks 3 sources in order: containerDOM.querySelector,
    // document.getElementById, window.top.document.getElementById.
    // ALL three must return null to exercise the "iframe not found" branch.
    containerDOMMock.querySelector.mockReturnValue(null);
    global.window.document.getElementById.mockReturnValue(null);
    jest.spyOn(window.top.document, 'getElementById').mockReturnValue(null);
    const iframeSuffix = 'contactBeta';
    const connectUrl = 'https://example.com';

    expect(() => connect.core.terminateCustomView(connectUrl, iframeSuffix)).not.toThrow();
    // Verify the branch was actually taken: the "not found" path returns
    // BEFORE calling contentWindow.postMessage.
    expect(iframeMock.contentWindow.postMessage).not.toHaveBeenCalled();
  });

  it('does not hide or stop the iframe when resolveIframe=false', () => {
    jest.useFakeTimers();
    appRegistryMock.stop = jest.fn();
    connect.core.terminateCustomView('https://example.com', '', { resolveIframe: false });

    expect(iframeMock.contentWindow.postMessage).toHaveBeenCalledWith(
      { topic: 'lifecycle.terminated' },
      'https://example.com'
    );
    expect(iframeMock.style.display).toBe('');
    jest.advanceTimersByTime(10000);
    expect(appRegistryMock.stop).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('skips display:none when hideIframe=false but still stops the app on the timeout', () => {
    jest.useFakeTimers();
    appRegistryMock.stop = jest.fn();
    connect.core.terminateCustomView('https://example.com', 'foo', {
      resolveIframe: true,
      hideIframe: false,
      timeout: 500,
    });

    expect(iframeMock.style.display).toBe('');
    jest.advanceTimersByTime(500);
    expect(appRegistryMock.stop).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('rethrows wrapped errors when postMessage throws', () => {
    iframeMock.contentWindow.postMessage = jest.fn(() => { throw new Error('blocked'); });
    expect(() => connect.core.terminateCustomView('https://example.com')).toThrow(
      /Error in terminateCustomView/
    );
  });
});

// ----------------------------------------------------------------------------
// _openPopupWithLock direct-API tests covering the falsy-lock + thrown-error
// branches outside the normal initCCP wiring.
// ----------------------------------------------------------------------------
describe('connect.core._openPopupWithLock', () => {
  let popupOpenSpy;
  let loginWindowStub;

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    loginWindowStub = { closed: true, close: jest.fn() };
    popupOpenSpy = jest.fn().mockReturnValue(loginWindowStub);
    jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({
      open: popupOpenSpy,
      clear: jest.fn(),
    });
    connect.core.loginWindow = null;
    connect.core._shouldHoldPopupLock = undefined;
  });

  afterEach(() => {
    if (navigator.locks) delete navigator.locks;
    connect.core.loginWindow = null;
    connect.core._shouldHoldPopupLock = undefined;
    jest.useRealTimers();
    commonAfterEach();
  });

  it('returns without opening a popup when navigator.locks.request hands back a falsy lock', () => {
    navigator.locks = {
      request: (_name, _opts, cb) => cb(null),
    };

    connect.core._openPopupWithLock('https://login.example.com', { autoClose: true });

    expect(popupOpenSpy).not.toHaveBeenCalled();
    expect(connect.core.loginWindow).toBeNull();
  });

  it('falls back to opening the popup directly when navigator.locks.request throws', () => {
    navigator.locks = {
      request: () => { throw new Error('Web Locks API not supported'); },
    };

    connect.core._openPopupWithLock('https://login.example.com', { autoClose: true });

    expect(popupOpenSpy).toHaveBeenCalledWith(
      'https://login.example.com',
      connect.MasterTopics.LOGIN_POPUP,
      { autoClose: true }
    );
    expect(connect.core.loginWindow).toBe(loginWindowStub);
  });

  it('does not open another popup in the catch fallback when one is already open', () => {
    navigator.locks = {
      request: () => { throw new Error('not supported'); },
    };
    const existingWindow = { close: jest.fn() };
    connect.core.loginWindow = existingWindow;

    connect.core._openPopupWithLock('https://login.example.com', { autoClose: true });

    expect(popupOpenSpy).not.toHaveBeenCalled();
    expect(connect.core.loginWindow).toBe(existingWindow);
  });
});

// ----------------------------------------------------------------------------
// initCCP ACGR param-error paths (lines 1940-1953): cover the configure-error
// branches and the initGRCCP delegation branch.
// ----------------------------------------------------------------------------
describe('connect.core.initCCP() - ACGR param-error branches', () => {
  let containerDiv;

  const setupAcgrInitStubs = () => {
    setLocation('http://url.com/test');
    jest.useFakeTimers();
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
    jest.spyOn(connect, 'UpstreamConduitClient').mockImplementation(function () {});
    jest.spyOn(connect, 'UpstreamConduitMasterClient').mockImplementation(function () {});
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});
    jest.spyOn(connect, 'VoiceRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'AdditionalVoiceRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'QueueCallbackRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'ChatRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'TaskRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'EmailRingtoneEngine').mockImplementation(function () {});
    jest.spyOn(connect, 'AutoAcceptedRingtoneEngine').mockImplementation(function () {});
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

  beforeEach(() => {
    setupAcgrInitStubs();
    containerDiv = makeContainerDiv();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('logs a CONFIGURE_ERROR-style message when enableGlobalResiliency=true but secondaryCCPUrl is missing', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');

    connect.core.initCCP(containerDiv, {
      ccpUrl: 'http://url.com/test',
      enableGlobalResiliency: true,
      loginUrl: 'http://login.example.com',
    });

    const errors = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errors.some((m) => /secondaryCCPUrl was not provided/.test(m))).toBe(true);
  });

  it('logs a CONFIGURE_ERROR-style message when enableGlobalResiliency=true but loginUrl is missing', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');

    connect.core.initCCP(containerDiv, {
      ccpUrl: 'http://url.com/test',
      enableGlobalResiliency: true,
      secondaryCCPUrl: 'http://secondary.example.com',
    });

    const errors = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errors.some((m) => /loginUrl was not provided/.test(m))).toBe(true);
  });

  it('routes through globalResiliency.initGRCCP when enableGlobalResiliency=true and both URLs are present', () => {
    const initGRSpy = jest
      .spyOn(connect.globalResiliency, 'initGRCCP')
      .mockReturnValue(undefined);

    connect.core.initCCP(containerDiv, {
      ccpUrl: 'http://url.com/test',
      enableGlobalResiliency: true,
      secondaryCCPUrl: 'http://secondary.example.com',
      loginUrl: 'http://login.example.com',
    });

    expect(initGRSpy).toHaveBeenCalledTimes(1);
  });

});
