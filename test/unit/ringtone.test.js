describe('RingtoneEngine', () => {
    const contactId = "1234567890";
    const ringtoneObj = { ringtoneUrl: "ringtone.com" };
    let bus;
    let contact;

    const CHAT_INBOUND = { contactType: connect.ContactType.CHAT, isSoftphoneCall: false, isCampaignPreview: false, isInbound: true };

    function contactStubHelper(contactStubMethodToOutput) {
        jest.spyOn(contact, "getType").mockReturnValue(contactStubMethodToOutput.contactType);
        jest.spyOn(contact, "isSoftphoneCall").mockReturnValue(contactStubMethodToOutput.isSoftphoneCall);
        jest.spyOn(contact, "isInbound").mockReturnValue(contactStubMethodToOutput.isInbound);
    }

    // Stubs a contact as an inbound softphone VOICE call in the CONNECTING state.
    function setVoiceConnectingContact() {
        jest.spyOn(contact, "getType").mockReturnValue(connect.ContactType.VOICE);
        jest.spyOn(contact, "isSoftphoneCall").mockReturnValue(true);
        jest.spyOn(contact, "isCampaignPreview").mockReturnValue(false);
        jest.spyOn(contact, "isInbound").mockReturnValue(true);
        jest.spyOn(contact, "getStatus").mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    }

    // Common setup for the Chat/Email engines: build the engine, stub _ringtoneSetup,
    // and stub an inbound connecting contact of the given type. Returns the spy.
    function setupConnectingEngine(EngineClass, contactType) {
        jest.spyOn(connect.core, "getEventBus").mockReturnValue(bus);
        const engine = new EngineClass(ringtoneObj);
        const ringtoneSetup = jest.spyOn(engine, "_ringtoneSetup").mockImplementation(() => {});
        expect(engine._driveRingtone).not.toThrow();
        jest.spyOn(contact, "getType").mockReturnValue(contactType);
        jest.spyOn(contact, "isInbound").mockReturnValue(true);
        let connectionState;
        jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
            getContactData: () => ({ connections: [{ state: { type: "connecting" } }] }),
            getConnectionData: () => ({
                isSilentMonitor: false,
                state: { type: connectionState },
                getMediaController: () => { }
            })
        });
        createFakeAudio();
        return { engine, ringtoneSetup };
    }

    // Returns an addEventListener stub that synchronously fires the given audio event.
    function fireOnEvent(eventName) {
        return jest.fn((eventType, callback) => { if (eventType === eventName) callback(); });
    }

    // Fires INIT then the given drive event, asserting _ringtoneSetup ran once for the contact.
    function expectRingtoneSetupOnDrive(ringtoneSetup, driveEvent) {
        bus.trigger(connect.ContactEvents.INIT, contact);
        bus.trigger(connect.core.getContactEventName(driveEvent, contactId), contact);
        expect(ringtoneSetup).toHaveBeenCalledTimes(1);
        expect(ringtoneSetup).toHaveBeenCalledWith(contact);
    }

    function createFakeAudio(customFakes = {}) {
        const { fakePlay, fakePause, fakeSetSinkId, fakeAddEventListener, paused } = customFakes;
        global.Audio = jest.fn().mockReturnValue({
            play: fakePlay || jest.fn().mockResolvedValue(undefined),
            pause: fakePause || jest.fn(),
            // setOutputDevice() calls .then on setSinkId's result, so it must be a thenable
            // (undefined throws). A never-settling promise avoids both the crash and an
            // unhandled rejection, and stops the success path from overwriting _deviceId.
            setSinkId: fakeSetSinkId || jest.fn().mockReturnValue(new Promise(() => {})),
            addEventListener: fakeAddEventListener || jest.fn(),
            paused: paused ?? false,
        });
    }

    beforeEach(() => {
        bus = new connect.EventBus();
        contact = new connect.Contact(contactId);
        connect.agent.initialized = true;
        jest.spyOn(connect.core, "getEventBus").mockReturnValue(bus);
        jest.spyOn(connect.Agent.prototype, "getContacts").mockReturnValue([]);
    });

    afterEach(() => {
        connect.agent.initialized = false;
        bus.unsubscribeAll();
    });

    describe('connect.VoiceRingtoneEngine', () => {
        let voiceRingtoneEngine;
        let agentConnectionStatusStub;

        beforeEach(() => {
            jest.spyOn(connect.VoiceRingtoneEngine.prototype, '_publishTelemetryEvent').mockImplementation(() => {});
            setVoiceConnectingContact();
            jest.spyOn(connect, 'ifMaster').mockImplementation((topic, successCallback) => successCallback());
            agentConnectionStatusStub = jest.fn().mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            jest.spyOn(contact, "getAgentConnection").mockReturnValue({ getStatus: agentConnectionStatusStub });
            createFakeAudio();
        });

        it('should load audio file with given url at initialization', () => {
            createFakeAudio({
                fakeAddEventListener: fireOnEvent('canplay')
            });
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            expect(global.Audio).toHaveBeenCalledWith(ringtoneObj.ringtoneUrl);
            expect(voiceRingtoneEngine._audio.loop).toBe(true);
        });

        it('should not throw an error even if loading audio has failed at initialization', () => {
            createFakeAudio({
                fakeAddEventListener: fireOnEvent('error')
            });
            let error;
            try {
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
        });

        it('should trigger ringtone for connecting calls if ringtone master, and stop it after contact is accepted', () => {
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            jest.spyOn(voiceRingtoneEngine, '_startRingtone').mockResolvedValue();
            jest.spyOn(voiceRingtoneEngine, '_stopRingtone').mockImplementation(() => {});

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });

            bus.trigger(connect.ContactEvents.INIT, contact);

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(voiceRingtoneEngine._startRingtone).toHaveBeenCalledTimes(1);
            voiceRingtoneEngine._startRingtone.mockClear();
            voiceRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
            expect(voiceRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            voiceRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
            expect(voiceRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            voiceRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ENDED, contactId), contact);
            expect(voiceRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            voiceRingtoneEngine._stopRingtone.mockClear();

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.INCOMING });
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            expect(voiceRingtoneEngine._stopRingtone).not.toHaveBeenCalled();
            voiceRingtoneEngine._stopRingtone.mockClear();

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.PENDING });
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            expect(voiceRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            voiceRingtoneEngine._stopRingtone.mockClear();
        });

        it('should NOT trigger ringtone for connecting calls if the contact type is not VOICE or not softphone call or not inbound', () => {
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            jest.spyOn(voiceRingtoneEngine, '_startRingtone').mockResolvedValue();

            contact.getType.mockReturnValue(connect.ContactType.QUEUE_CALLBACK);
            contact.isSoftphoneCall.mockReturnValue(true);
            contact.isCampaignPreview.mockReturnValue(false);
            contact.isInbound.mockReturnValue(true);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(voiceRingtoneEngine._startRingtone).not.toHaveBeenCalled();
            voiceRingtoneEngine._startRingtone.mockClear();

            contact.getType.mockReturnValue(connect.ContactType.VOICE);
            contact.isSoftphoneCall.mockReturnValue(false);
            contact.isCampaignPreview.mockReturnValue(false);
            contact.isInbound.mockReturnValue(true);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(voiceRingtoneEngine._startRingtone).not.toHaveBeenCalled();
            voiceRingtoneEngine._startRingtone.mockClear();

            contact.getType.mockReturnValue(connect.ContactType.VOICE);
            contact.isSoftphoneCall.mockReturnValue(true);
            contact.isCampaignPreview.mockReturnValue(false);
            contact.isInbound.mockReturnValue(false);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(voiceRingtoneEngine._startRingtone).not.toHaveBeenCalled();
        });

        it('should trigger ringtone for the case where a contact already exists in connecting state at initialization', () => {
            connect.Agent.prototype.getContacts.mockReturnValue([contact]);
            jest.spyOn(connect.VoiceRingtoneEngine.prototype, '_startRingtone').mockResolvedValue();
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);

            expect(voiceRingtoneEngine._startRingtone).toHaveBeenCalledTimes(1);
        });

        it('should not trigger ringtone for second voice contact', async () => {
            createFakeAudio({
                fakePlay: jest.fn().mockResolvedValue(),
                fakeAddEventListener: fireOnEvent('canplay')
            });
            connect.Agent.prototype.getContacts.mockReturnValue([contact, contact]);
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            global.Audio.mockClear();

            await voiceRingtoneEngine._startRingtone(contact, 2);

            expect(voiceRingtoneEngine._audio.play).not.toHaveBeenCalled();
            expect(global.Audio).not.toHaveBeenCalled();
        });

        it('should not start ringtone when not ringtone master', () => {
            connect.ifMaster.mockImplementation((topic, successCallback, failureCallback) => failureCallback());
            voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            jest.spyOn(voiceRingtoneEngine, '_startRingtone').mockResolvedValue();

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(voiceRingtoneEngine._startRingtone).not.toHaveBeenCalled();
        });

        // Each test swaps _audio AFTER construction: the constructor's unawaited setOutputDevice
        // keeps the default never-rejecting setSinkId, so a rejection here can't leak into a later test.
        describe("setOutputDevice", () => {
            beforeEach(() => {
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            });

            it('resolves with the deviceId and stores it when setSinkId succeeds', async () => {
                voiceRingtoneEngine._audio = { setSinkId: jest.fn().mockResolvedValue(undefined) };

                const result = await voiceRingtoneEngine.setOutputDevice('device-1');

                expect(result).toBe('device-1');
                expect(voiceRingtoneEngine._deviceId).toBe('device-1');
                expect(voiceRingtoneEngine._audio.setSinkId).toHaveBeenCalledWith('device-1');
            });

            it('rejects when audio.setSinkId() rejects', async () => {
                voiceRingtoneEngine._audio = { setSinkId: jest.fn().mockRejectedValue('boom') };

                await expect(voiceRingtoneEngine.setOutputDevice('device-1')).rejects.toContain(
                    'RingtoneEngineBase.setOutputDevice failed: audio.setSinkId() failed with error boom'
                );
            });

            it('rejects with "audio not found" when the audio element exists but has no setSinkId', async () => {
                voiceRingtoneEngine._audio = {}; // truthy audio, no setSinkId -> source reports "audio not found"

                await expect(voiceRingtoneEngine.setOutputDevice('device-1')).rejects.toContain(
                    'RingtoneEngineBase.setOutputDevice failed: audio not found.'
                );
            });

            it('rejects with "audio.setSinkId not found" when there is no audio element', async () => {
                voiceRingtoneEngine._audio = null;

                await expect(voiceRingtoneEngine.setOutputDevice('device-1')).rejects.toContain(
                    'RingtoneEngineBase.setOutputDevice failed: audio.setSinkId not found.'
                );
            });
        });

        describe("_startRingtone", () => {
            it('Validate the ringtone engine attempts to start the ringtone only once when it plays successfully.', async () => {
                createFakeAudio({
                    fakePlay: jest.fn().mockResolvedValue(),
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                await voiceRingtoneEngine._startRingtone(contact, 2);

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(1);
                expect(global.Audio).not.toHaveBeenCalled();
            });

            it('Validate the ringtone engine attempts to start the ringtone multiple times on playback failure', async () => {
                createFakeAudio({
                    fakePlay: jest.fn().mockRejectedValue('some error'),
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                let error;
                try {
                    await voiceRingtoneEngine._startRingtone(contact, 2);
                } catch (e) {
                    error = e;
                }

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(3);
                expect(global.Audio).toHaveBeenCalledTimes(2);
                expect(error).toHaveLength(3);
            });

            it('Validate the ringtone engine attempts to start the ringtone multiple times on load failure', async () => {
                createFakeAudio({
                    fakePlay: jest.fn().mockRejectedValue('some error'),
                    fakeAddEventListener: fireOnEvent('error')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                let error;
                try {
                    await voiceRingtoneEngine._startRingtone(contact, 2);
                } catch (e) {
                    error = e;
                }

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(3);
                expect(global.Audio).toHaveBeenCalledTimes(2);
                expect(error).toHaveLength(3);
            });

            it('Validate the ringtone engine stops trying to start the ringtone after one success', async () => {
                const fakePlay = jest.fn()
                    .mockRejectedValueOnce(new Error('rejected'))
                    .mockResolvedValueOnce()
                    .mockImplementationOnce(() => { throw new Error('thrown'); });

                createFakeAudio({
                    fakePlay,
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();
                voiceRingtoneEngine._deviceId = 'dummy-device-id';

                let error;
                try {
                    await voiceRingtoneEngine._startRingtone(contact, 2);
                } catch (e) {
                    error = e;
                }

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(2);
                expect(voiceRingtoneEngine._audio.setSinkId).toHaveBeenCalledWith('dummy-device-id');
                expect(global.Audio).toHaveBeenCalledTimes(1);
                expect(error).toBeUndefined();
            });

            it('Validate the ringtone engine stops trying to start the ringtone after one success even if canplay event isnt triggered for some reasons', async () => {
                jest.useFakeTimers();
                connect.agentApp = {
                    stopApp: jest.fn()
                };

                const fakePlay = jest.fn()
                    .mockRejectedValueOnce(new Error('rejected'))
                    .mockResolvedValueOnce()
                    .mockImplementationOnce(() => { throw new Error('thrown'); });

                createFakeAudio({ fakePlay });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                await jest.advanceTimersByTimeAsync(1000);
                global.Audio.mockClear();

                let error;
                try {
                    voiceRingtoneEngine._startRingtone(contact, 2);
                    await jest.advanceTimersByTimeAsync(2000);
                } catch (e) {
                    error = e;
                }

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(2);
                expect(global.Audio).toHaveBeenCalledTimes(1);
                expect(error).toBeUndefined();
                jest.useRealTimers();
            });

            it.each([0, -7])('plays once and rejects without retrying when retries is %i', async (retries) => {
                createFakeAudio({
                    fakePlay: jest.fn().mockRejectedValue('some error'),
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                let error;
                try {
                    await voiceRingtoneEngine._startRingtone(contact, retries);
                } catch (e) {
                    error = e;
                }

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(1);
                expect(global.Audio).not.toHaveBeenCalled();
                expect(error).toHaveLength(1);
            });

            // A campaign-preview contact only rings in the INCOMING state; CONNECTING/PENDING must not.
            it.each([
                ['incoming', connect.ContactStatusType.INCOMING, 1],
                ['connecting', connect.ContactStatusType.CONNECTING, 0],
                ['pending', connect.ContactStatusType.PENDING, 0],
            ])('only rings a %s preview contact when it is incoming', async (_label, statusType, expectedPlays) => {
                createFakeAudio({
                    fakePlay: jest.fn().mockResolvedValue(),
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                contact.getType.mockReturnValue(connect.ContactType.VOICE);
                contact.isSoftphoneCall.mockReturnValue(false);
                contact.isCampaignPreview.mockReturnValue(true);
                contact.isInbound.mockReturnValue(true);
                contact.getStatus.mockReturnValue({ type: statusType });

                await voiceRingtoneEngine._startRingtone(contact, 2);

                expect(voiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(expectedPlays);
                expect(global.Audio).not.toHaveBeenCalled();
            });

            it('Validate the ringtone engine does not play for connected voice contact', async () => {
                createFakeAudio({
                    fakePlay: jest.fn().mockResolvedValue(),
                    fakeAddEventListener: fireOnEvent('canplay')
                });
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
                global.Audio.mockClear();

                contact.getType.mockReturnValue(connect.ContactType.VOICE);
                contact.isSoftphoneCall.mockReturnValue(true);
                contact.isCampaignPreview.mockReturnValue(false);
                contact.isInbound.mockReturnValue(true);
                contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTED });

                await voiceRingtoneEngine._startRingtone(contact, 2);

                expect(voiceRingtoneEngine._audio.play).not.toHaveBeenCalled();
                expect(global.Audio).not.toHaveBeenCalled();
            });
        });

        describe("_stopRingtone", () => {
            it('pauses the audio element and resets currentTime', () => {
                createFakeAudio();
                voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);

                voiceRingtoneEngine._stopRingtone(contact);
                expect(voiceRingtoneEngine._audio.pause).toHaveBeenCalledTimes(1);
                expect(voiceRingtoneEngine._audio.currentTime).toBe(0);
            });
        });
    });


    describe('connect.QueueCallbackRingtoneEngine', () => {
        let queueCallbackRingtoneEngine;
        let ringtoneSetup;
        let agentConnectionStatusStub;

        beforeEach(() => {
            ringtoneSetup = jest.spyOn(connect.QueueCallbackRingtoneEngine.prototype, "_ringtoneSetup").mockImplementation(() => {});
            jest.spyOn(connect.QueueCallbackRingtoneEngine.prototype, '_publishTelemetryEvent').mockImplementation(() => {});
            jest.spyOn(contact, "getType").mockReturnValue(connect.ContactType.QUEUE_CALLBACK);
            jest.spyOn(contact, "isSoftphoneCall").mockReturnValue(true);
            jest.spyOn(contact, "isCampaignPreview").mockReturnValue(false);
            jest.spyOn(contact, "isInbound").mockReturnValue(true);
            jest.spyOn(contact, "getStatus").mockReturnValue({ type: connect.ContactStatusType.INCOMING });
            jest.spyOn(connect, 'ifMaster').mockImplementation((topic, successCallback) => successCallback());
            agentConnectionStatusStub = jest.fn().mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });
            jest.spyOn(contact, "getAgentConnection").mockReturnValue({ getStatus: agentConnectionStatusStub });
            createFakeAudio();
            queueCallbackRingtoneEngine = new connect.QueueCallbackRingtoneEngine(ringtoneObj);
        });

        it('validate the QueueCallbackRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for QUEUE_CALLBACK calls ', () => {
            expectRingtoneSetupOnDrive(ringtoneSetup, connect.ContactEvents.INCOMING);
        });

        it('validate the QueueCallbackRingtoneEngine should not call the _ringtoneSetup for Voice calls ', () => {
            contact.getType.mockReturnValue(lily.ContactType.VOICE);
            ringtoneSetup.mockRestore();
            ringtoneSetup = jest.spyOn(queueCallbackRingtoneEngine, "_ringtoneSetup").mockImplementation(() => {});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            expect(ringtoneSetup).not.toHaveBeenCalled();
        });

        it('should trigger ringtone for connecting calls if ringtone master, and stop it after contact is accepted', () => {
            jest.spyOn(queueCallbackRingtoneEngine, '_startRingtone').mockResolvedValue();
            jest.spyOn(queueCallbackRingtoneEngine, '_stopRingtone').mockImplementation(() => {});
            // Use the real _ringtoneSetup so the event subscriptions are wired up.
            ringtoneSetup.mockRestore();

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.INCOMING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });

            bus.trigger(connect.ContactEvents.INIT, contact);

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            expect(queueCallbackRingtoneEngine._startRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._startRingtone.mockClear();
            queueCallbackRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
            expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._stopRingtone.mockClear();

            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTED });

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.PENDING, contactId), contact);
            expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
            expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._stopRingtone.mockClear();

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ENDED, contactId), contact);
            expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            queueCallbackRingtoneEngine._stopRingtone.mockClear();
        });

        describe("onRefresh callback should invoke stopRingtone", () => {
            beforeEach(() => {
                jest.spyOn(queueCallbackRingtoneEngine, '_startRingtone').mockResolvedValue();
                jest.spyOn(queueCallbackRingtoneEngine, '_stopRingtone').mockImplementation(() => {});
                // Use the real _ringtoneSetup so onRefresh is wired up.
                ringtoneSetup.mockRestore();
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            });

            it("should invoke stopRingtone when contact status is not in incoming state", () => {
                contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.PENDING });
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            });

            it("should invoke stopRingtone when agent connection status is in connected state", () => {
                // contact status INCOMING so the first `|| ` operand is false, forcing
                // evaluation of the agent-connection branch. getStatus must be a FUNCTION
                // (source calls getAgentConnection().getStatus().type).
                contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.INCOMING });
                contact.getAgentConnection.mockReturnValue({
                    getStatus: jest.fn().mockReturnValue({ type: connect.ConnectionStateType.CONNECTED }),
                });
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                expect(queueCallbackRingtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('connect.ChatRingtoneEngine', () => {
        let chatRingtoneEngine;
        let ringtoneSetup;

        beforeEach(() => {
            ({ engine: chatRingtoneEngine, ringtoneSetup } = setupConnectingEngine(connect.ChatRingtoneEngine, lily.ContactType.CHAT));
        });

        it('validate the ChatRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for CHAT calls ', () => {
            expectRingtoneSetupOnDrive(ringtoneSetup, connect.ContactEvents.CONNECTING);
        });

        it('validate the ChatRingtoneEngine should call _stopRingtone for auto-accept contacts', () => {
            jest.spyOn(contact, 'isAutoAcceptEnabled').mockReturnValue(true);
            jest.spyOn(connect, 'ifMaster').mockImplementation((topic, successCallback) => successCallback());

            const localChatRingtoneEngine = new connect.ChatRingtoneEngine(ringtoneObj);

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(ringtoneSetup).toHaveBeenCalledTimes(1);

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);

            expect(localChatRingtoneEngine._audio.pause).toHaveBeenCalled();
        });

        it('validate the ChatRingtoneEngine should not call the _ringtoneSetup for Voice calls ', () => {
            contact.getType.mockReturnValue(lily.ContactType.VOICE);
            ringtoneSetup.mockRestore();
            ringtoneSetup = jest.spyOn(chatRingtoneEngine, "_ringtoneSetup").mockImplementation(() => {});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(ringtoneSetup).not.toHaveBeenCalled();
        });
    });

    describe('connect.EmailRingtoneEngine', () => {
        let emailRingtoneEngine;
        let ringtoneSetup;

        beforeEach(() => {
            ({ engine: emailRingtoneEngine, ringtoneSetup } = setupConnectingEngine(connect.EmailRingtoneEngine, lily.ContactType.EMAIL));
        });

        it('validate the EmailRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for EMAIL contacts ', () => {
            expectRingtoneSetupOnDrive(ringtoneSetup, connect.ContactEvents.CONNECTING);
        });

        it('validate the EmailRingtoneEngine should not call the _ringtoneSetup for any other contact types ', () => {
            contact.getType.mockReturnValue(lily.ContactType.TASK);
            ringtoneSetup.mockRestore();
            ringtoneSetup = jest.spyOn(emailRingtoneEngine, "_ringtoneSetup").mockImplementation(() => {});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(ringtoneSetup).not.toHaveBeenCalled();
        });
    });

    describe('connect.TaskRingtoneEngine', () => {
        let ringtoneEngine;
        let ringtoneSetup;

        beforeEach(() => {
            jest.spyOn(connect.core, "getEventBus").mockReturnValue(bus);

            ringtoneEngine = new connect.TaskRingtoneEngine(ringtoneObj);
            ringtoneSetup = jest.spyOn(ringtoneEngine, "_ringtoneSetup").mockImplementation(() => {});

            expect(ringtoneEngine._driveRingtone).not.toThrow();
        });

        it('validate the TaskRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for TASK contacts', () => {
            contactStubHelper({
                contactType: lily.ContactType.TASK,
                isSoftphoneCall: false,
                isCampaignPreview: false,
                isInbound: true
            });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            expect(ringtoneSetup).toHaveBeenCalledTimes(1);
            expect(ringtoneSetup).toHaveBeenCalledWith(contact);
        });

        it('validate the TaskRingtoneEngine should not call  _ringtoneSetup for non TASK', () => {
            contactStubHelper({
                contactType: lily.ContactType.QUEUE_CALLBACK,
                isSoftphoneCall: false,
                isCampaignPreview: false,
                isInbound: true
            });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            expect(ringtoneSetup).not.toHaveBeenCalled();
        });
    });

    describe('connect.AutoAcceptedRingtoneEngine', () => {

        let ringtoneEngine, ringtoneSetup;
        let isAutoAcceptEnabledMock;

        beforeEach(() => {
            jest.spyOn(connect.core, 'getEventBus').mockReturnValue(bus);
            jest.spyOn(connect.Agent.prototype, "getContacts").mockReturnValue([]);
            jest.spyOn(contact, "getStatus").mockReturnValue({ type: connect.ContactStatusType.ACCEPTED });
            jest.spyOn(connect, 'ifMaster').mockImplementation((topic, successCallback) => successCallback());
            jest.spyOn(contact, "getAgentConnection").mockImplementation(() => {});
            isAutoAcceptEnabledMock = jest.spyOn(contact, 'isAutoAcceptEnabled').mockImplementation(() => true);

            ringtoneEngine = new connect.AutoAcceptedRingtoneEngine(ringtoneObj);
            ringtoneSetup = jest.spyOn(ringtoneEngine, '_ringtoneSetup').mockImplementation(() => {});

            jest.spyOn(connect.AutoAcceptedRingtoneEngine.prototype, '_publishTelemetryEvent').mockImplementation(() => {});

            expect(ringtoneEngine._driveRingtone).not.toThrow();
        });

        // _driveRingtone wires onAccepted -> _ringtoneSetup identically for every accepted contact type (no per-type branch).
        it.each([
            ['TASK', { contactType: connect.ContactType.TASK, isInbound: true }, connect.ContactStatusType.CONNECTING],
            ['CHAT', { contactType: connect.ContactType.CHAT, isSoftphoneCall: false, isCampaignPreview: false, isInbound: true }, connect.ContactStatusType.CONNECTING],
            ['VOICE', { contactType: connect.ContactType.VOICE, isSoftphoneCall: true, isCampaignPreview: false, isInbound: true }, connect.ContactStatusType.CONNECTING],
            ['QCB', { contactType: connect.ContactType.QUEUE_CALLBACK, isSoftphoneCall: true, isCampaignPreview: false, isInbound: true }, connect.ContactStatusType.INCOMING],
        ])('_driveRingtone calls _ringtoneSetup for an accepted %s contact', (_label, stubs, stateType) => {
            contactStubHelper(stubs);
            jest.spyOn(contact, 'getState').mockReturnValue({ type: stateType, timestamp: new Date() });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);

            expect(ringtoneSetup).toHaveBeenCalledTimes(1);
            expect(ringtoneSetup).toHaveBeenCalledWith(contact);
        });

        it('should not trigger ringtone for accepted contacts if not ringtone master', () => {
            connect.ifMaster.mockImplementation((topic, successCallback, failureCallback) => failureCallback());
            jest.spyOn(ringtoneEngine, '_startRingtone').mockImplementation(() => {});
            contactStubHelper(CHAT_INBOUND);

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);

            expect(ringtoneEngine._startRingtone).not.toHaveBeenCalled();
        });

        it('should trigger ringtone for accepted contacts if ringtone master', () => {
            ringtoneSetup.mockRestore();
            connect.ifMaster.mockImplementation((topic, successCallback) => successCallback());

            contactStubHelper(CHAT_INBOUND);
            jest.spyOn(contact, 'getState').mockReturnValue({ type: 'connecting' });

            const startSpy = jest.spyOn(ringtoneEngine, '_startRingtone');

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);

            expect(startSpy).toHaveBeenCalledTimes(1);
        });

        it('should trigger stopRingtone for connected contacts if ringtone master and auto-accept is enabled', () => {
            ringtoneSetup.mockRestore();
            connect.ifMaster.mockImplementation((topic, successCallback) => successCallback());

            contactStubHelper(CHAT_INBOUND);
            jest.spyOn(contact, 'getState').mockReturnValue({ type: 'connecting' });

            jest.spyOn(ringtoneEngine, '_startRingtone').mockResolvedValue();
            jest.spyOn(ringtoneEngine, '_stopRingtone').mockImplementation(() => {});

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);

            expect(ringtoneEngine._stopRingtone).toHaveBeenCalledTimes(1);
        });

        it('should not trigger stopRingtone for connected contacts if ringtone master and auto-accept is disabled', () => {
            ringtoneSetup.mockRestore();
            connect.ifMaster.mockImplementation((topic, successCallback) => successCallback());

            isAutoAcceptEnabledMock.mockImplementation(() => false);

            contactStubHelper(CHAT_INBOUND);
            jest.spyOn(contact, 'getState').mockReturnValue({ type: 'connecting' });

            jest.spyOn(ringtoneEngine, '_startRingtone').mockResolvedValue();
            jest.spyOn(ringtoneEngine, '_stopRingtone').mockImplementation(() => {});

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);

            expect(ringtoneEngine._stopRingtone).not.toHaveBeenCalled();
        });

        it('_loadRingtone loads the audio with loop disabled (overriding the base default)', () => {
            const engine = new connect.AutoAcceptedRingtoneEngine(ringtoneObj);
            global.Audio.mockClear();
            engine._loadRingtone(ringtoneObj.ringtoneUrl);
            expect(global.Audio).toHaveBeenCalledWith(ringtoneObj.ringtoneUrl);
            expect(engine._audio.loop).toBe(false);
        });

        it('_loadRingtone rejects when no ringtoneUrl is provided', async () => {
            const engine = new connect.AutoAcceptedRingtoneEngine(ringtoneObj);
            await expect(engine._loadRingtone()).rejects.toThrow('ringtoneUrl is required!');
        });

        it('_canStartRingtone should return false if voice contact', () => {
            const autoAcceptedRingtoneEngine = new connect.AutoAcceptedRingtoneEngine(ringtoneObj);
            ringtoneSetup.mockRestore();
            connect.ifMaster.mockImplementation((topic, successCallback) => successCallback());

            contactStubHelper({
                contactType: connect.ContactType.VOICE,
                isSoftphoneCall: false,
                isCampaignPreview: false,
                isInbound: true,
            });
            jest.spyOn(contact, 'getState').mockReturnValue({ type: 'connecting' });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);

            expect(autoAcceptedRingtoneEngine._canStartRingtone(contact)).toBe(false);
        });
    });

    describe('connect.AdditionalVoiceRingtoneEngine', () => {
        let additionalVoiceRingtoneEngine;
        let agentConnectionStatusStub;

        beforeEach(() => {
            jest.spyOn(connect.AdditionalVoiceRingtoneEngine.prototype, '_publishTelemetryEvent').mockImplementation(() => {});
            setVoiceConnectingContact();
            jest.spyOn(connect, 'ifMaster').mockImplementation((topic, successCallback) => successCallback());
            agentConnectionStatusStub = jest.fn().mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            jest.spyOn(contact, "getAgentConnection").mockReturnValue({ getStatus: agentConnectionStatusStub });
            createFakeAudio();
        });

        it('should NOT trigger ringtone for the first voice contact', () => {
            additionalVoiceRingtoneEngine = new connect.AdditionalVoiceRingtoneEngine(ringtoneObj);

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });

            bus.trigger(connect.ContactEvents.INIT, contact);

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(additionalVoiceRingtoneEngine._audio.play).not.toHaveBeenCalled();
        });

        it('should trigger ringtone for the second voice contact', async () => {
            createFakeAudio({
                fakePlay: jest.fn().mockResolvedValue(),
                fakeAddEventListener: fireOnEvent('canplay')
            });

            connect.Agent.prototype.getContacts.mockReturnValue([contact, contact]);
            additionalVoiceRingtoneEngine = new connect.AdditionalVoiceRingtoneEngine(ringtoneObj);
            global.Audio.mockClear();

            await additionalVoiceRingtoneEngine._startRingtone(contact, 2);

            expect(additionalVoiceRingtoneEngine._audio.play).toHaveBeenCalledTimes(3);
            expect(global.Audio).not.toHaveBeenCalled();
        });

        it('_canStartRingtone should return false for first contact', () => {
            additionalVoiceRingtoneEngine = new connect.AdditionalVoiceRingtoneEngine(ringtoneObj);

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });

            bus.trigger(connect.ContactEvents.INIT, contact);

            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            expect(additionalVoiceRingtoneEngine._canStartRingtone(contact)).toBe(false);
        });

        it('_canStartRingtone should return true for second contact', () => {
            additionalVoiceRingtoneEngine = new connect.AdditionalVoiceRingtoneEngine(ringtoneObj);

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.CONNECTING });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            connect.Agent.prototype.getContacts.mockReturnValue([contact, contact]);

            expect(additionalVoiceRingtoneEngine._canStartRingtone(contact)).toBe(true);
        });

        it('checks for correct contact state for preview contacts', () => {
            additionalVoiceRingtoneEngine = new connect.AdditionalVoiceRingtoneEngine(ringtoneObj);

            contact.isCampaignPreview.mockReturnValue(true);

            contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.INCOMING });
            agentConnectionStatusStub.mockReturnValue({ type: connect.ConnectionStateType.INCOMING });

            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            connect.Agent.prototype.getContacts.mockReturnValue([contact, contact]);

            expect(additionalVoiceRingtoneEngine._canStartRingtone(contact)).toBe(true);
        });
    });
});
