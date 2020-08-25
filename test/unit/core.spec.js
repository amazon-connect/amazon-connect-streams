const { assert } = require("chai");

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

        describe('in Chrome', function () {
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

        describe('in Firefox', function () {
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

        before(function () {
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
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect, "UpstreamConduitClient");
            sandbox.stub(connect, "UpstreamConduitMasterClient");
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect, "VoiceRingtoneEngine");
            sandbox.stub(connect, "QueueCallbackRingtoneEngine");
            sandbox.stub(connect, "ChatRingtoneEngine");
            sandbox.spy(document, "createElement");
            connect.numberOfConnectedCCPs = 0;
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
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            assert.isTrue(connect.core.getUpstream().sendUpstream.calledWith(connect.EventType.CONFIGURE, {
                softphone: this.params.softphone,
                chat: this.params.chat,
                pageOptions: this.params.pageOptions
            }));
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

        it("should set portStreamId on ACK", function () {
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            expect(connect.core.portStreamId).to.equal('portId');
            connect.core.initialized = true;
        });

        it("should set connect.core.softphoneParams", function () {
            expect(connect.core.softphoneParams).to.include({ ringtoneUrl: "customVoiceRingtone.amazon.com" });
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

});
