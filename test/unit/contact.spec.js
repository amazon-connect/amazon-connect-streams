require("./test-setup.js");

let sampleContactData = {
  "attributes": {},
  "channelContext": {},
  "connectSystemEndpoint": {
    "agentLogin": null,
    "emailAddress": "test@test.com",
    "endpointARN": null,
    "name": null,
    "phoneNumber": null,
    "queue": null,
    "type": "email_address"
  },
  "connections": [
    {
      "capabilities": null,
      "chatMediaInfo": null,
      "connectionId": "1231313",
      "endpoint": null,
      "forcedMute": null,
      "initial": true,
      "monitorCapabilities": null,
      "monitorStatus": null,
      "monitoringInfo": null,
      "mute": null,
      "quickConnectName": null,
      "softphoneMediaInfo": null,
      "state": {
        "timestamp": 1712867591.145,
        "type": "connected"
      },
      "type": "agent"
    }
  ],
  "contactAssociationId": "123",
  "contactDuration": "0",
  "contactFeatures": {},
  "contactId": "14d63069-a909-430e-bc9e-3bc41a1c5626",
  "customerEndpoint": {
    "agentLogin": null,
    "emailAddress": "test@test.com",
    "endpointARN": null,
    "name": null,
    "phoneNumber": null,
    "queue": null,
    "type": "email_address"
  },
  "description": null,
  "emailRecipients": {},
  "initialContactId": null,
  "initiationMethod": "inbound",
  "languageCode": "en-US",
  "name": "Name of the contact",
  "queue": {
    "name": null,
    "queueARN": "/queue/123"
  },
  "queueTimestamp": 1712867556.797,
  "references": {},
  "relatedContactId": "TEST_RELATED_CONTACT_ID",
  "segmentAttributes": {
    "connect:Direction": {
      "ValueString": "INBOUND"
    },
    "connect:Subtype": {
      "ValueString": "connect:Email"
    }
  },
  "state": {
    "timestamp": 1712867565.244,
    "type": "connected"
  },
  "type": "email"
};

describe('Contact APIs', () => {
  let contact;
  const contactId = "contactId";
  const mockSubtypeObject = { "connect:Subtype": { "ValueString": "mockType" } };

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


  describe("contact APIs", () => {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.restore();
    });

    beforeEach(function () {
      contact = new connect.Contact(contactId);
      sandbox.stub(contact, '_getData').returns(sampleContactData);
    });

    it('getRelatedContactId should return related contact id if exists', () => {
      const result = contact.getRelatedContactId();
      expect(result).to.equal("TEST_RELATED_CONTACT_ID");
    });

    it('getCustomerEndpoint should return customer endpoint info', () => {
      const result = contact.getCustomerEndpoint();
      expect(result).to.equal(sampleContactData.customerEndpoint);
    });

    it('getConnectSystemEndpoint should return agent endpoint info', () => {
      const result = contact.getConnectSystemEndpoint();
      expect(result).to.equal(sampleContactData.connectSystemEndpoint);
    });

    it('isInbound call should return based on initiationMethod ', () => {
      const result = contact._isInbound();
      expect(result).to.equal(true);
    });
  });


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