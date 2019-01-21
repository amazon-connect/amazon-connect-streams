require("../unit/test-setup.js");

describe('RingtoneEngine', function () {
    var bus,
        contactId,
        contact;

    before(function () {
        global.ringtoneObj = {
            ringtoneUrl: "ringtone.com"
        }
        bus = connect.core.getEventBus();
        contactId = "1234567890";
        contact = new connect.Contact(contactId);
    });

    describe('#connect.VoiceRingtoneEngine', function () {
        before(function () {
            sinon.stub(connect.Agent.prototype, "getContacts").returns([]);
            this.voiceRingtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.voiceRingtoneEngine, "_ringtoneSetup");
            assert.doesNotThrow(this.voiceRingtoneEngine._driveRingtone, Error, "Not implemented.");
            sinon.stub(contact, "getType").returns(lily.ContactType.VOICE);
            sinon.stub(contact, "isSoftphoneCall").returns(true);
            sinon.stub(contact, "isInbound").returns(true);
        });

        after(function () {
            contact.getType.restore();
            contact.isSoftphoneCall.restore();
            contact.isInbound.restore();
            connect.Agent.prototype.getContacts.restore();
        })

        it('validate the VoiceRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for VOICE calls', function () {
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            assert(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the VoiceRingtoneEngine should not call  _ringtoneSetup for non VOICE, non softphone calls', function () {
            contact.getType.restore();
            sinon.stub(contact, "getType").returns(lily.ContactType.QUEUE_CALLBACK);
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            this.ringtoneSetup.restore();
            this.ringtoneSetup = sinon.stub(this.voiceRingtoneEngine, "_ringtoneSetup");
            assert(this.ringtoneSetup.notCalled);
            contact.getType.restore();
            contact.isSoftphoneCall.restore();
            sinon.stub(contact, "isSoftphoneCall").returns(false);
            sinon.stub(contact, "getType").returns(lily.ContactType.VOICE);
            assert(this.ringtoneSetup.notCalled);
        });
    });

    describe('#connect.QueueCallbackRingtoneEngine', function () {

        before(function () {
            this.queueCallbackRingtoneEngine = new connect.QueueCallbackRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.queueCallbackRingtoneEngine, "_ringtoneSetup");
            assert.doesNotThrow(this.queueCallbackRingtoneEngine._driveRingtone, Error, "Not implemented.");
            sinon.stub(contact, "getType").returns(lily.ContactType.QUEUE_CALLBACK);
        });

        after(function () {
            contact.getType.restore();
        })

        it('validate the QueueCallbackRingtoneEngine implemements _driveRingtone method and calls the  _ringtoneSetup for QUEUE_CALLBACK calls ', function () {
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            assert(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the QueueCallbackRingtoneEngine should not call the _ringtoneSetup for Voice calls ', function () {
            contact.getType.restore();
            sinon.stub(contact, "getType").returns(lily.ContactType.VOICE);
            this.ringtoneSetup.restore();
            this.ringtoneSetup = sinon.stub(this.queueCallbackRingtoneEngine, "_ringtoneSetup");
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            assert(this.ringtoneSetup.notCalled);
        });
    });

});