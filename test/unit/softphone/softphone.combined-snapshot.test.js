// Real AgentDataProvider driving a real SoftphoneManager: a single snapshot that both
// removes the previous voice contact and adds the next one (back-to-back calls).

const {
  installCommonMocks,
  commonAfterEach,
} = require('./softphone-test-helpers');

const voiceContact = (contactId, connectionId, stateType) => ({
  contactId,
  type: connect.ContactType.VOICE,
  state: { type: stateType },
  connections: [
    {
      connectionId,
      type: 'agent',
      state: { type: stateType },
      softphoneMediaInfo: { callConfigJson: '{}', callContextToken: 'token', autoAccept: false },
      endpoint: { type: 'agent' },
    },
    {
      connectionId: `${connectionId}-customer`,
      type: 'inbound',
      state: { type: connect.ContactStateType.CONNECTED },
      softphoneMediaInfo: null,
      endpoint: { type: 'phone_number' },
    },
  ],
});

const agentData = (contacts) => ({
  configuration: {
    softphoneEnabled: true,
    softphonePersistentConnection: true,
    routingProfile: { channelConcurrencyMap: { VOICE: 1 } },
    afterContactWorkConfigurations: [{ channel: 'VOICE', afterContactWorkMode: 'OFF' }],
  },
  snapshot: {
    state: { type: 'routable', name: 'Available' },
    contacts,
  },
});

describe('SoftphoneManager with a snapshot that drops the previous call and offers the next', () => {
  let bus;
  let sm;
  let pcm;

  const deliver = (contacts) => bus.trigger(connect.AgentEvents.UPDATE, agentData(contacts));
  const multiSessionHangUps = () => connect.publishMetric.mock.calls
    .filter(([m]) => m && m.name === 'MultiSessionHangUp').length;
  const createSessionCallFor = (contactId) => pcm.createSession.mock.calls.findIndex(([id]) => id === contactId);

  beforeEach(() => {
    jest.useFakeTimers();
    ({ bus } = installCommonMocks());
    connect.Agent.prototype.getContacts.mockRestore();
    connect.core.endedEventTracker = new Set();
    connect.core.mediaFactory = { get: jest.fn().mockResolvedValue() };
    jest.spyOn(connect.VoiceConnection.prototype, 'onParticipantResume').mockReturnValue({ unsubscribe: jest.fn() });
    pcm = {
      createSession: jest.fn(() => ({ connect: jest.fn(), _pc: { getSenders: () => [] } })),
      hangup: jest.fn(),
      close: jest.fn(),
      handlePersistentPeerConnectionToggle: jest.fn(),
    };
    connect.RtcPeerConnectionManager.mockImplementation(function () { Object.assign(this, pcm); });
    connect.RtcPeerConnectionManagerV2.mockImplementation(function () { Object.assign(this, pcm); });
    connect.core.agentDataProvider = new connect.core.AgentDataProvider(bus);
    jest.spyOn(connect.SoftphoneManager, 'publishMultipleSessionsEvent').mockImplementation((name) => {
      connect.publishMetric({ name });
    });

    deliver([]);
    sm = new connect.SoftphoneManager();
    connect.core.softphoneManager = sm;

    deliver([voiceContact('contact-A', 'conn-A', connect.ContactStateType.CONNECTING)]);
    expect(sm.getSession('conn-A')).toBeDefined();
  });

  afterEach(() => {
    commonAfterEach();
    jest.useRealTimers();
  });

  describe('previous call connected', () => {
    beforeEach(() => {
      deliver([voiceContact('contact-A', 'conn-A', connect.ContactStateType.CONNECTED)]);
    });

    it('starts a session for the next call when the removal and the offer arrive in one snapshot', () => {
      deliver([voiceContact('contact-B', 'conn-B', connect.ContactStateType.CONNECTING)]);

      expect(sm.getSession('conn-A')).toBeUndefined();
      expect(sm.getSession('conn-B')).toBeDefined();
      expect(multiSessionHangUps()).toBe(0);
    });

    it('hangs up the previous session before creating the next one', () => {
      deliver([voiceContact('contact-B', 'conn-B', connect.ContactStateType.CONNECTING)]);

      const hangupA = pcm.hangup.mock.calls.findIndex(([conn]) => conn === 'conn-A');
      expect(hangupA).toBeGreaterThan(-1);
      expect(pcm.hangup.mock.invocationCallOrder[hangupA])
        .toBeLessThan(pcm.createSession.mock.invocationCallOrder[createSessionCallFor('contact-B')]);
    });

    it('starts a session for the next call when the removal and the offer arrive in separate snapshots', () => {
      deliver([]);
      deliver([voiceContact('contact-B', 'conn-B', connect.ContactStateType.CONNECTING)]);

      expect(sm.getSession('conn-A')).toBeUndefined();
      expect(sm.getSession('conn-B')).toBeDefined();
      expect(multiSessionHangUps()).toBe(0);
    });

    it('keeps the active call when a second call is offered on top of it', () => {
      deliver([
        voiceContact('contact-A', 'conn-A', connect.ContactStateType.CONNECTED),
        voiceContact('contact-B', 'conn-B', connect.ContactStateType.CONNECTING),
      ]);

      expect(sm.getSession('conn-A')).toBeDefined();
      expect(sm.getSession('conn-B')).toBeDefined();
      expect(multiSessionHangUps()).toBe(0);
    });
  });

  it('starts a session for the next call when a call that never connected is removed in the same snapshot', () => {
    deliver([voiceContact('contact-B', 'conn-B', connect.ContactStateType.CONNECTING)]);

    expect(sm.getSession('conn-A')).toBeUndefined();
    expect(sm.getSession('conn-B')).toBeDefined();
    expect(multiSessionHangUps()).toBe(0);
  });
});
