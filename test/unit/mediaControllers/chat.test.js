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
      jest.spyOn(connect.User, 'getNetworkType').mockResolvedValue('IPV4');

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

    describe('useDualStack configuration', () => {
      let loggerSpy;

      beforeEach(() => {
        const logger = connect.getLog();
        loggerSpy = {
          warn: jest.spyOn(logger, 'warn'),
          debug: jest.spyOn(logger, 'debug'),
        };
        jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      });

      // useDualStack is true only for an explicit DUAL_STACK network type; every
      // other value (and lookup failures) falls back to false.
      it.each([
        ['DUAL_STACK', true],
        [' DUAL_STACK ', true],
        ['IPV4', false],
        [null, false],
        [undefined, false],
        ['', false],
        ['   ', false],
      ])('sets useDualStack for network type %p to %p', async (networkType, expected) => {
        connect.User.getNetworkType.mockResolvedValue(networkType);

        await connect.core.mediaController.get(connectionObj);

        const configArgs = connect.ChatSession.setGlobalConfig.mock.calls[0][0];
        expect(configArgs.useDualStack).toBe(expected);
        expect(configArgs.region).toBe('us-east-1');
      });

      it('defaults useDualStack to false and warns when getNetworkType rejects', async () => {
        connect.User.getNetworkType.mockRejectedValue(new Error('Network type retrieval failed'));

        await connect.core.mediaController.get(connectionObj);

        expect(connect.ChatSession.setGlobalConfig.mock.calls[0][0].useDualStack).toBe(false);
        expect(connect.ChatSession.create).toHaveBeenCalled();
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          connect.LogComponent.CHAT,
          'Failed to retrieve network type, defaulting to IPV4'
        );
      });

      it('defaults useDualStack to false when getNetworkType throws synchronously', async () => {
        connect.User.getNetworkType.mockImplementation(() => {
          throw new TypeError('client.getNetworkType is not a function');
        });

        await connect.core.mediaController.get(connectionObj);

        expect(connect.ChatSession.setGlobalConfig.mock.calls[0][0].useDualStack).toBe(false);
        expect(connect.ChatSession.create).toHaveBeenCalled();
      });

      it('debug-logs when the network type is blank', async () => {
        connect.User.getNetworkType.mockResolvedValue('');

        await connect.core.mediaController.get(connectionObj);

        expect(loggerSpy.debug).toHaveBeenCalledWith(
          connect.LogComponent.CHAT,
          'Network type not found in response, defaulting to IPV4'
        );
      });
    });

    describe('Chat Session Failure Metrics', () => {
      let publishMetricStub;

      const metricCalls = (name) => publishMetricStub.mock.calls.map((call) => call[0]).filter((m) => m.name === name);

      beforeEach(() => {
        publishMetricStub = jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      });

      it('publishes ChatSessionFailure with error:0 tagged IPV4 on a successful connection', async () => {
        await connect.core.mediaController.get(connectionObj);

        expect(metricCalls('ChatSessionFailure')).toEqual([
          { name: 'ChatSessionFailure', data: { error: 0, optionalDimensions: { NetworkType: 'IPV4' } } },
        ]);
        expect(metricCalls('ChatSessionFailureReason')).toEqual([]);
      });

      it('publishes ChatSessionFailure error:1 and failed_to_establish_session on a connection failure', async () => {
        chatMediaConnectMethod.mockRejectedValue(new Error('Connection failed'));

        await expect(connect.core.mediaController.get(connectionObj)).rejects.toThrow('Connection failed');

        expect(metricCalls('ChatSessionFailure')).toEqual([
          { name: 'ChatSessionFailure', data: { error: 1, optionalDimensions: { NetworkType: 'IPV4' } } },
        ]);
        expect(metricCalls('ChatSessionFailureReason')).toEqual([
          {
            name: 'ChatSessionFailureReason',
            data: { count: 1, optionalDimensions: { NetworkType: 'IPV4' } },
            dimension: { ErrorType: 'failed_to_establish_session' },
          },
        ]);
      });

      it('tags the chat session metrics with NetworkType DUAL_STACK for a dual-stack instance', async () => {
        connect.User.getNetworkType.mockResolvedValue('DUAL_STACK');
        chatMediaConnectMethod.mockRejectedValue(new Error('Connection failed'));

        await expect(connect.core.mediaController.get(connectionObj)).rejects.toThrow('Connection failed');

        const tagged = publishMetricStub.mock.calls
          .filter((call) => ['ChatSessionFailure', 'ChatSessionFailureReason'].includes(call[0].name))
          .map((call) => call[0].data.optionalDimensions);
        expect(tagged).toEqual([{ NetworkType: 'DUAL_STACK' }, { NetworkType: 'DUAL_STACK' }]);
      });

      it('publishes missing_active_region when no region resolves for the contact', async () => {
        connect._getContactRegion.mockResolvedValue(null);

        await connect.core.mediaController.get(connectionObj);

        expect(metricCalls('ChatSessionFailureReason')).toEqual([
          { name: 'ChatSessionFailureReason', data: { count: 1 }, dimension: { ErrorType: 'missing_active_region' } },
        ]);
      });

      it('publishes connection_broken when the connection breaks', async () => {
        let brokenHandler;
        connect.ChatSession.create.mockReturnValue({
          onConnectionBroken: jest.fn((cb) => {
            brokenHandler = cb;
          }),
          onConnectionEstablished: jest.fn(),
          connect: chatMediaConnectMethod,
        });

        await connect.core.mediaController.get(connectionObj);
        publishMetricStub.mockClear();
        brokenHandler({ error: 'Connection lost' });

        expect(metricCalls('ChatSessionFailureReason')).toEqual([
          { name: 'ChatSessionFailureReason', data: { count: 1 }, dimension: { ErrorType: 'connection_broken' } },
        ]);
        expect(metricCalls('ChatSessionFailure')).toEqual([{ name: 'ChatSessionFailure', data: { error: 0 } }]);
      });
    });
  });
});
