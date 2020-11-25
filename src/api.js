/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  /*----------------------------------------------------------------
   * enum AgentStateType
   */
  connect.AgentStateType = connect.makeEnum([
    'init',
    'routable',
    'not_routable',
    'offline'
  ]);
  connect.AgentStatusType = connect.AgentStateType;

  /**
   * enum AgentAvailStates
   */
  connect.AgentAvailStates = connect.makeEnum([
    'Init',
    'Busy',
    'AfterCallWork',
    'CallingCustomer',
    'Dialing',
    'Joining',
    'PendingAvailable',
    'PendingBusy'
  ]);

  /**
   * enum AgentErrorStates
   */
  connect.AgentErrorStates = connect.makeEnum([
    'Error',
    'AgentHungUp',
    'BadAddressAgent',
    'BadAddressCustomer',
    'Default',
    'FailedConnectAgent',
    'FailedConnectCustomer',
    'LineEngagedAgent',
    'LineEngagedCustomer',
    'MissedCallAgent',
    'MissedCallCustomer',
    'MultipleCcpWindows',
    'RealtimeCommunicationError'
  ]);

  /*----------------------------------------------------------------
   * enum AddressType
   */
  connect.EndpointType = connect.makeEnum([
    'phone_number',
    'agent',
    'queue'
  ]);
  connect.AddressType = connect.EndpointType;

  /*----------------------------------------------------------------
   * enum ConnectionType
   */
  connect.ConnectionType = connect.makeEnum([
    'agent',
    'inbound',
    'outbound',
    'monitoring'
  ]);

  /*----------------------------------------------------------------
   * enum ConnectionStateType
   */
  connect.ConnectionStateType = connect.makeEnum([
    'init',
    'connecting',
    'connected',
    'hold',
    'disconnected'
  ]);
  connect.ConnectionStatusType = connect.ConnectionStateType;

  connect.CONNECTION_ACTIVE_STATES = connect.set([
    connect.ConnectionStateType.CONNECTING,
    connect.ConnectionStateType.CONNECTED,
    connect.ConnectionStateType.HOLD
  ]);

  /*----------------------------------------------------------------
   * enum ContactStateType
   */
  connect.ContactStateType = connect.makeEnum([
    'init',
    'incoming',
    'pending',
    'connecting',
    'connected',
    'missed',
    'error',
    'ended'
  ]);
  connect.ContactStatusType = connect.ContactStateType;

  connect.CONTACT_ACTIVE_STATES = connect.makeEnum([
    'incoming',
    'pending',
    'connecting',
    'connected'
  ]);

  /*----------------------------------------------------------------
   * enum ContactType
   */
  connect.ContactType = connect.makeEnum([
    'voice',
    'queue_callback',
    'chat'
  ]);

  /*----------------------------------------------------------------
  * enum ChannelType
  */
  connect.ChannelType = connect.makeEnum([
    'VOICE',
    'CHAT'
  ]);

  /*----------------------------------------------------------------
  * enum MediaType
  */
  connect.MediaType = connect.makeEnum([
    'softphone',
    'chat'
  ]);

  /*----------------------------------------------------------------
   * enum SoftphoneCallType
   */
  connect.SoftphoneCallType = connect.makeEnum([
    'audio_video',
    'video_only',
    'audio_only',
    'none'
  ]);

  /*----------------------------------------------------------------
   * enum for SoftphoneErrorTypes
   */
  connect.SoftphoneErrorTypes = connect.makeEnum([
    'unsupported_browser',
    'microphone_not_shared',
    'signalling_handshake_failure',
    'signalling_connection_failure',
    'ice_collection_timeout',
    'user_busy_error',
    'webrtc_error',
    'realtime_communication_error',
    'other'
  ]);

  /*----------------------------------------------------------------
   * enum for CTI exceptions
   */
  connect.CTIExceptions = connect.makeEnum([
    "AccessDeniedException",
    "InvalidStateException",
    "BadEndpointException",
    "InvalidAgentARNException",
    "InvalidConfigurationException",
    "InvalidContactTypeException",
    "PaginationException",
    "RefreshTokenExpiredException",
    "SendDataFailedException",
    "UnauthorizedException"
  ]);
  /*----------------------------------------------------------------
   * class Agent
   */
  var Agent = function () {
    if (!connect.agent.initialized) {
      throw new connect.StateError("The agent is not yet initialized!");
    }
  };

  Agent.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getAgentData();
  };

  Agent.prototype._createContactAPI = function (contactData) {
    return new connect.Contact(contactData.contactId);
  };

  Agent.prototype.onContactPending = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.CONTACT_PENDING, f);
  };

  Agent.prototype.onRefresh = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.REFRESH, f);
  };

  Agent.prototype.onRoutable = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ROUTABLE, f);
  };

  Agent.prototype.onNotRoutable = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.NOT_ROUTABLE, f);
  };

  Agent.prototype.onOffline = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.OFFLINE, f);
  };

  Agent.prototype.onError = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ERROR, f);
  };

  Agent.prototype.onSoftphoneError = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.SOFTPHONE_ERROR, f);
  };

  Agent.prototype.onWebSocketConnectionLost = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.WEBSOCKET_CONNECTION_LOST, f);
  }

  Agent.prototype.onWebSocketConnectionGained = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.WEBSOCKET_CONNECTION_GAINED, f);
  }

  Agent.prototype.onAfterCallWork = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ACW, f);
  };

  Agent.prototype.onStateChange = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.STATE_CHANGE, f);
  };

  Agent.prototype.onMuteToggle = function (f) {
    connect.core.getUpstream().onUpstream(connect.AgentEvents.MUTE_TOGGLE, f);
  };

  Agent.prototype.mute = function () {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
      {
        event: connect.EventType.MUTE,
        data: { mute: true }
      });
  };

  Agent.prototype.unmute = function () {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
      {
        event: connect.EventType.MUTE,
        data: { mute: false }
      });
  };

  Agent.prototype.getState = function () {
    return this._getData().snapshot.state;
  };

  Agent.prototype.getAvailabilityState = function () {
    return this._getData().snapshot.agentAvailabilityState;
  };

  Agent.prototype.getStatus = Agent.prototype.getState;

  Agent.prototype.getStateDuration = function () {
    return connect.now() - this._getData().snapshot.state.startTimestamp.getTime() + connect.core.getSkew();
  };

  Agent.prototype.getStatusDuration = Agent.prototype.getStateDuration;

  Agent.prototype.getPermissions = function () {
    return this.getConfiguration().permissions;
  };

  Agent.prototype.getContacts = function (contactTypeFilter) {
    var self = this;
    return this._getData().snapshot.contacts.map(function (contactData) {
      return self._createContactAPI(contactData);
    }).filter(function (contact) {
      return (!contactTypeFilter) || contact.getType() === contactTypeFilter;
    });
  };

  Agent.prototype.getConfiguration = function () {
    return this._getData().configuration;
  };

  Agent.prototype.getAgentStates = function () {
    return this.getConfiguration().agentStates;
  };

  Agent.prototype.getRoutingProfile = function () {
    return this.getConfiguration().routingProfile;
  };

  Agent.prototype.getChannelConcurrency = function (channel) {
    var channelConcurrencyMap = this.getRoutingProfile().channelConcurrencyMap;
    if (!channelConcurrencyMap) {
      channelConcurrencyMap = Object.keys(connect.ChannelType).reduce(function (acc, key) {
        acc[connect.ChannelType[key]] = 1;
        return acc;
      }, {});
    }
    return channel
      ? (channelConcurrencyMap[channel] || 0)
      : channelConcurrencyMap;
  };

  Agent.prototype.getName = function () {
    return this.getConfiguration().name;
  };

  Agent.prototype.getExtension = function () {
    return this.getConfiguration().extension;
  };

  Agent.prototype.getDialableCountries = function () {
    return this.getConfiguration().dialableCountries;
  };

  Agent.prototype.isSoftphoneEnabled = function () {
    return this.getConfiguration().softphoneEnabled;
  };

  Agent.prototype.setConfiguration = function (configuration, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION, {
      configuration: connect.assertNotNull(configuration, 'configuration')
    }, {
        success: function (data) {
          // We need to ask the shared worker to reload agent config
          // once we change it so every tab has accurate config.
          var conduit = connect.core.getUpstream();
          conduit.sendUpstream(connect.EventType.RELOAD_AGENT_CONFIGURATION);

          if (callbacks.success) {
            callbacks.success(data);
          }
        },
        failure: callbacks && callbacks.failure
      });
  };

  Agent.prototype.setState = function (state, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.PUT_AGENT_STATE, {
      state: connect.assertNotNull(state, 'state')
    }, callbacks);
  };

  Agent.prototype.setStatus = Agent.prototype.setState;

  Agent.prototype.connect = function (endpointIn, params) {
    var client = connect.core.getClient();
    var endpoint = new connect.Endpoint(endpointIn);
    // Have to remove the endpointId field or AWS JS SDK gets mad.
    delete endpoint.endpointId;

    client.call(connect.ClientMethods.CREATE_OUTBOUND_CONTACT, {
      endpoint: connect.assertNotNull(endpoint, 'endpoint'),
      queueARN: (params && (params.queueARN || params.queueId)) || this.getRoutingProfile().defaultOutboundQueue.queueARN
    }, params && {
        success: params.success,
        failure: params.failure
      });
  };

  Agent.prototype.getAllQueueARNs = function () {
    return this.getConfiguration().routingProfile.queues.map(function (queue) {
      return queue.queueARN;
    });
  };

  Agent.prototype.getEndpoints = function (queueARNs, callbacks, pageInfoIn) {
    var self = this;
    var client = connect.core.getClient();
    connect.assertNotNull(callbacks, "callbacks");
    connect.assertNotNull(callbacks.success, "callbacks.success");
    var pageInfo = pageInfoIn || { };

    pageInfo.endpoints = pageInfo.endpoints || [];
    pageInfo.maxResults = pageInfo.maxResults || connect.DEFAULT_BATCH_SIZE;

    // Backwards compatibility allowing a single queueARN to be specified
    // instead of an array.
    if (!connect.isArray(queueARNs)) {
      queueARNs = [queueARNs];
    }

    client.call(connect.ClientMethods.GET_ENDPOINTS, {
      queueARNs: queueARNs,
      nextToken: pageInfo.nextToken || null,
      maxResults: pageInfo.maxResults
    }, {
        success: function (data) {
          if (data.nextToken) {
            self.getEndpoints(queueARNs, callbacks, {
              nextToken: data.nextToken,
              maxResults: pageInfo.maxResults,
              endpoints: pageInfo.endpoints.concat(data.endpoints)
            });
          } else {
            pageInfo.endpoints = pageInfo.endpoints.concat(data.endpoints);
            var endpoints = pageInfo.endpoints.map(function (endpoint) {
              return new connect.Endpoint(endpoint);
            });

            callbacks.success({
              endpoints: endpoints,
              addresses: endpoints
            });
          }
        },
        failure: callbacks.failure
      });
  };

  Agent.prototype.getAddresses = Agent.prototype.getEndpoints;

  Agent.prototype.toSnapshot = function () {
    return new connect.AgentSnapshot(this._getData());
  };

  /*----------------------------------------------------------------
   * class AgentSnapshot
   */
  var AgentSnapshot = function (agentData) {
    connect.Agent.call(this);
    this.agentData = agentData;
  };
  AgentSnapshot.prototype = Object.create(Agent.prototype);
  AgentSnapshot.prototype.constructor = AgentSnapshot;

  AgentSnapshot.prototype._getData = function () {
    return this.agentData;
  };

  AgentSnapshot.prototype._createContactAPI = function (contactData) {
    return new connect.ContactSnapshot(contactData);
  };

  /*----------------------------------------------------------------
   * class Contact
   */
  var Contact = function (contactId) {
    this.contactId = contactId;
  };

  Contact.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getContactData(this.getContactId());
  };

  Contact.prototype._createConnectionAPI = function (connectionData) {
    if (this.getType() === connect.ContactType.CHAT) {
      return new connect.ChatConnection(this.contactId, connectionData.connectionId);
    } else {
      return new connect.VoiceConnection(this.contactId, connectionData.connectionId);
    }
  };

  Contact.prototype.getEventName = function (eventName) {
    return connect.core.getContactEventName(eventName, this.getContactId());
  };

  Contact.prototype.onRefresh = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.REFRESH), f);
  };

  Contact.prototype.onIncoming = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.INCOMING), f);
  };

  Contact.prototype.onConnecting = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.CONNECTING), f);
  };

  Contact.prototype.onPending = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.PENDING), f);
  };

  Contact.prototype.onAccepted = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ACCEPTED), f);
  };

  Contact.prototype.onMissed = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.MISSED), f);
  };

  Contact.prototype.onEnded = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ENDED), f);
    bus.subscribe(this.getEventName(connect.ContactEvents.DESTROYED), f);
  };

  Contact.prototype.onDestroy = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.DESTROYED), f);
  };

  Contact.prototype.onACW = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ACW), f);
  };

  Contact.prototype.onConnected = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.CONNECTED), f);
  };

  Contact.prototype.onError = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ERROR), f);
  }

  Contact.prototype.getContactId = function () {
    return this.contactId;
  };

  Contact.prototype.getOriginalContactId = function () {
    return this._getData().initialContactId;
  };
  Contact.prototype.getInitialContactId = Contact.prototype.getOriginalContactId;

  Contact.prototype.getType = function () {
    return this._getData().type;
  };

  Contact.prototype.getContactDuration = function() {
    return this._getData().contactDuration;
  }

  Contact.prototype.getState = function () {
    return this._getData().state;
  };

  Contact.prototype.getStatus = Contact.prototype.getState;

  Contact.prototype.getStateDuration = function () {
    return connect.now() - this._getData().state.timestamp.getTime() + connect.core.getSkew();
  };

  Contact.prototype.getStatusDuration = Contact.prototype.getStateDuration;

  Contact.prototype.getQueue = function () {
    return this._getData().queue;
  };

  Contact.prototype.getQueueTimestamp = function () {
    return this._getData().queueTimestamp;
  };

  Contact.prototype.getConnections = function () {
    var self = this;
    return this._getData().connections.map(function (connData) {
      if (self.getType() === connect.ContactType.CHAT) {
        return new connect.ChatConnection(self.contactId, connData.connectionId);
      } else {
        return new connect.VoiceConnection(self.contactId, connData.connectionId);
      }
    });
  };

  Contact.prototype.getInitialConnection = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.isInitialConnection();
    }) || null;
  };

  Contact.prototype.getActiveInitialConnection = function () {
    var initialConn = this.getInitialConnection();
    if (initialConn != null && initialConn.isActive()) {
      return initialConn;
    } else {
      return null;
    }
  };

  Contact.prototype.getThirdPartyConnections = function () {
    return this.getConnections().filter(function (conn) {
      return !conn.isInitialConnection() && conn.getType() !== connect.ConnectionType.AGENT;
    });
  };

  Contact.prototype.getSingleActiveThirdPartyConnection = function () {
    return this.getThirdPartyConnections().filter(function (conn) {
      return conn.isActive();
    })[0] || null;
  };

  Contact.prototype.getAgentConnection = function () {
    return connect.find(this.getConnections(), function (conn) {
      var connType = conn.getType();
      return connType === connect.ConnectionType.AGENT || connType === connect.ConnectionType.MONITORING;
    });
  };

  Contact.prototype.getAttributes = function () {
    return this._getData().attributes;
  };

  Contact.prototype.isSoftphoneCall = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.getSoftphoneMediaInfo() != null;
    }) != null;
  };

  Contact.prototype.isInbound = function () {
    var conn = this.getInitialConnection();
    return conn ? conn.getType() === connect.ConnectionType.INBOUND : false;
  };

  Contact.prototype.isConnected = function () {
    return this.getStatus().type === connect.ContactStateType.CONNECTED;
  };

  Contact.prototype.accept = function (callbacks) {
    var client = connect.core.getClient();
    var self = this;
    var contactId = this.getContactId();
    client.call(connect.ClientMethods.ACCEPT_CONTACT, {
      contactId: contactId
    }, {
        success: function (data) {
          var conduit = connect.core.getUpstream();
          conduit.sendUpstream(connect.EventType.BROADCAST, {
            event: connect.ContactEvents.ACCEPTED,
            data: new connect.Contact(contactId)
          });
          conduit.sendUpstream(connect.EventType.BROADCAST, {
            event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED,
              self.getContactId()),
            data: new connect.Contact(contactId)
          });

          if (callbacks && callbacks.success) {
            callbacks.success(data);
          }
        },
        failure: callbacks ? callbacks.failure : null
      });
  };

  Contact.prototype.destroy = function () {
    connect.getLog().warn("contact.destroy() has been deprecated.");
  };

  Contact.prototype.complete = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.COMPLETE_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.clear = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.CLEAR_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.notifyIssue = function (issueCode, description, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.NOTIFY_CONTACT_ISSUE, {
      contactId: this.getContactId(),
      issueCode: issueCode,
      description: description
    }, callbacks);
  };

  Contact.prototype.addConnection = function (endpointIn, callbacks) {
    var client = connect.core.getClient();
    var endpoint = new connect.Endpoint(endpointIn);
    // Have to remove the endpointId field or AWS JS SDK gets mad.
    delete endpoint.endpointId;

    client.call(connect.ClientMethods.CREATE_ADDITIONAL_CONNECTION, {
      contactId: this.getContactId(),
      endpoint: endpoint
    }, callbacks);
  };

  Contact.prototype.toggleActiveConnections = function (callbacks) {
    var client = connect.core.getClient();
    var connectionId = null;
    var holdingConn = connect.find(this.getConnections(), function (conn) {
      return conn.getStatus().type === connect.ConnectionStateType.HOLD;
    });

    if (holdingConn != null) {
      connectionId = holdingConn.getConnectionId();

    } else {
      var activeConns = this.getConnections().filter(function (conn) {
        return conn.isActive();
      });
      if (activeConns.length > 0) {
        connectionId = activeConns[0].getConnectionId();
      }
    }

    client.call(connect.ClientMethods.TOGGLE_ACTIVE_CONNECTIONS, {
      contactId: this.getContactId(),
      connectionId: connectionId
    }, callbacks);
  };

  Contact.prototype.sendSoftphoneMetrics = function (softphoneStreamStatistics, callbacks) {
    var client = connect.core.getClient();

    client.call(connect.ClientMethods.SEND_SOFTPHONE_CALL_METRICS, {
      contactId: this.getContactId(),
      ccpVersion: global.ccpVersion,
      softphoneStreamStatistics: softphoneStreamStatistics
    }, callbacks);
  };

  Contact.prototype.sendSoftphoneReport = function (report, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.SEND_SOFTPHONE_CALL_REPORT, {
      contactId: this.getContactId(),
      ccpVersion: global.ccpVersion,
      report: report
    }, callbacks);
  };

  Contact.prototype.conferenceConnections = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.CONFERENCE_CONNECTIONS, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.toSnapshot = function () {
    return new connect.ContactSnapshot(this._getData());
  };

  /*----------------------------------------------------------------
   * class ContactSnapshot
   */
  var ContactSnapshot = function (contactData) {
    connect.Contact.call(this, contactData.contactId);
    this.contactData = contactData;
  };
  ContactSnapshot.prototype = Object.create(Contact.prototype);
  ContactSnapshot.prototype.constructor = ContactSnapshot;

  ContactSnapshot.prototype._getData = function () {
    return this.contactData;
  };

  ContactSnapshot.prototype._createConnectionAPI = function (connectionData) {
    return new connect.ConnectionSnapshot(connectionData);
  };

  /*----------------------------------------------------------------
   * class Connection
   */
  var Connection = function (contactId, connectionId) {
    this.contactId = contactId;
    this.connectionId = connectionId;
    this._initMediaController();
  };

  Connection.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getConnectionData(
      this.getContactId(), this.getConnectionId());
  };

  Connection.prototype.getContactId = function () {
    return this.contactId;
  };

  Connection.prototype.getConnectionId = function () {
    return this.connectionId;
  };

  Connection.prototype.getEndpoint = function () {
    return new connect.Endpoint(this._getData().endpoint);
  };

  Connection.prototype.getAddress = Connection.prototype.getEndpoint;

  Connection.prototype.getState = function () {
    return this._getData().state;
  };

  Connection.prototype.getStatus = Connection.prototype.getState;

  Connection.prototype.getStateDuration = function () {
    return connect.now() - this._getData().state.timestamp.getTime() + connect.core.getSkew();
  };

  Connection.prototype.getStatusDuration = Connection.prototype.getStateDuration;

  Connection.prototype.getType = function () {
    return this._getData().type;
  };

  Connection.prototype.isInitialConnection = function () {
    return this._getData().initial;
  };

  Connection.prototype.isActive = function () {
    return connect.contains(connect.CONNECTION_ACTIVE_STATES, this.getStatus().type);
  };

  Connection.prototype.isConnected = function () {
    return this.getStatus().type === connect.ConnectionStateType.CONNECTED;
  };

  Connection.prototype.isConnecting = function () {
    return this.getStatus().type === connect.ConnectionStateType.CONNECTING;
  };

  Connection.prototype.isOnHold = function () {
    return this.getStatus().type === connect.ConnectionStateType.HOLD;
  };

  Connection.prototype.getSoftphoneMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  /**
   * Gets the currently monitored contact info, Returns null if does not exists.
   * @return {{agentName:string, customerName:string, joinTime:Date}}
   */
  Connection.prototype.getMonitorInfo = function () {
    return this._getData().monitoringInfo;
  };

  Connection.prototype.destroy = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.DESTROY_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.sendDigits = function (digits, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.SEND_DIGITS, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId(),
      digits: digits
    }, callbacks);
  };

  Connection.prototype.hold = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.HOLD_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.resume = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.RESUME_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.toSnapshot = function () {
    return new connect.ConnectionSnapshot(this._getData());
  };

  Connection.prototype._initMediaController = function () {
    if (this.getMediaInfo()) {
      connect.core.mediaFactory.get(this).catch(function () { });
    }
  }

  // Method for checking whether this connection is an agent-side connection 
  // (type AGENT or MONITORING)
  Connection.prototype._isAgentConnectionType = function () {
    var connectionType = this.getType();
    return connectionType === connect.ConnectionType.AGENT 
      || connectionType === connect.ConnectionType.MONITORING;
  }

  /**
   * Utility method for checking whether this connection is an agent-side connection 
   * (type AGENT or MONITORING)
   * @return {boolean} True if this connection is an agent-side connection. False otherwise.
   */
  Connection.prototype._isAgentConnectionType = function () {
    var connectionType = this.getType();
    return connectionType === connect.ConnectionType.AGENT 
      || connectionType === connect.ConnectionType.MONITORING;
  }

  /**
   * @class VoiceConnection
   * @param {number} contactId 
   * @param {number} connectionId 
   * @description - Provides voice media specific operations
   */
  var VoiceConnection = function (contactId, connectionId) {
    Connection.call(this, contactId, connectionId);
  };

  VoiceConnection.prototype = Object.create(Connection.prototype);
  VoiceConnection.prototype.constructor = VoiceConnection;

  /**
  * @deprecated
  * Please use getMediaInfo 
  */
  VoiceConnection.prototype.getSoftphoneMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  VoiceConnection.prototype.getMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  VoiceConnection.prototype.getMediaType = function () {
    return connect.MediaType.SOFTPHONE;
  };

  VoiceConnection.prototype.getMediaController = function () {
    return connect.core.mediaFactory.get(this);
  }


  /**
   * @class ChatConnection
   * @param {*} contactId 
   * @param {*} connectionId 
   * @description adds the chat media specific functionality
   */
  var ChatConnection = function (contactId, connectionId) {
    Connection.call(this, contactId, connectionId);
  };

  ChatConnection.prototype = Object.create(Connection.prototype);
  ChatConnection.prototype.constructor = ChatConnection;

  ChatConnection.prototype.getMediaInfo = function () {
    var data = this._getData().chatMediaInfo;
    if (!data) {
      return null;
    } else {
      var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
      var mediaObject = {
        contactId: this.contactId,
        initialContactId: contactData.initialContactId || this.contactId,
        participantId: this.connectionId,
        getConnectionToken: connect.hitch(this, this.getConnectionToken)
      };
      if (data.connectionData) {
        try {
          mediaObject.participantToken = JSON.parse(data.connectionData).ConnectionAuthenticationToken;
        } catch (e) {
          connect.getLog().error(connect.LogComponent.CHAT, "Connection data is invalid").withObject(data).withException(e);
          mediaObject.participantToken = null;
        }
      }
      mediaObject.participantToken = mediaObject.participantToken || null;
      /** Just to keep the data accessible */
      mediaObject.originalInfo = this._getData().chatMediaInfo;
      return mediaObject;
    }
  };

  /**
  * Provides the chat connectionToken through the create_transport API for a specific contact and participant Id. 
  * @returns a promise which, upon success, returns the response from the createTransport API.
  * Usage:
  * connection.getConnectionToken()
  *  .then(response => {})
  *  .catch(error => {})
  */
  ChatConnection.prototype.getConnectionToken = function () {
    client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    var transportDetails = {
      transportType: connect.TRANSPORT_TYPES.CHAT_TOKEN,
      participantId: this.connectionId,
      contactId: contactData.initialContactId || this.contactId
    };
    return new Promise(function (resolve, reject) {
      client.call(connect.ClientMethods.CREATE_TRANSPORT, transportDetails, {
        success: function (data) {
          connect.getLog().info("getConnectionToken succeeded");
          resolve(data);
        },
        failure: function (err, data) {
          connect.getLog().error("getConnectionToken failed")
            .withObject({
              err: err,
              data: data
            });
          reject(Error("getConnectionToken failed"));
        }
      });
    });
  };

  ChatConnection.prototype.getMediaType = function () {
    return connect.MediaType.CHAT;
  };

  ChatConnection.prototype.getMediaController = function () {
    return connect.core.mediaFactory.get(this);
  };

  ChatConnection.prototype._initMediaController = function () {
    // Note that a chat media controller only needs to be produced for agent type connections.
    if (this._isAgentConnectionType()) {
      connect.core.mediaFactory.get(this).catch(function () { });
    }
  }

  /*----------------------------------------------------------------
   * class ConnectionSnapshot
   */
  var ConnectionSnapshot = function (connectionData) {
    connect.Connection.call(this, connectionData.contactId, connectionData.connectionId);
    this.connectionData = connectionData;
  };
  ConnectionSnapshot.prototype = Object.create(Connection.prototype);
  ConnectionSnapshot.prototype.constructor = ConnectionSnapshot;

  ConnectionSnapshot.prototype._getData = function () {
    return this.connectionData;
  };

  ConnectionSnapshot.prototype._initMediaController = function () { };

  var Endpoint = function (paramsIn) {
    var params = paramsIn || {};
    this.endpointARN = params.endpointId || params.endpointARN || null;
    this.endpointId = this.endpointARN;
    this.type = params.type || null;
    this.name = params.name || null;
    this.phoneNumber = params.phoneNumber || null;
    this.agentLogin = params.agentLogin || null;
    this.queue = params.queue || null;
  };

  /**
   * Strip the SIP endpoint components from the phoneNumber field.
   */
  Endpoint.prototype.stripPhoneNumber = function () {
    return this.phoneNumber ? this.phoneNumber.replace(/sip:([^@]*)@.*/, "$1") : "";
  };

  /**
   * Create an Endpoint object from the given phone number and name.
   */
  Endpoint.byPhoneNumber = function (number, name) {
    return new Endpoint({
      type: connect.EndpointType.PHONE_NUMBER,
      phoneNumber: number,
      name: name || null
    });
  };

  /*----------------------------------------------------------------
   * class SoftphoneError
   */
  var SoftphoneError = function (errorType, errorMessage, endPointUrl) {
    this.errorType = errorType;
    this.errorMessage = errorMessage;
    this.endPointUrl = endPointUrl;
  };
  SoftphoneError.prototype.getErrorType = function () {
    return this.errorType;
  };
  SoftphoneError.prototype.getErrorMessage = function () {
    return this.errorMessage;
  };
  SoftphoneError.prototype.getEndPointUrl = function () {
    return this.endPointUrl;
  };

  /*----------------------------------------------------------------
   * Root Subscription APIs.
   */
  connect.agent = function (f) {
    var bus = connect.core.getEventBus();
    var sub = bus.subscribe(connect.AgentEvents.INIT, f);
    if (connect.agent.initialized) {
      f(new connect.Agent());
    }
    return sub;
  };
  connect.agent.initialized = false;

  connect.contact = function (f) {
    var bus = connect.core.getEventBus();
    return bus.subscribe(connect.ContactEvents.INIT, f);
  };

  connect.onWebsocketInitFailure = function (f) {
    var bus = connect.core.getEventBus();
    var sub = bus.subscribe(connect.WebSocketEvents.INIT_FAILURE, f);
    if (connect.webSocketInitFailed) {
      f();
    }
    return sub;
  };

  /**
   * Starts the given function asynchronously only if the shared worker
   * says we are the master for the given topic.  If there is no master for
   * the given topic, we become the master and start the function.
   *
   * @param topic The master topic we are concerned about.
   * @param f_true The callback to be invoked if we are the master.
   * @param f_else [optional] A callback to be invoked if we are not the master.
   */
  connect.ifMaster = function (topic, f_true, f_else) {
    connect.assertNotNull(topic, "A topic must be provided.");
    connect.assertNotNull(f_true, "A true callback must be provided.");

    if (!connect.core.masterClient) {
      // We can't be the master because there is no master client!
      connect.getLog().warn("We can't be the master for topic '%s' because there is no master client!", topic);
      if (f_else) {
        f_else();
      }
      return;
    }

    var masterClient = connect.core.getMasterClient();
    masterClient.call(connect.MasterMethods.CHECK_MASTER, {
      topic: topic
    }, {
        success: function (data) {
          if (data.isMaster) {
            f_true();

          } else if (f_else) {
            f_else();
          }
        }
      });
  };

  /**
   * Notify the shared worker that we are now the master for the given topic.
   */
  connect.becomeMaster = function (topic) {
    connect.assertNotNull(topic, "A topic must be provided.");
    var masterClient = connect.core.getMasterClient();
    masterClient.call(connect.MasterMethods.BECOME_MASTER, {
      topic: topic
    });
  };

  connect.Agent = Agent;
  connect.AgentSnapshot = AgentSnapshot;
  connect.Contact = Contact;
  connect.ContactSnapshot = ContactSnapshot;
  /** Default will get the Voice connection */
  connect.Connection = VoiceConnection;
  connect.BaseConnection = Connection;
  connect.VoiceConnection = VoiceConnection;
  connect.ChatConnection = ChatConnection;
  connect.ConnectionSnapshot = ConnectionSnapshot;
  connect.Endpoint = Endpoint;
  connect.Address = Endpoint;
  connect.SoftphoneError = SoftphoneError;

})();

