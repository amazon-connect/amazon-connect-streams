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

      connect.agent.initialized = true;
      jest.spyOn(connect.Agent.prototype, '_getInstanceRegion').mockReturnValue('us-east-1');
      jest.spyOn(connect, '_getContactRegion').mockResolvedValue('us-west-2');

      connect.ChatSession = {};
      connect.ChatSession.create = jest.fn().mockReturnValue({
        onConnectionBroken: jest.fn(),
        onConnectionEstablished: jest.fn(),
        connect: chatMediaConnectMethod,
      });
      connect.ChatSession.setGlobalConfig = jest.fn();
      connect.ChatSession.setRegionOverride = jest.fn();

      connectionObj = {
        getConnectionId: jest.fn().mockReturnValue('123'),
        getMediaType: jest.fn().mockReturnValue(connect.MediaType.CHAT),
        getMediaInfo: mediaInfoMethod,
        isActive: jest.fn().mockReturnValue(true),
      };
    });

    it('Chat Session successfully established for active connection', async () => {
      await connect.core.mediaController.get(connectionObj);
      expect(connect.ChatSession.create).toHaveBeenCalled();
      expect(chatMediaConnectMethod).toHaveBeenCalled();
      expect(mediaInfoMethod).toHaveBeenCalled();
    });

    it('Chat Session would not initialize for inactive connection', () => {
      connectionObj.isActive = jest.fn().mockReturnValue(false);
      connect.core.mediaController.get(connectionObj).catch(() => {});
      expect(connect.ChatSession.create).not.toHaveBeenCalled();
    });

    describe('Contact region resolution', () => {
      beforeEach(() => {
        jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      });

      it('should create chat session with the region resolved for the contact', async () => {
        await connect.core.mediaController.get(connectionObj);

        expect(connect._getContactRegion).toHaveBeenCalledWith(1234);
        const createArgs = connect.ChatSession.create.mock.calls[0][0];
        expect(createArgs.options.region).toBe('us-west-2');
        expect(connect.ChatSession.setRegionOverride).toHaveBeenCalledWith(null);
      });

      it('should set global config with agent region', async () => {
        connect.Agent.prototype._getInstanceRegion.mockReturnValue('eu-west-2');

        await connect.core.mediaController.get(connectionObj);

        const configArgs = connect.ChatSession.setGlobalConfig.mock.calls[0][0];
        expect(configArgs.region).toBe('eu-west-2');
      });

      it('should log an error but still create the session when no region resolves for the contact', async () => {
        connect._getContactRegion.mockResolvedValue(null);

        await connect.core.mediaController.get(connectionObj);

        expect(connect.ChatSession.create).toHaveBeenCalled();
        const createArgs = connect.ChatSession.create.mock.calls[0][0];
        expect(createArgs.options).toBeUndefined();
        expect(connect.ChatSession.setRegionOverride).not.toHaveBeenCalled();
        expect(connect.publishMetric).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Contact region is missing for chat contact' })
        );
      });
    });

    describe('session establishment failure and connection status tracking', () => {
      beforeEach(() => {
        jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      });

      it('rethrows and publishes telemetry when controller.connect() rejects', async () => {
        const connectError = new Error('connect failed');
        chatMediaConnectMethod.mockRejectedValue(connectError);

        await expect(connect.core.mediaController.get(connectionObj)).rejects.toThrow('connect failed');

        expect(connect.publishMetric).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Chat Session establishment failed' })
        );
      });

      it('publishes telemetry when the chat connection is broken or re-established', async () => {
        let brokenHandler;
        let establishedHandler;
        connect.ChatSession.create.mockReturnValue({
          onConnectionBroken: jest.fn((cb) => {
            brokenHandler = cb;
          }),
          onConnectionEstablished: jest.fn((cb) => {
            establishedHandler = cb;
          }),
          connect: chatMediaConnectMethod,
        });

        await connect.core.mediaController.get(connectionObj);

        brokenHandler({ reason: 'network' });
        establishedHandler({ reason: 'reconnected' });

        expect(connect.publishMetric).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Chat Session connection broken' })
        );
        expect(connect.publishMetric).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Chat Session connection established' })
        );
      });
    });
  });
});
