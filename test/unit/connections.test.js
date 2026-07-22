describe('Connections API', () => {
  describe('#Chat Connection API', () => {
    const connectionId = 'connectionId';
    const contactId = 'contactId';
    let initMediaController;

    const chatMonitorInfo = {
      agent: {
        agentName: 'Agent',
      },
      customer: {
        CustomerName: 'CustomerName',
      },
      joinTime: 123,
    };

    const chatMediaInfo = {
      customerName: 'CustomerName',
      agentName: 'testAgent2',
    };

    let getAgentDataProviderStub;

    beforeEach(() => {
      initMediaController = jest.fn();
      getAgentDataProviderStub = jest
        .spyOn(connect.core, 'getAgentDataProvider')
        .mockReturnValue({
          getContactData: () => ({
            segmentAttributes: {
              'connect:CustomerAuthentication': {
                ValueMap: {
                  IdentityProvider: { ValueString: 'http://my-domain.auth0.com' },
                  ClientId: { ValueString: 'xxxxxxxxxxxxexample' },
                  Status: { ValueString: 'AUTHENTICATED' },
                  AssociatedCustomerId: { ValueString: '3b3fe046ed68479f9d425b5f1a7acbfe' },
                  AuthenticationMethod: { ValueString: 'CONNECT' },
                },
              },
            },
          }),
          _initMediaController: initMediaController,
          getConnectionData: () => ({
            state: {},
            chatMediaInfo: chatMediaInfo,
            monitoringInfo: chatMonitorInfo,
            getMediaController: () => {},
          }),
          getAgentData: () => ({
            configuration: {
              name: 'mainAgent',
            },
          }),
        });
    });

    it('Should create new Chat connection Object given the chat Contact and Connection Id ', () => {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      expect(chatConnection.connectionId).toBe(connectionId);
      expect(chatConnection.contactId).toBe(contactId);
      expect(chatConnection.getMediaType()).toBe(connect.MediaType.CHAT);
    });

    it('calls _initMediaController once when a ChatConnection is constructed', () => {
      const initSpy = jest
        .spyOn(connect.ChatConnection.prototype, '_initMediaController')
        .mockImplementation(() => {});
      new connect.ChatConnection(contactId, connectionId);
      expect(initSpy).toHaveBeenCalledTimes(1);
    });

    it('Should return valid chatMedia Info on getMediaInfo method ', () => {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      const mediaInfo = chatConnection.getMediaInfo();
      expect(mediaInfo.originalInfo.customerName).toBe(chatMediaInfo.customerName);
    });

    it('Should return valid monitor Info on getMonitorInfo method ', () => {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      const monitorInfo = chatConnection.getMonitorInfo();
      expect(monitorInfo).toEqual(chatMonitorInfo);
    });

    it("getParticipantName should return the agent's name for connection of type agent", () => {
      connect.agent.initialized = true;
      const agent = new connect.Agent();
      const agentChatConnection = new connect.ChatConnection(contactId, connectionId);
      jest.spyOn(agentChatConnection, 'getType').mockReturnValue('agent');
      expect(agentChatConnection.getParticipantName()).toBe('mainAgent');
    });

    it("getParticipantName should return the customer's name for initial connection", () => {
      const customerChatConnection = new connect.ChatConnection(contactId, connectionId);
      jest.spyOn(customerChatConnection, 'isInitialConnection').mockReturnValue(true);
      expect(customerChatConnection.getParticipantName()).toBe('CustomerName');
    });

    it('getParticipantName should return the agentName field for third party participant', () => {
      const thirdParticipantChatConnection = new connect.ChatConnection(contactId, connectionId);
      jest.spyOn(thirdParticipantChatConnection, 'getType').mockReturnValue('outbound');
      expect(thirdParticipantChatConnection.getParticipantName()).toBe('testAgent2');
    });

    describe('getAuthenticationDetails', () => {
      it('should return authentication details when presented in segmentAttributes', () => {
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).toEqual({
          IdentityProvider: 'http://my-domain.auth0.com',
          ClientId: 'xxxxxxxxxxxxexample',
          Status: 'AUTHENTICATED',
          AssociatedCustomerId: '3b3fe046ed68479f9d425b5f1a7acbfe',
          AuthenticationMethod: 'CONNECT',
        });
        expect(chatConnection.isAuthenticated()).toBe(true);
      });

      it('should return null when authentication details is not present in segmentAttributes', () => {
        getAgentDataProviderStub.mockReturnValue({
          getContactData: () => ({}),
          getConnectionData: () => ({}),
        });
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).toBeNull();
        expect(chatConnection.isAuthenticated()).toBe(false);
      });

      it('should be un-authenticated if partial data is present in segmentAttributes', () => {
        getAgentDataProviderStub.mockReturnValue({
          getContactData: () => ({
            segmentAttributes: {
              'connect:CustomerAuthentication': {
                ValueMap: {
                  IdentityProvider: { ValueString: 'http://my-domain.auth0.com' },
                  AssociatedCustomerId: { ValueString: '3b3fe046ed68479f9d425b5f1a7acbfe' },
                  AuthenticationMethod: { ValueString: 'CONNECT' },
                },
              },
            },
          }),
          getConnectionData: () => ({}),
        });
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).toEqual({
          IdentityProvider: 'http://my-domain.auth0.com',
          AssociatedCustomerId: '3b3fe046ed68479f9d425b5f1a7acbfe',
          AuthenticationMethod: 'CONNECT',
        });
        expect(chatConnection.isAuthenticated()).toBe(false);
      });

      it('throw error if connection type is not Customer connection', () => {
        getAgentDataProviderStub.mockReturnValue({
          getContactData: () => ({}),
          getConnectionData: () => ({}),
        });
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        jest.spyOn(chatConnection, '_isAgentConnectionType').mockReturnValue(true);

        expect(() => chatConnection.getAuthenticationDetails()).toThrow(
          'Authentication details are available only for customer connection'
        );
        expect(() => chatConnection.isAuthenticated()).toThrow(
          'Authentication details are available only for customer connection'
        );
      });
    });
  });

  describe('#Voice Connection API', () => {
    const connectionId = 'connectionId';
    const contactId = 'contactId';
    const instanceId = 'instanceId';
    const AWSAccountId = 'AWSAccountId';
    const capabilities = { Video: 'SEND', ScreenShare: 'SEND' };

    let initMediaController;
    let getAgentDataResult;
    let getAgentDataProviderStub;

    beforeEach(() => {
      initMediaController = jest.fn();
      getAgentDataResult = {
        getContactData: () => ({ connections: [{ state: { type: 'connected' } }] }),
        _initMediaController: initMediaController,
        getConnectionData: () => ({
          state: {},
          getMediaController: () => {},
          capabilities: capabilities,
        }),
        getInstanceId: () => instanceId,
        getAWSAccountId: () => AWSAccountId,
        // getDomainId checks agent.getPermissions() synchronously, so the stub
        // must grant VOICE_ID or the voiceId methods throw before returning.
        getAgentData: () => ({
          configuration: {
            permissions: [connect.AgentPermissions.VOICE_ID],
          },
        }),
      };

      jest.spyOn(connect.core, 'getClient').mockReturnValue({ call: jest.fn() });
      getAgentDataProviderStub = jest
        .spyOn(connect.core, 'getAgentDataProvider')
        .mockReturnValue(getAgentDataResult);
    });

    describe('getCapabilities', () => {
      it('Should return capabilities if capabilities exists', () => {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        expect(voiceConnection.getCapabilities()).toBe(capabilities);
      });

    });

    describe('canSendVideo', () => {
      it('Should return true if capabilities contains Video Send', () => {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        expect(voiceConnection.canSendVideo()).toBe(true);
      });

      it('Should return false if capabilities does not contain Video Send', () => {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        getAgentDataProviderStub.mockReturnValue({
          getConnectionData: () => ({ capabilities: { ScreenShare: 'SEND' } }),
        });
        expect(voiceConnection.canSendVideo()).toBe(false);
      });
    });

    describe('canSendScreenShare', () => {
      it('Should return true if capabilities contains ScreenShare Send', () => {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        expect(voiceConnection.canSendScreenShare()).toBe(true);
      });

      it('Should return false if capabilities does not contain ScreenShare Send', () => {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        getAgentDataProviderStub.mockReturnValue({
          getConnectionData: () => ({ capabilities: { Video: 'SEND' } }),
        });
        expect(voiceConnection.canSendScreenShare()).toBe(false);
      });
    });

    it('Should create new Voice connection Object given the Voice Contact and Connection Id with Speaker Authenticator ', () => {
      const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
      expect(voiceConnection.connectionId).toBe(connectionId);
      expect(voiceConnection.contactId).toBe(contactId);
      expect(voiceConnection.getMediaType()).toBe(connect.MediaType.SOFTPHONE);
      expect(typeof voiceConnection.getVoiceIdSpeakerId).toBe('function');
      expect(typeof voiceConnection.getVoiceIdSpeakerStatus).toBe('function');
    });

    // The stubbed client never fires its callbacks, so these Promises never settle;
    // assert only that each method returns one.
    it.each([
      'getVoiceIdSpeakerId',
      'getVoiceIdSpeakerStatus',
      'optOutVoiceIdSpeaker',
      'evaluateSpeakerWithVoiceId',
      'enrollSpeakerInVoiceId',
      'updateVoiceIdSpeakerId',
      'deleteVoiceIdSpeaker',
    ])('%s returns a Promise', (method) => {
      const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
      expect(voiceConnection[method]()).toBeInstanceOf(Promise);
    });
  });

  describe('#Task Connection API', () => {
    const connectionId = 'connectionId';
    const contactId = 'contactId';
    const initialContactId = 'initialContactId';

    const taskMediaInfo = {
      contactId,
      initialContactId,
    };

    const mediaFactoryGet = () => Promise.resolve();

    let initMediaController;

    beforeEach(() => {
      initMediaController = jest.fn();

      jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
        getContactData: () => ({
          initialContactId: taskMediaInfo.initialContactId,
        }),
        _initMediaController: initMediaController,
        getConnectionData: () => ({
          state: {},
          taskMediaInfo,
          getMediaController: () => {},
        }),
      });

      connect.core.mediaFactory = {};
      connect.core.mediaFactory.get = jest.fn(mediaFactoryGet);
      connect.TaskConnection.prototype._initMediaController = initMediaController;
    });

    it('Should create new Task connection Object given the task Contact and Connection Id ', () => {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      expect(taskConnection.connectionId).toBe(connectionId);
      expect(taskConnection.contactId).toBe(contactId);
      expect(taskConnection.getMediaType()).toBe(connect.MediaType.TASK);
    });

    it('Should call InitMediaController method on new TaskConnection creation', () => {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      expect(initMediaController).toHaveBeenCalledTimes(1);
    });

    it('Should return valid taskMedia Info on getMediaInfo method ', () => {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      const mediaInfo = taskConnection.getMediaInfo();
      expect(mediaInfo.contactId).toBe(taskMediaInfo.contactId);
    });
  });

  describe('base Connection behaviors', () => {
    const connectionId = 'connectionId';
    const contactId = 'contactId';

    let client;
    let connectionData;

    // VoiceConnection inherits the base Connection prototype unchanged, so it is
    // used as a concrete instance to exercise the shared state/action methods.
    function newConnection() {
      return new connect.VoiceConnection(contactId, connectionId);
    }

    beforeEach(() => {
      connectionData = { state: { type: connect.ConnectionStateType.CONNECTED } };
      client = { call: jest.fn() };

      jest.spyOn(connect.core, 'getClient').mockReturnValue(client);
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream: jest.fn() });
      jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
        getConnectionData: () => connectionData,
        getAgentData: () => ({ configuration: { permissions: [] } }),
      });
    });

    describe('state predicates', () => {
      it('isConnected is true only for connected states', () => {
        const conn = newConnection();
        connectionData.state.type = connect.ConnectionStateType.CONNECTED;
        expect(conn.isConnected()).toBe(true);
        connectionData.state.type = connect.ConnectionStateType.HOLD;
        expect(conn.isConnected()).toBe(false);
      });

      it('isOnHold is true only in the hold state', () => {
        const conn = newConnection();
        connectionData.state.type = connect.ConnectionStateType.HOLD;
        expect(conn.isOnHold()).toBe(true);
        connectionData.state.type = connect.ConnectionStateType.CONNECTED;
        expect(conn.isOnHold()).toBe(false);
      });

      it('isConnecting is true only in the connecting state', () => {
        const conn = newConnection();
        connectionData.state.type = connect.ConnectionStateType.CONNECTING;
        expect(conn.isConnecting()).toBe(true);
        connectionData.state.type = connect.ConnectionStateType.CONNECTED;
        expect(conn.isConnecting()).toBe(false);
      });

      it('isActive is true for active states and false once disconnected', () => {
        const conn = newConnection();
        connectionData.state.type = connect.ConnectionStateType.HOLD;
        expect(conn.isActive()).toBe(true);
        connectionData.state.type = connect.ConnectionStateType.DISCONNECTED;
        expect(conn.isActive()).toBe(false);
      });

      it('isInitialConnection reflects the initial flag', () => {
        const conn = newConnection();
        connectionData.initial = true;
        expect(conn.isInitialConnection()).toBe(true);
        connectionData.initial = false;
        expect(conn.isInitialConnection()).toBe(false);
      });
    });

    describe('client actions', () => {
      it('hold calls HOLD_CONNECTION with the contact and connection ids', () => {
        const conn = newConnection();
        const callbacks = { success: jest.fn() };
        conn.hold(callbacks);
        expect(client.call).toHaveBeenCalledWith(
          connect.ClientMethods.HOLD_CONNECTION,
          { contactId, connectionId },
          callbacks
        );
      });

      it('resume calls RESUME_CONNECTION with the contact and connection ids', () => {
        const conn = newConnection();
        const callbacks = { success: jest.fn() };
        conn.resume(callbacks);
        expect(client.call).toHaveBeenCalledWith(
          connect.ClientMethods.RESUME_CONNECTION,
          { contactId, connectionId },
          callbacks
        );
      });

      it('sendDigits calls SEND_DIGITS with the dialed digits', () => {
        const conn = newConnection();
        const callbacks = { success: jest.fn() };
        conn.sendDigits('123', callbacks);
        expect(client.call).toHaveBeenCalledWith(
          connect.ClientMethods.SEND_DIGITS,
          { contactId, connectionId, digits: '123' },
          callbacks
        );
      });

      it('destroy calls DESTROY_CONNECTION with the contact and connection ids', () => {
        const conn = newConnection();
        const callbacks = { success: jest.fn() };
        conn.destroy(callbacks);
        expect(client.call).toHaveBeenCalledWith(
          connect.ClientMethods.DESTROY_CONNECTION,
          { contactId, connectionId },
          callbacks
        );
      });
    });
  });
});
