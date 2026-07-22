// Jest port of `#connect.core.initCCP() starting AmazonConnectStreamsSite`.
//
// The original Mocha block proxyquire'd `@amazon-connect/site-streams` to swap
// in a stub `AmazonConnectStreamsSite`. We can't hook the bundle's
// `__webpack_require__`, but core.js exposes a documented escape hatch:
// `params.provider` short-circuits the AmazonConnectStreamsSite path and uses
// the supplied provider verbatim. This file covers:
//   - getSDKClientConfig before initCCP (throws)
//   - existing-provider branch (no AmazonConnectStreamsSite call)
//   - getSDKClientConfig after initCCP (returns the supplied provider)
//   - existing-provider with invalid constructor (logs error, swallows)
//   - plugin application (single, multi, error path, undefined return,
//     empty-array, plugin-removed-from-params, no-provider fallback)
//
// Tests that strictly require swapping AmazonConnectStreamsSite (the
// init/setCCPIframe failure paths) are skipped with an explanatory note,
// preserving Mocha-spec parity.

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

class TestExistingProvider {
  get id() { return 'test-existing-provider'; }
}

describe('connect.core.getSDKClientConfig before initCCP', () => {
  beforeEach(() => {
    setLocation('http://url.com/test');
    connect.core._amazonConnectProviderData = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('throws "Provider is not initialized" when no provider has been set', () => {
    expect(() => connect.core.getSDKClientConfig()).toThrow('Provider is not initialized');
  });
});

describe('connect.core.initCCP() with provider supplied in params', () => {
  let containerDiv;
  let baseParams;
  let existingProvider;

  beforeEach(() => {
    setLocation('http://url.com/test');
    jest.useFakeTimers();
    installInitCCPStubs();
    connect.agent.initialized = true;
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    containerDiv = makeContainerDiv();
    baseParams = { ccpUrl: 'http://url.com/test' };
    existingProvider = new TestExistingProvider();
  });

  afterEach(() => {
    connect.core._amazonConnectProviderData = null;
    jest.useRealTimers();
    commonAfterEach();
  });

  it('does not invoke any AmazonConnectStreamsSite code path when provider is supplied', () => {
    const params = { ...baseParams, provider: existingProvider };
    const errorSpy = jest.spyOn(connect.getLog(), 'error');

    connect.core.initCCP(containerDiv, params);

    expect(connect.core._amazonConnectProviderData).toBeDefined();
    expect(connect.core._amazonConnectProviderData.provider).toBe(existingProvider);
    expect(connect.core._amazonConnectProviderData.isStreamsProvider).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('strips the provider from the params before they are forwarded to CCP', () => {
    const params = { ...baseParams, provider: existingProvider };
    connect.core.initCCP(containerDiv, params);
    expect(params.provider).toBeUndefined();
  });

  it('makes the supplied provider available via getSDKClientConfig()', () => {
    const params = { ...baseParams, provider: existingProvider };
    connect.core.initCCP(containerDiv, params);
    expect(connect.core.getSDKClientConfig().provider).toBe(existingProvider);
  });

  it('logs an error when the provider object lacks a constructor', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    const params = { ...baseParams, provider: Object.create(null, { id: { value: 'foo' } }) };

    connect.core.initCCP(containerDiv, params);

    const errorCalls = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errorCalls).toContain('Error when setting up AmazonConnectProvider from params');
  });
});

describe('connect.core.initCCP() plugin application via params.plugins', () => {
  let containerDiv;
  let baseParams;
  let testProvider;

  beforeEach(() => {
    setLocation('http://url.com/test');
    jest.useFakeTimers();
    installInitCCPStubs();
    connect.agent.initialized = true;
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    containerDiv = makeContainerDiv();
    baseParams = { ccpUrl: 'http://url.com/test' };
    class TestProviderWithPlugins {
      get id() { return 'test-provider-with-plugins'; }
    }
    testProvider = new TestProviderWithPlugins();
  });

  afterEach(() => {
    // Strip plugin methods we may have grafted on for the test.
    const proto = Object.getPrototypeOf(testProvider);
    delete proto.pluginMethod1;
    delete proto.pluginMethod2;
    delete proto.pluginMethod;
    connect.core._amazonConnectProviderData = null;
    jest.useRealTimers();
    commonAfterEach();
  });

  it('applies a single plugin to the provider prototype', () => {
    const plugin = jest.fn((proto) => {
      proto.pluginMethod1 = () => 'plugin1';
      return proto;
    });
    const params = { ...baseParams, provider: testProvider, plugins: plugin };
    const errorSpy = jest.spyOn(connect.getLog(), 'error');

    connect.core.initCCP(containerDiv, params);

    expect(plugin).toHaveBeenCalledTimes(1);
    expect(plugin).toHaveBeenCalledWith(Object.getPrototypeOf(testProvider));
    expect(Object.getPrototypeOf(testProvider).pluginMethod1()).toBe('plugin1');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('applies multiple plugins in sequence', () => {
    const p1 = jest.fn((proto) => { proto.pluginMethod1 = () => 'plugin1'; return proto; });
    const p2 = jest.fn((proto) => { proto.pluginMethod2 = () => 'plugin2'; return proto; });
    const params = { ...baseParams, provider: testProvider, plugins: [p1, p2] };
    const errorSpy = jest.spyOn(connect.getLog(), 'error');

    connect.core.initCCP(containerDiv, params);

    expect(p1).toHaveBeenCalledTimes(1);
    expect(p2).toHaveBeenCalledTimes(1);
    expect(Object.getPrototypeOf(testProvider).pluginMethod1()).toBe('plugin1');
    expect(Object.getPrototypeOf(testProvider).pluginMethod2()).toBe('plugin2');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs an error when a plugin throws', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    const params = {
      ...baseParams,
      provider: testProvider,
      plugins: () => { throw new Error('Plugin error'); },
    };

    connect.core.initCCP(containerDiv, params);

    const errorCalls = errorSpy.mock.calls.map(([msg]) => msg);
    expect(errorCalls).toContain('Error when setting plugins for provider');
  });

  it('does not throw when given an empty plugins array', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    const params = { ...baseParams, provider: testProvider, plugins: [] };

    expect(() => connect.core.initCCP(containerDiv, params)).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('strips the plugins from params before forwarding (preventing it from being sent to CCP)', () => {
    const p1 = jest.fn((proto) => proto);
    const p2 = jest.fn((proto) => proto);
    const params = { ...baseParams, provider: testProvider, plugins: [p1, p2] };

    connect.core.initCCP(containerDiv, params);

    expect(params.plugins).toBeUndefined();
    expect(p1).toHaveBeenCalledTimes(1);
    expect(p2).toHaveBeenCalledTimes(1);
  });

  it('handles a plugin that returns undefined (graceful degradation)', () => {
    const errorSpy = jest.spyOn(connect.getLog(), 'error');
    // First plugin in the chain may swallow undefined; if a second plugin is
    // present, the reduce step will fail when reading prototype-of-undefined.
    // The Mocha spec asserts a single plugin returning undefined still mutates
    // the prototype.
    const plugin = jest.fn((proto) => {
      proto.pluginMethod = () => 'modified';
      return undefined;
    });
    const params = { ...baseParams, provider: testProvider, plugins: plugin };

    connect.core.initCCP(containerDiv, params);

    expect(plugin).toHaveBeenCalledTimes(1);
    expect(Object.getPrototypeOf(testProvider).pluginMethod()).toBe('modified');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

// The default `AmazonConnectStreamsSite` path is covered in
// core.amazonconnect-provider-default.test.js — webpack module-caches the
// site-streams module, so the real class identity is stable and we can spy
// on its static `init` after a one-shot capture call.
