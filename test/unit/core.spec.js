const { assert, expect } = require("chai");

require("../unit/test-setup.js");

describe('Core', function () {
    var sandbox = sinon.createSandbox();

    beforeEach(function () {
        this.defaultRingtoneUrl = "https://d366s8lxuwna4d.cloudfront.net/ringtone-ba0c9bd8a1d12786318965fd908eb2998bdb8f4c.mp3";
        this.params = {
            agentLogin: "abc",
            authToken: "xyz",
            authTokenExpiration: "Thu Apr 19 23:30:07 UTC 2018",
            baseUrl: "https://abc.awsapps.com",
            ccpUrl: "url.com",
            refreshToken: "abc",
            region: "us-west-2",
            sharedWorkerUrl: "/connect/static/connect-shared-worker.js",
            softphone: {
                ringtoneUrl: this.defaultRingtoneUrl
            },
            chat: {
                ringtoneUrl: this.defaultRingtoneUrl
            }
        };
        this.defaultRingtone = {
            voice: { ringtoneUrl: this.defaultRingtoneUrl },
            queue_callback: { ringtoneUrl: this.defaultRingtoneUrl }
        };
        this.extraRingtone = {
            voice: { ringtoneUrl: this.defaultRingtoneUrl },
            queue_callback: { ringtoneUrl: this.defaultRingtoneUrl },
            chat: { ringtoneUrl: this.defaultRingtoneUrl },
            task: { ringtoneUrl: this.defaultRingtoneUrl }
        };
    });
    
    describe('#connect.core.initSharedWorker()', function () {
        jsdom({ url: "http://localhost" });
        var clock 
         
        beforeEach(function () {
            clock = sinon.useFakeTimers();
            this.containerDiv = { appendChild: sandbox.spy() };
            connect.core.initCCP(this.containerDiv, this.params);
            sandbox.stub(connect.core, "checkNotInitialized").returns(true);
            global.SharedWorker = sandbox.stub().returns({
                port: {
                    start: sandbox.spy(),
                    addEventListener: sandbox.spy()
                },
            })

            global.connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getNotificationManager').returns({
                requestPermission: sandbox.spy()
            });

            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
        });
        afterEach(function () {
            sandbox.restore();
            clock.restore();
        });
        it("shared worker initialization", function () {
            expect(this.params.sharedWorkerUrl).not.to.be.a("0");
            expect(this.params.authToken).not.to.be.a("null");
            expect(this.params.region).not.to.be.a("null");
            connect.core.initSharedWorker(this.params);
            expect(connect.core.checkNotInitialized.called);
            expect(SharedWorker.calledWith(this.params.sharedWorkerUrl, "ConnectSharedWorker"));
            expect(connect.core.region).not.to.be.a("null");
        });
        it("should update the number of connected CCPs on UPDATE_CONNECTED_CCPS event", function () {
            connect.core.initSharedWorker(this.params);
            expect(connect.numberOfConnectedCCPs).to.equal(0);
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
            expect(connect.numberOfConnectedCCPs).to.equal(1);
        });
        it("should set portStreamId on ACK", function () {
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            expect(connect.core.portStreamId).to.equal('portId');
            connect.core.initialized = false;
        });
        it.skip("Replicates logs received upstream while ignoring duplicates", function () {
            var logger = connect.getLog();
            var loggerId = logger.getLoggerId();
            var originalLoggerLength = logger._logs.length;
            var newLogs = [
                new connect.LogEntry("test", connect.LogLevel.LOG, "some log", "some-logger-id"),
                new connect.LogEntry("test", connect.LogLevel.LOG, "some log with no logger id", null),
                new connect.LogEntry("test", connect.LogLevel.INFO, "some log info", "some-logger-id"),
                new connect.LogEntry("test", connect.LogLevel.ERROR, "some log error", "some-logger-id")
            ];
            var dupLogs = [
                new connect.LogEntry("test", connect.LogLevel.LOG, "some dup log", loggerId),
                new connect.LogEntry("test", connect.LogLevel.INFO, "some dup log info", loggerId),
                new connect.LogEntry("test", connect.LogLevel.ERROR, "some dup log error", loggerId)
            ]
            var allLogs = newLogs.concat(dupLogs);
            for (var i = 0; i < allLogs.length; i++) {
                connect.core.getUpstream().upstreamBus.trigger(connect.EventType.LOG, allLogs[i]);
            }
            clock.tick(2000);
            assert.lengthOf(logger._logs, originalLoggerLength + newLogs.length);
        });
    });
    describe('legacy endpoint', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });

        beforeEach(function () {
            sandbox.stub(connect.core, "checkNotInitialized").returns(true);
            global.SharedWorker = sandbox.stub().returns({
                port: {
                    start: sandbox.spy(),
                    addEventListener: sandbox.spy()
                },
            })

            global.connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getNotificationManager').returns({
                requestPermission: sandbox.spy()
            });

            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
        });

        afterEach(function () {
            sandbox.restore();
        });

        it("uses the legacy endpoint for a legacy url", function () {
            const href = "https://abc.awsapps.com/connect/ccp-v2";
            window.location.href = href;
            connect.core.initSharedWorker(this.params);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.called);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.getCalls()[0].lastArg.authorizeEndpoint === "/connect/auth/authorize");
        });
    });
    describe('new endpoint', function () {
        jsdom({ url: "https://abc.my.connect.aws/ccp-v2" });

        beforeEach(function () {
            sandbox.stub(connect.core, "checkNotInitialized").returns(true);
            global.SharedWorker = sandbox.stub().returns({
                port: {
                    start: sandbox.spy(),
                    addEventListener: sandbox.spy()
                },
            })

            global.connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getNotificationManager').returns({
                requestPermission: sandbox.spy()
            });

            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
        });
        afterEach(function () {
            sandbox.restore();
        });

        it("uses new endpoint for new url", function () {
            const href = "https://abc.my.connect.aws/ccp-v2";
            this.params.baseUrl = "https://abc.my.connect.aws";
            window.location.href = href;
            connect.core.initSharedWorker(this.params);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.called);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.getCalls()[0].lastArg.authorizeEndpoint === "/auth/authorize");
            this.params.baseUrl = "https://abc.my.connect.aws";
        });
    });

    describe('#initSoftphoneManager()', function () {
        jsdom({ url: "http://localhost" });

        before(function () {
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect, "SoftphoneManager").returns({})
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect.Agent.prototype, "isSoftphoneEnabled").returns(true);
            sandbox.stub(connect, "becomeMaster").returns({});
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub(),
                onUpstream: sandbox.stub()
            });

            connect.core.getAgentDataProvider = sandbox.stub().returns({
                getAgentData: () => {
                    return {
                        configuration: {
                            routingProfile: {
                                channelConcurrencyMap: {
                                    CHAT: 0,
                                    VOICE: 1
                                }
                            }
                        }
                    };
                }
            });
        });

        after(function () {
            sandbox.restore();
        });

        describe('in Chrome', function() {
            before(function () {
                sandbox.stub(connect, 'isChromeBrowser').returns(true);
                sandbox.stub(connect, 'getChromeBrowserVersion').returns(79);
            });
            after(function () {
                connect.isChromeBrowser.restore();
                connect.getChromeBrowserVersion.restore();
            });
            it("Softphone manager should get initialized for master tab", function () {
                connect.core.initSoftphoneManager(this.params);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
            });
        });

        describe('in Firefox', function() {
            before(function () {
                sandbox.stub(connect, 'isChromeBrowser').returns(false);
                sandbox.stub(connect, 'isFirefoxBrowser').returns(true);
                sandbox.stub(connect, 'getFirefoxBrowserVersion').returns(84);
            });
            after(function () {
                connect.isChromeBrowser.restore();
                connect.isFirefoxBrowser.restore();
                connect.getFirefoxBrowserVersion.restore();
            });
            it("Softphone manager should get initialized for master tab", function () {
                connect.core.initSoftphoneManager(this.params);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
            });
    
            it("should set connect.core.softphoneParams", function () {
                expect(connect.core.softphoneParams).to.include({ ringtoneUrl: this.defaultRingtoneUrl });
            });
        });
    });

    describe('#connect.core.initRingtoneEngines()', function () {
        jsdom({ url: "http://localhost" });

        describe('with default settings', function () {
            beforeEach(function () {
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: this.defaultRingtone });
            });

            afterEach(function () {
                sandbox.restore();
            });

            it("Ringtone init with VoiceRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(this.defaultRingtone.voice));
            });

            it("Ringtone init with QueueCallbackRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(this.defaultRingtone.queue_callback));
            });

            it("Ringtone no init with ChatRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isFalse(connect.ChatRingtoneEngine.calledWithNew());
            });

            it("Ringtone no init with TaskRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isFalse(connect.TaskRingtoneEngine.calledWithNew());
            });
        });

        describe('with optional chat and task ringtone params', function () {
            before(function () {
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: this.extraRingtone });
            });

            after(function () {
                sandbox.restore();
            });

            it("Ringtone init with VoiceRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(this.extraRingtone.voice));
            });

            it("Ringtone init with QueueCallbackRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(this.extraRingtone.queue_callback));
            });

            it("Ringtone init with ChatRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.ChatRingtoneEngine.calledWithNew(this.extraRingtone.chat));
            });


            it("Ringtone init with TaskRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.TaskRingtoneEngine.calledWithNew(this.extraRingtone.task));
            });
        });
    });

    describe('#connect.core.initCCP()', function () {
        jsdom({ url: "http://localhost" });
        let clock;
        let clearStub, openStub, closeStub;
            
        before(function () {
            clock = sinon.useFakeTimers();
            this.containerDiv = { appendChild: sandbox.spy() };
            this.params = connect.merge({}, this.params, {
                ccpUrl: "url.com",
                loginUrl: "loginUrl.com",
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                },
                chat: {
                    ringtoneUrl: "customChatRingtone.amazon.com"
                },
                loginOptions: { autoClose: true },
            });
            clearStub = sandbox.fake();
            closeStub = sandbox.fake();
            openStub = sandbox.fake.returns({close: closeStub});
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect, "UpstreamConduitClient");
            sandbox.stub(connect, "UpstreamConduitMasterClient");
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect, "VoiceRingtoneEngine");
            sandbox.stub(connect, "QueueCallbackRingtoneEngine");
            sandbox.stub(connect, "ChatRingtoneEngine");
            sandbox.spy(document, "createElement");
            sandbox.stub(connect.core, "_refreshIframeOnTimeout");
            sandbox.stub(connect.core, "getPopupManager").returns({ clear: clearStub, open: openStub})
            connect.numberOfConnectedCCPs = 0;
            connect.core.initCCP(this.containerDiv, this.params);
        });

        after(function () {
            sandbox.restore();
            clock.restore();
        });

        it("CCP initialization", function () {
            expect(this.params.ccpUrl).not.to.be.a("null");
            expect(this.containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(this.containerDiv.appendChild.calledOnce);
        });

        it("Replicates logs received upstream while ignoring duplicates", function () {
            var logger = connect.getLog();
            var loggerId = logger.getLoggerId();
            var originalLoggerLength = logger._logs.length;
            var newLogs = [
                new connect.LogEntry("test", connect.LogLevel.LOG, "some log", "some-logger-id"),
                new connect.LogEntry("test", connect.LogLevel.LOG, "some log with no logger id", null),
                new connect.LogEntry("test", connect.LogLevel.INFO, "some log info", "some-logger-id"),
                new connect.LogEntry("test", connect.LogLevel.ERROR, "some log error", "some-logger-id")
            ];
            var dupLogs = [
                new connect.LogEntry("test", connect.LogLevel.LOG, "some dup log", loggerId),
                new connect.LogEntry("test", connect.LogLevel.INFO, "some dup log info", loggerId),
                new connect.LogEntry("test", connect.LogLevel.ERROR, "some dup log error", loggerId)
            ]
            var allLogs = newLogs.concat(dupLogs);
            for (var i = 0; i < allLogs.length; i++) {
                connect.core.getUpstream().upstreamBus.trigger(connect.EventType.LOG, allLogs[i]);
            }
            clock.tick(2000);
            assert.lengthOf(logger._logs, originalLoggerLength + newLogs.length);
        });

        it("sends initCCP ringtone params on ACK", function () {
            const spy = sinon.spy(connect.core.getUpstream(), "sendUpstream");
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            assert.isTrue(connect.core.getUpstream().sendUpstream.calledWith(connect.EventType.CONFIGURE, {
                softphone: this.params.softphone,
                chat: this.params.chat,
                pageOptions: this.params.pageOptions
            }));
            spy.restore();
        });

        it("sets up ringtone engines on CONFIGURE with initCCP params", function () {
            connect.core.initRingtoneEngines({ ringtone: this.extraRingtone });
            connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {
                softphone: this.params.softphone,
                chat: this.params.chat,
                pageOptions: this.params.pageOptions
            });
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);

            assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(this.params.softphone));
            assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(this.params.softphone));
            assert.isTrue(connect.ChatRingtoneEngine.calledWithNew(this.params.chat));
        });

        it("should update the number of connected CCPs on UPDATE_CONNECTED_CCPS event", function () {
            expect(connect.numberOfConnectedCCPs).to.equal(0);
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
            expect(connect.numberOfConnectedCCPs).to.equal(1);
        });

        it("Multiple calls to initCCP does not append multiple CCP iframes", function() {
            sandbox.stub(window.document, "getElementsByTagName").returns([{ name: 'Amazon Connect CCP' }]);
            connect.core.initCCP(this.containerDiv, this.params);
            connect.core.initCCP(this.containerDiv, this.params);
            connect.core.initCCP(this.containerDiv, this.params);
            assert.isTrue(this.containerDiv.appendChild.calledOnce);
        })

        describe("on ACK", function () {
            let fakeOnInitHandler;

            before(function () {
                fakeOnInitHandler = sandbox.fake();
                connect.core.onInitialized(fakeOnInitHandler);
                sandbox.stub(connect.WindowIOStream.prototype, 'send').returns(null);
                connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            });

            it("should set portStreamId on ACK", function () {
                connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                expect(connect.core.portStreamId).to.equal('portId');
                connect.core.initialized = true;
            });
    
            it("should set connect.core.softphoneParams", function () {
                expect(connect.core.softphoneParams).to.include({ ringtoneUrl: "customVoiceRingtone.amazon.com" });
            });
    
            it("should trigger INIT event on ACK", function () {
                expect(fakeOnInitHandler.callCount).to.equal(1);
            });
        });
        describe("on ACK_TIMEOUT", function () {
            before(() => {
                connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
            });
            it("calls _refreshIframeOnTimeout when ack timeout occurs", function () {
                expect(connect.core._refreshIframeOnTimeout.calledOnce).to.be.true;
                expect(clearStub.calledOnce).to.be.true;
                expect(clearStub.calledWith(connect.MasterTopics.LOGIN_POPUP)).to.be.true;
                expect(openStub.calledOnce).to.be.true;
                expect(openStub.calledWith(this.params.loginUrl, connect.MasterTopics.LOGIN_POPUP, this.params.loginOptions));
            });
            describe(" on ACK", function () {
                it("resets the iframe refresh timeout, calls popupManager.clear, calls loginWindow.close", () => {
                    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    expect(connect.core.iframeRefreshTimeout === null).to.be.true;
                    expect(clearStub.calledTwice).to.be.true;
                    expect(closeStub.calledOnce).to.be.true;
                    expect(connect.core.loginWindow === null).to.be.true;
                });
            });
        });
    });

    describe('onIframeRetriesExhausted', () => {
        after(() => {
            sandbox.restore();
        })
        it('calls the subscribe api with the proper params', () => {
            let spy = sandbox.fake();
            let subscribeSpy = sandbox.fake();
            sandbox.stub(connect.core, "getEventBus").returns({subscribe: subscribeSpy});
            connect.core.onIframeRetriesExhausted(spy);
            sandbox.assert.calledOnce(subscribeSpy);
            sandbox.assert.calledWith(subscribeSpy, connect.EventType.IFRAME_RETRIES_EXHAUSTED, spy);
        });
    })

    describe('_refreshIframeOnTimeout', () => {
        var clock;
        function calculateRetryDelay(retryCount, retryDelayOptions) {
            if (!retryDelayOptions) retryDelayOptions = {};
            var customBackoff = retryDelayOptions.customBackoff || null;
            if (typeof customBackoff === 'function') {
              return customBackoff(retryCount);
            }
            var base = typeof retryDelayOptions.base === 'number' ? retryDelayOptions.base : 100;
            var delay = (Math.pow(2, retryCount) * base); // normally this looks like Math.random() * (Math.pow(2, retryCount) * base), but for the sake of consistency
            return delay;
        }
        AWS.util.calculateRetryDelay = calculateRetryDelay;
        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });
        before(() => {
            this.containerDiv = { appendChild: sandbox.spy() };
            this.params = connect.merge({}, this.params, {
                ccpUrl: "url.com",
                loginUrl: "loginUrl.com",
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                },
                chat: {
                    ringtoneUrl: "customChatRingtone.amazon.com"
                }
            });
        });
        afterEach(() => {
            clock.restore();
        });
        after(() => {
            sandbox.restore();
        })
        it("should teardown and stand up a new iframe 6 times, and then clean itself up and stop trying.", () => {
            let setTimeoutSpy = sandbox.spy(global, "setTimeout");
            let fakeRemoveChildSpy = sandbox.fake();
            let getCCPIframeSpy = sandbox.stub(connect.core, "_getCCPIframe").returns({parentNode: { removeChild: fakeRemoveChildSpy}});
            let fakeContentWindow = { windowProp1: 1};
            let createCCPIframeSpy = sandbox.stub(connect.core, "_createCCPIframe").returns({contentWindow: fakeContentWindow});
            let clearTimeoutSpy = sandbox.spy(global, "clearTimeout");
            let sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy = sandbox.stub(connect.core, "_sendIframeStyleDataUpstreamAfterReasonableWaitTime");
            let triggerSpy = sandbox.fake();
            sandbox.stub(connect.core, "getEventBus").returns({trigger: triggerSpy});

            connect.core._refreshIframeOnTimeout(this.params, {});

            expect(setTimeoutSpy.calledOnce).to.be.true;
            expect(setTimeoutSpy.calledWith(sinon.match.any, sinon.match.number.and(sinon.match((timeout) => timeout <= 7000 && timeout >= 5000)))).to.be.true;
            expect(connect.core.iframeRefreshAttempt).not.to.equal(0);
            expect(clearTimeoutSpy.calledOnce).to.be.true;

            clock.tick(7001); //the initial retry timeout.
            expect(connect.core.iframeRefreshAttempt).to.equal(1);
            expect(getCCPIframeSpy.calledOnce).to.be.true;
            expect(fakeRemoveChildSpy.calledOnce).to.be.true;
            expect(createCCPIframeSpy.calledOnce).to.be.true;
            expect(sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy.calledOnce).to.be.true;
            expect(connect.core.upstream.upstream.output === fakeContentWindow).to.be.true;
            expect(setTimeoutSpy.calledTwice).to.be.true;

            clock.tick(9001); //the 2nd retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(2);

            clock.tick(13001); //the 3rd retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(3);

            clock.tick(21001); //the 4th retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(4);

            clock.tick(37001); //the 5th retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(5);

            clock.tick(69001); //the 6th, final retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(6);
            expect(getCCPIframeSpy.callCount).to.equal(6);
            expect(fakeRemoveChildSpy.callCount).to.equal(6);
            expect(createCCPIframeSpy.callCount).to.equal(6);
            expect(sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy.callCount).to.equal(6);
            expect(connect.core.upstream.upstream.output === fakeContentWindow).to.be.true;

            clock.tick(133001); //the timeout that happens after the last retry timeout.
            expect(connect.core.iframeRefreshAttempt).to.equal(7); //this counter is increased, but the condition evaluating whether we should destroy and reload the iframe fails.
            expect(clearTimeoutSpy.callCount).to.equal(8); //even though we didn't retry in this timeout execution, we clean up the timeout.
            sandbox.assert.calledOnceWithExactly(triggerSpy, connect.EventType.IFRAME_RETRIES_EXHAUSTED); //this only happens once we have exhausted all retries.
            expect(setTimeoutSpy.callCount).to.equal(7);
            expect(fakeRemoveChildSpy.callCount).to.equal(6); // As mentioned above, this execution of the callback code is not a true retry, as evidenced by the lack of an additional call to remove the current iframe

            clock.tick(300000); //out of retries. Waiting a long time won't change anything.
            expect(connect.core.iframeRefreshAttempt).to.equal(7);
        });
    });

    describe('_getCCPIframe', function () {
        jsdom({ url: "http://localhost" });
        after(() => {
            sandbox.restore();
        });
        it('returns an iframe if there is an iframe in the document that matches the name of the CCP iframe', function () {
            const ccpIframe = {name: 'Amazon Connect CCP'};
            const randomIframe = {name: "hello"};
            let stub = sandbox.stub(global.window.document, "getElementsByTagName").returns([ccpIframe, randomIframe])
            expect(connect.core._getCCPIframe()).to.deep.equal(ccpIframe);
            stub.returns([randomIframe]);
            expect(connect.core._getCCPIframe()).to.equal(null);
        });
    });

    describe('_createCCPIframe', function () {
        jsdom({ url: "http://localhost" });
        let iframe = {iframeId: 1};
        let appendChildSpy = sandbox.fake();
        let containerDiv = { appendChild: appendChildSpy};
        let params = {
            ccpUrl: "url"
        };
        let expectedIframe = {
            ...iframe,
            src: params.ccpUrl,
            allow: "microphone; autoplay",
            style: "width: 100%; height: 100%",
            title: "Amazon Connect CCP",
            name: "Amazon Connect CCP",
        };
        before(function () {
            sandbox.stub(global.document, "createElement").returns(iframe);
        });
        beforeEach(() => {
            appendChildSpy.resetHistory();
            global.document.createElement.resetHistory();
        });
        after(() => {
            sandbox.restore();
        })
        it('calls appendChild with default title if iframeTitle param is not given', function () {
            const returnedIframe = connect.core._createCCPIframe(containerDiv, params);
            expect(appendChildSpy.calledOnce).to.be.true;
            sandbox.assert.calledWith(appendChildSpy, expectedIframe);
            expect(returnedIframe).to.be.deep.equal(expectedIframe);
        });
        it('calls appendChild with expected iframe fields if iframeTitle is given', function () {
            params = { ...params, iframeTitle: 'title'};
            expectedIframe.title = params.iframeTitle;
            const returnedIframe = connect.core._createCCPIframe(containerDiv, params);
            expect(appendChildSpy.calledOnce).to.be.true;
            sandbox.assert.calledWith(appendChildSpy, expectedIframe);
            expect(returnedIframe).to.be.deep.equal(expectedIframe);
        });
        it('calls createElement with string: iframe', function () {
            const returnedIframe = connect.core._createCCPIframe(containerDiv, params);
            expect(global.document.createElement.calledOnce).to.be.true;
            sandbox.assert.calledWith(global.document.createElement, 'iframe');
            expect(returnedIframe).to.be.deep.equal(expectedIframe);
        });
    });

    describe('_sendIframeStyleDataUpstreamAfterReasonableWaitTime', function () {
        jsdom({ url: "http://localhost" });
        let iframe = {offsetWidth: 5, offsetHeight: 5, getClientRects: () => ({length: 1})};
        var clock;
        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });
        afterEach(() => {
            clock.restore();
        });
        it('calls the setTimeout function', function () {
            let setTimeoutSpy = sandbox.spy(global, "setTimeout");
            let conduit = { "sendUpstream": function () {return "hello";} };
            connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(iframe, conduit);
            sandbox.assert.calledOnceWithMatch(setTimeoutSpy, sandbox.match.func, 10000);
        });
        it('sends an iframe style upstream with the expected data once the setTimeout executes its callback', function () {
            // let sendUpstream = () => {};
            let sendUpstreamSpy = sandbox.spy();
            let conduit = { "sendUpstream": sendUpstreamSpy };
            connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(iframe, conduit);
            sandbox.stub(global.window, "getComputedStyle").returns({display: "display"});
            clock.tick(10001);
            let expectedData = {
                display: "display",
                offsetWidth: iframe.offsetWidth,
                offsetHeight: iframe.offsetHeight,
                clientRectsLength: iframe.getClientRects().length,
            }
            sandbox.assert.calledOnceWithMatch(sendUpstreamSpy, connect.EventType.IFRAME_STYLE, expectedData);
        });
    });


    describe('verifyDomainAccess', function () {

        let isFramed = false;
        let whitelistedOrigins = [];

        beforeEach(() => {
            isFramed = false;
            whitelistedOrigins = [];
        });

        afterEach(() => {
            sandbox.restore();
        });

        function setup() {
            sandbox.stub(connect, "isFramed").returns(isFramed);
            sandbox.stub(connect, "fetch").returns(Promise.resolve({ whitelistedOrigins: whitelistedOrigins }));
        }

        it('resolves if not iframed', async () => {
            setup();
            await connect.core.verifyDomainAccess('token', 'endpoint');
            expect(true).to.be.true;
        });

        it('calls /whitelisted-origins if iframed', async () => {
            isFramed = true;
            setup();
            await connect.core.verifyDomainAccess('token', 'endpoint').catch(() => { }).finally(() => {
                assert.isTrue(connect.fetch.calledWithMatch('endpoint', {
                    headers: {
                        'X-Amz-Bearer': 'token'
                    }
                }));
            });
        });

        var testDomains = {
            'https://www.abc.com': true,
            'http://www.abc.com': false,
            'http://www.xyz.com': false,
            'https://www.abc.de': false,
            'https://xyz.abc.com': false,
            'https://www.abc.com/sub?x=1#123': true
        };
        var referrers = Object.keys(testDomains);
        for (var i = 0; i < referrers.length; i++) {
            describe('matches url ' + referrers[i], function () {
                var referrer = referrers[i];
                jsdom({ url: "http://localhost", referrer: referrer });

                it('matches correctly', async function () {
                    isFramed = true;
                    whitelistedOrigins = ['https://www.abc.com'];
                    setup();
                    await connect.core.verifyDomainAccess('token', 'endpoint').then(function () {
                        expect(testDomains[referrer]).to.be.true;
                    }).catch(function (error) {
                        expect(error).to.equal(undefined);
                        expect(testDomains[referrer]).to.be.false;
                    });
                });
            });
        }
    });

    describe('AgentDataProvider', function () {
        function createState(type, name) {
            return { type: type, name: name }
        }
        function createAgentSnapshotState(type, name) {
            return {
                snapshot: { state: createState(type, name) }
            }; 
        }

        before(function () {
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            sandbox.spy(connect.core.eventBus, "trigger");
            connect.core.agentDataProvider = new connect.core.AgentDataProvider(connect.core.getEventBus());
            sandbox.spy(connect.core.AgentDataProvider.prototype, "_fireAgentUpdateEvents");
            connect.agent.initialized = false;
        });

        after(function () {
            sandbox.restore();
        });

        beforeEach(function () {
            connect.core.getEventBus().trigger.resetHistory();
        });

        it('updates agent data after receiving an UPDATE event', function () {
            assert.isFalse(connect.agent.initialized);
            connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, createAgentSnapshotState(connect.AgentStateType.ROUTABLE, "Available"));
            assert.isTrue(connect.agent.initialized);
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.INIT));
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.REFRESH));
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.ROUTABLE));
        });

        it('triggers event when going from ROUTABLE to NOT_ROUTABLE', function () {
            connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, "Unavailable"));
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.NOT_ROUTABLE));
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.STATE_CHANGE, {
                agent: new connect.Agent(),
                oldState: "Available",
                newState: "Unavailable"
            }));
        });

        it('triggers only state_change event when going to same routing state', function () {
            connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, "Lunch"));
            assert.isFalse(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.NOT_ROUTABLE));
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.STATE_CHANGE, {
                agent: new connect.Agent(),
                oldState: "Unavailable",
                newState: "Lunch"
            }));
        });

        it('triggers enqueued_next_state when nextState is populated', function () {
            var agentSnapshotWithNextState = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, "Available");
            agentSnapshotWithNextState.snapshot.nextState = createState(connect.AgentStateType.NOT_ROUTABLE, "Lunch");
            var enqueuedNextState = false;
            new connect.Agent().onEnqueuedNextState(function (agent) {
                assert.isTrue(agent instanceof connect.Agent);
                enqueuedNextState = true;
            });
            connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, agentSnapshotWithNextState);
            assert.isTrue(enqueuedNextState);
            assert.isTrue(connect.core.getEventBus().trigger.calledWith(connect.AgentEvents.ENQUEUED_NEXT_STATE));
        });
    });

    describe('#connect.core.getFrameMediaDevices()', function () {
        jsdom({ url: "http://localhost" });
        
        var clock 
        
        before(function () {
            clock = sinon.useFakeTimers();
            global.navigator = {
                mediaDevices: {
                    enumerateDevices: () => new Promise((resolve) => {
                        setTimeout(() => {
                            resolve([{
                                toJSON: () => ({
                                    deviceId: "deviceId",
                                    groupId: "groupId",
                                    kind: "audioinput",
                                    label: "Microphone"
                                })
                            }])
                        }, 500);
                    })
                }
            };
        });

        after(function () {
            clock.restore();
        });

        beforeEach(function () {
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: (...params) => connect.core.getEventBus().trigger(...params),
                sendDownstream: (...params) => connect.core.getEventBus().trigger(...params)
            });
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.stub(connect, "isCCP").returns(true);
            connect.core.initPageOptions(this.params);
            connect.isFramed.restore();
            connect.isCCP.restore();
            sandbox.stub(connect, "isFramed").returns(false);
            sandbox.stub(connect, "isCCP").returns(false);
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('getting the list of media devices in the iframe with default timeout', function() { 
            const arr = [{
                deviceId: "deviceId",
                groupId: "groupId",
                kind: "audioinput",
                label: "Microphone"
            }];
            connect.core.getFrameMediaDevices()
            .then(data => expect(data).to.eql(arr));  
            clock.next();
        });

        it('timing out on the media devices request with a custom timeout', function() { 
            connect.core.getFrameMediaDevices(400)
            .catch(err => expect(err.message).to.equal("Timeout exceeded"));
            clock.next();
        });
    });

});
