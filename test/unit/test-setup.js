var chai = require("chai");
var sinon = require("sinon");
var jsdom = require("mocha-jsdom");

global.assert = chai.assert;
global.expect = chai.expect;
global.should = chai.should;
global.sinon = sinon;
global.navigator = {
    userAgent: 'browser',
    mediaDevices: {
      getUserMedia: () => {},
      enumerateDevices: () => {}
    },
    permissions: {
      query: () => {}
    }
};
// required for the core.js to initialize
global.location = new URL("https://test-fra.awsapps.com/connect/home");

Object.assign(global.location, {
  reload: () => {},
  assign: () => {}
});

// required for softphone manager logic
global.localStorage = {
  getItem: () => {},
  setItem: () => {},
  removeItem: () => {}
}

global.jsdom = jsdom;

global.parent = global.window;

require("../../release/connect-streams.js");

global.connect.RTCSession = function () {};
global.AWS = {
  util: {
    uuid: {
      v4: () => "4383f0b7-ddcb-4f8c-a63b-cbd53c852d39"
    }
  },
  Credentials: () => {},
  Endpoint: () => {},
  Connect: () => {},
  config: {
    credentials: {},
    region: '',
  }
};

before(() => {
  global.sinon.stub(connect.Agent.prototype, "_getResourceId").returns("id");
});
after(() => {
  global.sinon.restore();
});

// Polyfill for Promise.finally
Promise.prototype.finally = function(onFinally) {
    return this.then(
      /* onFulfilled */
      res => Promise.resolve(onFinally()).then(() => res),
      /* onRejected */
      err => Promise.resolve(onFinally()).then(() => { throw err; })
    );
};
