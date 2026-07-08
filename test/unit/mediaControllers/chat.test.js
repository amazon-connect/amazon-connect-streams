describe('Media Controllers', () => {
  describe('Chat Media Controller', () => {
    let connectionObj;
    let chatMediaConnectMethod;
    let mediaInfoMethod;

    beforeEach(() => {
      const bus = new connect.EventBus();
      jest.spyOn(connect.core, 'getEventBus').mockReturnValue(bus);
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
        sendUpstream: jest.fn(),
      });

      connect.core.mediaController = new connect.MediaFactory();
      chatMediaConnectMethod = jest.fn().mockResolvedValue({});
      mediaInfoMethod = jest.fn().mockReturnValue({ contactId: 1234 });

      connect.ChatSession = {};
      connect.ChatSession.create = jest.fn().mockReturnValue({
        onConnectionBroken: jest.fn(),
        onConnectionEstablished: jest.fn(),
        connect: chatMediaConnectMethod,
      });
      connect.ChatSession.setGlobalConfig = jest.fn();

      connectionObj = {
        getConnectionId: jest.fn().mockReturnValue('123'),
        getMediaType: jest.fn().mockReturnValue(connect.MediaType.CHAT),
        getMediaInfo: mediaInfoMethod,
        isActive: jest.fn().mockReturnValue(true),
      };
    });

    it('Chat Session successfully established for active connection', () => {
      connect.core.mediaController.get(connectionObj);
      expect(connect.ChatSession.create).toHaveBeenCalled();
      expect(chatMediaConnectMethod).toHaveBeenCalled();
      expect(mediaInfoMethod).toHaveBeenCalled();
    });

    it('Chat Session would not initialize for inactive connection', () => {
      connectionObj.isActive = jest.fn().mockReturnValue(false);
      connect.core.mediaController.get(connectionObj).catch(() => {});
      expect(connect.ChatSession.create).not.toHaveBeenCalled();
    });
  });
});
