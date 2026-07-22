const sampleContactData = {
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
      beforeEach(() => {
        contact = new connect.Contact(contactId);
        contact.getSegmentAttributes = jest.fn().mockReturnValue({});
      });

      it('should return subtype when presented in segmentAttributes', () => {
        contact.getSegmentAttributes = jest.fn().mockReturnValue(mockSubtypeObject);
        const result = contact.getContactSubtype();
        expect(result).toBe("mockType");
      });

      it('should return null when subtype is not present in segmentAttributes', () => {
        const result = contact.getContactSubtype();
        expect(result).toBeNull();
      });
    });
  });

  describe("contact.isSoftphoneCall", () => {
    it("should return true if the contact is voice and has a connection with softphoneMediaInfo populated", () => {
      jest.spyOn(connect.Contact.prototype, "_getData").mockReturnValue({
        contactId: "test-contact-id",
        type: "voice",
        connections: [{ connectionId: "test-connection-id" }],
      });
      jest.spyOn(connect, "VoiceConnection").mockReturnValue({
        getSoftphoneMediaInfo: () => true,
      });
      const contact = new connect.Contact(contactId);
      const result = contact.isSoftphoneCall();
      expect(result).toBe(true);
    });

    it("should return true if the contact is queue_callback and has a connection with softphoneMediaInfo populated", () => {
      jest.spyOn(connect.Contact.prototype, "_getData").mockReturnValue({
        contactId: "test-contact-id",
        type: "queue_callback",
        connections: [{ connectionId: "test-connection-id" }],
      });
      jest.spyOn(connect, "VoiceConnection").mockReturnValue({
        getSoftphoneMediaInfo: () => true,
      });
      const contact = new connect.Contact(contactId);
      const result = contact.isSoftphoneCall();
      expect(result).toBe(true);
    });

    it("should return false if the contact does not have a connection with softphoneMediaInfo", () => {
      jest.spyOn(connect.Contact.prototype, "_getData").mockReturnValue({
        contactId: "test-contact-id",
        type: "voice",
        connections: [{ connectionId: "test-connection-id" }],
      });
      jest.spyOn(connect, "VoiceConnection").mockReturnValue({
        getSoftphoneMediaInfo: () => false,
      });
      const contact = new connect.Contact(contactId);
      const result = contact.isSoftphoneCall();
      expect(result).toBe(false);
    });

    it("should return false if the contact is non-voice", () => {
      jest.spyOn(connect.Contact.prototype, "_getData").mockReturnValue({
        contactId: "test-contact-id",
        type: "chat",
        connections: [{ connectionId: "test-connection-id" }],
      });
      jest.spyOn(connect, "VoiceConnection").mockReturnValue({
        getSoftphoneMediaInfo: () => false,
      });
      const contact = new connect.Contact(contactId);
      const result = contact.isSoftphoneCall();
      expect(result).toBe(false);
    });
  });

  describe("contact APIs", () => {
    beforeEach(() => {
      contact = new connect.Contact(contactId);
      jest.spyOn(contact, '_getData').mockReturnValue(sampleContactData);
    });

    it('getRelatedContactId should return related contact id if exists', () => {
      const result = contact.getRelatedContactId();
      expect(result).toBe("TEST_RELATED_CONTACT_ID");
    });

    it('getContactAssociationId should return contact association id if it exists', () => {
      const result = contact.getContactAssociationId();
      expect(result).toBe("123");
    });

    it('getCustomerEndpoint should return customer endpoint info', () => {
      const result = contact.getCustomerEndpoint();
      expect(result).toBe(sampleContactData.customerEndpoint);
    });

    describe('isCustomerFirstCallback', () => {
      it('should return true if initiationMethod is "callback_customer_first_dialed"', () => {
        jest.spyOn(contact, 'getInitiationMethod').mockReturnValue('callback_customer_first_dialed');
        const result = contact.isCustomerFirstCallback();
        expect(result).toBe(true);
      });

      it('should return false if initiationMethod is not "callback_customer_first_dialed"', () => {
        jest.spyOn(contact, 'getInitiationMethod').mockReturnValue('inbound');
        const result = contact.isCustomerFirstCallback();
        expect(result).toBe(false);
      });

      it('should return false if initiationMethod is undefined', () => {
        jest.spyOn(contact, 'getInitiationMethod').mockReturnValue(undefined);
        const result = contact.isCustomerFirstCallback();
        expect(result).toBe(false);
      });
    });

    it('getConnectSystemEndpoint should return agent endpoint info', () => {
      const result = contact.getConnectSystemEndpoint();
      expect(result).toBe(sampleContactData.connectSystemEndpoint);
    });

    it('isInbound call should return based on initiationMethod ', () => {
      const result = contact._isInbound();
      expect(result).toBe(true);
    });

    describe('isAutoAcceptEnabled', () => {
      let getAgentConnectionStub;
      let getDataStub;

      beforeEach(() => {
        contact = new connect.Contact(contactId);
        getDataStub = jest.fn();
        contact._getData = getDataStub;
        getAgentConnectionStub = jest.spyOn(contact, 'getAgentConnection');
      });

      it('should return true when agentContactHandlingConfig.autoAccept is true', () => {
        jest.spyOn(contact, 'getType').mockReturnValue('chat');
        getDataStub.mockReturnValue({
          contactId: 'test-contact-id',
          type: 'chat',
          agentContactHandlingConfig: {
            autoAccept: true,
          },
        });

        const result = contact.isAutoAcceptEnabled();

        expect(result).toBe(true);
      });

      it('should return false when agentContactHandlingConfig.autoAccept is false', () => {
        jest.spyOn(contact, 'getType').mockReturnValue('chat');
        getDataStub.mockReturnValue({
          contactId: 'test-contact-id',
          type: 'task',
          agentContactHandlingConfig: {
            autoAccept: false,
          },
        });

        const result = contact.isAutoAcceptEnabled();

        expect(result).toBe(false);
      });

      it('should return softphoneMediaInfo.autoAccept when agentContactHandlingConfig does not exist and contact is type Voice', () => {
        jest.spyOn(contact, 'getType').mockReturnValue('voice');
        getDataStub.mockReturnValue({
          contactId: 'test-contact-id',
          type: 'voice',
        });

        getAgentConnectionStub.mockReturnValue({
          getSoftphoneMediaInfo: () => ({
            autoAccept: true,
          }),
        });

        const result = contact.isAutoAcceptEnabled();

        expect(result).toBe(true);
      });

      it('should return agentContactHandlingConfig even if softphoneMediaInfo exists and contact is type Voice', () => {
        jest.spyOn(contact, 'getType').mockReturnValue('voice');
        getDataStub.mockReturnValue({
          contactId: 'test-contact-id',
          type: 'voice',
          agentContactHandlingConfig: {
            autoAccept: false,
          },
        });
        getAgentConnectionStub.mockReturnValue({
          getSoftphoneMediaInfo: () => ({
            softphoneMediaInfo: {
              autoAccept: true,
            },
          })
        });

        const result = contact.isAutoAcceptEnabled();

        expect(result).toBe(false);
      });

      it('should return false if agentContactHandlingConfig does not exists and contact is not type Voice', () => {
        jest.spyOn(contact, 'getType').mockReturnValue('chat');
        getAgentConnectionStub.mockReturnValue({});

        const result = contact.isAutoAcceptEnabled();

        expect(result).toBe(false);
      });
    });
  });

  it('contact subscription apis', () => {
    connect.core.eventBus = new connect.EventBus();
    contact = new connect.Contact(contactId);

    function testEventSubscription(apiName, eventName) {
      const cb = jest.fn();
      const sub = contact[apiName](cb);
      connect.core.getEventBus().trigger(contact.getEventName(eventName));
      expect(cb).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
      cb.mockClear();
      connect.core.getEventBus().trigger(contact.getEventName(eventName));
      expect(cb).not.toHaveBeenCalled();
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
      'onConnected': connect.ContactEvents.CONNECTED
    };

    for (const key in apiNameEventNameMap) {
      testEventSubscription(key, apiNameEventNameMap[key]);
    }

    connect.core.eventBus = null;
  });

  describe('Video Contact', () => {
    let getAgentConnectionStub;
    let getInitialConnectionStub;

    beforeEach(() => {
      contact = new connect.Contact('contactId');
      getAgentConnectionStub = jest.spyOn(contact, 'getAgentConnection');
      getInitialConnectionStub = jest.spyOn(contact, 'getInitialConnection');
    });

    it('canAgentSendVideo should return the result of agentConnection.canSendVideo()', () => {
      const result = true;
      getAgentConnectionStub.mockReturnValue({ canSendVideo: () => result });
      expect(contact.canAgentSendVideo()).toBe(result);
    });

    it('canAgentReceiveVideo should return the result of initialConnection.canSendVideo()', () => {
      const result = true;
      getInitialConnectionStub.mockReturnValue({ canSendVideo: () => result });
      expect(contact.canAgentReceiveVideo()).toBe(result);
    });

    it('canAgentSendScreenShare should return the result of agentConnection.canSendScreenShare()', () => {
      const result = true;
      getAgentConnectionStub.mockReturnValue({ canSendScreenShare: () => result });
      expect(contact.canAgentSendScreenShare()).toBe(result);
    });

    it('canCustomerSendScreenShare should return the result of initialConnection.canSendScreenShare()', () => {
      const result = true;
      getInitialConnectionStub.mockReturnValue({ canSendScreenShare: () => result });
      expect(contact.canCustomerSendScreenShare()).toBe(result);
    });
  });

});
