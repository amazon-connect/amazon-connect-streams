require("../../unit/test-setup.js");

describe('Media Controllers', function () {

  describe('#Chat Media Controller', function () {
    var connectionObj,
      chatMediaConnectMethod,
      mediaInfoMethod;

    before(function () {

      connect.core.mediaController = new connect.MediaFactory();
      chatMediaConnectMethod = sinon.stub().resolves({});
      mediaInfoMethod = sinon.stub().returns({
        contactId: 1234
      });

    
      connect.ChatSession = {};
      connect.ChatSession.create = sinon.stub().returns({
        onConnectionBroken: sinon.spy(),
        onConnectionEstablished: sinon.spy(),
        connect: chatMediaConnectMethod
      });
      connect.ChatSession.setGlobalConfig = sinon.spy();

      connectionObj = {
        getConnectionId: sinon.stub().returns("123"),
        getMediaType: sinon.stub().returns(connect.MediaType.CHAT),
        getMediaInfo: mediaInfoMethod,
        isActive: sinon.stub().returns(true)
      };
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
      connectionObj.isActive = sinon.stub().returns(false);
      connect.core.mediaController.get(connectionObj).catch(function () { });
      assert.isTrue(connect.ChatSession.create.notCalled);
    });
  });
});

