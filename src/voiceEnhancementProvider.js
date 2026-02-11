const VOICE_FOCUS_ERROR_METRIC = 'VoiceFocusError';
const VOICE_FOCUS_MODE_METRIC = 'VoiceFocusMode';
const VOICE_FOCUS_ELAPSED_TIME_METRIC = 'VoiceFocusElapsedTime';
const VOICE_FOCUS_CLEARED_METRIC = 'VoiceFocusCleared';
const VOICE_FOCUS_DEVICE_LABEL_METRIC = 'VoiceFocusDeviceLabel';
const VOICE_FOCUS_BROWSER_METRIC = 'VoiceFocusBrowser';
const METRIC_ERROR_TYPE = 'ErrorType';
const AUDIO_CONTEXT_SAMPLE_RATE = 48000;
const QUANTA_SAMPLE_RATE_LIMIT_MAX = 40000;
const QUANTA_SAMPLE_RATE_LIMIT_MIN = 14000;
const COMPUTE_CAPACITY_LIMIT = 16000;

// Model metrics
const VOICE_FOCUS_LATENCY_AVERAGE = 'VoiceFocusLatencyAverage';
const VOICE_FOCUS_SNR_AVERAGE = 'VoiceFocusSNRAverage';
const VOICE_FOCUS_SNR_VARIANCE = 'VoiceFocusSNRVariance';
const VOICE_FOCUS_SNR_AVERAGE_ACTIVE = 'VoiceFocusSNRAverageActive';
const VOICE_FOCUS_SNR_VARIANCE_ACTIVE = 'VoiceFocusSNRVarianceActive';
const VOICE_FOCUS_DRR_AVERAGE = 'VoiceFocusDRRAverage';
const VOICE_FOCUS_DRR_VARIANCE = 'VoiceFocusDRRVariance';
const VOICE_FOCUS_DRR_AVERAGE_ACTIVE = 'VoiceFocusDRRAverageActive';
const VOICE_FOCUS_DRR_VARIANCE_ACTIVE = 'VoiceFocusDRRVarianceActive';
const VOICE_FOCUS_VAD_AVERAGE = 'VoiceFocusVADAverage';
const VOICE_FOCUS_CPU_LATE_INVOKE = 'VoiceFocusCPULateInvoke';
const VOICE_FOCUS_CPU_LONG_INVOKE = 'VoiceFocusCPULongInvoke';

(function () {
  const global = this || globalThis;
  const connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  /* eslint-disable-next-line */
  const { VoiceFocus, createAudioContext } = require('amazon-chime-sdk-js/libs/voicefocus/voicefocus');
  /* eslint-disable-next-line */
  const { VoiceClient } = require('@amazon-connect/voice');

  const logPrefix = '[VoiceFocus]';

  const voiceEnhancementModeToModelMode = {
    VOICE_ISOLATION: 'tve',
    NOISE_SUPPRESSION: 'ns',
  };

  /**
   * Gets the additional metadata from the connect object.
   *
   * @returns {Object} - An object containing the common metric dimensions.
   */
  const getAdditionalMetadata = function () {
    const agentMetadata = {};
    let agentARN;
    let accountId;
    let instanceId;
    try {
      agentARN = connect.core?.getAgentDataProvider()?.getAgentData()?.configuration?.agentARN;
      accountId = connect.core?.getAgentDataProvider()?.getAWSAccountId();
      instanceId = connect.core?.getAgentDataProvider()?.getInstanceId();
    } catch (error) {
      connect.getLog().warn(`${logPrefix} Error in getting additional metadata.`).sendInternalLogToServer();
    } finally {
      if (accountId) {
        agentMetadata.accountId = accountId;
      }
      if (instanceId) {
        agentMetadata.instanceId = instanceId;
      }
      if (agentARN) {
        agentMetadata.agentId = agentARN.split('/').pop();
      }
    }
    return agentMetadata;
  };

  /**
   * Gets the device label of the audio track from the provided media stream.
   *
   * @param {MediaStream} mediaStream - The media stream containing the audio track
   * @returns {string} - The label of the audio device or 'unknown' if not available.
   */
  const getAudioDeviceLabel = function (mediaStream) {
    try {
      if (mediaStream && mediaStream.getAudioTracks && mediaStream.getAudioTracks().length > 0) {
        const audioTrack = mediaStream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();

        if (settings && settings.deviceId) {
          return navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
              const audioDevice = devices.find(
                (device) => device.kind === 'audioinput' && device.deviceId === settings.deviceId
              );

              return audioDevice ? audioDevice.label : 'unknown';
            })
            .catch((error) => {
              connect.getLog().warn('Error getting audio device label:', error).sendInternalLogToServer();
              return 'unknown';
            });
        }
      }
      return Promise.resolve('unknown');
    } catch (error) {
      connect.getLog().warn('Error getting audio device label:', error).sendInternalLogToServer();
      return Promise.resolve('unknown');
    }
  };

  /**
   * Gets the browser name from navigator.userAgent
   *
   * @returns {string} - The name of the browser
   */
  const getBrowserName = function () {
    const { userAgent } = window.navigator;
    let browserName = 'unknown';

    if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Firefox') !== -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'Safari';
    } else if (userAgent.indexOf('Edg') !== -1) {
      browserName = 'Edge';
    }

    return browserName;
  };

  /**
   * Utility method to publish a connect metric.
   * @param {string} metricName
   * @param {int} metricValue
   * @param {string} metricKey (defaults to 'count')
   * @param {Object} moreDimensions
   */
  const publishMetric = function (metricName, metricValue, metricKey = 'count', moreDimensions = {}) {
    connect.publishMetric({
      name: metricName,
      data: {
        [metricKey]: metricValue,
        dimensions: {
          ...moreDimensions,
        },
      },
    });
  };

  /**
   * Custom logger to redirect log lines from chime-sdk.
   * @implements {import('amazon-chime-sdk-js/libs/voicefocus/types').Logger}
   */
  class VoiceFocusLogger {
    format(...args) {
      return `${logPrefix} ${args
        .map((arg) => (arg && typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ')}`;
    }

    buildLogObject(logObject = {}) {
      return {
        ...logObject,
        ...getAdditionalMetadata(),
      };
    }

    debug(...args) {
      connect
        .getLog()
        .debug(this.format(...args))
        .withObject(this.buildLogObject())
        .sendInternalLogToServer();
    }

    info(...args) {
      connect
        .getLog()
        .info(this.format(...args))
        .withObject(this.buildLogObject())
        .sendInternalLogToServer();
    }

    warn(...args) {
      connect
        .getLog()
        .warn(this.format(...args))
        .withObject(this.buildLogObject())
        .sendInternalLogToServer();
    }

    error(...args) {
      connect
        .getLog()
        .error(this.format(...args))
        .withObject(this.buildLogObject())
        .sendInternalLogToServer();
    }

    log(content, logObject = {}) {
      connect.getLog().log(this.format(content)).withObject(this.buildLogObject(logObject)).sendInternalLogToServer();
    }
  }

  /** *
   * Initialize voice focus instance from chime-sdk.
   */
  class VoiceFocusInstanceManager {
    constructor(logger) {
      this._voiceClient = null;
      this._logger = logger;
      this._voiceFocusInstance = null;
      this._audioContext = null;
      this._modelLoadingMetrics = {};
      this._danglingInstances = [];

      this._streamSource = undefined;
      this._streamFlowInitialized = false;
    }

    async initialize({ mode }) {
      if (this.isInitialized()) {
        this._logger.info('Voice Focus instance is already initialized');
        return;
      }
      await this._initialize({ mode });
    }

    isInitialized() {
      return this._voiceFocusInstance && this._audioContext;
    }

    setMode(mode) {
      if (mode !== 'tve' && mode !== 'ns') {
        this._logger.error(`Invalid mode: ${mode}`);
        throw new Error(`Invalid mode: ${mode}`);
      }

      this._voiceFocusInstance?.setMode(mode);
    }

    addModelLoadingMetric(metricName, metricValue, metricType, dimensions) {
      this._modelLoadingMetrics[metricName] = {
        MetricName: metricName,
        MetricValue: metricValue,
        MetricType: metricType,
        Dimensions: dimensions,
      };
    }

    publishMetrics({ contactId, mode }) {
      let metricsToPublish = Object.values(this._modelLoadingMetrics);

      try {
        const modelMetrics = this._voiceFocusInstance?.getModelMetrics();
        if (modelMetrics && mode) {
          // Define metric configurations to reduce duplication
          const metricConfigs = [
            { name: VOICE_FOCUS_LATENCY_AVERAGE, value: modelMetrics.latencyMillisAverage, type: 'latency' },
            { name: VOICE_FOCUS_SNR_AVERAGE, value: modelMetrics.snr.average, type: 'value' },
            { name: VOICE_FOCUS_SNR_VARIANCE, value: modelMetrics.snr.variance, type: 'value' },
            { name: VOICE_FOCUS_SNR_AVERAGE_ACTIVE, value: modelMetrics.snr.averageActive, type: 'value' },
            { name: VOICE_FOCUS_SNR_VARIANCE_ACTIVE, value: modelMetrics.snr.varianceActive, type: 'value' },
            { name: VOICE_FOCUS_DRR_AVERAGE, value: modelMetrics.drr.average, type: 'value' },
            { name: VOICE_FOCUS_DRR_VARIANCE, value: modelMetrics.drr.variance, type: 'value' },
            { name: VOICE_FOCUS_DRR_AVERAGE_ACTIVE, value: modelMetrics.drr.averageActive, type: 'value' },
            { name: VOICE_FOCUS_DRR_VARIANCE_ACTIVE, value: modelMetrics.drr.varianceActive, type: 'value' },
            { name: VOICE_FOCUS_VAD_AVERAGE, value: modelMetrics.vad.average, type: 'value' },
            { name: VOICE_FOCUS_CPU_LATE_INVOKE, value: modelMetrics.cpu.lateInvoke, type: 'count' },
            { name: VOICE_FOCUS_CPU_LONG_INVOKE, value: modelMetrics.cpu.longInvoke, type: 'count' },
          ];

          // Map configurations to the required format
          metricsToPublish = metricsToPublish.concat(
            metricConfigs.map((config) => ({
              MetricName: config.name,
              MetricValue: config.value,
              MetricType: config.type,
            }))
          );
        }
      } catch (error) {
        this._logger.error(`Failed to get the VoiceFocus model metrics: ${error}`);
      }

      this._logger.info(`Publishing metrics for contact: ${contactId}`, metricsToPublish);

      metricsToPublish.forEach((metric) => {
        publishMetric(metric.MetricName, metric.MetricValue, metric.MetricType, {
          ContactId: contactId,
          ...metric.Dimensions,
        });
      });

      // Clean model metrics
      this._modelLoadingMetrics = {};
    }

    getSDKVoiceClient() {
      if (!this._voiceClient) {
        this._voiceClient = new VoiceClient(connect.core.getSDKClientConfig());
      }
      return this._voiceClient;
    }

    async _initialize({ mode }) {
      try {
        const paths = await this.getSDKVoiceClient().getVoiceEnhancementPaths();
        this._logger.info('Fetched VoiceFocus assets from:', paths);

        // Enforcing the required samplerate does not work in Firefox sometimes
        // If the browser is Firefox, use the default sample rate
        this._audioContext = createAudioContext(
          connect.isFirefoxBrowser() ? {} : { sampleRate: AUDIO_CONTEXT_SAMPLE_RATE }
        );

        const spec = {
          mode,
          variant: 'c50',
          usagePreference: 'interactivity',
          simd: 'force',
          executionPreference: 'inline', // for interactive use case, inline is recommended from chime-sdk
          paths,
          executionQuantaPreference: 3, // by default, voice focus is finished in 3 runs
        };

        // In Firefox browser and sample rate < 38.4 kHz, the resampler and default voiceFocus
        // will have conflict due to buffer reading/writing frequency if 3-stage is used
        if (connect.isFirefoxBrowser() && this._audioContext.sampleRate < QUANTA_SAMPLE_RATE_LIMIT_MAX) {
          if (
            this._audioContext.sampleRate > QUANTA_SAMPLE_RATE_LIMIT_MIN &&
            this._audioContext.sampleRate <= COMPUTE_CAPACITY_LIMIT
          ) {
            // Force one-stage processing so voiceFocus function is fast enough
            // to prevent audio data loss due to buffer overflow
            spec.executionQuantaPreference = 1;
          } else {
            // Do not use voiceFocus, original audio stream will be used
            throw new Error('This sample rate is not supported in VoiceFocus');
          }
        }

        const config = await VoiceFocus.configure(spec, { logger: this._logger });

        if (!config.supported) {
          throw new Error('VoiceFocus not supported on this platform');
        }
        this._logger.info('VoiceFocus is configured for given spec', spec);

        this._voiceFocusInstance = await VoiceFocus.init(config, {
          preload: true,
          logger: this._logger,
        });
        this._danglingInstances.push(this._voiceFocusInstance);

        this._logger.info('Successfully initialized VoiceFocus instance', config);
      } catch (error) {
        this._logger.error(`Failed to initialize VoiceFocus: ${error}`);
        this._voiceFocusInstance = null;
        throw error;
      }
    }

    async applyToStream(stream) {
      if (!this.isInitialized()) {
        throw new Error('VoiceFocus not initialized');
      }

      // Disconnect existing source
      this._streamSource?.disconnect();

      if (
        this._streamFlowInitialized &&
        this._voiceFocusInstance?.internal?.voiceFocusNode &&
        this._voiceFocusInstance?.internal?.audioContext?.state === 'running'
      ) {
        const { audioContext, voiceFocusNode } = this._voiceFocusInstance.internal;
        this._streamSource = audioContext.createMediaStreamSource(stream);
        const destination = audioContext.createMediaStreamDestination();
        this._streamSource.connect(voiceFocusNode);
        voiceFocusNode.connect(destination);
        return {
          stream: destination.stream,
        };
      }
      this._streamFlowInitialized = true;

      const result = await this._voiceFocusInstance.applyToStream(stream, this._audioContext);
      this._streamSource = result.source;
      return result;
    }

    async initializeAndApplyToStream(stream, mode) {
      await this.initialize({ mode });

      if (!this.isInitialized()) {
        throw new Error(`${logPrefix} Failed to initialize voice focus instance.`);
      }

      return this.applyToStream(stream);
    }

    reset() {
      try {
        this._modelLoadingMetrics = {};
        this._streamSource?.disconnect();
        this._voiceFocusInstance?.internal?.voiceFocusNode?.port?.postMessage({ message: 'reset' });
        this.addModelLoadingMetric(VOICE_FOCUS_CLEARED_METRIC, 1, 'count');
      } catch (error) {
        this._logger.error(`Error in destroying VoiceFocus instance: ${error}`);
        this.addModelLoadingMetric(VOICE_FOCUS_CLEARED_METRIC, 0, 'count');
        return this.destroy();
      }
    }

    async destroy() {
      try {
        // call VF destroy to terminate the resources created in it.
        this._danglingInstances?.forEach((instance) => instance?.destroy());
        this._voiceFocusInstance = null;
        this._audioContext = null;

        this._streamFlowInitialized = false;

        this._logger.info('Successfully destroyed VoiceFocus instance and cleared the WebAudio graph.');
      } catch (error) {
        this._logger.error(`Error in destroying VoiceFocus instance: ${error}`);
      } finally {
        this._voiceFocusInstance = null;
        this._audioContext = null;
        this._danglingInstances = [];
        this._modelLoadingMetrics = {};
      }
    }
  }

  const _voiceFocusLogger = new VoiceFocusLogger();

  // Create the singleton instance
  connect.core.voiceFocus = new VoiceFocusInstanceManager(_voiceFocusLogger);

  class VoiceFocusProvider {
    static modelMode = undefined;

    /**
     * Gets the voice enhanced user media stream.
     *
     * @param {MediaStream} sourceMediaStream - Source media stream to enhance with voice enhancement feature.
     * @param {Object} options - Options for voice enhancement.
     * @param {Function} options.onError - Callback function to handle errors.
     * @returns {Promise<MediaStream>} - A Promise that resolves with the enhanced MediaStream object if successful, or rejects with an error if there's a problem.
     */
    static async getVoiceEnhancedUserMedia(sourceMediaStream, { onError } = { onError: () => {} }) {
      const mode = new connect.Agent().getVoiceEnhancementMode();
      VoiceFocusProvider.modelMode = voiceEnhancementModeToModelMode[mode ?? ''];
      const { voiceFocus: voiceFocusManager } = connect.core;

      const { modelMode } = VoiceFocusProvider;

      if (!modelMode) {
        _voiceFocusLogger.log('Voice focus disabled, returning default mediaStream.');
        voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_MODE_METRIC, 1, 'count', { ModelMode: 'none' });
        return sourceMediaStream;
      }

      try {
        _voiceFocusLogger.log(`Voice focus enabled with mode: ${modelMode}`);
        voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_MODE_METRIC, 1, 'count', { ModelMode: modelMode });
        // Get audio device label and browser info for metrics
        voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_DEVICE_LABEL_METRIC, 1, 'count', {
          DeviceLabel: await getAudioDeviceLabel(sourceMediaStream),
        });

        // Get browser name for metrics
        voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_BROWSER_METRIC, 1, 'count', {
          BrowserName: getBrowserName(),
        });

        _voiceFocusLogger.log(`Initializing voice focus to enhance source stream: ${sourceMediaStream.id}`);

        // Capture the start time
        const startTime = performance.now();

        // Create a Promise that resolves after 5 seconds
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TimeoutError')), 5000);
        });

        // Use Promise.race() to return the first Promise that resolves/rejects to ensure we fallback to default media stream
        return Promise.race([voiceFocusManager.initializeAndApplyToStream(sourceMediaStream, modelMode), timeout])
          .then((result) => {
            // Capture the end time
            const endTime = performance.now();

            // Calculate the elapsed time
            const elapsedTime = (endTime - startTime).toFixed(2);

            // Note: since there is only one audio node, the mode must be explicitly set at every invocation to capture any change since the initialization
            connect.core.voiceFocus.setMode(modelMode);

            _voiceFocusLogger.log(`Voice focus returned enhanced media stream in ${elapsedTime} ms`);

            voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ERROR_METRIC, 0, 'count');
            voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ELAPSED_TIME_METRIC, elapsedTime, 'latency');

            return result?.stream;
          })
          .catch((error) => {
            // Capture the end time
            const endTime = performance.now();

            // Calculate the elapsed time
            const elapsedTime = (endTime - startTime).toFixed(2);

            if (error.message === 'TimeoutError') {
              // If the timeout Promise resolves first, return the default media stream
              _voiceFocusLogger.warn(`Timeout exceeded (${elapsedTime} ms), returning back source media stream`);

              const timeoutDimensions = { [METRIC_ERROR_TYPE]: 'Timeout' };
              voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ERROR_METRIC, 1, 'count', timeoutDimensions);
              voiceFocusManager.addModelLoadingMetric(
                VOICE_FOCUS_ELAPSED_TIME_METRIC,
                elapsedTime,
                'latency',
                timeoutDimensions
              );
            } else {
              _voiceFocusLogger.warn(
                `Error occurred in Voice focus (${elapsedTime} ms), returning source media stream: ${error}`
              );

              voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ERROR_METRIC, 1, 'count');
              voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ELAPSED_TIME_METRIC, elapsedTime, 'latency', {
                [METRIC_ERROR_TYPE]: 'Generic',
              });
            }

            onError?.();
            return sourceMediaStream;
          });
      } catch (error) {
        _voiceFocusLogger.warn(`Error occurred in Voice focus, returning source media stream: ${error}`);

        voiceFocusManager.addModelLoadingMetric(VOICE_FOCUS_ERROR_METRIC, 1, 'count');
        onError?.();
        return sourceMediaStream;
      }
    }

    static publishMetrics({ contactId }) {
      connect.core.voiceFocus?.publishMetrics({ contactId, mode: VoiceFocusProvider.modelMode });
    }

    static async cleanVoiceFocus() {
      await connect.core.voiceFocus?.reset();
    }
  }
  module.exports = VoiceFocusProvider;

  connect.VoiceFocusProvider = VoiceFocusProvider;
})();
