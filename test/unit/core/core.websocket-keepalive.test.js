// Jest port of WebSocketProvider and KeepaliveManager describes.

const {
  commonAfterEach,
  installCoreMocks,
  makeContainerDiv,
  setLocation,
} = require('./core-test-helpers');

describe('WebSocketProvider', () => {
  let provider;
  let onUpstreamSpy;
  let sendUpstreamSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    installCoreMocks();
    onUpstreamSpy = jest.fn();
    sendUpstreamSpy = jest.fn();
    jest.spyOn(document, 'createElement');
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(true);
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      onUpstream: onUpstreamSpy,
      sendUpstream: sendUpstreamSpy,
    });

    connect.core.initCCP(makeContainerDiv(), { ccpUrl: 'ccpURL' });
    provider = connect.core.webSocketProvider;
  });

  afterEach(() => {
    commonAfterEach();
  });

  describe('Initialization', () => {
    it('attaches onUpstream listeners for each WebSocket event', () => {
      const expectedEvents = [
        connect.WebSocketEvents.INIT_FAILURE,
        connect.WebSocketEvents.CONNECTION_OPEN,
        connect.WebSocketEvents.CONNECTION_CLOSE,
        connect.WebSocketEvents.CONNECTION_GAIN,
        connect.WebSocketEvents.CONNECTION_LOST,
        connect.WebSocketEvents.SUBSCRIPTION_UPDATE,
        connect.WebSocketEvents.SUBSCRIPTION_FAILURE,
        connect.WebSocketEvents.ALL_MESSAGE,
      ];
      const actualEvents = onUpstreamSpy.mock.calls.map((c) => c[0]);
      expectedEvents.forEach((evt) => {
        expect(actualEvents).toContain(evt);
      });
    });
  });

  const findHandler = (eventName) =>
    onUpstreamSpy.mock.calls.find((c) => c[0] === eventName)[1];

  describe('Event callbacks', () => {
    it('onInitFailure callback is invoked when INIT_FAILURE upstream event fires; unsubscribe stops it', () => {
      const cb = jest.fn();
      const unsub = provider.onInitFailure(cb);
      expect(typeof unsub).toBe('function');

      const handler = findHandler(connect.WebSocketEvents.INIT_FAILURE);
      handler();
      expect(cb).toHaveBeenCalledTimes(1);

      unsub();
      handler();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('onConnectionOpen callback is invoked when CONNECTION_OPEN fires; unsubscribe stops it', () => {
      const cb = jest.fn();
      const unsub = provider.onConnectionOpen(cb);
      const handler = findHandler(connect.WebSocketEvents.CONNECTION_OPEN);

      const fakeResponse = { foo: 'bar' };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);

      unsub();
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('onConnectionClose callback is invoked when CONNECTION_CLOSE fires', () => {
      const cb = jest.fn();
      provider.onConnectionClose(cb);
      const handler = findHandler(connect.WebSocketEvents.CONNECTION_CLOSE);

      const fakeResponse = { reason: 'TestingClose' };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);
    });

    it('onConnectionGain callback is invoked when CONNECTION_GAIN fires', () => {
      const cb = jest.fn();
      provider.onConnectionGain(cb);
      const handler = findHandler(connect.WebSocketEvents.CONNECTION_GAIN);

      handler();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('onConnectionLost callback is invoked when CONNECTION_LOST fires', () => {
      const cb = jest.fn();
      provider.onConnectionLost(cb);
      const handler = findHandler(connect.WebSocketEvents.CONNECTION_LOST);

      const fakeResponse = { error: 'NetworkDown' };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);
    });

    it('onSubscriptionUpdate callback is invoked when SUBSCRIPTION_UPDATE fires', () => {
      const cb = jest.fn();
      provider.onSubscriptionUpdate(cb);
      const handler = findHandler(connect.WebSocketEvents.SUBSCRIPTION_UPDATE);

      const fakeResponse = { subscription: 'upd' };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);
    });

    it('onSubscriptionFailure callback is invoked when SUBSCRIPTION_FAILURE fires', () => {
      const cb = jest.fn();
      provider.onSubscriptionFailure(cb);
      const handler = findHandler(connect.WebSocketEvents.SUBSCRIPTION_FAILURE);

      const fakeResponse = { subscription: 'fail', reason: 'Timeout' };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);
    });

    it('onAllMessage callback is invoked when ALL_MESSAGE fires', () => {
      const cb = jest.fn();
      provider.onAllMessage(cb);
      const handler = findHandler(connect.WebSocketEvents.ALL_MESSAGE);

      const fakeResponse = { topic: 'myTopic', data: 123 };
      handler(fakeResponse);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(fakeResponse);
    });

    it('onAllMessage also invokes topic callback if response.topic matches', () => {
      const allMsgCb = jest.fn();
      provider.onAllMessage(allMsgCb);
      const specificCb = jest.fn();
      provider.onMessage('myTopic', specificCb);
      const handler = findHandler(connect.WebSocketEvents.ALL_MESSAGE);

      handler({ topic: 'myTopic', data: 1234 });
      expect(allMsgCb).toHaveBeenCalledTimes(1);
      expect(specificCb).toHaveBeenCalledTimes(1);

      handler({ topic: 'someOtherTopic', data: 999 });
      expect(allMsgCb).toHaveBeenCalledTimes(2);
      expect(specificCb).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeTopics()', () => {
    it('calls sendUpstream with WebSocketEvents.SUBSCRIBE and the topics array', () => {
      const topics = ['Topic1', 'Topic2'];
      provider.subscribeTopics(topics);
      expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
      expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.WebSocketEvents.SUBSCRIBE, topics);
    });

    it('throws if topics is not an array', () => {
      expect(() => provider.subscribeTopics('notAnArray')).toThrow();
    });
  });

  describe('onMessage()', () => {
    it('adds a callback for the given topic without firing it immediately', () => {
      const cb = jest.fn();
      provider.onMessage('testTopic', cb);
      expect(cb).not.toHaveBeenCalled();
    });

    it('removes the callback when unsubscribed', () => {
      const cb = jest.fn();
      const unsub = provider.onMessage('testTopic', cb);
      unsub();
      const handler = findHandler(connect.WebSocketEvents.ALL_MESSAGE);
      handler({ topic: 'testTopic', data: {} });
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('onAllMessage()', () => {
    it('adds a callback for all messages', () => {
      const cb = jest.fn();
      provider.onAllMessage(cb);
      const handler = findHandler(connect.WebSocketEvents.ALL_MESSAGE);
      handler({ topic: 'randomTopic' });
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMessage()', () => {
    it('calls sendUpstream with WebSocketEvents.SEND and the given payload', () => {
      const payload = { some: 'payload' };
      provider.sendMessage(payload);
      expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
      expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.WebSocketEvents.SEND, payload);
    });
  });

  describe('onDeepHeartbeatSuccess()', () => {
    it('registers callback without firing it', () => {
      const cb = jest.fn();
      provider.onDeepHeartbeatSuccess(cb);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('onDeepHeartbeatFailure()', () => {
    it('registers callback without firing it', () => {
      const cb = jest.fn();
      provider.onDeepHeartbeatFailure(cb);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('onTopicFailure()', () => {
    it('registers callback without firing it', () => {
      const cb = jest.fn();
      provider.onTopicFailure(cb);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});

describe('KeepaliveManager', () => {
  let conduit;
  let eventBus;
  let keepaliveManager;
  let eventBusTriggerSpy;
  const synTimeout = 1000;
  const ackTimeout = 3000;

  beforeEach(() => {
    jest.useFakeTimers();

    eventBus = new connect.EventBus();
    eventBusTriggerSpy = jest.spyOn(eventBus, 'trigger');

    const subscription = { unsubscribe: jest.fn() };
    conduit = {
      name: 'test-conduit',
      sendUpstream: jest.fn(),
      onUpstream: jest.fn().mockReturnValue(subscription),
      isActive: jest.fn().mockReturnValue(true),
    };

    connect.core.upstream = conduit;
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue(conduit);

    keepaliveManager = new connect.KeepaliveManager(conduit, eventBus, synTimeout, ackTimeout);
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  describe('start()', () => {
    it('sends SYNCHRONIZE upstream when started', () => {
      keepaliveManager.start();
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
      expect(conduit.sendUpstream).toHaveBeenCalledWith(connect.EventType.SYNCHRONIZE);
    });

    it('when no ACK arrives, ackTimer fires _deferStart which re-runs start() after synTimeout, sending a second SYNCHRONIZE', () => {
      keepaliveManager.start();
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
      expect(conduit.sendUpstream).toHaveBeenNthCalledWith(1, connect.EventType.SYNCHRONIZE);

      // Advance past ackTimeout: ackTimer fires, schedules synTimer via _deferStart.
      jest.advanceTimersByTime(ackTimeout + 1);
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1); // still just the initial SYN

      // Advance past synTimeout: synTimer fires, invokes start() again → 2nd SYN.
      jest.advanceTimersByTime(synTimeout + 1);
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(2);
      expect(conduit.sendUpstream).toHaveBeenNthCalledWith(2, connect.EventType.SYNCHRONIZE);
      // Production KeepaliveManager never publishes on the event bus.
      expect(eventBusTriggerSpy).not.toHaveBeenCalled();
    });

    it('starts new SYN cycle after receiving ACK', () => {
      keepaliveManager.start();
      const ackHandler = conduit.onUpstream.mock.calls[0][1];
      ackHandler.call({ unsubscribe: jest.fn() });

      jest.advanceTimersByTime(synTimeout + 100);

      expect(conduit.sendUpstream).toHaveBeenCalledTimes(2);
      expect(conduit.sendUpstream).toHaveBeenNthCalledWith(2, connect.EventType.SYNCHRONIZE);
    });
  });

  describe('deferStart()', () => {
    it('starts new SYN cycle after synTimeout if not already started', () => {
      keepaliveManager.deferStart();
      jest.advanceTimersByTime(synTimeout + 100);

      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
      expect(conduit.sendUpstream).toHaveBeenCalledWith(connect.EventType.SYNCHRONIZE);
    });

    it('does not start new SYN cycle if already started', () => {
      keepaliveManager.synTimer = setTimeout(() => {}, 1000);
      keepaliveManager.deferStart();
      jest.advanceTimersByTime(synTimeout + 100);

      expect(conduit.sendUpstream).not.toHaveBeenCalled();
    });
  });

  describe('Multiple cycles', () => {
    it('maintains keepalive cycle through multiple SYN/ACK rounds', () => {
      keepaliveManager.start();
      const ackHandler = conduit.onUpstream.mock.calls[0][1];

      ackHandler.call({ unsubscribe: jest.fn() });
      jest.advanceTimersByTime(synTimeout + 100);

      ackHandler.call({ unsubscribe: jest.fn() });
      jest.advanceTimersByTime(synTimeout + 100);

      expect(conduit.sendUpstream).toHaveBeenCalledTimes(3);
      conduit.sendUpstream.mock.calls.forEach((call) => {
        expect(call[0]).toBe(connect.EventType.SYNCHRONIZE);
      });
    });
  });

  describe('start() idempotency', () => {
    it('does not throw on first start with null ackSub/ackTimer/synTimer', () => {
      expect(keepaliveManager.ackSub).toBeNull();
      expect(keepaliveManager.ackTimer).toBeNull();
      expect(keepaliveManager.synTimer).toBeNull();

      expect(() => keepaliveManager.start()).not.toThrow();
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
    });

    it('sends SYNCHRONIZE on each start() call', () => {
      keepaliveManager.start();
      keepaliveManager.start();

      expect(conduit.sendUpstream).toHaveBeenCalledTimes(2);
      expect(conduit.sendUpstream).toHaveBeenNthCalledWith(1, connect.EventType.SYNCHRONIZE);
      expect(conduit.sendUpstream).toHaveBeenNthCalledWith(2, connect.EventType.SYNCHRONIZE);
      conduit.sendUpstream.mock.calls.forEach((call) => {
        expect(call[0]).toBe(connect.EventType.SYNCHRONIZE);
      });
    });
  });

  describe('start() timeout and ACK callback paths', () => {
    it('ACK callback unsubscribes itself, clears ackTimer, and calls _deferStart', () => {
      keepaliveManager.start();
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);

      const ackHandler = conduit.onUpstream.mock.calls[0][1];
      const ackSubUnsubscribe = jest.fn();

      ackHandler.call({ unsubscribe: ackSubUnsubscribe });
      expect(ackSubUnsubscribe).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(synTimeout + 100);
      expect(conduit.sendUpstream).toHaveBeenCalledTimes(2);
      conduit.sendUpstream.mock.calls.forEach((call) => {
        expect(call[0]).toBe(connect.EventType.SYNCHRONIZE);
      });
    });
  });
});
