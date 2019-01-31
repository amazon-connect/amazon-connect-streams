var chai = require("chai"),
    sinon = require("sinon");

global.assert = chai.assert,
    global.expect = chai.expect,
    global.should = chai.should,
    global.sinon = sinon
global.navigator = {
    userAgent: 'browser'
}
global.window = {
    addEventListener: sinon.spy()
};

global.document = {
    getElementById: sinon.stub().returns({}),
    createElement: sinon.stub().returns({})
}

require("../../release/connect-streams.js");

global.connect.RTCSession = function () {};