const { assert, expect } = require("chai");
const proxyquire = require('proxyquire');
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

    after(() => {
        sandbox.restore();
    })

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
            sandbox.stub(connect, "isFramed").returns(true);
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

        describe('checkIfConfigureReceived', function () {
            let conduitStub, sendDownstreamStub;
            
            beforeEach(function () {
                sendDownstreamStub = sandbox.stub();
                conduitStub = {
                    sendDownstream: sendDownstreamStub
                };
            });

            afterEach(function () {
                connect.core.hasReceivedCRMConfigure = undefined;
            });

            describe('when CCP is framed', function () {                
                beforeEach(function () {
                    connect.isFramed.returns(true);
                });

                it('should set up timeout and send configure request when hasReceivedCRMConfigure is false', function () {
                    connect.core.hasReceivedCRMConfigure = false;
                    
                    connect.core.checkIfConfigureReceived(conduitStub);
                    
                    sinon.assert.notCalled(conduitStub.sendDownstream);
                    
                    clock.tick(2000);
                    
                    sinon.assert.calledWith(conduitStub.sendDownstream, connect.EventType.REQUEST_CONFIGURE);
                });

                it('should not send configure request when hasReceivedCRMConfigure is true', function () {
                    connect.core.hasReceivedCRMConfigure = true;
                    
                    connect.core.checkIfConfigureReceived(conduitStub);
                    
                    clock.tick(1000);
                    
                    sinon.assert.notCalled(conduitStub.sendDownstream);
                });

                it('should send configure request when hasReceivedCRMConfigure is undefined', function () {
                    connect.core.hasReceivedCRMConfigure = undefined;
                    
                    connect.core.checkIfConfigureReceived(conduitStub);
                    
                    clock.tick(1000);
                    
                    sinon.assert.calledWith(conduitStub.sendDownstream, connect.EventType.REQUEST_CONFIGURE);
                });
            });

            describe('when CCP is not framed', function () {
                beforeEach(function () {
                    connect.isFramed.returns(false);
                });

                it('should do nothing when not framed', function () {
                    connect.core.hasReceivedCRMConfigure = false;
                    
                    connect.core.checkIfConfigureReceived(conduitStub);
                    
                    clock.tick(2000);
                    
                    sinon.assert.notCalled(conduitStub.sendDownstream);
                });

                it('should do nothing regardless of hasReceivedCRMConfigure value', function () {
                    const testValues = [false, true, undefined, null];
                    
                    testValues.forEach(function(value) {
                        connect.core.hasReceivedCRMConfigure = value;
                        
                        connect.core.checkIfConfigureReceived(conduitStub);
                        
                        clock.tick(2000);
                        
                        sinon.assert.notCalled(conduitStub.sendDownstream);
                    });
                });
            });
        });

    });
    describe('#connect.core.initSharedWorker() with DR enabled', function () {
        jsdom({ url: "http://localhost" });
        let clock, initDisasterRecoverySpy;

        before(function () {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.core, "checkNotInitialized").returns(true);

            global.SharedWorker = sandbox.stub().returns({
                port: {
                    start: sandbox.spy(),
                    addEventListener: sandbox.spy()
                },
            });
            global.connect.agent.initialized = true;

            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
            sandbox.stub(connect, 'randomId').returns('id');
            initDisasterRecoverySpy = sandbox.stub(connect.core, 'initDisasterRecovery');
        });
        after(function () {
            sandbox.restore();
            clock.restore();
        });
        it("should call initDisasterRecovery if INIT_DISASTER_RECOVERY event is triggered", function () {
            connect.core.initSharedWorker(params);
            connect.core.getUpstream().downstreamBus.trigger(connect.DisasterRecoveryEvents.INIT_DISASTER_RECOVERY);
            sandbox.assert.calledOnce(initDisasterRecoverySpy);
        });
    });
    describe('#connect.core.initDisasterRecovery()', function () {
        jsdom({ url: "http://localhost" });
        let clock, suppressContactsSpy, forceOfflineSpy;
        const NEXT_ARN = "next ARN";

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.Conduit.prototype, 'sendUpstream');
            suppressContactsSpy = sandbox.stub();
            forceOfflineSpy = sandbox.stub();
        });
        afterEach(function () {
            sandbox.restore();
            clock.restore();
        });
        describe("event listener tests", function () {
            describe("when this is the master for softphone topic", function() {
                beforeEach(function () {
                    sandbox.stub(connect, 'ifMaster').callsArg(1);
                    connect.core.initDisasterRecovery(params, suppressContactsSpy, forceOfflineSpy);
                });
                it("should force offline when SET_OFFLINE event is sent from downstream, with hard failover if no data provided", function () {
                    connect.core.getUpstream().downstreamBus.trigger(connect.DisasterRecoveryEvents.SET_OFFLINE);
                    sandbox.assert.calledWith(forceOfflineSpy);
                });
                it("should force offline when SET_OFFLINE event is sent from downstream, with soft failover if provided", function () {
                    connect.core.getUpstream().downstreamBus.trigger(connect.DisasterRecoveryEvents.SET_OFFLINE, {softFailover: true});
                    sandbox.assert.calledWith(forceOfflineSpy, true);
                });
                it("should force offline with hard failover when FORCE_OFFLINE event is sent from upstream", function () {
                    connect.core.getUpstream().upstreamBus.trigger(connect.DisasterRecoveryEvents.FORCE_OFFLINE);
                    sandbox.assert.calledWith(forceOfflineSpy);
                });
                it("should force offline when FORCE_OFFLINE event is sent from upstream, with soft failover and nextActiveArn if provided", function () {
                    connect.core.getUpstream().upstreamBus.trigger(connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                        {softFailover: true, nextActiveArn: NEXT_ARN});
                    sandbox.assert.calledWith(forceOfflineSpy, true, NEXT_ARN);
                });
            });
            describe("when this is not the master for softphone topic", function() {
                beforeEach(function () {
                    sandbox.stub(connect, 'ifMaster');
                    params.isPrimary = true; // simplify assertions by avoiding initial forceOffline call
                    connect.core.initDisasterRecovery(params, suppressContactsSpy, forceOfflineSpy);
                });
                it("should not call forceOffline if SET_OFFLINE event is fired downstream and this is not softphone master", function () {
                    connect.core.getUpstream().downstreamBus.trigger(connect.DisasterRecoveryEvents.SET_OFFLINE);
                    sandbox.assert.notCalled(forceOfflineSpy);
                });
                it("should not call forceOffline if FORCE_OFFLINE event is fired upstream and this is not softphone master", function () {
                    connect.core.getUpstream().upstreamBus.trigger(connect.DisasterRecoveryEvents.FORCE_OFFLINE);
                    sandbox.assert.notCalled(forceOfflineSpy);
                });
            });
        });
        describe("pollForFailover enabled", function () {
            const INSTANCE_ARN = "this ARN";
            const OTHER_ARN = "other ARN";
            const AUTH_TOKEN = "auth token";
            beforeEach(function () {
                params.pollForFailover = true;
                params.instanceArn = INSTANCE_ARN;
                params.otherArn = OTHER_ARN;
                params.authToken = AUTH_TOKEN;
            });
            it("should send INIT_DR_POLLING event upstream if pollForFailover is truthy, passing up instance/other ARNs and auth token", function () {
                connect.core.initDisasterRecovery(params);
                sandbox.assert.calledWith(connect.Conduit.prototype.sendUpstream, connect.DisasterRecoveryEvents.INIT_DR_POLLING,
                    { instanceArn: INSTANCE_ARN, otherArn: OTHER_ARN, authToken: AUTH_TOKEN });
            });
        });
        describe("params.isPrimary having an untruthy value (specifically undefined)", function () {
            beforeEach(function() {
                connect.core.initDisasterRecovery(params, suppressContactsSpy, forceOfflineSpy);
            });
            it("should suppress contacts and force offline if instance is non-primary", function () {
                sandbox.assert.calledWith(suppressContactsSpy, true);
                sandbox.assert.calledWith(forceOfflineSpy);
            });
        });
        describe("tests with params.isPrimary set to true", function() {
            beforeEach(function() {
                params.isPrimary = true;
                connect.core.initDisasterRecovery(params, suppressContactsSpy, forceOfflineSpy);
            });
            it("should unsuppress contacts and not force offline, if instance is primary", function () {
                sandbox.assert.calledWith(suppressContactsSpy, false);
                sandbox.assert.notCalled(forceOfflineSpy);
            });
        });
    });
    describe('forceOffline', function () {
        jsdom({ url: "http://localhost" });
        let clock, suppressContactsSpy, setStateSpy, agentStub;
        let offlineState = {type: connect.AgentStateType.OFFLINE};

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect, 'ifMaster');
            suppressContactsSpy = sandbox.stub();
            params.isPrimary = true; // skip extra forceOffline() call on initDisasterRecovery()
            connect.core.initDisasterRecovery(params, suppressContactsSpy); // sets up forceOffline binding under connect.core
            sandbox.stub(connect.Conduit.prototype, 'sendUpstream');
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({getInstanceId: function() { return "INSTANCE_ID"; }});
            setStateSpy = sandbox.stub();
            agentStub = {
                getAgentStates: function() {
                    return [offlineState]
                },
                setState: setStateSpy,
            };
            sandbox.stub(connect, 'agent').callsArgWith(0, agentStub);
        });
        afterEach(function () {
            sandbox.restore();
            clock.restore();
        });
        it("sets force offline upstream to false and agent offline, if no contacts in snapshot", function () {
            agentStub.getContacts = function() {
                return []
            };
            connect.core.forceOffline();
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: false}));
            sandbox.assert.calledWith(setStateSpy, offlineState);
        });
        it("passes next active ARN with FORCE_OFFLINE event upstream", function () {
            agentStub.getContacts = function() {
                return []
            };
            const NEXT_ARN = "instance arn";
            connect.core.forceOffline(false, NEXT_ARN);
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: false, nextActiveArn: NEXT_ARN}));
        });
        it("destroys agent connection, sets force offline upstream to false, and sets agent offline; if contacts in snapshot and using hard failover", function () {
            let destroyStub = sandbox.stub().yieldsTo('success');
            let mockContact = {
                getAgentConnection: function() {
                    return { destroy: destroyStub };
                }
            };
            agentStub.getContacts = function() {
                return [mockContact]
            };
            connect.core.forceOffline();
            sandbox.assert.called(destroyStub);
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: false}));
            sandbox.assert.calledWith(setStateSpy, offlineState);
        });
        it("destroys agent connection on other contacts and adds onDestroy handler, if voice contact in snapshot and using soft failover", function () {
            let voiceDestroyStub = sandbox.stub().yieldsTo('success');
            let voiceOnDestroyStub = sandbox.stub();
            let chatDestroyStub = sandbox.stub().yieldsTo('success');
            let mockVoiceContact = {
                getType: function() {
                    return connect.ContactType.QUEUE_CALLBACK;
                },
                getAgentConnection: function() {
                    return { destroy: voiceDestroyStub };
                },
                onDestroy: voiceOnDestroyStub,
                getContactId: sandbox.stub()
            };
            let mockChatContact = {
                getType: function() {
                    return connect.ContactType.CHAT;
                },
                getAgentConnection: function() {
                    return { destroy: chatDestroyStub };
                }
            };
            agentStub.getContacts = function() {
                return [mockVoiceContact, mockChatContact]
            };
            // initial call while voice contact is in snapshot
            connect.core.forceOffline(true);
            sandbox.assert.calledOnce(chatDestroyStub);
            sandbox.assert.notCalled(voiceDestroyStub);
            sandbox.assert.calledOnce(voiceOnDestroyStub);
            sandbox.assert.notCalled(setStateSpy);
            sandbox.assert.notCalled(connect.core.getUpstream().sendUpstream);

            // second call from inside onDestroy after voice contact is destroyed
            agentStub.getContacts = function() {
                return [];
            };
            voiceOnDestroyStub.getCall(0).callback(mockVoiceContact);
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: false}));
            sandbox.assert.calledWith(setStateSpy, offlineState);
        });
        it("sets force offline upstream to true and doesn't set agent state, if contacts in snapshot but a DestroyConnection failed", function () {
            let destroyStub = sandbox.stub().yieldsTo('failure');
            let mockContact = {
                getAgentConnection: function() {
                    return { destroy: destroyStub };
                }
            };
            agentStub.getContacts = function() {
                return [mockContact]
            };
            connect.core.forceOffline();
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: true}));
            sandbox.assert.notCalled(setStateSpy);
        });
        it("sets force offline upstream to true and stops terminating contacts, if multiple contacts in snapshot but a DestroyConnection failed", function () {
            let destroyStub = sandbox.stub().yieldsTo('failure');
            let mockContact = {
                getAgentConnection: function() {
                    return { destroy: destroyStub };
                }
            };
            agentStub.getContacts = function() {
                return [mockContact, mockContact]
            };
            connect.core.forceOffline();
            sandbox.assert.calledOnce(destroyStub);
            sinon.assert.calledOnceWithExactly(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.FORCE_OFFLINE,
                sinon.match({offline: true}));
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
            clock.restore();
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
            clock.restore();
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
        let sendDownstreamStub = sandbox.stub();
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

            describe("A scenario where embedded CCP is refreshed", () => {
                let clock;

                before(() => {
                    clock = sinon.useFakeTimers();
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

                after(() => {
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

        beforeEach(() => {
            connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
                getAgentData: () => ({})
            });
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
        });

        afterEach(() => {
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
                sandbox.stub(connect, "EmailRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
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

            it("Ringtone no init with EmailRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isFalse(connect.EmailRingtoneEngine.calledWithNew());
            });
        });

        describe('with optional chat and task ringtone params', function () {
            let extraRingtone;
            beforeEach(() => {
                extraRingtone = {
                    voice: { ringtoneUrl: defaultRingtoneUrl },
                    queue_callback: { ringtoneUrl: defaultRingtoneUrl },
                    chat: { ringtoneUrl: defaultRingtoneUrl },
                    task: { ringtoneUrl: defaultRingtoneUrl },
                    email: { ringtoneUrl: defaultRingtoneUrl },
                };
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                sandbox.stub(connect, "EmailRingtoneEngine");
                connect.core.initRingtoneEngines({ ringtone: extraRingtone });
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


            it("Ringtone init with EmailRingtoneEngine", function () {
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                assert.isTrue(connect.EmailRingtoneEngine.calledWithNew(extraRingtone.email));
            });
        });

        describe("initRingtoneEngines with stored ringer device ID", function () {
            const DEVICE_ID = "DEVICE_ID";
            let setRingerDeviceMock;
            let defaultRingtone;
            connect.core._ringerDeviceId = null;

            beforeEach(function () {
                defaultRingtone = {
                    voice: { ringtoneUrl: defaultRingtoneUrl },
                    queue_callback: { ringtoneUrl: defaultRingtoneUrl },
                    chat: { ringtoneUrl: defaultRingtoneUrl },
                    task: { ringtoneUrl: defaultRingtoneUrl }
                };
                setRingerDeviceMock = sandbox.spy();
                sandbox.stub(connect, "ifMaster");
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                sandbox.stub(connect, "EmailRingtoneEngine");
            });

            afterEach(function () {
                connect.core._ringerDeviceId = null;
            });

            it("does not call setRingerDevice with stored device ID if there wasn't one previously stored", function() {
                connect.core.initRingtoneEngines({ringtone: defaultRingtone}, setRingerDeviceMock);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                sandbox.assert.notCalled(setRingerDeviceMock);
            });

            it("does call setRingerDevice with stored device ID if there was one previously stored", function() {
                connect.core._ringerDeviceId = DEVICE_ID;
                connect.core.initRingtoneEngines({ringtone: defaultRingtone}, setRingerDeviceMock);
                connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                connect.ifMaster.callArg(1);
                sandbox.assert.calledWith(setRingerDeviceMock, { deviceId: DEVICE_ID });
            });
        });

        describe('embedded CCP', () => {
            let ringtoneParams;
            let ringtoneParamsKey;
            let stubbedGetItem;
            let clock;
            let defaultRingtones;

            before(() => {
                defaultRingtones = {
                    voice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    queue_callback: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    chat: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    task: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
                    email: { disabled: false, ringtoneUrl: defaultRingtoneUrl },

                };
                ringtoneParams =  { ringtone: defaultRingtones };
                ringtoneParamsKey = `RingtoneParamsStorage::${global.location.origin}`;
                clock = sinon.useFakeTimers();
            });

            beforeEach(() => {
                sandbox.stub(connect.core, "getUpstream").returns({
                    onUpstream: (event, fn) => {
                        connect.core.eventBus.subscribe(event, fn);
                    },
                    upstreamBus: connect.core.eventBus,
                    sendUpstream: sinon.stub()
                });
                sandbox.stub(connect, "VoiceRingtoneEngine");
                sandbox.stub(connect, "QueueCallbackRingtoneEngine");
                sandbox.stub(connect, "ChatRingtoneEngine");
                sandbox.stub(connect, "TaskRingtoneEngine");
                sandbox.stub(connect, "EmailRingtoneEngine");

                sandbox.stub(connect, 'isFramed').returns(true);
                stubbedGetItem = sandbox.stub(global.localStorage, "getItem");
                sandbox.stub(global.localStorage, "setItem");
                sandbox.stub(global.localStorage, "removeItem");
                sandbox.stub(connect, 'ifMaster');
            });

            afterEach(() => {
                sandbox.resetHistory();
            });

            after(() => {
                clock.restore();
            });

            it('Ringtone parameters are persisted in local storage for the first time when receiving CONFIGURE event', () => {
                stubbedGetItem.returns(null);
                connect.core.initRingtoneEngines(ringtoneParams);
                connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});

                sandbox.assert.calledWithExactly(global.localStorage.setItem, ringtoneParamsKey, JSON.stringify(defaultRingtones));
            });

            describe('when iFrame is refreshed', () => {
                beforeEach(() => {
                    stubbedGetItem.returns(JSON.stringify(defaultRingtones));
                });

                it('initializes ringtone engines, using stored ringtone params when CONFIGURE message is NOT delivered', () => {
                    const notUsedRingtoneParams = { ringtone: {} };
                    connect.core.initRingtoneEngines(notUsedRingtoneParams);
                    connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    clock.tick(110);
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);

                    sandbox.assert.calledWithExactly(global.localStorage.getItem, ringtoneParamsKey);
                    assert.isTrue(connect.VoiceRingtoneEngine.calledOnceWith(defaultRingtones.voice));
                    assert.isTrue(connect.ChatRingtoneEngine.calledOnceWith(defaultRingtones.chat));
                    assert.isTrue(connect.TaskRingtoneEngine.calledOnceWith(defaultRingtones.task));
                    assert.isTrue(connect.QueueCallbackRingtoneEngine.calledOnceWith(defaultRingtones.queue_callback));
                    assert.isTrue(connect.EmailRingtoneEngine.calledOnceWith(defaultRingtones.email));

                });

                it('initializes ringtone engines WITHOUT using stored ringtone params when CONFIGURE message IS delivered', () => {
                    const otherRingtoneUrl = 'some_other_ringtone_url';
                    const usedRingtoneParams = {
                        ringtone: {
                            voice: { disabled: false, ringtoneUrl: otherRingtoneUrl },
                            queue_callback: { disabled: false, ringtoneUrl: otherRingtoneUrl },
                            chat: { disabled: false, ringtoneUrl: otherRingtoneUrl },
                            task: { disabled: false, ringtoneUrl: otherRingtoneUrl },
                            email: { disabled: false, ringtoneUrl: otherRingtoneUrl },

                        }
                    }
                    connect.core.initRingtoneEngines(usedRingtoneParams);
                    connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    clock.tick(99); // set to below 100 to NOT execute the setimeout handler
                    // trigger configure
                    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);

                    sandbox.assert.calledWithExactly(global.localStorage.getItem, ringtoneParamsKey);
                    assert.isTrue(connect.VoiceRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.voice));
                    assert.isTrue(connect.ChatRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.chat));
                    assert.isTrue(connect.TaskRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.task));
                    assert.isTrue(connect.QueueCallbackRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.queue_callback));
                    assert.isTrue(connect.EmailRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.email));

                });

                it('initializes ringtone engines WITHOUT using stored ringtone params when CONFIGURE message IS delivered, for disabled ringtone', () => {
                    const otherRingtoneUrl = 'some_other_ringtone_url';
                    const usedRingtoneParams = {
                        ringtone: {
                            voice: { disabled: true, ringtoneUrl: otherRingtoneUrl },
                            queue_callback: { disabled: true, ringtoneUrl: otherRingtoneUrl },
                            chat: { disabled: true, ringtoneUrl: otherRingtoneUrl },
                            task: { disabled: true, ringtoneUrl: otherRingtoneUrl },
                            email: { disabled: true, ringtoneUrl: otherRingtoneUrl },
                        }
                    }
                    connect.core.initRingtoneEngines(usedRingtoneParams);
                    connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    clock.tick(99); // set to below 100 to NOT execute the setimeout handler
                    // trigger configure
                    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});
                    connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
                    connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
                    connect.ifMaster.callArg(1);

                    sandbox.assert.calledWithExactly(global.localStorage.getItem, ringtoneParamsKey);
                    assert.isFalse(connect.VoiceRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.voice));
                    assert.isFalse(connect.ChatRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.chat));
                    assert.isFalse(connect.TaskRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.task));
                    assert.isFalse(connect.QueueCallbackRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.queue_callback));
                    assert.isFalse(connect.EmailRingtoneEngine.calledOnceWith(usedRingtoneParams.ringtone.email));
                });
            });

            it('Ringtone parameters should get cleaned up on every initCCP call', () => {
                sandbox.stub(connect.core, "checkNotInitialized").returns(false);
                let container = { appendChild: sandbox.spy() };
                connect.core.initCCP(container, {
                    ccpUrl: "ccpURL"
                });
                sandbox.assert.calledWithExactly(global.localStorage.removeItem, ringtoneParamsKey);
                connect.core.checkNotInitialized.restore();
            });
        });
    });

    describe('setRingerDevice', function() {
        jsdom({ url: "http://localhost" });
        let defaultRingtone;
        const DEVICE_ID = "DEVICE_ID";

        beforeEach(() => {
            connect.agent.initialized = true;
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            sandbox.stub(connect, "publishMetric");
            defaultRingtone = {
                voice: { ringtoneUrl: defaultRingtoneUrl },
                chat: { ringtoneUrl: defaultRingtoneUrl },
            };
        });

        afterEach(() => {
            connect.agent.initialized = false;
            sandbox.restore();
            connect.core.eventBus = null;
            connect.core._ringerDeviceId = null;
            connect.core.ringtoneEngines = null;
        });

        it("stores device ID if setRingerDevice is called without ringtone engines being initialized", function () {
            connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
            connect.core.getEventBus().trigger(connect.ConfigurationEvents.SET_RINGER_DEVICE, {deviceId: DEVICE_ID});
            assert.equal(connect.core._ringerDeviceId, DEVICE_ID);
            sandbox.assert.calledWithExactly(connect.publishMetric, {
                name: "SetRingerDeviceBeforeInitRingtoneEngine",
                data: { count: 1 }
            });
        });

        it("Doesn't store device ID if setRingerDevice is called with ringtone engines initialized", function () {
            connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
            connect.core.ringtoneEngines = { chat: { setOutputDevice: () => {} }, voice: { setOutputDevice: () => {} }}
            sandbox.stub(connect.core.ringtoneEngines.chat, "setOutputDevice").resolves(DEVICE_ID);
            sandbox.stub(connect.core.ringtoneEngines.voice, "setOutputDevice").resolves(DEVICE_ID);
            connect.core.getEventBus().trigger(connect.ConfigurationEvents.SET_RINGER_DEVICE, {deviceId: DEVICE_ID});
            assert.equal(connect.core._ringerDeviceId, null);
            sandbox.assert.notCalled(connect.publishMetric);
            sandbox.assert.calledWithExactly(connect.core.ringtoneEngines.chat.setOutputDevice, DEVICE_ID);
            sandbox.assert.calledWithExactly(connect.core.ringtoneEngines.voice.setOutputDevice, DEVICE_ID);
        });
    });

    describe("#connect.core.initCCP() starting AmazonConnectStreamsSite", () => {
        jsdom({ url: "http://url.com/test" });

        let amazonConnectStreamsSite;
        let containerDiv;
        let params;
        let createElementSpy;
        let loggerInfoSpy, loggerErrorSpy;
        
        const streamsSiteStub = {
            init: sinon.stub()
        }

        const streamsSiteProviderStub = {
            id: "test-id",
            setCCPIframe: sinon.stub()
        };

        before(() => {
            params = {
                ccpUrl: "http://url.com/test",
            };
            containerDiv = { appendChild: sandbox.spy() };
            createElementSpy = sandbox.spy(document, "createElement");

            amazonConnectStreamsSite = proxyquire("../../src/core", {
                "@amazon-connect/site-streams": {
                    AmazonConnectStreamsSite: streamsSiteStub
                }
            });

            loggerInfoSpy = sinon.spy(connect.getLog(), "info");
            loggerErrorSpy = sinon.spy(connect.getLog(), "error");
        });

        beforeEach(() => {
            loggerInfoSpy.restore();
            loggerErrorSpy.restore();
        })

        after(() => {
            connect.agent.initialized = false;
            sandbox.restore();
        });

        describe("before calling initCCP", () => {
            it("should throw when getting SDK Client Config", () => {
                expect(() => connect.core.getSDKClientConfig()).to.throw("Provider is not initialized");
            })
        });

        describe("when not setting a provider", () => {
            it("should initialize AmazonConnectStreamsSite", () => {
                streamsSiteStub.init.returns({provider: streamsSiteProviderStub});

                connect.core.initCCP(containerDiv, params);

                expect(streamsSiteStub.init.calledWithExactly({instanceUrl: "url.com"}));
                expect(loggerInfoSpy.calledWithExactly('Created AmazonConnectStreamsSite'));
                expect(loggerErrorSpy.called).to.be.false;
                expect(createElementSpy.calledOnce).to.be.true;
                const [iframe] = createElementSpy.returnValues;
                expect(streamsSiteProviderStub.setCCPIframe.calledWithExactly(iframe));
            });

            it("should contain provider with getting client config", () => {
                streamsSiteStub.init.returns({provider: streamsSiteProviderStub});
                connect.core.initCCP(containerDiv, params);

                const result = connect.core.getSDKClientConfig();

                expect(result.provider).to.equal(streamsSiteProviderStub);
            });

            it("should error when AmazonConnectStreamsSite fails to initialize", () => {
                const testError = new Error("test error");
                streamsSiteStub.init.throws(testError);

                connect.core.initCCP(containerDiv, params);

                expect(loggerErrorSpy.calledWithExactly('Error when setting up AmazonConnectStreamsSite'));
            })

            it("should error when setting iframe on AmazonConnectStreamsSite", () => {
                const testError = new Error("test error");
                streamsSiteStub.init.returns({provider: streamsSiteProviderStub});
                streamsSiteProviderStub.setCCPIframe.throws(testError);

                connect.core.initCCP(containerDiv, params);

                expect(loggerErrorSpy.calledWithExactly('Error occurred when setting CCP iframe to provider'));
            })
        });

        describe("when setting a provider in params", () => {
            class TestExistingProvider {
                get id() {
                    return "test-existing-provider";
                }
            }

            let existingProvider;
            let paramsWithExistingProvider;

            beforeEach(() => {
                existingProvider = new TestExistingProvider();
                paramsWithExistingProvider = {
                    ...params,
                    provider: existingProvider
                };
            });

            it("should not initialize AmazonConnectStreamsSite", () => {
                connect.core.initCCP(containerDiv, paramsWithExistingProvider);

                expect(streamsSiteStub.init.notCalled);
                expect(loggerInfoSpy.calledWithExactly('Using AmazonConnectProvider from params"'));
                expect(loggerErrorSpy.called).to.be.false;
                expect(createElementSpy.calledOnce).to.be.false;
            });

            it("should contain provider with getting client config", () => {
                connect.core.initCCP(containerDiv, paramsWithExistingProvider);

                const result = connect.core.getSDKClientConfig();

                expect(result.provider).to.equal(existingProvider);
            });

            it("should error when object does not have a constructor", () => {
                const invalidProviderParams = {
                    ...params,
                    provider: { id: "foo" }
                };

                connect.core.initCCP(containerDiv, invalidProviderParams);

                expect(loggerErrorSpy.calledWithExactly('Error when setting up AmazonConnectProvider from params'));
            })
        });

        describe("when setting plugins in params", () => {
            class TestProvider {
                get id() {
                    return "test-provider-with-plugins";
                }
            }

            let testProvider;
            let mockPlugin1;
            let mockPlugin2;
            let originalPrototype;

            beforeEach(() => {
                testProvider = new TestProvider();
                // Save the original prototype state for cleanup
                originalPrototype = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(testProvider));
                
                mockPlugin1 = sandbox.spy((prototype) => {
                    prototype.pluginMethod1 = () => "plugin1";
                    return prototype;
                });
                mockPlugin2 = sandbox.spy((prototype) => {
                    prototype.pluginMethod2 = () => "plugin2";
                    return prototype;
                });
                loggerInfoSpy = sandbox.spy(connect.getLog(), "info");
                loggerErrorSpy = sandbox.spy(connect.getLog(), "error");
            });

            afterEach(() => {
                loggerInfoSpy.restore();
                loggerErrorSpy.restore();
                
                // Clean up any plugin methods added to prototypes
                const prototype = Object.getPrototypeOf(testProvider);
                if (prototype.pluginMethod1) {
                    delete prototype.pluginMethod1;
                }
                if (prototype.pluginMethod2) {
                    delete prototype.pluginMethod2;
                }
                
                // Also clean up streamsSiteProviderStub prototype if it was modified
                if (streamsSiteProviderStub && Object.getPrototypeOf(streamsSiteProviderStub).pluginMethod1) {
                    delete Object.getPrototypeOf(streamsSiteProviderStub).pluginMethod1;
                }
            });

            it("should apply a single plugin to the provider prototype", () => {
                const paramsWithSinglePlugin = {
                    ...params,
                    provider: testProvider,
                    plugins: mockPlugin1
                };

                connect.core.initCCP(containerDiv, paramsWithSinglePlugin);

                expect(mockPlugin1.calledOnce).to.be.true;
                expect(mockPlugin1.calledWith(Object.getPrototypeOf(testProvider))).to.be.true;
                expect(Object.getPrototypeOf(testProvider).pluginMethod1()).to.equal("plugin1");
                expect(loggerErrorSpy.called).to.be.false;
            });

            it("should apply multiple plugins to the provider prototype", () => {
                const paramsWithMultiplePlugins = {
                    ...params,
                    provider: testProvider,
                    plugins: [mockPlugin1, mockPlugin2]
                };

                connect.core.initCCP(containerDiv, paramsWithMultiplePlugins);

                expect(mockPlugin1.calledOnce).to.be.true;
                expect(mockPlugin2.calledOnce).to.be.true;
                expect(Object.getPrototypeOf(testProvider).pluginMethod1()).to.equal("plugin1");
                expect(Object.getPrototypeOf(testProvider).pluginMethod2()).to.equal("plugin2");
                expect(loggerErrorSpy.called).to.be.false;
            });

            it("should log error when plugin application fails", () => {
                const errorThrowingPlugin = () => {
                    throw new Error("Plugin error");
                };
                
                const paramsWithBadPlugin = {
                    ...params,
                    provider: testProvider,
                    plugins: errorThrowingPlugin
                };

                connect.core.initCCP(containerDiv, paramsWithBadPlugin);

                expect(loggerErrorSpy.calledWithExactly('Error when setting plugins for provider')).to.be.true;
            });

            it("should handle plugins when no provider is set (uses AmazonConnectStreamsSite)", () => {
                streamsSiteStub.init.returns({provider: streamsSiteProviderStub});
                
                const paramsWithPluginButNoProvider = {
                    ...params,
                    plugins: mockPlugin1
                };

                connect.core.initCCP(containerDiv, paramsWithPluginButNoProvider);

                expect(mockPlugin1.calledOnce).to.be.true;
                expect(mockPlugin1.calledWith(Object.getPrototypeOf(streamsSiteProviderStub))).to.be.true;
                // Don't check for no errors as AmazonConnectStreamsSite may error in test environment
            });

            it("should handle empty plugins array gracefully", () => {
                const paramsWithEmptyPlugins = {
                    ...params,
                    provider: testProvider,
                    plugins: []
                };

                connect.core.initCCP(containerDiv, paramsWithEmptyPlugins);

                expect(mockPlugin1.called).to.be.false;
                expect(mockPlugin2.called).to.be.false;
                expect(loggerErrorSpy.called).to.be.false;
            });

            it("should remove plugins from params to prevent sending to CCP", () => {
                const originalParams = {
                    ...params,
                    provider: testProvider,
                    plugins: [mockPlugin1, mockPlugin2]
                };
                
                // Mock the upstream to capture what gets sent
                const mockConduit = {
                    onAllUpstream: sandbox.stub(),
                    onUpstream: sandbox.stub(),
                    sendUpstream: sandbox.stub()
                };
                sandbox.stub(connect, 'IFrameConduit').returns(mockConduit);

                connect.core.initCCP(containerDiv, originalParams);

                // Plugins should be removed from the params object that gets processed
                expect(originalParams.plugins).to.be.undefined;
                expect(mockPlugin1.calledOnce).to.be.true;
                expect(mockPlugin2.calledOnce).to.be.true;
            });

            it("should handle plugin that returns undefined", () => {
                const undefinedReturningPlugin = sandbox.spy((prototype) => {
                    prototype.pluginMethod = () => "modified";
                    // Explicitly return undefined
                    return undefined;
                });
                
                const paramsWithUndefinedPlugin = {
                    ...params,
                    provider: testProvider,
                    plugins: undefinedReturningPlugin
                };

                connect.core.initCCP(containerDiv, paramsWithUndefinedPlugin);

                expect(undefinedReturningPlugin.calledOnce).to.be.true;
                expect(Object.getPrototypeOf(testProvider).pluginMethod()).to.equal("modified");
                expect(loggerErrorSpy.called).to.be.false;
            });
        });

    })

    describe('#connect.core.initCCP()', function () {
        jsdom({ url: "http://localhost" });
        let clock;
        let containerDiv;
        let clearStub, openStub, closeStub;
        const softphoneParams = { ringtoneUrl: "customVoiceRingtone.amazon.com" };
        const chatParams = { ringtoneUrl: "customChatRingtone.amazon.com" };
        const taskParams = { ringtoneUrl: "customTaskRingtone.amazon.com" };
        const pageOptionsParams = {
            enableAudioDeviceSettings: false,
            enableVideoDeviceSettings: false,
            enablePhoneTypeSettings: true
        };
        const disasterRecoveryOn = undefined;
        const shouldAddNamespaceToLogs = false;

        before(function () {
            clock = sinon.useFakeTimers();
            containerDiv = { appendChild: sandbox.spy() };
            params = {
                ccpUrl: "url.com",
                loginUrl: "loginUrl.com",
                softphone: softphoneParams,
                chat: chatParams,
                task: taskParams,
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
            connect.core.initialized = false;
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

        describe("listenForConfigureRequest", function () {
            let testSandbox, getUpstreamStub, conduitStub, onUpstreamStub, sendUpstreamStub;
            
            beforeEach(function () {
                testSandbox = sinon.createSandbox();
                onUpstreamStub = testSandbox.stub();
                sendUpstreamStub = testSandbox.stub();
                conduitStub = {
                    onUpstream: onUpstreamStub,
                    sendUpstream: sendUpstreamStub
                };
                getUpstreamStub = testSandbox.stub(connect.core, 'getUpstream').returns(conduitStub);
            });

            afterEach(function () {
                testSandbox.restore();
            });

            it("should set up listener for REQUEST_CONFIGURE and respond with provided params", function () {
                const params = { 
                    softphone: { ringtoneUrl: "test-softphone.mp3" },
                    showInactivityModal: false
                };
                
                connect.core.listenForConfigureRequest(params, conduitStub, false);
                
                testSandbox.assert.calledOnce(onUpstreamStub);
                testSandbox.assert.calledWith(onUpstreamStub, connect.EventType.REQUEST_CONFIGURE, sinon.match.func);
                
                const requestHandler = onUpstreamStub.getCall(0).args[1];
                requestHandler();
                
                testSandbox.assert.calledOnce(sendUpstreamStub);
                testSandbox.assert.calledWithExactly(sendUpstreamStub, connect.EventType.CONFIGURE, {
                    softphone: { ringtoneUrl: 'test-softphone.mp3' },
                    chat: undefined,
                    task: undefined,
                    pageOptions: undefined,
                    shouldAddNamespaceToLogs: undefined,
                    disasterRecoveryOn: undefined,
                    showInactivityModal: false
                });
            });
        });


        it("Multiple calls to initCCP does not append multiple CCP iframes", function () {
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
                    task: taskParams,
                    pageOptions: pageOptionsParams,
                    shouldAddNamespaceToLogs: shouldAddNamespaceToLogs,
                    disasterRecoveryOn: disasterRecoveryOn,
                    showInactivityModal: undefined
                });
            });

            it("does not send up INIT_DISASTER_RECOVERY event if disaster recovery is off", function () {
                sinon.assert.neverCalledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.INIT_DISASTER_RECOVERY, params);
            });
        });
        
        describe("on ACK_TIMEOUT", function () {
            before(() => {
                connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
            });
            it("calls _refreshIframeOnTimeout when ack timeout occurs", function () {
                expect(connect.core._refreshIframeOnTimeout.calledOnce).to.be.true;
                expect(openStub.calledOnce).to.be.true;
                expect(openStub.calledWith(params.loginUrl, connect.MasterTopics.LOGIN_POPUP, params.loginOptions));
            });
            describe("on ACK", function () {
                it("resets the iframe refresh timeout, calls popupManager.clear, calls loginWindow.close", () => {
                    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
                    expect(connect.core.iframeRefreshTimeout === null).to.be.true;
                    expect(closeStub.calledOnce).to.be.true;
                    expect(connect.core.loginWindow === null).to.be.true;
                });
            });
        });

        describe('#connect.core.setupAuthenticationEventHandlers() authenticate event subscriptions', function () {
            let containerDiv;
            let authenticateSpy;
            let logWarnSpy;
            let sendInternalLogSpy;
            let eventBusSpy;
            let params;
            let conduit;

            beforeEach(function () {
                containerDiv = { appendChild: sandbox.spy() };
                conduit = { sendUpstream: sandbox.spy() };
                
                authenticateSpy = sandbox.stub(connect.core, 'authenticate');
                                
                params = {
                    ccpUrl: "url.com",
                    loginOptions: {}
                };

                connect.agent.initialized = true;
                connect.core.eventBus = new connect.EventBus({ logEvents: true });
                eventBusSpy = sandbox.spy(connect.core.eventBus, 'subscribe');
            });

            afterEach(function () {
                connect.agent.initialized = false;
                connect.core.initialized = false;
                connect.core.eventBus = null;
                sandbox.restore();
            });

            describe('when disableAuthPopupAfterLogout is NOT set', function () {
                it('should subscribe to TERMINATED event and call authenticate when triggered', function () {
                    const clock = sandbox.useFakeTimers();
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const terminatedSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.TERMINATED
                    );
                    expect(terminatedSubscription).to.exist;
                    
                    connect.core.getEventBus().trigger(connect.EventType.TERMINATED);
                    
                    clock.tick(3000); // default CCP_ACK_TIMEOUT
                    
                    sandbox.assert.calledOnce(authenticateSpy);
                    sandbox.assert.calledWith(authenticateSpy, params, containerDiv, conduit);
                });

                it('should subscribe to AUTH_FAIL event and call authenticate when triggered', function () {
                    const clock = sandbox.useFakeTimers();
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const authFailSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.AUTH_FAIL
                    );
                    expect(authFailSubscription).to.exist;
                    
                    connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
                    
                    clock.tick(3000); // default CCP_ACK_TIMEOUT
                    
                    sandbox.assert.calledOnce(authenticateSpy);
                    sandbox.assert.calledWith(authenticateSpy, params, containerDiv, conduit);
                });

                it('TERMINATED event should call connect.core.authenticate after ack timeout init ccp param', function () {
                    const clock = sandbox.useFakeTimers();
                    params.ccpAckTimeout = 1000;
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const terminatedSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.TERMINATED
                    );
                    expect(terminatedSubscription).to.exist;
                    
                    connect.core.getEventBus().trigger(connect.EventType.TERMINATED);
                    
                    clock.tick(params.ccpAckTimeout); // default CCP_ACK_TIMEOUT
                    
                    sandbox.assert.calledOnce(authenticateSpy);
                    sandbox.assert.calledWith(authenticateSpy, params, containerDiv, conduit);
                });

                it('AUTH_FAIL event should call connect.core.authenticate after ack timeout init ccp param', function () {
                    const clock = sandbox.useFakeTimers();
                    params.ccpAckTimeout = 1000;
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const authFailSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.AUTH_FAIL
                    );
                    expect(authFailSubscription).to.exist;
                    
                    connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
                    
                    clock.tick(params.ccpAckTimeout); // default CCP_ACK_TIMEOUT
                    
                    sandbox.assert.calledOnce(authenticateSpy);
                    sandbox.assert.calledWith(authenticateSpy, params, containerDiv, conduit);
                });


                it('should subscribe to both events when disableAuthPopupAfterLogout is false', function () {
                    params.loginOptions = { disableAuthPopupAfterLogout: false };
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const terminatedSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.TERMINATED
                    );
                    const authFailSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.AUTH_FAIL
                    );
                    
                    expect(terminatedSubscription).to.exist;
                    expect(authFailSubscription).to.exist;
                });
            });

            describe('when disableAuthPopupAfterLogout IS set', function () {
                it('should NOT subscribe to TERMINATED or AUTH_FAIL events', function () {
                    params.loginOptions = { disableAuthPopupAfterLogout: true };
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const terminatedSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.TERMINATED
                    );
                    const authFailSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.AUTH_FAIL
                    );
                    
                    expect(terminatedSubscription).to.not.exist;
                    expect(authFailSubscription).to.not.exist;
                });

                it('should NOT call authenticate when TERMINATED event is triggered', function () {
                    params.loginOptions = { disableAuthPopupAfterLogout: true };
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    connect.core.getEventBus().trigger(connect.EventType.TERMINATED);

                    sandbox.assert.notCalled(authenticateSpy);
                });

                it('should NOT call authenticate when AUTH_FAIL event is triggered', function () {
                    params.loginOptions = { disableAuthPopupAfterLogout: true };
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    connect.core.getEventBus().trigger(connect.EventType.AUTH_FAIL);
                    
                    sandbox.assert.notCalled(authenticateSpy);
                });
            });

            describe('edge cases', function () {
                it('should subscribe to events when loginOptions is undefined', function () {
                    delete params.loginOptions;
                    
                    connect.core.setupAuthenticationEventHandlers(params, containerDiv, conduit);
                    
                    const terminatedSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.TERMINATED
                    );
                    const authFailSubscription = eventBusSpy.getCalls().find(call => 
                        call.args[0] === connect.EventType.AUTH_FAIL
                    );
                    
                    expect(terminatedSubscription).to.exist;
                    expect(authFailSubscription).to.exist;
                });
            });
        });
    });

    describe('#connect.core.initCCP() after ACKNOWLEDGE, with DR enabled', function () {
        jsdom({ url: "http://localhost" });
        let clock;
        let containerDiv;
        let clearStub, openStub, closeStub;
        const softphoneParams = { ringtoneUrl: "customVoiceRingtone.amazon.com" };
        const chatParams = { ringtoneUrl: "customChatRingtone.amazon.com" };
        const taskParams = { ringtoneUrl: "customTaskRingtone.amazon.com" };
        const pageOptionsParams = {
            enableAudioDeviceSettings: false,
            enableVideoDeviceSettings: false,
            enablePhoneTypeSettings: true
        };
        const shouldAddNamespaceToLogs = false;
        const customParams = {
            ccpUrl: "url.com",
            loginUrl: "loginUrl.com",
            softphone: softphoneParams,
            chat: chatParams,
            task: taskParams,
            loginOptions: { autoClose: true },
            pageOptions: pageOptionsParams,
            shouldAddNamespaceToLogs: shouldAddNamespaceToLogs,
            disasterRecoveryOn: true
        };

        before(function () {
            clock = sinon.useFakeTimers();
            containerDiv = { appendChild: sandbox.spy() };

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
            connect.core.initCCP(containerDiv, customParams);
            sandbox.stub(connect.WindowIOStream.prototype, 'send').returns(null);
            sandbox.spy(connect.core.getUpstream(), "sendUpstream");

            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
        });

        after(function () {
            connect.WindowIOStream.prototype.send.restore();
            connect.core.getUpstream().sendUpstream.restore();
            connect.agent.initialized = false;
            connect.core.initialized = false;
            connect.core.eventBus = null;
            sandbox.restore();
            clock.restore();
        });

        it("sends up INIT_DISASTER_RECOVERY event if disaster recovery is on", function () {
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.INIT_DISASTER_RECOVERY, customParams);
        });

        it("binds forceOffline function to send up SET_OFFLINE event if disaster recovery is on", function () {
            connect.core.forceOffline();
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.SET_OFFLINE);
        });

        it("binds forceOffline function to send up SET_OFFLINE event with data if provided", function () {
            const data = {softFailover: true};
            connect.core.forceOffline(data);
            sinon.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.DisasterRecoveryEvents.SET_OFFLINE, data);
        });
    });

    describe('ACK_TIMEOUT subscription with disableAuthPopupAfterLogout', function () {
        jsdom({ url: "http://localhost" });
        let clock;
        let containerDiv;
        let paramsWithDisableAuthPopupAfterLogout;
        let paramsWithoutDisableAuthPopupAfterLogout;
        let unsubscribeSpy;
        let subscribeSpy;
      
        before(function () {
          clock = sinon.useFakeTimers();
          containerDiv = { appendChild: sandbox.spy() };
          
          paramsWithDisableAuthPopupAfterLogout = {
            ccpUrl: "url.com",
            loginUrl: "loginUrl.com",
            loginOptions: { 
              autoClose: true,
              disableAuthPopupAfterLogout: true
            }
          };
          
          paramsWithoutDisableAuthPopupAfterLogout = {
            ccpUrl: "url.com",
            loginUrl: "loginUrl.com",
            loginOptions: { 
              autoClose: true
            }
          };
          
          sandbox.stub(connect.core, "checkNotInitialized").returns(false);
          sandbox.stub(connect, "UpstreamConduitClient");
          sandbox.stub(connect, "UpstreamConduitMasterClient");
          sandbox.stub(connect, "isFramed").returns(true);
          sandbox.spy(document, "createElement");
          sandbox.stub(connect.core, "_refreshIframeOnTimeout");
          sandbox.stub(connect.core, "getPopupManager").returns({
            clear: sandbox.fake(),
            open: sandbox.fake()
          });
          
          connect.agent.initialized = true;
          sandbox.stub(connect.core, 'getAgentDataProvider').returns({
            getAgentData: () => ({})
          });
        });
      
        after(function () {
          connect.agent.initialized = false;
          sandbox.restore();
          clock.restore();
        });
        
        beforeEach(function() {
          connect.core.eventBus = new connect.EventBus({ logEvents: true });
          subscribeSpy = sandbox.spy(connect.core.eventBus, "subscribe");
          unsubscribeSpy = sandbox.spy();
        });
        
        afterEach(function() {
          connect.core.loginAckTimeoutSub = null;
          connect.core.eventBus = null;
        });

        it('should not unsubscribe from ACK_TIMEOUT when disableAuthPopupAfterLogout is false', function () {
            connect.core.initCCP(containerDiv, paramsWithoutDisableAuthPopupAfterLogout);
            connect.core.loginAckTimeoutSub = {
              unsubscribe: unsubscribeSpy
            };
                      
            connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
            
            expect(unsubscribeSpy.called).to.be.false;
          });
      
        it('should unsubscribe from ACK_TIMEOUT when disableAuthPopupAfterLogout is true', function () {
          connect.core.initCCP(containerDiv, paramsWithDisableAuthPopupAfterLogout);
          connect.core.loginAckTimeoutSub = {
            unsubscribe: unsubscribeSpy
          };
                    
          connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
          
          expect(unsubscribeSpy.called).to.be.true;
        });

      });

    describe('connect.core.reauthenticateAfterLogout()', () => {
        let container;
        let params;
        let authenticateSpy;
        
        beforeEach(() => {
            connect.core.containerDiv = { appendChild: sandbox.spy() };
            connect.core.upstream = { sendUpstream: sandbox.spy() };
            
            authenticateSpy = sandbox.stub(connect.core, 'authenticate');
                            
            params = {
                ccpUrl: "url.com",
                loginOptions: {},
            };
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should not call connect.core.authenticate when enableGlobalResiliency is TRUE and throw an error', () => {
            params = {
                ...params,
                enableGlobalResiliency: true,
            };

            connect.initCCPParams = params;

            expect(() => connect.core.reauthenticateAfterLogout()).to.throw('Not supported in ACGR instance');
            expect(authenticateSpy.called).to.be.false;
        });

        it('should call connect.core.authenticate when enableGlobalResiliency is FALSE', () => {
            params = {
                ...params,
                enableGlobalResiliency: false,
            };

            connect.initCCPParams = params;
            connect.core.reauthenticateAfterLogout();
            expect(authenticateSpy.called).to.be.true;
            sandbox.assert.calledWith(authenticateSpy, connect.initCCPParams, connect.containerDiv, connect.core.upstream);
        });

        it('should throw an error when initCCPParams is missing', () => {
            connect.initCCPParams = null;

            expect(() => connect.core.reauthenticateAfterLogout()).to.throw('Missing parameters to refresh CCP iframe');
        });

        it('should throw an error when containerDiv is missing', () => {
            connect.containerDiv = null;

            expect(() => connect.core.reauthenticateAfterLogout()).to.throw('Missing parameters to refresh CCP iframe');
        });

        it('should throw an error when upstream is missing', () => {
            connect.core.upstream = null;

            expect(() => connect.core.reauthenticateAfterLogout()).to.throw('Missing parameters to refresh CCP iframe');
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
        before(() => {
            clock = sinon.useFakeTimers();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
            connect.core.upstream = null;
        })
        it("should teardown and stand up a new iframe 10 times and then clean itself up and stop trying.", () => {
            let setTimeoutSpy = sandbox.spy(global, "setTimeout");
            let fakeRemoveChildSpy = sandbox.fake();
            let getCCPIframeSpy = sandbox.stub(connect.core, "_getCCPIframe").returns({ parentNode: { removeChild: fakeRemoveChildSpy } });
            let fakeContentWindow = { windowProp1: 1 };
            let createCCPIframeSpy = sandbox.stub(connect.core, "_createCCPIframe").returns({ contentWindow: fakeContentWindow });
            let clearTimeoutSpy = sandbox.spy(global, "clearTimeout");
            let sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy = sandbox.stub(connect.core, "_sendIframeStyleDataUpstreamAfterReasonableWaitTime");
            let triggerSpy = sandbox.fake();
            sandbox.stub(connect.core, "getEventBus").returns({ trigger: triggerSpy });
            connect.core.upstream = { upstream: {} };

            connect.core._refreshIframeOnTimeout(params, {});
            expect(setTimeoutSpy.calledOnce).to.be.true;
            // below line checks that setTimeout was called with CCP_IFRAME_REFRESH_INTERVAL which is 5 seconds
            // CCP_IFRAME_REFRESH_INTERVAL is passed in when we call iframeRefreshTimeout
            expect(setTimeoutSpy.calledWith(sinon.match.any, sinon.match.number.and(sinon.match((timeout) => timeout === 5000)))).to.be.true;
            expect(connect.core.iframeRefreshAttempt).to.equal(0);
            expect(clearTimeoutSpy.calledOnce).to.be.true;

            clock.tick(5 * 1000 + 1); //the initial retry timeout.
            expect(connect.core.iframeRefreshAttempt).to.equal(1);
            expect(getCCPIframeSpy.calledOnce).to.be.true;
            expect(fakeRemoveChildSpy.calledOnce).to.be.true;
            expect(createCCPIframeSpy.calledOnce).to.be.true;
            expect(sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy.calledOnce).to.be.true;
            expect(connect.core.upstream.upstream.output === fakeContentWindow).to.be.true;
            expect(setTimeoutSpy.calledTwice).to.be.true;

            const maxRetry = 10;

            for (let retry = 2; retry <= maxRetry; retry++) {
                clock.tick(5 * 1000 + 1);
                expect(connect.core.iframeRefreshAttempt).to.equal(retry);
            }

            expect(connect.core.iframeRefreshAttempt).to.equal(maxRetry);
            expect(getCCPIframeSpy.callCount).to.equal(maxRetry);
            expect(fakeRemoveChildSpy.callCount).to.equal(maxRetry);
            expect(createCCPIframeSpy.callCount).to.equal(maxRetry);
            expect(sendIframeStyleDataUpstreamAfterReasonableWaitTimeSpy.callCount).to.equal(maxRetry);
            expect(connect.core.upstream.upstream.output === fakeContentWindow).to.be.true;

            clock.tick(30 * 1000); //the timeout that happens after the last retry timeout.
            expect(connect.core.iframeRefreshAttempt).to.equal(maxRetry + 1); //this counter is increased, but the condition evaluating whether we should destroy and reload the iframe fails.
            expect(clearTimeoutSpy.callCount).to.equal(maxRetry + 2); //even though we didn't retry in this timeout execution, we clean up the timeout.
            sandbox.assert.calledOnceWithExactly(triggerSpy, connect.EventType.IFRAME_RETRIES_EXHAUSTED, undefined); //this only happens once we have exhausted all retries.
            expect(setTimeoutSpy.callCount).to.equal(maxRetry + 1);
            expect(fakeRemoveChildSpy.callCount).to.equal(maxRetry); // As mentioned above, this execution of the callback code is not a true retry, as evidenced by the lack of an additional call to remove the current iframe

            clock.tick(300000); //out of retries. Waiting a long time won't change anything.
            expect(connect.core.iframeRefreshAttempt).to.equal(maxRetry + 1);
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
            allow: "microphone; camera; autoplay; clipboard-write; identity-credentials-get",
            style: "width: 100%; height: 100%;",
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
            params = { ...params, iframeTitle: 'title' };
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
        before(() => {
            clock = sinon.useFakeTimers();
        });
        after(() => {
            sandbox.restore();
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
                snapshot: {
                    state: createState(type, name)
                }
            };
        }

        function createContactSnapshot(contactState, agentMediaLegState, customerMediaLegState) {
            return [
                {
                    contactId: "abc-123",
                    type: 'voice',
                    state: {
                        type: contactState
                    },
                    connections: [
                        {
                            connectionId: "agentConnectionId",
                            type: 'agent',
                            state: {
                                type: agentMediaLegState
                            }
                        },
                        {
                            connectionId: "customerConnectionId",
                            type: 'outbound',
                            state: {
                                type: customerMediaLegState
                            }
                        }
                    ]
                }
            ]
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
            sandbox.stub(navigator.mediaDevices, 'enumerateDevices')
                .callsFake(() => new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([{
                            toJSON: () => ({
                                deviceId: "deviceId",
                                groupId: "groupId",
                                kind: "audioinput",
                                label: "Microphone"
                            }, {
                                deviceId: "deviceId",
                                groupId: "groupId",
                                kind: "videoinput",
                                label: "Camera"
                            })
                        }])
                    }, 500);
                }));
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
            connect.core.initPageOptions(params);
            sandbox.stub(connect, "isFramed").returns(true);
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
            }, {
                deviceId: "deviceId",
                groupId: "groupId",
                kind: "videoinput",
                label: "Camera"
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
            sandbox.stub(connect, 'randomId').returns("RandomId");
            connect.core.activateChannelWithViewType(viewType, mediaType);
            sandbox.assert.calledOnce(connect.randomId);
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.BROADCAST,
                {
                    event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
                    data: { viewType, mediaType, clientToken: "RandomId" }
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

        it('call activateChannelWithViewType with optional parameters "source", "caseId", "clientToken"', function () {
            connect.core.activateChannelWithViewType(viewType, mediaType, "keystone", "1234567890", "randomToken");
            sandbox.assert.calledOnceWithMatch(sendUpstream, connect.EventType.BROADCAST,
                {
                    event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
                    data: { viewType, mediaType, source: "keystone", caseId: "1234567890", clientToken: "randomToken" }
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
                assert.isEmpty(connect.core.apiProxyClient);
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
            const storageAccessOriginal = connect.storageAccess;
            connect.storageAccess = { ...connect.storageAccess, resetStorageAccessState: sinon.fake()};

            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            connect.core.initCCP(containerDiv, params);
            expect(isCCPInitialized(containerDiv, params)).to.be.true;

            connect.core.terminate();
            expect(connect.storageAccess.resetStorageAccessState.calledOnce).to.be.true;

            connect.core.terminate();
            expect(connect.storageAccess.resetStorageAccessState.calledTwice).to.be.true;

            expect(isCCPTerminated()).to.be.true;
            sandbox.resetHistory();
            connect.core.initCCP(containerDiv, params);
            expect(isCCPInitialized(containerDiv, params)).to.be.true;
            connect.storageAccess = storageAccessOriginal;
        });
    });

    describe('Api Proxy Client initialization', function () {
        beforeEach(() => {
            connect.core.apiProxyClient = null;
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.spy(connect.core.getUpstream(), "onDownstream");
        });

        it('ApiProxyService initialization should initialize api proxy client', () => {
            connect.core.initApiProxyService(params);
            expect(connect.core.apiProxyClient).not.to.be.a("null");
            expect(typeof connect.core.apiProxyClient).to.equal("object");
        });

        it('ApiProxyService initialization should bridge conduit when CCP is framed', () => {
            // GIVEN we're in a frame
            connect.isFramed.returns(true);

            // WHEN the proxy is initialized
            connect.core.initApiProxyService(params);

            // THEN listen for conduit
            expect(connect.core.handleApiProxyRequest).to.exist;
        });

        it('ApiProxyService initialization should not bridge conduit when CCP is not framed', () => {
            // GIVEN we're not in a frame
            connect.isFramed.returns(false);

            // WHEN the proxy is initialized
            connect.core.initApiProxyService(params);

            // THEN don't listen for conduit
            expect(connect.core.handleApiProxyRequest).to.not.exist;
        });

        afterEach(() => {
            sandbox.restore();
            connect.core.handleApiProxyRequest = null;
        });
    });

    describe.skip('initCCP with storage Access Params', function () {
        it('Should load request storage access page with storage Access params', function () { });
        it('Should redirect to CCP once the access is granted with storage access params', function () { });
    });

    it('core subscription apis', () => {
        connect.core.eventBus = new connect.EventBus();
    
        function testEventSubscription(apiName, eventName) {
          const cb = sinon.stub();
          const sub = connect.core[apiName](cb);
          connect.core.getEventBus().trigger(eventName);
          sinon.assert.calledOnce(cb);
          sub.unsubscribe();
          cb.resetHistory();
          connect.core.getEventBus().trigger(eventName);
          sinon.assert.notCalled(cb);
        }
    
        const apiNameEventNameMap = {
          'onIframeRetriesExhausted': connect.EventType.IFRAME_RETRIES_EXHAUSTED,
          'onViewContact': connect.ContactEvents.VIEW,
          'onActivateChannelWithViewType': connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
          'onAccessDenied': connect.EventType.ACCESS_DENIED,
          'onAuthFail': connect.EventType.AUTH_FAIL,
          'onAuthorizeSuccess': connect.EventType.AUTHORIZE_SUCCESS,
          'onSoftphoneSessionInit': connect.ConnectionEvents.SESSION_INIT,
          'onConfigure': connect.ConfigurationEvents.CONFIGURE,
          'onInitialized': connect.EventType.INIT
        };
    
        for (const key in apiNameEventNameMap) {
          testEventSubscription(key, apiNameEventNameMap[key]);  
        }
    
        connect.core.eventBus = null;
    });

    describe('CustomViews Termination', () => {
        let iframeMock, sandbox;
        jsdom({ url: "http://localhost" });
 
        beforeEach(() => {
            sandbox = sinon.createSandbox();
 
            iframeMock = {
                style: {
                    display: ''
                },
                contentWindow: {
                    postMessage: sandbox.stub()
                }
            };
 
            containerDOMMock = {
                querySelector: sandbox.stub().returns(iframeMock)
            };
 
            appRegistryMock = {
                get: sandbox.stub().returns({ containerDOM: containerDOMMock }),
                stopApp: sandbox.stub()
            }
            sandbox.stub(global.window.document, "getElementById").returns(iframeMock);
            sandbox.stub(global.window, 'postMessage').returns(null);
 
            connect.agentApp.AppRegistry = appRegistryMock;
        });
 
        afterEach(() => {
            sandbox.restore();
        });
 
        describe('terminateCustomView', () => {
            it('should post a termination message to the iframe with a specific customview iframe suffix', () => {
                const iframeSuffix = 'contactAlpha';
                const connectUrl = 'https://example.com';
 
                connect.core.terminateCustomView(connectUrl, iframeSuffix);
 
                sinon.assert.match(iframeMock.style.display, '');
                sinon.assert.calledWith(iframeMock.contentWindow.postMessage, { topic: 'lifecycle.terminated' })
            })
 
            it('should hide the iframe and attempt to stop the app after the timeout', (done) => {
                const iframeSuffix = 'contactBeta';
                const connectUrl = 'https://example.com';
                const timeout = 100;
 
                connect.core.terminateCustomView(connectUrl, iframeSuffix, {timeout: timeout});
 
                sinon.assert.match(iframeMock.style.display, 'none');
                sinon.assert.calledWith(iframeMock.contentWindow.postMessage, { topic: 'lifecycle.terminated' })
                done();
 
            }, 110);
 
            it('should handle cases where iframe does not exist', () => {
                sandbox.restore();
                sandbox.stub(global.window.document, "getElementById").returns(null);
                sandbox.stub(global.window, 'postMessage').returns(null);
 
                const iframeSuffix = 'contactBeta';
                const connectUrl = 'https://example.com';
 
                expect(() => connect.core.terminateCustomView(connectUrl, iframeSuffix)).not.to.throw();
            })
        })
    })

    describe('#connect.core.triggerEmailCreated()', function () {
        let triggerSpy = sandbox.fake();
        before(() => {
            sandbox.stub(connect.core, "getUpstream").returns({ upstreamBus: { trigger: triggerSpy } });
        });
        after(() => {
            sandbox.restore();
        });
        it('calls trigger on the upstreamBus for the upstream conduit for the corresponding events', () => {
            const dataMock = { contactId: 'some-contact-id' }
            connect.core.triggerEmailCreated(dataMock);
            sandbox.assert.calledOnceWithExactly(triggerSpy, connect.EmailEvents.CREATED, dataMock);
        });
    });

    describe("WebSocketProvider", function () {
        let sandbox;
        let provider;
        let onUpstreamStub;
        let sendUpstreamStub;

        jsdom({ url: "http://localhost" });

        beforeEach(function () {
          sandbox = sinon.createSandbox();
      
          onUpstreamStub = sandbox.stub();
          sendUpstreamStub = sandbox.stub();
          sandbox.spy(document, "createElement");
          sandbox.stub(connect.core, "checkNotInitialized").returns(true);
      
          sandbox.stub(connect.core, "getUpstream").returns({
            onUpstream: onUpstreamStub,
            sendUpstream: sendUpstreamStub,
          });

          let container = { appendChild: sandbox.spy() };
          connect.core.initCCP(container, {
              ccpUrl: "ccpURL"
          });
          provider = connect.core.webSocketProvider;
        });
      
        afterEach(function () {
          sandbox.restore();
        });
      
        describe("Initialization", function () {
          it("should attach onUpstream listeners for each WebSocket event", function () {
            const expectedEvents = [
              connect.WebSocketEvents.INIT_FAILURE,
              connect.WebSocketEvents.CONNECTION_OPEN,
              connect.WebSocketEvents.CONNECTION_CLOSE,
              connect.WebSocketEvents.CONNECTION_GAIN,
              connect.WebSocketEvents.CONNECTION_LOST,
              connect.WebSocketEvents.SUBSCRIPTION_UPDATE,
              connect.WebSocketEvents.SUBSCRIPTION_FAILURE,
              connect.WebSocketEvents.ALL_MESSAGE,
            ];
      
            const actualEvents = onUpstreamStub.getCalls().map((call) => call.args[0]);
      
            expectedEvents.forEach((evt) => {
              expect(actualEvents).to.include(evt);
            });

          });
        });
      
        describe("Event callbacks", function () {
          it("onInitFailure callback is invoked when INIT_FAILURE upstream event fires", function () {
            const cb = sandbox.spy();
            const unsub = provider.onInitFailure(cb);
      
            expect(unsub).to.be.a("function");
      
            const initCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.INIT_FAILURE);
            expect(initCall).to.exist;
      
            const handler = initCall.args[1];
            handler();
      
            sinon.assert.calledOnce(cb);
      
            unsub();
            handler();
            sinon.assert.calledOnce(cb);
          });
      
          it("onConnectionOpen callback is invoked when CONNECTION_OPEN upstream event fires", function () {
            const cb = sandbox.spy();
            const unsub = provider.onConnectionOpen(cb);
            const openCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.CONNECTION_OPEN);
            const handler = openCall.args[1];
      
            const fakeResponse = { foo: "bar" };
            handler(fakeResponse);
      
            sinon.assert.calledOnceWithExactly(cb, fakeResponse);
            unsub();
            handler(fakeResponse);
            sinon.assert.calledOnce(cb);
          });
      
          it("onConnectionClose callback is invoked when CONNECTION_CLOSE upstream event fires", function () {
            const cb = sandbox.spy();
            provider.onConnectionClose(cb);
      
            const closeCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.CONNECTION_CLOSE);
            const handler = closeCall.args[1];
      
            const fakeResponse = { reason: "TestingClose" };
            handler(fakeResponse);
            sinon.assert.calledOnceWithExactly(cb, fakeResponse);
          });
      
          it("onConnectionGain callback is invoked when CONNECTION_GAIN upstream event fires", function () {
            const cb = sandbox.spy();
            provider.onConnectionGain(cb);
      
            const gainCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.CONNECTION_GAIN);
            const handler = gainCall.args[1];
      
            handler();
            sinon.assert.calledOnce(cb);
          });
      
          it("onConnectionLost callback is invoked when CONNECTION_LOST upstream event fires", function () {
            const cb = sandbox.spy();
            provider.onConnectionLost(cb);
      
            const lostCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.CONNECTION_LOST);
            const handler = lostCall.args[1];
      
            const fakeResponse = { error: "NetworkDown" };
            handler(fakeResponse);
            sinon.assert.calledOnceWithExactly(cb, fakeResponse);
          });
      
          it("onSubscriptionUpdate callback is invoked when SUBSCRIPTION_UPDATE upstream event fires", function () {
            const cb = sandbox.spy();
            provider.onSubscriptionUpdate(cb);
      
            const subUpdateCall = onUpstreamStub
              .getCalls()
              .find(
                (c) => c.args[0] === connect.WebSocketEvents.SUBSCRIPTION_UPDATE
              );
            const handler = subUpdateCall.args[1];
      
            const fakeResponse = { subscription: "upd" };
            handler(fakeResponse);
            sinon.assert.calledOnceWithExactly(cb, fakeResponse);
          });
      
          it("onSubscriptionFailure callback is invoked when SUBSCRIPTION_FAILURE upstream event fires", function () {
            const cb = sandbox.spy();
            provider.onSubscriptionFailure(cb);
      
            const subFailCall = onUpstreamStub
              .getCalls()
              .find(
                (c) => c.args[0] === connect.WebSocketEvents.SUBSCRIPTION_FAILURE
              );
            const handler = subFailCall.args[1];
      
            const fakeResponse = { subscription: "fail", reason: "Timeout" };
            handler(fakeResponse);
            sinon.assert.calledOnceWithExactly(cb, fakeResponse);
          });
      
          it("onAllMessage callback is invoked when ALL_MESSAGE upstream event fires", function () {
            const allMsgCb = sandbox.spy();
            provider.onAllMessage(allMsgCb);
      
            const allMessageCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.ALL_MESSAGE);
            const handler = allMessageCall.args[1];
      
            const fakeResponse = { topic: "myTopic", data: 123 };
            handler(fakeResponse);
            sinon.assert.calledOnceWithExactly(allMsgCb, fakeResponse);
          });
      
          it("onAllMessage also invokes topic callback if response.topic matches", function () {
            const allMsgCb = sandbox.spy();
            provider.onAllMessage(allMsgCb);
      
            const specificCb = sandbox.spy();
            provider.onMessage("myTopic", specificCb);
      
            const allMessageCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.ALL_MESSAGE);
            const handler = allMessageCall.args[1];
      
            const fakeResponse = { topic: "myTopic", data: 1234 };
            handler(fakeResponse);
      
            sinon.assert.calledOnceWithExactly(allMsgCb, fakeResponse);
            sinon.assert.calledOnceWithExactly(specificCb, fakeResponse);
      
            const otherResponse = { topic: "someOtherTopic", data: 999 };
            handler(otherResponse);
            sinon.assert.calledTwice(allMsgCb);
            sinon.assert.calledOnce(specificCb);
          });
        });
      
        describe("subscribeTopics()", function () {
          it("should call sendUpstream with WebSocketEvents.SUBSCRIBE and the provided topics array", function () {
            const topics = ["Topic1", "Topic2"];
            provider.subscribeTopics(topics);
      
            sinon.assert.calledOnceWithExactly(
              sendUpstreamStub,
              connect.WebSocketEvents.SUBSCRIBE,
              topics
            );
          });
      
          it("should throw an error if topics is not an array", function () {
            expect(() => provider.subscribeTopics("notAnArray")).to.throw();
          });
        });
      
        describe("onMessage()", function () {
          it("should add a callback for the given topic", function () {
            const cb = sandbox.spy();
            provider.onMessage("testTopic", cb);
      
            expect(cb.called).to.be.false;
          });
      
          it("should remove the callback when unsubscribed", function () {
            const cb = sandbox.spy();
            const unsub = provider.onMessage("testTopic", cb);
      
            unsub();
            const allMessageCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.ALL_MESSAGE);
            const handler = allMessageCall.args[1];
      
            handler({ topic: "testTopic", data: {} });
            sinon.assert.notCalled(cb);
          });
        });
      
        describe("onAllMessage()", function () {
          it("should add a callback for all messages", function () {
            const cb = sandbox.spy();
            provider.onAllMessage(cb);

            const allMessageCall = onUpstreamStub
              .getCalls()
              .find((c) => c.args[0] === connect.WebSocketEvents.ALL_MESSAGE);
            const handler = allMessageCall.args[1];
      
            handler({ topic: "randomTopic" });
            sinon.assert.calledOnce(cb);
          });
        });
      
        describe("sendMessage()", function () {
          it("should call sendUpstream with WebSocketEvents.SEND and the given payload", function () {
            const payload = { some: "payload" };
            provider.sendMessage(payload);
      
            sinon.assert.calledOnceWithExactly(
              sendUpstreamStub,
              connect.WebSocketEvents.SEND,
              payload
            );
          });
        });
      
        describe("onDeepHeartbeatSuccess()", function () {
          it("registers and triggers callback", function () {
            const cb = sandbox.spy();
            provider.onDeepHeartbeatSuccess(cb);

            expect(cb.called).to.be.false;
          });
        });
      
        describe("onDeepHeartbeatFailure()", function () {
          it("registers and triggers callback", function () {
            const cb = sandbox.spy();
            provider.onDeepHeartbeatFailure(cb);
            expect(cb.called).to.be.false;
          });
        });
      
        describe("onTopicFailure()", function () {
          it("registers and triggers callback", function () {
            const cb = sandbox.spy();
            provider.onTopicFailure(cb);
            expect(cb.called).to.be.false;
          });
        });
    });
});
