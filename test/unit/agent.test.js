describe('Agent APIs', () => {
  let agent;

  beforeEach(() => {
    connect.agent.initialized = true;
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
      getAgentData: () => ({}),
    });
    agent = new connect.Agent();
  });

  afterEach(() => {
    connect.agent.initialized = false;
  });

  describe('setConfiguration', () => {
    let mockedClientCall;

    beforeEach(() => {
      mockedClientCall = jest.fn();
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
        call: mockedClientCall,
      }));
    });

    it('should call UPDATE_AGENT_CONFIGURATION api with a given configuration object', () => {
      const configuration = {
        agentPreferences: { locale: 'en_US' },
        someValue: 'test',
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.mock.calls[0][0]).toBe(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.mock.calls[0][1]).toEqual({ configuration });
    });

    it('should copy LANGUAGE value to locale if locale is missing and LANGUAGE exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: 'en_US' },
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: 'en_US', locale: 'en_US' },
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.mock.calls[0][0]).toBe(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.mock.calls[0][1]).toEqual({ configuration: expectedConfiguration });
    });

    it('should NOT copy LANGUAGE value to locale if locale already exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: 'en_US', locale: 'de_DE' },
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: 'en_US', locale: 'de_DE' },
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.mock.calls[0][0]).toBe(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.mock.calls[0][1]).toEqual({ configuration: expectedConfiguration });
    });

    it('should assert if configuration object is not passed in', () => {
      jest.spyOn(connect, 'assertNotNull').mockImplementation(() => {});
      agent.setConfiguration();
      expect(connect.assertNotNull).toHaveBeenCalled();
    });

    it('should invoke failure callback if the provided locale is invalid', () => {
      const configuration = {
        agentPreferences: { locale: 'invalid' },
      };
      const callbacks = {
        success: jest.fn(),
        failure: jest.fn(),
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall).not.toHaveBeenCalled();
      expect(callbacks.success).not.toHaveBeenCalled();
      expect(callbacks.failure).toHaveBeenCalled();
      expect(callbacks.failure.mock.calls[0][0]).toBe(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should invoke failure callback if the provided LANGUAGE is invalid', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: 'invalid' },
      };
      const callbacks = {
        success: jest.fn(),
        failure: jest.fn(),
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall).not.toHaveBeenCalled();
      expect(callbacks.success).not.toHaveBeenCalled();
      expect(callbacks.failure).toHaveBeenCalled();
      expect(callbacks.failure.mock.calls[0][0]).toBe(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should NOT invoke failure callback if the provided LANGUAGE is invalid but locale is valid', () => {
      const configuration = {
        agentPreferences: { locale: 'en_US', LANGUAGE: 'invalid' },
      };
      const callbacks = {
        success: jest.fn(),
        failure: jest.fn(),
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall).toHaveBeenCalled();
      expect(callbacks.success).not.toHaveBeenCalled();
      expect(callbacks.failure).not.toHaveBeenCalled();
    });
  });

  it('agent subscription apis', () => {
    connect.core.eventBus = new connect.EventBus();

    function testEventSubscription(apiName, eventName) {
      const cb = jest.fn();
      const sub = agent[apiName](cb);
      connect.core.getEventBus().trigger(eventName);
      expect(cb).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
      cb.mockClear();
      connect.core.getEventBus().trigger(eventName);
      expect(cb).not.toHaveBeenCalled();
    }

    const apiNameEventNameMap = {
      onRefresh: connect.AgentEvents.REFRESH,
      onRoutable: connect.AgentEvents.ROUTABLE,
      onNotRoutable: connect.AgentEvents.NOT_ROUTABLE,
      onOffline: connect.AgentEvents.OFFLINE,
      onError: connect.AgentEvents.ERROR,
      onSoftphoneError: connect.AgentEvents.SOFTPHONE_ERROR,
      onWebSocketConnectionLost: connect.AgentEvents.WEBSOCKET_CONNECTION_LOST,
      onWebSocketConnectionGained: connect.AgentEvents.WEBSOCKET_CONNECTION_GAINED,
      onAfterCallWork: connect.AgentEvents.ACW,
      onStateChange: connect.AgentEvents.STATE_CHANGE,
      onMuteToggle: connect.AgentEvents.MUTE_TOGGLE,
      onLocalMediaStreamCreated: connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED,
      onSpeakerDeviceChanged: connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
      onMicrophoneDeviceChanged: connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED,
      onRingerDeviceChanged: connect.ConfigurationEvents.RINGER_DEVICE_CHANGED,
      onCameraDeviceChanged: connect.ConfigurationEvents.CAMERA_DEVICE_CHANGED,
      onBackgroundBlurChanged: connect.ConfigurationEvents.BACKGROUND_BLUR_CHANGED,
    };

    for (const key in apiNameEventNameMap) {
      testEventSubscription(key, apiNameEventNameMap[key]);
    }

    connect.core.eventBus = null;
  });

  describe('agent.onNetworkConnectionStatusChanged', () => {
    let getSDKClientStub;
    let mockOnNetworkConnectionStatusChanged;
    let mockOffNetworkConnectionStatusChanged;

    beforeEach(() => {
      mockOnNetworkConnectionStatusChanged = jest.fn();
      mockOffNetworkConnectionStatusChanged = jest.fn();
      getSDKClientStub = jest.spyOn(agent, '_getSDKClient').mockReturnValue({
        onNetworkConnectionStatusChanged: mockOnNetworkConnectionStatusChanged,
        offNetworkConnectionStatusChanged: mockOffNetworkConnectionStatusChanged,
      });
    });

    it('should delegate to AgentClient via _getSDKClient', () => {
      const cb = jest.fn();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      expect(getSDKClientStub).toHaveBeenCalledTimes(1);
      expect(mockOnNetworkConnectionStatusChanged).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('should return an object with an unsubscribe method', () => {
      const cb = jest.fn();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      expect(sub).toHaveProperty('unsubscribe');
      expect(typeof sub.unsubscribe).toBe('function');
      sub.unsubscribe();
    });

    it('should call offNetworkConnectionStatusChanged on unsubscribe', () => {
      const cb = jest.fn();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      sub.unsubscribe();
      expect(mockOffNetworkConnectionStatusChanged).toHaveBeenCalledTimes(1);
    });

    it('should forward events from AgentClient to the callback', () => {
      const cb = jest.fn();
      agent.onNetworkConnectionStatusChanged(cb);

      const handler = mockOnNetworkConnectionStatusChanged.mock.calls[0][0];
      const event = { status: 'connected', timestamp: 1700000000000 };
      handler(event);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(event);
    });
  });

  describe('connect.NetworkConnectionStatus', () => {
    it('should have CONNECTED equal to "connected"', () => {
      expect(connect.NetworkConnectionStatus.CONNECTED).toBe('connected');
    });

    it('should have CONNECTING equal to "connecting"', () => {
      expect(connect.NetworkConnectionStatus.CONNECTING).toBe('connecting');
    });

    it('should have DISCONNECTED equal to "disconnected"', () => {
      expect(connect.NetworkConnectionStatus.DISCONNECTED).toBe('disconnected');
    });

    it('should have FAILED equal to "failed"', () => {
      expect(connect.NetworkConnectionStatus.FAILED).toBe('failed');
    });
  });

  describe('agent.getNetworkConnectionStatus', () => {
    let getSDKClientStub;
    let mockGetConnectionStatus;

    beforeEach(() => {
      mockGetConnectionStatus = jest.fn();
      getSDKClientStub = jest.spyOn(agent, '_getSDKClient').mockReturnValue({
        getNetworkConnectionStatus: mockGetConnectionStatus,
      });
    });

    it('should delegate to AgentClient.getNetworkConnectionStatus via _getSDKClient', async () => {
      const expected = { status: 'connected', timestamp: 1700000000000 };
      mockGetConnectionStatus.mockResolvedValue(expected);

      const result = await agent.getNetworkConnectionStatus();

      expect(getSDKClientStub).toHaveBeenCalledTimes(1);
      expect(mockGetConnectionStatus).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });
  });

  describe('getStatus/getState', () => {
    let localAgent;

    const mockState = {
      name: 'available',
      timestamp: new Date(),
    };

    beforeEach(() => {
      localAgent = new connect.Agent();
    });

    it('returns the snapshot state', () => {
      localAgent._getData = () => ({
        snapshot: {
          state: mockState,
        },
      });
      expect(localAgent.getState()).toBe(mockState);
    });
  });

  describe('getContacts', () => {
    let localAgent;

    beforeEach(() => {
      localAgent = new connect.Agent();
      localAgent._getData = () => ({
        snapshot: {
          contacts: [{ contactId: 'voice-1' }, { contactId: 'chat-1' }],
        },
      });
      // getContacts filters on each contact's getType(); stub _createContactAPI
      // to return contacts with controllable types.
      jest.spyOn(localAgent, '_createContactAPI').mockImplementation((data) => ({
        contactId: data.contactId,
        getType: () => (data.contactId === 'voice-1' ? connect.ContactType.VOICE : connect.ContactType.CHAT),
      }));
    });

    it('returns every contact when no type filter is given', () => {
      const contacts = localAgent.getContacts();
      expect(contacts).toHaveLength(2);
      expect(contacts.map((c) => c.contactId)).toEqual(['voice-1', 'chat-1']);
    });

    it('returns only contacts matching the type filter', () => {
      const contacts = localAgent.getContacts(connect.ContactType.CHAT);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].contactId).toBe('chat-1');
    });
  });

  describe('Voice Enhancement', () => {
    let localAgent;

    beforeEach(() => {
      localAgent = new connect.Agent();
    });

    it('should throw an error if the mode is not valid', () => {
      expect(() => localAgent.setVoiceEnhancementMode('invalid')).toThrow();
    });

    for (const mode of ['VOICE_ISOLATION', 'NOISE_SUPPRESSION', 'NONE']) {
      it(`should invoke SDK if the mode is ${mode}`, () => {
        const setVoiceEnhancementMode = jest.fn();
        jest.spyOn(localAgent, '_getSDKVoiceClient').mockReturnValue({
          setVoiceEnhancementMode,
        });

        localAgent.setVoiceEnhancementMode(mode);

        expect(setVoiceEnhancementMode).toHaveBeenCalledWith(mode);
      });
    }

    it('should subscribe to Voice Enhancement mode changed', () => {
      const mockCallback = jest.fn();
      const mockOnVoiceEnhancementModeChanged = jest.fn();
      jest.spyOn(localAgent, '_getSDKVoiceClient').mockReturnValue({
        onVoiceEnhancementModeChanged: mockOnVoiceEnhancementModeChanged,
      });

      localAgent.onVoiceEnhancementModeChanged(mockCallback);

      expect(mockOnVoiceEnhancementModeChanged).toHaveBeenCalledTimes(1);

      const sdkCallback = mockOnVoiceEnhancementModeChanged.mock.calls[0][0];

      const testVoiceEnhancementMode = 'VOICE_ISOLATION';
      sdkCallback({ voiceEnhancementMode: testVoiceEnhancementMode });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0]).toEqual({ voiceEnhancementMode: testVoiceEnhancementMode });
    });
  });

  describe('mute/unmute', () => {
    let sendUpstream;

    beforeEach(() => {
      sendUpstream = jest.fn();
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream });
    });

    it('mute broadcasts a MUTE event with mute true', () => {
      agent.mute();
      expect(sendUpstream).toHaveBeenCalledWith(connect.EventType.BROADCAST, {
        event: connect.EventType.MUTE,
        data: { mute: true },
      });
    });

    it('unmute broadcasts a MUTE event with mute false', () => {
      agent.unmute();
      expect(sendUpstream).toHaveBeenCalledWith(connect.EventType.BROADCAST, {
        event: connect.EventType.MUTE,
        data: { mute: false },
      });
    });
  });

  describe('setState', () => {
    let clientCall;

    beforeEach(() => {
      clientCall = jest.fn();
      jest.spyOn(connect.core, 'getClient').mockReturnValue({ call: clientCall });
    });

    it('calls PUT_AGENT_STATE with the target state and a falsy enqueueNextState when no options are given', () => {
      const state = { name: 'available' };
      const callbacks = { success: jest.fn() };
      agent.setState(state, callbacks);
      expect(clientCall.mock.calls[0][0]).toBe(connect.ClientMethods.PUT_AGENT_STATE);
      expect(clientCall.mock.calls[0][1].state).toBe(state);
      expect(clientCall.mock.calls[0][1].enqueueNextState).toBeFalsy();
      expect(clientCall.mock.calls[0][2]).toBe(callbacks);
    });

    it('passes enqueueNextState true when the option is set', () => {
      const state = { name: 'available' };
      agent.setState(state, undefined, { enqueueNextState: true });
      expect(clientCall.mock.calls[0][1]).toEqual({ state, enqueueNextState: true });
    });
  });

  describe('setConfiguration success path', () => {
    let clientCall;
    let sendUpstream;

    beforeEach(() => {
      clientCall = jest.fn();
      sendUpstream = jest.fn();
      jest.spyOn(connect.core, 'getClient').mockReturnValue({ call: clientCall });
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ sendUpstream });
    });

    it('reloads agent configuration and invokes the success callback once the client succeeds', () => {
      const configuration = { agentPreferences: { locale: 'en_US' } };
      const callbacks = { success: jest.fn() };
      agent.setConfiguration(configuration, callbacks);

      const clientCallbacks = clientCall.mock.calls[0][2];
      const responseData = { ok: true };
      clientCallbacks.success(responseData);

      expect(sendUpstream).toHaveBeenCalledWith(connect.EventType.RELOAD_AGENT_CONFIGURATION);
      expect(callbacks.success).toHaveBeenCalledWith(responseData);
    });
  });
});
