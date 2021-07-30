require("../../unit/test-setup.js");

describe('Media Controllers', function () {
  var sandbox = sinon.createSandbox();

  describe('#Chat Media Controller', function () {
    var connectionObj,
      chatMediaConnectMethod,
      mediaInfoMethod;

    before(function () {
      var bus = new connect.EventBus();
      sandbox.stub(connect.core, "getEventBus").returns(bus);
      sandbox.stub(connect.core, "getUpstream").returns({
        sendUpstream: sandbox.stub()
      });

      connect.core.mediaController = new connect.MediaFactory();
      chatMediaConnectMethod = sandbox.stub().resolves({});
      mediaInfoMethod = sandbox.stub().returns({
        contactId: 1234
      });

      connect.ChatSession = {};
      connect.ChatSession.create = sandbox.stub().returns({
        onConnectionBroken: sandbox.spy(),
        onConnectionEstablished: sandbox.spy(),
        connect: chatMediaConnectMethod
      });
      connect.ChatSession.setGlobalConfig = sandbox.spy();

      connectionObj = {
        getConnectionId: sandbox.stub().returns("123"),
        getMediaType: sandbox.stub().returns(connect.MediaType.CHAT),
        getMediaInfo: mediaInfoMethod,
        isActive: sandbox.stub().returns(true)
      };
    });

    after(function () {
      sandbox.restore();
    });

    /** Very basic test cases to start with */

    it('Chat Session successfully established for active connection', function () {
      connect.ChatSession.create.resetHistory();
      connect.core.mediaController.get(connectionObj);
      assert.isTrue(connect.ChatSession.create.called);
      assert.isTrue(chatMediaConnectMethod.called);
      assert.isTrue(mediaInfoMethod.called);
    });


    it('Chat Session would not initialize for inactive connection', function () {
      connect.ChatSession.create.resetHistory();
      connectionObj.isActive = sandbox.stub().returns(false);
      connect.core.mediaController.get(connectionObj).catch(function () { });
      assert.isTrue(connect.ChatSession.create.notCalled);
    });
  });
});

