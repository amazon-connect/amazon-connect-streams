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

    function contactStubHelper(contactStubMethodToOutput) {
        sinon.stub(contact, "getType").returns(contactStubMethodToOutput.contactType);
        sinon.stub(contact, "isSoftphoneCall").returns(contactStubMethodToOutput.isSoftphoneCall);
        sinon.stub(contact, "isInbound").returns(contactStubMethodToOutput.isInbound);   
    }

    describe('#connect.VoiceRingtoneEngine', function () {
        beforeEach(function () {
            sinon.stub(connect.Agent.prototype, "getContacts").returns([]); 
            this.ringtoneEngine = new connect.VoiceRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.ringtoneEngine, "_ringtoneSetup");
          
            assert.doesNotThrow(this.ringtoneEngine._driveRingtone, Error, "Not implemented.");
        });

        afterEach(function () {
            sinon.restore();
        });

        it('validate the VoiceRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for VOICE calls', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.VOICE,
                isSoftphoneCall: true,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            // verify
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the VoiceRingtoneEngine should not call  _ringtoneSetup for non VOICE, non softphone calls', function () {
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

    describe('#connect.ChatRingtoneEngine', function () {
        beforeEach(function () {
            this.ringtoneEngine = new connect.ChatRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.ringtoneEngine, "_ringtoneSetup"); 
          
            assert.doesNotThrow(this.ringtoneEngine._driveRingtone, Error, "Not implemented.");
        });

        afterEach(function () {
            sinon.restore();
        });

        it('validate the ChatRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for CHAT contacts', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.CHAT,
                isSoftphoneCall: false,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);

            // verify
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the ChatRingtoneEngine should not call  _ringtoneSetup for non CHAT', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.QUEUE_CALLBACK,
                isSoftphoneCall: true,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
            
            // verify
            assert.isTrue(this.ringtoneSetup.notCalled);
        });
    });

    describe('#connect.TaskRingtoneEngine', function () {
        beforeEach(function () {
            this.ringtoneEngine = new connect.TaskRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.ringtoneEngine, "_ringtoneSetup");
               
            assert.doesNotThrow(this.ringtoneEngine._driveRingtone, Error, "Not implemented.");
        });

        afterEach(function () {
            sinon.restore();
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

    describe('#connect.QueueCallbackRingtoneEngine', function () {
        beforeEach(function () {
            this.ringtoneEngine = new connect.QueueCallbackRingtoneEngine(ringtoneObj);
            this.ringtoneSetup = sinon.stub(this.ringtoneEngine, "_ringtoneSetup"); 
          
            assert.doesNotThrow(this.ringtoneEngine._driveRingtone, Error, "Not implemented.");
        });

        afterEach(function () {
            sinon.restore();
        });

        it('validate the QueueCallbackRingtoneEngine implemements the _driveRingtone method and calls the  _ringtoneSetup for QUEUE_CALLBACK contacts', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.QUEUE_CALLBACK,
                isSoftphoneCall: false,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);

            // verify
            assert.isTrue(this.ringtoneSetup.withArgs(contact).calledOnce);
        });

        it('validate the QueueCallbackRingtoneEngine should not call  _ringtoneSetup for non QUEUE_CALLBACK', function () {
            // setup
            contactStubHelper({
                contactType: lily.ContactType.VOICE,
                isSoftphoneCall: true,
                isInbound: true
            });

            // enact
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
            
            // verify
            assert.isTrue(this.ringtoneSetup.notCalled);
        });
    });
});
