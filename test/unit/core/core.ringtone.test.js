// Jest port of initRingtoneEngines + setRingerDevice describes.

const {
  commonAfterEach,
  defaultRingtoneUrl,
  setLocation,
} = require('./core-test-helpers');

const setupRingtone = () => {
  setLocation('http://localhost');
  connect.agent.initialized = true;
  jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({ getAgentData: () => ({}) });
  connect.core.eventBus = new connect.EventBus({ logEvents: true });
  jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});
  jest.spyOn(connect, 'VoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AdditionalVoiceRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'QueueCallbackRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'ChatRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'TaskRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'EmailRingtoneEngine').mockImplementation(function () {});
  jest.spyOn(connect, 'AutoAcceptedRingtoneEngine').mockImplementation(function () {});
};

const fireInitAndRefresh = () => {
  connect.core.getEventBus().trigger(connect.AgentEvents.INIT, new connect.Agent());
  connect.core.getEventBus().trigger(connect.AgentEvents.REFRESH, new connect.Agent());
  // ifMaster's first arg is topic, second is the success callback. Drive the master path.
  const masterFn = connect.ifMaster.mock.calls.at(-1)[1];
  masterFn();
};

describe('connect.core.initRingtoneEngines() with default settings', () => {
  let defaultRingtone;

  beforeEach(() => {
    setupRingtone();
    defaultRingtone = {
      voice: { ringtoneUrl: defaultRingtoneUrl },
      additionalVoice: { ringtoneUrl: defaultRingtoneUrl },
      queue_callback: { ringtoneUrl: defaultRingtoneUrl },
      autoAcceptTone: { ringtoneUrl: defaultRingtoneUrl },
    };
    connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('initializes VoiceRingtoneEngine', () => {
    fireInitAndRefresh();
    expect(connect.VoiceRingtoneEngine).toHaveBeenCalledTimes(1);
  });

  it('initializes AdditionalVoiceRingtoneEngine', () => {
    fireInitAndRefresh();
    expect(connect.AdditionalVoiceRingtoneEngine).toHaveBeenCalledTimes(1);
  });

  it('initializes QueueCallbackRingtoneEngine', () => {
    fireInitAndRefresh();
    expect(connect.QueueCallbackRingtoneEngine).toHaveBeenCalledTimes(1);
  });

  it('does not initialize ChatRingtoneEngine when chat ringtone params are absent', () => {
    fireInitAndRefresh();
    expect(connect.ChatRingtoneEngine).not.toHaveBeenCalled();
  });

  it('does not initialize TaskRingtoneEngine when task ringtone params are absent', () => {
    fireInitAndRefresh();
    expect(connect.TaskRingtoneEngine).not.toHaveBeenCalled();
  });

  it('does not initialize EmailRingtoneEngine when email ringtone params are absent', () => {
    fireInitAndRefresh();
    expect(connect.EmailRingtoneEngine).not.toHaveBeenCalled();
  });
});

describe('connect.core.initRingtoneEngines() with optional chat and task ringtone params', () => {
  let extraRingtone;

  beforeEach(() => {
    setupRingtone();
    extraRingtone = {
      voice: { ringtoneUrl: defaultRingtoneUrl },
      additionalVoice: { ringtoneUrl: defaultRingtoneUrl },
      queue_callback: { ringtoneUrl: defaultRingtoneUrl },
      chat: { ringtoneUrl: defaultRingtoneUrl },
      task: { ringtoneUrl: defaultRingtoneUrl },
      email: { ringtoneUrl: defaultRingtoneUrl },
      autoAcceptTone: { ringtoneUrl: 'autoAcceptRingTone' },
    };
    connect.core.initRingtoneEngines({ ringtone: extraRingtone });
  });

  afterEach(() => {
    commonAfterEach();
  });

  it.each([
    ['VoiceRingtoneEngine', 'VoiceRingtoneEngine'],
    ['AdditionalVoiceRingtoneEngine', 'AdditionalVoiceRingtoneEngine'],
    ['QueueCallbackRingtoneEngine', 'QueueCallbackRingtoneEngine'],
    ['ChatRingtoneEngine', 'ChatRingtoneEngine'],
    ['TaskRingtoneEngine', 'TaskRingtoneEngine'],
    ['EmailRingtoneEngine', 'EmailRingtoneEngine'],
    ['AutoAcceptedRingtoneEngine', 'AutoAcceptedRingtoneEngine'],
  ])('initializes %s', (_label, ctorName) => {
    fireInitAndRefresh();
    expect(connect[ctorName]).toHaveBeenCalledTimes(1);
  });
});

describe('connect.core.initRingtoneEngines() with stored ringer device ID', () => {
  const DEVICE_ID = 'DEVICE_ID';
  let setRingerDeviceMock;
  let defaultRingtone;

  beforeEach(() => {
    setupRingtone();
    defaultRingtone = {
      voice: { ringtoneUrl: defaultRingtoneUrl },
      additionalVoice: { ringtoneUrl: defaultRingtoneUrl },
      queue_callback: { ringtoneUrl: defaultRingtoneUrl },
      chat: { ringtoneUrl: defaultRingtoneUrl },
      task: { ringtoneUrl: defaultRingtoneUrl },
    };
    setRingerDeviceMock = jest.fn();
    connect.core._ringerDeviceId = null;
  });

  afterEach(() => {
    connect.core._ringerDeviceId = null;
    commonAfterEach();
  });

  it('does NOT call setRingerDevice when no device ID was previously stored', () => {
    connect.core.initRingtoneEngines({ ringtone: defaultRingtone }, setRingerDeviceMock);
    fireInitAndRefresh();
    expect(setRingerDeviceMock).not.toHaveBeenCalled();
  });

  it('calls setRingerDevice with stored device ID when one was previously stored', () => {
    connect.core._ringerDeviceId = DEVICE_ID;
    connect.core.initRingtoneEngines({ ringtone: defaultRingtone }, setRingerDeviceMock);
    fireInitAndRefresh();
    expect(setRingerDeviceMock).toHaveBeenCalledWith({ deviceId: DEVICE_ID });
  });
});

describe('connect.core.initRingtoneEngines() embedded CCP', () => {
  const ringtoneParamsKey = `RingtoneParamsStorage::${new URL('https://test-fra.awsapps.com/connect/home').origin}`;
  let defaultRingtones;
  let ringtoneParams;
  let getItemSpy;
  let setItemSpy;
  let removeItemSpy;

  beforeEach(() => {
    setupRingtone();
    jest.useFakeTimers();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      onUpstream: (event, fn) => connect.core.eventBus.subscribe(event, fn),
      upstreamBus: connect.core.eventBus,
      sendUpstream: jest.fn(),
    });
    jest.spyOn(connect, 'isFramed').mockReturnValue(true);
    getItemSpy = jest.spyOn(window.localStorage.__proto__, 'getItem');
    setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
    removeItemSpy = jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});

    defaultRingtones = {
      voice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      additionalVoice: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      queue_callback: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      chat: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      task: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      email: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
      autoAcceptTone: { disabled: false, ringtoneUrl: defaultRingtoneUrl },
    };
    ringtoneParams = { ringtone: defaultRingtones };
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('persists ringtone params in localStorage on first CONFIGURE event', () => {
    getItemSpy.mockReturnValue(null);
    connect.core.initRingtoneEngines(ringtoneParams);
    connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});

    expect(setItemSpy).toHaveBeenCalledWith(ringtoneParamsKey, JSON.stringify(defaultRingtones));
  });

  describe('when iframe is refreshed', () => {
    beforeEach(() => {
      getItemSpy.mockReturnValue(JSON.stringify(defaultRingtones));
    });

    it('uses stored ringtone params when CONFIGURE is NOT delivered before timeout', () => {
      connect.core.initRingtoneEngines({ ringtone: {} });
      connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
      jest.advanceTimersByTime(110);
      fireInitAndRefresh();

      expect(getItemSpy).toHaveBeenCalledWith(ringtoneParamsKey);
      expect(connect.VoiceRingtoneEngine).toHaveBeenCalledTimes(1);
      expect(connect.VoiceRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.voice);
      expect(connect.AdditionalVoiceRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.additionalVoice);
      expect(connect.ChatRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.chat);
      expect(connect.TaskRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.task);
      expect(connect.QueueCallbackRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.queue_callback);
      expect(connect.EmailRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.email);
      expect(connect.AutoAcceptedRingtoneEngine.mock.calls[0][0]).toEqual(defaultRingtones.autoAcceptTone);
    });

    it('uses configure-supplied params when CONFIGURE IS delivered before timeout', () => {
      const otherRingtoneUrl = 'some_other_ringtone_url';
      const usedRingtoneParams = {
        ringtone: {
          voice: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          additionalVoice: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          queue_callback: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          chat: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          task: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          email: { disabled: false, ringtoneUrl: otherRingtoneUrl },
          autoAcceptTone: { disabled: false, ringtoneUrl: otherRingtoneUrl },
        },
      };
      connect.core.initRingtoneEngines(usedRingtoneParams);
      connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
      jest.advanceTimersByTime(99); // below 100ms - timeout doesn't fire
      connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});
      fireInitAndRefresh();

      expect(connect.VoiceRingtoneEngine.mock.calls[0][0]).toEqual(usedRingtoneParams.ringtone.voice);
    });

    it('does NOT initialize disabled engines from configure-supplied params', () => {
      const otherRingtoneUrl = 'some_other_ringtone_url';
      const usedRingtoneParams = {
        ringtone: {
          voice: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          additionalVoice: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          queue_callback: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          chat: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          task: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          email: { disabled: true, ringtoneUrl: otherRingtoneUrl },
          autoAcceptTone: { disabled: true, ringtoneUrl: otherRingtoneUrl },
        },
      };
      connect.core.initRingtoneEngines(usedRingtoneParams);
      connect.core.getEventBus().trigger(connect.EventType.ACKNOWLEDGE, { id: 'portId' });
      jest.advanceTimersByTime(99);
      connect.core.getEventBus().trigger(connect.EventType.CONFIGURE, {});
      fireInitAndRefresh();

      expect(connect.VoiceRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.AdditionalVoiceRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.ChatRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.TaskRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.QueueCallbackRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.EmailRingtoneEngine).not.toHaveBeenCalled();
      expect(connect.AutoAcceptedRingtoneEngine).not.toHaveBeenCalled();
    });
  });

  it('cleans up ringtone params on every initCCP call', () => {
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
    const container = { appendChild: jest.fn() };
    connect.core.initCCP(container, {
      ccpUrl: 'ccpURL',
      softphone: { allowFramedSoftphone: true },
    });

    expect(removeItemSpy).toHaveBeenCalledWith(ringtoneParamsKey);
  });
});

describe('connect.core.setRingerDevice', () => {
  const DEVICE_ID = 'DEVICE_ID';
  let defaultRingtone;

  beforeEach(() => {
    setupRingtone();
    jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
    defaultRingtone = {
      voice: { ringtoneUrl: defaultRingtoneUrl },
      chat: { ringtoneUrl: defaultRingtoneUrl },
    };
  });

  afterEach(() => {
    connect.core._ringerDeviceId = null;
    connect.core.ringtoneEngines = null;
    commonAfterEach();
  });

  it('stores device ID when setRingerDevice is called before ringtone engines are initialized', () => {
    connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
    connect.core.getEventBus().trigger(connect.ConfigurationEvents.SET_RINGER_DEVICE, { deviceId: DEVICE_ID });
    expect(connect.core._ringerDeviceId).toBe(DEVICE_ID);
    expect(connect.publishMetric).toHaveBeenCalledWith({
      name: 'SetRingerDeviceBeforeInitRingtoneEngine',
      data: { count: 1 },
    });
  });

  it('does NOT store device ID when setRingerDevice is called after ringtone engines are initialized', () => {
    connect.core.initRingtoneEngines({ ringtone: defaultRingtone });
    connect.core.ringtoneEngines = {
      chat: { setOutputDevice: jest.fn().mockResolvedValue(DEVICE_ID) },
      voice: { setOutputDevice: jest.fn().mockResolvedValue(DEVICE_ID) },
    };
    connect.core.getEventBus().trigger(connect.ConfigurationEvents.SET_RINGER_DEVICE, { deviceId: DEVICE_ID });

    expect(connect.core._ringerDeviceId).toBeNull();
    expect(connect.publishMetric).not.toHaveBeenCalled();
    expect(connect.core.ringtoneEngines.chat.setOutputDevice).toHaveBeenCalledWith(DEVICE_ID);
    expect(connect.core.ringtoneEngines.voice.setOutputDevice).toHaveBeenCalledWith(DEVICE_ID);
  });
});

// ----------------------------------------------------------------------------
// initRingtoneEngines mergeParams branches: disableRingtone overrides + the
// per-channel ringtoneUrl propagation paths (lines 600-651 in core.js).
// ----------------------------------------------------------------------------
describe('connect.core.initRingtoneEngines() - disableRingtone + per-channel ringtoneUrl propagation', () => {
  beforeEach(() => {
    setupRingtone();
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('softphone.disableRingtone=true marks voice/additionalVoice/queue_callback as disabled', () => {
    connect.core.initRingtoneEngines({
      softphone: { disableRingtone: true },
      ringtone: {
        voice: { ringtoneUrl: defaultRingtoneUrl },
        additionalVoice: { ringtoneUrl: defaultRingtoneUrl },
        queue_callback: { ringtoneUrl: defaultRingtoneUrl },
      },
    });
    fireInitAndRefresh();
    expect(connect.VoiceRingtoneEngine).not.toHaveBeenCalled();
    expect(connect.AdditionalVoiceRingtoneEngine).not.toHaveBeenCalled();
    expect(connect.QueueCallbackRingtoneEngine).not.toHaveBeenCalled();
  });

  // baseRingtone supplies the per-channel ringtoneUrl entries that
  // initRingtoneEngines asserts on at entry. We then override one of these
  // at the top-level of params (e.g. params.chat) to drive the disableRingtone
  // merge branch.
  const baseRingtone = () => ({
    voice: { ringtoneUrl: defaultRingtoneUrl },
    additionalVoice: { ringtoneUrl: defaultRingtoneUrl },
    queue_callback: { ringtoneUrl: defaultRingtoneUrl },
    chat: { ringtoneUrl: defaultRingtoneUrl },
    task: { ringtoneUrl: defaultRingtoneUrl },
    email: { ringtoneUrl: defaultRingtoneUrl },
    autoAcceptTone: { ringtoneUrl: defaultRingtoneUrl },
  });

  it('chat.disableRingtone=true marks chat as disabled', () => {
    connect.core.initRingtoneEngines({
      chat: { disableRingtone: true },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();
    expect(connect.ChatRingtoneEngine).not.toHaveBeenCalled();
  });

  it('task.disableRingtone=true marks task as disabled', () => {
    connect.core.initRingtoneEngines({
      task: { disableRingtone: true },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();
    expect(connect.TaskRingtoneEngine).not.toHaveBeenCalled();
  });

  it('email.disableRingtone=true marks email as disabled', () => {
    connect.core.initRingtoneEngines({
      email: { disableRingtone: true },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();
    expect(connect.EmailRingtoneEngine).not.toHaveBeenCalled();
  });

  it('autoAcceptTone.disableRingtone=true marks autoAccept as disabled', () => {
    connect.core.initRingtoneEngines({
      autoAcceptTone: { disableRingtone: true },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();
    expect(connect.AutoAcceptedRingtoneEngine).not.toHaveBeenCalled();
  });

  it('softphone.ringtoneUrl propagates to voice + queue_callback ringtone URLs', () => {
    connect.core.initRingtoneEngines({
      softphone: { ringtoneUrl: 'voice-only.mp3' },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();

    expect(connect.VoiceRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'voice-only.mp3' })
    );
    expect(connect.QueueCallbackRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'voice-only.mp3' })
    );
  });

  it('chat/task/email.ringtoneUrl each propagate to their corresponding ringtone params', () => {
    connect.core.initRingtoneEngines({
      chat: { ringtoneUrl: 'chat.mp3' },
      task: { ringtoneUrl: 'task.mp3' },
      email: { ringtoneUrl: 'email.mp3' },
      autoAcceptTone: { ringtoneUrl: 'autoAccept.mp3' },
      ringtone: baseRingtone(),
    });
    fireInitAndRefresh();

    expect(connect.ChatRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'chat.mp3' })
    );
    expect(connect.TaskRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'task.mp3' })
    );
    expect(connect.EmailRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'email.mp3' })
    );
    expect(connect.AutoAcceptedRingtoneEngine.mock.calls[0][0]).toEqual(
      expect.objectContaining({ ringtoneUrl: 'autoAccept.mp3' })
    );
  });
});
