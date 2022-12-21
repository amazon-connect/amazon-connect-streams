const { expect } = require("chai");

require("../unit/test-setup.js");

describe('AWSClient', function () {
    var sandbox = sinon.createSandbox();
    const authToken = 'some_auth_token';
    const region = 'us-west-2';
    const endpoint = 'some-endpoint';
    const callbacks = {};

    beforeEach(function () {
        sandbox.stub(AWS, 'Credentials').returns({});
        sandbox.stub(AWS, 'Endpoint').returns(endpoint);
        successSpy = sandbox.spy();
        failureSpy = sandbox.spy();
        authFailureSpy = sandbox.spy();
        accessDeniedSpy = sandbox.spy();

        callbacks.success = successSpy;
        callbacks.failure = failureSpy;
        callbacks.authFailure = authFailureSpy;
        callbacks.accessDenied = accessDeniedSpy;
    });

    describe('_callImpl', function () {
        it('calls failure callback with exception when method does not exist', function () {
            const method = 'some_non_existent_method';
            const params = {};
            const expectedMessage = `No such method exists on AWS client: ${method}`;

            sandbox.stub(AWS, 'Connect').returns({
                [connect.ClientMethods.GET_AGENT_SNAPSHOT]: () => {}, 
            });
    
            const client = new connect.AWSClient(authToken, region);
            client._callImpl(method, params, callbacks);

            sandbox.assert.calledWith(failureSpy, sandbox.match.any, sandbox.match({ message: expectedMessage }));
        });

        it('sends request through AWS connect client', function() {            
            const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
            const params = {};

            const sendSpy = sandbox.spy();
            const onStub = sandbox.stub().returns({
                send: sendSpy,
            });
            const methodStub = sandbox.stub().returns({
                on: onStub,
            });
            sandbox.stub(AWS, 'Connect').returns({
                [method]: methodStub, 
            });

            const client = new connect.AWSClient(authToken, region);
            client._callImpl(method, params, callbacks);

            sandbox.assert.calledOnce(sendSpy);
        });

        it('calls success callback when response code is not an error', () => {
            const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
            const params = {};
            const expectedData = {
                foo: 'bar',
            };

            // simulates the callback
            const sendStub = sandbox.stub().callsArgWith(0, null, expectedData);
            const onStub = sandbox.stub().returns({
                send: sendStub,
            });
            const methodStub = sandbox.stub().returns({
                on: onStub,
            });
            sandbox.stub(AWS, 'Connect').returns({
                [method]: methodStub, 
            });

            const client = new connect.AWSClient(authToken, region);
            client._callImpl(method, params, callbacks);;
            
            sandbox.assert.calledWith(successSpy, expectedData);
            sandbox.assert.notCalled(failureSpy);
            sandbox.assert.notCalled(authFailureSpy);
            sandbox.assert.notCalled(accessDeniedSpy);
        });

        describe('when response is an error other than 401 or 403', function () {
            it('calls failure callback', function () {
                const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
                const params = {};
                const code = 'some_not_401_nor_403_code';
                const message = 'some message';
                const stack = ['foo', 'bar'];
                const expectedData = {
                    foo: 'bar',
                };
                const raisedError = {
                    code,
                    message,
                    stack,
                };
                const expectedError = {
                    type: 'some_not_401_nor_403_code', 
                    message, 
                    stack,
                    retryStatus: connect.RetryStatus.NONE,
                };
    
                const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                const onStub = sandbox.stub().returns({
                    send: sendStub,
                });
                const methodStub = sandbox.stub().returns({
                    on: onStub,
                });
                sandbox.stub(AWS, 'Connect').returns({
                    [method]: methodStub, 
                });
    
                const client = new connect.AWSClient(authToken, region);
                client._callImpl(method, params, callbacks);
                
                sandbox.assert.calledWith(failureSpy, expectedError, expectedData);
                sandbox.assert.notCalled(successSpy);
                sandbox.assert.notCalled(authFailureSpy);
                sandbox.assert.notCalled(accessDeniedSpy);
            });

            it('error object passed to failure handler is properly formatted with retryStatus NONE', function () {
                const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
                const params = {};
                const expectedData = {
                    foo: 'bar',
                };
                const code = 'some_not_401_nor_403_code';
                const message = 'some_message';
                const stack = {
                    foo: 'bar',
                    baz: 'yay!',
                };
                const raisedError = {
                    code,
                    message,
                    stack,
                };
                const expectedError = {
                    type: code, 
                    message, 
                    stack: [JSON.stringify(stack)],
                    retryStatus: connect.RetryStatus.NONE,
                };
    
                const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                const onStub = sandbox.stub().returns({
                    send: sendStub,
                });
                const methodStub = sandbox.stub().returns({
                    on: onStub,
                });
                sandbox.stub(AWS, 'Connect').returns({
                    [method]: methodStub, 
                });
    
                const client = new connect.AWSClient(authToken, region);
                client._callImpl(method, params, callbacks);
                
                sandbox.assert.calledWith(failureSpy, expectedError, expectedData);                
            });            
        });

        describe('when response is 401 unauthorized', function () {
            connect.RetryableClientMethodsList.forEach(method => {
                describe(`and call is ${method} which is a polling method`, function () {
                    it('calls failure callback with retryStatus RETRYING when it has retried a number of times below retry limit', () => {
                        const code = connect.CTIExceptions.UNAUTHORIZED_EXCEPTION;
                        const message = 'unauthorized message error';
                        const stack = 'unauthorized \nmessage \nstack';
                        const params = {};
                        const expectedData = {
                            foo: 'bar',
                        };
                        const raisedError = { 
                            code,
                            message,
                            stack,
                        };
                        const expectedError = {
                            type: code, 
                            message, 
                            stack: ['unauthorized ', 'message ', 'stack'],
                            statusCode: 401,
                            retryStatus: connect.RetryStatus.RETRYING,
                        };
            
                        const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                        const onStub = sandbox.stub().returns({
                            send: sendStub,
                        });
                        const methodStub = sandbox.stub().returns({
                            on: onStub,
                        });
                        sandbox.stub(AWS, 'Connect').returns({
                            [method]: methodStub, 
                        });
            
                        const client = new connect.AWSClient(authToken, region);
                        for(let i = 0; i < connect.core.MAX_UNAUTHORIZED_RETRY_COUNT; i++) {
                            client._callImpl(method, params, callbacks);
                        }
                        
                        sandbox.assert.alwaysCalledWith(failureSpy, expectedError, expectedData);
                        sandbox.assert.callCount(failureSpy, connect.core.MAX_UNAUTHORIZED_RETRY_COUNT);
                        sandbox.assert.notCalled(successSpy);
                        sandbox.assert.notCalled(authFailureSpy);
                        sandbox.assert.notCalled(accessDeniedSpy);
                    });
        
                    it('calls authFailure callback with retryStatus EXHAUSTED when it has retried a number of times above retry limit and then restarts counter', () => {
                        const code = connect.CTIExceptions.UNAUTHORIZED_EXCEPTION;
                        const message = 'unauthorized message error';
                        const stack = 'unauthorized \nmessage \nstack';
        
                        const params = {};
                        const expectedData = {
                            foo: 'bar',
                        };
                        const raisedError = { 
                            code,
                            message,
                            stack,
                        };
                        const expectedError = {
                            type: code, 
                            message, 
                            stack: ['unauthorized ', 'message ', 'stack'],
                            statusCode: 401,
                            retryStatus: connect.RetryStatus.EXHAUSTED,
                        };
        
                        const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                        const onStub = sandbox.stub().returns({
                            send: sendStub,
                        });
                        const methodStub = sandbox.stub().returns({
                            on: onStub,
                        });
                        sandbox.stub(AWS, 'Connect').returns({
                            [method]: methodStub, 
                        });
            
                        const client = new connect.AWSClient(authToken, region);
                        let callOrder = [];
                        for(let i = 0; i < connect.core.MAX_UNAUTHORIZED_RETRY_COUNT; i++) {
                            client._callImpl(method, params, callbacks);
                            callOrder.push(failureSpy);
                        }
                        // extra call above limit
                        client._callImpl(method, params, callbacks);
                        callOrder.push(authFailureSpy);
                        // should restart counter
                        client._callImpl(method, params, callbacks);
                        callOrder.push(failureSpy);
        
                        sandbox.assert.callCount(failureSpy, connect.core.MAX_UNAUTHORIZED_RETRY_COUNT + 1);
                        sandbox.assert.calledOnce(authFailureSpy);
                        sandbox.assert.alwaysCalledWith(authFailureSpy, expectedError, expectedData);
                        sandbox.assert.callOrder(...callOrder);
                        sandbox.assert.notCalled(successSpy);
                        sandbox.assert.notCalled(accessDeniedSpy);
                    });  
                });
            });

            describe('and call is NOT a polling method', function () {
                it('calls authFailure callback with retryStatus NONE', () => {
                    const method = connect.ClientMethods.CREATE_TRANSPORT;
                    const code = connect.CTIExceptions.UNAUTHORIZED_EXCEPTION;
                    const message = 'unauthorized message error';
                    const stack = 'unauthorized \nmessage \nstack';
    
                    const params = {};
                    const expectedData = {
                        foo: 'bar',
                    };
                    const raisedError = { 
                        code,
                        message,
                        stack,
                    };
                    const expectedError = {
                        type: code, 
                        message, 
                        stack: ['unauthorized ', 'message ', 'stack'],
                        statusCode: 401,
                        retryStatus: connect.RetryStatus.NONE,
                    };
    
                    const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                    const onStub = sandbox.stub().returns({
                        send: sendStub,
                    });
                    const methodStub = sandbox.stub().returns({
                        on: onStub,
                    });
                    sandbox.stub(AWS, 'Connect').returns({
                        [method]: methodStub, 
                    });
        
                    const client = new connect.AWSClient(authToken, region);
                    client._callImpl(method, params, callbacks);
    
                    sandbox.assert.calledOnce(authFailureSpy);
                    sandbox.assert.alwaysCalledWith(authFailureSpy, expectedError, expectedData);
                    sandbox.assert.notCalled(failureSpy);
                    sandbox.assert.notCalled(successSpy);
                    sandbox.assert.notCalled(accessDeniedSpy);
                });                 
            });            
        });

        describe('when response is 403 access denied', function () {
            connect.RetryableClientMethodsList.forEach(method => {
                describe(`and call is ${method} which is a polling method`, function () {
                    it('calls failure callback with retryStatus RETRYING when it has retried a number of times below retry limit', () => {
                        const code = connect.CTIExceptions.ACCESS_DENIED_EXCEPTION;
                        const message = 'access denied error';
                        const stack = 'access \ndenied \nstack';                
                        const params = {};
                        const expectedData = {
                            foo: 'bar',
                        };
                        const raisedError = { 
                            code,
                            message,
                            stack,
                        };
                        const expectedError = {
                            type: code, 
                            message, 
                            stack: ['access ', 'denied ', 'stack'],
                            statusCode: 403,
                            retryStatus: connect.RetryStatus.RETRYING,
                        };
            
                        const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                        const onStub = sandbox.stub().returns({
                            send: sendStub,
                        });
                        const methodStub = sandbox.stub().returns({
                            on: onStub,
                        });
                        sandbox.stub(AWS, 'Connect').returns({
                            [method]: methodStub, 
                        });
            
                        const client = new connect.AWSClient(authToken, region);
                        for(let i = 0; i < connect.core.MAX_ACCESS_DENIED_RETRY_COUNT; i++) {
                            client._callImpl(method, params, callbacks);
                        }
                        
                        sandbox.assert.alwaysCalledWith(failureSpy, expectedError, expectedData);
                        sandbox.assert.callCount(failureSpy, connect.core.MAX_ACCESS_DENIED_RETRY_COUNT);
                        sandbox.assert.notCalled(successSpy);
                        sandbox.assert.notCalled(authFailureSpy);
                        sandbox.assert.notCalled(accessDeniedSpy);
                    });
        
                    it('calls accessDenied callback with retryStatus EXHAUSTED when it has retried a number of times above retry limit and then restarts counter', () => {
                        const code = connect.CTIExceptions.ACCESS_DENIED_EXCEPTION;
                        const message = 'access denied error';
                        const stack = 'access \ndenied \nstack'; 
                        const params = {};
                        const expectedData = {
                            foo: 'bar',
                        };
                        const raisedError = { 
                            code,
                            message,
                            stack,
                        };
                        const expectedError = {
                            type: code, 
                            message, 
                            stack: ['access ', 'denied ', 'stack'],
                            statusCode: 403,
                            retryStatus: connect.RetryStatus.EXHAUSTED,
                        };
            
                        const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                        const onStub = sandbox.stub().returns({
                            send: sendStub,
                        });
                        const methodStub = sandbox.stub().returns({
                            on: onStub,
                        });
                        sandbox.stub(AWS, 'Connect').returns({
                            [method]: methodStub, 
                        });
            
                        const client = new connect.AWSClient(authToken, region);
                        let callOrder = [];
                        for(let i = 0; i < connect.core.MAX_ACCESS_DENIED_RETRY_COUNT; i++) {
                            client._callImpl(method, params, callbacks);
                            callOrder.push(failureSpy);
                        }
                        // extra call above retry limit
                        client._callImpl(method, params, callbacks);
                        callOrder.push(accessDeniedSpy);
        
                        // should restart counter
                        client._callImpl(method, params, callbacks);
                        callOrder.push(failureSpy);
        
                        sandbox.assert.callCount(failureSpy, connect.core.MAX_ACCESS_DENIED_RETRY_COUNT + 1);
                        sandbox.assert.calledOnce(accessDeniedSpy);
                        sandbox.assert.alwaysCalledWith(accessDeniedSpy, expectedError, expectedData);
                        sandbox.assert.callOrder(...callOrder);                
                        sandbox.assert.notCalled(successSpy);
                        sandbox.assert.notCalled(authFailureSpy);
                    });  
                });
            });

            describe('and call is NOT a polling method', function() {
                it('calls accessDenied callback with retryStatus NONE', function () {
                    const method = connect.ClientMethods.CREATE_TRANSPORT;
                    const code = connect.CTIExceptions.ACCESS_DENIED_EXCEPTION;
                    const message = 'access denied error';
                    const stack = 'access \ndenied \nstack'; 
                    const params = {};
                    const expectedData = {
                        foo: 'bar',
                    };
                    const raisedError = { 
                        code,
                        message,
                        stack,
                    };
                    const expectedError = {
                        type: code, 
                        message, 
                        stack: ['access ', 'denied ', 'stack'],
                        statusCode: 403,
                        retryStatus: connect.RetryStatus.NONE,
                    };
        
                    const sendStub = sandbox.stub().callsArgWith(0, raisedError, expectedData);
                    const onStub = sandbox.stub().returns({
                        send: sendStub,
                    });
                    const methodStub = sandbox.stub().returns({
                        on: onStub,
                    });
                    sandbox.stub(AWS, 'Connect').returns({
                        [method]: methodStub, 
                    });
        
                    const client = new connect.AWSClient(authToken, region);
                    client._callImpl(method, params, callbacks);
    
                    sandbox.assert.calledOnce(accessDeniedSpy);
                    sandbox.assert.alwaysCalledWith(accessDeniedSpy, expectedError, expectedData);
                    sandbox.assert.notCalled(failureSpy);
                    sandbox.assert.notCalled(successSpy);
                    sandbox.assert.notCalled(authFailureSpy);                    
                });
            });
        });
    });

    describe('_formatCallError', function () {
        it('returned stack property is an array when stack in original error is an array', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = ['foo', 'bar'];
            const statusCode = 404;
            const retryStatus = connect.RetryStatus.NONE;
            const raisedError = {
                code,
                message,
                stack,
                statusCode,
            };
            const expectedError = {
                type: code, 
                message, 
                stack,
                statusCode,
                retryStatus,
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError, false);

            expect(formattedError).to.deep.equal(expectedError);
        });

        it('returned stack property is a stringified object when stack in original error is an object', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const statusCode = 404;
            const retryStatus = connect.RetryStatus.NONE;
            
            const stack = {
                foo: 'bar',
                baz: 'yay!',
            };
            const raisedError = {
                code,
                message,
                stack,
                statusCode,
            };
            const expectedError = {
                type: code, 
                message, 
                stack: [JSON.stringify(stack)],
                statusCode,
                retryStatus,
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError);

            expect(formattedError).to.deep.equal(expectedError);
        });

        it('returned stack property is an array of strings when stack in original error is a string', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = 'some \nstack \nmessage';
            const statusCode = 404;
            const retryStatus = connect.RetryStatus.NONE;

            const raisedError = {
                code,
                message,
                stack,
                statusCode,
            };
            const expectedError = {
                type: code, 
                message, 
                stack: stack.split('\n'),
                statusCode,
                retryStatus,
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError);

            expect(formattedError).to.deep.equal(expectedError);
        });

        it('returned error object does not have status code when not included in original error', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = 'some \nstack \nmessage';
            const retryStatus = connect.RetryStatus.NONE;
            const raisedError = {
                code,
                message,
                stack,
            };
            const expectedError = {
                type: code, 
                message, 
                stack: stack.split('\n'),
                retryStatus,
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError);

            expect(formattedError).to.deep.equal(expectedError);
        });

        it('returned error object has retryStatus when included in original error', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = 'some \nstack \nmessage';
            const statusCode = 400;
            const retryStatus = connect.RetryStatus.RETRYING;

            const raisedError = {
                code,
                message,
                stack,
                statusCode,
                retryStatus,
            };
            const expectedError = {
                type: code, 
                message, 
                stack: stack.split('\n'),
                statusCode,
                retryStatus,
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError);

            expect(formattedError).to.deep.equal(expectedError);
        });
     
        it('returned error object has default retryStatus NONE when not included in original error', function () {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = 'some \nstack \nmessage';
            const statusCode = 400;
            const raisedError = {
                code,
                message,
                stack,
                statusCode,
            };
            const expectedError = {
                type: code, 
                message, 
                stack: stack.split('\n'),
                statusCode,
                retryStatus: connect.RetryStatus.NONE,               
            };
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const formattedError = client._formatCallError(raisedError);

            expect(formattedError).to.deep.equal(expectedError);
        });        
    });

    describe('_addStatusCodeToError', function () {
        it('status code is same as error when it already has it', function() {
            const code = 'some_not_401_nor_403_code';
            const message = 'some_message';
            const stack = ['foo', 'bar']
            const statusCode = 401;
            const raisedError = {
                code,
                message,
                stack,
                statusCode,
            };
 
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const modifiedError = client._addStatusCodeToError(raisedError);

            expect(modifiedError.statusCode).to.equal(statusCode);
        });

        it('appends a default 400 status code when there is no cti error code', function() {
            const message = 'some_message';
            const stack = ['foo', 'bar']
            const defaultErrorStatusCode = 400;
            const raisedError = {
                message,
                stack,
            };
 
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const modifiedError = client._addStatusCodeToError(raisedError);

            expect(modifiedError.statusCode).to.equal(defaultErrorStatusCode);
        });

        it('appends status code 401 when cti error code is Unauthorized Exception', function() {
            const code = connect.CTIExceptions.UNAUTHORIZED_EXCEPTION;
            const message = 'some_message';
            const stack = ['foo', 'bar']
            const raisedError = {
                code,
                message,
                stack,
            };
 
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const modifiedError = client._addStatusCodeToError(raisedError);

            expect(modifiedError.statusCode).to.equal(401);
        });

        it('appends status code 403 when cti error code is Access Denied Exception', function() {
            const code = connect.CTIExceptions.ACCESS_DENIED_EXCEPTION;
            const message = 'some_message';
            const stack = ['foo', 'bar']
            const raisedError = {
                code,
                message,
                stack,
            };
 
            sandbox.stub(AWS, 'Connect').returns({
                some_whatever_method: () => {}, 
            });
            const client = new connect.AWSClient(authToken, region);
            const modifiedError = client._addStatusCodeToError(raisedError);

            expect(modifiedError.statusCode).to.equal(403);
        });
    });

    afterEach(function () {
        sandbox.restore();
    });
});