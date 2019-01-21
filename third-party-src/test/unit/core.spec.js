require("../unit/test-setup.js");

describe('Core', function () {

    before(function () {
        this.checkNotInitiazed = sinon.stub(connect.core, "checkNotInitialized").returns(true);
        this.params = {
            agentLogin: "abc",
            authToken: "xyz",
            authTokenExpiration: "Thu Apr 19 23:30:07 UTC 2018",
            baseUrl: "https://abc.awsapps.com",
            refreshToken: "abc",
            region: "us-west-2",
            sharedWorkerUrl: "/connect/static/connect-shared-worker.js",
            softphone: {
                ringtoneUrl: "https://d366s8lxuwna4d.cloudfront.net/ringtone-ba0c9bd8a1d12786318965fd908eb2998bdb8f4c.mp3"
            }
        }
    });

    describe('#connect.core.initSharedWorker()', function () {

        before(function () {
            global.SharedWorker = sinon.stub().returns({
                port: {
                    start: sinon.spy()
                },
            })

            global.connect.agent.initialized = true;
            this.nm = sinon.stub(connect.core, 'getNotificationManager').returns({
                requestPermission: sinon.spy()
            })
        });

        after(function () {
            connect.core.getNotificationManager.restore();
        });

        it("shared worker initialization", function () {
            expect(this.params.sharedWorkerUrl).not.to.be.a("0");
            expect(this.params.authToken).not.to.be.a("null");
            expect(this.params.region).not.to.be.a("null");
            connect.core.initSharedWorker(this.params);
            expect(this.checkNotInitiazed.called);
            expect(SharedWorker.calledWith(this.params.sharedWorkerUrl, "ConnectSharedWorker"));
        })
    });

    describe('#connect.core.initRingtoneEngines()', function () {
        before(function () {
            this.params.ringtone = {
                voice: {
                    ringtoneUrl: ""
                },
                queue_callback: {
                    ringtoneUrl: ""
                }
            };

            sinon.stub(connect, "ifMaster");
            sinon.stub(connect, "VoiceRingtoneEngine");
            sinon.stub(connect, "QueueCallbackRingtoneEngine");
        });

        after(function () {
            connect.ifMaster.restore();
            connect.VoiceRingtoneEngine.restore();
            connect.QueueCallbackRingtoneEngine.restore();
        });

        it("Ringtone init with VoiceRingtoneEngine", function () {
            this.params.ringtone.voice.disabled = false;
            connect.core.initRingtoneEngines(this.params);
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert(connect.VoiceRingtoneEngine.calledWithNew);
        });

        it("Ringtone init with QueueCallbackRingtoneEngine", function () {
            this.params.ringtone.queue_callback.disabled = false;
            this.params.ringtone.voice.disabled = true;
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert(connect.QueueCallbackRingtoneEngine.calledWithNew);
        });

    });

    describe('#initSoftphoneManager()', function () {
        before(function () {
            sinon.stub(connect, "SoftphoneManager").returns({})
            sinon.stub(connect, "ifMaster");
            sinon.stub(connect.Agent.prototype, "isSoftphoneEnabled").returns(true);
            sinon.stub(connect, "becomeMaster").returns({});
            sinon.stub(connect.core, "getUpstream").returns({
                sendUpstream: sinon.stub()
            });
        });

        after(function () {
            connect.SoftphoneManager.restore();
            connect.ifMaster.restore();
            connect.Agent.prototype.isSoftphoneEnabled.restore();
            connect.becomeMaster.restore();
            connect.core.getUpstream.restore();
        });

        it("Softphone manager should get initialized for master tab", function () {
            connect.core.checkNotInitialized.restore();
            sinon.stub(connect.core, "checkNotInitialized").returns(false);
            connect.core.initSoftphoneManager(this.params);
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);
            assert(connect.SoftphoneManager.calledWithNew)
        });
    });

    describe('#connect.core.initCCP()', function () {
        before(function () {
            this.params.ccpUrl = "url.com";
            this.containerDiv = {
                appendChild: sinon.spy()
            };
        });

        it("CCP initialization", function () {
            expect(this.params.ccpUrl).not.to.be.a("null");
            expect(this.containerDiv).not.to.be.a("null");
            connect.core.initCCP(this.containerDiv, this.params);
            assert(this.checkNotInitiazed.called);
            assert(document.createElement.calledOnce);
            assert(this.containerDiv.appendChild.calledOnce);
        });
    });

    describe('TODO', function () {
        it("include test cases for all the remaining methods");
    });

});

