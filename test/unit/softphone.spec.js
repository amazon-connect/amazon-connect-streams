require("../unit/test-setup.js");

describe('SoftphoneManager', function () {
    describe('#SoftphoneManager RTC session', function () {
        var bus,
            contact,
            contactId;

        before(function () {
            bus = connect.core.getEventBus(),
                contactId = "1234567890",
                contact = new connect.Contact(contactId),

            sinon.stub(contact, "isSoftphoneCall").returns(true);
            sinon.stub(contact, "isInbound").returns(true);
            sinon.stub(contact, "getState").returns({
                type: connect.ContactStateType.CONNECTING
            });
            sinon.stub(connect, 'RTCSession').returns({});

            sinon.stub(connect, 'isOperaBrowser').returns(true);
            sinon.stub(connect, 'getOperaBrowserVersion').returns(20);
            sinon.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sinon.stub().returns({
                    callConfigJson: "{}"
                })
            });

            sinon.stub(connect.Conduit.prototype, "sendUpstream").returns(function(){});
            sinon.stub(connect.Agent.prototype, "getContacts").returns([]);
        });

        after(function () {
            contact.isSoftphoneCall.restore();
            contact.isInbound.restore();
            contact.getAgentConnection.restore();
            contact.getState.restore();
            connect.isOperaBrowser.restore();
            connect.getOperaBrowserVersion.restore();
            connect.RTCSession.restore();
            connect.Conduit.prototype.sendUpstream.restore();
            connect.Agent.prototype.getContacts();
        });

        it('RTC session created for an incoming contact', function () {
            var softphoneManager = new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert(connect.RTCSession.calledOnce);
        });

        it('RTC session will not be created for the contact which is already connected with one RTC session', function () {
            contact.getState.restore();
            sinon.stub(contact, "getState").returns({
                type: connect.ContactStateType.CONNECTED
            });
            connect.RTCsession = sinon.spy();
            var softphoneManager = new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert(connect.RTCsession.notCalled);
        });

        describe("FIXME", function () {
            it('RTC session is not created in case of contact INIT event is missed!', function () {
                connect.RTCsession = sinon.spy();
                var softphoneManager = new connect.SoftphoneManager({});
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                assert(connect.RTCsession.notCalled);
            });
            // Include the test cases once we merge the changes
            it('Multiple RTC session should not be created in case of voice system failures!')
        });
    });
});
