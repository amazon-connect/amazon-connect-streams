// Jest port of softphone.spec.js (split file). Mocha spec stays in place; this
// file runs under `npm run test-jest`.

const {
  VDI_PLATFORMS,
  installCommonMocks,
  commonAfterEach,
  makeAgentConnection,
  makeContact,
} = require('./softphone-test-helpers');

describe('SoftphoneManager - replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia', () => {
  let upstream;
  let getVoiceEnhancedUserMediaSpy;
  let enhancedStream;
  const sourceStream = { getAudioTracks: () => [{ kind: 'source' }], id: 'source' };

  beforeEach(() => {
    jest.useFakeTimers();
    ({ upstream, getVoiceEnhancedUserMediaSpy, enhancedStream } = installCommonMocks());
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('replaces audio tracks when device id is given', async () => {
    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(sourceStream);

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia('dummy-device-id');

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: 'dummy-device-id' }, echoCancellation: true },
    });
    expect(getVoiceEnhancedUserMediaSpy).toHaveBeenCalledWith(
      sourceStream,
      expect.objectContaining({ onError: expect.any(Function) })
    );
    expect(sm.replaceMediaStreamInRTCSession).toHaveBeenCalledWith(enhancedStream);
  });

  it('uses default constraints with autoGainControl when no device given and echo cancellation disabled', async () => {
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockResolvedValue(sourceStream);

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: false, autoGainControl: true },
    });
  });

  it('skips replacement entirely for VDI platforms', async () => {
    jest.spyOn(connect, 'CitrixVDIStrategy').mockImplementation(function () {
      this.getStrategyName = () => 'CitrixVDIStrategy';
    });
    const sm = new connect.SoftphoneManager({ VDIPlatform: 'CITRIX' });
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

    expect(getVoiceEnhancedUserMediaSpy).not.toHaveBeenCalled();
    expect(sm.replaceMediaStreamInRTCSession).not.toHaveBeenCalled();
  });

  it('handles undefined input gracefully', async () => {
    const sm = new connect.SoftphoneManager();
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockResolvedValue(sourceStream);

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true },
    });
    expect(sm.replaceMediaStreamInRTCSession).toHaveBeenCalledWith(enhancedStream);
  });

  it('does not attempt voice enhancement when getUserMedia fails', async () => {
    const sm = new connect.SoftphoneManager({});
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('getUserMedia failed'));

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia('dummy-device-id');

    expect(getVoiceEnhancedUserMediaSpy).not.toHaveBeenCalled();
    expect(sm.replaceMediaStreamInRTCSession).not.toHaveBeenCalled();
  });

  it('does not call replaceMediaStreamInRTCSession when voice enhancement fails', async () => {
    const sm = new connect.SoftphoneManager({});
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockResolvedValue(sourceStream);
    getVoiceEnhancedUserMediaSpy.mockRejectedValue(new Error('Voice enhancement failed'));

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia('dummy-device-id');

    expect(sm.replaceMediaStreamInRTCSession).not.toHaveBeenCalled();
  });

  it('publishes a SOFTPHONE_ERROR via the onError callback when voice enhancement fails', async () => {
    const sm = new connect.SoftphoneManager({});
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceMediaStreamInRTCSession').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockResolvedValue(sourceStream);

    getVoiceEnhancedUserMediaSpy.mockImplementation(async (_stream, options) => {
      options.onError();
      return enhancedStream;
    });

    await sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia('dummy-device-id');

    expect(upstream.sendUpstream).toHaveBeenCalledWith(
      connect.EventType.BROADCAST,
      expect.objectContaining({ event: connect.AgentEvents.SOFTPHONE_ERROR })
    );
    expect(connect.SoftphoneError).toHaveBeenCalledWith(
      'audio_enhancement_failure',
      'Failed to enhance audio stream',
      ''
    );
  });
});

describe('SoftphoneManager - setSpeakerDevice', () => {
  let bus;
  let upstream;
  let setSinkIdSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    setSinkIdSpy = jest.fn().mockResolvedValue();
    jest.spyOn(document, 'getElementById').mockReturnValue({ setSinkId: setSinkIdSpy });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('applies the new deviceId to the remote audio element and broadcasts SPEAKER_DEVICE_CHANGED', async () => {
    new connect.SoftphoneManager();
    bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: 'sample-device-id' });
    expect(setSinkIdSpy).toHaveBeenCalledWith('sample-device-id');
    await jest.advanceTimersByTimeAsync(0);

    expect(upstream.sendUpstream).toHaveBeenCalledWith(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
      data: { deviceId: 'sample-device-id' },
    });
  });

  it('cancels if no deviceId is given', () => {
    new connect.SoftphoneManager();
    bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, {});
    expect(setSinkIdSpy).not.toHaveBeenCalled();
  });

  it('cancels if remote audio element does not support setSinkId method', () => {
    document.getElementById.mockReturnValue({});
    new connect.SoftphoneManager();
    bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: 'sample-device-id' });
    expect(setSinkIdSpy).not.toHaveBeenCalled();
  });

  it('does not broadcast if setSinkId rejects', async () => {
    setSinkIdSpy.mockRejectedValue(new Error('boom'));
    new connect.SoftphoneManager();
    bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: 'sample-device-id' });
    await jest.advanceTimersByTimeAsync(0);
    const broadcastCalls = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) =>
        payload && payload.event === connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED
    );
    expect(broadcastCalls).toHaveLength(0);
  });
});

describe('SoftphoneManager - setMicrophoneDevice', () => {
  let bus;
  let upstream;
  let stubbedReplaceTrack;
  let pcmCreateSession;
  let pcmConnect;
  let contact;
  const sampleDeviceId = 'sample-device-id';
  const dummyAudioTrack = { kind: 'dummy' };
  const enhancedAudioTrack = { kind: 'enhanced' };

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream, stubbedReplaceTrack } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: stubbedReplaceTrack }] },
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionFactory.mockImplementation(function () {
      this.get = jest.fn();
      this.close = jest.fn();
    });
    jest.spyOn(connect.Agent.prototype, 'getPermissions').mockReturnValue(['audioDeviceSettings']);
    contact = makeContact('contact-setMicrophoneDevice', { contactType: connect.ContactType.VOICE });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('cancels if local media stream does not exist', () => {
    new connect.SoftphoneManager();
    navigator.mediaDevices.getUserMedia.mockClear();
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('replaces the audio track with the device-id-targeted stream directly (no voice enhancement)', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'agent-conn-mic');
    const session = sm.getSession('agent-conn-mic');
    const stream = { getAudioTracks: () => [dummyAudioTrack] };
    session.onLocalStreamAdded(session, stream);
    await jest.advanceTimersByTimeAsync(0);

    navigator.mediaDevices.getUserMedia.mockClear();
    connect.VoiceFocusProvider.getVoiceEnhancedUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
    stubbedReplaceTrack.mockClear();
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: sampleDeviceId } },
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(stubbedReplaceTrack).toHaveBeenCalledWith(dummyAudioTrack);
    expect(connect.VoiceFocusProvider.getVoiceEnhancedUserMedia).not.toHaveBeenCalled();
    expect(sm.replaceLocalMediaTrack).toHaveBeenCalledWith('agent-conn-mic', dummyAudioTrack);
  });

  describe('Audio Constraints Validation in Microphone Device Change', () => {
    const arrangeManager = (softphoneParams) => {
      const sm = new connect.SoftphoneManager(softphoneParams);
      connect.core.softphoneManager = sm;
      jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
      contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
      sm.startSession(contact, 'agent-conn-mic');
      const session = sm.getSession('agent-conn-mic');
      const stream = { getAudioTracks: () => [dummyAudioTrack] };
      session.onLocalStreamAdded(session, stream);
      return { sm, session, stream };
    };

    it('replaces the audio track with EXPLICIT echo cancellation constraints', async () => {
      const { stream } = arrangeManager({ disableEchoCancellation: true });
      await jest.advanceTimersByTimeAsync(0);
      navigator.mediaDevices.getUserMedia.mockClear();
      navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
      bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });
      await jest.advanceTimersByTimeAsync(0);

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          deviceId: { exact: sampleDeviceId },
          echoCancellation: false,
        },
      });
    });

    it('formats the device ID constraint as { exact: deviceId }', async () => {
      const { stream } = arrangeManager({ disableEchoCancellation: true });
      await jest.advanceTimersByTimeAsync(0);
      navigator.mediaDevices.getUserMedia.mockClear();
      navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
      const testDeviceId = 'test-device-microphone-456';
      bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: testDeviceId });
      await jest.advanceTimersByTimeAsync(0);

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
      const audioConstraints = navigator.mediaDevices.getUserMedia.mock.calls[0][0].audio;
      expect(audioConstraints.deviceId).toEqual({ exact: testDeviceId });
    });

    it('preserves constraint structure even when getUserMedia fails', async () => {
      const { stream } = arrangeManager({ disableEchoCancellation: true });
      await jest.advanceTimersByTimeAsync(0);
      navigator.mediaDevices.getUserMedia.mockClear();
      navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Device not found'));
      stubbedReplaceTrack.mockClear();

      bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });
      await jest.advanceTimersByTimeAsync(0);

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          deviceId: { exact: sampleDeviceId },
          echoCancellation: false,
        },
      });
      expect(stubbedReplaceTrack).not.toHaveBeenCalled();
    });
  });

  it('cancels if no deviceId is given', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'agent-conn-mic');
    const session = sm.getSession('agent-conn-mic');
    const stream = { getAudioTracks: () => [dummyAudioTrack] };
    session.onLocalStreamAdded(session, stream);
    navigator.mediaDevices.getUserMedia.mockClear();
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, {});
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('passes disableEchoCancellation softphone option through to getUserMedia', async () => {
    const sm = new connect.SoftphoneManager({ disableEchoCancellation: true });
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'agent-conn-mic');
    const session = sm.getSession('agent-conn-mic');
    const stream = { getAudioTracks: () => [dummyAudioTrack] };
    session.onLocalStreamAdded(session, stream);
    navigator.mediaDevices.getUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: sampleDeviceId }, echoCancellation: false },
    });
  });

  it('still calls getUserMedia for non-AWS_WORKSPACE VDIs (Citrix) since setMicrophoneDevice has no VDI guard', async () => {
    jest.spyOn(connect, 'CitrixVDIStrategy').mockImplementation(function () {
      this.getStrategyName = () => 'CitrixVDIStrategy';
    });
    const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.CITRIX });
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'agent-conn-mic');
    const session = sm.getSession('agent-conn-mic');
    const stream = { getAudioTracks: () => [dummyAudioTrack] };
    session.onLocalStreamAdded(session, stream);
    await jest.advanceTimersByTimeAsync(0);
    navigator.mediaDevices.getUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: sampleDeviceId } },
    });
  });

  it('still calls getUserMedia for AWS_WORKSPACE VDI since setMicrophoneDevice has no VDI guard', async () => {
    jest.spyOn(connect, 'DCVWebRTCStrategy').mockImplementation(function () {
      this.getStrategyName = () => 'DCVStrategy';
    });
    const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.AWS_WORKSPACE });
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'agent-conn-mic');
    const session = sm.getSession('agent-conn-mic');
    const stream = { getAudioTracks: () => [dummyAudioTrack] };
    session.onLocalStreamAdded(session, stream);
    await jest.advanceTimersByTimeAsync(0);
    navigator.mediaDevices.getUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: sampleDeviceId });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: sampleDeviceId } },
    });
  });
});

describe('SoftphoneManager - replaceMediaStreamInRTCSession', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let testContact;
  const agentConnectionId = 'replace-stream-agent-conn';

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn();
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });

    testContact = makeContact('replace-stream-test-contact', { contactType: connect.ContactType.VOICE });
    testContact.getAgentConnection.mockReturnValue(makeAgentConnection(agentConnectionId));
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('sets _isUserProvidedStream and calls replaceLocalMediaTrack after replacing tracks', async () => {
    const trackWithSettings = {
      kind: 'audio',
      enabled: true,
      id: 'new-track',
      getSettings: () => ({
        noiseSuppression: true,
        autoGainControl: false,
        echoCancellation: true,
        voiceIsolation: false,
      }),
    };
    const mediaStream = { getAudioTracks: () => [trackWithSettings], id: 'stream-with-settings' };

    const sender = { replaceTrack: jest.fn().mockResolvedValue() };
    const session = {
      _pc: { getSenders: () => [sender] },
      _isUserProvidedStream: false,
    };
    pcmCreateSession.mockReturnValue(session);

    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    sm.startSession(testContact, agentConnectionId);
    const sessRef = sm.getSession(agentConnectionId);
    const existingStream = {
      getAudioTracks: () => [{ kind: 'audio', enabled: true, id: 'old-track' }],
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    };
    sessRef.onLocalStreamAdded(sessRef, existingStream);

    await sm.replaceMediaStreamInRTCSession(mediaStream);

    expect(session._isUserProvidedStream).toBe(true);
    expect(sm.replaceLocalMediaTrack).toHaveBeenCalledWith(agentConnectionId, trackWithSettings);
  });

  it('sets _isUserProvidedStream without calling disableMediaStreamRefresh', async () => {
    const session = {
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
      _isUserProvidedStream: false,
      disableMediaStreamRefresh: jest.fn(),
    };
    pcmCreateSession.mockReturnValue(session);

    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    sm.startSession(testContact, agentConnectionId);
    const sessRef = sm.getSession(agentConnectionId);
    sessRef.onLocalStreamAdded(sessRef, {
      getAudioTracks: () => [{ kind: 'audio', enabled: true, id: 'old-track' }],
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    });

    const newStream = {
      getAudioTracks: () => [{ kind: 'audio', enabled: true, id: 'new-track', getSettings: () => ({}) }],
      id: 'new-stream',
    };
    await sm.replaceMediaStreamInRTCSession(newStream);

    expect(session.disableMediaStreamRefresh).not.toHaveBeenCalled();
    expect(session._isUserProvidedStream).toBe(true);
  });

  it('still sets _isUserProvidedStream when disableMediaStreamRefresh does not exist (older RTCJS)', async () => {
    const session = {
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
      _isUserProvidedStream: false,
    };
    pcmCreateSession.mockReturnValue(session);

    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    sm.startSession(testContact, agentConnectionId);
    const sessRef = sm.getSession(agentConnectionId);
    sessRef.onLocalStreamAdded(sessRef, {
      getAudioTracks: () => [{ kind: 'audio', enabled: true, id: 'old-track' }],
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    });

    const newStream = {
      getAudioTracks: () => [{ kind: 'audio', enabled: true, id: 'new-track', getSettings: () => ({}) }],
      id: 'new-stream',
    };
    await expect(sm.replaceMediaStreamInRTCSession(newStream)).resolves.not.toThrow();
    expect(session._isUserProvidedStream).toBe(true);
  });
});

describe('deleteLocalMediaStream - shared stream audio track re-enable', () => {
  let bus;
  let upstream;
  let pcmCreateSession;
  let pcmConnect;
  let testContact;
  let bulletContact;
  let mockAgentConnection;
  let bulletMockAgentConnection;
  let sharedStream;
  let audioTrack;
  const testContactId = 'first-call-contact';
  const testAgentConnectionId = 'first-call-agent-conn';
  const bulletContactId = 'bullet-call-contact';
  const bulletAgentConnectionId = 'bullet-call-agent-conn';

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManager.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });

    audioTrack = { kind: 'audio', enabled: true };
    sharedStream = { getAudioTracks: () => [audioTrack], id: 'shared-ppc-stream', removeTrack: jest.fn(), addTrack: jest.fn() };

    mockAgentConnection = makeAgentConnection(testAgentConnectionId);
    bulletMockAgentConnection = makeAgentConnection(bulletAgentConnectionId);

    testContact = makeContact(testContactId, { contactType: connect.ContactType.VOICE });
    testContact.getAgentConnection.mockReturnValue(mockAgentConnection);
    jest.spyOn(testContact, 'hasTwoActiveParticipants').mockReturnValue(true);

    bulletContact = makeContact(bulletContactId, { contactType: connect.ContactType.VOICE });
    bulletContact.getAgentConnection.mockReturnValue(bulletMockAgentConnection);
    jest.spyOn(bulletContact, 'hasTwoActiveParticipants').mockReturnValue(true);
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  const initContactWithStream = (contact, agentConnId, stream) => {
    let onRefreshCallback;
    let onConnectedCallback;
    let onDestroyCallback;
    jest.spyOn(contact, 'onRefresh').mockImplementation((cb) => {
      onRefreshCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onConnected').mockImplementation((cb) => {
      onConnectedCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onDestroy').mockImplementation((cb) => {
      onDestroyCallback = cb;
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(contact, 'onEnded').mockReturnValue({ unsubscribe: jest.fn() });
    jest.spyOn(contact, 'onError').mockReturnValue({ unsubscribe: jest.fn() });

    let sm = connect.core.softphoneManager;
    if (!sm) {
      sm = new connect.SoftphoneManager({});
      connect.core.softphoneManager = sm;
      jest.spyOn(sm, 'sanityCheckActiveSessions').mockReturnValue();
      sm.rtcPeerConnectionManager = {
        createSession: pcmCreateSession,
        connect: pcmConnect,
        getPeerConnection: jest.fn(),
        close: jest.fn(),
      };
    }

    connect.Agent.prototype.getContacts.mockReturnValue([contact]);
    bus.trigger(connect.ContactEvents.INIT, contact);
    onRefreshCallback(contact);

    const session = sm.getSession(agentConnId);
    session.onLocalStreamAdded(session, stream);
    session.onSessionConnected(session);
    onConnectedCallback(contact);

    return { sm, session, onDestroyCallback };
  };

  it('broadcasts MUTE_TOGGLE {muted: false} when a muted contact is destroyed but does NOT re-enable the track', () => {
    const { sm } = initContactWithStream(testContact, testAgentConnectionId, sharedStream);
    connect.Agent.prototype.getContacts.mockReturnValue([testContact, bulletContact]);
    const { onDestroyCallback: destroyBullet } = initContactWithStream(
      bulletContact,
      bulletAgentConnectionId,
      sharedStream
    );

    audioTrack.enabled = false;
    upstream.sendUpstream.mockClear();
    destroyBullet();

    // deleteLocalMediaStream does NOT manipulate audio tracks
    expect(audioTrack.enabled).toBe(false);
    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(broadcasts.length).toBeGreaterThan(0);
    expect(broadcasts.at(-1)[1].data.muted).toBe(false);
    expect(sm).toBeDefined();
  });

  it('broadcasts MUTE_TOGGLE {muted: false} on single-contact teardown without re-enabling track', () => {
    const { onDestroyCallback: destroyContact } = initContactWithStream(
      testContact,
      testAgentConnectionId,
      sharedStream
    );

    audioTrack.enabled = false;
    upstream.sendUpstream.mockClear();
    destroyContact();

    // deleteLocalMediaStream does NOT re-enable tracks
    expect(audioTrack.enabled).toBe(false);
    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(broadcasts.length).toBeGreaterThan(0);
    expect(broadcasts.at(-1)[1].data.muted).toBe(false);
  });

  it('does not disable an already-enabled audio track on destroy', () => {
    initContactWithStream(testContact, testAgentConnectionId, sharedStream);
    connect.Agent.prototype.getContacts.mockReturnValue([testContact, bulletContact]);
    const { onDestroyCallback: destroyBullet } = initContactWithStream(
      bulletContact,
      bulletAgentConnectionId,
      sharedStream
    );

    audioTrack.enabled = true;
    destroyBullet();

    expect(audioTrack.enabled).toBe(true);
  });

  it('handles a stream with no audio tracks gracefully', () => {
    const emptyStream = { getAudioTracks: () => [], id: 'empty-stream' };
    const { onDestroyCallback: destroyContact } = initContactWithStream(
      testContact,
      testAgentConnectionId,
      emptyStream
    );

    expect(() => destroyContact()).not.toThrow();
  });

  it('broadcasts MUTE_TOGGLE exactly once per deleteLocalMediaStream call', () => {
    const { onDestroyCallback: destroyContact } = initContactWithStream(
      testContact,
      testAgentConnectionId,
      sharedStream
    );

    audioTrack.enabled = false;
    upstream.sendUpstream.mockClear();
    destroyContact();

    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) => payload && payload.event === connect.AgentEvents.MUTE_TOGGLE
    );
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0][1].data.muted).toBe(false);
  });
});

describe('SoftphoneManager.replaceMediaStreamInRTCSession - error branches', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let testContact;
  const testAgentConnectionId = 'replace-error-conn';

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn();
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    testContact = makeContact('replace-error-contact', { contactType: connect.ContactType.VOICE });
    testContact.getAgentConnection.mockReturnValue(makeAgentConnection(testAgentConnectionId));
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('logs and recovers when the input mediaStream is invalid (no audio tracks)', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    await expect(sm.replaceMediaStreamInRTCSession({ getAudioTracks: () => [] })).resolves.not.toThrow();
    await expect(sm.replaceMediaStreamInRTCSession(null)).resolves.not.toThrow();
  });

  it('skips a session whose _pc has no senders and continues with the rest', async () => {
    const goodSender = { replaceTrack: jest.fn().mockResolvedValue() };
    const sessionGood = {
      _pc: { getSenders: () => [goodSender] },
      _isUserProvidedStream: false,
    };
    const sessionNoSender = {
      _pc: { getSenders: () => [] },
      _isUserProvidedStream: false,
    };

    pcmCreateSession.mockReturnValueOnce(sessionGood).mockReturnValueOnce(sessionNoSender);

    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    // Prevent the internal replaceAudioTracks flow from triggering replaceTrack during onLocalStreamAdded
    jest.spyOn(sm, 'replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia').mockResolvedValue();
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});

    sm.startSession(testContact, testAgentConnectionId);
    sm.getSession(testAgentConnectionId).onLocalStreamAdded(sessionGood, {
      getAudioTracks: () => [{ kind: 'audio' }],
    });

    const otherContact = makeContact('replace-error-other', { contactType: connect.ContactType.VOICE });
    otherContact.getAgentConnection.mockReturnValue(makeAgentConnection('replace-error-other-conn'));
    otherContact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    connect.Agent.prototype.getContacts.mockReturnValue([testContact, otherContact]);
    sm.startSession(otherContact, 'replace-error-other-conn');
    sm.getSession('replace-error-other-conn').onLocalStreamAdded(sessionNoSender, {
      getAudioTracks: () => [{ kind: 'audio' }],
    });

    // Now restore replaceMediaStreamInRTCSession to use the real implementation
    sm.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia.mockRestore();
    goodSender.replaceTrack.mockClear();

    const newStream = {
      getAudioTracks: () => [{ kind: 'audio', getSettings: () => ({}) }],
      id: 'new',
    };
    await sm.replaceMediaStreamInRTCSession(newStream);

    expect(goodSender.replaceTrack).toHaveBeenCalledTimes(1);
  });
});

describe('SoftphoneManager.replaceLocalMediaTrack', () => {
  let bus;
  let pcmCreateSession;
  let pcmConnect;
  let contact;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    contact = makeContact('replace-track-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('replace-track-conn'));
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('skips replacement when the new track === existing track (identity)', () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'replace-track-conn');
    const session = sm.getSession('replace-track-conn');

    const sameTrack = { kind: 'audio', enabled: true, id: 'same' };
    const stream = {
      getAudioTracks: () => [sameTrack],
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    };
    session.onLocalStreamAdded(session, stream);

    sm.replaceLocalMediaTrack('replace-track-conn', sameTrack);
    expect(stream.removeTrack).not.toHaveBeenCalled();
    expect(stream.addTrack).not.toHaveBeenCalled();
  });

  it('calls oldTrack.stop() when softphoneParams.VDIPlatform is AWS_WORKSPACE', () => {
    jest.spyOn(connect, 'DCVWebRTCStrategy').mockImplementation(function () {
      this.getStrategyName = () => 'DCVStrategy';
    });
    const sm = new connect.SoftphoneManager({ VDIPlatform: VDI_PLATFORMS.AWS_WORKSPACE });
    connect.core.softphoneManager = sm;
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'replace-track-conn');
    const session = sm.getSession('replace-track-conn');

    const oldTrack = { kind: 'audio', enabled: true, id: 'old', stop: jest.fn() };
    const stream = {
      getAudioTracks: () => [oldTrack],
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    };
    session.onLocalStreamAdded(session, stream);

    const newTrack = { kind: 'audio', enabled: false, id: 'new' };
    sm.replaceLocalMediaTrack('replace-track-conn', newTrack);

    expect(stream.removeTrack).toHaveBeenCalledWith(oldTrack);
    expect(stream.addTrack).toHaveBeenCalledWith(newTrack);
    expect(oldTrack.stop).toHaveBeenCalled();
  });
});

describe('SoftphoneManager.setSpeakerDevice - rejection logs error', () => {
  let bus;
  let upstream;
  let setSinkIdSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    setSinkIdSpy = jest.fn().mockRejectedValue(new Error('rejected sink'));
    jest.spyOn(document, 'getElementById').mockReturnValue({ setSinkId: setSinkIdSpy });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('rejection path does not broadcast SPEAKER_DEVICE_CHANGED', async () => {
    new connect.SoftphoneManager();
    upstream.sendUpstream.mockClear();
    bus.trigger(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, { deviceId: 'dev-rej' });
    await jest.advanceTimersByTimeAsync(0);

    expect(setSinkIdSpy).toHaveBeenCalledWith('dev-rej');
    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) =>
        payload && payload.event === connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED
    );
    expect(broadcasts).toHaveLength(0);
  });
});

describe('SoftphoneManager.setMicrophoneDevice - rejection branch', () => {
  let bus;
  let upstream;
  let pcmCreateSession;
  let pcmConnect;
  let contact;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
    contact = makeContact('mic-reject-contact', { contactType: connect.ContactType.VOICE });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('does not broadcast MICROPHONE_DEVICE_CHANGED when getUserMedia rejects', async () => {
    const sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;
    jest.spyOn(sm, 'replaceLocalMediaTrack').mockImplementation(() => {});
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    sm.startSession(contact, 'mic-reject-conn');
    const session = sm.getSession('mic-reject-conn');
    session.onLocalStreamAdded(session, { getAudioTracks: () => [{ kind: 'audio' }], removeTrack: jest.fn(), addTrack: jest.fn() });
    await jest.advanceTimersByTimeAsync(0);

    navigator.mediaDevices.getUserMedia.mockClear();
    navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('mic boom'));
    upstream.sendUpstream.mockClear();
    bus.trigger(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, { deviceId: 'dev-mic-rej' });
    await jest.advanceTimersByTimeAsync(0);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    const broadcasts = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) =>
        payload && payload.event === connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED
    );
    expect(broadcasts).toHaveLength(0);
  });
});

describe('SoftphoneManager - onLocalStreamAdded voiceFocus error branch', () => {
  let bus;
  let upstream;
  let pcmCreateSession;
  let pcmConnect;

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus, upstream } = installCommonMocks());
    pcmConnect = jest.fn();
    pcmCreateSession = jest.fn().mockReturnValue({
      connect: jest.fn(),
      _pc: { getSenders: () => [{ replaceTrack: jest.fn().mockResolvedValue() }] },
    });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () {
      this.createSession = pcmCreateSession;
      this.connect = pcmConnect;
      this.getPeerConnection = jest.fn();
      this.close = jest.fn();
      this.handlePersistentPeerConnectionToggle = jest.fn();
    });
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  it('still broadcasts LOCAL_MEDIA_STREAM_CREATED when voice enhancement rejects', async () => {
    connect.core.voiceFocus.isEnabled = () => true;
    const contact = makeContact('vf-error-contact', { contactType: connect.ContactType.VOICE });
    contact.getAgentConnection.mockReturnValue(makeAgentConnection('vf-error-conn'));
    contact.getStatus.mockReturnValue({ type: connect.ContactStatusType.CONNECTING });
    const sm = new connect.SoftphoneManager();
    jest.spyOn(sm, 'replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia')
      .mockRejectedValue(new Error('vf rejected'));
    sm.startSession(contact, 'vf-error-conn');
    const session = sm.getSession('vf-error-conn');

    upstream.sendUpstream.mockClear();
    session.onLocalStreamAdded(session, { getAudioTracks: () => [{ kind: 'a' }], id: 's1' });
    await jest.advanceTimersByTimeAsync(0);

    const created = upstream.sendUpstream.mock.calls.filter(
      ([_e, payload]) =>
        payload && payload.event === connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED
    );
    expect(created.length).toBeGreaterThan(0);
  });
});
