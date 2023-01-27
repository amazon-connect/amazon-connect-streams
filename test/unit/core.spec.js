const { assert, expect } = require("chai");
require("../unit/test-setup.js");

describe('Core', function () {
    var sandbox = sinon.createSandbox();
    const defaultRingtoneUrl = "https://d366s8lxuwna4d.cloudfront.net/ringtone-ba0c9bd8a1d12786318965fd908eb2998bdb8f4c.mp3";
    let params;

    beforeEach(function () {
        params = {
            agentLogin: "abc",
            authToken: "xyz",
            authTokenExpiration: "Thu Apr 19 23:30:07 UTC 2018",
            baseUrl: "https://abc.awsapps.com",
            ccpUrl: "url.com",
            refreshToken: "abc",
            region: "us-west-2",
            sharedWorkerUrl: "/connect/static/connect-shared-worker.js",
            softphone: {
                ringtoneUrl: defaultRingtoneUrl
            },
            chat: {
                ringtoneUrl: defaultRingtoneUrl
            },
            shouldAddNamespaceToLogs: true
        };
    });
    
    describe('#connect.core.initSharedWorker()', function () {
        jsdom({ url: "http://localhost" });
        let clock, onAuthFailSpy, onAuthorizeSuccessSpy, hitchSpy;
         
        before(function () {
            clock = sinon.useFakeTimers();
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
            sandbox.stub(connect, 'randomId').returns('id');
            onAuthFailSpy = sandbox.stub(connect.core, 'onAuthFail');
            onAuthorizeSuccessSpy = sandbox.stub(connect.core, 'onAuthorizeSuccess');
            hitchSpy = sandbox.spy(connect, "hitch");
            sandbox.spy(connect, 'ifMaster');
        });
        after(function () {
            sandbox.restore();
            clock.restore();
        });
        it("shared worker initialization", function () {
            expect(params.sharedWorkerUrl).not.to.be.a("0");
            expect(params.authToken).not.to.be.a("null");
            expect(params.region).not.to.be.a("null");
            connect.core.initSharedWorker(params);
            expect(connect.core.checkNotInitialized.called);
            expect(SharedWorker.calledWith(params.sharedWorkerUrl, "ConnectSharedWorker"));
            expect(connect.core.region).not.to.be.a("null");
            sandbox.assert.calledOnce(onAuthFailSpy);
            sandbox.assert.calledOnce(onAuthorizeSuccessSpy);
            sandbox.assert.calledWith(hitchSpy, sandbox.match.any, connect.core._handleAuthFail, sandbox.match.any, sandbox.match.any);
            sandbox.assert.calledWith(hitchSpy, sandbox.match.any, connect.core._handleAuthorizeSuccess);
        });
        it("should set portStreamId on ACK", function () {
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            expect(connect.core.portStreamId).to.equal('portId');
            connect.core.initialized = false;
        });
        it("should update the number of connected CCPs in the tab and total on UPDATE_CONNECTED_CCPS event", function () {
            expect(connect.numberOfConnectedCCPs).to.equal(0);
            expect(connect.numberOfConnectedCCPsInThisTab).to.equal(0);
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 , 'id': { length: 1}});
            expect(connect.numberOfConnectedCCPs).to.equal(1);
            expect(connect.numberOfConnectedCCPsInThisTab).to.equal(1);
        });
        it("should not emit ccp tabs across browser count if no data.tabId or data.streamsTabsAcrossBrowser", function () {
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
            sandbox.assert.notCalled(connect.ifMaster);
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1, tabId: 'id', streamsTabsAcrossBrowser: 1 });
            sandbox.assert.calledOnce(connect.ifMaster);
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
    });
    describe('onAuthFail', function () {
        let getUpstreamSpy, onUpstreamSpy;
        before(() => {
            onUpstreamSpy = sandbox.fake();
            getUpstreamSpy = sandbox.stub(connect.core, "getUpstream").returns({onUpstream: onUpstreamSpy});
        });
        after(() => {
            sandbox.restore();
        });
        it('calls getUpstream and sets the given function to trigger on the auth fail event via onUpstream', () => {
            const spy = sandbox.fake();
            connect.core.onAuthFail(spy);
            sandbox.assert.calledOnce(getUpstreamSpy);
            sandbox.assert.calledOnceWithExactly(onUpstreamSpy, connect.EventType.AUTH_FAIL, spy);
        });
    });
    describe('onAuthorizeSuccess', function () {
        let getUpstreamSpy, onUpstreamSpy;
        before(() => {
            onUpstreamSpy = sandbox.fake();
            getUpstreamSpy = sandbox.stub(connect.core, "getUpstream").returns({onUpstream: onUpstreamSpy});
        });
        after(() => {
            sandbox.restore();
        });
        it('calls getUpstream and sets the given function to trigger on the auth fail event via onUpstream', () => {
            const spy = sandbox.fake();
            connect.core.onAuthorizeSuccess(spy);
            sandbox.assert.calledOnce(getUpstreamSpy);
            sandbox.assert.calledOnceWithExactly(onUpstreamSpy, connect.EventType.AUTHORIZE_SUCCESS, spy);
        });
    });
    describe('_handleAuthorizeSuccess', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        it('resets the authRetryCount to 0', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 5);
            connect.core._handleAuthorizeSuccess();
            assert.equal(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT), 0);
        });
    });
    describe('_handleAuthFail', function () {
        let handleAuthorizeFailSpy, handleCTIAuthFailSpy;
        const loginUrl = 'fakeLoginUrl.com/login';
        const authorizeEndpoint = '/authorize';
        const authFailData = {authorize: true};
        before(() => {
            handleAuthorizeFailSpy = sandbox.stub(connect.core, "_handleAuthorizeFail");
            handleCTIAuthFailSpy = sandbox.stub(connect.core, "_handleCTIAuthFail");
        });
        after(() => {
            sandbox.restore();
        });
        it('calls _handleAuthorizeFail in the case that the authFailData exists and has an authorize field that evaluates to true', () => {
            connect.core._handleAuthFail(loginUrl, authorizeEndpoint, authFailData);
            sandbox.assert.calledOnceWithExactly(handleAuthorizeFailSpy, loginUrl);
        });
        it('calls _handleCTIAuthFail in the case that the authFailData exists and has an authorize field that evaluates to true', () => {
            connect.core._handleAuthFail(loginUrl, authorizeEndpoint, null);
            sandbox.assert.calledOnceWithExactly(handleCTIAuthFailSpy, authorizeEndpoint);
        });
    });
    describe('_handleAuthorizeFail', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        let clock, calculateRetryDelaySpy, redirectToLoginSpy;
        const loginUrl = 'fakeLoginUrl.com/login';
        before(() => {
            calculateRetryDelaySpy = sandbox.stub(AWS.util, "calculateRetryDelay").returns(10);
            clock = sandbox.useFakeTimers();
            redirectToLoginSpy = sandbox.stub(connect.core, "_redirectToLogin");
            eventBusTriggerSpy = sandbox.stub
            sandbox.stub(connect.core, 'getEventBus').returns({
                trigger: sandbox.stub()
            });
        });
        afterEach(() => {
            clock.reset();
        });
        after(() => {
            sandbox.restore();
        });
        it('Does not call redirectToLogin at all if authRetryCount is greater than max auth retry count for the session', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 4);
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            sandbox.assert.notCalled(calculateRetryDelaySpy);
            sandbox.assert.notCalled(redirectToLoginSpy);
            sandbox.assert.calledOnceWithExactly(connect.core.getEventBus().trigger, connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED);
        });
        it('Does not call redirectToLogin at all if timeoutId is not null', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 0);
            connect.core.authorizeTimeoutId = 'randomId';
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            sandbox.assert.notCalled(calculateRetryDelaySpy);
            sandbox.assert.notCalled(redirectToLoginSpy);
        });
        it('will call redirectToLogin three times if the timeout has been cleared each time', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 0); //for clarity
            connect.core.authorizeTimeoutId = null;
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            sandbox.assert.calledOnceWithExactly(calculateRetryDelaySpy, 1, {base: 2000});
            sandbox.assert.calledOnceWithExactly(redirectToLoginSpy, loginUrl);
            connect.core.authorizeTimeoutId = null;
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            connect.core.authorizeTimeoutId = null;
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            sandbox.assert.calledThrice(calculateRetryDelaySpy);
            sandbox.assert.calledThrice(redirectToLoginSpy);
            connect.core.authorizeTimeoutId = null;
            connect.core._handleAuthorizeFail(loginUrl);
            clock.runAll();
            sandbox.assert.calledThrice(calculateRetryDelaySpy);
            sandbox.assert.calledThrice(redirectToLoginSpy);
        });
    });

    describe('redirectToLogin', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        let reloadStub, assignStub;
        before(() => {
            reloadStub = sandbox.stub(location, "reload");
            assignStub = sandbox.stub(location, "assign");
        });
        after(() => {
            sandbox.restore();
        });
        it('sets the window.location.href property if there is a loginUrl supplied', () => {
            const loginUrl = 'fakeLogin/login';
            connect.core._redirectToLogin(loginUrl);
            sandbox.assert.calledOnceWithExactly(assignStub, loginUrl);
        });
        it('reloads the location if there is no loginUrl supplied', () => {
            connect.core._redirectToLogin(null);
            sandbox.assert.calledOnce(reloadStub);
        });
    });

    describe('_handleCTIAuthFail', function () {
        let clock, calculateRetryDelaySpy, authorizeSpy, triggerAuthorizeSuccessStub, triggerAuthFailStub;
        const authorizeEndpoint = 'fakeLoginUrl.com/authorize';
        before(() => {
            calculateRetryDelaySpy = sandbox.stub(AWS.util, "calculateRetryDelay").returns(10);
            clock = sandbox.useFakeTimers();
            authorizeSpy = sandbox.stub(connect.core, "authorize").resolves();
            triggerAuthorizeSuccessStub = sandbox.stub(connect.core, "_triggerAuthorizeSuccess");
            triggerAuthFailStub = sandbox.stub(connect.core, "_triggerAuthFail");
            sandbox.stub(connect.core, 'getEventBus').returns({
                trigger: sandbox.stub()
            });
        });
        afterEach(() => {
            clock.reset();
        });
        after(() => {
            sandbox.restore();
        });
        const cycleCTIAuthFail = () => {
            connect.core._handleCTIAuthFail(authorizeEndpoint);
            clock.runAll();
            clock.runAll();
        }
        it('does not do anything if the retry count is not smaller than the max', () => {
            connect.core.ctiAuthRetryCount = 11;
            connect.core._handleCTIAuthFail(authorizeEndpoint);
            sandbox.assert.notCalled(calculateRetryDelaySpy);
            sandbox.assert.notCalled(authorizeSpy);
            connect.core._triggerAuthorizeSuccess();
            sandbox.assert.calledOnce(triggerAuthorizeSuccessStub);
            sandbox.assert.calledOnceWithExactly(connect.core.getEventBus().trigger, connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED);
        });
        it('does not do anything if the timeoutId is defined', () => {
            connect.core.ctiAuthRetryCount = 0; 
            connect.core.ctiTimeoutId = "someId";
            connect.core._handleCTIAuthFail(authorizeEndpoint);
            sandbox.assert.notCalled(calculateRetryDelaySpy);
            sandbox.assert.notCalled(authorizeSpy);
        });
        it('calls connect.core.authorize if the maximum number of retries is not exhausted', () => {
            connect.core.ctiAuthRetryCount = 0; //for clarity
            connect.core.ctiTimeoutId = null;
            cycleCTIAuthFail();
            sandbox.assert.calledOnceWithExactly(calculateRetryDelaySpy, connect.core.ctiAuthRetryCount, {base: 500});
            sandbox.assert.calledOnceWithExactly(authorizeSpy, authorizeEndpoint);
            sandbox.assert.calledOnce(calculateRetryDelaySpy);
            sandbox.assert.calledOnce(triggerAuthorizeSuccessStub);
            authorizeSpy.rejects();
            cycleCTIAuthFail();
            sandbox.assert.calledOnce(triggerAuthorizeSuccessStub);
            for (let i = 0; i < 8; i++) {
                cycleCTIAuthFail();
            };
            sandbox.assert.callCount(authorizeSpy, 10);
            sandbox.assert.callCount(calculateRetryDelaySpy, 10);
            sandbox.assert.callCount(triggerAuthorizeSuccessStub, 1);
            cycleCTIAuthFail();
            sandbox.assert.callCount(authorizeSpy, 10);
            sandbox.assert.callCount(calculateRetryDelaySpy, 10);
            sandbox.assert.callCount(triggerAuthorizeSuccessStub, 1);
        });
    });
    describe('_triggerAuthorizeSuccess / _triggerAuthFail', function () {
        let triggerSpy = sandbox.fake();
        before(() => {
            sandbox.stub(connect.core, "getUpstream").returns({upstreamBus: { trigger: triggerSpy}});
        });
        after(() => {
            sandbox.restore();
        });
        it('calls trigger on the upstreamBus for the upstream conduit for the corresponding events', () => {
            connect.core._triggerAuthorizeSuccess();
            sandbox.assert.calledOnceWithExactly(triggerSpy, connect.EventType.AUTHORIZE_SUCCESS);
            let data = {authorize: true};
            connect.core._triggerAuthFail(data);
            sandbox.assert.calledWith(triggerSpy, connect.EventType.AUTH_FAIL, data);
        });
    });
    describe('_getAuthRetryCount', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        it('sets the session storage key to 0 and returns 0 when the key does not exist', () => {
            expect(connect.core._getAuthRetryCount()).to.be.equal(0);
        });
        it('throws an error if the value of the correct key is NaN but not null', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, "hellllllllo");
            expect(() => connect.core._getAuthRetryCount()).to.throw();
        });
        it('returns the storage field as an int if it is a valid number', () => {
            window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, (5).toString());
            expect(connect.core._getAuthRetryCount()).to.be.equal(5);
        });
    });
    describe('_incrementAuthRetryCount', function () {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        let getAuthRetryCount;
        let count = 0;
        before(() => {
            getAuthRetryCount = sandbox.stub(connect.core, "_getAuthRetryCount").returns(count);
        });
        after(() => {
            sandbox.restore();
        });
        it('sets the storage key to count + 1', () => {
            connect.core._incrementAuthRetryCount();
            expect(parseInt(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT))).to.be.equal(count+1);
            count++;
            getAuthRetryCount.returns(count);
            connect.core._incrementAuthRetryCount();
            expect(parseInt(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT))).to.be.equal(count+1);
        });
    });
    describe('onAuthorizeRetriesExhausted / onCTIAuthorizeRetriesExhausted', function () {
        let subscribeSpy = sandbox.fake();
        let inputFake = sandbox.fake();
        before(() => {
            sandbox.stub(connect.core, "getEventBus").returns({subscribe: subscribeSpy});
        });
        after(() => {
            sandbox.restore();
        })
        it('subscribes the input function to AUTHORIZE_RETRIES_EXHAUSTED', () => {
            connect.core.onAuthorizeRetriesExhausted(inputFake);
            sandbox.assert.calledOnceWithExactly(subscribeSpy, connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED, inputFake);
            connect.core.onCTIAuthorizeRetriesExhausted(inputFake);
            sandbox.assert.calledTwice(subscribeSpy);
            sandbox.assert.calledWithExactly(subscribeSpy, connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED, inputFake);
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
            connect.core.initSharedWorker(params);
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
            params.baseUrl = "https://abc.my.connect.aws";
            window.location.href = href;
            connect.core.initSharedWorker(params);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.called);
            assert.isTrue(connect.Conduit.prototype.sendUpstream.getCalls()[0].lastArg.authorizeEndpoint === "/auth/authorize");
            params.baseUrl = "https://abc.my.connect.aws";
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

            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
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

            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            connect.agent.initialized = true;
        });

        after(function () {
            sandbox.restore();
            connect.core.eventBus = null;
            connect.agent.initialized = false;
        });

        describe("Softphone manager - Embedded CCP initialization", () => {
            let softphoneParams, softphoneParamskey;

            before(() => {
                softphoneParams = {
                    allowFramedSoftphone: true,
                    ringtoneUrl: defaultRingtoneUrl
                }

                softphoneParamskey = `SoftphoneParamsStorage::${global.location.origin}`;
            });

            beforeEach(() => {
                sandbox.stub(connect, "isFramed").returns(true);
                sandbox.stub(connect, "publishMetric");
            });

            afterEach(() => {
                connect.isFramed.restore();
                connect.publishMetric.restore();
            });

            describe("Softphone manager - Embedded CCP is refreshed", () => {

                let clock = sinon.useFakeTimers();

                before(() => {
                    connect.core.getUpstream.restore();

                    sandbox.stub(connect.core, "getUpstream").returns({
                        onUpstream: (event, fn) => {
                            connect.core.eventBus.subscribe(event, fn);
                        },
                        upstreamBus: connect.core.eventBus,
                        sendUpstream: sinon.stub()
                    });
                })

                beforeEach(() => {
                    sandbox.stub(global.localStorage, "getItem").returns(JSON.stringify(softphoneParams));
                    sandbox.stub(global.localStorage, "setItem");
                    sandbox.stub(connect, "isCCP").returns(true);
                    connect.core.initSoftphoneManager({ ringtoneUrl: defaultRingtoneUrl });
                });

                afterEach(() => {
                    global.localStorage.getItem.restore();
                    global.localStorage.setItem.restore();
                    connect.isCCP.restore();
                    clock.restore();
                });

                it("we should use stored softphone params for initilization in case if the configure message is not delivered", () => {
                    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    clock.tick(110);
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);
                    sandbox.assert.calledWithExactly(global.localStorage.getItem, softphoneParamskey);
                    // this indicates that we are using stored params
                    sandbox.assert.calledWithExactly(connect.publishMetric, {
                        name: "EmbeddedCCPRefreshedWithoutInitCCP",
                        data: { count: 1 }
                    });
                    assert.isTrue(connect.SoftphoneManager.calledWithNew());
                });


                it("we should not use stored softphone params for initilization if configure message is delivered", () => {

                    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    clock.tick(99); // set to below 100 to not to execute the setimeout handler
                    // trigger configure
                    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);
                    sandbox.assert.calledWithExactly(global.localStorage.getItem, softphoneParamskey);
                    // see that the publishMetric is not invoked
                    sandbox.assert.notCalled(connect.publishMetric);
                    assert.isTrue(connect.SoftphoneManager.calledWithNew());
                });

                it("we should only listen for shared worker ACK message to re-init the softphone manager", () => {
                    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE);
                    // trigger configure
                    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);
                    sandbox.assert.calledWithExactly(global.localStorage.getItem, softphoneParamskey);
                    // see that the publishMetric is not invoked
                    sandbox.assert.notCalled(connect.publishMetric);
                    assert.isTrue(connect.SoftphoneManager.calledWithNew())
                });

            });

            it("Softphone params should get pushed to localstorage for the first time for the embedded case", function () {
                sandbox.stub(global.localStorage, "getItem").returns(null);
                sandbox.stub(global.localStorage, "setItem");

                sinon.stub(connect, "isCCP").returns(true);
                connect.core.initSoftphoneManager({ ringtoneUrl: defaultRingtoneUrl });
                connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, { softphone: softphoneParams });
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                sandbox.assert.calledWithExactly(global.localStorage.setItem, softphoneParamskey, JSON.stringify(softphoneParams));
                // TODO fix this test  - for some reason localstorage getItem is not getting reset  and always points at previous value
                sandbox.assert.notCalled(connect.publishMetric);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
                global.localStorage.getItem.restore();
                global.localStorage.setItem.restore();
                connect.isCCP.restore();
            });

            // specifically where Custom app itself is embedded which in turn embeds CCP
            it("Medialess CCP with embedded outer context app - should successfully able to init the softphone manager", function () {
                mediaLessCCPParams = {
                    allowFramedSoftphone: true
                };
                // Calling this from outer context
                connect.core.initSoftphoneManager(mediaLessCCPParams);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
            });

            it("Medialess CCP with standalone outer context  - should successfully able to init the softphone manager", function () {
                connect.isFramed.restore();
                sandbox.stub(connect, "isFramed").returns(false);

                mediaLessCCPParams = {
                    allowFramedSoftphone: true
                };
                // Calling this from outer context
                connect.core.initSoftphoneManager(mediaLessCCPParams);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
            });

            it("softphone params should get cleaned up on every initCCP call", () => {
                sandbox.stub(global.localStorage, "removeItem");
                connect.core.checkNotInitialized.restore();
                sandbox.stub(connect.core, "checkNotInitialized").returns(false);
                let container = { appendChild: sandbox.spy() };
                connect.core.initCCP(container, {
                    ccpUrl: "ccpURL"
                });
                sandbox.assert.calledWithExactly(global.localStorage.removeItem, softphoneParamskey);
                global.localStorage.removeItem.restore();
                connect.core.checkNotInitialized.restore();
            });
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
                connect.core.initSoftphoneManager(params);
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
                connect.core.initSoftphoneManager(params);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.SoftphoneManager.calledWithNew());
            });

            it("should set connect.core.softphoneParams", function () {
                expect(connect.core.softphoneParams).to.include({ ringtoneUrl: defaultRingtoneUrl });
            });
        });
    });

    describe('#connect.core.initRingtoneEngines()', function () {
        jsdom({ url: "http://localhost" });

        before(() => {
            connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
                getAgentData: () => ({})
            });
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
        });

        after(() => {
            connect.agent.initialized = false;
            sandbox.restore();
            connect.core.eventBus = null;
        });

        describe('with default settings', function () {
            let defaultRingtone;
            beforeEach(function () {
                defaultRingtone = {
                    voice: { ringtoneUrl: defaultRingtoneUrl },
                    queue_callback: { ringtoneUrl: defaultRingtoneUrl }
                };
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
            });

            afterEach(function () {
                sandbox.restore();
            });

            it("Ringtone init with VoiceRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(defaultRingtone.voice));
            });

            it("Ringtone init with QueueCallbackRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(defaultRingtone.queue_callback));
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
            let extraRingtone;
            beforeEach(() => {
                extraRingtone = {
                    voice: { ringtoneUrl: defaultRingtoneUrl },
                    queue_callback: { ringtoneUrl: defaultRingtoneUrl },
                    chat: { ringtoneUrl: defaultRingtoneUrl },
                    task: { ringtoneUrl: defaultRingtoneUrl }
                };
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: extraRingtone });
            });

            afterEach(function () {
                sandbox.restore();
            });

            it("Ringtone init with VoiceRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.VoiceRingtoneEngine.calledWithNew(extraRingtone.voice));
            });

            it("Ringtone init with QueueCallbackRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.QueueCallbackRingtoneEngine.calledWithNew(extraRingtone.queue_callback));
            });

            it("Ringtone init with ChatRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.ChatRingtoneEngine.calledWithNew(extraRingtone.chat));
            });


            it("Ringtone init with TaskRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.TaskRingtoneEngine.calledWithNew(extraRingtone.task));
            });
        });
    });

    describe('#connect.core.initCCP()', function () {
        jsdom({ url: "http://localhost" });
        let clock;
        let containerDiv;
        let clearStub, openStub, closeStub;
        const softphoneParams = { ringtoneUrl: "customVoiceRingtone.amazon.com" };
        const chatParams = { ringtoneUrl: "customChatRingtone.amazon.com" };
        const pageOptionsParams = {
            enableAudioDeviceSettings: false,
            enablePhoneTypeSettings: true
        };
        const shouldAddNamespaceToLogs = false;
            
        before(function () {
            clock = sinon.useFakeTimers();
            containerDiv = { appendChild: sandbox.spy() };
            params = {
                ccpUrl: "url.com",
                loginUrl: "loginUrl.com",
                softphone: softphoneParams,
                chat: chatParams,
                loginOptions: { autoClose: true },
                pageOptions: pageOptionsParams,
                shouldAddNamespaceToLogs: shouldAddNamespaceToLogs
            };

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
            connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
                getAgentData: () => ({})
            });
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            connect.core.initCCP(containerDiv, params);
            sandbox.spy(connect, "EventBus");
            sandbox.stub(connect, "MediaFactory");
            sandbox.spy(connect, "IFrameConduit");
            connect.core.agentDataProvider = new connect.core.AgentDataProvider(connect.core.getEventBus());
            sandbox.spy(connect.core.AgentDataProvider.prototype, "_fireAgentUpdateEvents");
        });

        after(function () {
            connect.agent.initialized = false;
            connect.core.eventBus = null;
            sandbox.restore();
            clock.restore();
        });

        it("CCP initialization", function () {
            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(containerDiv.appendChild.calledOnce);
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

        // TODO: add more granular test cases, also consider fixing the behavior
        it("sets up ringtone engines on CONFIGURE with initCCP params", function () {
            const defaultParamsPassedInByCCP = {
                ringtone: {
                    voice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    chat: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    task: { disabled: false, ringtoneUrl: defaultRingtoneUrl }
                }
            };

            connect.core.initRingtoneEngines(defaultParamsPassedInByCCP);
            const customParamsPassedInByCRM = {
                softphone: { disabled: false, ringtoneUrl: 'custom-softphone.mp3' },
                ringtone: {
                    chat: { disabled: false, ringtoneUrl: 'custom-chat.mp3' },
                    task: { disabled: false, ringtoneUrl: 'custom-task.mp3' }, // customization not working
                    queue_callback: { disabled: false, ringtoneUrl: 'custom-qcb.mp3' }  // customization not working
                }
            };
            connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, customParamsPassedInByCRM);
            connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
            connect.ifMaster.callArg(1);

            sinon.assert.calledWith(connect.VoiceRingtoneEngine, customParamsPassedInByCRM.softphone);
            sinon.assert.calledWith(connect.QueueCallbackRingtoneEngine, customParamsPassedInByCRM.softphone); // not 'custom-qcb.mp3'
            sinon.assert.calledWith(connect.ChatRingtoneEngine, customParamsPassedInByCRM.ringtone.chat);
        });

        it("should update the number of connected CCPs on UPDATE_CONNECTED_CCPS event", function () {
            expect(connect.numberOfConnectedCCPs).to.equal(0);
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
            expect(connect.numberOfConnectedCCPs).to.equal(1);
        });

        it("Multiple calls to initCCP does not append multiple CCP iframes", function() {
            sandbox.stub(window.document, "getElementsByTagName").returns([{ name: 'Amazon Connect CCP' }]);
            sandbox.resetHistory();
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            sandbox.assert.notCalled(containerDiv.appendChild);
            sandbox.assert.notCalled(connect.core.getAgentDataProvider);
            sandbox.assert.notCalled(connect.EventBus);
            sandbox.assert.notCalled(connect.core.AgentDataProvider.prototype._fireAgentUpdateEvents);
            sandbox.assert.notCalled(connect.MediaFactory);
            sandbox.assert.notCalled(connect.IFrameConduit);
            sandbox.assert.notCalled(connect.UpstreamConduitClient);
            sandbox.assert.notCalled(connect.core._refreshIframeOnTimeout);
        })

        describe("on ACK", function () {
            let fakeOnInitHandler;

            before(function () {
                fakeOnInitHandler = sandbox.fake();
                connect.core.onInitialized(fakeOnInitHandler);
                sandbox.stub(connect.WindowIOStream.prototype, 'send').returns(null);
                sandbox.spy(connect.core.getUpstream(), "sendUpstream");

                connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            });

            after(() => {
                connect.WindowIOStream.prototype.send.restore();
                connect.core.getUpstream().sendUpstream.restore();
            });

            it("should set portStreamId on ACK", function () {
                expect(connect.core.portStreamId).to.equal('portId');
                connect.core.initialized = true;
            });
    
            it("should set connect.core.softphoneParams", function () {
                expect(connect.core.softphoneParams).to.include({ ringtoneUrl: "customVoiceRingtone.amazon.com" });
            });
    
            it("should trigger INIT event on ACK", function () {
                expect(fakeOnInitHandler.callCount).to.equal(1);
            });

            it("sends up CONFIGURE event with config params on ACK", function () {
                sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.EventType.CONFIGURE, {
                    softphone: softphoneParams,
                    chat: chatParams,
                    pageOptions: pageOptionsParams,
                    shouldAddNamespaceToLogs: shouldAddNamespaceToLogs,
                });
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
                expect(openStub.calledWith(params.loginUrl, connect.MasterTopics.LOGIN_POPUP, params.loginOptions));
            });
            describe("on ACK", function () {
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
        afterEach(() => {
            clock.restore();
        });
        after(() => {
            sandbox.restore();
            connect.core.upstream = null;
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
            connect.core.upstream = { upstream: {} };

            connect.core._refreshIframeOnTimeout(params, {});
            expect(setTimeoutSpy.calledOnce).to.be.true;
            expect(setTimeoutSpy.calledWith(sinon.match.any, sinon.match.number.and(sinon.match((timeout) => timeout === 0)))).to.be.true;
            expect(connect.core.iframeRefreshAttempt).to.equal(undefined);
            expect(clearTimeoutSpy.calledOnce).to.be.true;

            clock.tick(5001); //the initial retry timeout.
            expect(connect.core.iframeRefreshAttempt).to.equal(1);
            expect(getCCPIframeSpy.calledOnce).to.be.true;
            expect(fakeRemoveChildSpy.calledOnce).to.be.true;
            expect(createCCPIframeSpy.calledOnce).to.be.true;
            expect(sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy.calledOnce).to.be.true;
            expect(connect.core.upstream.upstream.output === fakeContentWindow).to.be.true;
            expect(setTimeoutSpy.calledTwice).to.be.true;

            clock.tick(7001); //the 2nd retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(2);

            clock.tick(9001); //the 3rd retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(3);

            clock.tick(12001); //the 4th retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(4);

            clock.tick(21001); //the 5th retry timeout
            expect(connect.core.iframeRefreshAttempt).to.equal(5);

            clock.tick(37001); //the 6th, final retry timeout
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
            allow: "microphone; autoplay; clipboard-write",
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
        it('creates CCP with style attribute in ccpParams', function() {
            const style = "width:200px; height:200px;";
            const initCCPParams = { ...params, style };
            const expected = { ...expectedIframe, style };
            const returnedIframe = connect.core._createCCPIframe(containerDiv, initCCPParams);
            expect(appendChildSpy.calledOnce).to.be.true;
            sandbox.assert.calledWith(appendChildSpy, expected);
            expect(returnedIframe).to.be.deep.equal(expected);
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

    describe('_setTabId', function () {
        jsdom({ url: "http://localhost" });
        let sendUpstream;
        before(() => {
            connect.core.upstream = { sendUpstream: () => {} };
            window.sessionStorage.setItem(connect.SessionStorageKeys.TAB_ID, null);
            sendUpstream = sandbox.stub(connect.core.upstream, "sendUpstream");
        })
        beforeEach(() => {
            sandbox.reset();
            connect.core.tabId = null;
        });
        after(() => {
            sandbox.restore();
            connect.core.upstream = null;
        });
        it('create a new tabId if session storage does not contain a valid one', function () {
            connect.core._setTabId();
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.TAB_ID, {tabId: sinon.match.string});
        });
        it('reuses the tabId if session storage has a valid one', function () {
            let oldTabId = window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID);
            connect.core._setTabId();
            assert.isTrue(window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID) === oldTabId);
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.TAB_ID, {tabId: sinon.match.string});
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
            connect.core.initPageOptions(params);
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

    describe('Task Templates Client initialization', function () {
        before(() => {
            AWS.Endpoint = function Endpoint(endpoint) {
                this.host = endpoint;
            }
            sandbox.stub(connect, 'getUrlWithProtocol').callsFake(endpoint => `https://${endpoint}`);
        });
        after(() => {
            sandbox.restore();
        });
        it('initTaskTemplatesClient should throw an error if endpoint is not added to params', () => {
            expect( function () {
                connect.core.initTaskTemplatesClient(params);
            } ).to.throw( Error );
        });
        it('TaskTemplatesClient constructor should build Task Templates API endpoint based on endpoint param if taskTemplatesEndpoint is not provided', () => {
            params.endpoint = 'xyz.com';
            connect.core.initTaskTemplatesClient(params);
            expect(connect.core.taskTemplatesClient.endpointUrl).to.equal("https://xyz.com/task-templates/api/ccp");
        });
        it('TaskTemplatesClient constructor should add "/connect" prefix to Task Templates API endpoint if endpoint param looks like a CF domain', () => {
            params.endpoint = 'xyz.awsapps.com';
            connect.core.initTaskTemplatesClient(params);
            expect(connect.core.taskTemplatesClient.endpointUrl).to.equal("https://xyz.awsapps.com/connect/task-templates/api/ccp");
        });
        it('TaskTemplatesClient constructor should build Task Templates API endpoint based on taskTemplatesEndpoint param if it is provided', () => {
            params.endpoint = 'xyz.com';
            params.taskTemplatesEndpoint = 'abc.com/task-templates/api/ccp';
            connect.core.initTaskTemplatesClient(params);
            expect(connect.core.taskTemplatesClient.endpointUrl).to.equal("https://abc.com/task-templates/api/ccp");
        });
    });

    describe('connect.core.activateChannelWithViewType', function () {
        jsdom({ url: "http://localhost" });
        const viewType = "create_task", mediaType = "task";
        let sendUpstream;
        before(() => {
            connect.core.upstream = { sendUpstream: () => {} };
            sendUpstream = sandbox.stub(connect.core.upstream, "sendUpstream");
        })
        beforeEach(() => {
            sandbox.reset();
        });
        after(() => {
            sandbox.restore();
            connect.core.upstream = null;
        });
        it('call activateChannelWithViewType with base parameters "viewType", "mediaType"', function () {
            connect.core.activateChannelWithViewType(viewType, mediaType);
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.BROADCAST, 
                {
                    event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
                    data: { viewType, mediaType }
                }
            );
        });
        it('call activateChannelWithViewType with an optional parameter "source"', function () {
            connect.core.activateChannelWithViewType(viewType, mediaType, "agentapp");
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.BROADCAST, 
                {
                    event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
                    data: { viewType, mediaType, source: "agentapp" }
                }
            );
        });
        it('call activateChannelWithViewType with optional parameters "source", "caseId"', function () {
            connect.core.activateChannelWithViewType(viewType, mediaType, "keystone", "1234567890");
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.BROADCAST, 
                {
                    event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
                    data: { viewType, mediaType, source: "keystone", caseId:  "1234567890" }
                }
            );
        });
    });

    describe('#connect.core.terminate()', function () {
        jsdom({ url: "http://localhost" });
        function isCCPInitialized(containerDiv, params) {
            try {
                expect(params.ccpUrl).not.to.be.a("null");
                expect(containerDiv).not.to.be.a("null");
                assert.isTrue(document.createElement.calledOnce);
                assert.isTrue(containerDiv.appendChild.calledOnce);
                return true;
            } catch(e) {
                console.log("InitCCP initialization failed: ",e);
                return false;
            }
        }
        function isCCPTerminated() {
            try {
                assert.isEmpty(connect.core.client);
                assert.isEmpty(connect.core.agentAppClient);
                assert.isEmpty(connect.core.taskTemplatesClient);
                assert.isEmpty(connect.core.masterClient);
                assert.isNull(connect.core.agentDataProvider);
                assert.isNull(connect.core.softphoneManager);
                assert.isNull(connect.core.upstream);
                assert.isNull(connect.core.keepaliveManager);
                assert.isFalse(connect.agent.initialized);
                assert.isFalse(connect.core.initialized);
                assert.isFalse(connect.core.eventBus.logEvents);
                return true;
            } catch(e) {
                console.log("InitCCP Terminated failed: ",e);
                return false;
            }
        }
        let containerDiv;
        const softphoneParams = { allowFramedSoftphone: true };
            
        before(function () {
            containerDiv = { appendChild: sandbox.spy() };
            params = {
                ccpUrl: "url.com",
                softphone: softphoneParams,
                loginOptions: { autoClose: true }
            };

            sandbox.spy(document, "createElement");
            connect.core.initialized = false;
        });

        afterEach(function () {
            sandbox.resetHistory();
        });

        it("Checking if Connect is uninitialized", function () {
            connect.core.initCCP(containerDiv, params);
            expect(isCCPInitialized(containerDiv, params)).to.be.true;
            connect.core.terminate();
            expect(isCCPTerminated()).to.be.true;
        });

        it("Check if CCP is initialized after calling terminate function and re-calling initCCP", function () {
            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            connect.core.initCCP(containerDiv, params);
            expect(isCCPInitialized(containerDiv, params)).to.be.true;
            connect.core.terminate();
            connect.core.terminate();
            expect(isCCPTerminated()).to.be.true;
            sandbox.resetHistory();
            connect.core.initCCP(containerDiv, params);
            expect(isCCPInitialized(containerDiv, params)).to.be.true;
        });
         
    });
        
});
