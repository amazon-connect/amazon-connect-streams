require("../unit/test-setup.js");

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
        it('Log should not contain VoiceID speaker ID', function(){
            var obj = {
                "SpeakerId":"1c58b4c5-6dff-4182-9eab-479aa2e78a3c",
                "DomainId":"XKkbTGuCuCnYgOD1iPHzPv"
            };
            var expectedObj = [{
                "SpeakerId":"[redacted]",
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
        it("provides the correct agentResourceId", () => {
            let log = connect.getLog().info("hi");
            assert.equal(log.getAgentResourceId(), agentResourceId);
        });
        it("includes the agentResourceId when printed, and the correct log string", () => {
            let spy = sandbox.spy(connect, "sprintf");
            let log = connect.getLog().info("hello");
            sandbox.assert.calledWithMatch(spy, sinon.match.string, sinon.match.string, sinon.match.string, agentResourceId, "hello");
            sandbox.restore();
        });
    });
});