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
        });
        it('Log should be redacting sensitive information', function() {
            var obj =  {
                "webSocketTransport": {
                    "url": {
                        "text":"wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                        "url":[]
                    },
                    "text":545,
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                },
                "authToken": "testing_token=AFSDFAa==",
                "presignedurl": "https://test.xyz",
                "contacts": [ {
                    "phonenumber": "1234567890",
                    "attributes": {
                        "test": "test123"
                    },
                    "randomContactProperty": "should not be retracted",
                    "quickConnectName": "HideMe!",
                    "internalIp": "123.0.1.1",
                    "connections": [
                        {
                            "softphoneMediaInfo": {
                                "callConfigJson": "{\"signalingEndpoint\":\"wss://abc.bcd.cde.amazonaws.com/LilyRTC\",\"iceServers\":[{\"urls\":[\"turn:abc.cde.com.:3478?transport=udp\"],\"username\":\"abc:cde-efg-gef-ert-wer\",\"credential\":\"3hide+Me4+please=\",\"sessionToken\":\"{\\\"internalIp\\\":\\\"10.0.0.0\\\"}\"}],\"protocol\":\"LilyRTC/1.0/WSS\",\"useWebSocketProvider\":true}"
                            }
                        }]
                }]
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
                },
                "authToken": "[redacted]",
                "presignedurl": "[obfuscated value] ebb1a2ed4662431abe920657782af6a1",
                "contacts": [ {
                    "phonenumber": "[redacted]",
                    "attributes": "[redacted]",
                    "connections": [
                        {
                            "softphoneMediaInfo": {
                                "callConfigJson": "{\"signalingEndpoint\":\"wss://abc.bcd.cde.amazonaws.com/LilyRTC\",\"iceServers\":[{\"urls\":[\"turn:abc.cde.com.:3478?transport=udp\"],\"username\":\"abc:cde-efg-gef-ert-wer\",\"credential\":\"[redacted]\",\"sessionToken\":\"{\\\"internalIp\\\":\\\"10.0.0.0\\\"}\"}],\"protocol\":\"LilyRTC/1.0/WSS\",\"useWebSocketProvider\":true}"
                            }
                        }
                    ],
                    "randomContactProperty": "should not be retracted",
                    "quickConnectName": "[redacted]",
                    "internalIp": "[redacted]"
                }]
            }];
            var loggedObject = connect.getLog().trace("Testing logging string").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
        it('Log should now contain the agentName in the snapshot object', () => {
            var obj =  {
                "connectionId": "b46091ad-6f1b-490b-a58f-1a18943f2191",
                "state": {
                  "type": "connected",
                  "timestamp": "2024-10-22T17:23:30.600Z"
                },
                "type": "outbound",
                "initial": false,
                "chatMediaInfo": {
                  "chatAutoAccept": false,
                  "connectionData": null,
                  "customerName": null,
                  "agentName": "TestAgent"
                },
                "mute": null,
                "forcedMute": null,
                "quickConnectName": "[redacted]",
                "monitorStatus": null
            };
            var expectedObj = [{
                "connectionId": "b46091ad-6f1b-490b-a58f-1a18943f2191",
                "state": {
                  "type": "connected",
                  "timestamp": "2024-10-22T17:23:30.600Z"
                },
                "type": "outbound",
                "initial": false,
                "chatMediaInfo": {
                  "chatAutoAccept": false,
                  "connectionData": null,
                  "customerName": null,
                  "agentName": "[redacted]"
                },
                "mute": null,
                "forcedMute": null,
                "quickConnectName": "[redacted]",
                "monitorStatus": null
            }];
            var loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
        it('Log should handle contact data included as reference in agent snapshot (task template)', function() {
            var obj = {
                "agentResourceId": "abc123-def456-ghi789",
                "instanceId": "instance-12345",
                "accountId": "123456789",
                "timestamp": 1234567890123,
                "component": "ccp",
                "level": "INFO", 
                "text": "Contact event with email user@example.com",
                "objects": [{
                    "event": "ContactDestroyed",
                    "data": {
                        "contactId": "contact-abc123",
                        "contactData": {
                            "contactId": "contact-abc123",
                            "type": "task",
                            "queue": {
                                "queueARN": "arn:aws:connect:us-east-1:123456789:instance/inst-123/queue/queue-456",
                                "name": "Customer Support Queue",
                                "queueId": "queue-456"
                            },
                            "name": "Support Task",
                            "description": "Customer needs help with account issue",
                            "references": {
                                "Account Number": {
                                    "value": "ACC-123456",
                                    "type": "STRING"
                                },
                                "Agent Name": {
                                    "value": "Jane Doe",
                                    "type": "STRING"  
                                },
                                "Summary": {
                                    "value": "Customer called about billing issue",
                                    "type": "STRING"
                                }
                            }
                        }
                    }
                }]
            };
            
            var expectedObj = [{
                "agentResourceId": "abc123-def456-ghi789",
                "instanceId": "instance-12345", 
                "accountId": "123456789",
                "timestamp": 1234567890123,
                "component": "ccp",
                "level": "INFO",
                "text": "Contact event with email email address [redacted]",
                "objects": [{
                    "event": "ContactDestroyed",
                    "data": {
                        "contactId": "contact-abc123",
                        "contactData": {
                            "contactId": "contact-abc123",
                            "type": "task",
                            "queue": {
                                "queueARN": "arn:aws:connect:us-east-1:123456789:instance/inst-123/queue/queue-456",
                                "name": "[redacted]",
                                "queueId": "queue-456"
                            },
                            "name": "[redacted]",
                            "description": "[redacted]",
                            "references": {
                                "Account Number": {
                                    "value": "[redacted]",
                                    "type": "STRING"
                                },
                                "Agent Name": {
                                    "value": "[redacted]",
                                    "type": "STRING"
                                },
                                "Summary": {
                                    "value": "[redacted]",
                                    "type": "STRING"
                                }
                            }
                        }
                    }
                }]
            }];
            
            var loggedObject = connect.getLog().trace("Testing comprehensive contact data redaction").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });

        it('Log should NOT redact agent state name but should redact other name fields', function() {
            var obj = {
                "snapshot": {
                        "state": {
                            "agentStateARN": "arn:aws:connect:us-east-1:111111111:instance/abc123-def456-ghi789/agent-state/abc123-def456-ghi789",
                            "type": "offline",
                            "name": "Offline",  // This should NOT be redacted
                            "startTimestamp": "2025-08-06T22:30:29.802Z"
                        },
                        "agentAvailabilityState": {
                            "state": "Offline",
                            "timeStamp": "2025-08-06T22:30:29.364Z"
                        },
                        "contacts": [{
                            "contactId": "contact-123",
                            "queue": {
                                "name": "Support Queue",  // This SHOULD be redacted
                                "queueId": "queue-456"
                            },
                            "name": "Customer Contact",  // This SHOULD be redacted
                            "agentName": "John Doe"  // This SHOULD be redacted
                        }],
                        "snapshotTimestamp": "2025-08-06T23:58:58.802Z"
                },
            }
            
            var expectedObj = [{
                "snapshot": {
                    "state": {
                        "agentStateARN": "arn:aws:connect:us-east-1:111111111:instance/abc123-def456-ghi789/agent-state/abc123-def456-ghi789",
                        "type": "offline",
                        "name": "Offline",  // NOT redacted - agent state name preserved
                        "startTimestamp": "2025-08-06T22:30:29.802Z"
                    },
                    "agentAvailabilityState": {
                        "state": "Offline",
                        "timeStamp": "2025-08-06T22:30:29.364Z"
                    },
                    "contacts": [{
                        "contactId": "contact-123",
                        "queue": {
                            "name": "[redacted]",  // Redacted - queue name
                            "queueId": "queue-456"
                        },
                        "name": "[redacted]",  // Redacted - contact name
                        "agentName": "[redacted]"  // Redacted - agent name
                    }],
                    "snapshotTimestamp": "2025-08-06T23:58:58.802Z"
                },
            }];
            
            
            var loggedObject = connect.getLog().trace("Testing agent state name preservation").withObject(obj);
            assert.deepEqual(loggedObject.objects, expectedObj);
        });
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

    describe('CRM Layer Log Broadcast (Dual CCP Synchronization)', function() {
        var sandbox;
        var originalAgent;
        var originalAgentConstructor;
        var originalIsCRM;
        var originalCore;
        var originalUpstream;
        var originalEventBus;
        var originalClientEngine;
        var originalIsFramed;
        var originalIsCCP;
        var originalIsSharedWorker;
        var originalEventType;
        var originalLogComponent;
        var originalDeepCopy;
        var originalRootLogger;

        before(function() {
            // Save TRUE original state before any tests in this suite run
            originalAgent = connect.agent;
            originalAgentConstructor = connect.Agent;
            originalIsCRM = connect.isCRM;
            originalCore = connect.core;
            originalUpstream = connect.core ? connect.core.upstream : undefined;
            originalEventBus = connect.core ? connect.core.eventBus : undefined;
            originalClientEngine = connect.worker ? connect.worker.clientEngine : undefined;
            originalIsFramed = connect.isFramed;
            originalIsCCP = connect.isCCP;
            originalIsSharedWorker = connect.isSharedWorker;
            originalEventType = connect.EventType;
            originalLogComponent = connect.LogComponent;
            originalDeepCopy = connect.deepcopy;
            originalRootLogger = connect.rootLogger;
        });

        beforeEach(function() {
            sandbox = sinon.createSandbox();
            
            // Mock agent
            connect.agent = {
                initialized: true
            };
            
            connect.Agent = function() {
                return {
                    getAgentId: function() {
                        return 'test-agent-id';
                    }
                };
            };
            
            // Mock feature flag provider to return empty (avoid interference)
            if (connect.featureFlagProvider) {
                sandbox.stub(connect.featureFlagProvider, 'getFeatureFlags').returns({});
            }
        });

        afterEach(function() {
            sandbox.restore();
        });

        after(function() {
            // Restore TRUE original state after all tests in this suite complete
            connect.agent = originalAgent;
            connect.Agent = originalAgentConstructor;
            connect.isCRM = originalIsCRM;
            connect.core = originalCore;
            if (connect.core) {
                connect.core.upstream = originalUpstream;
                connect.core.eventBus = originalEventBus;
            }
            if (connect.worker) {
                connect.worker.clientEngine = originalClientEngine;
            }
            connect.isFramed = originalIsFramed;
            connect.isCCP = originalIsCCP;
            connect.isSharedWorker = originalIsSharedWorker;
            connect.EventType = originalEventType;
            connect.LogComponent = originalLogComponent;
            connect.deepcopy = originalDeepCopy;
            connect.rootLogger = originalRootLogger;
        });

        describe('Logger.addLogEntry CRM broadcast', function() {
            it('should broadcast log entry when isCRM() returns true and loggerId matches', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                var logEntry = logger.info('Test CRM log message');
                
                assert.isTrue(sendUpstreamSpy.calledOnce, 'sendUpstream should be called once for CRM broadcast');
                assert.equal(sendUpstreamSpy.getCall(0).args[0], 'broadcast');
                assert.deepEqual(sendUpstreamSpy.getCall(0).args[1], {
                    event: 'log',
                    data: logEntry
                });
            });

            it('should NOT broadcast log entry when isCRM() returns false', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(false);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                logger.info('Test non-CRM log message');
                
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called when not in CRM layer');
            });

            it('should NOT broadcast log entry when loggerId does not match (prevents loops)', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                // Create a log entry with a different loggerId
                var foreignLogEntry = new connect.LogEntry('ccp', 'INFO', 'Foreign log', 'different-logger-id', null, null);
                
                // Add the foreign log entry (simulating receiving from another CCP)
                logger.addLogEntry(foreignLogEntry);
                
                // sendUpstream should NOT be called because loggerId doesn't match
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called for foreign log entries');
            });

            it('should NOT broadcast when isCRM returns false (non-CRM context)', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(false);
                connect.isSharedWorker = sandbox.stub().returns(false);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(true);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                logger.info('Test log in CCP context');
                
                // Should not broadcast because isCRM() returns false
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called when isCRM returns false');
            });

            it('should broadcast with correct event type and data structure', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                var logEntry = logger.warn('Warning message');
                
                var broadcastCall = sendUpstreamSpy.getCall(0);
                assert.equal(broadcastCall.args[0], connect.EventType.BROADCAST);
                assert.property(broadcastCall.args[1], 'event');
                assert.property(broadcastCall.args[1], 'data');
                assert.equal(broadcastCall.args[1].event, connect.EventType.LOG);
                assert.equal(broadcastCall.args[1].data, logEntry);
            });
        });

        describe('LogEntry.sendInternalLogToServer CRM broadcast', function() {
            it('should broadcast server-bound log when isCRM() returns true and loggerId matches', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };
                
                var logger = new connect.Logger();
                // Temporarily replace root logger
                var originalRootLogger = connect.rootLogger;
                connect.rootLogger = logger;
                
                var logEntry = logger.info('Server-bound log message');
                logEntry.sendInternalLogToServer();
                
                // Restore root logger
                connect.rootLogger = originalRootLogger;
                
                // First call is from addLogEntry (LOG broadcast), second from sendInternalLogToServer
                assert.equal(sendUpstreamSpy.callCount, 2, 'sendUpstream should be called twice (LOG + SERVER_BOUND_INTERNAL_LOG)');
                
                var serverBoundCall = sendUpstreamSpy.getCall(1);
                assert.equal(serverBoundCall.args[0], 'broadcast');
                assert.deepEqual(serverBoundCall.args[1], {
                    event: 'server_bound_internal_log',
                    data: logEntry
                });
            });

            it('should NOT broadcast server-bound log when isCRM() returns false', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(false);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };
                
                var logger = new connect.Logger();
                var originalRootLogger = connect.rootLogger;
                connect.rootLogger = logger;
                
                var logEntry = logger.info('Server-bound log message');
                logEntry.sendInternalLogToServer();
                
                connect.rootLogger = originalRootLogger;
                
                // sendUpstream should not be called at all
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called when not in CRM layer');
            });

            it('should NOT broadcast server-bound log when loggerId does not match', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };
                
                var logger = new connect.Logger();
                var originalRootLogger = connect.rootLogger;
                connect.rootLogger = logger;
                
                // Create a log entry with a different loggerId
                var foreignLogEntry = new connect.LogEntry('ccp', 'INFO', 'Foreign server log', 'different-logger-id', null, null);
                foreignLogEntry.sendInternalLogToServer();
                
                connect.rootLogger = originalRootLogger;
                
                // sendUpstream should not be called because loggerId doesn't match
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called for foreign log entries');
            });

            it('should still add log to _serverBoundInternalLogs even when broadcast fails', function() {
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().throws(new Error('Upstream error')),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                
                var logger = new connect.Logger();
                var originalRootLogger = connect.rootLogger;
                connect.rootLogger = logger;
                
                var initialCount = logger._serverBoundInternalLogs.length;
                var logEntry = new connect.LogEntry('ccp', 'INFO', 'Test log', logger.getLoggerId(), null, null);
                
                // Due to try-catch wrapper, this should not throw
                // But the log should still be added to _serverBoundInternalLogs
                try {
                    logEntry.sendInternalLogToServer();
                } catch (e) {
                    // Expected to potentially throw due to mocked error
                }
                
                connect.rootLogger = originalRootLogger;
                
                // Log should have been added before the broadcast attempt
                assert.equal(logger._serverBoundInternalLogs.length, initialCount + 1);
            });

            it('should NOT broadcast server-bound log when in SharedWorker context', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(false);
                connect.isSharedWorker = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };
                
                var logger = new connect.Logger();
                var originalRootLogger = connect.rootLogger;
                connect.rootLogger = logger;
                
                var logEntry = logger.info('SharedWorker log');
                logEntry.sendInternalLogToServer();
                
                connect.rootLogger = originalRootLogger;
                
                // sendUpstream should NOT be called because we're in SharedWorker context, not CRM
                assert.isFalse(sendUpstreamSpy.called, 'sendUpstream should NOT be called when not in CRM layer');
            });
        });

        describe('CRM broadcast deduplication (loop prevention)', function() {
            it('should not rebroadcast logs received from other CCPs', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                
                // Simulate receiving a log entry from another CCP (different loggerId)
                var scvLogEntry = new connect.LogEntry('ccp', 'INFO', 'Log from SCV CCP', 'scv-logger-id-12345', 'scv-tab', 'CRM');
                var sccLogEntry = new connect.LogEntry('ccp', 'INFO', 'Log from SCC-AC CCP', 'scc-logger-id-67890', 'scc-tab', 'CRM');
                
                logger.addLogEntry(scvLogEntry);
                logger.addLogEntry(sccLogEntry);
                
                // Neither should trigger a broadcast since their loggerIds don't match the local logger
                assert.isFalse(sendUpstreamSpy.called, 'Should not rebroadcast logs from other CCPs');
                
                // But logs should still be stored locally
                assert.isTrue(logger._logs.includes(scvLogEntry));
                assert.isTrue(logger._logs.includes(sccLogEntry));
            });

            it('should broadcast only locally-originated logs', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                
                // Add foreign log (should not broadcast)
                var foreignLog = new connect.LogEntry('ccp', 'INFO', 'Foreign log', 'foreign-logger-id', null, null);
                logger.addLogEntry(foreignLog);
                assert.equal(sendUpstreamSpy.callCount, 0);
                
                // Add local log (should broadcast)
                var localLog = logger.info('Local log');
                assert.equal(sendUpstreamSpy.callCount, 1);
                
                // Verify the broadcast was for the local log
                assert.equal(sendUpstreamSpy.getCall(0).args[1].data, localLog);
            });
        });

        describe('Broadcast boolean prevents duplicate downstream sending', function() {
            it('should NOT send downstream when broadcast succeeds in CRM layer', function() {
                var sendUpstreamSpy = sandbox.spy();
                var sendDownstreamSpy = sandbox.spy();
                
                connect.isCRM = sandbox.stub().returns(true);
                connect.isFramed = sandbox.stub().returns(true);
                connect.isCCP = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                logger.info('Test log in CRM framed CCP');
                
                // Should broadcast via sendUpstream
                assert.isTrue(sendUpstreamSpy.calledOnce, 'sendUpstream should be called for CRM broadcast');
                
                // Should NOT send downstream because broadcast succeeded
                assert.isFalse(sendDownstreamSpy.called, 'sendDownstream should NOT be called when broadcast succeeds');
            });

            it('should NOT send downstream when shouldSendDownstream=false even if broadcast=false', function() {
                var sendUpstreamSpy = sandbox.spy();
                var sendDownstreamSpy = sandbox.spy();
                
                connect.isCRM = sandbox.stub().returns(false);
                connect.isFramed = sandbox.stub().returns(true);
                connect.isCCP = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                // Call addLogEntry with shouldSendDownstream=false
                var logEntry = new connect.LogEntry('ccp', 'INFO', 'Test message', logger.getLoggerId(), null, null);
                logger.addLogEntry(logEntry, false);
                
                // Should NOT send downstream even though broadcast=false, because shouldSendDownstream=false
                assert.isFalse(sendDownstreamSpy.called, 'sendDownstream should NOT be called when shouldSendDownstream=false');
            });

            it('should handle non-framed CCP correctly (no downstream regardless of broadcast)', function() {
                var sendUpstreamSpy = sandbox.spy();
                var sendDownstreamSpy = sandbox.spy();
                
                connect.isCRM = sandbox.stub().returns(false);
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                logger.info('Test log in non-framed CCP');
                
                // Should NOT send downstream because isFramed=false
                assert.isFalse(sendDownstreamSpy.called, 'sendDownstream should NOT be called for non-framed CCP');
            });

            it('should handle multiple logs correctly with broadcast boolean', function() {
                var sendUpstreamSpy = sandbox.spy();
                var sendDownstreamSpy = sandbox.spy();
                
                connect.isCRM = sandbox.stub().returns(true);
                connect.isFramed = sandbox.stub().returns(true);
                connect.isCCP = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                logger.info('First log');
                logger.warn('Second log');
                logger.error('Third log');
                
                // All three should be broadcast via sendUpstream
                assert.equal(sendUpstreamSpy.callCount, 3, 'sendUpstream should be called three times');
                
                // None should be sent downstream because all were broadcast
                assert.isFalse(sendDownstreamSpy.called, 'sendDownstream should NOT be called for any broadcast logs');
            });
        });

        describe('CRM broadcast integration scenarios', function() {
            it('should work correctly with all log levels', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                
                logger.trace('trace message');
                logger.debug('debug message');
                logger.info('info message');
                logger.log('log message');
                logger.warn('warn message');
                logger.error('error message');
                
                assert.equal(sendUpstreamSpy.callCount, 6, 'All log levels should be broadcast');
            });

            it('should work correctly with softphone component logs', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                
                // Log with softphone component
                logger.info(connect.LogComponent.SOFTPHONE, 'Softphone log message');
                
                assert.equal(sendUpstreamSpy.callCount, 1);
                assert.equal(sendUpstreamSpy.getCall(0).args[1].data.component, 'softphone');
            });

            it('should broadcast logs with objects attached', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                connect.deepcopy = function(obj) { return JSON.parse(JSON.stringify(obj)); };
                
                var logger = new connect.Logger();
                
                var logEntry = logger.info('Log with object').withObject({ key: 'value', data: 123 });
                
                assert.equal(sendUpstreamSpy.callCount, 1);
                // The broadcast should include the log entry with its objects
                var broadcastedEntry = sendUpstreamSpy.getCall(0).args[1].data;
                assert.isArray(broadcastedEntry.objects);
            });

            it('should broadcast logs with exceptions attached', function() {
                var sendUpstreamSpy = sandbox.spy();
                connect.isCRM = sandbox.stub().returns(true);
                connect.core = {
                    getUpstream: sandbox.stub().returns({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sandbox.stub()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = sandbox.stub().returns(false);
                connect.isCCP = sandbox.stub().returns(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                
                var logger = new connect.Logger();
                
                var error = new Error('Test error');
                var logEntry = logger.error('Error occurred').withException(error);
                
                assert.equal(sendUpstreamSpy.callCount, 1);
                var broadcastedEntry = sendUpstreamSpy.getCall(0).args[1].data;
                assert.isNotNull(broadcastedEntry.exception);
            });
        });
    });
});
