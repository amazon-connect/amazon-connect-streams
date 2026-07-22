describe('Contact Events', () => {
  const contactId = '1234567890';

  let bus;
  let contact;

  beforeEach(() => {
    bus = new connect.EventBus();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue(bus);
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      sendUpstream: jest.fn(),
    });
    contact = new connect.Contact(contactId);
  });

  describe('getEventName', () => {
    it('returns a contact-scoped event name', () => {
      const result = contact.getEventName(connect.ContactEvents.REFRESH);
      expect(result).toBe(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId));
    });
  });

  describe('subscription methods', () => {
    it.each([
      ['onRefresh', connect.ContactEvents.REFRESH],
      ['onIncoming', connect.ContactEvents.INCOMING],
      ['onConnecting', connect.ContactEvents.CONNECTING],
      ['onPending', connect.ContactEvents.PENDING],
      ['onAccepted', connect.ContactEvents.ACCEPTED],
      ['onMissed', connect.ContactEvents.MISSED],
      ['onConnected', connect.ContactEvents.CONNECTED],
      ['onEnded', connect.ContactEvents.ENDED],
      ['onDestroy', connect.ContactEvents.DESTROYED],
      ['onACW', connect.ContactEvents.ACW],
      ['onError', connect.ContactEvents.ERROR],
    ])('%s subscribes the callback to its contact event', (apiName, eventName) => {
      const callback = jest.fn();
      contact[apiName](callback);
      bus.trigger(connect.core.getContactEventName(eventName, contactId), contact);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['onRefresh', connect.ContactEvents.REFRESH],
      ['onIncoming', connect.ContactEvents.INCOMING],
      ['onConnecting', connect.ContactEvents.CONNECTING],
      ['onPending', connect.ContactEvents.PENDING],
      ['onMissed', connect.ContactEvents.MISSED],
      ['onConnected', connect.ContactEvents.CONNECTED],
      ['onEnded', connect.ContactEvents.ENDED],
      ['onDestroy', connect.ContactEvents.DESTROYED],
      ['onACW', connect.ContactEvents.ACW],
      ['onError', connect.ContactEvents.ERROR],
    ])('%s passes the event data to the callback', (apiName, eventName) => {
      const callback = jest.fn();
      contact[apiName](callback);
      bus.trigger(connect.core.getContactEventName(eventName, contactId), contact);
      expect(callback.mock.calls[0][0]).toBe(contact);
    });

    it.each([
      ['onRefresh', connect.ContactEvents.REFRESH],
      ['onConnected', connect.ContactEvents.CONNECTED],
      ['onEnded', connect.ContactEvents.ENDED],
    ])('%s does not fire when a different contact event triggers', (apiName, eventName) => {
      const otherContactId = '9999999999';
      const callback = jest.fn();
      contact[apiName](callback);
      bus.trigger(connect.core.getContactEventName(eventName, otherContactId), contact);
      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers on the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      contact.onConnected(callback1);
      contact.onConnected(callback2);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('returns a subscription that can be unsubscribed', () => {
      const callback = jest.fn();
      const sub = contact.onConnected(callback);
      sub.unsubscribe();
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
      expect(callback).not.toHaveBeenCalled();
    });

    it('does not fire the callback before the event triggers', () => {
      const callback = jest.fn();
      contact.onIncoming(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('accepted-event contact wrapping', () => {
    const acceptedEvent = () => connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId);

    it('wraps a plain payload in a Contact before delivering it to an accepted subscriber', () => {
      const callback = jest.fn();
      contact.onAccepted(callback);
      bus.trigger(acceptedEvent(), { contactId });
      const delivered = callback.mock.calls[0][0];
      expect(delivered).toBeInstanceOf(connect.Contact);
      expect(delivered.getContactId()).toBe(contactId);
    });

    it('delivers an existing Contact payload unchanged without re-wrapping it', () => {
      const callback = jest.fn();
      contact.onAccepted(callback);
      bus.trigger(acceptedEvent(), contact);
      expect(callback.mock.calls[0][0]).toBe(contact);
    });

    it('does not wrap a plain payload for non-accepted events', () => {
      const callback = jest.fn();
      const payload = { contactId };
      contact.onConnected(callback);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), payload);
      expect(callback.mock.calls[0][0]).toBe(payload);
    });

    it('wraps the payload using the contactId from the data, not from the subscribing contact', () => {
      const callback = jest.fn();
      const otherContactId = 'other-contact-id';
      contact.onAccepted(callback);
      bus.trigger(acceptedEvent(), { contactId: otherContactId });
      const delivered = callback.mock.calls[0][0];
      expect(delivered).toBeInstanceOf(connect.Contact);
      expect(delivered.getContactId()).toBe(otherContactId);
    });
  });

  describe('screen-sharing subscription methods', () => {
    it.each([
      ['onScreenSharingStarted', connect.ContactEvents.SCREEN_SHARING_STARTED],
      ['onScreenSharingStopped', connect.ContactEvents.SCREEN_SHARING_STOPPED],
      ['onScreenSharingError', connect.ContactEvents.SCREEN_SHARING_ERROR],
    ])('%s subscribes the callback to its global event', (apiName, eventName) => {
      const callback = jest.fn();
      contact[apiName](callback);
      bus.trigger(eventName, {});
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('screen-sharing events are not contact-scoped', () => {
      const callback = jest.fn();
      contact.onScreenSharingStarted(callback);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.SCREEN_SHARING_STARTED, contactId), {});
      expect(callback).not.toHaveBeenCalled();
      bus.trigger(connect.ContactEvents.SCREEN_SHARING_STARTED, {});
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
