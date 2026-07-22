// jest.mock is hoisted, so its factory may only reference `mock`-prefixed vars; it delegates
// to these, which beforeEach re-points per test.
const mockConfigure = jest.fn();
const mockInit = jest.fn();
const mockCreateAudioContext = jest.fn();

jest.mock(
  'amazon-chime-sdk-js/libs/voicefocus/voicefocus',
  () => ({
    VoiceFocus: {
      configure: (...args) => mockConfigure(...args),
      init: (...args) => mockInit(...args),
    },
    createAudioContext: (...args) => mockCreateAudioContext(...args),
  }),
  { virtual: false }
);

// Capture the bundle's originals before requiring the raw src (which overwrites
// connect.VoiceFocusProvider / connect.core.voiceFocus as a side effect).
const bundleVoiceFocusProvider = connect.VoiceFocusProvider;
const bundleVoiceFocusManager = connect.core.voiceFocus;

// Requiring the raw src runs its IIFE and returns module.exports (VoiceFocusProvider).
const VoiceFocusProvider = require('../../src/voiceEnhancementProvider');

// jsdom's window.navigator.userAgent is read-only; define a configurable one so
// getBrowserName() (which reads window.navigator.userAgent) can be steered.
function setUserAgent(ua) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

// Enables voice enhancement (GA flag) in VOICE_ISOLATION mode for a test.
function enableVoiceIsolation() {
  connect.core._isAllowVoiceEnhancementGA = true;
  connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('VOICE_ISOLATION');
}

function expectModeMetric(modelMode) {
  expect(connect.core.voiceFocus.addModelLoadingMetric).toHaveBeenCalledWith(
    'VoiceFocusMode',
    1,
    'count',
    { ModelMode: modelMode }
  );
}

function expectErrorMetric(count) {
  expect(connect.core.voiceFocus.addModelLoadingMetric).toHaveBeenCalledWith('VoiceFocusError', count, 'count');
}

function expectDeviceLabelMetric(deviceLabel) {
  expect(connect.core.voiceFocus.addModelLoadingMetric).toHaveBeenCalledWith(
    'VoiceFocusDeviceLabel',
    1,
    'count',
    { DeviceLabel: deviceLabel }
  );
}

function callVoiceEnhanced(stream, onError = jest.fn()) {
  return VoiceFocusProvider.getVoiceEnhancedUserMedia(stream, { onError });
}

describe('VoiceFocusProvider', () => {
  let defaultMediaStream, logData;
  let mockVoiceFocusInstance, mockAudioContext;

  beforeEach(() => {
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn(),
      enumerateDevices: jest.fn().mockResolvedValue([
        { kind: 'audioinput', deviceId: 'default', label: 'Default Microphone' },
        { kind: 'audioinput', deviceId: 'device1', label: 'Test Microphone' },
      ]),
    };

    mockVoiceFocusInstance = {
      // TODO: this code is part of a temporary fix, waiting for ChimeSDK to deploy
      // https://taskei.amazon.dev/tasks/RIPTIDE-2938
      internal: {
        voiceFocusNode: {
          port: {
            postMessage: jest.fn(),
          },
          connect: jest.fn(),
        },
        audioContext: {
          state: 'running',
          createMediaStreamSource: jest.fn().mockReturnValue({
            connect: jest.fn(),
          }),
          createMediaStreamDestination: jest.fn().mockReturnValue({
            stream: { id: 'enhanced' },
          }),
        },
      },
      applyToStream: jest.fn().mockResolvedValue({
        stream: { id: 'enhanced' },
        node: { stop: jest.fn() },
        source: { disconnect: jest.fn() },
        destination: { disconnect: jest.fn() },
      }),
      getModelMetrics: jest.fn(),
      setMode: jest.fn(),
      reset: jest.fn(),
      destroy: jest.fn(),
    };

    mockAudioContext = {
      close: jest.fn(),
    };

    mockConfigure.mockReset().mockResolvedValue({ supported: true });
    mockInit.mockReset().mockResolvedValue(mockVoiceFocusInstance);
    mockCreateAudioContext.mockReset().mockReturnValue(mockAudioContext);

    const getAgentDataProviderStub = {
      getAgentData: jest.fn().mockReturnValue({
        configuration: {
          agentARN: 'arn:aws:connect:us-east-1:123456789012:instance/test-instance-id/agent/test-agent-id',
        },
      }),
      getAWSAccountId: jest.fn().mockReturnValue('123456789012'),
      getInstanceId: jest.fn().mockReturnValue('test-instance-id'),
    };
    connect.core._isAllowVoiceEnhancementGA = false;
    connect.core._isAllowVoiceEnhancement = false;
    // require() is cached, so the VoiceFocusInstanceManager singleton persists across
    // tests - reset its stateful fields so no state (e.g. _streamSource) leaks.
    connect.core.voiceFocus._voiceFocusInstance = null;
    connect.core.voiceFocus._audioContext = null;
    connect.core.voiceFocus._modelLoadingMetrics = {};
    connect.core.voiceFocus._danglingInstances = [];
    connect.core.voiceFocus._streamSource = undefined;
    connect.core.voiceFocus._streamFlowInitialized = false;
    VoiceFocusProvider.modelMode = undefined;
    jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue(getAgentDataProviderStub);
    jest.spyOn(connect.Agent.prototype, 'getVoiceEnhancementMode').mockReturnValue('NONE');
    connect.agent.initialized = true;
    jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
    jest.spyOn(connect, 'contact').mockImplementation(() => {});
    jest.spyOn(connect.core.voiceFocus, 'addModelLoadingMetric');
    jest.spyOn(connect.core.voiceFocus, 'getSDKVoiceClient').mockReturnValue({
      getVoiceEnhancementPaths: jest.fn().mockResolvedValue({
        processors: '/voice-enhancements/static/processors/a9f4ae6259408aa0/',
        workers: '/voice-enhancements/static/workers/a4c68630808dee98/',
        wasm: '/voice-enhancements/static/wasm/78671f7901a4dbd1/',
        models: '/voice-enhancements/static/models/a102d852ddec4d75/',
      }),
    });

    // jsdom's navigator.userAgent is read-only, so define a configurable one that
    // the module reads via window.navigator.userAgent (for getBrowserName tests).
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    defaultMediaStream = { id: 'default-stream' };
    logData = { defaultMediaStream };
  });

  // getAudioDeviceLabel is exercised indirectly via the VoiceFocusDeviceLabel metric.
  describe('getAudioDeviceLabel functionality', () => {
    it.each([
      ['a valid deviceId resolves to its label', [{ getSettings: () => ({ deviceId: 'device1' }) }], 'Test Microphone'],
      ['an unknown deviceId falls back to "unknown"', [{ getSettings: () => ({ deviceId: 'nonexistent' }) }], 'unknown'],
      ['no audio tracks falls back to "unknown"', [], 'unknown'],
    ])('adds the device label metric when %s', async (_desc, audioTracks, expectedLabel) => {
      const mediaStream = { id: 'test-stream', getAudioTracks: () => audioTracks };

      enableVoiceIsolation();

      await callVoiceEnhanced(mediaStream);

      expectDeviceLabelMetric(expectedLabel);
    });

    it('should add "unknown" device label metric when enumerateDevices throws an error', async () => {
      const mediaStream = {
        id: 'test-stream',
        getAudioTracks: () => [{ getSettings: () => ({ deviceId: 'device1' }) }],
      };

      navigator.mediaDevices.enumerateDevices.mockRejectedValue(new Error('Test error'));

      enableVoiceIsolation();

      await callVoiceEnhanced(mediaStream);

      expectDeviceLabelMetric('unknown');
    });
  });

  // getBrowserName is exercised indirectly via the VoiceFocusBrowser metric.
  describe('getBrowserName functionality', () => {
    // Edge UA contains both Chrome and Edg; Safari UA has Safari without Chrome.
    it.each([
      ['Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Chrome'],
      ['Firefox', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0', 'Firefox'],
      ['an unrecognized browser', 'Some unknown browser', 'unknown'],
      ['Safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15', 'Safari'],
      ['Chromium Edge', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59', 'Edge'],
    ])('adds the browser metric for %s', async (_desc, userAgent, expectedBrowser) => {
      setUserAgent(userAgent);
      enableVoiceIsolation();

      await callVoiceEnhanced({ id: 'test-stream' });

      expect(connect.core.voiceFocus.addModelLoadingMetric).toHaveBeenCalledWith(
        'VoiceFocusBrowser',
        1,
        'count',
        { BrowserName: expectedBrowser }
      );
    });
  });

  describe('getVoiceEnhancedUserMedia', () => {
    it('should return default media stream when voice focus is disabled', async () => {
      const mediaStream = { id: 'dummy' };
      const onError = jest.fn();

      const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError });
      expect(result).toBe(mediaStream);
      expect(onError).not.toHaveBeenCalled();
    });

    describe('Audio Constraints Validation for Voice Enhancement', () => {
      it('should validate input stream has proper audio tracks', async () => {
        const mediaStreamWithAudio = {
          id: 'test-stream',
          getAudioTracks: () => [{ kind: 'audio', enabled: true }],
        };

        enableVoiceIsolation();

        mockVoiceFocusInstance.applyToStream.mockResolvedValue({
          stream: { id: 'enhanced' },
          node: { stop: jest.fn() },
          source: { disconnect: jest.fn() },
          destination: { disconnect: jest.fn() },
        });

        const result = await callVoiceEnhanced(mediaStreamWithAudio);

        expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
        expect(result.id).toBe('enhanced');
      });

    });

    it('should return default media stream when the manifest is corrupted', async () => {
      const mediaStream = { id: 'dummy' };

      // Enable VE so we actually reach _initialize and hit the corrupted-manifest
      // rejection; otherwise the code short-circuits on VE-disabled and the
      // getVoiceEnhancementPaths mock is never exercised.
      enableVoiceIsolation();
      connect.core.voiceFocus.getSDKVoiceClient.mockReturnValue({
        getVoiceEnhancementPaths: jest.fn().mockRejectedValue(new Error()),
      });

      const result = await callVoiceEnhanced(mediaStream);

      expect(result).toBe(mediaStream); // falls back to the original stream on failure
      expectModeMetric('tve');
    });

    it('should return TVE enhanced media stream when voice focus is enabled with voice isolation', async () => {
      const sourceMediaStream = { id: 'source' };

      enableVoiceIsolation();

      const result = await callVoiceEnhanced(sourceMediaStream);

      expect(result.id).toBe('enhanced');
      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
      expect(mockConfigure).toHaveBeenCalledWith(expect.objectContaining({ mode: 'tve' }), expect.anything());
      expectModeMetric('tve');
      expectErrorMetric(0);
    });

    it('should return enhanced media stream when voice focus is enabled with noise suppression', async () => {
      const inputMediaStream = { id: 'input' };

      connect.core._isAllowVoiceEnhancementGA = true;
      connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('NOISE_SUPPRESSION');

      const result = await callVoiceEnhanced(inputMediaStream);

      expect(result.id).toBe('enhanced');
      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
      expect(mockConfigure).toHaveBeenCalledWith(expect.objectContaining({ mode: 'ns' }), expect.anything());
      expectModeMetric('ns');
      expectErrorMetric(0);
    });

    it('should return default media stream when the voice focus is not supported', async () => {
      const sourceMediaStream = { id: 'source' };
      enableVoiceIsolation();
      mockConfigure.mockResolvedValue({ supported: false });

      const result = await callVoiceEnhanced(sourceMediaStream);

      expect(result).toBe(sourceMediaStream);
      expectModeMetric('tve');
      expectErrorMetric(1);
    });

    it('should return default media stream when an error occurs in creating audio context', async () => {
      const sourceMediaStream = { id: 'source' };
      enableVoiceIsolation();
      mockCreateAudioContext.mockImplementation(() => {
        throw new Error('AudioContext creation failed');
      });

      const result = await callVoiceEnhanced(sourceMediaStream);

      expect(result).toBe(sourceMediaStream);
      expectModeMetric('tve');
      expectErrorMetric(1);
    });

    it('should return default media stream when an error occurs in creating enhanced stream', async () => {
      const sourceMediaStream = { id: 'source' };
      const onError = jest.fn();
      enableVoiceIsolation();

      mockVoiceFocusInstance.applyToStream = jest.fn().mockImplementation(() => {
        throw new Error('Enhanced stream creation failed');
      });

      const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError });

      expect(result).toBe(sourceMediaStream);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
      expectModeMetric('tve');
      expectErrorMetric(1);
    });

    it('should return default media stream when voice enhancement timeout exceeded', async () => {
      const sourceMediaStream = { id: 'source' };
      const onError = jest.fn();
      await VoiceFocusProvider.cleanVoiceFocus();
      enableVoiceIsolation();

      mockVoiceFocusInstance.applyToStream = jest.fn().mockReturnValue(new Promise(() => {}));

      const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError });

      expect(result).toBe(sourceMediaStream);
      expect(onError).toHaveBeenCalledTimes(1);
      expectModeMetric('tve');
      expect(connect.core.voiceFocus.addModelLoadingMetric).toHaveBeenCalledWith(
        'VoiceFocusError',
        1,
        'count',
        { ErrorType: 'Timeout' }
      );
    }, 7000);

    it('should clean up voice focus resources when called cleanVoiceFocus', async () => {
      const sourceMediaStream = { id: 'source' };

      enableVoiceIsolation();

      mockVoiceFocusInstance.applyToStream = jest.fn().mockResolvedValue({
        stream: { id: 'enhanced' },
        node: { stop: jest.fn() },
        source: { disconnect: jest.fn() },
        destination: { disconnect: jest.fn() },
      });

      await callVoiceEnhanced(sourceMediaStream);
      await VoiceFocusProvider.cleanVoiceFocus();

      expect(mockVoiceFocusInstance.internal.voiceFocusNode.port.postMessage).toHaveBeenCalledWith({ message: 'reset' });
    });

    it('should handle failure when cleaning up voice focus resources', async () => {
      const sourceMediaStream = { id: 'source' };

      enableVoiceIsolation();

      mockVoiceFocusInstance.internal.voiceFocusNode.port.postMessage = jest.fn().mockImplementation(() => {
        throw new Error('Failed to clean up voice focus resources');
      });

      mockVoiceFocusInstance.applyToStream = jest.fn().mockResolvedValue({
        stream: { id: 'enhanced' },
        node: { stop: jest.fn() },
        source: { disconnect: jest.fn() },
        destination: { disconnect: jest.fn() },
      });

      await callVoiceEnhanced(sourceMediaStream);
      await VoiceFocusProvider.cleanVoiceFocus();

      expect(mockVoiceFocusInstance.destroy).toHaveBeenCalled();
    });
  });

  describe('voiceFocusMetrics', () => {
    it('should publish voice focus metrics', async () => {
      const enhancedMediaStream = { id: 'enhanced' };

      enableVoiceIsolation();
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({
        stream: enhancedMediaStream,
      });
      mockVoiceFocusInstance.getModelMetrics.mockReturnValue({
        latencyMillisAverage: 123,
        snr: {
          average: 1.2,
          variance: 2.3,
          averageActive: 3.4,
          varianceActive: 4.5,
        },
        drr: {
          average: 5.6,
          variance: 6.7,
          averageActive: 7.8,
          varianceActive: 8.9,
        },
        vad: {
          average: 9.1,
        },
        cpu: {
          lateInvoke: 10.11,
          longInvoke: 11.12,
        },
      });

      const sourceMediaStream = { id: 'source' };
      await callVoiceEnhanced(sourceMediaStream);

      connect.publishMetric.mockReturnValue(true);

      VoiceFocusProvider.publishMetrics({ contactId: 'test-contact' });

      // Latency
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusLatencyAverage',
        data: { latency: 123, dimensions: { ContactId: 'test-contact' } },
      });
      // SNR metrics
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusSNRAverage',
        data: { value: 1.2, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusSNRVariance',
        data: { value: 2.3, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusSNRAverageActive',
        data: { value: 3.4, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusSNRVarianceActive',
        data: { value: 4.5, dimensions: { ContactId: 'test-contact' } },
      });
      // DRR metrics
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusDRRAverage',
        data: { value: 5.6, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusDRRVariance',
        data: { value: 6.7, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusDRRAverageActive',
        data: { value: 7.8, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusDRRVarianceActive',
        data: { value: 8.9, dimensions: { ContactId: 'test-contact' } },
      });
      // VAD metrics
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusVADAverage',
        data: { value: 9.1, dimensions: { ContactId: 'test-contact' } },
      });
      // CPU metrics
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusCPULateInvoke',
        data: { count: 10.11, dimensions: { ContactId: 'test-contact' } },
      });
      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'VoiceFocusCPULongInvoke',
        data: { count: 11.12, dimensions: { ContactId: 'test-contact' } },
      });
    });

    it('should not publish when getModelMetrics returns null', async () => {
      // Initialize the instance (and modelMode) via the real path, then make
      // getModelMetrics return null SYNCHRONOUSLY (source calls it synchronously;
      // mockResolvedValue would return a truthy Promise and pass for the wrong reason).
      enableVoiceIsolation();
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({ stream: { id: 'enhanced' } });
      await callVoiceEnhanced({ id: 'source' });

      mockVoiceFocusInstance.getModelMetrics.mockReturnValue(null);
      connect.core.voiceFocus._modelLoadingMetrics = {};

      VoiceFocusProvider.publishMetrics({ contactId: 'test-contact' });

      expect(mockVoiceFocusInstance.getModelMetrics).toHaveBeenCalled();
      expect(connect.publishMetric).not.toHaveBeenCalled();
    });

    it('should publish metrics even when modelMode is not set', async () => {
      connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('NONE');
      await callVoiceEnhanced({ id: 'source' });

      connect.core.voiceFocus._modelLoadingMetrics = {
        'test-contact': {
          TestMetric: {
            MetricName: 'TestMetric',
            MetricValue: 1,
            MetricType: 'count',
          },
        },
      };

      VoiceFocusProvider.publishMetrics({ contactId: 'test-contact' });

      expect(connect.publishMetric).toHaveBeenCalled();
    });

    it('should fail gracefully if the model cannot provide the metrics', async () => {
      enableVoiceIsolation();
      mockVoiceFocusInstance.getModelMetrics.mockImplementation(() => {
        throw new Error();
      });

      const sourceMediaStream = { id: 'source' };
      await callVoiceEnhanced(sourceMediaStream);

      VoiceFocusProvider.publishMetrics({ contactId: 'test-contact' });
    });
  });

  describe('setMode', () => {
    it.each(['tve', 'ns'])('delegates a valid mode (%s) to the underlying VoiceFocus instance', (mode) => {
      const setMode = jest.fn();
      connect.core.voiceFocus._voiceFocusInstance = { setMode };
      connect.core.voiceFocus.setMode(mode);
      expect(setMode).toHaveBeenCalledWith(mode);
    });

    it('should not be supported changing the voice focus mode to invalid values', () => {
      expect(() => connect.core.voiceFocus.setMode('invalid')).toThrow('Invalid mode: invalid');
    });
  });

  describe('initializeAndApplyToStream', () => {
    let mockStream;

    beforeEach(() => {
      mockStream = { id: 'test-stream' };
      connect.core.voiceFocus._voiceFocusInstance = null;
      connect.core.voiceFocus._audioContext = null;
    });

    it('should initialize and apply stream successfully', async () => {
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({
        stream: { id: 'enhanced' },
        node: { stop: jest.fn() },
        source: { disconnect: jest.fn() },
        destination: { disconnect: jest.fn() },
      });

      const result = await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');

      expect(connect.core.voiceFocus._voiceFocusInstance).not.toBeNull();
      expect(connect.core.voiceFocus._audioContext).not.toBeNull();
      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
      expect(result.stream.id).toBe('enhanced');
    });

    it('should throw error if initialization fails', async () => {
      mockInit.mockRejectedValue(new Error('Initialization failed'));

      try {
        await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Initialization failed');
      }
    });

    it('should throw error if voice focus instance is not initialized', async () => {
      mockInit.mockResolvedValue(null);
      connect.core.voiceFocus._voiceFocusInstance = null;

      try {
        await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Failed to initialize voice focus instance');
      }
    });

    it('should not reinitialize if already initialized', async () => {
      connect.core.voiceFocus._voiceFocusInstance = mockVoiceFocusInstance;
      connect.core.voiceFocus._audioContext = mockAudioContext;
      mockInit.mockClear();
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({
        stream: { id: 'enhanced' },
      });

      await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');

      expect(mockInit).not.toHaveBeenCalled();
      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledTimes(1);
    });

    it('should handle applyToStream errors', async () => {
      mockVoiceFocusInstance.applyToStream.mockRejectedValue(new Error('Apply stream failed'));

      try {
        await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Apply stream failed');
      }
    });

    it('should work with noise suppression mode', async () => {
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({
        stream: { id: 'enhanced-ns' },
      });

      const result = await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'ns');

      expect(mockConfigure).toHaveBeenCalledWith(expect.objectContaining({ mode: 'ns' }), expect.anything());
      expect(result.stream.id).toBe('enhanced-ns');
    });
  });

  // TODO: this code is part of a temporary fix, waiting for ChimeSDK to deploy
  // https://taskei.amazon.dev/tasks/RIPTIDE-2938
  describe('VoiceFocusInstanceManager applyToStream', () => {
    let mockStream, mockSource, mockDestination;

    beforeEach(() => {
      mockStream = { id: 'test-stream' };
      mockSource = { connect: jest.fn() };
      mockDestination = { stream: { id: 'destination-stream' } };

      mockVoiceFocusInstance.internal.audioContext.createMediaStreamSource.mockReturnValue(mockSource);
      mockVoiceFocusInstance.internal.audioContext.createMediaStreamDestination.mockReturnValue(mockDestination);

      connect.core.voiceFocus._voiceFocusInstance = mockVoiceFocusInstance;
      connect.core.voiceFocus._audioContext = mockVoiceFocusInstance.internal.audioContext;
    });

    it('should use temporary fix path when streamFlowInitialized is true and audioContext is running', async () => {
      connect.core.voiceFocus._streamFlowInitialized = true;

      await connect.core.voiceFocus.applyToStream(mockStream);

      expect(mockVoiceFocusInstance.internal.audioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
      expect(mockSource.connect).toHaveBeenCalledWith(mockVoiceFocusInstance.internal.voiceFocusNode);
      expect(mockVoiceFocusInstance.internal.voiceFocusNode.connect).toHaveBeenCalledWith(mockDestination);
      expect(mockVoiceFocusInstance.applyToStream).not.toHaveBeenCalled();
    });

    it('should use regular path when streamFlowInitialized is false', async () => {
      connect.core.voiceFocus._streamFlowInitialized = false;
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({ stream: mockStream, source: { disconnect: jest.fn() } });

      await connect.core.voiceFocus.applyToStream(mockStream);

      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledWith(mockStream, connect.core.voiceFocus._audioContext);
      expect(connect.core.voiceFocus._streamFlowInitialized).toBe(true);
    });

    it('should use regular path when audioContext state is not running', async () => {
      connect.core.voiceFocus._streamFlowInitialized = true;
      mockVoiceFocusInstance.internal.audioContext.state = 'suspended';
      mockVoiceFocusInstance.applyToStream.mockResolvedValue({ stream: mockStream });

      await connect.core.voiceFocus.applyToStream(mockStream);

      expect(mockVoiceFocusInstance.applyToStream).toHaveBeenCalledWith(mockStream, connect.core.voiceFocus._audioContext);
    });
  });

  describe('Firefox sample rate handling', () => {
    let isFirefoxBrowserSpy;

    beforeEach(() => {
      isFirefoxBrowserSpy = jest.spyOn(connect, 'isFirefoxBrowser').mockImplementation(() => {});
      enableVoiceIsolation();
    });

    // executionQuantaPreference is 1 for Firefox in [14kHz, 16kHz], 3 otherwise (incl. non-Firefox).
    it.each([
      ['non-Firefox', false, 48000, 3],
      ['Firefox 14kHz-16kHz range', true, 15000, 1],
      ['Firefox at exactly 16kHz (COMPUTE_CAPACITY_LIMIT boundary, <=)', true, 16000, 1],
      ['Firefox at exactly 40kHz (QUANTA_SAMPLE_RATE_LIMIT_MAX boundary, not <)', true, 40000, 3],
    ])('sets executionQuantaPreference for %s', async (_desc, isFirefox, sampleRate, expectedQuanta) => {
      isFirefoxBrowserSpy.mockReturnValue(isFirefox);
      mockAudioContext.sampleRate = sampleRate;

      await callVoiceEnhanced({ id: 'test' });

      expect(mockConfigure).toHaveBeenCalledWith(
        expect.objectContaining({ executionQuantaPreference: expectedQuanta }),
        expect.anything()
      );
    });

    // Firefox sample rates outside [14kHz, 40kHz] throw, fall back to the original stream, and tag an error metric.
    it.each([
      ['below 14kHz', 12000],
      ['16kHz-40kHz range', 32000],
      ['exactly 14kHz (QUANTA_SAMPLE_RATE_LIMIT_MIN boundary, not >)', 14000],
    ])('throws for Firefox sample rate %s', async (_desc, sampleRate) => {
      isFirefoxBrowserSpy.mockReturnValue(true);
      mockAudioContext.sampleRate = sampleRate;

      const result = await callVoiceEnhanced({ id: 'test' });

      expect(result.id).toBe('test');
      expectErrorMetric(1);
    });
  });

  describe('VoiceFocusInstanceManager._initialize', () => {
    beforeEach(() => {
      connect.core.voiceFocus._voiceFocusInstance = null;
      connect.core.voiceFocus._audioContext = null;
      connect.core.voiceFocus._danglingInstances = [];
      jest.spyOn(connect, 'isFirefoxBrowser').mockReturnValue(false);
    });

    it('fetches paths, configures, inits, and stores the VoiceFocus instance', async () => {
      mockConfigure.mockReset().mockResolvedValue({ supported: true });
      mockInit.mockReset().mockResolvedValue(mockVoiceFocusInstance);

      await connect.core.voiceFocus._initialize({ mode: 'tve', contactId: 'c1' });

      expect(mockConfigure).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'tve', variant: 'c50', executionQuantaPreference: 3 }),
        expect.anything()
      );
      expect(connect.core.voiceFocus._voiceFocusInstance).toBe(mockVoiceFocusInstance);
      expect(connect.core.voiceFocus._danglingInstances).toContain(mockVoiceFocusInstance);
    });

    it('throws and nulls the instance when configure reports unsupported', async () => {
      mockConfigure.mockReset().mockResolvedValue({ supported: false });

      await expect(connect.core.voiceFocus._initialize({ mode: 'tve', contactId: 'c1' }))
        .rejects.toThrow('VoiceFocus not supported on this platform');
      expect(connect.core.voiceFocus._voiceFocusInstance).toBeNull();
    });

    it('throws and nulls the instance when getVoiceEnhancementPaths rejects', async () => {
      jest.spyOn(connect.core.voiceFocus, 'getSDKVoiceClient').mockReturnValue({
        getVoiceEnhancementPaths: jest.fn().mockRejectedValue(new Error('paths failed')),
      });

      await expect(connect.core.voiceFocus._initialize({ mode: 'tve', contactId: 'c1' }))
        .rejects.toThrow('paths failed');
      expect(connect.core.voiceFocus._voiceFocusInstance).toBeNull();
    });
  });

  describe('VoiceFocusInstanceManager.publishMetrics (with model metrics)', () => {
    it('maps and publishes all model metrics when getModelMetrics returns data and a mode is set', () => {
      const publishSpy = jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      connect.core.voiceFocus._modelLoadingMetrics = {};
      connect.core.voiceFocus._voiceFocusInstance = {
        getModelMetrics: jest.fn().mockReturnValue({
          latencyMillisAverage: 12,
          snr: { average: 1, variance: 2, averageActive: 3, varianceActive: 4 },
          drr: { average: 5, variance: 6, averageActive: 7, varianceActive: 8 },
          vad: { average: 9 },
          cpu: { lateInvoke: 10, longInvoke: 11 },
        }),
      };

      connect.core.voiceFocus.publishMetrics({ contactId: 'c1', mode: 'tve' });

      // 12 model metrics emitted (latency + 4 snr + 4 drr + 1 vad + 2 cpu)
      expect(publishSpy.mock.calls.length).toBe(12);
      // publishMetric is invoked with a { name, data } payload; read the metric name from it.
      const names = publishSpy.mock.calls.map((c) => (c[0] && c[0].name) || c[0]);
      expect(names).toContain('VoiceFocusLatencyAverage');
      expect(names).toContain('VoiceFocusCPULongInvoke');
    });
  });
});

describe('VoiceFocusProvider bundle coverage', () => {
  beforeEach(() => {
    connect.VoiceFocusProvider = bundleVoiceFocusProvider;
    connect.core.voiceFocus = bundleVoiceFocusManager;
    connect.core.voiceFocus._modelLoadingMetrics = {};

    jest.spyOn(connect.Agent.prototype, 'getVoiceEnhancementMode').mockReturnValue('NONE');
    jest.spyOn(connect.core.voiceFocus, 'initializeAndApplyToStream').mockImplementation(() => {});
    jest.spyOn(connect.core.voiceFocus, 'setMode').mockImplementation(() => {});
    connect.agent.initialized = true;
  });

  it('should store VoiceFocusMode metric when voice focus is disabled', async () => {
    const stream = { id: 'source' };

    const result = await connect.VoiceFocusProvider.getVoiceEnhancedUserMedia(stream, { onError: jest.fn() });

    expect(result).toBe(stream);
    expect(connect.core.voiceFocus._modelLoadingMetrics).toHaveProperty('VoiceFocusMode');
  });

  it('should store VoiceFocusError metric on happy path', async () => {
    connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('VOICE_ISOLATION');
    connect.core.voiceFocus.initializeAndApplyToStream.mockResolvedValue({ stream: { id: 'enhanced' } });
    const stream = { id: 'source', getAudioTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }] };

    const result = await connect.VoiceFocusProvider.getVoiceEnhancedUserMedia(stream, { onError: jest.fn() });

    expect(result.id).toBe('enhanced');
    expect(connect.core.voiceFocus._modelLoadingMetrics).toHaveProperty('VoiceFocusError');
    expect(connect.core.voiceFocus._modelLoadingMetrics['VoiceFocusError'].MetricValue).toBe(0);
  });

  it('should store VoiceFocusError metric on error path', async () => {
    connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('VOICE_ISOLATION');
    connect.core.voiceFocus.initializeAndApplyToStream.mockRejectedValue(new Error('fail'));
    const stream = { id: 'source', getAudioTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }] };

    const result = await connect.VoiceFocusProvider.getVoiceEnhancedUserMedia(stream, { onError: jest.fn() });

    expect(result).toBe(stream);
    expect(connect.core.voiceFocus._modelLoadingMetrics).toHaveProperty('VoiceFocusError');
    expect(connect.core.voiceFocus._modelLoadingMetrics['VoiceFocusError'].MetricValue).toBe(1);
    expect(connect.core.voiceFocus._modelLoadingMetrics).toHaveProperty('VoiceFocusElapsedTime');
    expect(connect.core.voiceFocus._modelLoadingMetrics['VoiceFocusElapsedTime'].Dimensions).toEqual({ ErrorType: 'Generic' });
  });

  it('should handle timeout and tag metrics with Timeout ErrorType via bundle', async () => {
    connect.Agent.prototype.getVoiceEnhancementMode.mockReturnValue('VOICE_ISOLATION');
    connect.core.voiceFocus.initializeAndApplyToStream.mockReturnValue(new Promise(() => {})); // never resolves
    const stream = { id: 'source', getAudioTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }] };

    const result = await connect.VoiceFocusProvider.getVoiceEnhancedUserMedia(stream, { onError: jest.fn() });

    expect(result).toBe(stream);
    expect(connect.core.voiceFocus._modelLoadingMetrics).toHaveProperty('VoiceFocusError');
    expect(connect.core.voiceFocus._modelLoadingMetrics['VoiceFocusError'].Dimensions).toEqual({ ErrorType: 'Timeout' });
  }, 7000);

  it('should clear metrics after publishMetrics', () => {
    connect.core.voiceFocus.addModelLoadingMetric('VoiceFocusMode', 1, 'count', { ModelMode: 'tve' });

    jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
    connect.core.voiceFocus.publishMetrics({ contactId: 'contact-A', mode: 'tve' });

    expect(Object.keys(connect.core.voiceFocus._modelLoadingMetrics)).toHaveLength(0);
  });

  it('destroy() destroys every dangling instance and clears state', async () => {
    const inst1 = { destroy: jest.fn() };
    const inst2 = { destroy: jest.fn() };
    connect.core.voiceFocus._danglingInstances = [inst1, inst2];
    connect.core.voiceFocus._voiceFocusInstance = { internal: {} };
    connect.core.voiceFocus._audioContext = {};

    await connect.core.voiceFocus.destroy();

    expect(inst1.destroy).toHaveBeenCalledTimes(1);
    expect(inst2.destroy).toHaveBeenCalledTimes(1);
    expect(connect.core.voiceFocus._voiceFocusInstance).toBeNull();
    expect(connect.core.voiceFocus._audioContext).toBeNull();
    expect(connect.core.voiceFocus._danglingInstances).toEqual([]);
  });

  it('destroy() still clears state in the finally block when a dangling instance throws', async () => {
    const throwing = { destroy: jest.fn(() => { throw new Error('boom'); }) };
    connect.core.voiceFocus._danglingInstances = [throwing];
    connect.core.voiceFocus._voiceFocusInstance = { internal: {} };
    connect.core.voiceFocus._modelLoadingMetrics = { 'c': {} };

    await connect.core.voiceFocus.destroy();

    expect(throwing.destroy).toHaveBeenCalledTimes(1);
    expect(connect.core.voiceFocus._voiceFocusInstance).toBeNull();
    expect(connect.core.voiceFocus._danglingInstances).toEqual([]);
    expect(connect.core.voiceFocus._modelLoadingMetrics).toEqual({});
  });

  it('should disconnect existing source when applying new stream', async () => {
    const oldSource = { disconnect: jest.fn() };
    connect.core.voiceFocus._streamSource = oldSource;
    connect.core.voiceFocus._streamFlowInitialized = true;

    const mockAudioCtx = {
      state: 'running',
      createMediaStreamSource: jest.fn().mockReturnValue({ connect: jest.fn() }),
      createMediaStreamDestination: jest.fn().mockReturnValue({ stream: { id: 'dest' } }),
    };
    connect.core.voiceFocus._audioContext = mockAudioCtx;
    connect.core.voiceFocus._voiceFocusInstance = {
      internal: {
        voiceFocusNode: { connect: jest.fn() },
        audioContext: mockAudioCtx,
      },
    };

    await connect.core.voiceFocus.applyToStream({ id: 'new-stream' });

    expect(oldSource.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should skip initialization when already initialized', async () => {
    connect.core.voiceFocus._voiceFocusInstance = { applyToStream: jest.fn() };
    connect.core.voiceFocus._audioContext = {};
    const initSpy = jest.spyOn(connect.core.voiceFocus, '_initialize');

    await connect.core.voiceFocus.initialize({ mode: 'tve' });

    // isInitialized() is true, so the guard returns early and _initialize is never called.
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('should call applyToStream after initializing via initializeAndApplyToStream', async () => {
    // Restore the stub so we call the real method
    connect.core.voiceFocus.initializeAndApplyToStream.mockRestore();
    // Pre-initialize to skip _initialize (which needs real SDK)
    const mockApplyResult = { stream: { id: 'enhanced' }, source: { disconnect: jest.fn() } };
    connect.core.voiceFocus._voiceFocusInstance = {
      applyToStream: jest.fn().mockResolvedValue(mockApplyResult),
      internal: null,
    };
    connect.core.voiceFocus._audioContext = {};
    connect.core.voiceFocus._streamFlowInitialized = false;
    connect.core.voiceFocus._streamSource = null;

    const result = await connect.core.voiceFocus.initializeAndApplyToStream({ id: 'test' }, 'tve');

    expect(result.stream.id).toBe('enhanced');
  });
});
