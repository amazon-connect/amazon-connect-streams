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

require("../../release/connect-streams.js");

global.connect.RTCSession = function () {};
global.AWS = {
  util: {
    uuid: {
      v4: () => "4383f0b7-ddcb-4f8c-a63b-cbd53c852d39"
    }
  }
};

before(() => {
  global.sinon.stub(connect.Agent.prototype, "_getResourceId").returns("id");
    connect.storageAccess.optOutFromRequestAccess();
});
after(() => {
  global.sinon.restore();
});

// Polyfill for Promise.finally
Promise.prototype.finally = function(onFinally) {
    return this.then(
        /* onFulfilled */
        (res) => Promise.resolve(onFinally()).then(() => res),
        /* onRejected */
        (err) =>
            Promise.resolve(onFinally()).then(() => {
                throw err;
            })
    );
};
