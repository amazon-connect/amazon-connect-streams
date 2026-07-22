// Shared helpers for the core Jest test files. Not picked up by the test
// runner (testMatch only matches *.test.js).

const DEFAULT_LOCATION = 'https://test-fra.awsapps.com/connect/home';

const setLocation = (url) => {
  delete window.location;
  window.location = new URL(url);
  Object.assign(window.location, {
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
  });
};

const setReferrer = (referrer) => {
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    configurable: true,
  });
};

const setCookie = (cookie) => {
  Object.defineProperty(document, 'cookie', {
    value: cookie,
    configurable: true,
    writable: true,
  });
};

const makeContainerDiv = () => ({ appendChild: jest.fn() });

const defaultRingtoneUrl =
  'https://d366s8lxuwna4d.cloudfront.net/ringtone-ba0c9bd8a1d12786318965fd908eb2998bdb8f4c.mp3';

const defaultParams = (overrides = {}) => ({
  agentLogin: 'abc',
  authToken: 'xyz',
  authTokenExpiration: 'Thu Apr 19 23:30:07 UTC 2018',
  baseUrl: 'https://abc.awsapps.com',
  ccpUrl: 'url.com',
  refreshToken: 'abc',
  region: 'us-west-2',
  sharedWorkerUrl: '/connect/static/connect-shared-worker.js',
  softphone: { ringtoneUrl: defaultRingtoneUrl },
  chat: { ringtoneUrl: defaultRingtoneUrl },
  shouldAddNamespaceToLogs: true,
  ...overrides,
});

// installCoreMocks installs the cross-cutting mocks every core test relies on
// (SharedWorker, conduit prototype spies, randomId, basic DOM/permissions
// stubs). Returns handles that tests may want to assert against.
const installCoreMocks = () => {
  // SharedWorker is not in jsdom; provide one.
  global.SharedWorker = jest.fn().mockImplementation(function () {
    this.port = {
      start: jest.fn(),
      addEventListener: jest.fn(),
      postMessage: jest.fn(),
    };
  });

  jest.spyOn(connect, 'randomId').mockReturnValue('id');
  jest.spyOn(connect, 'hitch');

  jest.spyOn(connect.Conduit.prototype, 'sendUpstream').mockReturnValue(null);
  jest.spyOn(connect.Conduit.prototype, 'onUpstream');
  jest.spyOn(connect.Conduit.prototype, 'sendDownstream');
  jest.spyOn(connect.Conduit.prototype, 'onDownstream');

  jest.spyOn(connect.core, 'getNotificationManager').mockReturnValue({
    requestPermission: jest.fn(),
  });

  // Suppress real auth callback registration unless the test asserts on it.
  jest.spyOn(connect.core, 'onAuthFail');
  jest.spyOn(connect.core, 'onAuthorizeSuccess');

  connect.agent.initialized = true;
};

// resetCoreState clears every connect.core.* mutable property that core.js
// touches at runtime. Tests that don't run terminate() still need this to keep
// state from leaking across test files.
const resetCoreState = () => {
  if (connect.core.softphoneManager) {
    try { connect.core.softphoneManager.terminate(); } catch (_e) { /* best-effort */ }
  }
  // Cancel any pending timers core.js owns.
  if (connect.core.iframeRefreshTimeout) {
    clearTimeout(connect.core.iframeRefreshTimeout);
  }
  if (connect.core.authorizeTimeoutId) {
    clearTimeout(connect.core.authorizeTimeoutId);
  }
  if (connect.core.ctiTimeoutId) {
    clearTimeout(connect.core.ctiTimeoutId);
  }
  if (connect.core.ccpLoadTimeoutInstance) {
    clearTimeout(connect.core.ccpLoadTimeoutInstance);
  }

  // Runtime state assigned by initSharedWorker/initCCP/terminate.
  connect.core.initialized = false;
  connect.core.eventBus = null;
  connect.core.bus = null;
  connect.core.upstream = null;
  connect.core.agentDataProvider = null;
  connect.core.softphoneManager = null;
  connect.core.keepaliveManager = null;
  connect.core.client = null;
  connect.core.apiProxyClient = null;
  connect.core.masterClient = null;
  connect.core.mediaFactory = null;
  connect.core.notificationManager = null;
  connect.core.popupManager = null;
  connect.core.webSocketProvider = null;
  connect.core._amazonConnectProviderData = null;
  connect.core.tabId = null;
  connect.core.portStreamId = null;
  connect.core.region = null;
  connect.core.suppressContacts = null;
  connect.core.forceOffline = null;
  connect.core.loginWindow = null;
  connect.core.ctiAuthRetryCount = 0;
  connect.core.authorizeTimeoutId = null;
  connect.core.ctiTimeoutId = null;
  connect.core.ccpLoadTimeoutInstance = null;
  connect.core.iframeRefreshTimeout = null;
  connect.core.iframeRefreshAttempt = null;
  connect.core.iframeStyle = null;
  connect.core.softphoneParams = null;
  connect.core.voiceIdDomainId = null;
  connect.core._shouldHoldPopupLock = false;
  connect.core._acgrValidationListenerRegistered = false;
  connect.core.hasReceivedCRMConfigure = undefined;
  connect.core.loginAckTimeoutSub = null;
  connect.core._ringerDeviceId = null;
  connect.core.ringtoneEngines = null;

  // Cross-module counters touched by core.js handlers.
  connect.numberOfConnectedCCPs = 0;
  connect.numberOfConnectedCCPsInThisTab = 0;

  connect.agent.initialized = false;

  // Storage state that auth tests touch.
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.clear();
  }
};

const commonAfterEach = () => {
  resetCoreState();
  setLocation(DEFAULT_LOCATION);
};

module.exports = {
  DEFAULT_LOCATION,
  defaultParams,
  defaultRingtoneUrl,
  setLocation,
  setReferrer,
  setCookie,
  makeContainerDiv,
  installCoreMocks,
  resetCoreState,
  commonAfterEach,
};
