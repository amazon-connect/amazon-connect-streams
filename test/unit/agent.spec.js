require("../unit/test-setup.js");

describe('Agent APIs', () => {
  const sandbox = sinon.createSandbox();
  let agent;
  before(() => {
    connect.agent.initialized = true;
    sandbox.stub(connect.core, 'getAgentDataProvider').returns({
      getAgentData: () => ({})
    });
    agent = new connect.Agent();
  });
  after(() => {
    connect.agent.initialized = false;
    sandbox.restore();
  });
  describe('setConfiguration', () => {
    let mockedClientCall;
    before(() => {
      mockedClientCall = sinon.stub();
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: mockedClientCall
      }));
    });
    afterEach(() => {
      mockedClientCall.resetHistory();
    });
    after(() => {
      connect.core.getClient.restore();
    });
    it('should call UPDATE_AGENT_CONFIGURATION api with a given configuration object', () => {
      const configuration = {
        agentPreferences: { locale: "en_US" },
        someValue: 'test'
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration });
    });

    it('should copy LANGUAGE value to locale if locale is missing and LANGUAGE exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "en_US" }
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "en_US" }
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration: expectedConfiguration });
    });

    it('should NOT copy LANGUAGE value to locale if locale already exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "de_DE" }
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "de_DE" }
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration: expectedConfiguration });
    });

    it('should assert if configuration object is not passed in', () => {
      sinon.stub(connect, 'assertNotNull');
      agent.setConfiguration();
      expect(connect.assertNotNull.called).to.be.true;
      connect.assertNotNull.restore();
    });

    it('should invoke failure callback if the provided locale is invalid', () => {
      const configuration = {
        agentPreferences: { locale: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).not.to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).to.be.true;
      expect(callbacks.failure.firstCall.args[0]).to.equal(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should invoke failure callback if the provided LANGUAGE is invalid', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).not.to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).to.be.true;
      expect(callbacks.failure.firstCall.args[0]).to.equal(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should NOT invoke failure callback if the provided LANGUAGE is invalid but locale is valid', () => {
      const configuration = {
        agentPreferences: { locale: "en_US", LANGUAGE: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).not.to.be.true;
    });
  });
  it('agent subscription apis', () => {
    connect.core.eventBus = new connect.EventBus();

    function testEventSubscription(apiName, eventName) {
      const cb = sinon.stub();
      const sub = agent[apiName](cb);
      connect.core.getEventBus().trigger(eventName);
      sinon.assert.calledOnce(cb);
      sub.unsubscribe();
      cb.resetHistory();
      connect.core.getEventBus().trigger(eventName);
      sinon.assert.notCalled(cb);
    }

    const apiNameEventNameMap = {
      'onRefresh': connect.AgentEvents.REFRESH,
      'onRoutable': connect.AgentEvents.ROUTABLE,
      'onNotRoutable': connect.AgentEvents.NOT_ROUTABLE,
      'onOffline': connect.AgentEvents.OFFLINE,
      'onError': connect.AgentEvents.ERROR,
      'onSoftphoneError': connect.AgentEvents.SOFTPHONE_ERROR,
      'onWebSocketConnectionLost': connect.AgentEvents.WEBSOCKET_CONNECTION_LOST,
      'onWebSocketConnectionGained': connect.AgentEvents.WEBSOCKET_CONNECTION_GAINED,
      'onAfterCallWork': connect.AgentEvents.ACW,
      'onStateChange': connect.AgentEvents.STATE_CHANGE,
      'onMuteToggle': connect.AgentEvents.MUTE_TOGGLE,
      'onLocalMediaStreamCreated': connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED,
      'onSpeakerDeviceChanged': connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
      'onMicrophoneDeviceChanged': connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED,
      'onRingerDeviceChanged': connect.ConfigurationEvents.RINGER_DEVICE_CHANGED,
      'onCameraDeviceChanged': connect.ConfigurationEvents.CAMERA_DEVICE_CHANGED,
      'onBackgroundBlurChanged': connect.ConfigurationEvents.BACKGROUND_BLUR_CHANGED
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
      mockOnNetworkConnectionStatusChanged = sinon.stub();
      mockOffNetworkConnectionStatusChanged = sinon.stub();
      getSDKClientStub = sinon.stub(agent, '_getSDKClient').returns({
        onNetworkConnectionStatusChanged: mockOnNetworkConnectionStatusChanged,
        offNetworkConnectionStatusChanged: mockOffNetworkConnectionStatusChanged,
      });
    });

    afterEach(() => {
      getSDKClientStub.restore();
    });

    it('should delegate to AgentClient via _getSDKClient', () => {
      const cb = sinon.stub();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      expect(getSDKClientStub.calledOnce).to.be.true;
      expect(mockOnNetworkConnectionStatusChanged.calledOnce).to.be.true;
      sub.unsubscribe();
    });

    it('should return an object with an unsubscribe method', () => {
      const cb = sinon.stub();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      expect(sub).to.have.property('unsubscribe');
      expect(sub.unsubscribe).to.be.a('function');
      sub.unsubscribe();
    });

    it('should call offNetworkConnectionStatusChanged on unsubscribe', () => {
      const cb = sinon.stub();
      const sub = agent.onNetworkConnectionStatusChanged(cb);
      sub.unsubscribe();
      expect(mockOffNetworkConnectionStatusChanged.calledOnce).to.be.true;
    });

    it('should forward events from AgentClient to the callback', () => {
      const cb = sinon.stub();
      agent.onNetworkConnectionStatusChanged(cb);

      const handler = mockOnNetworkConnectionStatusChanged.firstCall.args[0];
      const event = { status: 'connected', timestamp: 1700000000000 };
      handler(event);

      expect(cb.calledOnce).to.be.true;
      expect(cb.calledWith(event)).to.be.true;
    });
  });

  describe('connect.NetworkConnectionStatus', () => {
    it('should have CONNECTED equal to "connected"', () => {
      expect(connect.NetworkConnectionStatus.CONNECTED).to.equal('connected');
    });

    it('should have CONNECTING equal to "connecting"', () => {
      expect(connect.NetworkConnectionStatus.CONNECTING).to.equal('connecting');
    });

    it('should have DISCONNECTED equal to "disconnected"', () => {
      expect(connect.NetworkConnectionStatus.DISCONNECTED).to.equal('disconnected');
    });

    it('should have FAILED equal to "failed"', () => {
      expect(connect.NetworkConnectionStatus.FAILED).to.equal('failed');
    });
  });

  describe('agent.getNetworkConnectionStatus', () => {
    let getSDKClientStub;
    let mockGetConnectionStatus;

    beforeEach(() => {
      mockGetConnectionStatus = sinon.stub();
      getSDKClientStub = sinon.stub(agent, '_getSDKClient').returns({
        getNetworkConnectionStatus: mockGetConnectionStatus,
      });
    });

    afterEach(() => {
      getSDKClientStub.restore();
    });

    it('should delegate to AgentClient.getNetworkConnectionStatus via _getSDKClient', async () => {
      const expected = { status: 'connected', timestamp: 1700000000000 };
      mockGetConnectionStatus.resolves(expected);

      const result = await agent.getNetworkConnectionStatus();

      expect(getSDKClientStub.calledOnce).to.be.true;
      expect(mockGetConnectionStatus.calledOnce).to.be.true;
      expect(result).to.deep.equal(expected);
    });
  });

  describe('Voice Enhancement', () => {
    let agent;

    beforeEach(() => {
      agent = new connect.Agent();
    });

    it('should throw an error if the mode is not valid', () => {
      expect(() => agent.setVoiceEnhancementMode('invalid')).to.throw();
    });

    for (var mode of ["VOICE_ISOLATION", "NOISE_SUPPRESSION", "NONE"]) {
      it(`should invoke SDK if the mode is ${mode}`, () => {
        const setVoiceEnhancementMode =  sinon.stub();
        sinon.stub(agent, '_getSDKVoiceClient').returns({
          setVoiceEnhancementMode
        });

        agent.setVoiceEnhancementMode(mode);

        expect(setVoiceEnhancementMode.calledWith(mode)).to.be.true;
      });
    }

    it('should subscribe to Voice Enhancement mode changed', () => {
      const mockCallback = sinon.stub();
      const mockOnVoiceEnhancementModeChanged = sinon.stub();
      sinon.stub(agent, '_getSDKVoiceClient').returns({
        onVoiceEnhancementModeChanged: mockOnVoiceEnhancementModeChanged
      });
      
      agent.onVoiceEnhancementModeChanged(mockCallback);

      expect(mockOnVoiceEnhancementModeChanged.calledOnce).to.be.true;

      const sdkCallback = mockOnVoiceEnhancementModeChanged.firstCall.args[0];
      
      // Simulate the SDK client calling the callback with voice enhancement mode data
      const testVoiceEnhancementMode = 'VOICE_ISOLATION';
      sdkCallback({ voiceEnhancementMode: testVoiceEnhancementMode });
      
      expect(mockCallback.calledOnce).to.be.true;
      expect(mockCallback.firstCall.args[0]).to.deep.equal({ voiceEnhancementMode: testVoiceEnhancementMode });
    })
  });
});