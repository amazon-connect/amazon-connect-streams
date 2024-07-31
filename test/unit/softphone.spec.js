
const { expect } = require("chai");
const mochaJsdom = require("mocha-jsdom");

require("../unit/test-setup.js");

// TODO: Make these work as standalone, for some reason they require a initCCP call to not fail
describe('SoftphoneManager', () => {
    jsdom({ url: "http://localhost" });
    const sandbox = sinon.createSandbox();
    let bus, stubbedRTCSessionConnect, stubbedReplaceTrack, stubbedIsChromeBrowser, stubbedIsFirefoxBrowser, stubbedHasOtherConnectedCCPs;

    before(() => {
        bus = new connect.EventBus();
        sandbox.stub(connect.core, "getEventBus").returns(bus);
        sandbox.spy(bus, 'subscribe');
        sandbox.stub(connect, 'RtcPeerConnectionFactory');
        stubbedRTCSessionConnect = sandbox.stub();
        stubbedReplaceTrack = sandbox.stub();
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
            // it('should set userMedia to session object if passed in', () => {
            //     const softphoneManager = new connect.SoftphoneManager({ VDIPlatform: "CITRIX" });
            //     stubbedGetStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            //     const dummyUserMedia = { id: 'dummy' };
            //     softphoneManager.startSession(contact, agentConnectionId, dummyUserMedia);
            //     const session = softphoneManager.getSession('abcdefg');
            //     expect(session.mediaStream).to.equal(dummyUserMedia);
            // });
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
})