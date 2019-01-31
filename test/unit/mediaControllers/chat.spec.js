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
      connect.ChatSession = sinon.stub().returns({
        onConnectionBroken: sinon.spy(),
        onConnectionEstablished: sinon.spy(),
        connect: chatMediaConnectMethod
      });

      connectionObj = {
        getConnectionId: sinon.stub().returns("123"),
        getMediaType: sinon.stub().returns(connect.MediaType.CHAT),
        getMediaInfo: mediaInfoMethod,
        isActive: sinon.stub().returns(true)
      };
    });

    /** Very basic test cases to start with */

    it('Chat Session successfully established for active connection', function () {
      connect.ChatSession.resetHistory();
      connect.core.mediaController.get(connectionObj);
      assert(connect.ChatSession.called);
      assert(chatMediaConnectMethod.called);
      assert(mediaInfoMethod.called);
    });


    it('Chat Session would not initialize for inactive connection', function () {
      connect.ChatSession.resetHistory();
      connectionObj.isActive = sinon.stub().returns(false);
      connect.core.mediaController.get(connectionObj).catch(function () { });
      assert(connect.ChatSession.notCalled);
    });
  });
});

