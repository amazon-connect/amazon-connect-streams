const mochaJsdom = require("mocha-jsdom");

require("../unit/test-setup.js");

describe('SoftphoneManager', function () {
    jsdom({ url: "http://localhost" });
    
    var sandbox = sinon.createSandbox();

    describe('#SoftphoneManager RTC session', function () {
        var bus,
            contact,
            contactId,
            agentConnectionId;

        before(function () {
            bus = new connect.EventBus();
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub()
            });
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            agentConnectionId = 'abcdefg';
            var streamsFake = {
                getAudioTracks: () => {
                    return [{ kind: "audio", enabled: true, }];
                },
            };
            sandbox.stub(navigator.mediaDevices, 'enumerateDevices')
                .callsFake(() => new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([{
                            toJSON: () => ({
                                deviceId: "deviceId",
                                groupId: "groupId",
                                kind: "audioinput",
                                label: "Microphone"
                            })
                        }])
                    }, 500)
                }));
            sandbox.stub(navigator.mediaDevices, 'getUserMedia')
                .callsFake(() => new Promise((resolve) => {
                    resolve(streamsFake);
                }));
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            sandbox.stub(connect, 'RTCSession').returns({
                connect: sandbox.stub()
            });
            sandbox.stub(connect, 'isChromeBrowser').returns(true);
            sandbox.stub(connect, 'getChromeBrowserVersion').returns(79);
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321'
            });
            sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
            connect.agent.initialized = true;
        });

        after(function () {
            sandbox.restore();
            connect.agent.initialized = false;
        });

        describe('startSession', () => {
            it('should create RTC session', function () {
                sandbox.stub(contact, "getStatus").returns({
                    type: connect.ContactStatusType.CONNECTING
                });
                const softphoneManager = new connect.SoftphoneManager({});
                softphoneManager.startSession(contact, agentConnectionId);
                assert.isTrue(connect.RTCSession.calledOnce);
                contact.getStatus.restore();
            });
            it('RTC session will not be created for the contact which is already connected with one RTC session', function () {
                sandbox.stub(contact, "getStatus").returns({
                    type: connect.ContactStatusType.CONNECTED
                });
                connect.RTCsession = sandbox.spy();
                new connect.SoftphoneManager({});
                const softphoneManager = new connect.SoftphoneManager({});
                softphoneManager.startSession(contact, agentConnectionId);
                assert.isTrue(connect.RTCsession.notCalled);
                contact.getStatus.restore();
            });
            it('should throw an error if contact or agentConnectionId is not passed in', () => {
                new connect.SoftphoneManager({});
                const softphoneManager = new connect.SoftphoneManager({});
                let error;
                try {
                    softphoneManager.startSession();
                } catch (e) {
                    error = e;
                }
                expect(error).not.to.be.undefined;
            });
            it('should set userMedia to session object if passed in', () => {
                sandbox.stub(contact, "getStatus").returns({
                    type: connect.ContactStatusType.CONNECTING
                });
                const softphoneManager = new connect.SoftphoneManager({});
                const dummyUserMedia = { id: 'dummy' };
                softphoneManager.startSession(contact, agentConnectionId, dummyUserMedia);
                const session = softphoneManager.getSession('abcdefg');
                expect(session.mediaStream).to.equal(dummyUserMedia);
            });
        });

        describe("FIXME", function () {
            // Include the test cases once we merge the changes
            it('Multiple RTC session should not be created in case of voice system failures!')
        });
    });
});

describe('SoftphoneMasterCoordinator', () => {
    const sandbox = sinon.createSandbox();
    let isFramedStub;

    describe('constructor', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            isFramedStub = sandbox.stub(connect, 'isFramed');
        });
        after(() => {
            sandbox.restore();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        it('should set canCompeteForMaster to false if the CCP is embedded as medialess', () => {
            const softphoneParams = { allowFramedSoftphone: false };
            isFramedStub.returns(true);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator(softphoneParams);
            expect(softphoneMasterCoordinator.canCompeteForMaster).to.be.false;
            sinon.assert.notCalled(softphoneMasterCoordinator.setUpListenerForNewSoftphoneContact);
            sinon.assert.notCalled(softphoneMasterCoordinator.setUpListenerForTakeOverEvent);
        });
        it('should set canCompeteForMaster to true if the CCP is embedded with softphone enabled', () => {
            const softphoneParams = { allowFramedSoftphone: true };
            isFramedStub.returns(true);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator(softphoneParams);
            expect(softphoneMasterCoordinator.canCompeteForMaster).to.be.true;
            sinon.assert.calledOnce(softphoneMasterCoordinator.setUpListenerForNewSoftphoneContact);
            sinon.assert.calledOnce(softphoneMasterCoordinator.setUpListenerForTakeOverEvent);
        });
        it('should set canCompeteForMaster to true if the CCP is standalone', () => {
            const softphoneParams = {};
            isFramedStub.returns(false);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator(softphoneParams);
            expect(softphoneMasterCoordinator.canCompeteForMaster).to.be.true;
            sinon.assert.calledOnce(softphoneMasterCoordinator.setUpListenerForNewSoftphoneContact);
            sinon.assert.calledOnce(softphoneMasterCoordinator.setUpListenerForTakeOverEvent);
        });
    });

    describe('setUpListenerForNewSoftphoneContact', () => {
        let softphoneMasterCoordinator;
        before(() => {
            connect.core.eventBus = new connect.EventBus();
            sandbox.spy(connect, 'contact');
            sandbox.stub(connect, 'isFramed').returns(false);
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'competeForNextSoftphoneMaster');

            softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
        });
        after(() => {
            connect.core.eventBus = null;
            sandbox.restore();
        });
        it('should add an event listener to Contact INIT event', () => {
            sinon.assert.calledOnce(connect.contact);
        });
        describe('on Contact INIT', () => {
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should NOT call competeForNextSoftphoneMaster if the detected contact is not a softphone contact', () => {
                const nonSoftphoneContact = new connect.Contact('contact-id-123');
                nonSoftphoneContact.getAgentConnection = sinon.stub().returns({ connectionId: 'connection-id-abc' });
                nonSoftphoneContact.isSoftphoneCall = sinon.stub().returns(false);
                connect.core.getEventBus().trigger(connect.ContactEvents.INIT, nonSoftphoneContact);
                connect.core.getEventBus().trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, 'contact-id-123'), nonSoftphoneContact);
                sinon.assert.notCalled(softphoneMasterCoordinator.competeForNextSoftphoneMaster);
            });
            it('should NOT call competeForNextSoftphoneMaster if the detected softphone contact is not in connecting state', () => {
                const softphoneContact = new connect.Contact('contact-id-123');
                softphoneContact.getAgentConnection = sinon.stub().returns({ connectionId: 'connection-id-abc' });
                softphoneContact.isSoftphoneCall = sinon.stub().returns(true);
                softphoneContact.getStatus = sinon.stub().returns({ type: connect.ContactStatusType.ENDED });
                connect.core.getEventBus().trigger(connect.ContactEvents.INIT, softphoneContact);
                connect.core.getEventBus().trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, 'contact-id-123'), softphoneContact);
                sinon.assert.notCalled(softphoneMasterCoordinator.competeForNextSoftphoneMaster);
            });
            it('should call competeForNextSoftphoneMaster only once if the detected softphone contact is in connecting state', () => {
                const softphoneContact = new connect.Contact('contact-id-123');
                softphoneContact.getAgentConnection = sinon.stub().returns({ connectionId: 'connection-id-abc' });
                softphoneContact.isSoftphoneCall = sinon.stub().returns(true);
                softphoneContact.getStatus = sinon.stub().returns({ type: connect.ContactStatusType.CONNECTING });
                connect.core.getEventBus().trigger(connect.ContactEvents.INIT, softphoneContact);
                connect.core.getEventBus().trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, 'contact-id-123'), softphoneContact);
                connect.core.getEventBus().trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, 'contact-id-123'), softphoneContact);
                sinon.assert.calledOnce(softphoneMasterCoordinator.competeForNextSoftphoneMaster);
            });
        });
    });

    describe('setUpListenerForTakeOverEvent', () => {
        let stubbedGetUpstream;
        const PORT_A = 'port_A';
        const PORT_B = 'port_B';
        before(() => {
            sandbox.stub(connect, 'isFramed').returns(false);
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'terminateSoftphoneManager');
            stubbedGetUpstream = sandbox.stub(connect.core, 'getUpstream');
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        it('should call this.terminateSoftphoneManager() if other tab took over SOFTPHONE master', () => {
            connect.core.portStreamId = PORT_A;
            const response = {
                data: {
                    topic: connect.MasterTopics.SOFTPHONE,
                    takeOver: true,
                    masterId: PORT_B
                }
            };
            stubbedGetUpstream.returns({ onUpstream: (topic, cb) => cb(response) });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            sinon.assert.calledOnce(softphoneMasterCoordinator.terminateSoftphoneManager);
        });
        it('should NOT call this.terminateSoftphoneManager() if this tab took over SOFTPHONE master', () => {
            connect.core.portStreamId = PORT_A;
            const response = {
                data: {
                    topic: connect.MasterTopics.SOFTPHONE,
                    takeOver: true,
                    masterId: PORT_A
                }
            };
            stubbedGetUpstream.returns({ onUpstream: (topic, cb) => cb(response) });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            sinon.assert.notCalled(softphoneMasterCoordinator.terminateSoftphoneManager);
        });
        it('should NOT call this.terminateSoftphoneManager() when this tab called connect.ifMaster', () => {
            connect.core.portStreamId = PORT_A;
            const response = {
                data: {
                    topic: connect.MasterTopics.SOFTPHONE,
                    isMaster: true,
                    masterId: PORT_A
                }
            };
            stubbedGetUpstream.returns({ onUpstream: (topic, cb) => cb(response) });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            sinon.assert.notCalled(softphoneMasterCoordinator.terminateSoftphoneManager);
        });
    });

    describe('setUserMediaStream', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect, 'assertNotNull');
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        it('should set the given stream object to this.userMediaStream', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const userMediaStream = { id: 'dummy' };
            softphoneMasterCoordinator.setUserMediaStream(userMediaStream);
            expect(softphoneMasterCoordinator.userMediaStream).to.equal(userMediaStream);
        });
        it('should assert if no stream object is passed in', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.setUserMediaStream();
            sinon.assert.calledOnce(connect.assertNotNull);
        });
    });

    describe('setTargetContact', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect, 'assertNotNull');
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        it('should set the given contact object to this.targetContact', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const contact = { contactId: 'dummy' };
            softphoneMasterCoordinator.setTargetContact(contact);
            expect(softphoneMasterCoordinator.targetContact).to.equal(contact);
        });
        it('should assert if no contact object is passed in', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.setTargetContact();
            sinon.assert.calledOnce(connect.assertNotNull);
        });
    });

    describe('competeForNextSoftphoneMaster', () => {
        let clock;
        let stubbedIfMaster;
        let stubbedGetUserMedia, stubbedSetUserMediaStream, stubbedBecomeNextSoftphoneMasterIfNone,
            stubbedStartSoftphoneSession, stubbedHandleErrorInCompeteForNextSoftphoneMaster,
            stubbedCleanup, stubbedPollForTabFocus, stubbedTakeOverSoftphoneMaster;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedIfMaster = sandbox.stub(connect, 'ifMaster');
            stubbedGetUserMedia = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'getUserMedia');
            stubbedSetUserMediaStream = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUserMediaStream');
            stubbedBecomeNextSoftphoneMasterIfNone = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'becomeNextSoftphoneMasterIfNone');
            stubbedStartSoftphoneSession = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'startSoftphoneSession');
            stubbedHandleErrorInCompeteForNextSoftphoneMaster = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'handleErrorInCompeteForNextSoftphoneMaster');
            stubbedCleanup = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'cleanup');
            stubbedPollForTabFocus = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'pollForTabFocus');
            stubbedTakeOverSoftphoneMaster = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'takeOverSoftphoneMaster');
        });
        beforeEach(() => {
            stubbedGetUserMedia.resolves();
            stubbedSetUserMediaStream.resolves();
            stubbedBecomeNextSoftphoneMasterIfNone.resolves();
            stubbedStartSoftphoneSession.resolves();
            stubbedHandleErrorInCompeteForNextSoftphoneMaster.resolves();
            stubbedCleanup.resolves();
            stubbedPollForTabFocus.resolves();
            stubbedTakeOverSoftphoneMaster.resolves();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        describe('I am the softphone master tab', () => {
            before(() => {
                stubbedIfMaster.callsFake((topic, f_true, f_else) => {
                    f_true();
                });
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should call methods in the proper order', async () => {
                const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
                softphoneMasterCoordinator.competeForNextSoftphoneMaster();
                await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
                sinon.assert.callOrder(
                    stubbedGetUserMedia,
                    stubbedSetUserMediaStream,
                    stubbedBecomeNextSoftphoneMasterIfNone,
                    stubbedStartSoftphoneSession,
                    stubbedCleanup
                );
            });
            it('should call handleErrorInCompeteForNextSoftphoneMaster when one of the methods in the chain failed', async () => {
                stubbedBecomeNextSoftphoneMasterIfNone.rejects();
                const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
                softphoneMasterCoordinator.competeForNextSoftphoneMaster();
                await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
                sinon.assert.callOrder(
                    stubbedGetUserMedia,
                    stubbedSetUserMediaStream,
                    stubbedBecomeNextSoftphoneMasterIfNone,
                    stubbedHandleErrorInCompeteForNextSoftphoneMaster,
                    stubbedCleanup
                );
            });
        });
        describe('I am NOT the softphone master tab', () => {
            before(() => {
                stubbedIfMaster.callsFake((topic, f_true, f_else) => {
                    f_else();
                });
            });
            afterEach(() => {
                sandbox.resetHistory();
            });
            it('should call methods in the proper order', async () => {
                const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
                softphoneMasterCoordinator.competeForNextSoftphoneMaster();
                await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
                sinon.assert.callOrder(
                    stubbedPollForTabFocus,
                    stubbedGetUserMedia,
                    stubbedSetUserMediaStream,
                    stubbedBecomeNextSoftphoneMasterIfNone,
                    stubbedTakeOverSoftphoneMaster,
                    stubbedStartSoftphoneSession,
                    stubbedCleanup
                );
            });
            it('should call handleErrorInCompeteForNextSoftphoneMaster when one of the methods in the chain failed', async () => {
                stubbedBecomeNextSoftphoneMasterIfNone.rejects();
                const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
                softphoneMasterCoordinator.competeForNextSoftphoneMaster();
                await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
                sinon.assert.callOrder(
                    stubbedPollForTabFocus,
                    stubbedGetUserMedia,
                    stubbedSetUserMediaStream,
                    stubbedBecomeNextSoftphoneMasterIfNone,
                    stubbedHandleErrorInCompeteForNextSoftphoneMaster,
                    stubbedCleanup
                );
            });
        });
    });

    describe('getUserMedia', () => {
        let clock;
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedCheckIfContactIsInConnectingState, stubbedGetUserMedia;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedCheckIfContactIsInConnectingState = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'checkIfContactIsInConnectingState');
            stubbedGetUserMedia = sandbox.stub(navigator.mediaDevices, 'getUserMedia');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            sandbox.restore();
        });
        it('should reject promise when it reaches timeout', async () => {
            stubbedCheckIfContactIsInConnectingState.returns(new Promise(() => {}));
            stubbedGetUserMedia.returns(new Promise(() => {}));

            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.getUserMedia()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.notCalled(stubbedThenHandler);
            await clock.tickAsync(connect.SoftphoneMasterCoordinator.GUM_TIMEOUT);
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.GUM_TIMEOUT);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should reject promise when the contact is no longer in connecting state', async () => {
            stubbedCheckIfContactIsInConnectingState.rejects(Error(connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING));
            stubbedGetUserMedia.returns(new Promise(() => {}));
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.getUserMedia()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should reject promise when getUserMedia fails', async () => {
            stubbedCheckIfContactIsInConnectingState.returns(new Promise(() => {}));
            stubbedGetUserMedia.rejects(Error('UNKONWN_ERROR'));
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.getUserMedia()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, 'UNKONWN_ERROR');
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should resolve promise with the grabbed stream when getUserMedia succeeds in time', async () => {
            stubbedCheckIfContactIsInConnectingState.returns(new Promise(() => {}));
            const dummyUserMediaStream = { id: 'dummy' };
            stubbedGetUserMedia.resolves(dummyUserMediaStream);
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.getUserMedia()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.calledWith(stubbedThenHandler, dummyUserMediaStream);
        });
    });

    describe('pollForTabFocus', () => {
        jsdom({ url: "https://abc.awsapps.com/connect/ccp-v2" });
        let clock;
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedCheckIfContactIsInConnectingState, stubbedDocumentHasFocus;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedCheckIfContactIsInConnectingState = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'checkIfContactIsInConnectingState');
            stubbedDocumentHasFocus = sandbox.stub(document, 'hasFocus');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            sandbox.restore();
        });
        it('should reject promise when it reaches timeout', async () => {
            stubbedCheckIfContactIsInConnectingState.returns(new Promise(() => {}));
            stubbedDocumentHasFocus.returns(false);

            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.pollForTabFocus()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.notCalled(stubbedThenHandler);
            await clock.tickAsync(connect.SoftphoneMasterCoordinator.TAB_FOCUS_TIMEOUT);
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.TAB_FOCUS_TIMEOUT);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should reject promise when the contact is no longer in connecting state', async () => {
            stubbedCheckIfContactIsInConnectingState.rejects(Error(connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING));
            stubbedDocumentHasFocus.returns(false);
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.getUserMedia()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should resolve promise when document is focused at interval loop', async () => {
            stubbedCheckIfContactIsInConnectingState.returns(new Promise(() => {}));
            stubbedDocumentHasFocus.returns(true);

            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.pollForTabFocus()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.notCalled(stubbedThenHandler);
            await clock.tickAsync(connect.SoftphoneMasterCoordinator.TAB_FOCUS_POLLING_INTERVAL);
            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.calledOnce(stubbedThenHandler);
        });
    });

    describe('checkIfContactIsInConnectingState', () => {
        let clock;
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedGetAgentDataProvider;
        before(() => {
            clock = sinon.useFakeTimers();
            connect.core.eventBus = new connect.EventBus();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedGetAgentDataProvider = sandbox.stub(connect.core, 'getAgentDataProvider');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            connect.core.eventBus = null;
            sandbox.restore();
        });
        it('should reject promise when the contact is no longer in connecting state', async () => {
            stubbedGetAgentDataProvider.returns(({
                getContactData: () => ({ state: { type: connect.ContactStatusType.MISSED } })
            }));
            const sampleContact = new connect.Contact('contact-id-123');
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.checkIfContactIsInConnectingState(sampleContact)
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should reject promise when the contact is no longer in connecting state on contact refresh', async () => {
            stubbedGetAgentDataProvider.returns(({
                getContactData: () => ({ state: { type: connect.ContactStatusType.CONNECTING } })
            }));
            let sampleContact = new connect.Contact('contact-id-123');
            
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.checkIfContactIsInConnectingState(sampleContact)
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.notCalled(stubbedThenHandler);

            // change the contact state from connecting to connected
            stubbedGetAgentDataProvider.returns(({
                getContactData: () => ({ state: { type: connect.ContactStatusType.CONNECTED } })
            }));
            sampleContact = new connect.Contact('contact-id-123');
            connect.core.getEventBus().trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, 'contact-id-123'), sampleContact);
            
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING);
            sinon.assert.notCalled(stubbedThenHandler);
        });
    });

    describe('becomeNextSoftphoneMasterIfNone', () => {
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedIfMaster;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedIfMaster = sandbox.stub(connect, 'ifMaster');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            sandbox.restore();
        });
        it('should resolve promise when the tab becomes the master of NEXT_SOFTPHONE topic', async () => {
            stubbedIfMaster.callsFake((topic, f_true, f_else) => {
                f_true();
            });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.becomeNextSoftphoneMasterIfNone()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.calledOnce(stubbedThenHandler);
        });
        it('should reject promise when the tab does NOT become the master of NEXT_SOFTPHONE topic', async () => {
            stubbedIfMaster.callsFake((topic, f_true, f_else) => {
                f_else();
            });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.becomeNextSoftphoneMasterIfNone()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.NEXT_SOFTPHONE_MASTER_ALREADY_EXISTS);
            sinon.assert.notCalled(stubbedThenHandler);
        });
    });

    describe('takeOverSoftphoneMaster', () => {
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedBecomeMaster, stubbedConnectAgent, stubbedCreateSoftphoneManager;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedBecomeMaster = sandbox.stub(connect, 'becomeMaster');
            stubbedConnectAgent = sandbox.stub(connect, 'agent');
            stubbedCreateSoftphoneManager = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'createSoftphoneManager');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            sandbox.restore();
        });
        it('should call connect.becomeMaster with SOFTPHONE topic', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.takeOverSoftphoneMaster();
            sinon.assert.calledWith(connect.becomeMaster, connect.MasterTopics.SOFTPHONE);
        });
        it('should reject promise if softphone is not enabled for the agent', async () => {
            stubbedBecomeMaster.callsFake((topic, f_true) => { f_true() });
            stubbedConnectAgent.callsFake((callback) => {
                callback({ isSoftphoneEnabled: () => false });
            });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.takeOverSoftphoneMaster()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.SOFTPHONE_NOT_ENABLED);
            sinon.assert.notCalled(stubbedThenHandler);
            sinon.assert.notCalled(stubbedCreateSoftphoneManager);
        });
        it('should resolve promise if this.createSoftphoneManager() succeeds', async () => {
            stubbedBecomeMaster.callsFake((topic, f_true) => { f_true() });
            stubbedConnectAgent.callsFake((callback) => {
                callback({ isSoftphoneEnabled: () => true });
            });
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.takeOverSoftphoneMaster()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledOnce(stubbedThenHandler);
            sinon.assert.notCalled(stubbedCatchHandler);
            sinon.assert.calledOnce(stubbedCreateSoftphoneManager);
        });
        it('should reject promise if this.createSoftphoneManager() fails', async () => {
            stubbedBecomeMaster.callsFake((topic, f_true) => { f_true() });
            stubbedConnectAgent.callsFake((callback) => {
                callback({ isSoftphoneEnabled: () => true });
            });
            stubbedCreateSoftphoneManager.throws(Error(connect.SoftphoneMasterCoordinator.errorTypes.CREATE_SOFTPHONE_MANAGER_FAILED));
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.takeOverSoftphoneMaster()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.notCalled(stubbedThenHandler);
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.CREATE_SOFTPHONE_MANAGER_FAILED);
            sinon.assert.calledOnce(stubbedCreateSoftphoneManager);
        });
    });

    describe('startSoftphoneSession', () => {
        let stubbedThenHandler, stubbedCatchHandler;
        let stubbedIsMediaStreamValid;
        before(() => {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedIsMediaStreamValid = sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'isMediaStreamValid');
            stubbedThenHandler = sandbox.stub();
            stubbedCatchHandler = sandbox.stub();
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            clock.restore();
            sandbox.restore();
            connect.core.softphoneManager = null;
        });
        it('should reject promise if connect.core.softphoneManager does not exist', async () => {
            connect.core.softphoneManager = null;
            stubbedIsMediaStreamValid.returns(true);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.startSoftphoneSession()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.NO_SOFTPHONE_MANAGER);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should reject promise if media stream is invalid', async () => {
            connect.core.softphoneManager = {};
            stubbedIsMediaStreamValid.returns(false);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.startSoftphoneSession()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.INVALID_MEDIA_STREAM);
            sinon.assert.notCalled(stubbedThenHandler);
        });
        it('should call startSession() if media stream valid. Should resolve promise only after the session completes or fails', async () => {
            const cb = {
                onSessionFailed: null,
                onSessionCompleted: null
            };
            connect.core.softphoneManager = {
                startSession: sandbox.stub().callsFake((contact, agentConnectionId, userMediaStream, callbacks) => {
                    cb.onSessionFailed = callbacks.onSessionFailed;
                    cb.onSessionCompleted = callbacks.onSessionCompleted;
                })
            };
            stubbedIsMediaStreamValid.returns(true);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const dummyUserMediaStream = { id: 'dummy' };
            softphoneMasterCoordinator.userMediaStream = dummyUserMediaStream;
            const contact = { getAgentConnection: sinon.stub().returns({ connectionId: 'abc' }) };
            softphoneMasterCoordinator.targetContact = contact;
            softphoneMasterCoordinator.startSoftphoneSession()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(connect.core.softphoneManager.startSession, contact);
            sinon.assert.notCalled(stubbedThenHandler);

            cb.onSessionFailed();
            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledOnce(stubbedThenHandler);
        });

        it('should call startSession() if media stream valid. Should reject promise if an error is thrown', async () => {
            connect.core.softphoneManager = {
                startSession: sandbox.stub().throws(Error('error'))
            };
            stubbedIsMediaStreamValid.returns(true);
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const dummyUserMediaStream = { id: 'dummy' };
            softphoneMasterCoordinator.userMediaStream = dummyUserMediaStream;
            const contact = { getAgentConnection: sinon.stub().returns({ connectionId: 'abc' }) };
            softphoneMasterCoordinator.targetContact = contact;
            softphoneMasterCoordinator.startSoftphoneSession()
                .then(stubbedThenHandler)
                .catch((e) => stubbedCatchHandler(e.message));

            await clock.tickAsync(0); // allow registered callbacks to promise.then/catch to be invoked
            sinon.assert.calledWith(connect.core.softphoneManager.startSession, contact);
            sinon.assert.notCalled(stubbedThenHandler);
            sinon.assert.calledWith(stubbedCatchHandler, connect.SoftphoneMasterCoordinator.errorTypes.START_SESSION_FAILED);
        });
    });

    describe('isMediaStreamValid', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
        });
        after(() => {
            sandbox.restore();
        });
        it('should return falsy if no object is passed in', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            expect(Boolean(softphoneMasterCoordinator.isMediaStreamValid())).to.be.false;
        });
        it('should return falsy if mediaStream.active is false', () => {
            const mediaStream = { active: false };
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            expect(Boolean(softphoneMasterCoordinator.isMediaStreamValid(mediaStream))).to.be.false;
        });
        it('should return truthy if mediaStream.active is true', () => {
            const mediaStream = { active: true };
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            expect(Boolean(softphoneMasterCoordinator.isMediaStreamValid(mediaStream))).to.be.true;
        });
    });

    describe('cleanup', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(global, 'clearTimeout');
            sandbox.stub(global, 'clearInterval');
        });
        after(() => {
            sandbox.restore();
        });
        it('should reset internal variables and clear timers', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.gumTimeoutId = 1;
            softphoneMasterCoordinator.tabFocusIntervalId = 2;
            softphoneMasterCoordinator.tabFocusTimeoutId = 3;
            softphoneMasterCoordinator.userMediaStream = {
                id: 'dummy',
                getTracks: sinon.stub().returns([])
            };
            softphoneMasterCoordinator.targetContact = {
                contactId: 'dummy',
                getAgentConnection: sinon.stub().returns({ connectionId: 'abc' })
            };

            softphoneMasterCoordinator.cleanup();

            expect(softphoneMasterCoordinator.gumTimeoutId).to.be.null;
            expect(softphoneMasterCoordinator.tabFocusIntervalId).to.be.null;
            expect(softphoneMasterCoordinator.tabFocusTimeoutId).to.be.null;
            expect(softphoneMasterCoordinator.userMediaStream).to.be.null;
            expect(softphoneMasterCoordinator.targetContact).to.be.null;
            sinon.assert.calledWith(global.clearTimeout, 1);
            sinon.assert.calledWith(global.clearInterval, 2);
            sinon.assert.calledWith(global.clearTimeout, 3);
        });
    });

    describe('createSoftphoneManager', () => {
        let stubbedSoftphoneManager;
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'terminateSoftphoneManager');
            sandbox.stub(connect, 'becomeMaster');
            stubbedSoftphoneManager = sandbox.stub(connect, 'SoftphoneManager');
        });
        after(() => {
            sandbox.restore();
            connect.core.softphoneManager = null;
        });
        it('should create a new softphone manager with softphoneParams', () => {
            connect.core.softphoneManager = null;
            const softphoneParams = { allowFramedSoftphone: true };
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator(softphoneParams);
            softphoneMasterCoordinator.createSoftphoneManager();
            sinon.assert.calledWith(connect.SoftphoneManager, softphoneParams);
        });
        it('should create a new softphone manager even if connect.core.softphoneManager already exists', () => {
            connect.core.softphoneManager = {};
            const softphoneParams = { allowFramedSoftphone: true };
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.createSoftphoneManager();
            sinon.assert.calledWith(connect.SoftphoneManager, softphoneParams);
            sinon.assert.calledOnce(softphoneMasterCoordinator.terminateSoftphoneManager);
            expect(connect.core.softphoneManager).to.not.equal({});
        });
        it('should throw an error if creating softphone manager failed', () => {
            connect.core.softphoneManager = null;
            stubbedSoftphoneManager.throws(Error('error'));
            const softphoneParams = { allowFramedSoftphone: true };
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator(softphoneParams);
            let error;
            try {
                softphoneMasterCoordinator.createSoftphoneManager();
            } catch (e) {
                error = e;
            }
            sinon.assert.calledWith(connect.SoftphoneManager, softphoneParams);
            expect(error.message).to.equal(connect.SoftphoneMasterCoordinator.errorTypes.CREATE_SOFTPHONE_MANAGER_FAILED);
            connect.SoftphoneManager.restore();
        });
    });

    describe('terminateSoftphoneManager', () => {
        let stubbedTerminate;
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            stubbedTerminate = sandbox.stub();
            connect.core.softphoneManager = { terminate: stubbedTerminate };
        });
        after(() => {
            sandbox.restore();
            connect.core.softphoneManager = null;
        });
        it('should call softphoneManager.terminate() if softphoneManager exists', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.terminateSoftphoneManager();
            sinon.assert.calledOnce(stubbedTerminate);
            expect(connect.core.softphoneManager).to.be.undefined;
        });
    });

    describe('addDetectedCall', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect, 'assertNotNull');
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        it('should add a new agentConnectionId to this.callsDetected map', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const agentConnectionId = 'abc';
            softphoneMasterCoordinator.addDetectedCall(agentConnectionId);
            expect(softphoneMasterCoordinator.callsDetected.abc).to.be.true;
        });
        it('should assert if no agentConnectionId is passed in', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.addDetectedCall();
            sinon.assert.calledOnce(connect.assertNotNull);
        });
    });

    describe('removeDetectedCall', () => {
        before(() => {
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForNewSoftphoneContact');
            sandbox.stub(connect.SoftphoneMasterCoordinator.prototype, 'setUpListenerForTakeOverEvent');
            sandbox.stub(connect, 'assertNotNull');
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        it('should remove a agentConnectionId from this.callsDetected map', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const agentConnectionId = 'abc';
            softphoneMasterCoordinator.callsDetected.abc = true;
            softphoneMasterCoordinator.removeDetectedCall(agentConnectionId);
            expect(softphoneMasterCoordinator.callsDetected.abc).to.be.undefined;
        });
        it('should not throw an error if the given agentConnectionId does not exist in the this.callsDetected map', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            const agentConnectionId = 'def';
            softphoneMasterCoordinator.callsDetected.abc = true;
            softphoneMasterCoordinator.removeDetectedCall(agentConnectionId);
            expect(softphoneMasterCoordinator.callsDetected.abc).to.be.true;
        });
        it('should assert if no agentConnectionId is passed in', () => {
            const softphoneMasterCoordinator = new connect.SoftphoneMasterCoordinator();
            softphoneMasterCoordinator.removeDetectedCall();
            sinon.assert.calledOnce(connect.assertNotNull);
        });
    });
});