require("../unit/test-setup.js");

describe('RingtoneEngine', function () {
    var sandbox = sinon.createSandbox();

    var bus,
        contactId,
        contact;

    before(function () {
        bus = new connect.EventBus();
        global.ringtoneObj = {
            ringtoneUrl: "ringtone.com"
        }
        contactId = "1234567890";
        contact = new connect.Contact(contactId);
    });

    function contactStubHelper(contactStubMethodToOutput) {
        sandbox.stub(contact, "getType").returns(contactStubMethodToOutput.contactType);
        sandbox.stub(contact, "isSoftphoneCall").returns(contactStubMethodToOutput.isSoftphoneCall);
        sandbox.stub(contact, "isInbound").returns(contactStubMethodToOutput.isInbound);
    }

    after(function () {
        sandbox.restore();
    });

    describe('#connect.VoiceRingtoneEngine', function () {
        before(function () {
            connect.agent.initialized = true;
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.Agent.prototype, "getContacts").returns([]);
            this.voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sandbox.stub(this.voiceRingtoneEngine, "_ringtoneSetup");
            assert.doesNotThrow(this.voiceRingtoneEngine._driveRingtone, Error, "Not implemented.");
            sandbox.stub(contact, "getType").returns(lily.ContactType.VOICE);
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
        });

        after(function () {
            connect.agent.initialized = false;
            sandbox.restore();
        });

        it('validate the VoiceRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for VOICE calls', function () {
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the VoiceRingtoneEngine should not call  _ringtoneSetup for non VOICE, non softphone calls', function () {
            contact.getType.restore();
            sandbox.stub(contact, "getType").returns(lily.ContactType.QUEUE_CALLBACK);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            this.ringtoneSetup.restore();
            this.ringtoneSetup = sandbox.stub(this.voiceRingtoneEngine, "_ringtoneSetup");
            assert.isTrue(this.ringtoneSetup.notCalled);
            contact.getType.restore();
            contact.isSoftphoneCall.restore();
            sandbox.stub(contact, "isSoftphoneCall").returns(false);
            sandbox.stub(contact, "getType").returns(lily.ContactType.VOICE);
            assert.isTrue(this.ringtoneSetup.notCalled);
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
