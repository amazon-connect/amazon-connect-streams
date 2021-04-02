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
});