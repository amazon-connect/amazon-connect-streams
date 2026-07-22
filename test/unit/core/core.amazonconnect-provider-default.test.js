// Jest port of the no-provider branch of `initCCP starting AmazonConnectStreamsSite`.
//
// The original Mocha spec used `proxyquire` to swap in a stub
// AmazonConnectStreamsSite. We can't intercept the bundled
// `__webpack_require__("@amazon-connect/site-streams")` call, but the webpack
// runtime caches modules, so the real AmazonConnectStreamsSite class is the
// SAME object on every initCCP call. We let the first call run, capture
// `provider.constructor` (the real class), and spy on its static `init` and
// prototype `setCCPIframe`. Subsequent initCCP calls then route through our
// spies and we can drive the success / failure branches deterministically.

const {
  commonAfterEach,
  makeContainerDiv,
  setLocation,
} = require('./core-test-helpers');

const installInitCCPStubs = () => {
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
};

// Shared state: capture the real AmazonConnectStreamsSite class from the
// webpack module cache the first time initCCP runs. The class identity is
// stable across subsequent initCCP calls thanks to webpack's module cache.
let capturedSiteClass = null;

const ensureSiteClassCaptured = () => {
  if (capturedSiteClass) return capturedSiteClass;
  // Drive a real, unmocked initCCP once to populate
  // connect.core._amazonConnectProviderData.provider so we can grab its
  // constructor (the AmazonConnectStreamsSite class).
  setLocation('http://url.com/test');
  installInitCCPStubs();
  connect.agent.initialized = true;
  connect.core.eventBus = new connect.EventBus({ logEvents: true });
  const containerDiv = makeContainerDiv();
  connect.core.initCCP(containerDiv, { ccpUrl: 'http://url.com/test' });

  const provider = connect.core._amazonConnectProviderData?.provider;
  if (!provider) {
    throw new Error(
      'Could not capture AmazonConnectStreamsSite: provider was not set by initCCP. ' +
      'The bundled site-streams module may have errored at load.'
    );
  }
  capturedSiteClass = provider.constructor;
  // Reset state for the actual tests.
  connect.core._amazonConnectProviderData = null;
  connect.agent.initialized = false;
  connect.core.eventBus = null;
  jest.restoreAllMocks();
  return capturedSiteClass;
};

describe('connect.core.initCCP() - default path (real AmazonConnectStreamsSite)', () => {
  let containerDiv;
  let baseParams;
  let SiteClass;
  let stubProvider;

  beforeAll(() => {
    SiteClass = ensureSiteClassCaptured();
  });

  beforeEach(() => {
    setLocation('http://url.com/test');
    jest.useFakeTimers();
    installInitCCPStubs();
    connect.agent.initialized = true;
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    containerDiv = makeContainerDiv();
    baseParams = { ccpUrl: 'http://url.com/test' };
    // Give the stub an isolated prototype (fresh per test) rather than a plain
    // object literal. The "applies plugins" test grafts onto the provider's
    // prototype; a literal's prototype is Object.prototype, so that would
    // pollute every object in the environment.
    stubProvider = Object.create({ id: 'test-id' });
    stubProvider.setCCPIframe = jest.fn();
    connect.core._amazonConnectProviderData = null;
  });

  afterEach(() => {
    connect.core._amazonConnectProviderData = null;
    jest.useRealTimers();
    commonAfterEach();
  });

  it('initializes AmazonConnectStreamsSite via its static .init({ instanceUrl }) and stores the returned provider', () => {
    const initSpy = jest.spyOn(SiteClass, 'init').mockReturnValue({ provider: stubProvider });

    connect.core.initCCP(containerDiv, baseParams);

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith({ instanceUrl: 'http://url.com' });
    expect(connect.core._amazonConnectProviderData.provider).toBe(stubProvider);
    expect(connect.core._amazonConnectProviderData.isStreamsProvider).toBe(true);
  });

  it('exposes the AmazonConnectStreamsSite provider via getSDKClientConfig()', () => {
    jest.spyOn(SiteClass, 'init').mockReturnValue({ provider: stubProvider });

    connect.core.initCCP(containerDiv, baseParams);

    expect(connect.core.getSDKClientConfig().provider).toBe(stubProvider);
  });

  it('passes the freshly-created CCP iframe to provider.setCCPIframe()', () => {
    jest.spyOn(SiteClass, 'init').mockReturnValue({ provider: stubProvider });
    // Grab whatever iframe document.createElement('iframe') yields so we can
    // assert on it without coupling to internal field names.
    const createElementSpy = jest.spyOn(document, 'createElement');

    connect.core.initCCP(containerDiv, baseParams);

    const iframeReturn = createElementSpy.mock.results.find(
      (r) => createElementSpy.mock.calls[createElementSpy.mock.results.indexOf(r)][0] === 'iframe'
    );
    expect(iframeReturn).toBeDefined();
    expect(stubProvider.setCCPIframe).toHaveBeenCalledTimes(1);
    expect(stubProvider.setCCPIframe).toHaveBeenCalledWith(iframeReturn.value);
  });

  it('logs an error and swallows when AmazonConnectStreamsSite.init throws', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    jest.spyOn(SiteClass, 'init').mockImplementation(() => {
      throw new Error('init failed');
    });

    expect(() => connect.core.initCCP(containerDiv, baseParams)).not.toThrow();

    const errorMessages = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errorMessages).toContain('Error when setting up AmazonConnectStreamsSite');
  });

  it('logs an error and swallows when provider.setCCPIframe throws', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    stubProvider.setCCPIframe = jest.fn(() => {
      throw new Error('setCCPIframe failed');
    });
    jest.spyOn(SiteClass, 'init').mockReturnValue({ provider: stubProvider });

    expect(() => connect.core.initCCP(containerDiv, baseParams)).not.toThrow();

    const errorMessages = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errorMessages).toContain('Error occurred when setting CCP iframe to provider');
  });

  it('applies plugins to the AmazonConnectStreamsSite provider when no explicit provider is given', () => {
    jest.spyOn(SiteClass, 'init').mockReturnValue({ provider: stubProvider });
    const plugin = jest.fn((proto) => {
      proto.pluginMarker = () => 'applied';
      return proto;
    });

    connect.core.initCCP(containerDiv, { ...baseParams, plugins: plugin });

    expect(plugin).toHaveBeenCalledTimes(1);
    expect(plugin).toHaveBeenCalledWith(Object.getPrototypeOf(stubProvider));
    expect(Object.getPrototypeOf(stubProvider).pluginMarker()).toBe('applied');

    // Cleanup the prototype graft so it doesn't leak across tests.
    delete Object.getPrototypeOf(stubProvider).pluginMarker;
  });
});
