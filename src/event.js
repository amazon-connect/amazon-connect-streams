/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  var ALL_EVENTS = '<<all>>';

  /**---------------------------------------------------------------
   * enum EventType
   */
  var EventType = connect.makeEnum([
    'acknowledge',
    'ack_timeout',
    'api_request',
    'api_response',
    'auth_fail',
    'access_denied',
    'close',
    'configure',
    'log',
    'master_request',
    'master_response',
    'synchronize',
    'terminate',
    'terminated',
    'send_logs',
    'reload_agent_configuration',
    'broadcast',
    'api_metric',
    'client_metric',
    'mute',
    "iframe_style"
  ]);

  /**---------------------------------------------------------------
   * enum MasterTopics
   */
  var MasterTopics = connect.makeNamespacedEnum('connect', [
    'loginPopup',
    'sendLogs',
    'softphone',
    'ringtone',
    'metrics'
  ]);

  /**---------------------------------------------------------------
   * enum AgentEvents
   */
  var AgentEvents = connect.makeNamespacedEnum('agent', [
    'init',
    'update',
    'refresh',
    'routable',
    'not_routable',
    'pending',
    'contact_pending',
    'offline',
    'error',
    'softphone_error',
    'websocket_connection_lost',
    'websocket_connection_gained',
    'state_change',
    'acw',
    'mute_toggle',
    'local_media_stream_created'
  ]);

  /**---------------------------------------------------------------
  * enum WebSocketEvents
  */
  var WebSocketEvents = connect.makeNamespacedEnum('webSocket', [
    'init_failure',
    'connection_open',
    'connection_close',
    'connection_error',
    'connection_gain',
    'connection_lost',
    'subscription_update',
    'subscription_failure',
    'all_message',
    'send',
    'subscribe'
  ]);

  /**---------------------------------------------------------------
    * enum ContactEvents
    */
  var ContactEvents = connect.makeNamespacedEnum('contact', [
    'init',
    'refresh',
    'destroyed',
    'incoming',
    'pending',
    'connecting',
    'connected',
    'missed',
    'acw',
    'view',
    'ended',
    'error',
    'accepted'
  ]);


  /**---------------------------------------------------------------
  * enum ConnnectionEvents
  */
  var ConnnectionEvents = connect.makeNamespacedEnum('connection', [
    'session_init'
  ]);

  /**---------------------------------------------------------------
   * class EventFactory
   */
  var EventFactory = function () { };
  EventFactory.createRequest = function (type, method, params) {
    return {
      event: type,
      requestId: connect.randomId(),
      method: method,
      params: params
    };
  };

  EventFactory.createResponse = function (type, request, data, err) {
    return {
      event: type,
      requestId: request.requestId,
      data: data,
      err: err || null
    };
  };

  /**
   * An object representing an event subscription in an EventBus.
   */
  var Subscription = function (subMap, eventName, f) {
    this.subMap = subMap;
    this.id = connect.randomId();
    this.eventName = eventName;
    this.f = f;
  };

  /**
   * Unsubscribe the handler of this subscription from the EventBus
   * from which it was created.
   */
  Subscription.prototype.unsubscribe = function () {
    this.subMap.unsubscribe(this.eventName, this.id);
  };

  /**
   * A map of event subscriptions, used by the EventBus.
   */
  var SubscriptionMap = function () {
    this.subIdMap = {};
    this.subEventNameMap = {};
  };

  /**
   * Add a subscription for the named event.  Creates a new Subscription
   * object and returns it.  This object can be used to unsubscribe.
   */
  SubscriptionMap.prototype.subscribe = function (eventName, f) {
    var sub = new Subscription(this, eventName, f);

    this.subIdMap[sub.id] = sub;
    var subList = this.subEventNameMap[eventName] || [];
    subList.push(sub);
    this.subEventNameMap[eventName] = subList;
    return sub;
  };

  /**
   * Unsubscribe a subscription matching the given event name and id.
   */
  SubscriptionMap.prototype.unsubscribe = function (eventName, subId) {
    if (connect.contains(this.subEventNameMap, eventName)) {
      this.subEventNameMap[eventName] = this.subEventNameMap[eventName].filter(function (s) { return s.id !== subId; });

      if (this.subEventNameMap[eventName].length < 1) {
        delete this.subEventNameMap[eventName];
      }
    }

    if (connect.contains(this.subIdMap, subId)) {
      delete this.subIdMap[subId];
    }
  };

  /**
   * Get a list of all subscriptions in the subscription map.
   */
  SubscriptionMap.prototype.getAllSubscriptions = function () {
    return connect.values(this.subEventNameMap).reduce(function (a, b) {
      return a.concat(b);
    }, []);
  };

  /**
   * Get a list of subscriptions for the given event name, or an empty
   * list if there are no subscriptions.
   */
  SubscriptionMap.prototype.getSubscriptions = function (eventName) {
    return this.subEventNameMap[eventName] || [];
  };

  /**
   * An object which maintains a map of subscriptions and serves as the
   * mechanism for triggering events to be handled by subscribers.
   */
  var EventBus = function (paramsIn) {
    var params = paramsIn || {};

    this.subMap = new SubscriptionMap();
    this.logEvents = params.logEvents || false;
  };

  /**
   * Subscribe to the named event.  Returns a new Subscription object
   * which can be used to unsubscribe.
   */
  EventBus.prototype.subscribe = function (eventName, f) {
    connect.assertNotNull(eventName, 'eventName');
    connect.assertNotNull(f, 'f');
    connect.assertTrue(connect.isFunction(f), 'f must be a function');
    return this.subMap.subscribe(eventName, f);
  };

  /**
   * Subscribe a function to be called on all events.
   */
  EventBus.prototype.subscribeAll = function (f) {
    connect.assertNotNull(f, 'f');
    connect.assertTrue(connect.isFunction(f), 'f must be a function');
    return this.subMap.subscribe(ALL_EVENTS, f);
  };

  /**
   * Get a list of subscriptions for the given event name, or an empty
   * list if there are no subscriptions.
   */
  EventBus.prototype.getSubscriptions = function (eventName) {
    return this.subMap.getSubscriptions(eventName);
  };

  /**
   * Trigger the given event with the given data.  All methods subscribed
   * to this event will be called and are provided with the given arbitrary
   * data object and the name of the event, in that order.
   */
  EventBus.prototype.trigger = function (eventName, data) {
    connect.assertNotNull(eventName, 'eventName');
    var self = this;
    var allEventSubs = this.subMap.getSubscriptions(ALL_EVENTS);
    var eventSubs = this.subMap.getSubscriptions(eventName);

    if (this.logEvents && (eventName !== connect.EventType.LOG && eventName !== connect.EventType.MASTER_RESPONSE && eventName !== connect.EventType.API_METRIC)) {
      connect.getLog().trace("Publishing event: %s", eventName);
    }
    allEventSubs.concat(eventSubs).forEach(function (sub) {
      try {
        sub.f(data || null, eventName, self);
      } catch (e) {
        connect.getLog().error("'%s' event handler failed.", eventName).withException(e);
      }
    });
  };

  /**
   * Returns a closure which bridges an event from another EventBus to this bus.
   *
   * Usage:
   * conduit.onUpstream("MyEvent", bus.bridge());
   */
  EventBus.prototype.bridge = function () {
    var self = this;
    return function (data, event) {
      self.trigger(event, data);
    };
  };

  /**
   * Unsubscribe all events in the event bus.
   */
  EventBus.prototype.unsubscribeAll = function () {
    this.subMap.getAllSubscriptions().forEach(function (sub) {
      sub.unsubscribe();
    });
  };

  connect.EventBus = EventBus;
  connect.EventFactory = EventFactory;
  connect.EventType = EventType;
  connect.AgentEvents = AgentEvents;
  connect.ConnnectionEvents = ConnnectionEvents;
  connect.ContactEvents = ContactEvents;
  connect.WebSocketEvents = WebSocketEvents;
  connect.MasterTopics = MasterTopics;
})();
