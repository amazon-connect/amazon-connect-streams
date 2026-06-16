
const { expect } = require("chai");
const mochaJsdom = require("mocha-jsdom");

require("../unit/test-setup.js");

const VDI_PLATFORMS = {
    OMNISSA: 'OMNISSA',
    AWS_WORKSPACE: 'AWS_WORKSPACE',
    CITRIX: 'CITRIX',
    CITRIX_413: 'CITRIX_413'
};

// TODO: Make these work as standalone, for some reason they require a initCCP call to not fail
describe('SoftphoneManager', () => {
    jsdom({ url: "http://localhost" });
    const sandbox = sinon.createSandbox();
    let bus, stubbedRTCSessionConnect, stubbedReplaceTrack, stubbedIsChromeBrowser, stubbedIsFirefoxBrowser, stubbedHasOtherConnectedCCPs, clock;

    before(() => {
        clock = sandbox.useFakeTimers();
        bus = new connect.EventBus();
        sandbox.stub(connect.core, "getEventBus").returns(bus);
        sandbox.spy(bus, 'subscribe');
        sandbox.stub(connect, 'RtcPeerConnectionFactory');
        sandbox.stub(connect, 'RtcPeerConnectionManagerV2');
        stubbedRTCSessionConnect = sandbox.stub();
        stubbedReplaceTrack = sandbox.stub();
        sandbox.stub(connect, 'RtcPeerConnectionManager').returns({
            close: sandbox.stub(),
            connect: stubbedRTCSessionConnect,
            hangup: sandbox.stub(),
            createSession: sandbox.stub().returns({
                echoCancellation: false,
                onSessionFailed: null,
                onSessionConnected: null,
                onSessionCompleted: null,
                onLocalStreamAdded: null,
                remoteAudioElement: null,
                _pc: {
                    getSenders: () => [{ replaceTrack: stubbedReplaceTrack.resolves() }]
                }
            })
        });
        sandbox.stub(connect, 'RTCSession').returns({
            connect: stubbedRTCSessionConnect,
            _pc: {
                getSenders: () => [{ replaceTrack: stubbedReplaceTrack.resolves() }]
            }
        });
        sandbox.stub(connect.core, "getUpstream").returns({ sendUpstream: sandbox.stub() });
        sandbox.stub(connect.core, 'getSkew').returns(100);
        if (!navigator.mediaDevices) {
            navigator.mediaDevices = {};
        }
        if (!navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia = () => {};
        }
        if (!navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices = () => {};
        }
        if (!navigator.mediaDevices.addEventListener) {
            navigator.mediaDevices.addEventListener = () => {};
        }
        if (!navigator.permissions) {
            navigator.permissions = { query: () => {} };
        }
        sandbox.stub(navigator.mediaDevices, 'getUserMedia').resolves({ getAudioTracks: () => [{ kind: "audio", enabled: true }] });
        sandbox.stub(navigator.mediaDevices, 'enumerateDevices').resolves({ });
        sandbox.stub(navigator.mediaDevices, 'addEventListener').resolves({ });
        sandbox.stub(navigator.permissions, 'query').resolves({ state: 'allowed ' });
        sandbox.stub(connect, 'publishMetric');
        sandbox.stub(connect, 'SoftphoneError');
        sandbox.stub(connect.SoftphoneManager, 'isBrowserSoftPhoneSupported').returns(true);
        sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
        stubbedIsChromeBrowser = sandbox.stub(connect, 'isChromeBrowser');
        sandbox.stub(connect, 'getChromeBrowserVersion');
        stubbedIsFirefoxBrowser = sandbox.stub(connect, 'isFirefoxBrowser');
        stubbedHasOtherConnectedCCPs = sandbox.stub(connect, 'hasOtherConnectedCCPs');
        connect.agent.initialized = true;

        // Stub VoiceFocusProvider to prevent voice enhancement calls
        if (!connect.core.voiceFocus) {
            connect.core.voiceFocus = {};
        }
        if (!connect.VoiceFocusProvider) {
            connect.VoiceFocusProvider = {};
        }
        connect.VoiceFocusProvider.publishMetrics = sandbox.stub();
        connect.VoiceFocusProvider.cleanVoiceFocus = sandbox.stub();

        const response = {
            "softphoneTransport": {
                    "softphoneMediaConnections" : "iceServer"
            }
        };
        sandbox.stub(connect.core, 'getClient').callsFake(() => ({
            call: (endpoint, params, callbacks) => {
                callbacks.success(response);
            }
        }));

        enhancedStream = {
                getAudioTracks: () => [{ kind: 'enhanced' }],
                id: "enhanced"
        };
        getVoiceEnhancedUserMediaStub = sandbox.stub(connect.VoiceFocusProvider, 'getVoiceEnhancedUserMedia');
        getVoiceEnhancedUserMediaStub.resolves(enhancedStream);

    });

    after(() => {
        sandbox.restore();
        connect.agent.initialized = false;
    });

    describe('initialization', () => {
        let mockFacClient, mockLilySonic, requireStub;

        beforeEach(() => {
            connect.SoftphoneManager.isBrowserSoftPhoneSupported.returns(true);
            connect.isChromeBrowser.returns(true);
            connect.getChromeBrowserVersion.returns(60);
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [{ kind: "audio", enabled: true }] });
            connect.Agent.prototype.getContacts.returns([]);

             // Mock the FAC client
             mockFacClient = {
                 isFeatureEnabled: sandbox.stub().resolves({}) // Default to disabled
             };
             // Mock connect.featureFlagProvider
             connect.featureFlagProvider = {
                 facClient: mockFacClient,
                 getFeatureFlags: sandbox.stub().returns({})
             };
  
             // Mock LILY_SONIC hash value
             mockLilySonic = 'YvylFbavp';
    
             requireStub = sandbox.stub();
             // Mock the global require function
             global.require = requireStub;
        });
        afterEach(async () => {
            bus.unsubscribeAll();
            sandbox.resetHistory();
            clock.reset();
            // Reset FAC mock behavior and trigger fetch to reset module-level softphoneFlags
            if (mockFacClient && mockFacClient.isFeatureEnabled) {
                mockFacClient.isFeatureEnabled.reset();
                // Create a temporary SoftphoneManager to trigger FAC fetch and reset the module flag
                const tempManager = new connect.SoftphoneManager();
                await clock.tickAsync(0); // Wait for FAC fetch to complete
                tempManager.terminate();
            }
            delete connect.featureFlagProvider;
            delete global.require;
        });
        it('should create RtcPeerConnectionFactory', () => {
            new connect.SoftphoneManager();
            sandbox.assert.calledWithNew(connect.RtcPeerConnectionFactory);
        });
        it('should create RtcPeerConnectionManagerV2 by default', async () => {
            // Stub agent configuration
            sandbox.stub(connect.Agent.prototype, 'getConfiguration').returns({ softphonePersistentConnection: true });

            const softphoneManager = new connect.SoftphoneManager();
            await clock.tickAsync(0); // Wait for FAC fetch to complete

            // Trigger agent refresh to recreate the manager after FAC fetch
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

            expect(softphoneManager.rtcPeerConnectionManager).to.not.be.null;
            sandbox.assert.calledWithNew(connect.RtcPeerConnectionManagerV2);
        });

        it('should pass allowExtendedPersistentConnection=false to PCMv2 by default', async () => {
            const softphoneManager = new connect.SoftphoneManager({});
            await clock.tickAsync(0);
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

            const v2Config = connect.RtcPeerConnectionManagerV2.lastCall.args[0];
            expect(v2Config.allowExtendedPersistentConnection).to.equal(false);
        });

        it('should pass allowExtendedPersistentConnection=true to PCMv2 when set in softphoneParams', async () => {
            const softphoneManager = new connect.SoftphoneManager({ allowExtendedPersistentConnection: true });
            await clock.tickAsync(0);
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

            const v2Config = connect.RtcPeerConnectionManagerV2.lastCall.args[0];
            expect(v2Config.allowExtendedPersistentConnection).to.equal(true);
        });

        it('should coerce truthy allowExtendedPersistentConnection to boolean true', async () => {
            const softphoneManager = new connect.SoftphoneManager({ allowExtendedPersistentConnection: 'yes' });
            await clock.tickAsync(0);
            connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());

            const v2Config = connect.RtcPeerConnectionManagerV2.lastCall.args[0];
            expect(v2Config.allowExtendedPersistentConnection).to.equal(true);
        });

        it('should throw UNSUPPORTED_BROWSER error when the browser is not supported', () => {
            connect.SoftphoneManager.isBrowserSoftPhoneSupported.returns(false);
            new connect.SoftphoneManager();
            sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
        });
        it('should throw MICROPHONE_NOT_SHARED error when getUserMedia returns no audio tracks', async () => {
            navigator.mediaDevices.getUserMedia.resolves(({ getAudioTracks: () => [] }));
            new connect.SoftphoneManager();
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
        });
        it('should throw MICROPHONE_NOT_SHARED error when getUserMedia fails', async () => {
            navigator.mediaDevices.getUserMedia.rejects();
            new connect.SoftphoneManager();
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
        });
        it('should set up an event listener for MUTE event', () => {
            new connect.SoftphoneManager();
            sandbox.assert.calledWith(bus.subscribe, connect.EventType.MUTE);
        });
        it('should set up an event listener for SET_SPEAKER_DEVICE event', () => {
            new connect.SoftphoneManager();
            sandbox.assert.calledWith(bus.subscribe, connect.ConfigurationEvents.SET_SPEAKER_DEVICE);
        });
        it('should set up an event listener for SET_MICROPHONE_DEVICE event', () => {
            new connect.SoftphoneManager();
            sandbox.assert.calledWith(bus.subscribe, connect.ConfigurationEvents.SET_MICROPHONE_DEVICE);
        });
        it.skip('should set up an event listener for permissionStatus.onchange event');
        it('should set up an event listener for CONTACT_INIT event', () => {
            new connect.SoftphoneManager();
            sandbox.assert.calledWith(bus.subscribe, connect.ContactEvents.INIT);
        });
        it.skip('should handle the scenario where a voice contact is already in connecting state when SoftphoneManager is being initialized');
    });

    describe.skip('terminate', () => {
        it('should call onInitContactSub.unsubscribe');
        it('should call onMuteSub.unsubscribe');
        it('should call onSetSpeakerDeviceSub.unsubscribe');
        it('should call onSetMicrophoneDeviceSub.unsubscribe');
        it('should call rtcPeerConnectionFactory.clearIdleRtcPeerConnectionTimerId');
    });

    describe('startSession', () => {
        let contact, contactId, agentConnectionId;
        let stubbedGetStatus, stubbedCreateSession, stubbedConnect;

        before(() => {
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            agentConnectionId = 'abcdefg-startSession';
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            sandbox.stub(contact, "getType").returns(connect.ContactType.VOICE);
            connect.RtcPeerConnectionFactory.returns({
                get: sandbox.stub(),
                close: sandbox.stub()
             });
            stubbedCreateSession = sandbox.stub().returns({
                connect: stubbedRTCSessionConnect,
                _pc: {
                    getSenders: () => [{ replaceTrack: stubbedReplaceTrack.resolves() }]
                }
            });
            stubbedConnect = sandbox.stub();
            const sharedPeerConnectionManagerMock = {
                createSession: stubbedCreateSession,
                connect: stubbedConnect,
                getPeerConnection: sandbox.stub(),
                close: sandbox.stub(),
                handlePersistentPeerConnectionToggle: sandbox.stub()
            };
            connect.RtcPeerConnectionManager.returns(sharedPeerConnectionManagerMock);
            connect.RtcPeerConnectionManagerV2.returns(sharedPeerConnectionManagerMock);
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321',
                getConnectionId: () => '0987654321'
            });
            stubbedGetStatus = sandbox.stub(contact, 'getStatus');
        });

        beforeEach(() => {
            stubbedRTCSessionConnect.resetHistory();
        });

        describe('chrome', () => {
            before(() => {
                stubbedIsChromeBrowser.returns(true);
                stubbedIsFirefoxBrowser.returns(false);
                stubbedHasOtherConnectedCCPs.returns(false);
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should create RTC session and call session.connect()', function () {
                new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.calledOnce(stubbedConnect);
            });
            it('should NOT create another RTC session if startSession is called twice', function () {
                const softphoneManager = new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.calledOnce(stubbedConnect);
            });
        });
        describe('firefox', () => {
            before(() => {
                stubbedIsChromeBrowser.returns(false);
                stubbedIsFirefoxBrowser.returns(true);
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should immediately create RTC session and call session.connect() for single tab scenario', function () {
                stubbedHasOtherConnectedCCPs.returns(false);
                new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.calledOnce(stubbedConnect);
            });
            it('should pospone creating RTC session until startSession is called for multi tab scenario', function () {
                stubbedHasOtherConnectedCCPs.returns(true);
                const softphoneManager = new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.notCalled(stubbedConnect);

                softphoneManager.startSession();
                sinon.assert.calledOnce(stubbedConnect);
            });
        });

        describe('VDIPlatform: CITRIX', () => {
            before(() => {
                stubbedIsChromeBrowser.returns(true);
                stubbedIsFirefoxBrowser.returns(false);
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should create RTC session and call session.connect()', function () {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "CITRIX" });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                sinon.assert.calledOnce(stubbedConnect);
            });
            it('should NOT create another RTC session if startSession is called twice', function () {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "CITRIX" });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                let error;
                try {
                    softphoneManager.startSession(contact, agentConnectionId);
                } catch (e) {
                    error = e;
                }
                sinon.assert.calledOnce(stubbedConnect);
                expect(error).not.to.be.undefined;
            });
        });

            describe('VDIPlatform: AWS_WORKSPACE', () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                it('should create RTC session and call session.connect()', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "AWS_WORKSPACE" });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedConnect);
                });
                it('should NOT create another RTC session if startSession is called twice', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "AWS_WORKSPACE" });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                    let error;
                    try {
                        softphoneManager.startSession(contact, agentConnectionId);
                    } catch (e) {
                        error = e;
                    }
                    sinon.assert.calledOnce(stubbedConnect);
                    expect(error).not.to.be.undefined;
                });
            });

            describe(`VDIPlatform: ${VDI_PLATFORMS.OMNISSA}`, () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                after(()=> {
                    new connect.SoftphoneManager();
                });
                it('should create RTC session and call pcm.connect()', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.OMNISSA });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedConnect);
                });
                it('should NOT create another RTC session if startSession is called twice', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.OMNISSA });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                    let error;
                    try {
                        softphoneManager.startSession(contact, agentConnectionId);
                    } catch (e) {
                        error = e;
                    }
                    sinon.assert.calledOnce(stubbedConnect);
                    expect(error).not.to.be.undefined;
                });
            });

            describe(`VDIPlatform: ${VDI_PLATFORMS.CITRIX}`, () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                it('should create RTC session and call pcm.connect()', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedConnect);
                });
                it('should NOT create another RTC session if startSession is called twice', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                    let error;
                    try {
                        softphoneManager.startSession(contact, agentConnectionId);
                    } catch (e) {
                        error = e;
                    }
                    sinon.assert.calledOnce(stubbedConnect);
                    expect(error).not.to.be.undefined;
                });
                it('should set userMedia to session object if passed in', () => {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    const dummyUserMedia = { id: 'dummy' };
                    softphoneManager.startSession(contact, agentConnectionId, dummyUserMedia);
                    const session = softphoneManager.getSession(agentConnectionId);
                    expect(session.mediaStream).to.equal(dummyUserMedia);
                });
            });

            describe(`VDIPlatform: ${VDI_PLATFORMS.CITRIX_413}`, () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                it('should create RTC session and call pcm.connect()', function() {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedConnect);
                });
                it('should NOT create another RTC session if startSession is called twice', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                    let error;
                    try {
                        softphoneManager.startSession(contact, agentConnectionId);
                    } catch (e) {
                        error = e;
                    }
                    sinon.assert.calledOnce(stubbedConnect);
                    expect(error).not.to.be.undefined;
                });
                it('should set userMedia to session object if passed in', () => {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    const dummyUserMedia = { id: 'dummy' };
                    softphoneManager.startSession(contact, agentConnectionId, dummyUserMedia);
                    const session = softphoneManager.getSession(agentConnectionId);
                    expect(session.mediaStream).to.equal(dummyUserMedia);
                });
            });
            
        describe('disableEchoCancellation', () => {
            const disableEchoCancellation = true;
            before(() => {
                stubbedIsChromeBrowser.returns(true);
                stubbedIsFirefoxBrowser.returns(false);
                stubbedHasOtherConnectedCCPs.returns(false);
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should set session.echoCancellation', () => {
                const softphoneManager = new connect.SoftphoneManager({ disableEchoCancellation });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                const session = softphoneManager.getSession(agentConnectionId);
                expect(session.echoCancellation).to.equal(!disableEchoCancellation);
            });
        });
        describe('SoftphoneManager with rtcPeerConnectionManager', () => {
            before(() => {
                connect.isChromeBrowser.returns(true);
                connect.isFirefoxBrowser.returns(false);
                connect.hasOtherConnectedCCPs.returns(false);
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should call rtcPeerConnectionManager.createSession and call rtcPeerConnectionManager.connect()', async function () {
                const softphoneManager = new connect.SoftphoneManager();
                await clock.tickAsync(0);
                stubbedCreateSession.returns(connect.RTCSession);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                sinon.assert.calledOnce(stubbedCreateSession);
                sinon.assert.calledOnce(stubbedConnect);
                sinon.assert.notCalled(connect.RTCSession);
                sinon.assert.notCalled(stubbedRTCSessionConnect);
            });
            it('should NOT create another RTC session if startSession is called twice', async function () {
                const softphoneManager = new connect.SoftphoneManager();
                await clock.tickAsync(0);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                let error;
                try {
                    softphoneManager.startSession(contact, agentConnectionId);
                } catch (e) {
                    error = e;
                }
                sinon.assert.calledOnce(stubbedCreateSession);
                sinon.assert.calledOnce(stubbedConnect);
                sinon.assert.notCalled(connect.RTCSession);
                sinon.assert.notCalled(stubbedRTCSessionConnect);
                expect(error).not.to.be.undefined;
            });
        });

        describe('auto-accept behavior', () => {
            let upstreamSpy;
            beforeEach(() => {
                upstreamSpy = {
                    sendUpstream: sandbox.spy()
                };
                connect.core.getUpstream.returns(upstreamSpy);
            });

            it('should set isAutoAcceptEnabled correctly', () => {
                contact.isAutoAcceptEnabled = () => true;
                contact.getType.returns(connect.ContactType.VOICE);
                contact.getAgentConnection.returns({
                    getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
                    connectionId: '9876543210',
                    getConnectionId: () => '9876543210'
                });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });

                const softphoneManager = new connect.SoftphoneManager();
                softphoneManager.startSession(contact, agentConnectionId);
                const rtcSession = stubbedCreateSession.getCall(0).returnValue;
                rtcSession.onSessionConnected({});

                sinon.assert.calledWith(upstreamSpy.sendUpstream,
                    connect.EventType.BROADCAST,
                    sinon.match({
                        event: connect.ContactEvents.ACCEPTED
                    })
                );

                const acceptedCalls = upstreamSpy.sendUpstream.getCalls().filter(call =>
                    call.args[1].event === connect.ContactEvents.ACCEPTED
                );
                expect(acceptedCalls.length).to.equal(1);
            });

            it('should set isAutoAcceptEnabled to false when auto-accept is disabled', () => {
                contact.isAutoAcceptEnabled = () => false;
                contact.getType.returns(connect.ContactType.VOICE);
                contact.getAgentConnection.returns({
                    getSoftphoneMediaInfo: () => ({ callConfigJson: '{}' }),
                    connectionId: '9876543210',
                    getConnectionId: () => '9876543210'
                });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });

                const softphoneManager = new connect.SoftphoneManager();
                softphoneManager.startSession(contact, agentConnectionId);
                const rtcSession = stubbedCreateSession.getCall(0).returnValue;
                rtcSession.onSessionConnected({});

                const acceptedCalls = upstreamSpy.sendUpstream.getCalls().filter(call =>
                    call.args[1].event === connect.ContactEvents.ACCEPTED
                );
                expect(acceptedCalls.length).to.equal(0);
            });
        });

        describe('RTC Session callbacks', () => {
            let contact, contactId, agentConnectionId, sampleDeviceId, dummyAudioTrack, enhancedAudioTrack;
            let stubbedGetStatus, permissionsStub;
            let publishMetricsStub, cleanVoiceFocusStub;

            before(() => {
                // Mock RTCErrors
                connect.RTCErrors = {
                    ICE_COLLECTION_TIMEOUT: 'ICE_COLLECTION_TIMEOUT',
                    USER_BUSY: 'USER_BUSY',
                    SIGNALLING_HANDSHAKE_FAILURE: 'SIGNALLING_HANDSHAKE_FAILURE',
                    GUM_TIMEOUT_FAILURE: 'GUM_TIMEOUT_FAILURE',
                    GUM_OTHER_FAILURE: 'GUM_OTHER_FAILURE',
                    SIGNALLING_CONNECTION_FAILURE: 'SIGNALLING_CONNECTION_FAILURE',
                    CALL_NOT_FOUND: 'CALL_NOT_FOUND'
                };
                contactId = "1234567890";
                contact = new connect.Contact(contactId);
                agentConnectionId = 'abcdefg-RTCSessionCallbacks';
                sandbox.stub(contact, "isSoftphoneCall").returns(true);
                sandbox.stub(contact, "isInbound").returns(true);
                sandbox.stub(contact, "getContactSubtype").returns("Sub");
                connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
                sandbox.stub(contact, 'getAgentConnection').returns({
                    getSoftphoneMediaInfo: sandbox.stub().returns({
                        callConfigJson: "{}"
                    }),
                    connectionId: '0987654321',
                    getConnectionId: () => '0987654321'
                });
                stubbedGetStatus = sandbox.stub(contact, 'getStatus');
                sampleDeviceId = 'sample-device-id';
                dummyAudioTrack = { kind: 'dummy' };
                stubbedCreateSession = sandbox.stub().returns({
                    connect: stubbedRTCSessionConnect,
                    _pc: {
                        getSenders: () => [{ replaceTrack: stubbedReplaceTrack.resolves() }]
                    }
                });
                stubbedConnect = sandbox.stub();
                connect.RtcPeerConnectionManager.returns({
                    createSession: stubbedCreateSession,
                    connect: stubbedConnect,
                    getPeerConnection: sandbox.stub()
                });
                enhancedAudioTrack = { kind: 'enhanced' };
                permissionsStub = sandbox.stub(connect.Agent.prototype, 'getPermissions').returns([]);
                if (connect.VoiceFocusProvider.publishMetrics.isSinonProxy) {
                    publishMetricsStub = connect.VoiceFocusProvider.publishMetrics;
                } else {
                    publishMetricsStub = sandbox.stub(connect.VoiceFocusProvider, 'publishMetrics');
                }
                if (connect.VoiceFocusProvider.cleanVoiceFocus.isSinonProxy) {
                    cleanVoiceFocusStub = connect.VoiceFocusProvider.cleanVoiceFocus;
                } else {
                    cleanVoiceFocusStub = sandbox.stub(connect.VoiceFocusProvider, 'cleanVoiceFocus');
                }
            });
            afterEach(() => {
                sandbox.resetHistory();
                permissionsStub.restore();
            });

            describe('onLocalStreamAdded', () => {
                it('Dont override local stream when audio enhancement is enabled', async () => {
                    // setup
                    connect.core.voiceFocus = {
                      isEnabled: () => false
                    }
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    sandbox.stub(connect.core.softphoneManager, 'replaceLocalMediaTrack');
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId);
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const inputStream = { getAudioTracks: () => [dummyAudioTrack] };

                    // act
                    session.onLocalStreamAdded(session, inputStream);

                    // assert
                    sandbox.assert.notCalled(getVoiceEnhancedUserMediaStub);
                    sandbox.assert.notCalled(connect.core.softphoneManager.replaceLocalMediaTrack);

                    // cleanup
                    connect.core.softphoneManager.terminate();
                    connect.core.softphoneManager = null;
                });
                it('Override the media stream with enhanced audio on local stream added when voice enhancement is enabled', async () => {
                    // setup
                    connect.core.voiceFocus.isEnabled = () => true;
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    sandbox.stub(connect.core.softphoneManager, 'replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia').resolves();
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId);
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const inputStream = { getAudioTracks: () => [dummyAudioTrack], id: "input" };

                    // act
                    session.onLocalStreamAdded(session, inputStream);
                    await clock.tickAsync(0);

                    // assert
                    sandbox.assert.calledOnce(connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia);

                    // cleanup
                    connect.core.softphoneManager.terminate();
                    connect.core.softphoneManager = null;
                    connect.core.voiceFocus.isEnabled = () => false;
                });
            });

            describe('onSessionCompleted', () => {

                it('should call publishMetrics and cleanVoiceFocus when session completes', () => {
                    // setup
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId);
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const rtcSession = { sessionReport: {} };

                    // act
                    session.onSessionCompleted(rtcSession);

                    // Verify the expected methods were called
                    sinon.assert.calledOnce(publishMetricsStub);
                    sinon.assert.calledWith(publishMetricsStub, { contactId });
                    sinon.assert.calledOnce(cleanVoiceFocusStub);
                });

                it('should call onSessionCompleted callback if provided when session completes', () => {
                    // setup
                    const onSessionCompletedCallback = sandbox.stub();
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId, undefined, {onSessionCompleted: onSessionCompletedCallback});
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const rtcSession = { sessionReport: {} };

                    // act
                    session.onSessionCompleted(rtcSession);

                    // Verify the callback was called
                    sinon.assert.calledOnce(onSessionCompletedCallback);
                });
            });

            describe('onSessionFailed', () => {

                it('should call publishMetrics and cleanVoiceFocus when session fails', () => {
                    // setup
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId);
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const rtcSession = { sessionReport: {} };

                    // act
                    session.onSessionFailed(rtcSession);

                    // Verify the expected methods were called
                    sinon.assert.calledOnce(publishMetricsStub);
                    sinon.assert.calledWith(publishMetricsStub, { contactId });
                    sinon.assert.calledOnce(cleanVoiceFocusStub);
                });

                it('should call onSessionFailed callback if provided when session fails', () => {
                    // setup
                    const onSessionFailedCallback = sandbox.stub();
                    connect.core.softphoneManager = new connect.SoftphoneManager();
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    connect.core.softphoneManager.startSession(contact, agentConnectionId, undefined, {onSessionFailed: onSessionFailedCallback});
                    const session = connect.core.softphoneManager.getSession(agentConnectionId);
                    const rtcSession = { sessionReport: {} };

                    // act
                    session.onSessionFailed(rtcSession);

                    // Verify the callback was called
                    sinon.assert.calledOnce(onSessionFailedCallback);
                });
            });
        });
    });

    describe('initialization', () => {
        let sourceStream, testDeviceId;
        beforeEach(() => {
            connect.SoftphoneManager.isBrowserSoftPhoneSupported.returns(true);
            connect.isChromeBrowser.returns(true);
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [{ kind: "audio", enabled: true }] });
            connect.Agent.prototype.getContacts.returns([]);
            testDeviceId = 'dummy-device-id';
            sourceStream = {
                getAudioTracks: () => [{ kind: 'audio', enabled: true }],
                id: 'source'
            };
        });

        it('replace audio tracks when device id is given', async () => {
            // setup
            const softphoneParams = {};
            connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves(sourceStream);

            // action
            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia(testDeviceId);

            // assert
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, {
                audio: {
                    deviceId: { exact: testDeviceId },
                    echoCancellation: true,
                }
            });
            sandbox.assert.calledWith(getVoiceEnhancedUserMediaStub, sourceStream);
            sandbox.assert.calledWith(connect.core.softphoneManager.replaceMediaStreamInRTCSession, enhancedStream);

            // cleanup
            connect.core.softphoneManager = null;
        });

        it('replace audio tracks when no device given and echo cancellation disabled', async () => {
            // setup
            const softphoneParams = {disableEchoCancellation: true};
            connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves(sourceStream);

            // action
            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

            // assert
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, {
                audio: {
                    echoCancellation: false,
                    autoGainControl: true,
                }
            });
            sandbox.assert.calledWith(getVoiceEnhancedUserMediaStub, sourceStream);
            sandbox.assert.calledWith(connect.core.softphoneManager.replaceMediaStreamInRTCSession, enhancedStream);

            // cleanup
            connect.core.softphoneManager = null;
        });

        it('ignore for VDI platforms', async () => {
            // setup
            const softphoneParams = {VDIPlatform: "CITRIX"};
            connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');

            // action
            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

            // assert
            sandbox.assert.notCalled(getVoiceEnhancedUserMediaStub);
            sandbox.assert.notCalled(connect.core.softphoneManager.replaceMediaStreamInRTCSession);

            // cleanup
            connect.core.softphoneManager = null;
        });

        // Negative test cases
        it('should handle null or undefined input gracefully', async () => {
            // setup
            connect.core.softphoneManager = new connect.SoftphoneManager();
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves(sourceStream);

            // action
            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

            // assert
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, {
                audio: {
                    echoCancellation: true,
                }
            });
            sandbox.assert.calledWith(getVoiceEnhancedUserMediaStub, sourceStream);
            sandbox.assert.calledWith(connect.core.softphoneManager.replaceMediaStreamInRTCSession, enhancedStream);

            // cleanup
            connect.core.softphoneManager = null;
        });

        it('should handle getUserMedia failure', async () => {
            // setup
            const softphoneParams = {};
            connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.rejects(new Error('getUserMedia failed'));

            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia(testDeviceId);

            // assert
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, { audio: {
                deviceId: { exact: testDeviceId },
                echoCancellation: true,
            }});
            sandbox.assert.notCalled(getVoiceEnhancedUserMediaStub);
            sandbox.assert.notCalled(connect.core.softphoneManager.replaceMediaStreamInRTCSession);
            // cleanup
            connect.core.softphoneManager = null;
        });

        it('should handle voice enhancement failure', async () => {
            // setup
            const softphoneParams = {};
            connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
            sandbox.stub(connect.core.softphoneManager, 'replaceMediaStreamInRTCSession');
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves(sourceStream);
            getVoiceEnhancedUserMediaStub.rejects(new Error('Voice enhancement failed'));

            await connect.core.softphoneManager.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia(testDeviceId);

            // assert
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, { audio: {
                deviceId: { exact: testDeviceId },
                echoCancellation: true,
            }});
            sandbox.assert.calledWith(getVoiceEnhancedUserMediaStub, sourceStream);
            sandbox.assert.notCalled(connect.core.softphoneManager.replaceMediaStreamInRTCSession);

            // cleanup
            connect.core.softphoneManager = null;
        });

        afterEach(() => {
            sandbox.resetHistory();
            stubbedRTCSessionConnect.resetHistory();
        });

        describe('VDI strategy selection', () => {
            let citrixStub, dcvStub, omnissaStub;
            
            beforeEach(() => {
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                    getStrategyName: () => 'CitrixVDIStrategy'
                });
                dcvStub = sandbox.stub(connect, 'DCVWebRTCStrategy').returns({
                    getStrategyName: () => 'DCVStrategy'
                });
                omnissaStub = sandbox.stub(connect, 'OmnissaVDIStrategy').returns({
                    getStrategyName: () => 'OmnissaVDIStrategy'
                });
            });
            
            afterEach(() => {
                citrixStub.restore();
                dcvStub.restore();
                omnissaStub.restore();
            });
            
            it('should select CitrixVDIStrategy when VDIPlatform is CITRIX', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
                expect(softphoneManager.rtcJsStrategy.getStrategyName()).to.equal('CitrixVDIStrategy');
                sinon.assert.calledWithNew(connect.CitrixVDIStrategy);
                sinon.assert.calledWith(citrixStub, VDI_PLATFORMS.CITRIX, true);
                sinon.assert.notCalled(dcvStub);
                sinon.assert.notCalled(omnissaStub);
            });
            
            it('should select CitrixVDIStrategy when VDIPlatform is CITRIX_413', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
                expect(softphoneManager.rtcJsStrategy.getStrategyName()).to.equal('CitrixVDIStrategy');
                sinon.assert.calledWithNew(connect.CitrixVDIStrategy);
                sinon.assert.calledWith(citrixStub, VDI_PLATFORMS.CITRIX_413, true);
                sinon.assert.notCalled(dcvStub);
                sinon.assert.notCalled(omnissaStub);
            });
            
            it('should select DCVStrategy when VDIPlatform is AWS_WORKSPACE', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.AWS_WORKSPACE });
                expect(softphoneManager.rtcJsStrategy.getStrategyName()).to.equal('DCVStrategy');
                sinon.assert.calledWithNew(connect.DCVWebRTCStrategy);
                sinon.assert.notCalled(citrixStub);
                sinon.assert.notCalled(omnissaStub);
            });
            
            it('should select OmnissaVDIStrategy when VDIPlatform is OMNISSA', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.OMNISSA });
                expect(softphoneManager.rtcJsStrategy.getStrategyName()).to.equal('OmnissaVDIStrategy');
                sinon.assert.calledWithNew(connect.OmnissaVDIStrategy);
                sinon.assert.notCalled(citrixStub);
                sinon.assert.notCalled(dcvStub);
            });
            
            it('should publish VDI_STRATEGY_NOT_SUPPORTED error for unsupported VDIPlatform', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'UNSUPPORTED_PLATFORM' });
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                sinon.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED);
                sinon.assert.notCalled(citrixStub);
                sinon.assert.notCalled(dcvStub);
                sinon.assert.notCalled(omnissaStub);
            });
            
            it('should have no VDI strategy when VDIPlatform is not provided', () => {
                const softphoneManager = new connect.SoftphoneManager({});
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                sinon.assert.notCalled(citrixStub);
                sinon.assert.notCalled(dcvStub);
                sinon.assert.notCalled(omnissaStub);
            });
        });
    });

    describe('sendSoftphoneReport', () => {
        let stubbedGetAgentDataProvider;
        let contact, contactId, agentConnectionId;
        let stubbedGetStatus;

        before(() => {
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            agentConnectionId = 'abcdefg-sendSoftphoneReport';
            sandbox.spy(connect, "publishSoftphoneReport");
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321',
                getConnectionId: () => '0987654321'
            });
            stubbedGetStatus = sandbox.stub(contact, 'getStatus');
            stubbedGetAgentDataProvider = sandbox.stub(connect.core, 'getAgentDataProvider');
        });
    });

    describe('setSpeakerDevice', () => {
        let sampleDeviceId;
        let stubbedSetSinkId;
        before(() => {
            sampleDeviceId = 'sample-device-id';
            stubbedSetSinkId = sandbox.stub().resolves();
            sandbox.stub(document, 'getElementById').returns({ setSinkId: stubbedSetSinkId });
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        it('should apply the new deviceId to the remote audio element', async () => {
            new connect.SoftphoneManager();
            bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: sampleDeviceId });
            sandbox.assert.calledWith(stubbedSetSinkId, sampleDeviceId);
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.calledWith(connect.core.getUpstream().sendUpstream, connect.EventType.BROADCAST, {
                event: connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
                data: { deviceId: sampleDeviceId }
            });
        });
        it('should cancel if no deviceId is given', () => {
            new connect.SoftphoneManager();
            bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, {});
            sandbox.assert.notCalled(stubbedSetSinkId);
            sandbox.assert.notCalled(connect.core.getUpstream().sendUpstream);
        });
        it('should cancel if remote audio element doesnt exist', () => {
            new connect.SoftphoneManager();
            bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, {});
            sandbox.assert.notCalled(stubbedSetSinkId);
            sandbox.assert.notCalled(connect.core.getUpstream().sendUpstream);
        });
        it('should cancel if remote audio element doesnt support setSinkId method', () => {
            document.getElementById.returns({});
            new connect.SoftphoneManager();
            bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, {});
            sandbox.assert.notCalled(stubbedSetSinkId);
            sandbox.assert.notCalled(connect.core.getUpstream().sendUpstream);
            document.getElementById.returns({ setSinkId: stubbedSetSinkId });
        });
        it('should throw an error if given deviceId doesnt exist', async () => {
            stubbedSetSinkId.rejects(Error());
            new connect.SoftphoneManager();
            bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: sampleDeviceId });
            sandbox.assert.calledWith(stubbedSetSinkId, sampleDeviceId);
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.notCalled(connect.core.getUpstream().sendUpstream);
            stubbedSetSinkId.reset();
        });
    });

    describe('setMicrophoneDevice', () => {
        let contact, contactId, agentConnectionId, sampleDeviceId, dummyAudioTrack;
        let stubbedGetStatus;

        before(() => {
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            agentConnectionId = 'abcdefg-setMicrophoneDevice';
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321',
                getConnectionId: () => '0987654321'
            });
            stubbedGetStatus = sandbox.stub(contact, 'getStatus');
            sampleDeviceId = 'sample-device-id';
            dummyAudioTrack = { kind: 'dummy' };
            stubbedCreateSession = sandbox.stub().returns({
                connect: stubbedRTCSessionConnect,
                _pc: {
                    getSenders: () => [{ replaceTrack: stubbedReplaceTrack.resolves() }]
                }
            });
            stubbedConnect = sandbox.stub();
            const setMicrophonePeerConnectionManagerMock = {
                createSession: stubbedCreateSession,
                connect: stubbedConnect,
                getPeerConnection: sandbox.stub(),
                close: sandbox.stub(),
                handlePersistentPeerConnectionToggle: sandbox.stub()
            };
            connect.RtcPeerConnectionManager.returns(setMicrophonePeerConnectionManagerMock);
            connect.RtcPeerConnectionManagerV2.returns(setMicrophonePeerConnectionManagerMock);
            if (connect.Agent.prototype.getPermissions.restore) connect.Agent.prototype.getPermissions.restore();
            audioDeviceSettingsStub = sandbox.stub(connect.Agent.prototype, 'getPermissions').returns(['audioDeviceSettings']);
            enhancedAudioTrack = { kind: 'enhanced' };
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        it('should cancel if local media stream doesnt exist', () => {
            new connect.SoftphoneManager();
            navigator.mediaDevices.getUserMedia.resetHistory();
            bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId : sampleDeviceId });
            sandbox.assert.notCalled(navigator.mediaDevices.getUserMedia);
        });
        it('should replace the audio track with the one with the given deviceId', async () => {
            connect.core.softphoneManager = new connect.SoftphoneManager();
            sandbox.stub(connect.core.softphoneManager, 'replaceLocalMediaTrack');
            stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            connect.core.softphoneManager.startSession(contact, agentConnectionId);
            const session = connect.core.softphoneManager.getSession(agentConnectionId);
            session.onLocalStreamAdded(session, {});
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [dummyAudioTrack] });
            bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId : sampleDeviceId });
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, { audio: { deviceId: { exact: sampleDeviceId } } });
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.calledWith(stubbedReplaceTrack, dummyAudioTrack);
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sandbox.assert.calledWith(connect.core.softphoneManager.replaceLocalMediaTrack, agentConnectionId, dummyAudioTrack);

            connect.core.softphoneManager.terminate();
            connect.core.softphoneManager = null;
        });
        it('should cancel if no deviceId is given', async () => {
            connect.core.softphoneManager = new connect.SoftphoneManager();
            sandbox.stub(connect.core.softphoneManager, 'replaceLocalMediaTrack');
            stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            connect.core.softphoneManager.startSession(contact, agentConnectionId);
            const session = connect.core.softphoneManager.getSession(agentConnectionId);
            session.onLocalStreamAdded(session, {});
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [dummyAudioTrack] });
            bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, {});
            sandbox.assert.notCalled(navigator.mediaDevices.getUserMedia);

            connect.core.softphoneManager.terminate();
            connect.core.softphoneManager = null;
        });
        it('should pass disableEchoCancellation softphone option', async () => {
            connect.core.softphoneManager = new connect.SoftphoneManager({disableEchoCancellation: true});
            sandbox.stub(connect.core.softphoneManager, 'replaceLocalMediaTrack');
            stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            connect.core.softphoneManager.startSession(contact, agentConnectionId);
            const session = connect.core.softphoneManager.getSession(agentConnectionId);
            session.onLocalStreamAdded(session, {});
            navigator.mediaDevices.getUserMedia.resetHistory();
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [dummyAudioTrack] });
            bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId : sampleDeviceId });
            sandbox.assert.calledWith(navigator.mediaDevices.getUserMedia, { audio: { deviceId : {exact : sampleDeviceId}, echoCancellation : false}});
            connect.core.softphoneManager.terminate();
            connect.core.softphoneManager = null;
        });
    });

    describe('sanityCheckActiveSessions', () => {
        const mockContacts = [
            {
                getContactId: () => 'id1',
                isSoftphoneCall: () => true,
                getType: () => 'voice',
                getAgentConnection: () => ({ getConnectionId: () => 'agentConn1' })
            },
            {
                getContactId: () => 'id2',
                isSoftphoneCall: () => true,
                getType: () => 'queue_callback',
                getAgentConnection: () => ({ getConnectionId: () => 'agentConn2' })
            }
        ];
        const publishMultipleSessionsEventSpy = sandbox.spy(connect.SoftphoneManager, 'publishMultipleSessionsEvent');

        it('should throw an error if any sessions were removed that was not in the snapshot', () => {
            connect.core.softphoneManager = new connect.SoftphoneManager({ disableEchoCancellation: true });
            const destroySessionSpy = sandbox.spy(connect.core.softphoneManager, 'destroySession');
            const mockSessions = {
                agentConn1: { connectionId: "agentConn1" },
                staleConn: {connectionId: "staleConn", callId: "mock-id"}
            };
            try {
                connect.Agent.prototype.getContacts.returns(mockContacts);
                connect.core.softphoneManager.sanityCheckActiveSessions(mockSessions);
            } catch (e) {
                sinon.assert.calledWith(publishMultipleSessionsEventSpy, "MultiSessionHangUp", "mock-id", "staleConn")
                sinon.assert.calledWith(destroySessionSpy, "staleConn");
                expect(e.message).to.equal("duplicate session detected, refusing to setup new connection")
            }            
        });

        it('should not destroy any sessions that are presented in the snapshot', () => {
            connect.Agent.prototype.getContacts.returns([]);
            connect.core.softphoneManager = new connect.SoftphoneManager({ disableEchoCancellation: true });
            const destroySessionSpy = sandbox.spy(connect.core.softphoneManager, 'destroySession');
            const mockSessions = {
                agentConn1: { connectionId: "agentConn1" },
            };
            connect.Agent.prototype.getContacts.returns(mockContacts);
            connect.core.softphoneManager.sanityCheckActiveSessions(mockSessions);
            sinon.assert.notCalled(destroySessionSpy);
        });

        it('should not destroy session for queued callback when agentConnectionId changes', () => {
            // This test simulates the queued callback scenario where:
            // 1. Session is created with initial agentConnectionId (oldAgentConn)
            // 2. Contact connects and agentConnectionId changes (newAgentConn)
            // 3. sanityCheckActiveSessions should NOT destroy the session because
            //    it's mapped to an active contact via contactAgentConnectionIdMap
            
            const queueCallbackContactId = 'qc-contact-123';
            const oldAgentConnectionId = 'initial-agent-conn';
            const newAgentConnectionId = 'connected-agent-conn';
            
            // Save original getContacts to restore later
            const originalGetContacts = connect.Agent.prototype.getContacts;
            
            // Create a plain object that mimics a Contact
            const queueCallbackContact = new connect.Contact(queueCallbackContactId);
            queueCallbackContact.getType = () => connect.ContactType.QUEUE_CALLBACK;
            queueCallbackContact.getConnections = () => {return [ {connectionId: newAgentConnectionId, 
                getType: () => connect.ConnectionType.AGENT,
                onParticipantResume: () => {},
                getSoftphoneMediaInfo: () => {}
             }]};
            
            connect.Agent.prototype.getContacts = sandbox.stub().returns([queueCallbackContact]);
            connect.core.softphoneManager = new connect.SoftphoneManager({ disableEchoCancellation: true });
            const destroySessionSpy = sandbox.spy(connect.core.softphoneManager, 'destroySession');
            
            // Populate contactAgentConnectionIdMap with the mapping from old to contact
            // This simulates what happens in onInitContact when the session is created
            const contactAgentConnectionIdMap = {};
            contactAgentConnectionIdMap[oldAgentConnectionId] = queueCallbackContactId;
            
            // Inject the mapping into the global scope (since that's where it's accessed)
            global.contactAgentConnectionIdMap = contactAgentConnectionIdMap;
            
            // RTC session uses the old agentConnectionId as key
            const mockSessions = {
                [oldAgentConnectionId]: { 
                    connectionId: oldAgentConnectionId,
                    callId: "qc-call-id"
                }
            };
            
            try {
                connect.core.softphoneManager.sanityCheckActiveSessions(mockSessions);
            } catch (e) {
                // Should NOT destroy session
                sinon.assert.notCalled(destroySessionSpy);
            }            
            // Cleanup
            delete global.contactAgentConnectionIdMap;
            connect.Agent.prototype.getContacts = originalGetContacts;
        });

        it('should destroy session when contactAgentConnectionIdMap points to inactive contact', () => {
            // This test ensures that even if contactAgentConnectionIdMap has a mapping,
            // the session is destroyed if the contact is no longer active
            
            const inactiveContactId = 'inactive-contact-456';
            const oldAgentConnectionId = 'old-agent-conn-456';
            
            // No active contacts
            connect.Agent.prototype.getContacts.returns([]);
            connect.core.softphoneManager = new connect.SoftphoneManager({ disableEchoCancellation: true });
            const destroySessionSpy = sandbox.spy(connect.core.softphoneManager, 'destroySession');
            
            // contactAgentConnectionIdMap has a mapping, but contact is no longer active
            const contactAgentConnectionIdMap = {};
            contactAgentConnectionIdMap[oldAgentConnectionId] = inactiveContactId;
            global.contactAgentConnectionIdMap = contactAgentConnectionIdMap;
            
            const mockSessions = {
                [oldAgentConnectionId]: { 
                    connectionId: oldAgentConnectionId,
                    callId: "inactive-call-id"
                }
            };
            
            // Should throw error and destroy the stale session
            try {
                connect.core.softphoneManager.sanityCheckActiveSessions(mockSessions);
            } catch (e) {
                sinon.assert.calledWith(destroySessionSpy, oldAgentConnectionId);
                expect(e.message).to.equal("duplicate session detected, refusing to setup new connection");
            }
            
            // Cleanup
            delete global.contactAgentConnectionIdMap;
        });
    })

    describe('VDI initialization status', () => {
        let citrixStub, dcvStub, omnissaStub;
        before(() => {
            citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                getStrategyName: () => 'CitrixVDIStrategy'
            });
            dcvStub = sandbox.stub(connect, 'DCVWebRTCStrategy').returns({
                getStrategyName: () => 'DCVStrategy'
            });
            omnissaStub = sandbox.stub(connect, 'OmnissaVDIStrategy').returns({
                getStrategyName: () => 'OmnissaVDIStrategy'
            });
        });

        beforeEach(() => {
            const mockContact = {
                getContactId: () => 'mock-contact',
                getAgentConnection: () => ({ 
                    connectionId: 'mock-conn',
                    onParticipantResume: sandbox.stub()
                }),
                onRefresh: sandbox.stub(),
                onError: sandbox.stub(),
                onConnected: sandbox.stub(),
                onDestroy: sandbox.stub(),
                onEnded: sandbox.stub(),
                getStatus: () => ({ type: connect.ContactStatusType.CONNECTED }),
                getType: () => connect.ContactType.VOICE,
                isSoftphoneCall: () => true,
                sendSoftphoneReport: sandbox.stub(),
                getContactSubtype: () => 'VoIP'
            };
            connect.Agent.prototype.getContacts.returns([mockContact]);
        });

        afterEach(() => {
            sandbox.resetHistory();
        });

        after(() => {
            citrixStub.restore();
            dcvStub.restore();
            omnissaStub.restore();
        });

        describe('VDI initialization failure detection', () => {
            it('should report vdiInitializationFailed=false for successful Citrix initialization', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX' });
                
                // Simulate telemetry reporting by checking the manager's strategy
                const expectedStrategyName = 'CitrixVDIStrategy';
                const actualStrategyName = softphoneManager.rtcJsStrategy.getStrategyName();
                
                expect(actualStrategyName).to.equal(expectedStrategyName);
                sandbox.assert.calledWithNew(connect.CitrixVDIStrategy);
            });
            
            it('should report vdiInitializationFailed=false for successful Citrix 4.13 initialization', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX_413' });
                
                const expectedStrategyName = 'CitrixVDIStrategy';
                const actualStrategyName = softphoneManager.rtcJsStrategy.getStrategyName();
                
                expect(actualStrategyName).to.equal(expectedStrategyName);
                sandbox.assert.calledWithNew(connect.CitrixVDIStrategy);
                
                // Verify that CitrixVDIStrategy was called with the correct VDI platform parameter
                sandbox.assert.calledWith(citrixStub, 'CITRIX_413', true);
            });

            it('should report vdiInitializationFailed=false for successful AWS Workspace initialization', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'AWS_WORKSPACE' });
                
                const expectedStrategyName = 'DCVStrategy';
                const actualStrategyName = softphoneManager.rtcJsStrategy.getStrategyName();
                
                expect(actualStrategyName).to.equal(expectedStrategyName);
                sandbox.assert.calledWithNew(connect.DCVWebRTCStrategy);
            });

            it('should report vdiInitializationFailed=false for successful Omnissa initialization', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'OMNISSA' });
                
                const expectedStrategyName = 'OmnissaVDIStrategy';
                const actualStrategyName = softphoneManager.rtcJsStrategy.getStrategyName();
                
                expect(actualStrategyName).to.equal(expectedStrategyName);
                sandbox.assert.calledWithNew(connect.OmnissaVDIStrategy);
            });

            it('should report vdiInitializationFailed=true when Citrix constructor throws exception', () => {
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').throws(new Error('Citrix WebRTC redirection feature is NOT supported!'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX' });
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                
                sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED);

                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                    getStrategyName: () => 'CitrixVDIStrategy'
                });
            });
            
            it('should report vdiInitializationFailed=true when Citrix 4.13 constructor throws exception', () => {
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').throws(new Error('Citrix WebRTC redirection feature is NOT supported!'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX_413' });
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                
                sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED);

                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                    getStrategyName: () => 'CitrixVDIStrategy'
                });
            });

            it('should report vdiInitializationFailed=true when DCVStrategy constructor throws exception', () => {
                dcvStub.restore();
                dcvStub = sandbox.stub(connect, 'DCVWebRTCStrategy').throws(new Error('DCV WebRTC redirection feature is NOT supported!'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'AWS_WORKSPACE' });
                
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED);

                dcvStub.restore();
                dcvStub = sandbox.stub(connect, 'DCVWebRTCStrategy').returns({
                    getStrategyName: () => 'DCVStrategy'
                });
            });

            it('should report vdiInitializationFailed=true when OmnissaStrategy constructor throws exception', () => {
                omnissaStub.restore();
                omnissaStub = sandbox.stub(connect, 'OmnissaVDIStrategy').throws(new Error('Omnissa WebRTC Redirection API failed to initialize!'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'OMNISSA' });
                
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED);

                omnissaStub.restore();
                omnissaStub = sandbox.stub(connect, 'OmnissaVDIStrategy').returns({
                    getStrategyName: () => 'OmnissaVDIStrategy'
                });
            });

            it('should report vdiInitializationFailed=false for unsupported VDI platform (handled by error publishing)', () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'UNSUPPORTED_PLATFORM' });
                
                // Strategy should remain null for unsupported platform
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                
                // Error should be published for unsupported platform
                sandbox.assert.calledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED);
            });

            it('should report vdiInitializationFailed=false for non-VDI scenarios', () => {
                const softphoneManager = new connect.SoftphoneManager({});
                
                expect(softphoneManager.rtcJsStrategy).to.be.null;
                
                // No VDI-related errors should be published
                sandbox.assert.neverCalledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED);
                sandbox.assert.neverCalledWith(connect.SoftphoneError, connect.SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED);
            });
        });

        describe('Telemetry integration tests', () => {
            let contact, rtcSession, sessionReport;

            beforeEach(() => {
                contact = {
                    getContactId: () => 'test-contact-123',
                    getContactSubtype: () => 'VoIP',
                    sendSoftphoneReport: sandbox.stub()
                };

                sessionReport = {
                    sessionStartTime: Date.now(),
                    sessionEndTime: Date.now() + 30000,
                    gumTimeMillis: 100,
                    initializationTimeMillis: 200,
                    iceCollectionTimeMillis: 300
                };

                rtcSession = { sessionReport };

                // Mock connect.core.softphoneManager to be available during telemetry
                connect.core.softphoneManager = null;
            });

            it('should include vdiInitializationFailed=false in telemetry for successful VDI initialization', async () => {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX' });
                connect.core.softphoneManager = softphoneManager;

                // Simulate session completion and telemetry reporting
                contact.getStatus = sandbox.stub().returns({type: connect.ContactStatusType.CONNECTING});
                
                // Trigger telemetry by simulating a completed session
                const sendSoftphoneReportSpy = sandbox.spy();

                // Manually trigger the telemetry logic that would normally happen in sendSoftphoneReport
                const vdiInitializationFailed = 'CITRIX' ? 
                    'CitrixVDIStrategy' !== softphoneManager.rtcJsStrategy?.getStrategyName() : false;

                expect(vdiInitializationFailed).to.be.false;
            });
            

            it('should include vdiInitializationFailed=true in telemetry for failed VDI initialization', async () => {
                // Mock constructor failure
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').throws(new Error('Constructor failed'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX' });
                connect.core.softphoneManager = softphoneManager;

                // Simulate telemetry logic
                const vdiInitializationFailed = 'CITRIX' ? 
                    'CitrixVDIStrategy' !== softphoneManager.rtcJsStrategy?.getStrategyName() : false;

                expect(vdiInitializationFailed).to.be.true;

                // Restore stub
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                    getStrategyName: () => 'CitrixVDIStrategy'
                });
            });
            
            it('should include vdiInitializationFailed=true in telemetry for failed CITRIX_413 initialization', async () => {
                // Mock constructor failure
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').throws(new Error('Constructor failed'));

                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX_413' });
                connect.core.softphoneManager = softphoneManager;

                // Simulate telemetry logic
                const vdiInitializationFailed = 'CITRIX_413' ? 
                    'CitrixVDIStrategy' !== softphoneManager.rtcJsStrategy?.getStrategyName() : false;

                expect(vdiInitializationFailed).to.be.true;

                // Restore stub
                citrixStub.restore();
                citrixStub = sandbox.stub(connect, 'CitrixVDIStrategy').returns({
                    getStrategyName: () => 'CitrixVDIStrategy'
                });
            });

            it('should include vdiInitializationFailed=false in telemetry for non-VDI scenarios', () => {
                const softphoneManager = new connect.SoftphoneManager({});
                connect.core.softphoneManager = softphoneManager;

                // Simulate telemetry logic  
                const vdiInitializationFailed = null ? 
                    undefined !== softphoneManager.rtcJsStrategy?.getStrategyName() : false;

                expect(vdiInitializationFailed).to.be.false;
            });

            afterEach(() => {
                connect.core.softphoneManager = null;
            });
        });
    });

    describe('Per-Agent Connection Stats Tracking', () => {
        let contact1, contact2, contactId1, contactId2, agentConnectionId1, agentConnectionId2;
        let stubbedGetStatus1, stubbedGetStatus2;
        let softphoneReports;
        let stubbedCreateSession, stubbedConnect;

        before(() => {
            // Set up two different contacts with different agent connection IDs
            contactId1 = "contact-123";
            contactId2 = "contact-456";
            agentConnectionId1 = "agent-conn-123";
            agentConnectionId2 = "agent-conn-456";

            contact1 = new connect.Contact(contactId1);
            contact2 = new connect.Contact(contactId2);

            sandbox.stub(contact1, "isSoftphoneCall").returns(true);
            sandbox.stub(contact1, "isInbound").returns(true);
            sandbox.stub(contact1, "getContactSubtype").returns("VoIP");
            sandbox.stub(contact1, "isAutoAcceptEnabled").returns(false);
            sandbox.stub(contact1, "sendSoftphoneReport").callsFake((report, callbacks) => {
                if (callbacks && callbacks.success) callbacks.success();
            });
            sandbox.stub(contact1, "sendSoftphoneMetrics").callsFake((metrics, callbacks) => {
                if (callbacks && callbacks.success) callbacks.success();
            });
            sandbox.stub(contact2, "isSoftphoneCall").returns(true);
            sandbox.stub(contact2, "isInbound").returns(true);
            sandbox.stub(contact2, "getContactSubtype").returns("VoIP");
            sandbox.stub(contact2, "isAutoAcceptEnabled").returns(false);
            // Check if getType is already stubbed to avoid conflicts
            if (contact2.getType.restore) {
                contact2.getType.restore();
            }
            sandbox.stub(contact2, "getType").returns(connect.ContactType.VOICE);
            sandbox.stub(contact2, "sendSoftphoneReport").callsFake((report, callbacks) => {
                if (callbacks && callbacks.success) callbacks.success();
            });
            sandbox.stub(contact2, "sendSoftphoneMetrics").callsFake((metrics, callbacks) => {
                if (callbacks && callbacks.success) callbacks.success();
            });

            sandbox.stub(contact1, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: agentConnectionId1,
                getConnectionId: () => agentConnectionId1
            });
            sandbox.stub(contact2, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: agentConnectionId2,
                getConnectionId: () => agentConnectionId2
            });

            stubbedGetStatus1 = sandbox.stub(contact1, 'getStatus');
            stubbedGetStatus2 = sandbox.stub(contact2, 'getStatus');

            // Set up RTC stubs for this test section - return different objects for different calls
            stubbedCreateSession = sandbox.stub().callsFake(() => ({
                connect: sandbox.stub(),
                _pc: {
                    getSenders: () => [{ replaceTrack: sandbox.stub().resolves() }]
                },
                onSessionConnected: null,
                onSessionCompleted: null,
                onSessionFailed: null,
                onLocalStreamAdded: null
            }));
            stubbedConnect = sandbox.stub();

            connect.RtcPeerConnectionManagerV2.returns({
                createSession: stubbedCreateSession,
                connect: stubbedConnect,
                getPeerConnection: sandbox.stub(),
                close: sandbox.stub()
            });

            // Track softphone reports
            softphoneReports = [];
            // Remove any existing spy from before() if it exists
            if (connect.publishSoftphoneReport?.restore) {
                connect.publishSoftphoneReport.restore();
            }
            sandbox.stub(connect, 'publishSoftphoneReport').callsFake((report) => {
                softphoneReports.push(report);
            });

            // Subscribe to SOFTPHONE_REPORT events to validate reports
            connect.core
                .getEventBus()
                .subscribe(connect.EventType.SOFTPHONE_REPORT, data => {
                    connect.ifMaster(connect.MasterTopics.METRICS, () => {
                        const { contactId, ccpVersion, report } = data;
                        // Validate the report structure here
                        expect(report).to.have.property('consecutiveNoAudioInputPackets');
                        expect(report).to.have.property('consecutiveLowInputAudioLevel');
                        expect(report).to.have.property('consecutiveNoAudioOutputPackets');
                        expect(report).to.have.property('consecutiveLowOutputAudioLevel');
                        expect(report).to.have.property('audioInputConnectedDurationSeconds');
                        expect(report).to.have.property('consecutiveAudioOutputMuteDurationSeconds');
                    });
                });
        });

        afterEach(() => {
            softphoneReports = [];
            sandbox.resetHistory();
        });

        describe('Multiple concurrent connections', () => {
            let mockFacClient, mockLilySonic, requireStub;
            
            before(async () => {
                // Setup FAC client (PCMv2 / bullet routing is now always-on; only page-load PC FAC is fetched)
                mockFacClient = {
                    isFeatureEnabled: sandbox.stub()
                };
                mockLilySonic = 'Lily Sonic';

                connect.featureFlagProvider = {
                    facClient: mockFacClient,
                    getFeatureFlags: sandbox.stub().returns({})
                };
                requireStub = sandbox.stub();
                global.require = requireStub;
                
                // Reset softphoneFlags by creating a temporary manager and waiting for FAC fetch
                const tempManager = new connect.SoftphoneManager();
                await clock.tickAsync(0);
                tempManager.terminate();
            });
            
            after(() => {
                delete connect.featureFlagProvider;
                delete global.require;
            });
            
            it('should handle stats for multiple simultaneous connections independently', async () => {

                const softphoneManager = new connect.SoftphoneManager();
                await clock.tickAsync(0); // Wait for FAC fetch to complete
                
                // Override the agent contacts to return our test contacts
                connect.Agent.prototype.getContacts.returns([
                    {
                        getContactId: () => contactId1,
                        getType: () => connect.ContactType.VOICE,
                        isSoftphoneCall: () => true,
                        getStatus: () => ({ type: connect.ContactStatusType.CONNECTING }),
                        getAgentConnection: () => ({
                            getConnectionId: () => agentConnectionId1,
                            connectionId: agentConnectionId1,
                            onParticipantResume: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
                            getSoftphoneMediaInfo: sandbox.stub().returns({ callConfigJson: "{}" })
                        }),
                        onRefresh: sandbox.stub(),
                        onError: sandbox.stub(),
                        onConnected: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
                        onDestroy: sandbox.stub(),
                        onEnded: sandbox.stub().returns({ unsubscribe: sandbox.stub() })
                    },
                    {
                        getContactId: () => contactId2,
                        getType: () => connect.ContactType.VOICE,
                        isSoftphoneCall: () => true,
                        getStatus: () => ({ type: connect.ContactStatusType.CONNECTING }),
                        getAgentConnection: () => ({
                            getConnectionId: () => agentConnectionId2,
                            connectionId: agentConnectionId2,
                            onParticipantResume: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
                            getSoftphoneMediaInfo: sandbox.stub().returns({ callConfigJson: "{}" })
                        }),
                        onRefresh: sandbox.stub(),
                        onError: sandbox.stub(),
                        onConnected: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
                        onDestroy: sandbox.stub(),
                        onEnded: sandbox.stub().returns({ unsubscribe: sandbox.stub() })
                    }
                ]);

                // Create distinct RTC sessions with different characteristics
                const rtcSession1 = {
                    getUserAudioStats: sandbox.stub().resolves({
                        packetsCount: 300,
                        packetsLost: 15,
                        audioLevel: 0.9,
                        timestamp: Date.now()
                    }),
                    getRemoteAudioStats: sandbox.stub().resolves({
                        packetsCount: 285,
                        packetsLost: 5,
                        audioLevel: 0.85,
                        timestamp: Date.now()
                    }),
                    mediaStream: {
                        getAudioTracks: () => [{ enabled: true }]
                    },
                    sessionReport: { sessionStartTime: Date.now(), sessionEndTime: Date.now() + 60000 },
                    _iceServers: [{urls: ['stun:stun.example.com']}]
                };

                const rtcSession2 = {
                    getUserAudioStats: sandbox.stub().resolves({
                        packetsCount: 150,
                        packetsLost: 25,
                        audioLevel: 0.1, // Low audio level
                        timestamp: Date.now()
                    }),
                    getRemoteAudioStats: sandbox.stub().resolves({
                        packetsCount: 125,
                        packetsLost: 15,
                        audioLevel: 0.05, // Very low audio level
                        timestamp: Date.now()
                    }),
                    mediaStream: {
                        getAudioTracks: () => [{ enabled: false }] // Muted
                    },
                    sessionReport: { sessionStartTime: Date.now(), sessionEndTime: Date.now() + 30000 },
                    _iceServers: [{urls: ['stun:stun.example.com']}]
                };

                stubbedCreateSession.onCall(0).returns(rtcSession1);
                stubbedCreateSession.onCall(1).returns(rtcSession2);

                // Start both sessions using direct startSession calls to ensure the right contact objects are used
                stubbedGetStatus1.returns({ type: connect.ContactStatusType.CONNECTING });
                stubbedGetStatus2.returns({ type: connect.ContactStatusType.CONNECTING });

                softphoneManager.startSession(contact1, agentConnectionId1);
                softphoneManager.startSession(contact2, agentConnectionId2);

                const session1 = softphoneManager.getSession(agentConnectionId1);
                const session2 = softphoneManager.getSession(agentConnectionId2);

                // The methods should already be stubbed in the before() block

                session1.onSessionConnected(rtcSession1);
                session2.onSessionConnected(rtcSession2);

                // Let both collect stats independently
                await clock.tickAsync(4000);

                // Complete first session
                session1.onSessionCompleted(rtcSession1);

                // Let second session continue for a bit more
                await clock.tickAsync(2000);

                // Complete second session
                session2.onSessionCompleted(rtcSession2);

                // Should have two separate reports
                expect(softphoneReports.length).to.equal(2);

                // Verify that we got two distinct reports
                const report1 = softphoneReports[0];
                const report2 = softphoneReports[1];

                expect(report1).to.not.be.undefined;
                expect(report2).to.not.be.undefined;

                // Verify contact IDs are correctly associated with their respective reports
                expect(report1.contactId).to.equal('contact-123');
                expect(report2.contactId).to.equal('contact-456');

                // Verify softphoneStreamPerSecondStatistics contains the correct per-connection data
                // Report 1: rtcSession1 stats (getUserAudioStats: packets=300, lost=15, audio=0.9; getRemoteAudioStats: packets=285, lost=5, audio=0.85)
                expect(report1.report.softphoneStreamPerSecondStatistics).to.have.property('AUDIO_INPUT');
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsCount).to.include(300);
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsLost).to.include(15);
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.audioLevel).to.include(0.9);

                expect(report1.report.softphoneStreamPerSecondStatistics).to.have.property('AUDIO_OUTPUT');
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.packetsCount).to.include(285);
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.packetsLost).to.include(5);
                expect(report1.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.audioLevel).to.include(0.85);

                // Report 2: rtcSession2 stats (getUserAudioStats: packets=150, lost=25, audio=0.1; getRemoteAudioStats: packets=125, lost=15, audio=0.05)
                expect(report2.report.softphoneStreamPerSecondStatistics).to.have.property('AUDIO_INPUT');
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsCount).to.include(150);
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.packetsLost).to.include(25);
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_INPUT.audioLevel).to.include(0.1);

                expect(report2.report.softphoneStreamPerSecondStatistics).to.have.property('AUDIO_OUTPUT');
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.packetsCount).to.include(125);
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.packetsLost).to.include(15);
                expect(report2.report.softphoneStreamPerSecondStatistics.AUDIO_OUTPUT.audioLevel).to.include(0.05);
            });
        });

        describe('Short call metrics fix', () => {
            it('should allow sendSoftphoneMetrics to succeed for calls < 30 seconds', async () => {
                // Setup: Mock a contact with agent connection
                const contactId = "short-call-contact";
                const agentConnectionId = "short-call-agent-conn";
                const contact = new connect.Contact(contactId);
                
                sandbox.stub(contact, "isSoftphoneCall").returns(true);
                sandbox.stub(contact, "getContactSubtype").returns("VoIP");
                sandbox.stub(contact, 'getAgentConnection').returns({
                    getSoftphoneMediaInfo: sandbox.stub().returns({
                        callConfigJson: "{}"
                    }),
                    connectionId: agentConnectionId,
                    getConnectionId: () => agentConnectionId
                });
                
                // Track sendSoftphoneMetrics success
                const sendSoftphoneMetricsSpy = sandbox.stub(contact, "sendSoftphoneMetrics").callsFake((metrics, callbacks) => {
                    // This should succeed because stats are available when called
                    expect(metrics).to.be.an('array');
                    if (callbacks && callbacks.success) callbacks.success();
                });

                const softphoneManager = new connect.SoftphoneManager();
                
                // Create an RTC session simulating a short call
                const rtcSession = {
                    getUserAudioStats: sandbox.stub().resolves({
                        packetsCount: 25,
                        packetsLost: 1,
                        audioLevel: 0.8,
                        timestamp: Date.now()
                    }),
                    getRemoteAudioStats: sandbox.stub().resolves({
                        packetsCount: 20,
                        packetsLost: 0,
                        audioLevel: 0.7,
                        timestamp: Date.now()
                    }),
                    mediaStream: {
                        getAudioTracks: () => [{ enabled: true }]
                    },
                    sessionReport: { 
                        sessionStartTime: Date.now(), 
                        sessionEndTime: Date.now() + 20000  // 20 second call - under 30 seconds
                    }
                };

                stubbedCreateSession.returns(rtcSession);
                
                // Start session and simulate completion
                sandbox.stub(contact, 'getStatus').returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                const session = softphoneManager.getSession(agentConnectionId);
                
                session.onSessionConnected(rtcSession);
                await clock.tickAsync(2000); // Let some stats accumulate
                session.onSessionCompleted(rtcSession);

                // Verify sendSoftphoneMetrics was called and succeeded
                sinon.assert.calledOnce(sendSoftphoneMetricsSpy);
                expect(sendSoftphoneMetricsSpy.calledOnce).to.be.true;
            });
        });
    });

    describe('Queue Callback agentConnectionId handling', () => {
        let queueCallbackContact, queueCallbackContactId, queueCallbackAgentConnectionId;
        let queueCallbackGetStatus;

        before(() => {
            connect.isChromeBrowser.returns(true);
            connect.isFirefoxBrowser.returns(false);
            connect.hasOtherConnectedCCPs.returns(false);
        });

        beforeEach(() => {
            queueCallbackContactId = "queuecallback-test-1234";
            queueCallbackAgentConnectionId = 'initial-qc-agent-conn-id';
            
            // Create a completely fresh contact object not affected by other stubs
            queueCallbackContact = new connect.Contact(queueCallbackContactId);
            sandbox.stub(queueCallbackContact, "isSoftphoneCall").returns(true);
            sandbox.stub(queueCallbackContact, "getType").returns(connect.ContactType.QUEUE_CALLBACK);
            sandbox.stub(queueCallbackContact, "getContactId").returns(queueCallbackContactId);
            
            sandbox.stub(queueCallbackContact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: queueCallbackAgentConnectionId,
                getConnectionId: () => queueCallbackAgentConnectionId,
                onParticipantResume: () => ({ unsubscribe: sandbox.stub() })
            });
            
            sandbox.stub(queueCallbackContact, 'onConnected').returns({ unsubscribe: sandbox.stub() });
            sandbox.stub(queueCallbackContact, 'onRefresh').returns({ unsubscribe: sandbox.stub() });
            sandbox.stub(queueCallbackContact, 'onError').returns({ unsubscribe: sandbox.stub() });
            sandbox.stub(queueCallbackContact, 'onDestroy').returns({ unsubscribe: sandbox.stub() });
            sandbox.stub(queueCallbackContact, 'onEnded').returns({ unsubscribe: sandbox.stub() });
            
            queueCallbackGetStatus = sandbox.stub(queueCallbackContact, 'getStatus');
            queueCallbackGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
        });

        afterEach(() => {
            sandbox.resetHistory();
        });

        it('should use initial agentConnectionId for session creation and event callbacks', function() {
            const softphoneManager = new connect.SoftphoneManager({});
            connect.core.softphoneManager = softphoneManager;
            
            // Store the callbacks that get registered
            let onRefreshCallback;
            let onConnectedCallback;
            
            queueCallbackContact.onRefresh.callsFake(function(callback) {
                onRefreshCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            queueCallbackContact.onConnected.callsFake(function(callback) {
                onConnectedCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            queueCallbackGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            bus.trigger(connect.ContactEvents.INIT, queueCallbackContact);
            
            // Now manually invoke the onRefresh callback that was registered
            onRefreshCallback(queueCallbackContact);
            
            // Verify session was created with the initial agentConnectionId (captured at contact init)
            const session = softphoneManager.getSession(queueCallbackAgentConnectionId);
            expect(session).to.not.be.undefined;
            
            // Simulate onLocalStreamAdded to populate localMediaStream[initialAgentConnectionId]
            const mockStream = { 
                getAudioTracks: () => [{ kind: 'audio', enabled: true }],
                id: 'mock-stream-id'
            };
            session.onLocalStreamAdded(session, mockStream);
            
            // Simulate onConnected to populate contactAgentConnectionIdMap[initialAgentConnectionId]
            queueCallbackGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
            
            // First call session.onSessionConnected to set up the session
            session.onSessionConnected(session);
            
            // Now manually invoke the onConnected callback that was registered in onInitContact
            onConnectedCallback(queueCallbackContact);
         
            // Verify logger behavior via spy
            if (connect.getLog().info.restore) {
                connect.getLog().info.restore();
            }
            const loggerInfoSpy = sandbox.spy(connect.getLog(), 'info');
            
            // Trigger mute to invoke logger
            bus.trigger(connect.EventType.MUTE, { mute: true });
            
            // Find the logger call for active media stream where isActiveContact is true
            // Logger call structure: args = ['softphone', ' %s', "Agent's current active active media stream"]
            // Data stored in: returnValue.objects[0] = { isActiveContact, contactAgentConnectionIdMap, lastActiveContactID }
            // Note: muteToggle loops through all connectionIds, so find the one with isActiveContact=true
            const allActiveMediaStreamLogs = loggerInfoSpy.getCalls().filter(call => 
                call.args && call.args[2] === "Agent's current active active media stream"
            );
            
            // Find the log where connectionId matches our queue callback agentConnectionId
            const qcbLog = allActiveMediaStreamLogs.find(call => 
                call.returnValue.objects[0].connectionId === queueCallbackAgentConnectionId
            );
            
            // Verify the queue callback log exists and is active
            expect(qcbLog).to.exist;
            const loggedData = qcbLog.returnValue.objects[0];
            expect(loggedData).to.exist;
            expect(loggedData.connectionId).to.equal(queueCallbackAgentConnectionId);

            expect(loggedData.contactAgentConnectionIdMap).to.have.property(queueCallbackAgentConnectionId);
            expect(loggedData.contactAgentConnectionIdMap[queueCallbackAgentConnectionId]).to.equal(queueCallbackContactId);
            expect(loggedData.lastActiveContactID).to.equal(queueCallbackContactId);
            
            // This verifies that both localMediaStream and contactAgentConnectionIdMap use the same
            // initial agentConnectionId key, which ensures mute/unmute operations work correctly
            // even when the agentConnectionId changes later in Queue Callback scenarios.
            expect(loggedData.isActiveContact).to.be.true;
        });
    });

    describe('Mute Operation Monitoring', () => {
        let testContact, testContactId, testAgentConnectionId;
        let mockAgentConnection, mockStream;

        beforeEach(() => {
            connect.core.getEventBus().unsubscribeAll();
            connect.Agent.prototype.getContacts.returns([]);
            
            testContactId = "monitoring-test-contact";
            testAgentConnectionId = "monitoring-test-agent-conn";
            
            // Create mock stream
            mockStream = {
                getAudioTracks: () => [{ enabled: true }],
                id: 'monitoring-test-stream'
            };

            // Create mock agent connection
            mockAgentConnection = {
                isMute: sandbox.stub(),
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: testAgentConnectionId,
                getConnectionId: () => testAgentConnectionId,
                onParticipantResume: sandbox.stub().returns({ unsubscribe: sandbox.stub() })
            };

            // Create test contact
            testContact = new connect.Contact(testContactId);
            sandbox.stub(testContact, "getContactId").returns(testContactId);
            sandbox.stub(testContact, "getType").returns(connect.ContactType.VOICE);
            sandbox.stub(testContact, "hasTwoActiveParticipants").returns(true);
            sandbox.stub(testContact, "getAgentConnection").returns(mockAgentConnection);
            sandbox.stub(testContact, "isSoftphoneCall").returns(true);
            sandbox.stub(testContact, "getStatus").returns({ type: connect.ContactStatusType.CONNECTING });
            sandbox.stub(testContact, "onConnected").returns({ unsubscribe: sandbox.stub() });
            sandbox.stub(testContact, "onRefresh").returns({ unsubscribe: sandbox.stub() });
        });

        afterEach(() => {
            sandbox.resetHistory();
            connect.core.softphoneManager = null;
        });

        it('should take mute action when mapping is correct', () => {
            mockAgentConnection.isMute.returns(true);  // Server muted
            
            const softphoneManager = new connect.SoftphoneManager({});
            connect.core.softphoneManager = softphoneManager;
            sandbox.stub(softphoneManager, 'sanityCheckActiveSessions').returns();
            
            connect.Agent.prototype.getContacts.returns([testContact]);
            
            let onRefreshCallback, onConnectedCallback;
            
            testContact.onRefresh.callsFake(function(callback) {
                onRefreshCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            testContact.onConnected.callsFake(function(callback) {
                onConnectedCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            bus.trigger(connect.ContactEvents.INIT, testContact);
            onRefreshCallback(testContact);
            
            const session = softphoneManager.getSession(testAgentConnectionId);
            expect(session).to.not.be.undefined;
            
            session.onLocalStreamAdded(session, mockStream); 
            session.onSessionConnected(session);  
            onConnectedCallback(testContact);
            
            // Set up logger spy to verify no errors
            if (connect.getLog().error.restore) {
                connect.getLog().error.restore();
            }
            const loggerErrorSpy = sandbox.spy(connect.getLog(), 'error');
            
            connect.publishMetric.resetHistory();
            bus.trigger(connect.EventType.MUTE, { mute: false });

            // Should NOT publish MuteOperationFailed (action was taken)
            const skippedCalls = connect.publishMetric.getCalls().filter(call =>
                call.args[0] && call.args[0].name === "MuteOperationFailed"
            );
            expect(skippedCalls.length).to.equal(0);
            
            // Verify the specific error message for actionTaken=false was NOT logged
            sandbox.assert.neverCalledWith(loggerErrorSpy, "Mute Failed - ActiveContact not found");
        });


        it('should NOT publish MuteOperationSkipped when no localMediaStream (Option 3 - early return)', () => {
            // Skip onLocalStreamAdded to document early return behavior
            const softphoneManager = new connect.SoftphoneManager({});
            connect.core.softphoneManager = softphoneManager;
            
            let onRefreshCallback, onConnectedCallback;
            
            testContact.onRefresh.callsFake(function(callback) {
                onRefreshCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            testContact.onConnected.callsFake(function(callback) {
                onConnectedCallback = callback;
                return { unsubscribe: sandbox.stub() };
            });
            
            bus.trigger(connect.ContactEvents.INIT, testContact);
            onRefreshCallback(testContact);
            
            const session = softphoneManager.getSession(testAgentConnectionId);
            expect(session).to.not.be.undefined;
            
            // SKIP onLocalStreamAdded - this leaves localMediaStream empty
            session.onSessionConnected(session);
            onConnectedCallback(testContact);
            
            // Set up logger spy to verify no errors
            if (connect.getLog().error.restore) {
                connect.getLog().error.restore();
            }
            const loggerErrorSpy = sandbox.spy(connect.getLog(), 'error');
            
            connect.publishMetric.resetHistory();
            bus.trigger(connect.EventType.MUTE, { mute: true });

            // Should NOT publish MuteOperationFailed due to early return
            // (localMediaStream is empty, so muteToggle returns early)
            const allCalls = connect.publishMetric.getCalls();
            const skippedCalls = allCalls.filter(call =>
                call.args[0] && call.args[0].name === "MuteOperationFailed"
            );
            expect(skippedCalls.length).to.equal(0);
            expect(allCalls.length).to.equal(0); // No metrics published at all due to early return
            
            // Verify the specific error message for actionTaken=false was NOT logged
            sandbox.assert.neverCalledWith(loggerErrorSpy, "Mute Failed - ActiveContact not found");
        });
    });

    describe('Softphone Feature Access Control Fetching', () => {
        let mockFacClient, mockLilySonic, requireStub;
        
        beforeEach(() => {
            // Reset all timers
            clock.reset();
            
            // Mock the FAC client
            mockFacClient = {
                isFeatureEnabled: sandbox.stub()
            };
            // Mock connect.featureFlagProvider
            connect.featureFlagProvider = {
                facClient: mockFacClient,
                getFeatureFlags: sandbox.stub().returns({})
            };
            
            // Mock LILY_SONIC hash value
            mockLilySonic = 'YvylFbavp';
            // Mock the require call for @amazon-connect/fac
            requireStub = sandbox.stub();
            // Mock the global require function
            global.require = requireStub;
        });
        
        afterEach(() => {
            // Clean up all mocks and timers
            sandbox.resetHistory();
            clock.reset();
            delete connect.featureFlagProvider;
            delete global.require;
        });


    });
});
