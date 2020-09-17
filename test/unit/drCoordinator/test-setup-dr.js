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
  createElement: sinon.stub().returns({})
}

global.window = {
  addEventListener: sinon.spy(),
  document: global.document,
  atob: sinon.stub().returns({}),
  getComputedStyle: sinon.stub().returns({})
};
require("../../../release/connect-streams-dr.js");
global.connect.RTCSession = function () {};