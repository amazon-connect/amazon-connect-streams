
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
        sandbox.stub(navigator.mediaDevices, 'getUserMedia').resolves({ getAudioTracks: () => [{ kind: "audio", enabled: true }] });
        sandbox.stub(navigator.permissions, 'query').resolves({ state: 'allowed ' });
        sandbox.stub(connect, 'publishMetric');
        sandbox.stub(connect, 'SoftphoneError');
        sandbox.stub(connect.SoftphoneManager, 'isBrowserSoftPhoneSupported').returns(true);
        sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
        stubbedIsChromeBrowser = sandbox.stub(connect, 'isChromeBrowser');
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
    });

    after(() => {
        sandbox.restore();
        // connect.agent.initialized = false;
    });

    describe('startSession', () => {
        let contact, contactId, agentConnectionId;
        let stubbedGetStatus;

        before(() => {
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            agentConnectionId = 'abcdefg';
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321'
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
            beforeEach(() => {
                stubbedRTCSessionConnect.resetHistory();
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should create RTC session and call session.connect()', function () {
                new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
            });
            it('should NOT create another RTC session if startSession is called twice', function () {
                const softphoneManager = new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTED });
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
            });
        });
        describe('firefox', () => {
            before(() => {
                stubbedIsChromeBrowser.returns(false);
                stubbedIsFirefoxBrowser.returns(true);
            });
            beforeEach(() => {
                stubbedRTCSessionConnect.resetHistory();
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
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
            });
            it('should pospone creating RTC session until startSession is called for multi tab scenario', function () {
                stubbedHasOtherConnectedCCPs.returns(true);
                const softphoneManager = new connect.SoftphoneManager({ allowGumRaceForNextSoftphoneMaster: false });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                sinon.assert.notCalled(stubbedRTCSessionConnect);

                softphoneManager.startSession();
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
            });
        });

        describe('VDIPlatform: CITRIX', () => {
            before(() => {
                stubbedIsChromeBrowser.returns(true);
                stubbedIsFirefoxBrowser.returns(false);
                stubbedIsFirefoxBrowser.returns(false);
            });
            beforeEach(() => {
                stubbedRTCSessionConnect.resetHistory();
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should create RTC session and call session.connect()', function () {
                const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "CITRIX" });
                stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                softphoneManager.startSession(contact, agentConnectionId);
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
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
                sinon.assert.calledOnce(stubbedRTCSessionConnect);
                expect(error).not.to.be.undefined;
            });
        });

            describe('VDIPlatform: AWS_WORKSPACE', () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                beforeEach(() => {
                    stubbedRTCSessionConnect.resetHistory();
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                it('should create RTC session and call session.connect()', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "AWS_WORKSPACE" });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedRTCSessionConnect);
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
                    sinon.assert.calledOnce(stubbedRTCSessionConnect);
                    expect(error).not.to.be.undefined;
                });
            });

            describe(`VDIPlatform: ${VDI_PLATFORMS.CITRIX_413}`, () => {
                before(() => {
                    connect.isChromeBrowser.returns(true);
                    connect.isFirefoxBrowser.returns(false);
                    connect.hasOtherConnectedCCPs.returns(false);
                });
                beforeEach(() => {
                    stubbedRTCSessionConnect.resetHistory();
                });
                afterEach(() => {
                    sandbox.resetHistory();
                });
                it('should create RTC session and call pcm.connect()', function () {
                    const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
                    stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
                    softphoneManager.startSession(contact, agentConnectionId);
                    sinon.assert.calledOnce(stubbedRTCSessionConnect);
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
                    sinon.assert.calledOnce(stubbedRTCSessionConnect);
                    expect(error).not.to.be.undefined;
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
    });

    describe('initialization', () => {
        beforeEach(() => {
            connect.SoftphoneManager.isBrowserSoftPhoneSupported.returns(true);
            connect.isChromeBrowser.returns(true);
            navigator.mediaDevices.getUserMedia.resolves({ getAudioTracks: () => [{ kind: "audio", enabled: true }] });
            connect.Agent.prototype.getContacts.returns([]);
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
            agentConnectionId = 'abcdefg';
            sandbox.spy(connect, "publishSoftphoneReport");
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321'
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
            agentConnectionId = 'abcdefg';
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            connect.RtcPeerConnectionFactory.returns({ get: sandbox.stub() });
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321'
            });
            stubbedGetStatus = sandbox.stub(contact, 'getStatus');
            sampleDeviceId = 'sample-device-id';
            dummyAudioTrack = { kind: 'dummy' };
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
});
