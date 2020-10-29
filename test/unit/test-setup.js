var chai = require("chai"),
    sinon = require("sinon");

global.assert = chai.assert,
    global.expect = chai.expect,
    global.should = chai.should,
    global.sinon = sinon
global.navigator = {
    userAgent: 'browser'
}

global.document = {
    getElementById: sinon.stub().returns({}),
    createElement: sinon.stub().returns({}),
}

global.window = {
    addEventListener: sinon.spy(),
    document: global.document,
    location: {
        href: "example"
    }
};

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
