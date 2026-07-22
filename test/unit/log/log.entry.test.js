describe('Logger', () => {
    describe('LogEntry.withException()', () => {
        it('extracts type, message, and stack when called with object inheriting from Error', () => {
            const message = "my syntax error";
            const err = SyntaxError(message);
            const loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            expect(loggedException.type).toBe("SyntaxError");
            expect(loggedException.message).toBe(message);
            expect(loggedException.stack).toEqual(err.stack.split('\n'));
        });
        it('extracts type, message, and stack when called with object error returned by AWS client', () => {
            const err = { code: "TestError", message: "error message" };
            const loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            expect(loggedException.type).toBe(err.code);
            expect(loggedException.message).toBe(err.message);
            expect(loggedException.stack).toEqual([]);
        });
        it('determines type using Object.prototype.toString() if called with unrecognized object', () => {
            const err = "error message";
            const loggedException = connect.getLog().error("Error encountered").withException(err).exception;
            expect(loggedException.type).toBe("[object String]");
            // A string input has no .message, so the LoggedException copies undefined.
            expect(loggedException.message).toBeUndefined();
            expect(loggedException.stack).toEqual([]);
        });
    });

    describe('Exceptions in logger class should not be thrown', () => {
        let originalLogLevel;

        beforeEach(() => {
            originalLogLevel = connect.getLog()._logLevel;
        });

        afterEach(() => {
            connect.getLog()._logLevel = originalLogLevel;
        });

        it('swallows the setLogLevel error on the wrapped singleton (leaving the level unchanged)', () => {
            const logger = connect.getLog();
            logger.setLogLevel("invalid log level");
            expect(logger._logLevel).toBe(30);
        })
    });

    describe('Logger.withObject()', () => {
        it('Log should not contain websocket auth token', () => {
            const obj =  {
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?AuthToken=QVFJREFIa==",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            };
            const expectedObj = [{
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            }];
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('log should have presigned URL as MD5 digest', () => {
            const obj = {
                "agentDiscoveryTransport": {
                    "presignedUrl": "https://presignedurl"
                }
            };
            const expectedObj = [{
                "agentDiscoveryTransport": {
                    "presignedUrl": "[obfuscated value] 57d2675deb0ead32441d389bb95cadc5"
                }
            }];
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('Log should have VoiceID customerId, CustomerId, SpeakerId, or CustomerSpeakerId values as MD5 digest', () => {
            const obj = {
                "customerId":"69b39df2-a06a-4f66-a9a9-ad699004d245",
                "CustomerId":"52d67abc-9aa8-4276-9de0-8dbe48220a1c",
                "SpeakerId":"1c58b4c5-6dff-4182-9eab-479aa2e78a3c",
                "CustomerSpeakerId":"89376e97-9370-481f-ba55-afdca7854c09",
                "DomainId":"XKkbTGuCuCnYgOD1iPHzPv"
            };
            const expectedObj = [{
                "customerId":"[obfuscated value] 86afb5d2f86f0ddbe298a8dd895bf5aa",
                "CustomerId":"[obfuscated value] a80f842e82ba7031ae6e22d939b179cf",
                "SpeakerId":"[obfuscated value] 7e7d858bbf580fdaba583bfb0bf4a118",
                "CustomerSpeakerId":"[obfuscated value] 82d1d42ff66faf8403e8eda577bb9e10",
                "DomainId":"XKkbTGuCuCnYgOD1iPHzPv"
            }];
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('Log should not break if the value of url or text is not a string', () => {
            const obj =  {
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
            const expectedObj = [{
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
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('Log should be redacting sensitive information', () => {
            const obj =  {
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
            const expectedObj = [{
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
            const loggedObject = connect.getLog().trace("Testing logging string").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('Log should redact all fields in redactedFields array', () => {
            const obj = {
                "quickConnectName": "SensitiveQuickConnect",
                "token": "secret-token-123",
                "login": "admin@example.com",
                "credential": "my-secret-credential",
                "internalIp": "192.168.1.100",
                "authToken": "Bearer abc123xyz",
                "phoneNumber": "+1-555-0123",
                "firstName": "John",
                "lastName": "Doe",
                "emailAddress": "john.doe@example.com",
                "address": "123 Main Street",
                "displayName": "John Doe Display",
                "agentName": "Agent Smith",
                "description": "Sensitive description text",
                "name": "Contact Name",
                "value": "Important Value",
                "summary": "Case summary details",
                "connectionAuthenticationToken": "conn-auth-token-xyz",
                "queue": {
                    "name": "VIP Support Queue",
                    "queueId": "queue-123"
                },
                "nonSensitiveField": "This should not be redacted"
            };
            const expectedObj = [{
                "quickConnectName": "[redacted]",
                "token": "[redacted]",
                "login": "[redacted]",
                "credential": "[redacted]",
                "internalIp": "[redacted]",
                "authToken": "[redacted]",
                "phoneNumber": "[redacted]",
                "firstName": "[redacted]",
                "lastName": "[redacted]",
                "emailAddress": "[redacted]",
                "address": "[redacted]",
                "displayName": "[redacted]",
                "agentName": "[redacted]",
                "description": "[redacted]",
                "name": "[redacted]",
                "value": "[redacted]",
                "summary": "[redacted]",
                "connectionAuthenticationToken": "conn-auth-token-xyz",
                "queue": {
                    "name": "[redacted]",
                    "queueId": "queue-123"
                },
                "nonSensitiveField": "This should not be redacted"
            }];
            const loggedObject = connect.getLog().trace("Testing all redacted fields").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });

        it('Log should now contain the agentName in the snapshot object', () => {
            const obj =  {
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
            const expectedObj = [{
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
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
        it('Log should handle contact data included as reference in agent snapshot (task template)', () => {
            const obj = {
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

            const expectedObj = [{
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

            const loggedObject = connect.getLog().trace("Testing comprehensive contact data redaction").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });

        it('Log should NOT redact agent state name but should redact other name fields', () => {
            const obj = {
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

            const expectedObj = [{
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


            const loggedObject = connect.getLog().trace("Testing agent state name preservation").withObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
    });

    describe('Logger.withCrossOriginEventObject()', () => {
        it('Log should be empty as none of these are the right fields.', () => {
            const obj =  {
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?AuthToken=QVFJREFIa==",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            };
            const expectedObj = [{
                "webSocketTransport": {
                    "url": "wss://15isv8flsl.execute-api.us-west-2.amazonaws.com/gamma/?[redacted]",
                    "transportLifeTimeInSeconds": 3869,
                    "expiry": "2021-03-09T20:03:34.625Z"
                }
            }];
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withCrossOriginEventObject(obj);
            expect(loggedObject.objects).not.toEqual(expectedObj);
            expect(loggedObject.objects).toEqual([{}]);
        });
        it('Log should not break if the value of url or text is not a string', () => {
            const obj =  {
                "bubbles": true
            };
            const expectedObj = [{
                "bubbles": true
            }];
            const loggedObject = connect.getLog().trace("AWSClient: <-- Operation '%s' succeeded.").withCrossOriginEventObject(obj);
            expect(loggedObject.objects).toEqual(expectedObj);
        });
    });

     describe('Logger Default Levels', () => {
        it('should initialize with default log level INFO (30)', () => {
            const logger = new connect.Logger();
            expect(logger._logLevel).toBe(30);
        });

        it('should initialize with default echo level INFO (30)', () => {
            const logger = new connect.Logger();
            expect(logger._echoLevel).toBe(30);
        });
    });

    describe('LogEntry fields', () => {
        let agentResourceId = "id";
        let originalLogLevel;
        let originalEchoLevel;
        let originalAgentInitialized;
        let originalTabId;

        beforeEach(() => {
            originalAgentInitialized = connect.agent.initialized;
            connect.agent.initialized = true;
            // Set tabId + a truthy context predicate explicitly so the LogEntry gets a
            // tabId + contextLayer without depending on cross-suite state.
            originalTabId = connect.core ? connect.core.tabId : undefined;
            if (connect.core) {
                connect.core.tabId = 'tabId';
            }
            jest.spyOn(connect, 'isCCP').mockReturnValue(true);
            originalLogLevel = connect.getLog()._logLevel;
            originalEchoLevel = connect.getLog()._echoLevel;
        });

        afterEach(() => {
            connect.agent.initialized = originalAgentInitialized;
            if (connect.core) {
                connect.core.tabId = originalTabId;
            }
            connect.getLog()._logLevel = originalLogLevel;
            connect.getLog()._echoLevel = originalEchoLevel;
        });
        it("provides the correct agentResourceId", () => {
            let log = connect.getLog().info("hi");
            expect(log.getAgentResourceId()).toBe(agentResourceId);
        });

        it("carries the core tabId onto the LogEntry", () => {
            let log = connect.getLog().info("hi");
            expect(log.tabId).toBe('tabId'); // beforeEach sets connect.core.tabId = 'tabId'
        });

        it("resolves contextLayer to CCP when isCCP() is true", () => {
            let log = connect.getLog().info("hi");
            expect(log.contextLayer).toBe('CCP'); // LogContextLayer.CCP; isCCP mocked true in beforeEach
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
            expect(log.contextLayer).toBe('contextLayer');
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
            expect(log.tabId).toBe('tabId');
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
            expect(log.tabId).toBeNull();
        })

        it("LogEntry tabId should be null when not passed in fromObject invocation", () => {
            let log = connect.LogEntry.fromObject({
                level: null,
                text: "text",
                loggerId: "loggerId",
                exception: null,
                objects: {}
            })
            expect(log.tabId).toBeNull();
        })

        it("includes the agentResourceId when printed, and the correct log string", () => {
            let spy = jest.spyOn(connect, "sprintf");
            connect.getLog().setEchoLevel("INFO");
            connect.getLog().info("hello");
            // The first three args (timestamp, level, format) are arbitrary strings;
            // agentResourceId + text are exact.
            expect(spy).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(String),
                agentResourceId,
                "hello"
            );
        });
    });
});
