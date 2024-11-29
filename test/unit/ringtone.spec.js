require("../unit/test-setup.js");

describe('RingtoneEngine', () => {
    const sandbox = sinon.createSandbox();
    const clock = sandbox.useFakeTimers();
    const bus = new connect.EventBus();
    const contactId = "1234567890";
    const ringtoneObj = { ringtoneUrl: "ringtone.com" };
    const contact = new connect.Contact(contactId);

    function contactStubHelper(contactStubMethodToOutput) {
        sandbox.stub(contact, "getType").returns(contactStubMethodToOutput.contactType);
        sandbox.stub(contact, "isSoftphoneCall").returns(contactStubMethodToOutput.isSoftphoneCall);
        sandbox.stub(contact, "isInbound").returns(contactStubMethodToOutput.isInbound);
    }

    function createFakeAudio(customFakes = {}) {
        const { fakePlay, fakePause, fakeSetSinkId, fakeAddEventListener } = customFakes;
        global.Audio = sinon.fake.returns({
            play: fakePlay || sinon.fake(),
            pause: fakePause || sinon.fake(),
            setSinkId: fakeSetSinkId || sinon.fake(),
            addEventListener: fakeAddEventListener || sinon.fake()
        });
    }

    before(() => {
        connect.agent.initialized = true;
    });

    after(() => {
        connect.agent.initialized = false;
        sandbox.restore();
        clock.restore();
    });

    describe('#connect.VoiceRingtoneEngine', () => {
        let voiceRingtoneEngine;

        before(() => {
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.Agent.prototype, "getContacts");
            sandbox.stub(connect.VoiceRingtoneEngine.prototype, '_publishTelemetryEvent');
            sandbox.stub(contact, "getType");
            sandbox.stub(contact, "isSoftphoneCall");
            sandbox.stub(contact, "isInbound");
            sandbox.stub(contact, "getStatus");
            sandbox.stub(connect, 'ifMaster');
        });

        beforeEach(() => {
            connect.Agent.prototype.getContacts.returns([]);
            contact.getType.returns(connect.ContactType.VOICE);
            contact.isSoftphoneCall.returns(true);
            contact.isInbound.returns(true);
            connect.ifMaster.callsFake((topic, successCallback) => successCallback());
            contact.getStatus.returns({ type: connect.ContactStatusType.CONNECTING });
            createFakeAudio();
        });

        afterEach(() => {
            bus.unsubscribeAll();
            sandbox.resetHistory();
        });

        after(() => {
            sandbox.restore();
            clock.restore();
        });

        it('should load audio file with given url at initialization', () => {
            createFakeAudio({
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            sinon.assert.calledWith(global.Audio, ringtoneObj.ringtoneUrl);
            expect(voiceRingtoneEngine._audio.loop).to.be.true;
        });

        it('should not throw an error even if loading audio has failed at initialization', () => {
            createFakeAudio({
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'error') callback();
                }))
            });
            let error;
            try {
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.undefined;
        });

        it('should trigger ringtone for connecting calls if ringtone master, and stop it when contact is no longer in connecting/incoming state', () => {
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            sandbox.stub(voiceRingtoneEngine, '_startRingtone').resolves();
            sandbox.stub(voiceRingtoneEngine, '_stopRingtone');

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            sinon.assert.calledOnce(voiceRingtoneEngine._startRingtone);
            sandbox.resetHistory();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
            sinon.assert.calledOnce(voiceRingtoneEngine._stopRingtone);
            sandbox.resetHistory();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
            sinon.assert.calledOnce(voiceRingtoneEngine._stopRingtone);
            sandbox.resetHistory();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ENDED, contactId), contact);
            sinon.assert.calledOnce(voiceRingtoneEngine._stopRingtone);
            sandbox.resetHistory();

            contact.getStatus.returns({ type: connect.ContactStatusType.INCOMING });
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            sinon.assert.notCalled(voiceRingtoneEngine._stopRingtone);
            sandbox.resetHistory();

            contact.getStatus.returns({ type: connect.ContactStatusType.PENDING });
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            sinon.assert.calledOnce(voiceRingtoneEngine._stopRingtone);
        });

        it('should NOT trigger ringtone for connecting calls if the contact type is not VOICE or not softphone call or not inbound', () => {
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            sandbox.stub(voiceRingtoneEngine, '_startRingtone').resolves();

            contact.getType.returns(connect.ContactType.QUEUE_CALLBACK);
            contact.isSoftphoneCall.returns(true);
            contact.isInbound.returns(true);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            sinon.assert.notCalled(voiceRingtoneEngine._startRingtone);
            sandbox.resetHistory();

            contact.getType.returns(connect.ContactType.VOICE);
            contact.isSoftphoneCall.returns(false);
            contact.isInbound.returns(true);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            sinon.assert.notCalled(voiceRingtoneEngine._startRingtone);
            sandbox.resetHistory();

            contact.getType.returns(connect.ContactType.VOICE);
            contact.isSoftphoneCall.returns(true);
            contact.isInbound.returns(false);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            sinon.assert.notCalled(voiceRingtoneEngine._startRingtone);
        });

        it('should trigger ringtone for the case where a contact already exists in connecting state at initialization', () => {
            connect.Agent.prototype.getContacts.returns([contact]);
            sandbox.stub(connect.VoiceRingtoneEngine.prototype, '_startRingtone').resolves();
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);

            sinon.assert.calledOnce(voiceRingtoneEngine._startRingtone);
            connect.VoiceRingtoneEngine.prototype._startRingtone.restore();
        });

        it('should not start ringtone when not ringtone master', () => {
            connect.ifMaster.callsFake((topic, successCallback, failureCallback) => failureCallback());
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            sandbox.stub(voiceRingtoneEngine, '_startRingtone').resolves();

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            sinon.assert.notCalled(voiceRingtoneEngine._startRingtone);
        });

        it('Validate the ringtone engine attempts to start the ringtone only once when it plays successfully.', async () => {
            createFakeAudio({
                fakePlay: sinon.fake.resolves(),
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();

            await voiceRingtoneEngine._startRingtone(contact, 2);
            
            sinon.assert.calledOnce(voiceRingtoneEngine._audio.play);
            sinon.assert.notCalled(global.Audio);
        });

        it('Validate the ringtone engine attempts to start the ringtone multiple times on playback failure', async () => {
            createFakeAudio({
                fakePlay: sinon.fake.rejects('some error'),
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();

            let error;
            try {
                await voiceRingtoneEngine._startRingtone(contact, 2);
            } catch (e) {
                error = e;
            }

            sinon.assert.calledThrice(voiceRingtoneEngine._audio.play);
            sinon.assert.calledTwice(global.Audio);
            expect(error).to.have.lengthOf(3);
        });

        it('Validate the ringtone engine attempts to start the ringtone multiple times on load failure', async () => {
            createFakeAudio({
                fakePlay: sinon.fake.rejects('some error'),
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'error') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();

            let error;
            try {
                await voiceRingtoneEngine._startRingtone(contact, 2);
            } catch (e) {
                error = e;
            }

            sinon.assert.calledThrice(voiceRingtoneEngine._audio.play);
            sinon.assert.calledTwice(global.Audio);
            expect(error).to.have.lengthOf(3);
        });

        it('Validate the ringtone engine stops trying to start the ringtone after one success', async () => {
            const fakePlay = sinon.stub();
            fakePlay.onCall(0).rejects();
            fakePlay.onCall(1).resolves();
            fakePlay.onCall(2).throws();

            createFakeAudio({
                fakePlay,
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();
            voiceRingtoneEngine._deviceId = 'dummy-device-id';

            let error;
            try {
                await voiceRingtoneEngine._startRingtone(contact, 2);
            } catch (e) {
                error = e;
            }

            sinon.assert.calledTwice(voiceRingtoneEngine._audio.play);
            sinon.assert.calledWith(voiceRingtoneEngine._audio.setSinkId, 'dummy-device-id');
            sinon.assert.calledOnce(global.Audio);
            expect(error).to.be.undefined;
        });

        it('Validate the ringtone engine stops trying to start the ringtone after one success even if canplay event isnt triggered for some reasons', async () => {
            connect.agentApp.AppRegistry.stop = sinon.fake.resolves(); // needed for the test to pass, or else this throws a not defined errpr
            
            const fakePlay = sinon.stub();
            fakePlay.onCall(0).rejects();
            fakePlay.onCall(1).resolves();
            fakePlay.onCall(2).throws();

            createFakeAudio({ fakePlay });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            await clock.tickAsync(1000);
            global.Audio.resetHistory();

            let error;
            try {
                voiceRingtoneEngine._startRingtone(contact, 2);
                await clock.tickAsync(2000);
            } catch (e) {
                error = e;
            }

            sinon.assert.calledTwice(voiceRingtoneEngine._audio.play);
            sinon.assert.calledOnce(global.Audio);
            expect(error).to.be.undefined;
        });

        it('Validate the ringtone engine attempts to start the ringtone at only once with retries set to 0', async () => {
            createFakeAudio({
                fakePlay: sinon.fake.rejects('some error'),
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();

            let error;
            try {
                await voiceRingtoneEngine._startRingtone(contact, 0);
            } catch (e) {
                error = e;
            }
            
            sinon.assert.calledOnce(voiceRingtoneEngine._audio.play);
            sinon.assert.notCalled(global.Audio);
            expect(error).to.have.lengthOf(1);
        });

        it('Validate the ringtone engine attempts to start the ringtone at only once with retries set to less than 0', async function () {
            createFakeAudio({
                fakePlay: sinon.fake.rejects('some error'),
                fakeAddEventListener: sinon.fake(((eventType, callback) => {
                    if (eventType === 'canplay') callback();
                }))
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.resetHistory();

            let error;
            try {
                // Retries < 0 should never happen, but in case it does, it should only try once.
                await voiceRingtoneEngine._startRingtone(contact, -7);
            } catch (e) {
                error = e;
            }
            
            sinon.assert.calledOnce(voiceRingtoneEngine._audio.play);
            sinon.assert.notCalled(global.Audio);
            expect(error).to.have.lengthOf(1);
        });
    });

    describe('#connect.QueueCallbackRingtoneEngine', function () {

        before(function () {
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            this.queueCallbackRingtoneEngine = new connect.QueueCallbackRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sandbox.stub(this.queueCallbackRingtoneEngine, "_ringtoneSetup");
            assert.doesNotThrow(this.queueCallbackRingtoneEngine._driveRingtone, Error, "Not implemented.");
            sandbox.stub(contact, "getType").returns(lily.ContactType.QUEUE_CALLBACK);
        });

        after(function () {
            sandbox.restore();
        });

        it('validate the QueueCallbackRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for QUEUE_CALLBACK calls ', function () {
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the QueueCallbackRingtoneEngine should not call the _ringtoneSetup for Voice calls ', function () {
            contact.getType.restore();
            sandbox.stub(contact, "getType").returns(lily.ContactType.VOICE);
            this.ringtoneSetup.restore();
            this.ringtoneSetup = sandbox.stub(this.queueCallbackRingtoneEngine, "_ringtoneSetup");
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            assert.isTrue(this.ringtoneSetup.notCalled);
        });
    });

    describe('#connect.ChatRingtoneEngine', function () {
        before(function () {
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            this.chatRingtoneEngine = new connect.ChatRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sandbox.stub(this.chatRingtoneEngine, "_ringtoneSetup");
            assert.doesNotThrow(this.chatRingtoneEngine._driveRingtone, Error, "Not implemented.");
            sandbox.stub(contact, "getType").returns(lily.ContactType.CHAT);
            sandbox.stub(contact, "isInbound").returns(true);
            let connectionState;
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
                getContactData: () => ({ connections: [{ state: { type: "connecting" }}]}),
                getConnectionData: () => ({
                  isSilentMonitor: false,
                  state: { type: connectionState },
                  getMediaController: () => {}
                })
            });
        });

        after(function () {
            sandbox.restore();
        });

        it('validate the ChatRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for CHAT calls ', function () {
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the ChatRingtoneEngine should not call the _ringtoneSetup for Voice calls ', function () {
            contact.getType.restore();
            sandbox.stub(contact, "getType").returns(lily.ContactType.VOICE);
            this.ringtoneSetup.restore();
            this.ringtoneSetup = sandbox.stub(this.chatRingtoneEngine, "_ringtoneSetup");
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            assert.isTrue(this.ringtoneSetup.notCalled);
        });
    });

    describe('#connect.TaskRingtoneEngine', function () {
        beforeEach(function () {
            sandbox.stub(connect.core, "getEventBus").returns(bus);

            this.ringtoneEngine = new connect.TaskRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sandbox.stub(this.ringtoneEngine, "_ringtoneSetup");

            assert.doesNotThrow(this.ringtoneEngine._driveRingtone, Error, "Not implemented.");
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('validate the TaskRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for TASK contacts', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.TASK,
                isSoftphoneCall: false,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            // verify
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the TaskRingtoneEngine should not call  _ringtoneSetup for non TASK', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.QUEUE_CALLBACK,
                isSoftphoneCall: false,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            // verify
            assert.isTrue(this.ringtoneSetup.notCalled);
        });
    });

});
