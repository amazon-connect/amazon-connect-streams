// Jest port of softphone.spec.js (split file). Mocha spec stays in place; this
// file runs under `npm run test-jest`.

const {
  VDI_PLATFORMS,
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
} = require('./softphone-test-helpers');

describe('SoftphoneManager - initialization', () => {
  let bus;
  let upstream;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  describe('VDI strategy selection', () => {
    let citrixSpy;
    let dcvSpy;
    let omnissaSpy;

    beforeEach(() => {
      citrixSpy = jest.spyOn(connect, 'CitrixVDIStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'CitrixVDIStrategy';
      });
      dcvSpy = jest.spyOn(connect, 'DCVWebRTCStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'DCVStrategy';
      });
      omnissaSpy = jest.spyOn(connect, 'OmnissaVDIStrategy').mockImplementation(function () {
        this.getStrategyName = () => 'OmnissaVDIStrategy';
      });
    });

    it('selects CitrixVDIStrategy when VDIPlatform is CITRIX', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
      expect(sm.rtcJsStrategy.getStrategyName()).toBe('CitrixVDIStrategy');
      expect(citrixSpy).toHaveBeenCalledWith(VDI_PLATFORMS.CITRIX, true);
      expect(dcvSpy).not.toHaveBeenCalled();
      expect(omnissaSpy).not.toHaveBeenCalled();
    });

    it('selects CitrixVDIStrategy when VDIPlatform is CITRIX_413', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX_413 });
      expect(sm.rtcJsStrategy.getStrategyName()).toBe('CitrixVDIStrategy');
      expect(citrixSpy).toHaveBeenCalledWith(VDI_PLATFORMS.CITRIX_413, true);
    });

    it('selects DCVStrategy when VDIPlatform is AWS_WORKSPACE', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.AWS_WORKSPACE });
      expect(sm.rtcJsStrategy.getStrategyName()).toBe('DCVStrategy');
      expect(citrixSpy).not.toHaveBeenCalled();
    });

    it('selects OmnissaVDIStrategy when VDIPlatform is OMNISSA', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.OMNISSA });
      expect(sm.rtcJsStrategy.getStrategyName()).toBe('OmnissaVDIStrategy');
    });

    it('publishes VDI_STRATEGY_NOT_SUPPORTED for an unsupported VDIPlatform', () => {
      const sm = new connect.SoftphoneManager({ VDIPlatform: 'UNSUPPORTED_PLATFORM' });
      expect(sm.rtcJsStrategy).toBeNull();
      expect(connect.SoftphoneError).toHaveBeenCalledWith(
        connect.SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED,
        expect.anything(),
        expect.anything()
      );
    });

    it('has no VDI strategy when VDIPlatform is not provided and Azure auto-detect fails', () => {
      const sm = new connect.SoftphoneManager({});
      expect(sm.rtcJsStrategy).toBeNull();
      expect(citrixSpy).not.toHaveBeenCalled();
    });
  });

  it('creates RtcPeerConnectionFactory', () => {
    new connect.SoftphoneManager();
    expect(connect.RtcPeerConnectionFactory).toHaveBeenCalled();
  });

  it('creates RtcPeerConnectionManagerV2 by default', async () => {
    jest
      .spyOn(connect.Agent.prototype, 'getConfiguration')
      .mockReturnValue({ softphonePersistentConnection: true });
    const sm = new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    expect(sm.rtcPeerConnectionManager).not.toBeNull();
    expect(connect.RtcPeerConnectionManagerV2).toHaveBeenCalled();
  });

  it('passes allowExtendedPersistentConnection=false to PCMv2 by default', async () => {
    new connect.SoftphoneManager({});
    await jest.advanceTimersByTimeAsync(0);
    bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    const config = connect.RtcPeerConnectionManagerV2.mock.calls.at(-1)[0];
    expect(config.allowExtendedPersistentConnection).toBe(false);
  });

  it('passes allowExtendedPersistentConnection=true to PCMv2 when set in softphoneParams', async () => {
    new connect.SoftphoneManager({ allowExtendedPersistentConnection: true });
    await jest.advanceTimersByTimeAsync(0);
    bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    const config = connect.RtcPeerConnectionManagerV2.mock.calls.at(-1)[0];
    expect(config.allowExtendedPersistentConnection).toBe(true);
  });

  it('coerces truthy allowExtendedPersistentConnection to boolean true', async () => {
    new connect.SoftphoneManager({ allowExtendedPersistentConnection: 'yes' });
    await jest.advanceTimersByTimeAsync(0);
    bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    const config = connect.RtcPeerConnectionManagerV2.mock.calls.at(-1)[0];
    expect(config.allowExtendedPersistentConnection).toBe(true);
  });

  it('throws UNSUPPORTED_BROWSER when the browser is not supported', () => {
    connect.SoftphoneManager.isBrowserSoftPhoneSupported.mockReturnValue(false);
    new connect.SoftphoneManager();
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
      expect.anything(),
      expect.anything()
    );
  });

  it('throws MICROPHONE_NOT_SHARED when getUserMedia returns no audio tracks', async () => {
    navigator.mediaDevices.getUserMedia.mockResolvedValue({ getAudioTracks: () => [] });
    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
      expect.anything(),
      expect.anything()
    );
  });

  it('throws MICROPHONE_NOT_SHARED when getUserMedia fails', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('boom'));
    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
      expect.anything(),
      expect.anything()
    );
  });

  it('subscribes to MUTE event', () => {
    new connect.SoftphoneManager();
    expect(bus.subscribe).toHaveBeenCalledWith(connect.EventType.MUTE, expect.any(Function));
  });

  it('subscribes to SET_SPEAKER_DEVICE event', () => {
    new connect.SoftphoneManager();
    expect(bus.subscribe).toHaveBeenCalledWith(
      connect.ConfigurationEvents.SET_SPEAKER_DEVICE,
      expect.any(Function)
    );
  });

  it('subscribes to SET_MICROPHONE_DEVICE event', () => {
    new connect.SoftphoneManager();
    expect(bus.subscribe).toHaveBeenCalledWith(
      connect.ConfigurationEvents.SET_MICROPHONE_DEVICE,
      expect.any(Function)
    );
  });

  it('subscribes to CONTACT_INIT event', () => {
    new connect.SoftphoneManager();
    expect(bus.subscribe).toHaveBeenCalledWith(
      connect.ContactEvents.INIT,
      expect.any(Function)
    );
  });

  it('wires up permissionStatus.onchange when chrome>43; the handler publishes telemetry and SoftphoneError on denied', async () => {
    connect.isChromeBrowser.mockReturnValue(true);
    connect.getChromeBrowserVersion.mockReturnValue(60);

    const permissionStatus = { state: 'granted', onchange: null };
    navigator.permissions.query.mockResolvedValue(permissionStatus);

    new connect.SoftphoneManager();
    await jest.advanceTimersByTimeAsync(0);

    expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'microphone' });
    expect(typeof permissionStatus.onchange).toBe('function');

    permissionStatus.state = 'granted';
    connect.publishMetric.mockClear();
    permissionStatus.onchange();
    const grantedCalls = connect.publishMetric.mock.calls.filter(
      ([m]) => m && m.name === 'ConnectivityCheckResult'
    );
    expect(grantedCalls).toHaveLength(1);
    expect(grantedCalls[0][0].data).toEqual({
      connectivityCheckType: 'MicrophonePermission',
      status: 'granted',
    });
    expect(connect.SoftphoneError).not.toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
      expect.anything(),
      expect.anything()
    );

    permissionStatus.state = 'denied';
    connect.publishMetric.mockClear();
    connect.SoftphoneError.mockClear();
    permissionStatus.onchange();
    const deniedCalls = connect.publishMetric.mock.calls.filter(
      ([m]) => m && m.name === 'ConnectivityCheckResult'
    );
    expect(deniedCalls).toHaveLength(1);
    expect(deniedCalls[0][0].data).toEqual({
      connectivityCheckType: 'MicrophonePermission',
      status: 'denied',
    });
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      connect.SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
      expect.any(String),
      expect.any(String)
    );
  });

  it('terminate() unsubscribes onInitContact / onMute / onSetSpeakerDevice / onSetMicrophoneDevice and clears the factory timer', () => {
    const subs = [];
    bus.subscribe.mockImplementation((eventName, handler) => {
      const result = connect.EventBus.prototype.subscribe.call(bus, eventName, handler);
      jest.spyOn(result, 'unsubscribe');
      subs.push({ eventName, sub: result });
      return result;
    });

    const contactSubProxy = { unsubscribe: jest.fn() };
    jest.spyOn(connect, 'contact').mockReturnValue(contactSubProxy);

    const sm = new connect.SoftphoneManager();
    const clearTimer = jest.fn();
    // Re-attach a factory because the V2 init path nulls it.
    sm.rtcPeerConnectionFactory = { clearIdleRtcPeerConnectionTimerId: clearTimer };

    sm.terminate();

    expect(contactSubProxy.unsubscribe).toHaveBeenCalled();
    const muteSub = subs.find((s) => s.eventName === connect.EventType.MUTE);
    const speakerSub = subs.find((s) => s.eventName === connect.ConfigurationEvents.SET_SPEAKER_DEVICE);
    const micSub = subs.find((s) => s.eventName === connect.ConfigurationEvents.SET_MICROPHONE_DEVICE);
    expect(muteSub).toBeDefined();
    expect(speakerSub).toBeDefined();
    expect(micSub).toBeDefined();
    expect(muteSub.sub.unsubscribe).toHaveBeenCalled();
    expect(speakerSub.sub.unsubscribe).toHaveBeenCalled();
    expect(micSub.sub.unsubscribe).toHaveBeenCalled();
    expect(clearTimer).toHaveBeenCalled();
    expect(sm.rtcPeerConnectionFactory).toBeNull();
  });

  it('terminate() invokes clearIdleRtcPeerConnectionTimerId on the PCM when present', () => {
    const sm = new connect.SoftphoneManager();
    sm.rtcPeerConnectionFactory = { clearIdleRtcPeerConnectionTimerId: jest.fn() };
    const pcmClearTimer = jest.fn();
    sm.rtcPeerConnectionManager = { clearIdleRtcPeerConnectionTimerId: pcmClearTimer };

    sm.terminate();
    expect(pcmClearTimer).toHaveBeenCalled();
  });
});
