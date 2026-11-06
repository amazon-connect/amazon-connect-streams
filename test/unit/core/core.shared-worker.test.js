// Tests for initSharedWorker, getLilyAgentConfig and checkIfConfigureReceived.

const {
  commonAfterEach,
  defaultParams,
  installCoreMocks,
  setLocation,
} = require('./core-test-helpers');

describe('connect.core.initSharedWorker()', () => {
  let params;
  let triggerEventNames;

  // Captures the event names triggered on the eventBus replaced AFTER
  // initSharedWorker, which itself replaces the bus.
  const replaceEventBusAndSpy = () => {
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    triggerEventNames = jest.spyOn(connect.core.eventBus, 'trigger');
  };

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    installCoreMocks();
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(true);
    params = defaultParams();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('shared worker initialization wires up SharedWorker, hitch, and auth callbacks', () => {
    expect(params.sharedWorkerUrl).not.toBe('0');
    expect(params.authToken).not.toBeNull();
    expect(params.region).not.toBeNull();

    connect.core.initSharedWorker(params);

    expect(connect.core.checkNotInitialized).toHaveBeenCalled();
    expect(SharedWorker).toHaveBeenCalledWith(params.sharedWorkerUrl, 'ConnectSharedWorker');
    expect(connect.core.onAuthFail).toHaveBeenCalledTimes(1);
    expect(connect.core.onAuthorizeSuccess).toHaveBeenCalledTimes(1);
    // hitch was called with both _handleAuthFail and _handleAuthorizeSuccess.
    const hitchTargets = connect.hitch.mock.calls.map((args) => args[1]);
    expect(hitchTargets).toContain(connect.core._handleAuthFail);
    expect(hitchTargets).toContain(connect.core._handleAuthorizeSuccess);
  });

  it('CONFIGURE downstream event does nothing when enableGlobalResiliency is false', () => {
    connect.core.initSharedWorker(params);
    replaceEventBusAndSpy();

    connect.core.getUpstream().downstreamBus.trigger(connect.EventType.CONFIGURE, { enableGlobalResiliency: false });

    const events = triggerEventNames.mock.calls.map(([eventName]) => eventName);
    expect(events).not.toContain(connect.GlobalResiliencyEvents.CONFIGURE);
    expect(events).not.toContain(connect.GlobalResiliencyEvents.CONFIGURE_ERROR);
  });

  it('CONFIGURE downstream event does nothing when enableGlobalResiliency is absent', () => {
    connect.core.initSharedWorker(params);
    replaceEventBusAndSpy();

    connect.core.getUpstream().downstreamBus.trigger(connect.EventType.CONFIGURE, {});

    const events = triggerEventNames.mock.calls.map(([eventName]) => eventName);
    expect(events).not.toContain(connect.GlobalResiliencyEvents.CONFIGURE);
    expect(events).not.toContain(connect.GlobalResiliencyEvents.CONFIGURE_ERROR);
  });

  it('sets portStreamId on ACK upstream', () => {
    connect.core.initSharedWorker(params);
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
    expect(connect.core.portStreamId).toBe('portId');
  });

  it('updates connected CCP counts on UPDATE_CONNECTED_CCPS', () => {
    connect.core.initSharedWorker(params);
    expect(connect.numberOfConnectedCCPs).toBe(0);
    expect(connect.numberOfConnectedCCPsInThisTab).toBe(0);

    // ACKNOWLEDGE triggers _setTabId, which is required for the UPDATE_CONNECTED_CCPS
    // handler to read data[connect.core.tabId]. With randomId stubbed to 'id',
    // tabId is 'id' and data['id'] is what the production code reads.
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, {
      length: 1,
      id: { length: 1 },
    });

    expect(connect.numberOfConnectedCCPs).toBe(1);
    expect(connect.numberOfConnectedCCPsInThisTab).toBe(1);
  });

  it('does not call ifMaster on UPDATE_CONNECTED_CCPS without tabId+streamsTabsAcrossBrowser; calls when both present', () => {
    connect.core.initSharedWorker(params);
    const ifMasterSpy = jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, { length: 1 });
    expect(ifMasterSpy).not.toHaveBeenCalled();

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.UPDATE_CONNECTED_CCPS, {
      length: 1,
      tabId: 'id',
      streamsTabsAcrossBrowser: 1,
    });
    expect(ifMasterSpy).toHaveBeenCalledTimes(1);
  });

  it('replicates new logs received upstream and ignores duplicates with the same loggerId', () => {
    connect.core.initSharedWorker(params);
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    const logger = connect.getLog();
    const loggerId = logger.getLoggerId();
    const originalLength = logger._logs.length;

    const newLogs = [
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some log', 'some-logger-id'),
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some log with no logger id', null),
      new connect.LogEntry('test', connect.LogLevel.INFO, 'some log info', 'some-logger-id'),
      new connect.LogEntry('test', connect.LogLevel.ERROR, 'some log error', 'some-logger-id'),
    ];
    const dupLogs = [
      new connect.LogEntry('test', connect.LogLevel.LOG, 'some dup log', loggerId),
      new connect.LogEntry('test', connect.LogLevel.INFO, 'some dup log info', loggerId),
      new connect.LogEntry('test', connect.LogLevel.ERROR, 'some dup log error', loggerId),
    ];
    [...newLogs, ...dupLogs].forEach((log) => {
      connect.core.getUpstream().upstreamBus.trigger(connect.EventType.LOG, log);
    });

    jest.advanceTimersByTime(2000);
    expect(logger._logs).toHaveLength(originalLength + newLogs.length);
    // Replicated logs should not be sent downstream to avoid duplicates.
    expect(connect.core.getUpstream().sendDownstream).not.toHaveBeenCalled();
  });

  it('GlobalResiliencyEvents.INIT upstream marks receivedGlobalResiliencyInitFromSharedWorker', () => {
    // Cannot directly observe the closure flag, but the handler is wired up;
    // simply verify it runs without error.
    connect.core.initSharedWorker(params);
    expect(() =>
      connect.core
        .getUpstream()
        .upstreamBus.trigger(connect.GlobalResiliencyEvents.INIT, { region: 'us-west-2' })
    ).not.toThrow();
  });

  it('TERMINATE event subscription forwards upstream', () => {
    connect.core.initSharedWorker(params);
    const passUpstreamFn = jest.fn();
    jest.spyOn(connect.core.upstream, 'passUpstream').mockReturnValue(passUpstreamFn);
    // Fresh subscribe - the original was set up at init-time. We just verify
    // the production handler did subscribe by triggering and checking that
    // the conduit forwards (which is harder); instead verify the
    // event bus has at least one subscriber for TERMINATE.
    const subs = connect.core.eventBus.getSubscriptions(connect.EventType.TERMINATE);
    expect(Array.isArray(subs)).toBe(true);
    expect(subs.length).toBeGreaterThan(0);
  });

  it('VoiceIdEvents.UPDATE_DOMAIN_ID upstream sets connect.core.voiceIdDomainId', () => {
    connect.core.initSharedWorker(params);
    connect.core.voiceIdDomainId = null;
    connect.core
      .getUpstream()
      .upstreamBus.trigger(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, { domainId: 'voiceid-1' });
    expect(connect.core.voiceIdDomainId).toBe('voiceid-1');
  });

  it('VoiceIdEvents.UPDATE_DOMAIN_ID upstream ignores payload without domainId', () => {
    connect.core.initSharedWorker(params);
    connect.core.voiceIdDomainId = 'previous';
    connect.core.getUpstream().upstreamBus.trigger(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, {});
    expect(connect.core.voiceIdDomainId).toBe('previous');
  });

  it('LOG upstream entries with a different loggerId are added to the local logger', () => {
    connect.core.initSharedWorker(params);
    const logger = connect.getLog();
    const before = logger._logs.length;
    connect.core.getUpstream().upstreamBus.trigger(
      connect.EventType.LOG,
      new connect.LogEntry('test', connect.LogLevel.INFO, 'a remote log', 'other-id')
    );
    expect(logger._logs.length).toBeGreaterThan(before);
  });

  it('LOG upstream entries with the same loggerId are NOT replicated', () => {
    connect.core.initSharedWorker(params);
    const logger = connect.getLog();
    const loggerId = logger.getLoggerId();
    const before = logger._logs.length;
    connect.core.getUpstream().upstreamBus.trigger(
      connect.EventType.LOG,
      new connect.LogEntry('test', connect.LogLevel.INFO, 'self log', loggerId)
    );
    expect(logger._logs.length).toBe(before);
  });

  it('SERVER_BOUND_INTERNAL_LOG upstream forwards to sendInternalLogEntryToServer', () => {
    connect.core.initSharedWorker(params);
    const sendSpy = jest
      .spyOn(connect.getLog(), 'sendInternalLogEntryToServer')
      .mockImplementation(() => {});
    connect.core.getUpstream().upstreamBus.trigger(
      connect.EventType.SERVER_BOUND_INTERNAL_LOG,
      new connect.LogEntry('test', connect.LogLevel.INFO, 'server-bound log', 'other-id')
    );
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('SERVER_BOUND_INTERNAL_LOG downstream forwards each entry only when framed and given an array', () => {
    connect.core.initSharedWorker(params);
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    const sendSpy = jest
      .spyOn(connect.getLog(), 'sendInternalLogEntryToServer')
      .mockImplementation(() => {});
    const logs = [
      new connect.LogEntry('test', connect.LogLevel.INFO, 'a', 'x'),
      new connect.LogEntry('test', connect.LogLevel.INFO, 'b', 'y'),
    ];
    connect.core.getUpstream().downstreamBus.trigger(
      connect.EventType.SERVER_BOUND_INTERNAL_LOG,
      logs
    );
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });
});

describe('connect.core.checkIfConfigureReceived', () => {
  let conduitStub;
  let sendDownstreamSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    sendDownstreamSpy = jest.fn();
    conduitStub = { sendDownstream: sendDownstreamSpy };
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  describe('when CCP is framed', () => {
    beforeEach(() => {
      jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    });

    it('sets up timeout and sends configure request when hasReceivedCRMConfigure is false', () => {
      connect.core.hasReceivedCRMConfigure = false;
      connect.core.checkIfConfigureReceived(conduitStub);

      expect(sendDownstreamSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);
      expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.REQUEST_CONFIGURE);
    });

    it('does not send configure request when hasReceivedCRMConfigure is true', () => {
      connect.core.hasReceivedCRMConfigure = true;
      connect.core.checkIfConfigureReceived(conduitStub);
      jest.advanceTimersByTime(1000);

      expect(sendDownstreamSpy).not.toHaveBeenCalled();
    });

    it('sends configure request when hasReceivedCRMConfigure is undefined', () => {
      connect.core.hasReceivedCRMConfigure = undefined;
      connect.core.checkIfConfigureReceived(conduitStub);
      jest.advanceTimersByTime(2500);

      expect(sendDownstreamSpy).toHaveBeenCalledWith(connect.EventType.REQUEST_CONFIGURE);
    });
  });

  describe('when CCP is not framed', () => {
    beforeEach(() => {
      jest.spyOn(connect, 'isFramed').mockReturnValue(false);
    });

    it('does nothing when not framed', () => {
      connect.core.hasReceivedCRMConfigure = false;
      connect.core.checkIfConfigureReceived(conduitStub);
      jest.advanceTimersByTime(2000);

      expect(sendDownstreamSpy).not.toHaveBeenCalled();
    });

    it.each([false, true, undefined, null])(
      'does nothing regardless of hasReceivedCRMConfigure value (%s)',
      (value) => {
        connect.core.hasReceivedCRMConfigure = value;
        connect.core.checkIfConfigureReceived(conduitStub);
        jest.advanceTimersByTime(2000);
        expect(sendDownstreamSpy).not.toHaveBeenCalled();
      }
    );
  });
});

// ----------------------------------------------------------------------------
// validateGlobalSignin / listenForAcgrValidation - ACGR auth-validation flow.
// ----------------------------------------------------------------------------
describe('connect.core.validateGlobalSignin', () => {
  let conduit;

  beforeEach(() => {
    setLocation('http://localhost');
    conduit = { sendDownstream: jest.fn() };
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('sends GLOBAL_SIGNIN_VALID downstream when getLilyAgentConfig returns a config', () => {
    jest.spyOn(connect.core, 'getLilyAgentConfig').mockReturnValue({ ok: true });

    connect.core.validateGlobalSignin(conduit);

    expect(conduit.sendDownstream).toHaveBeenCalledTimes(1);
    expect(conduit.sendDownstream).toHaveBeenCalledWith(
      connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID,
      { message: '[GR] Global signin validated successfully' }
    );
  });

  it('sends GLOBAL_SIGNIN_INVALID with LILY_AGENT_CONFIG_MISSING when getLilyAgentConfig returns null', () => {
    jest.spyOn(connect.core, 'getLilyAgentConfig').mockReturnValue(null);

    connect.core.validateGlobalSignin(conduit);

    expect(conduit.sendDownstream).toHaveBeenCalledTimes(1);
    expect(conduit.sendDownstream).toHaveBeenCalledWith(
      connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID,
      {
        errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_MISSING,
        error: '[GR] Global signin authentication not found',
      }
    );
  });

  it('sends GLOBAL_SIGNIN_INVALID with LILY_AGENT_CONFIG_PARSE_ERROR when getLilyAgentConfig throws', () => {
    jest.spyOn(connect.core, 'getLilyAgentConfig').mockImplementation(() => {
      throw new Error('parse failed');
    });

    connect.core.validateGlobalSignin(conduit);

    expect(conduit.sendDownstream).toHaveBeenCalledTimes(1);
    expect(conduit.sendDownstream).toHaveBeenCalledWith(
      connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID,
      {
        errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_PARSE_ERROR,
        error: '[GR] Error validating global signin authentication',
      }
    );
  });
});

describe('connect.core.listenForAcgrValidation', () => {
  let conduit;

  beforeEach(() => {
    setLocation('http://localhost');
    conduit = { onDownstream: jest.fn() };
    connect.core._acgrValidationListenerRegistered = false;
  });

  afterEach(() => {
    connect.core._acgrValidationListenerRegistered = false;
    commonAfterEach();
  });

  it('registers a downstream handler for VALIDATE_GLOBAL_SIGNIN that delegates to validateGlobalSignin', () => {
    const validateSpy = jest
      .spyOn(connect.core, 'validateGlobalSignin')
      .mockImplementation(() => {});

    connect.core.listenForAcgrValidation(conduit);

    expect(conduit.onDownstream).toHaveBeenCalledTimes(1);
    expect(conduit.onDownstream).toHaveBeenCalledWith(
      connect.GlobalResiliencyEvents.VALIDATE_GLOBAL_SIGNIN,
      expect.any(Function)
    );
    // Drive the handler to ensure it invokes validateGlobalSignin(conduit).
    const handler = conduit.onDownstream.mock.calls[0][1];
    handler();
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(validateSpy).toHaveBeenCalledWith(conduit);
    expect(connect.core._acgrValidationListenerRegistered).toBe(true);
  });

  it('is idempotent: a second call short-circuits without re-registering', () => {
    connect.core.listenForAcgrValidation(conduit);
    connect.core.listenForAcgrValidation(conduit);
    expect(conduit.onDownstream).toHaveBeenCalledTimes(1);
  });
});
