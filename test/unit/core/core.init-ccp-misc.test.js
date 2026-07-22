// Jest port of: initCCP-after-ACK with DR enabled, ACK_TIMEOUT subscription
// behavior with disableAuthPopupAfterLogout, and reauthenticateAfterLogout.

const {
  commonAfterEach,
  makeContainerDiv,
  setLocation,
} = require('./core-test-helpers');

const setupCommon = () => {
  setLocation('http://localhost');
  jest.useFakeTimers();
  jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
  jest.spyOn(connect, 'UpstreamConduitClient').mockImplementation(function () {});
  jest.spyOn(connect, 'UpstreamConduitMasterClient').mockImplementation(function () {});
  jest.spyOn(connect, 'isFramed').mockReturnValue(true);
  jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});
  jest.spyOn(connect, 'VoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AdditionalVoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'QueueCallbackRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'ChatRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'TaskRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'EmailRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AutoAcceptedRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(document, 'createElement');
  jest.spyOn(connect.core, '_refreshIframeOnTimeout').mockImplementation(() => {});
  jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({
    clear: jest.fn(),
    open: jest.fn().mockReturnValue({ close: jest.fn() }),
  });
  jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({ getAgentData: () => ({}) });
  connect.numberOfConnectedCCPs = 0;
  connect.agent.initialized = true;
  connect.core.eventBus = new connect.EventBus({ logEvents: true });
};

describe('connect.core.initCCP() after ACKNOWLEDGE - with DR enabled', () => {
  let containerDiv;
  let drParams;

  beforeEach(() => {
    setupCommon();
    containerDiv = makeContainerDiv();
    drParams = {
      ccpUrl: 'url.com',
      loginUrl: 'loginUrl.com',
      softphone: { ringtoneUrl: 'customVoiceRingtone.amazon.com' },
      chat: { ringtoneUrl: 'customChatRingtone.amazon.com' },
      task: { ringtoneUrl: 'customTaskRingtone.amazon.com' },
      loginOptions: { autoClose: true },
      pageOptions: { showInactivityModal: true },
      shouldAddNamespaceToLogs: false,
      disasterRecoveryOn: true,
    };
    connect.core.initCCP(containerDiv, drParams);
    jest.spyOn(connect.WindowIOStream.prototype, 'send').mockReturnValue(null);
    jest.spyOn(connect.core.getUpstream(), 'sendUpstream');
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('sends INIT_DISASTER_RECOVERY upstream after ACK when disasterRecoveryOn=true', () => {
    expect(connect.core.getUpstream().sendUpstream).toHaveBeenCalledWith(
      connect.DisasterRecoveryEvents.INIT_DISASTER_RECOVERY,
      drParams
    );
  });

  it('forceOffline() (no args) sends SET_OFFLINE upstream', () => {
    connect.core.forceOffline();
    const calls = connect.core.getUpstream().sendUpstream.mock.calls;
    const setOfflineCall = calls.find(
      ([event]) => event === connect.DisasterRecoveryEvents.SET_OFFLINE
    );
    expect(setOfflineCall).toBeDefined();
  });

  it('forceOffline(data) forwards the data argument with SET_OFFLINE upstream', () => {
    const data = { softFailover: true };
    connect.core.forceOffline(data);
    expect(connect.core.getUpstream().sendUpstream).toHaveBeenCalledWith(
      connect.DisasterRecoveryEvents.SET_OFFLINE,
      data
    );
  });
});

describe('ACK_TIMEOUT subscription with disableAuthPopupAfterLogout (initCCP)', () => {
  let containerDiv;
  let unsubscribeAckTimeout;

  const baseParams = {
    ccpUrl: 'url.com',
    loginUrl: 'loginUrl.com',
    loginOptions: { autoClose: true },
  };

  beforeEach(() => {
    setupCommon();
    containerDiv = makeContainerDiv();
    unsubscribeAckTimeout = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('does NOT unsubscribe from ACK_TIMEOUT on first ACK when disableAuthPopupAfterLogout is false', () => {
    connect.core.initCCP(containerDiv, baseParams);
    connect.core.loginAckTimeoutSub = { unsubscribe: unsubscribeAckTimeout };

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });

    expect(unsubscribeAckTimeout).not.toHaveBeenCalled();
  });

  it('unsubscribes from ACK_TIMEOUT on first ACK when disableAuthPopupAfterLogout is true', () => {
    const params = {
      ...baseParams,
      loginOptions: { ...baseParams.loginOptions, disableAuthPopupAfterLogout: true },
    };
    connect.core.initCCP(containerDiv, params);
    connect.core.loginAckTimeoutSub = { unsubscribe: unsubscribeAckTimeout };

    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });

    expect(unsubscribeAckTimeout).toHaveBeenCalledTimes(1);
  });
});

describe('connect.core.reauthenticateAfterLogout()', () => {
  let authenticateSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    connect.containerDiv = makeContainerDiv();
    connect.core.upstream = { sendUpstream: jest.fn() };
    authenticateSpy = jest.spyOn(connect.core, 'authenticate').mockImplementation(() => {});
  });

  afterEach(() => {
    connect.initCCPParams = null;
    connect.containerDiv = null;
    connect.core.upstream = null;
    commonAfterEach();
  });

  it('throws for ACGR when enableGlobalResiliency=true', () => {
    connect.initCCPParams = {
      ccpUrl: 'url.com',
      loginOptions: {},
      enableGlobalResiliency: true,
    };

    expect(() => connect.core.reauthenticateAfterLogout()).toThrow('Not supported in ACGR instance');
  });

  it('routes through connect.core.authenticate when enableGlobalResiliency=false', () => {
    connect.initCCPParams = {
      ccpUrl: 'url.com',
      loginOptions: {},
      enableGlobalResiliency: false,
    };

    connect.core.reauthenticateAfterLogout();

    expect(authenticateSpy).toHaveBeenCalledTimes(1);
    expect(authenticateSpy).toHaveBeenCalledWith(
      connect.initCCPParams,
      connect.containerDiv,
      connect.core.upstream
    );
  });

  it('throws "Missing parameters to refresh CCP iframe" when initCCPParams is missing', () => {
    connect.initCCPParams = null;
    expect(() => connect.core.reauthenticateAfterLogout()).toThrow(
      'Missing parameters to refresh CCP iframe'
    );
  });

  it('throws when containerDiv is missing', () => {
    connect.initCCPParams = { ccpUrl: 'url.com', loginOptions: {} };
    connect.containerDiv = null;
    expect(() => connect.core.reauthenticateAfterLogout()).toThrow(
      'Missing parameters to refresh CCP iframe'
    );
  });

  it('throws when upstream is missing', () => {
    connect.initCCPParams = { ccpUrl: 'url.com', loginOptions: {} };
    connect.core.upstream = null;
    expect(() => connect.core.reauthenticateAfterLogout()).toThrow(
      'Missing parameters to refresh CCP iframe'
    );
  });
});
