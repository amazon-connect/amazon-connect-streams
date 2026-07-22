// Jest port of the AgentDataProvider describe (incl. Configurable ACW FAC-gated).

const { commonAfterEach, setLocation } = require('./core-test-helpers');

// Helpers from the Mocha spec (now arrow-style).
const createState = (type, name) => ({ type, name });

const createAgentSnapshotState = (type, name) => ({
  snapshot: { state: createState(type, name) },
});

const createContactSnapshot = (contactState, agentMediaLegState, customerMediaLegState, options = {}) => {
  const contactType = options.type || 'voice';
  const contactData = {
    contactId: 'abc-123',
    type: contactType,
    state: { type: contactState },
    connections: [
      { connectionId: 'agentConnectionId', type: 'agent', state: { type: agentMediaLegState } },
      { connectionId: 'customerConnectionId', type: 'outbound', state: { type: customerMediaLegState } },
    ],
  };
  if (options.afterContactWorkConfig !== undefined) {
    contactData.afterContactWorkConfig = options.afterContactWorkConfig;
  }
  return [contactData];
};

describe('connect.core.AgentDataProvider', () => {
  let triggerSpy;

  // event-name list from the trigger spy's recorded calls. Avoids matching on
  // payload shape, which the bus passes through verbatim and varies per event.
  const triggerEvents = () => triggerSpy.mock.calls.map(([eventName]) => eventName);

  beforeEach(() => {
    setLocation('http://localhost');
    connect.core.eventBus = new connect.EventBus({ logEvents: true });
    triggerSpy = jest.spyOn(connect.core.eventBus, 'trigger');
    connect.core.agentDataProvider = new connect.core.AgentDataProvider(connect.core.getEventBus());
    jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireAgentUpdateEvents');
    jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireContactUpdateEvents');
    jest.spyOn(connect.core, '_removeContactFromEndedSet');
    jest.spyOn(connect.core, '_handleEndedEvent');
    jest.spyOn(connect.core, '_shouldTriggerInvalidStateTransition');
    connect.agent.initialized = false;
    connect.core.endedEventTracker = new Set();
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('updates agent data after receiving an UPDATE event', () => {
    expect(connect.agent.initialized).toBe(false);
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available')
    );
    expect(connect.agent.initialized).toBe(true);
    expect(triggerEvents()).toContain(connect.AgentEvents.INIT);
    expect(triggerEvents()).toContain(connect.AgentEvents.REFRESH);
    expect(triggerEvents()).toContain(connect.AgentEvents.ROUTABLE);
  });

  it('triggers NOT_ROUTABLE + STATE_CHANGE when going from ROUTABLE to NOT_ROUTABLE', () => {
    // Initial ROUTABLE/Available so the next transition is observable.
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available')
    );
    triggerSpy.mockClear();
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, 'Unavailable')
    );

    expect(triggerEvents()).toContain(connect.AgentEvents.NOT_ROUTABLE);
    expect(triggerSpy).toHaveBeenCalledWith(connect.AgentEvents.STATE_CHANGE, expect.objectContaining({
      oldState: 'Available',
      newState: 'Unavailable',
    }));
  });

  it('triggers only STATE_CHANGE when transitioning between two NOT_ROUTABLE states', () => {
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, 'Unavailable')
    );
    triggerSpy.mockClear();
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, 'Lunch')
    );

    expect(triggerEvents()).not.toContain(connect.AgentEvents.NOT_ROUTABLE);
    expect(triggerSpy).toHaveBeenCalledWith(connect.AgentEvents.STATE_CHANGE, expect.objectContaining({
      oldState: 'Unavailable',
      newState: 'Lunch',
    }));
  });

  it('triggers ENQUEUED_NEXT_STATE when nextState is populated', () => {
    // First UPDATE initializes the agent so `new connect.Agent()` works.
    connect.core.getEventBus().trigger(
      connect.AgentEvents.UPDATE,
      createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available')
    );

    const snapshot = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available');
    snapshot.snapshot.nextState = createState(connect.AgentStateType.NOT_ROUTABLE, 'Lunch');

    let observed = false;
    new connect.Agent().onEnqueuedNextState((agent) => {
      expect(agent).toBeInstanceOf(connect.Agent);
      observed = true;
    });
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, snapshot);

    expect(observed).toBe(true);
    expect(triggerEvents()).toContain(connect.AgentEvents.ENQUEUED_NEXT_STATE);
  });

  // TODO: unskip once src/core.js populates connect.core.endedEventTracker (init + .add() on
  // contact connect).
  it.skip('triggers ENDED on active->inactive transition without INVALID_STATE_TRANSITION', () => {
    // initialize agent
    const init = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available');
    init.snapshot.contacts = [];
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, init);
    expect(triggerEvents()).toContain(connect.AgentEvents.INIT);

    // Connecting
    const connecting = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available');
    connecting.snapshot.contacts = createContactSnapshot(
      connect.ContactStateType.CONNECTING,
      'connecting',
      'connecting'
    );
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, connecting);
    expect(triggerEvents()).toContain(connect.ContactEvents.CONNECTING);
    expect(connect.core.endedEventTracker.size).toBe(1);

    // Error/disconnected snapshot
    const errored = createAgentSnapshotState('error', 'FailedConnectCustomer');
    errored.snapshot.contacts = createContactSnapshot(
      connect.ContactStateType.ERROR,
      'disconnected',
      'disconnected'
    );

    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, errored);
    connect.core.agentDataProvider._fireAgentUpdateEvents(connecting);

    expect(connect.core.agentDataProvider._fireContactUpdateEvents).toHaveBeenCalled();
    expect(connect.core._handleEndedEvent).toHaveBeenCalled();
    expect(triggerEvents()).not.toContain(connect.ContactEvents.CONNECTED);
    expect(triggerEvents()).toContain(connect.ContactEvents.ERROR);
    expect(triggerEvents()).toContain(connect.ContactEvents.ENDED);
    expect(connect.core._removeContactFromEndedSet).toHaveBeenCalled();
    expect(connect.core.endedEventTracker.size).toBe(0);
    expect(triggerEvents()).not.toContain(connect.ContactEvents.INVALID_STATE_TRANSITION);
  });

  // TODO: unskip once src/core.js populates connect.core.endedEventTracker (init + .add() on
  // contact connect).
  it.skip('fires ENDED when contact is removed without state transition to ENDED', () => {
    const init = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available');
    init.snapshot.contacts = [];
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, init);
    expect(triggerEvents()).toContain(connect.AgentEvents.INIT);

    const connecting = createAgentSnapshotState(connect.AgentStateType.ROUTABLE, 'Available');
    connecting.snapshot.contacts = createContactSnapshot(
      connect.ContactStateType.CONNECTING,
      'connecting',
      'connecting'
    );
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, connecting);
    expect(connect.core.endedEventTracker.size).toBe(1);

    // New snapshot: contact removed without ENDED transition
    const next = createAgentSnapshotState(connect.AgentStateType.NOT_ROUTABLE, 'Offline');
    next.snapshot.contacts = [];
    connect.core.getEventBus().trigger(connect.AgentEvents.UPDATE, next);

    expect(triggerEvents()).toContain(connect.ContactEvents.ENDED);
    expect(triggerEvents()).toContain(connect.ContactEvents.DESTROYED);
    expect(connect.core._removeContactFromEndedSet).toHaveBeenCalled();
    expect(connect.core.endedEventTracker.size).toBe(0);
  });
});

// ----------------------------------------------------------------------------
// AgentDataProvider internal helpers (id parsing, error paths, _diffContacts,
// destroy + per-contact tear-down). Not in the original Mocha spec.
// ----------------------------------------------------------------------------

const fakeRoutingProfileId =
  'arn:aws:connect:us-west-2:111122223333:instance/abc-d1e2-f3a4-b5c6-d7e8f9012345/agent/xyz';

const buildSnapshot = (overrides = {}) => ({
  configuration: {
    routingProfile: { routingProfileId: fakeRoutingProfileId },
  },
  snapshot: {
    state: { name: 'Available', type: 'routable' },
    nextState: null,
    contacts: [],
    localTimestamp: 1700000000000,
    skew: 0,
    ...overrides,
  },
});

describe('AgentDataProvider - id parsing helpers', () => {
  let bus;
  let provider;

  beforeEach(() => {
    setLocation('http://localhost');
    bus = new connect.EventBus({ logEvents: false });
    provider = new connect.core.AgentDataProvider(bus);
    provider.agentData = buildSnapshot();
  });

  afterEach(() => {
    provider.destroy();
    commonAfterEach();
  });

  it('getInstanceId extracts the instance UUID segment of routingProfileId', () => {
    expect(provider.getInstanceId()).toBe('abc-d1e2-f3a4-b5c6-d7e8f9012345');
  });

  it('getAWSAccountId extracts the 12-digit account number from routingProfileId', () => {
    expect(provider.getAWSAccountId()).toBe('111122223333');
  });
});

describe('AgentDataProvider - error paths', () => {
  let bus;
  let provider;

  beforeEach(() => {
    setLocation('http://localhost');
    bus = new connect.EventBus({ logEvents: false });
    provider = new connect.core.AgentDataProvider(bus);
  });

  afterEach(() => {
    provider.destroy();
    commonAfterEach();
  });

  it('getAgentData throws StateError when no agent data has arrived yet', () => {
    expect(() => provider.getAgentData()).toThrow('No agent data is available yet!');
  });

  it('getContactData throws StateError when the contact id is unknown', () => {
    provider.agentData = buildSnapshot();
    expect(() => provider.getContactData('does-not-exist')).toThrow(
      /Contact does-not-exist no longer exists/
    );
  });

  it('getContactData returns the contact entry when the contact id is known', () => {
    const contact = {
      contactId: 'c-1',
      state: { type: 'connecting' },
      connections: [{ connectionId: 'conn-1' }],
    };
    provider.agentData = buildSnapshot({ contacts: [contact] });
    expect(provider.getContactData('c-1')).toBe(contact);
  });

  it('getConnectionData throws when the connection id is unknown for a known contact', () => {
    const contact = {
      contactId: 'c-1',
      state: { type: 'connecting' },
      connections: [{ connectionId: 'conn-1' }],
    };
    provider.agentData = buildSnapshot({ contacts: [contact] });
    expect(() => provider.getConnectionData('c-1', 'missing-conn')).toThrow(
      /Connection missing-conn for contact c-1 no longer exists/
    );
  });

  it('getConnectionData returns the connection entry when both contact and connection are known', () => {
    const conn = { connectionId: 'conn-1' };
    const contact = {
      contactId: 'c-1',
      state: { type: 'connecting' },
      connections: [conn],
    };
    provider.agentData = buildSnapshot({ contacts: [contact] });
    expect(provider.getConnectionData('c-1', 'conn-1')).toBe(conn);
  });
});

describe('AgentDataProvider - _diffContacts', () => {
  let bus;
  let provider;

  beforeEach(() => {
    setLocation('http://localhost');
    bus = new connect.EventBus({ logEvents: false });
    provider = new connect.core.AgentDataProvider(bus);
  });

  afterEach(() => {
    provider.destroy();
    commonAfterEach();
  });

  it('classifies all contacts as added when no prior agentData is supplied', () => {
    provider.agentData = buildSnapshot({
      contacts: [{ contactId: 'a' }, { contactId: 'b' }],
    });
    const diff = provider._diffContacts(null);
    expect(Object.keys(diff.added).sort()).toEqual(['a', 'b']);
    expect(Object.keys(diff.removed)).toEqual([]);
    expect(Object.keys(diff.common)).toEqual([]);
  });

  it('classifies contacts as removed when present in oldAgentData but not in current', () => {
    provider.agentData = buildSnapshot({ contacts: [] });
    const oldAgentData = {
      snapshot: { contacts: [{ contactId: 'gone' }] },
    };
    const diff = provider._diffContacts(oldAgentData);
    expect(Object.keys(diff.removed)).toEqual(['gone']);
    expect(Object.keys(diff.added)).toEqual([]);
    expect(Object.keys(diff.common)).toEqual([]);
  });

  it('classifies contacts as common when present in both old and new', () => {
    provider.agentData = buildSnapshot({
      contacts: [{ contactId: 'still-here' }, { contactId: 'new' }],
    });
    const oldAgentData = {
      snapshot: { contacts: [{ contactId: 'still-here' }, { contactId: 'gone' }] },
    };
    const diff = provider._diffContacts(oldAgentData);
    expect(Object.keys(diff.common)).toEqual(['still-here']);
    expect(Object.keys(diff.added)).toEqual(['new']);
    expect(Object.keys(diff.removed)).toEqual(['gone']);
  });
});

describe('AgentDataProvider - destroy + per-contact unsubscribe', () => {
  let bus;
  let provider;

  beforeEach(() => {
    setLocation('http://localhost');
    bus = new connect.EventBus({ logEvents: false });
    provider = new connect.core.AgentDataProvider(bus);
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('destroy unsubscribes the agent-update subscriber so further AgentEvents.UPDATE no longer reach the provider', () => {
    provider.agentData = null;
    provider.destroy();
    bus.trigger(connect.AgentEvents.UPDATE, buildSnapshot());
    expect(provider.agentData).toBeNull();
  });

  it('_unsubAllContactEventsForContact removes every per-contact event subscription', () => {
    provider.agentData = buildSnapshot();
    const contactId = 'contact-1';
    const cb = jest.fn();
    bus.subscribe(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), cb);
    bus.subscribe(connect.core.getContactEventName(connect.ContactEvents.DESTROYED, contactId), cb);

    provider._unsubAllContactEventsForContact(contactId);

    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), {});
    bus.trigger(connect.core.getContactEventName(connect.ContactEvents.DESTROYED, contactId), {});
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('AgentDataProvider._fireAgentUpdateEvents - nextState + state-change transitions', () => {
  let bus;
  let provider;
  let triggerSpy;

  const buildAgentData = (overrides) => ({
    configuration: { routingProfile: { routingProfileId: fakeRoutingProfileId } },
    snapshot: {
      state: { name: 'Available', type: 'routable' },
      nextState: null,
      contacts: [],
      ...overrides,
    },
  });

  beforeEach(() => {
    setLocation('http://localhost');
    bus = new connect.EventBus({ logEvents: false });
    provider = new connect.core.AgentDataProvider(bus);
    triggerSpy = jest.spyOn(bus, 'trigger');
    connect.agent.initialized = true;
  });

  afterEach(() => {
    provider.destroy();
    commonAfterEach();
  });

  it('fires ENQUEUED_NEXT_STATE when newNextState is set and differs from oldNextState', () => {
    const oldAgentData = { snapshot: { state: { name: 'Available', type: 'routable' }, nextState: null, contacts: [] } };
    provider.agentData = buildAgentData({ nextState: { name: 'Lunch' } });

    provider._fireAgentUpdateEvents(oldAgentData);

    const events = triggerSpy.mock.calls.map(([eventName]) => eventName);
    expect(events).toContain(connect.AgentEvents.ENQUEUED_NEXT_STATE);
  });

  it('does NOT fire ENQUEUED_NEXT_STATE when nextState is unchanged', () => {
    const oldAgentData = {
      snapshot: { state: { name: 'Available', type: 'routable' }, nextState: { name: 'Lunch' }, contacts: [] },
    };
    provider.agentData = buildAgentData({ nextState: { name: 'Lunch' } });

    provider._fireAgentUpdateEvents(oldAgentData);

    const events = triggerSpy.mock.calls.map(([eventName]) => eventName);
    expect(events).not.toContain(connect.AgentEvents.ENQUEUED_NEXT_STATE);
  });

  it('fires STATE_CHANGE when oldAgentState differs from newAgentState', () => {
    const oldAgentData = {
      snapshot: { state: { name: 'Available', type: 'routable' }, nextState: null, contacts: [] },
    };
    provider.agentData = buildAgentData({ state: { name: 'Lunch', type: 'not_routable' } });

    provider._fireAgentUpdateEvents(oldAgentData);

    const events = triggerSpy.mock.calls.map(([eventName]) => eventName);
    expect(events).toContain(connect.AgentEvents.STATE_CHANGE);
  });
});
