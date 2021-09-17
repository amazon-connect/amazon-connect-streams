require("../unit/test-setup.js");

// TODO: Make these work as standalone, for some reason they require a initCCP call to not fail
describe('SoftphoneManager', function () {
    var sandbox = sinon.createSandbox();

    describe('#SoftphoneManager RTC session', function () {
        var bus,
            contact,
            contactId;

        before(function () {
            bus = new connect.EventBus();
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub()
            });
            contactId = "0000000000";
            contact = new connect.Contact(contactId);
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
                })
            });
            sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
        });

        after(function () {
            sandbox.restore();
        });

        afterEach(function () {
            contact.getStatus.restore();
        });

        it('RTC session created for a incoming contact', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTING
            });
            new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCSession.calledOnce);
        });

        it('RTC session will not be created for the contact which is already connected with one RTC session', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTED
            });
            connect.RTCsession = sandbox.spy();
            new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCsession.notCalled);
        });

        it('RTC session is not created in case of contact INIT event is missed!', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTING
            });
            connect.RTCsession = sandbox.spy();
            new connect.SoftphoneManager({});
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCsession.notCalled);
        });

        describe("FIXME", function () {
            // Include the test cases once we merge the changes
            it('Multiple RTC session should not be created in case of voice system failures!')
        });
    });

    

});
