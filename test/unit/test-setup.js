var chai = require("chai");
var sinon = require("sinon");
var jsdom = require("mocha-jsdom");

global.assert = chai.assert;
global.expect = chai.expect;
global.should = chai.should;
global.sinon = sinon;
global.navigator = {
    userAgent: 'browser'
};
global.jsdom = jsdom;

global.parent = global.window;

global.parent = global.window;

require("../../release/connect-streams.js");

global.connect.RTCSession = function () {};

// Polyfill for Promise.finally
Promise.prototype.finally = function(onFinally) {
    return this.then(
      /* onFulfilled */
      res => Promise.resolve(onFinally()).then(() => res),
      /* onRejected */
      err => Promise.resolve(onFinally()).then(() => { throw err; })
    );
};
