// Jest tests for the simple connect.core getter / utility functions that
// were not exercised by the original Mocha spec. These are small but raise
// branch + function coverage materially.

const { commonAfterEach, setLocation } = require('./core-test-helpers');

describe('connect.core simple getters - throw when uninitialized', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.client = null;
    connect.core.apiProxyClient = null;
    connect.core.masterClient = null;
    connect.core.upstream = null;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('getClient throws StateError when client is null', () => {
    expect(() => connect.core.getClient()).toThrow('The connect core has not been initialized!');
  });

  it('getClient returns the client when set', () => {
    const fake = { call: jest.fn() };
    connect.core.client = fake;
    expect(connect.core.getClient()).toBe(fake);
  });

  it('getApiProxyClient throws when apiProxyClient is null', () => {
    expect(() => connect.core.getApiProxyClient()).toThrow(
      'The connect apiProxy Client has not been initialized!'
    );
  });

  it('getMasterClient throws when masterClient is null', () => {
    expect(() => connect.core.getMasterClient()).toThrow(
      'The connect master client has not been initialized!'
    );
  });

  it('getUpstream throws when upstream is null', () => {
    expect(() => connect.core.getUpstream()).toThrow('There is no upstream conduit!');
  });

  it('getSoftphoneManager returns null when not initialized (does not throw)', () => {
    connect.core.softphoneManager = null;
    expect(connect.core.getSoftphoneManager()).toBeNull();
  });

  it('getNotificationManager lazily creates a NotificationManager on first call', () => {
    connect.core.notificationManager = null;
    const nm = connect.core.getNotificationManager();
    expect(nm).toBeInstanceOf(connect.NotificationManager);
    // Returns the same instance on subsequent calls.
    expect(connect.core.getNotificationManager()).toBe(nm);
  });

  it('getPopupManager returns whatever is currently assigned (no validation)', () => {
    // The module-level popupManager singleton is `new connect.PopupManager()`,
    // but cross-file reset() helpers null it out, so install a fresh one.
    connect.core.popupManager = new connect.PopupManager();
    expect(connect.core.getPopupManager()).toBeInstanceOf(connect.PopupManager);
  });

  it('getEventBus returns whatever is currently assigned (no validation)', () => {
    const bus = new connect.EventBus({ logEvents: true });
    connect.core.eventBus = bus;
    expect(connect.core.getEventBus()).toBe(bus);
  });

  it('getWebSocketManager returns the current webSocketProvider', () => {
    const fakeWs = { send: jest.fn() };
    connect.core.webSocketProvider = fakeWs;
    expect(connect.core.getWebSocketManager()).toBe(fakeWs);
    connect.core.webSocketProvider = null;
  });

  it('getAgentDataProvider returns the current agentDataProvider', () => {
    const fakeAdp = { getAgentData: jest.fn() };
    connect.core.agentDataProvider = fakeAdp;
    expect(connect.core.getAgentDataProvider()).toBe(fakeAdp);
    connect.core.agentDataProvider = null;
  });
});

describe('connect.core.getContactEventName', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('returns the namespaced event name when given a known ContactEvent', () => {
    const result = connect.core.getContactEventName(connect.ContactEvents.INIT, 'contact-1');
    expect(result).toBe(`${connect.ContactEvents.INIT}::contact-1`);
  });

  it('throws ValueError when given an unknown event name', () => {
    expect(() => connect.core.getContactEventName('not-a-real-event', 'contact-1')).toThrow();
  });

  it('throws when eventName is null', () => {
    expect(() => connect.core.getContactEventName(null, 'contact-1')).toThrow();
  });

  it('throws when contactId is null', () => {
    expect(() => connect.core.getContactEventName(connect.ContactEvents.INIT, null)).toThrow();
  });
});

describe('connect.core.sendConfigure', () => {
  let conduit;
  let sendUpstreamSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    sendUpstreamSpy = jest.fn();
    conduit = { sendUpstream: sendUpstreamSpy };
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('does NOT send when params have no configurable fields', () => {
    connect.core.sendConfigure({}, conduit, false);
    expect(sendUpstreamSpy).not.toHaveBeenCalled();
  });

  it('sends CONFIGURE upstream with softphone present and disasterRecoveryOn included in legacy mode', () => {
    const params = {
      softphone: { ringtoneUrl: 'r.mp3' },
      disasterRecoveryOn: false,
    };
    connect.core.sendConfigure(params, conduit, false);
    expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
    const [event, payload] = sendUpstreamSpy.mock.calls[0];
    expect(event).toBe(connect.EventType.CONFIGURE);
    expect(payload.softphone).toEqual(params.softphone);
    expect(payload.disasterRecoveryOn).toBe(false);
    expect(payload.enableGlobalResiliency).toBeUndefined();
  });

  it('omits integrationProductType when not provided', () => {
    connect.core.sendConfigure({ softphone: {} }, conduit, false);
    expect(sendUpstreamSpy.mock.calls[0][1].integrationProductType).toBeUndefined();
  });

  it('in ACGR mode adds enableGlobalResiliency + instanceState and omits disasterRecoveryOn', () => {
    const params = {
      softphone: { ringtoneUrl: 'r.mp3' },
      enableGlobalResiliency: true,
      disasterRecoveryOn: true,
    };
    jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
    connect.core.sendConfigure(params, conduit, true);
    const payload = sendUpstreamSpy.mock.calls[0][1];
    expect(payload.enableGlobalResiliency).toBe(true);
    expect(payload.instanceState).toBe('active');
    expect(payload.disasterRecoveryOn).toBeUndefined();
  });

  it('in ACGR mode marks the instance inactive when isActiveConduit returns false', () => {
    jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
    connect.core.sendConfigure(
      { softphone: {}, enableGlobalResiliency: true },
      conduit,
      true
    );
    expect(sendUpstreamSpy.mock.calls[0][1].instanceState).toBe('inactive');
  });

  it('falls back to params.pageOptions.showInactivityModal when params.showInactivityModal is undefined', () => {
    connect.core.sendConfigure({ pageOptions: { showInactivityModal: 'inner' } }, conduit, false);
    expect(sendUpstreamSpy.mock.calls[0][1].showInactivityModal).toBe('inner');
  });
});

describe('connect.core.checkIfConfigureReceived', () => {
  let conduit;

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    conduit = { sendDownstream: jest.fn() };
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('sends REQUEST_CONFIGURE downstream after 1 second when framed and no CRM CONFIGURE has arrived', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    connect.core.hasReceivedCRMConfigure = false;
    connect.core.checkIfConfigureReceived(conduit);

    jest.advanceTimersByTime(1000);
    expect(conduit.sendDownstream).toHaveBeenCalledWith(connect.EventType.REQUEST_CONFIGURE);
  });

  it('does NOT send REQUEST_CONFIGURE when hasReceivedCRMConfigure is true', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    connect.core.hasReceivedCRMConfigure = true;
    connect.core.checkIfConfigureReceived(conduit);

    jest.advanceTimersByTime(1000);
    expect(conduit.sendDownstream).not.toHaveBeenCalled();
  });

  it('does nothing when not framed', () => {
    jest.spyOn(connect, 'isFramed').mockReturnValue(false);
    connect.core.hasReceivedCRMConfigure = false;
    connect.core.checkIfConfigureReceived(conduit);

    jest.advanceTimersByTime(5000);
    expect(conduit.sendDownstream).not.toHaveBeenCalled();
  });
});
