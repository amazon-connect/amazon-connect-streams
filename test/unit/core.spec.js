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
        this.ringtoneEngineParams = {
            ringtone: {
                voice: { ringtoneUrl: this.defaultRingtoneUrl },
                queue_callback: { ringtoneUrl: this.defaultRingtoneUrl },
                chat: { ringtoneUrl: this.defaultRingtoneUrl }
            }
        };
    });

    describe('#connect.core.initSharedWorker()', function () {

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

        it("shared worker initialization", function () {
            expect(this.params.sharedWorkerUrl).not.to.be.a("0");
            expect(this.params.authToken).not.to.be.a("null");
            expect(this.params.region).not.to.be.a("null");
            connect.core.initSharedWorker(this.params);
            expect(connect.core.checkNotInitialized.called);
            expect(SharedWorker.calledWith(this.params.sharedWorkerUrl, "ConnectSharedWorker"));
        });
        it("uses the legacy endpoint for a legacy url", function () {
            const href = "https://abc.awsapps.com/connect/ccp-v2";
            window.location.href = href;
            connect.core.initSharedWorker(this.params);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.called);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.getCalls()[0].lastArg.authorizeEndpoint === "/connect/auth/authorize");
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
        before(function () {
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect, "SoftphoneManager").returns({})
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect.Agent.prototype, "isSoftphoneEnabled").returns(true);
            sandbox.stub(connect, "becomeMaster").returns({});
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub()
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

        it("Softphone manager should get initialized for master tab", function () {
            connect.core.initSoftphoneManager(this.params);
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert.isTrue(connect.SoftphoneManager.calledWithNew());
        });
    });

    describe('#connect.core.initRingtoneEngines()', function () {
        before(function () {
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect, "VoiceRingtoneEngine");
            sandbox.stub(connect, "QueueCallbackRingtoneEngine");
            sandbox.stub(connect, "ChatRingtoneEngine");
            connect.core.initRingtoneEngines(this.ringtoneEngineParams);
        });

        after(function () {
            sandbox.restore();
        });

        it("Ringtone init with VoiceRingtoneEngine", function () {
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(this.ringtoneEngineParams.voice));
        });

        it("Ringtone init with QueueCallbackRingtoneEngine", function () {
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(this.ringtoneEngineParams.queue_callback));
        });

        it("Ringtone init with ChatRingtoneEngine", function () {
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert.isTrue(connect.ChatRingtoneEngine.calledWithNew(this.ringtoneEngineParams.chat));
        });
    });

    describe('#connect.core.initCCP()', function () {
        before(function () {
            this.containerDiv = { appendChild: sandbox.spy() };
            this.params = connect.merge({}, this.params, {
                ccpUrl: "url.com",
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                },
                chat: {
                    ringtoneUrl: "customChatRingtone.amazon.com"
                }
            });
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect, "UpstreamConduitClient");
            sandbox.stub(connect, "UpstreamConduitMasterClient");
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect, "VoiceRingtoneEngine");
            sandbox.stub(connect, "QueueCallbackRingtoneEngine");
            sandbox.stub(connect, "ChatRingtoneEngine");
            connect.core.initCCP(this.containerDiv, this.params);
            sandbox.spy(connect.core.getUpstream(), "sendUpstream");
        });

        after(function () {
            sandbox.restore();
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
            assert.lengthOf(logger._logs, originalLoggerLength + newLogs.length);
        });

        it("sends initCCP ringtone params on ACK", function () {
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE);
            assert.isTrue(connect.core.getUpstream().sendUpstream.calledWith(connect.EventType.CONFIGURE, {
                softphone: this.params.softphone,
                chat: this.params.chat
            }));
        });

        it("sets up ringtone engines on CONFIGURE with initCCP params", function () {
            connect.core.initRingtoneEngines(this.ringtoneEngineParams);
            connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {
                softphone: this.params.softphone,
                chat: this.params.chat
            });
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);

            assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(this.params.softphone));
            assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(this.params.softphone));
            assert.isTrue(connect.ChatRingtoneEngine.calledWithNew(this.params.chat));
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
            sandbox.stub(connect, "fetch").returns(Promise.resolve({whitelistedOrigins: whitelistedOrigins}));
        }

        it('resolves if not iframed', async () => {
            setup();
            await connect.core.verifyDomainAccess('token', 'endpoint');
            expect(true).to.be.true;
        });

        it('calls /whitelisted-origins if iframed', async () => {
            isFramed = true;
            setup();
            await connect.core.verifyDomainAccess('token', 'endpoint').catch(() => {}).finally(() => {
                assert.isTrue(connect.fetch.calledWithMatch('endpoint', {
                    headers: {
                      'X-Amz-Bearer': 'token'
                    }
                }));
            });
        });

        it('matches url correctly', async () => {
            isFramed = true;
            whitelistedOrigins = ['https://www.abc.com'];
            setup();
            const testDomains = {
                'https://www.abc.com': true,
                'http://www.abc.com': false,
                'http://www.xyz.com': false,
                'https://www.abc.de': false,
                'https://xyz.abc.com': false,
                'https://www.abc.com/sub?x=1#123': true
            };
            const urls = Object.keys(testDomains);
            for (let i = 0; i < urls.length; i++) {
                global.window.document.referrer = urls[i];
                await connect.core.verifyDomainAccess('token', 'endpoint').then(() => {
                    expect(testDomains[urls[i]]).to.be.true;
                }).catch(() => {
                    expect(testDomains[urls[i]]).to.be.false;
                });
            }
        });
    });

});
