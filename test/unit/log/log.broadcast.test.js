describe('Logger', () => {
    describe('CRM Layer Log Broadcast (Dual CCP Synchronization)', () => {
        let originalAgent;
        let originalAgentConstructor;
        let originalIsCRM;
        let originalCore;
        let originalUpstream;
        let originalEventBus;
        let originalClientEngine;
        let originalIsFramed;
        let originalIsCCP;
        let originalIsSharedWorker;
        let originalEventType;
        let originalLogComponent;
        let originalDeepCopy;
        let originalRootLogger;

        beforeEach(() => {
            // Save/restore the connect.* globals per test so nothing leaks across tests.
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

            connect.agent = {
                initialized: true
            };

            connect.Agent = function() {
                return {
                    getAgentId: () => 'test-agent-id'
                };
            };

            if (connect.featureFlagProvider) {
                jest.spyOn(connect.featureFlagProvider, 'getFeatureFlags').mockReturnValue({});
            }
        });

        afterEach(() => {
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

        describe('Logger.addLogEntry CRM broadcast', () => {
            it('should broadcast log entry when isCRM() returns true and loggerId matches', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                const logEntry = logger.info('Test CRM log message');

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
                expect(sendUpstreamSpy.mock.calls[0][0]).toBe('broadcast');
                expect(sendUpstreamSpy.mock.calls[0][1]).toEqual({
                    event: 'log',
                    data: logEntry
                });
            });

            it('should NOT broadcast log entry when isCRM() returns false', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(false);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                logger.info('Test non-CRM log message');

                expect(sendUpstreamSpy).not.toHaveBeenCalled();
            });

            it('should NOT broadcast log entry when loggerId does not match (prevents loops)', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                const foreignLogEntry = new connect.LogEntry('ccp', 'INFO', 'Foreign log', 'different-logger-id', null, null);

                logger.addLogEntry(foreignLogEntry);

                // sendUpstream should NOT be called because loggerId doesn't match
                expect(sendUpstreamSpy).not.toHaveBeenCalled();
            });

        });

        describe('LogEntry.sendInternalLogToServer CRM broadcast', () => {
            it('should broadcast server-bound log when isCRM() returns true and loggerId matches', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };

                const logger = new connect.Logger();
                const savedRootLogger = connect.rootLogger;
                connect.rootLogger = logger;

                const logEntry = logger.info('Server-bound log message');
                logEntry.sendInternalLogToServer();

                connect.rootLogger = savedRootLogger;

                // First call is from addLogEntry (LOG broadcast), second from sendInternalLogToServer
                expect(sendUpstreamSpy).toHaveBeenCalledTimes(2);

                const serverBoundCall = sendUpstreamSpy.mock.calls[1];
                expect(serverBoundCall[0]).toBe('broadcast');
                expect(serverBoundCall[1]).toEqual({
                    event: 'server_bound_internal_log',
                    data: logEntry
                });
            });

            it('should NOT broadcast server-bound log when isCRM() returns false', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(false);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };

                const logger = new connect.Logger();
                const savedRootLogger = connect.rootLogger;
                connect.rootLogger = logger;

                const logEntry = logger.info('Server-bound log message');
                logEntry.sendInternalLogToServer();

                connect.rootLogger = savedRootLogger;

                expect(sendUpstreamSpy).not.toHaveBeenCalled();
            });

            it('should NOT broadcast server-bound log when loggerId does not match', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };

                const logger = new connect.Logger();
                const savedRootLogger = connect.rootLogger;
                connect.rootLogger = logger;

                const foreignLogEntry = new connect.LogEntry('ccp', 'INFO', 'Foreign server log', 'different-logger-id', null, null);
                foreignLogEntry.sendInternalLogToServer();

                connect.rootLogger = savedRootLogger;

                // sendUpstream should not be called because loggerId doesn't match
                expect(sendUpstreamSpy).not.toHaveBeenCalled();
            });

            it('should still add log to _serverBoundInternalLogs even when broadcast fails', () => {
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockImplementation(() => {
                        throw new Error('Upstream error');
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);

                const logger = new connect.Logger();
                const savedRootLogger = connect.rootLogger;
                connect.rootLogger = logger;

                const initialCount = logger._serverBoundInternalLogs.length;
                const logEntry = new connect.LogEntry('ccp', 'INFO', 'Test log', logger.getLoggerId(), null, null);

                // Due to try-catch wrapper, this should not throw
                // But the log should still be added to _serverBoundInternalLogs
                try {
                    logEntry.sendInternalLogToServer();
                } catch (e) {
                }

                connect.rootLogger = savedRootLogger;

                // Log should have been added before the broadcast attempt
                expect(logger._serverBoundInternalLogs.length).toBe(initialCount + 1);
            });

            it('should NOT broadcast server-bound log when in SharedWorker context', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(false);
                connect.isSharedWorker = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log',
                    SERVER_BOUND_INTERNAL_LOG: 'server_bound_internal_log'
                };

                const logger = new connect.Logger();
                const savedRootLogger = connect.rootLogger;
                connect.rootLogger = logger;

                const logEntry = logger.info('SharedWorker log');
                logEntry.sendInternalLogToServer();

                connect.rootLogger = savedRootLogger;

                // sendUpstream should NOT be called because we're in SharedWorker context, not CRM
                expect(sendUpstreamSpy).not.toHaveBeenCalled();
            });
        });

        describe('CRM broadcast deduplication (loop prevention)', () => {
            it('should not rebroadcast logs received from other CCPs', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();

                const scvLogEntry = new connect.LogEntry('ccp', 'INFO', 'Log from SCV CCP', 'scv-logger-id-12345', 'scv-tab', 'CRM');
                const sccLogEntry = new connect.LogEntry('ccp', 'INFO', 'Log from SCC-AC CCP', 'scc-logger-id-67890', 'scc-tab', 'CRM');

                logger.addLogEntry(scvLogEntry);
                logger.addLogEntry(sccLogEntry);

                // Neither should trigger a broadcast since their loggerIds don't match the local logger
                expect(sendUpstreamSpy).not.toHaveBeenCalled();

                // But logs should still be stored locally
                expect(logger._logs.includes(scvLogEntry)).toBe(true);
                expect(logger._logs.includes(sccLogEntry)).toBe(true);
            });

            it('should broadcast only locally-originated logs', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();

                const foreignLog = new connect.LogEntry('ccp', 'INFO', 'Foreign log', 'foreign-logger-id', null, null);
                logger.addLogEntry(foreignLog);
                expect(sendUpstreamSpy).toHaveBeenCalledTimes(0);

                const localLog = logger.info('Local log');
                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);

                expect(sendUpstreamSpy.mock.calls[0][1].data).toBe(localLog);
            });
        });

        describe('Broadcast boolean prevents duplicate downstream sending', () => {
            it('should NOT send downstream when broadcast succeeds in CRM layer', () => {
                const sendUpstreamSpy = jest.fn();
                const sendDownstreamSpy = jest.fn();

                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.isFramed = jest.fn().mockReturnValue(true);
                connect.isCCP = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                logger.info('Test log in CRM framed CCP');

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);

                // Should NOT send downstream because broadcast succeeded
                expect(sendDownstreamSpy).not.toHaveBeenCalled();
            });


            it('should NOT send downstream when shouldSendDownstream=false even if broadcast=false', () => {
                const sendUpstreamSpy = jest.fn();
                const sendDownstreamSpy = jest.fn();

                connect.isCRM = jest.fn().mockReturnValue(false);
                connect.isFramed = jest.fn().mockReturnValue(true);
                connect.isCCP = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                const logEntry = new connect.LogEntry('ccp', 'INFO', 'Test message', logger.getLoggerId(), null, null);
                logger.addLogEntry(logEntry, false);

                // Should NOT send downstream even though broadcast=false, because shouldSendDownstream=false
                expect(sendDownstreamSpy).not.toHaveBeenCalled();
            });

            it('should handle non-framed CCP correctly (no downstream regardless of broadcast)', () => {
                const sendUpstreamSpy = jest.fn();
                const sendDownstreamSpy = jest.fn();

                connect.isCRM = jest.fn().mockReturnValue(false);
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                logger.info('Test log in non-framed CCP');

                // Should NOT send downstream because isFramed=false
                expect(sendDownstreamSpy).not.toHaveBeenCalled();
            });

            it('should handle multiple logs correctly with broadcast boolean', () => {
                const sendUpstreamSpy = jest.fn();
                const sendDownstreamSpy = jest.fn();

                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.isFramed = jest.fn().mockReturnValue(true);
                connect.isCCP = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: sendDownstreamSpy
                    }),
                    tabId: 'test-tab-id'
                };
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();
                logger.info('First log');
                logger.warn('Second log');
                logger.error('Third log');

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(3);

                // None should be sent downstream because all were broadcast
                expect(sendDownstreamSpy).not.toHaveBeenCalled();
            });
        });

        describe('CRM broadcast integration scenarios', () => {
            it('should work correctly with all log levels', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();

                logger.trace('trace message');
                logger.debug('debug message');
                logger.info('info message');
                logger.log('log message');
                logger.warn('warn message');
                logger.error('error message');

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(6);
            });

            it('should work correctly with softphone component logs', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();

                logger.info(connect.LogComponent.SOFTPHONE, 'Softphone log message');

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
                expect(sendUpstreamSpy.mock.calls[0][1].data.component).toBe('softphone');
            });

            it('should broadcast logs with objects attached', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };
                connect.deepcopy = (obj) => JSON.parse(JSON.stringify(obj));

                const logger = new connect.Logger();

                const logEntry = logger.info('Log with object').withObject({ key: 'value', data: 123 });

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
                const broadcastedEntry = sendUpstreamSpy.mock.calls[0][1].data;
                expect(Array.isArray(broadcastedEntry.objects)).toBe(true);
            });

            it('should broadcast logs with exceptions attached', () => {
                const sendUpstreamSpy = jest.fn();
                connect.isCRM = jest.fn().mockReturnValue(true);
                connect.core = {
                    getUpstream: jest.fn().mockReturnValue({
                        sendUpstream: sendUpstreamSpy,
                        sendDownstream: jest.fn()
                    }),
                    tabId: 'test-tab-id'
                };
                connect.isFramed = jest.fn().mockReturnValue(false);
                connect.isCCP = jest.fn().mockReturnValue(false);
                connect.EventType = {
                    BROADCAST: 'broadcast',
                    LOG: 'log'
                };

                const logger = new connect.Logger();

                const error = new Error('Test error');
                const logEntry = logger.error('Error occurred').withException(error);

                expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
                const broadcastedEntry = sendUpstreamSpy.mock.calls[0][1].data;
                expect(broadcastedEntry.exception).not.toBeNull();
            });
        });
    });
});
