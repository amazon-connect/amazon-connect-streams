require("../unit/test-setup.js");
const { expect } = require("chai");

describe('Logger', function() {
    describe('LogEntry.withException()', function() {
        it('extracts type, message, and stack when called with object inheriting from Error', function() {
            var message = "my syntax error";
            var err = SyntaxError(message);
            var loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            assert.equal(loggedException.type, "SyntaxError");
            assert.equal(loggedException.message, message);
            assert.deepEqual(loggedException.stack, err.stack.split('\n'));
        });
        it('extracts type, message, and stack when called with object error returned by AWS client', function() {
            var err = { code: "TestError", message: "error message" };
            var loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            assert.equal(loggedException.type, err.code);
            assert.equal(loggedException.message, err.message);
            assert.deepEqual(loggedException.stack, []);
        });
        it('determines type using Object.prototype.toString() if called with unrecognized object', function() {
            var err = "error message";
            var loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            assert.equal(loggedException.type, "[object String]");
            assert.isUndefined(err.message);
            assert.deepEqual(loggedException.stack, []);
        });
    });
    describe('Exceptions in logger class should not be thrown', function() {
        it('Set wrong level should not throw error to out side', function() {
            var logger = connect.getLog();
            logger.setLogLevel("invalid log level");
            assert.equal(logger._logLevel, 30);
        })
    });
    describe('Logger.withObject()', function(){
        it('Log should not contain websocket auth token', function(){
            var obj =  {
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?AuthToken=QVFJREFIa==",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            };
            var expectedObj = [{
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
        it('Log should have VoiceID customerId, CustomerId, SpeakerId, or CustomerSpeakerId values as MD5 digest', function(){
            var obj = {
                "customerId":"69b39df2-a06a-4f66-a9a9-ad699004d245",
                "CustomerId":"52d67abc-9aa8-4276-9de0-8dbe48220a1c",
                "SpeakerId":"1c58b4c5-6dff-4182-9eab-479aa2e78a3c",
                "CustomerSpeakerId":"89376e97-9370-481f-ba55-afdca7854c09",
                "DomainId":"XKkbTGuCuCnYgOD1iPHzPv"
            };
            var expectedObj = [{
                "customerId":"[obfuscated value] 86afb5d2f86f0ddbe298a8dd895bf5aa",
                "CustomerId":"[obfuscated value] a80f842e82ba7031ae6e22d939b179cf",
                "SpeakerId":"[obfuscated value] 7e7d858bbf580fdaba583bfb0bf4a118",
                "CustomerSpeakerId":"[obfuscated value] 82d1d42ff66faf8403e8eda577bb9e10",
                "DomainId":"XKkbTGuCuCnYgOD1iPHzPv"
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
        it('Log should not break if the value of url or text is not a string', function(){
            var obj =  {
                "webSocketTransport": {
                    "url": {
                        "text": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?AuthToken=QVFJREFIa==",
                        "url":[]
                    },
                    "text":545,
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            };
            var expectedObj = [{
                "webSocketTransport": {
                    "url": {
                        "text":"wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                        "url":[]
                    },
                    "text":545,
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        })
    });
    describe('Logger.withCrossOriginEventObject()', function(){
        it('Log should be empty as none of these are the right fields.', function(){
            var obj =  {
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?AuthToken=QVFJREFIa==",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            };
            var expectedObj = [{
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withCrossOriginEventObject(obj);
            assert.notDeepEqual(loggedObject.objects, expectedObj);
            assert.deepEqual([{}], loggedObject.objects);
        });
        it('Log should not break if the value of url or text is not a string', function(){
            var obj =  {
                "bubbles": true
            };
            var expectedObj = [{
                "bubbles": true
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
    });
    describe('LogEntry fields', () => {
        var sandbox = sinon.createSandbox();
        let agentResourceId = "id";
        before(() => {
            connect.agent.initialized = true;
        });
        after(() => {
            connect.agent.initialized = false;
        });
        it("provides the correct agentResourceId", () => {
            let log = connect.getLog().info("hi");
            assert.equal(log.getAgentResourceId(), agentResourceId);
        });

        it("should have the tabId property", () => {
            let log = connect.getLog().info("hi");
            expect(log.tabId).not.to.be.undefined;
        });

        it("should have the contextLayer property", () => {
            let log = connect.getLog().info("hi");
            expect(log.contextLayer).not.to.be.undefined;
        });

        it("LogEntry should take contextLayer input in fromObject invocation", () => {
            let log = connect.LogEntry.fromObject({
                contextLayer: 'contextLayer',
                level: null,
                text: "text",
                loggerId: "loggerId",
                exception: null,
                objects: {}
            })
            expect(log.contextLayer).to.be.string('contextLayer');
        })

        it("LogEntry tabId should contain 'tabId' when passed in fromObject invocation", () => {
            let log = connect.LogEntry.fromObject({
                tabId: 'tabId',
                level: null,
                text: "text",
                loggerId: "loggerId",
                exception: null,
                objects: {}
            })
            expect(log.tabId).to.be.string('tabId');
        })

        it("LogEntry tabId should contain null when passed in fromObject invocation", () => {
            let log = connect.LogEntry.fromObject({
                tabId: null,
                level: null,
                text: "text",
                loggerId: "loggerId",
                exception: null,
                objects: {}
            })
            expect(log.tabId).to.be.null;
        })

        it("LogEntry tabId should be null when not passed in fromObject invocation", () => {
            let log = connect.LogEntry.fromObject({
                level: null,
                text: "text",
                loggerId: "loggerId",
                exception: null,
                objects: {}
            })
            expect(log.tabId).to.be.null;
        })

        it("includes the agentResourceId when printed, and the correct log string", () => {
            let spy = sandbox.spy(connect, "sprintf");
            let log = connect.getLog().info("hello");
            sandbox.assert.calledWithMatch(spy, sinon.match.string, sinon.match.string, sinon.match.string, agentResourceId, "hello");
            sandbox.restore();
        });
    });
});