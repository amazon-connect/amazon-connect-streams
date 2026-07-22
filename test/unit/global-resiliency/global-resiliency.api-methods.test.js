describe('Global Resiliency', () => {
  describe('connect.globalResiliency._validateGlobalSignin()', () => {
    let conduit;
    let eventBus;
    let validateParams;
    let data;

    beforeEach(() => {
      jest.useFakeTimers();
      conduit = {
        name: 'test-conduit',
        sendUpstream: jest.fn(),
        onUpstream: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      };
      validateParams = {};
      data = {};
      eventBus = new connect.EventBus({ logEvents: true });
      connect.core.eventBus = eventBus;
      jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      jest.spyOn(connect, 'getLog').mockReturnValue({
        info: jest.fn().mockReturnValue({
          sendInternalLogToServer: jest.fn(),
          withObject: jest.fn().mockReturnValue({ sendInternalLogToServer: jest.fn() }),
        }),
        warn: jest.fn().mockReturnValue({
          sendInternalLogToServer: jest.fn(),
          withObject: jest.fn().mockReturnValue({ sendInternalLogToServer: jest.fn() }),
        }),
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      connect.core.eventBus = null;
    });

    it('should call onSuccess when GLOBAL_SIGNIN_VALID event received', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const validHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID
      );
      expect(validHandler).toBeDefined();
      validHandler[1]();

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('should call onFailure when GLOBAL_SIGNIN_INVALID event received', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );
      expect(invalidHandler).toBeDefined();
      invalidHandler[1]();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it('should call onSuccess on timeout after 250ms', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('should send VALIDATE_GLOBAL_SIGNIN upstream', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      expect(conduit.sendUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.VALIDATE_GLOBAL_SIGNIN);
    });

    it('should unsubscribe to GLOBAL_SIGNIN event listeners after failure', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );
      invalidHandler[1]();

      invalidHandler[1]();

      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it('should ignore late responses after timeout', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      jest.advanceTimersByTime(250);
      expect(onSuccess).toHaveBeenCalledTimes(1);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );
      invalidHandler[1]();

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('should publish GlobalResiliencyRegionalLoginAttempt metric on failure with LILY_AGENT_CONFIG_MISSING', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );
      invalidHandler[1]({ errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_MISSING });

      expect(connect.publishMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'GlobalResiliencyRegionalLoginAttempt',
          data: { count: 1 },
        })
      );
    });

    it('should publish GlobalResiliencyRegionalLoginAttempt metric for parse errors', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );

      invalidHandler[1]({
        error: '[GR] Error validating global signin authentication',
        errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_PARSE_ERROR,
      });

      expect(connect.publishMetric).toHaveBeenCalled();

      const metricCall = connect.publishMetric.mock.calls.find(
        (call) => call[0] && call[0].name === 'GlobalResiliencyRegionalLoginAttempt'
      );

      expect(metricCall).toBeDefined();
      expect(metricCall[0].data).toEqual({ count: 1 });

      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle duplicate VALID responses gracefully', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const validHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID
      );

      validHandler[1]();
      validHandler[1]();
      validHandler[1]();

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle INVALID followed by VALID correctly', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      connect.globalResiliency._validateGlobalSignin(conduit, validateParams, data, onSuccess, onFailure);

      const invalidHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
      );
      const validHandler = conduit.onUpstream.mock.calls.find(
        (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID
      );

      invalidHandler[1]();
      expect(onFailure).toHaveBeenCalledTimes(1);

      validHandler[1]();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledTimes(1);
    });
  });


  describe('connect.globalResiliency._downloadCCPLogs()', () => {
    it('triggers the DOWNLOAD_LOG_FROM_CCP event on the event bus', () => {
      const trigger = jest.fn();
      jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ trigger });

      connect.globalResiliency._downloadCCPLogs();

      expect(trigger).toHaveBeenCalledWith(connect.EventType.DOWNLOAD_LOG_FROM_CCP);
    });
  });

  describe('connect.globalResiliency._completeAcknowledgeInitialization()', () => {
    let conduit;
    let conduitTimerContainerMap;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(connect.core, 'sendConfigure').mockImplementation(() => {});
      jest.spyOn(connect.core, 'listenForConfigureRequest').mockImplementation(() => {});
      jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      conduit = {
        name: 'test-conduit',
        sendUpstream: jest.fn(),
        keepaliveManager: { start: jest.fn() },
      };
      conduitTimerContainerMap = { 'test-conduit': { ccpLoadTimeoutInstance: 123, iframeRefreshAttempt: 2 } };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls sendConfigure and listenForConfigureRequest with the ACGR flag', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
      const params = { softphone: {} };

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, params, { id: 's' }, conduitTimerContainerMap, Date.now());

      expect(connect.core.sendConfigure).toHaveBeenCalledWith(params, conduit, true);
      expect(connect.core.listenForConfigureRequest).toHaveBeenCalledWith(params, conduit, true);
    });

    it('sends OUTER_CONTEXT_INFO upstream and starts the keepalive manager', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
      const params = { ccpUrl: 'https://x.awsapps.com' };

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, params, { id: 's' }, conduitTimerContainerMap, Date.now());

      expect(conduit.sendUpstream).toHaveBeenCalledWith(connect.EventType.OUTER_CONTEXT_INFO, {
        streamsVersion: connect.version,
        initCCPParams: params,
      });
      expect(conduit.keepaliveManager.start).toHaveBeenCalledTimes(1);
    });

    it('clears the CCP load timeout timer and nulls it out', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
      const clearSpy = jest.spyOn(global, 'clearTimeout');

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, {}, { id: 's' }, conduitTimerContainerMap, Date.now());

      expect(clearSpy).toHaveBeenCalledWith(123);
      expect(conduitTimerContainerMap['test-conduit'].ccpLoadTimeoutInstance).toBeNull();
    });

    it('stores the portStreamId from the data', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, {}, { id: 'stream-42' }, conduitTimerContainerMap, Date.now());

      expect(conduit.portStreamId).toBe('stream-42');
    });

    it('publishes iframe metrics for the active conduit when initStartTime is provided', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
      jest.spyOn(connect, 'UpstreamConduitClient').mockImplementation(() => ({}));
      jest.spyOn(connect, 'UpstreamConduitMasterClient').mockImplementation(() => ({}));

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, {}, { id: 's' }, conduitTimerContainerMap, Date.now() - 1000);
      jest.advanceTimersByTime(1000);

      expect(connect.publishMetric).toHaveBeenCalledWith({ name: 'IframeRefreshAttempts', data: { count: 2 } });
      expect(connect.publishMetric).toHaveBeenCalledWith({ name: 'IframeInitializationSuccess', data: { count: 1 } });
    });

    it('does not publish iframe metrics when the conduit is not active', () => {
      jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);

      connect.globalResiliency._completeAcknowledgeInitialization(conduit, {}, { id: 's' }, conduitTimerContainerMap, Date.now() - 1000);
      jest.advanceTimersByTime(1000);

      expect(connect.publishMetric).not.toHaveBeenCalled();
    });
  });
});
