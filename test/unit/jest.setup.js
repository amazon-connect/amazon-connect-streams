// Jest setup for the unit suite.

Object.defineProperty(global.navigator, 'userAgent', {
  value: 'browser',
  configurable: true,
});
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn(),
  addEventListener: jest.fn(),
};
global.navigator.permissions = {
  query: jest.fn(),
};

// required for the core.js to initialize - park the fake browser at a Connect URL
delete global.window.location;
global.window.location = new URL('https://test-fra.awsapps.com/connect/home');
Object.assign(global.window.location, {
  reload: jest.fn(),
  assign: jest.fn(),
});

// required for softphone manager logic
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

global.parent = global.window;

require('../../release/connect-streams-test.js');

global.connect.StandardStrategy = function () {};
global.connect.CitrixVDIStrategy = function () {};
global.connect.DCVWebRTCStrategy = function () {};
global.connect.OmnissaVDIStrategy = function () {};
global.connect.RTCSession = function () {};
global.connect.RtcPeerConnectionFactory = function () {};
global.connect.RtcPeerConnectionManager = function () {};
global.connect.RtcPeerConnectionManagerV2 = function () {};
global.AWS = {
  util: {
    uuid: {
      v4: () => '4383f0b7-ddcb-4f8c-a63b-cbd53c852d39',
    },
    calculateRetryDelay: (retryCount, options) => (options?.base || 100) * Math.pow(2, retryCount),
  },
  Credentials: () => {},
  Endpoint: () => {},
  Connect: () => {},
  config: {
    credentials: {},
    region: '',
  },
};

if (typeof performance === 'undefined') {
  global.performance = require('perf_hooks').performance;
}

// jsdom does not expose TextEncoder/TextDecoder, which the bundle uses to read
// streamed error bodies (e.g. TaskTemplatesClient). Node provides them via util.
if (typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

beforeEach(() => {
  jest.spyOn(connect.Agent.prototype, '_getResourceId').mockReturnValue('id');
  connect.storageAccess.optOutFromRequestAccess();
});
afterEach(() => {
  jest.restoreAllMocks();
});
