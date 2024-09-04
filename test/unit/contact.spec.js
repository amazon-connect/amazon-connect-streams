require("./test-setup.js");

describe('Contact APIs', () => {
  let contact;
  const contactId = "contactId";
  const mockSubtypeObject = {"connect:Subtype": { "ValueString": "mockType" } };

  describe('SegmentAttributes', () => {
    describe('getContactSubtype', () => {
      beforeEach(function () {
        contact = new connect.Contact(contactId);
        contact.getSegmentAttributes = sinon.stub().returns({});
      });
  
      it('should return subtype when presented in segmentAttributes', () => {
        contact.getSegmentAttributes = sinon.stub().returns(mockSubtypeObject);
        const result = contact.getContactSubtype();
        expect(result).to.equal("mockType");
      });
  
      it('should return null when subtype is not present in segmentAttributes', () => {
        const result = contact.getContactSubtype();
        expect(result).to.be.a("null");
      });
    });
  })
  it('contact subscription apis', () => {
    connect.core.eventBus = new connect.EventBus();
    contact = new connect.Contact(contactId);

    function testEventSubscription(apiName, eventName) {
      const cb = sinon.stub();
      const sub = contact[apiName](cb);
      connect.core.getEventBus().trigger(contact.getEventName(eventName));
      sinon.assert.calledOnce(cb);
      sub.unsubscribe();
      cb.resetHistory();
      connect.core.getEventBus().trigger(contact.getEventName(eventName));
      sinon.assert.notCalled(cb);
    }

    const apiNameEventNameMap = {
      'onRefresh': connect.ContactEvents.REFRESH,
      'onIncoming': connect.ContactEvents.INCOMING,
      'onConnecting': connect.ContactEvents.CONNECTING,
      'onPending': connect.ContactEvents.PENDING,
      'onError': connect.ContactEvents.ERROR,
      'onAccepted': connect.ContactEvents.ACCEPTED,
      'onMissed': connect.ContactEvents.MISSED,
      'onEnded': connect.ContactEvents.ENDED,
      'onDestroy': connect.ContactEvents.DESTROYED,
      'onACW': connect.ContactEvents.ACW,
      'onConnected': connect.ContactEvents.CONNECTED,
      'onError': connect.ContactEvents.ERROR
    };

    for (const key in apiNameEventNameMap) {
      testEventSubscription(key, apiNameEventNameMap[key]);  
    }

    connect.core.eventBus = null;
  });
});