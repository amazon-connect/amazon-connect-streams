describe('Logger', () => {
    describe('Logger.setLogLevel / setEchoLevel (validation)', () => {
        it('setLogLevel sets the numeric level for a valid level on a fresh logger', () => {
            const logger = new connect.Logger();
            logger.setLogLevel(connect.LogLevel.CRITICAL);
            expect(logger._logLevel).toBe(200);
        });

        it('setLogLevel throws on an unknown level (fresh, unwrapped logger)', () => {
            const logger = new connect.Logger();
            expect(() => { logger.setLogLevel('INVALID'); }).toThrow('Unknown logging level: INVALID');
        });

        it('setEchoLevel sets the numeric echo level for a valid level', () => {
            const logger = new connect.Logger();
            logger.setEchoLevel(connect.LogLevel.TRACE);
            expect(logger._echoLevel).toBe(10);
        });

        it('setEchoLevel throws on an unknown level (fresh, unwrapped logger)', () => {
            const logger = new connect.Logger();
            expect(() => { logger.setEchoLevel('UNKNOWN'); }).toThrow('Unknown logging level: UNKNOWN');
        });
    });

    describe('Logger.setLogRollInterval', () => {
        let realSetInterval, realClearInterval;
        beforeEach(() => {
            realSetInterval = global.setInterval;
            realClearInterval = global.clearInterval;
        });
        afterEach(() => {
            global.setInterval = realSetInterval;
            global.clearInterval = realClearInterval;
        });

        it('warns and does not create a new timer when the interval is unchanged', () => {
            const logger = new connect.Logger();
            logger._logRollTimer = 999; // existing timer
            global.setInterval = jest.fn();
            const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

            logger.setLogRollInterval(logger._logRollInterval);

            expect(global.setInterval).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalled();
        });

        it('clears the old timer and schedules a new one when the interval changes', () => {
            const logger = new connect.Logger();
            logger._logRollTimer = 111;
            global.clearInterval = jest.fn();
            global.setInterval = jest.fn().mockReturnValue(222);

            logger.setLogRollInterval(60000);

            expect(global.clearInterval).toHaveBeenCalledWith(111);
            expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
            expect(logger._logRollInterval).toBe(60000);
        });

        it('the roll callback rotates _logs into _rolledLogs and resets the push index', () => {
            const logger = new connect.Logger();
            let captured;
            global.setInterval = jest.fn((cb) => { captured = cb; return 1; });
            const infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
            logger._logs = [{ id: 1 }];
            logger._startLogIndexToPush = 5;

            logger.setLogRollInterval(60000);
            captured(); // run the interval callback

            expect(logger._rolledLogs).toEqual([{ id: 1 }]);
            expect(logger._logs).toEqual([]);
            expect(logger._startLogIndexToPush).toBe(0);
            expect(infoSpy).toHaveBeenCalledWith('Log roll interval occurred.');
        });
    });

    describe('Logger.download', () => {
        let logger;
        let anchor;
        let realCreateObjectURL;

        beforeEach(() => {
            logger = new connect.Logger();
            logger._rolledLogs = [];
            logger._logs = [];
            anchor = { href: '', download: '', click: jest.fn() };
            jest.spyOn(document, 'createElement').mockReturnValue(anchor);
            jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
            jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
            realCreateObjectURL = global.URL.createObjectURL;
            global.URL.createObjectURL = jest.fn().mockReturnValue('blob:fake');
        });

        afterEach(() => {
            global.URL.createObjectURL = realCreateObjectURL;
        });

        it('downloads with the default agent-log name and clicks the anchor', () => {
            logger.download();
            expect(anchor.download).toBe('agent-log.txt');
            expect(anchor.href).toBe('blob:fake');
            expect(anchor.click).toHaveBeenCalledTimes(1);
        });

        it('uses a string option as the log name', () => {
            logger.download('my-custom-log');
            expect(anchor.download).toBe('my-custom-log.txt');
        });

        it('uses options.logName from an object option', () => {
            logger.download({ logName: 'object-log' });
            expect(anchor.download).toBe('object-log.txt');
        });

        it('filters entries below the log level when filterByLogLevel is set', () => {
            // Capture the serialized log payload passed to the Blob so we can assert
            // the below-threshold entry was actually dropped (not just that download ran).
            let blobParts;
            const realBlob = global.Blob;
            global.Blob = jest.fn((parts) => { blobParts = parts; });
            try {
                logger.setLogLevel(connect.LogLevel.ERROR); // 100
                logger._logs = [
                    { level: connect.LogLevel.INFO, text: 'lo' },     // 30, filtered out
                    { level: connect.LogLevel.CRITICAL, text: 'hi' },  // 200, kept
                ];
                logger.download({ filterByLogLevel: true });

                expect(blobParts[0]).toContain('hi');     // CRITICAL kept
                expect(blobParts[0]).not.toContain('lo');  // INFO dropped
            } finally {
                global.Blob = realBlob;
            }
        });

        it('includes all entries when filterByLogLevel is not set', () => {
            let blobParts;
            const realBlob = global.Blob;
            global.Blob = jest.fn((parts) => { blobParts = parts; });
            try {
                logger.setLogLevel(connect.LogLevel.ERROR);
                logger._logs = [
                    { level: connect.LogLevel.INFO, text: 'lo' },
                    { level: connect.LogLevel.CRITICAL, text: 'hi' },
                ];
                logger.download();

                expect(blobParts[0]).toContain('hi');
                expect(blobParts[0]).toContain('lo'); // not filtered -> INFO retained
            } finally {
                global.Blob = realBlob;
            }
        });

        it('prefixes the log name with crm- and downloads CCP logs under Global Resiliency', () => {
            jest.spyOn(connect.globalResiliency, '_downloadCCPLogs').mockImplementation(() => {});
            const original = connect.globalResiliency.globalResiliencyEnabled;
            connect.globalResiliency.globalResiliencyEnabled = true;
            try {
                logger.download('agent-log');
                expect(connect.globalResiliency._downloadCCPLogs).toHaveBeenCalledTimes(1);
                expect(anchor.download).toBe('crm-agent-log.txt');
            } finally {
                connect.globalResiliency.globalResiliencyEnabled = original;
            }
        });
    });

    describe('Logger.addLogEntry level filtering', () => {
        let infoSpy;
        beforeEach(() => {
            jest.spyOn(connect, 'isFramed').mockReturnValue(false);
            jest.spyOn(connect, 'isCCP').mockReturnValue(false);
            jest.spyOn(connect, 'isCRM').mockReturnValue(false);
            infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        });
        afterEach(() => {
            infoSpy.mockRestore();
        });

        it('only assigns incrementing line numbers to entries at/above the log level', () => {
            const logger = new connect.Logger();      // fresh: _lineCount === 0
            logger.setLogLevel(connect.LogLevel.INFO); // 30
            const t = logger.trace('trace');  // 10 < 30 -> filtered (no line)
            const d = logger.debug('debug');  // 20 < 30 -> filtered
            const i = logger.info('info');    // 30 >= 30 -> line 0
            const w = logger.warn('warn');    // 50 >= 30 -> line 1

            expect(t.line).toBe(0); // constructor default, never assigned
            expect(d.line).toBe(0);
            expect(i.line).toBe(0); // first qualifying entry
            expect(w.line).toBe(1);
            expect(logger._lineCount).toBe(2);
            // all entries are stored regardless of level
            expect(logger._logs).toEqual(expect.arrayContaining([t, d, i, w]));
        });

        it('echoes to the console only when the level is at/above the echo level', () => {
            const logger = new connect.Logger();
            logger.setLogLevel(connect.LogLevel.DEBUG);   // 20 - keep everything
            logger.setEchoLevel(connect.LogLevel.CRITICAL); // 200 - echo nothing below
            logger.debug('quiet');
            expect(console.info).not.toHaveBeenCalled();

            logger.setEchoLevel(connect.LogLevel.DEBUG); // 20 - now echo
            logger.debug('loud');
            expect(console.info).toHaveBeenCalled();
        });
    });

    describe('Logger.pushClientSideLogsDownstream', () => {
        let publishSpy;
        beforeEach(() => {
            publishSpy = jest.spyOn(connect, 'publishClientSideLogs').mockImplementation(() => {});
        });

        it('does not publish when fewer than 50 server-bound logs are queued', () => {
            const logger = new connect.Logger();
            logger._serverBoundInternalLogs = new Array(49).fill({ id: 1 });
            logger.pushClientSideLogsDownstream();
            expect(publishSpy).not.toHaveBeenCalled();
            expect(logger._serverBoundInternalLogs.length).toBe(49); // untouched
        });

        it('publishes and clears the queue when between 50 and 500 logs are queued', () => {
            const logger = new connect.Logger();
            logger._serverBoundInternalLogs = new Array(100).fill({ id: 1 });
            logger.pushClientSideLogsDownstream();
            expect(publishSpy).toHaveBeenCalledTimes(1);
            expect(publishSpy.mock.calls[0][0].length).toBe(100);
            expect(logger._serverBoundInternalLogs).toEqual([]);
        });

        it('publishes only the first 500 and leaves the remainder queued when over 500', () => {
            const logger = new connect.Logger();
            logger._serverBoundInternalLogs = new Array(650).fill({ id: 1 });
            logger.pushClientSideLogsDownstream();
            expect(publishSpy).toHaveBeenCalledTimes(1);
            expect(publishSpy.mock.calls[0][0].length).toBe(500);
            expect(logger._serverBoundInternalLogs.length).toBe(150); // 650 - 500 remain
        });
    });

    describe('DownstreamConduitLogger', () => {
        it('pushLogsDownstream forwards each log to the conduit as a LOG event', () => {
            const sendDownstream = jest.fn();
            const conduit = { sendDownstream: sendDownstream };
            const logger = new connect.DownstreamConduitLogger(conduit);
            const logs = [{ id: 1 }, { id: 2 }];

            logger.pushLogsDownstream(logs);

            expect(sendDownstream).toHaveBeenCalledTimes(2);
            expect(sendDownstream).toHaveBeenCalledWith(connect.EventType.LOG, { id: 1 });
            expect(sendDownstream).toHaveBeenCalledWith(connect.EventType.LOG, { id: 2 });
        });
    });
});
