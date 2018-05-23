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

require("../../src/aws-client.js");
require("../../src/sprintf.js");
require("../../src/log.js");
require("../../src/util.js");
require("../../src/event.js");
require("../../src/streams.js");
require("../../src/client.js");
require("../../src/transitions.js");
require("../../src/api.js");
require("../../src/core.js");
require("../../src/ringtone.js");
require("../../src/softphone.js");
require("../../src/worker.js");

global.connect.RTCSession = function () {};