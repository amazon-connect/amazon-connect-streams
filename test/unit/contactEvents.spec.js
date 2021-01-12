require('../unit/test-setup.js');

describe('Contact Events', function () {
  var sandbox = sinon.createSandbox();

  var bus, contact, contactId;

  before(function () {
    bus = new connect.EventBus();
    sandbox.stub(connect.core, 'getEventBus').returns(bus);
    sandbox.stub(connect.core, 'getUpstream').returns({
      sendUpstream: sandbox.stub(),
    });
    contactId = '1234567890';
    contact = new connect.Contact(contactId);
  });

  after(function () {
    sandbox.restore();
  });

  describe('onAccepted', function () {
    it('Should call callback', function () {
      var callback = sandbox.spy();
      contact.onAccepted(callback);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), contact);
      assert.isTrue(callback.calledOnce);
    });

    it('Should call callback with contact object even when triggered with a plain object', function () {
      var callback = sandbox.spy();
      contact.onAccepted(callback);
      bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contactId), { contactId: contactId });
      assert.isTrue(callback.calledOnceWith(sinon.match.instanceOf(connect.Contact)));
    });
  });

  it('Should call callback passed to contact.onIncoming', function () {
    var callback = sandbox.spy();
    contact.onIncoming(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.INCOMING, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onRefresh', function () {
    var callback = sandbox.spy();
    contact.onRefresh(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onPending', function () {
    var callback = sandbox.spy();
    contact.onPending(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.PENDING, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onConnecting', function () {
    var callback = sandbox.spy();
    contact.onConnecting(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTING, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onConnected', function () {
    var callback = sandbox.spy();
    contact.onConnected(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.CONNECTED, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onMissed', function () {
    var callback = sandbox.spy();
    contact.onMissed(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.MISSED, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onEnded', function () {
    var callback = sandbox.spy();
    contact.onEnded(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ENDED, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });

  it('Should call callback passed to contact.onError', function () {
    var callback = sandbox.spy();
    contact.onError(callback);
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.ERROR, contactId), contact);
    assert.isTrue(callback.calledOnce);
  });
});
