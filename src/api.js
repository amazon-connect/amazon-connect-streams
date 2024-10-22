/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this || globalThis;
  var connect = global.connect || {};
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
    'InvalidLocale',
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
    'disconnected',
    'silent_monitor',
    'barge'
  ]);
  connect.ConnectionStatusType = connect.ConnectionStateType;

  connect.CONNECTION_ACTIVE_STATES = connect.set([
    connect.ConnectionStateType.CONNECTING,
    connect.ConnectionStateType.CONNECTED,
    connect.ConnectionStateType.HOLD,
    connect.ConnectionStateType.SILENT_MONITOR,
    connect.ConnectionStateType.BARGE
  ]);

  connect.CONNECTION_CONNECTED_STATES = connect.set([
    connect.ConnectionStateType.CONNECTED,
    connect.ConnectionStateType.SILENT_MONITOR,
    connect.ConnectionStateType.BARGE
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
    'ended',
    'rejected',
    'paused'
  ]);
  connect.ContactStatusType = connect.ContactStateType;

  connect.CONTACT_ACTIVE_STATES = connect.makeEnum([
    "paused",
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
    'chat',
    'task'
  ]);

  /*----------------------------------------------------------------
   * enum ContactInitiationMethod
   */
  connect.ContactInitiationMethod = connect.makeEnum([
    'inbound',
    'outbound',
    'transfer',
    'queue_transfer',
    'callback',
    'api',
    'disconnect',
    'webrtc_api'
  ]);

  /*----------------------------------------------------------------
   * enum for MonitoringMode
   */
  connect.MonitoringMode = connect.makeEnum([
    'SILENT_MONITOR',
    'BARGE'
  ]);

  /*----------------------------------------------------------------
   * enum for MonitoringErrorTypes
   */
  connect.MonitoringErrorTypes = connect.makeEnum([
    'invalid_target_state'
  ]);

  /*----------------------------------------------------------------
  * enum ChannelType
  */
  connect.ChannelType = connect.makeEnum([
    'VOICE',
    'CHAT',
    'TASK'
  ]);

  /*----------------------------------------------------------------
  * enum MediaType
  */
  connect.MediaType = connect.makeEnum([
    'softphone',
    'chat',
    'task'
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
    'vdi_strategy_not_supported',
    'vdi_redir_not_supported',
    'other'
  ]);

  /*----------------------------------------------------------------
   * enum for ClickType
   */
  connect.ClickType = connect.makeEnum([
    'Accept',
    'Reject',
    'Hangup'
  ]);

  /*----------------------------------------------------------------
   * enum for VoiceIdErrorTypes
   */
  connect.VoiceIdErrorTypes = connect.makeEnum([
    'no_speaker_id_found',
    'speaker_id_not_enrolled',
    'get_speaker_id_failed',
    'get_speaker_status_failed',
    'opt_out_speaker_failed',
    'opt_out_speaker_in_lcms_failed',
    'delete_speaker_failed',
    'start_session_failed',
    'evaluate_speaker_failed',
    'session_not_exists',
    'describe_session_failed',
    'enroll_speaker_failed',
    'update_speaker_id_failed',
    'update_speaker_id_in_lcms_failed',
    'not_supported_on_conference_calls',
    'enroll_speaker_timeout',
    'evaluate_speaker_timeout',
    'get_domain_id_failed',
    'no_domain_id_found'
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
    "UnauthorizedException",
    "QuotaExceededException"
  ]);
  /*----------------------------------------------------------------
   * enum for VoiceId streaming status
   */
  connect.VoiceIdStreamingStatus = connect.makeEnum([
    "ONGOING",
    "ENDED",
    "PENDING_CONFIGURATION"
  ]);

  /*----------------------------------------------------------------
   * enum for VoiceId authentication decision
   */
  connect.VoiceIdAuthenticationDecision = connect.makeEnum([
    "ACCEPT",
    "REJECT",
    "NOT_ENOUGH_SPEECH",
    "SPEAKER_NOT_ENROLLED",
    "SPEAKER_OPTED_OUT",
    "SPEAKER_ID_NOT_PROVIDED",
    "SPEAKER_EXPIRED"
  ]);

  /*----------------------------------------------------------------
   * enum for VoiceId fraud detection decision
   */
  connect.VoiceIdFraudDetectionDecision = connect.makeEnum([
    "NOT_ENOUGH_SPEECH",
    "HIGH_RISK",
    "LOW_RISK"
  ]);

  /*----------------------------------------------------------------
   * enum for contact flow authentication decision
   */
  connect.ContactFlowAuthenticationDecision = connect.makeEnum([
    "Authenticated",
    "NotAuthenticated",
    "Inconclusive",
    "NotEnrolled",
    "OptedOut",
    "NotEnabled",
    "Error"
  ]);

  /*----------------------------------------------------------------
   * enum for contact flow  fraud detection decision
   */
  connect.ContactFlowFraudDetectionDecision = connect.makeEnum([
    "HighRisk",
    "LowRisk",
    "Inconclusive",
    "NotEnabled",
    "Error"
  ]);

  /*----------------------------------------------------------------
   * enum for Video Capability
   */
  connect.VideoCapability = connect.makeEnum([
    "SEND"
  ]);

  /*----------------------------------------------------------------
   * enum for Screen Share Capability
   */
  connect.ScreenShareCapability = connect.makeEnum([
    "SEND"
  ]);

  /*----------------------------------------------------------------
   * enum for VoiceId EnrollmentRequest Status
   */
  connect.VoiceIdEnrollmentRequestStatus = connect.makeEnum([
    "NOT_ENOUGH_SPEECH",
    "IN_PROGRESS",
    "COMPLETED",
    "FAILED"
  ]);

  /*----------------------------------------------------------------
   * enum for VoiceId Speaker status
   */
  connect.VoiceIdSpeakerStatus = connect.makeEnum([
    "OPTED_OUT",
    "ENROLLED",
    "PENDING"
  ]);

  connect.VoiceIdConstants = {
    EVALUATE_SESSION_DELAY: 10000,
    EVALUATION_MAX_POLL_TIMES: 24, // EvaluateSpeaker is Polling for maximum 2 mins.
    EVALUATION_POLLING_INTERVAL: 5000,
    ENROLLMENT_MAX_POLL_TIMES: 120, // EnrollmentSpeaker is Polling for maximum 10 mins.
    ENROLLMENT_POLLING_INTERVAL: 5000,
    START_SESSION_DELAY: 8000
  }

  /*----------------------------------------------------------------
   * constants for AgentPermissions
   */
  connect.AgentPermissions = {
    OUTBOUND_CALL: 'outboundCall',
    VOICE_ID: 'voiceId'
  };

  /*----------------------------------------------------------------
   * Quick Responses APIs (utilizes public api proxy -- No shared worker involvement)
   */
  class QuickResponses {
    static isEnabled = function() {
      const client = connect.isCRM() ? connect.core.getClient() : connect.core.getApiProxyClient();
      return new Promise(function (resolve, reject) {
        client.call(connect.ApiProxyClientMethods.QR_INTEGRATION_EXISTS, null, {
          success: function (data) {
            connect.getLog().info("Quick Responses isEnabled succeeded").withObject(data).sendInternalLogToServer();
            resolve(data);
          },
          failure: function (err) {
            connect.getLog().error("Quick Responses isEnabled failed")
              .withException(err).sendInternalLogToServer();
            reject(err);
          }
        });
      });
    }

    static searchQuickResponses = function(params) {
      const client = connect.isCRM() ? connect.core.getClient() : connect.core.getApiProxyClient();
      const attributes = params?.contactId ? new Contact(params.contactId).getAttributes() : undefined;
      return new Promise(function (resolve, reject) {
        client.call(connect.ApiProxyClientMethods.QR_SEARCH_QUICK_RESPONSES, {
          ...params,
          attributes }, {
          success: function (data) {
            connect.getLog().info("searchQuickResponses succeeded").withObject(data).sendInternalLogToServer();
            resolve(data);
          },
          failure: function (err) {
            connect.getLog().error("searchQuickResponses failed")
              .withException(err).sendInternalLogToServer();
            reject(err);
          }
        });
      });
    }
  };

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

  Agent.prototype.onRefresh = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.REFRESH, f);
  };

  Agent.prototype.onRoutable = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.ROUTABLE, f);
  };

  Agent.prototype.onNotRoutable = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.NOT_ROUTABLE, f);
  };

  Agent.prototype.onOffline = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.OFFLINE, f);
  };

  Agent.prototype.onError = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.ERROR, f);
  };

  Agent.prototype.onSoftphoneError = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.SOFTPHONE_ERROR, f);
  };

  Agent.prototype.onWebSocketConnectionLost = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.WEBSOCKET_CONNECTION_LOST, f);
  }

  Agent.prototype.onWebSocketConnectionGained = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.WEBSOCKET_CONNECTION_GAINED, f);
  }

  Agent.prototype.onAfterCallWork = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.ACW, f);
  };

  Agent.prototype.onStateChange = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.STATE_CHANGE, f);
  };

  Agent.prototype.onMuteToggle = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.MUTE_TOGGLE, f);
  };

  Agent.prototype.onLocalMediaStreamCreated = function (f) {
    return connect.core.getEventBus().subscribe(connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED, f);
  };

  Agent.prototype.onSpeakerDeviceChanged = function (f) {
    return connect.core.getEventBus().subscribe(connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED, f);
  }

  Agent.prototype.onMicrophoneDeviceChanged = function (f) {
    return connect.core.getEventBus().subscribe(connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED, f);
  }

  Agent.prototype.onRingerDeviceChanged = function (f) {
    return connect.core.getEventBus().subscribe(connect.ConfigurationEvents.RINGER_DEVICE_CHANGED, f);
  }

  Agent.prototype.onCameraDeviceChanged = function (f) {
    return connect.core.getEventBus().subscribe(connect.ConfigurationEvents.CAMERA_DEVICE_CHANGED, f);
  }

  Agent.prototype.onBackgroundBlurChanged = function (f) {
    return connect.core.getEventBus().subscribe(connect.ConfigurationEvents.BACKGROUND_BLUR_CHANGED, f);
  }

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

  Agent.prototype.setSpeakerDevice = function (deviceId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.SET_SPEAKER_DEVICE,
      data: { deviceId: deviceId }
    });
  };

  Agent.prototype.setMicrophoneDevice = function (deviceId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.SET_MICROPHONE_DEVICE,
      data: { deviceId: deviceId }
    });
  };

  Agent.prototype.setRingerDevice = function (deviceId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.SET_RINGER_DEVICE,
      data: { deviceId: deviceId }
    });
  };

  // Only send event CAMERA_DEVICE_CHANGED because we do not handle video streams in StreamJS
  Agent.prototype.setCameraDevice = function (deviceId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.CAMERA_DEVICE_CHANGED,
      data: { deviceId: deviceId }
    });
  };

  Agent.prototype.setBackgroundBlur = function (isBackgroundBlurEnabled) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.BACKGROUND_BLUR_CHANGED,
      data: { isBackgroundBlurEnabled: isBackgroundBlurEnabled }
    });
  };

  Agent.prototype.getState = function () {
    return this._getData().snapshot.state;
  };

  Agent.prototype.getNextState = function () {
    return this._getData().snapshot.nextState;
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
        // Exclude TASK from default concurrency.
        if (key !== 'TASK') {
          acc[connect.ChannelType[key]] = 1;
        }
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

  Agent.prototype.getAgentARN = function () {
    return this.getConfiguration().agentARN;
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
    if (configuration && configuration.agentPreferences && configuration.agentPreferences.LANGUAGE && !configuration.agentPreferences.locale) {
      // workaround for the inconsistency issue that getAgentConfiguration returns agentPreferences.LANGUAGE but updateAgentConfiguration expects agentPreferences.locale to be set.
      configuration.agentPreferences.locale = configuration.agentPreferences.LANGUAGE;
    }

    if (configuration && configuration.agentPreferences && !connect.isValidLocale(configuration.agentPreferences.locale)) {
      if (callbacks && callbacks.failure) {
        callbacks.failure(connect.AgentErrorStates.INVALID_LOCALE);
      }
    } else {
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
    }
  };

  Agent.prototype.setState = function (state, callbacks, options) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.PUT_AGENT_STATE, {
      state: connect.assertNotNull(state, 'state'),
      enqueueNextState: options && !!options.enqueueNextState
    }, callbacks);
  };
  Agent.prototype.onEnqueuedNextState = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ENQUEUED_NEXT_STATE, f);
  };

  Agent.prototype.setStatus = Agent.prototype.setState;

  Agent.prototype.connect = function (endpointIn, params) {
    var client = connect.core.getClient();
    var endpoint = new connect.Endpoint(endpointIn);
    // Have to remove the endpointId field or AWS JS SDK gets mad.
    delete endpoint.endpointId;

    var callParams = {
      endpoint: connect.assertNotNull(endpoint, 'endpoint'),
      queueARN: (params && (params.queueARN || params.queueId)) || this.getRoutingProfile().defaultOutboundQueue.queueARN
    };

    if (params && params.relatedContactId && params.relatedContactId !== null) {
      callParams.relatedContactId = params.relatedContactId;
      if (params.previousContactId) {
        delete callParams.previousContactId;
      }
    }

    client.call(connect.ClientMethods.CREATE_OUTBOUND_CONTACT, callParams, params && {
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
    var pageInfo = pageInfoIn || {};

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

  //Internal identifier.
  Agent.prototype._getResourceId = function () {
    var queueArns = this.getAllQueueARNs();
    for (let queueArn of queueArns) {
      const agentIdMatch = queueArn.match(/\/agent\/([^/]+)/);

      if (agentIdMatch) {
        return agentIdMatch[1];
      }
    }
    return new Error("Agent.prototype._getResourceId: queueArns did not contain agentResourceId: ", queueArns);
  }

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
    } else if (this.getType() === connect.ContactType.TASK) {
      return new connect.TaskConnection(this.contactId, connectionData.connectionId);
    } else {
      return new connect.VoiceConnection(this.contactId, connectionData.connectionId);
    }
  };

  Contact.prototype.getEventName = function (eventName) {
    return connect.core.getContactEventName(eventName, this.getContactId());
  };

  Contact.prototype.onRefresh = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.REFRESH), f);
  };

  Contact.prototype.onIncoming = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.INCOMING), f);
  };

  Contact.prototype.onConnecting = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.CONNECTING), f);
  };

  Contact.prototype.onPending = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.PENDING), f);
  };

  Contact.prototype.onAccepted = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.ACCEPTED), f);
  };

  Contact.prototype.onMissed = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.MISSED), f);
  };

  Contact.prototype.onEnded = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.ENDED), f);
  };

  Contact.prototype.onDestroy = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.DESTROYED), f);
  };

  Contact.prototype.onACW = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.ACW), f);
  };

  Contact.prototype.onConnected = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.CONNECTED), f);
  };

  Contact.prototype.onError = function (f) {
    return connect.core.getEventBus().subscribe(this.getEventName(connect.ContactEvents.ERROR), f);
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

  Contact.prototype.getContactDuration = function () {
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
      } else if (self.getType() === connect.ContactType.TASK) {
        return new connect.TaskConnection(self.contactId, connData.connectionId);
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

  Contact.prototype.getActiveConnections = function () {
    return this.getConnections().filter((conn) => conn.isActive());
  }

  Contact.prototype.hasTwoActiveParticipants = function () {
    return this.getActiveConnections().length === 2;
  }

  Contact.prototype.getName = function () {
    return this._getData().name;
  };

  Contact.prototype.getContactMetadata = function () {
    return this._getData().contactMetadata;
  }

  Contact.prototype.getDescription = function () {
    return this._getData().description;
  };

  Contact.prototype.getReferences = function () {
    return this._getData().references;
  };

  Contact.prototype.getAttributes = function () {
    return this._getData().attributes;
  };

  Contact.prototype.getContactFeatures = function () {
    return this._getData().contactFeatures;
  };

  Contact.prototype.getChannelContext = function () {
    return this._getData().channelContext;
  };

  Contact.prototype.getSegmentAttributes = function () {
    return this._getData().segmentAttributes;
  }

  Contact.prototype.getContactSubtype = function () {
    const segmentAttributes = this.getSegmentAttributes();
    return segmentAttributes && segmentAttributes["connect:Subtype"] ? segmentAttributes["connect:Subtype"].ValueString : null;
  }

  Contact.prototype.isSoftphoneCall = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.getSoftphoneMediaInfo() != null;
    }) != null;
  };

  Contact.prototype.hasVideoRTCCapabilities = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.canSendVideo && conn.canSendVideo();
    }) !== null;
  };

  Contact.prototype.canAgentSendVideo = function () {
    const agentConnection = this.getAgentConnection();
    return agentConnection.canSendVideo && agentConnection.canSendVideo();
  };

  Contact.prototype.canAgentReceiveVideo = function () {
    const initialConn = this.getInitialConnection();
    // If customer has SEND capability, then agent can receive video
    if (initialConn.canSendVideo && initialConn.canSendVideo()) {
      return true;
    }
    // If customer does not have SEND capability, right now we do not populate SEND capability in third party connection
    // so if customer does not have SEND capability then use agent SEND capability to determine that agent can
    // receive videos from other parties (other agents, superiors).
    const thirdPartyConns = this.getThirdPartyConnections();
    return thirdPartyConns && thirdPartyConns.length > 0  && this.canAgentSendVideo();
  };

  Contact.prototype.hasScreenShareCapability = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.canSendScreenShare && conn.canSendScreenShare();
    }) !== null;
  }

  Contact.prototype.canAgentSendScreenShare = function () {
    const agentConnection = this.getAgentConnection();
    return agentConnection.canSendScreenShare && agentConnection.canSendScreenShare();
  }

  Contact.prototype.canCustomerSendScreenShare = function () {
    const initialConn = this.getInitialConnection();
    return initialConn.canSendScreenShare && initialConn.canSendScreenShare();
  };


  Contact.prototype.startScreenSharing = async function (skipSessionInitiation) {
    const contactId = this.getContactId();
    if (this.getContactSubtype() !== "connect:WebRTC") {
      throw new Error("Screen sharing is only supported for WebRTC contacts.");
    }
    if (!this.isConnected()) {
      throw new connect.StateError('Contact %s is not connected.', contactId);
    }
    if (!skipSessionInitiation) {
      const client = connect.isCRM() ? connect.core.getClient() : connect.core.getApiProxyClient();
      const body = {
        "InstanceId": connect.core.getAgentDataProvider().getInstanceId(),
        "ContactId": contactId,
        "ParticipantId": this.getAgentConnection().getConnectionId(),
      };
      return new Promise(function (resolve, reject) {
        client.call(connect.ApiProxyClientMethods.START_SCREEN_SHARING, body, {
          success: function (data) {
            connect.getLog().info("startScreenSharing succeeded").withObject(data).sendInternalLogToServer();
            connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
              {
                event: connect.ContactEvents.SCREEN_SHARING_STARTED,
                data: { contactId: contactId }
              }
            );
            resolve(data);
          },
          failure: function (err) {
            connect.getLog().error("startScreenSharing failed")
              .withException(err).sendInternalLogToServer();
            connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
              {
                event: connect.ContactEvents.SCREEN_SHARING_ERROR,
                data: { contactId: contactId }
              }
            );
            reject(err);
          }
        });
      });
    } else {
      connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
        {
          event: connect.ContactEvents.SCREEN_SHARING_STARTED,
          data: { contactId: contactId }
        }
      );
    }
  };

  Contact.prototype.onScreenSharingStarted = function (f) {
    return connect.core.getEventBus().subscribe(connect.ContactEvents.SCREEN_SHARING_STARTED, f);
  }

  Contact.prototype.stopScreenSharing = async function () {
    const contactId = this.getContactId();
    if (this.getContactSubtype() !== "connect:WebRTC") {
      throw new Error("Screen sharing is only supported for WebRTC contacts.");
    }
    if (!this.isConnected()) {
      throw new connect.StateError('Contact %s is not connected.', contactId);
    }
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
      {
        event: connect.ContactEvents.SCREEN_SHARING_STOPPED,
        data: { contactId: contactId }
      }
    );
  };

  Contact.prototype.onScreenSharingStopped = function (f) {
    return connect.core.getEventBus().subscribe(connect.ContactEvents.SCREEN_SHARING_STOPPED, f);
  }

  Contact.prototype.onScreenSharingError = function (f) {
    return connect.core.getEventBus().subscribe(connect.ContactEvents.SCREEN_SHARING_ERROR, f);
  }

  Contact.prototype._isInbound = function () {
    var initiationMethod = this._getData().initiationMethod;
    return (initiationMethod === connect.ContactInitiationMethod.OUTBOUND) ? false : true;
  }

  Contact.prototype.isInbound = function () {
    var conn = this.getInitialConnection();

    // We will gradually change checking inbound by relying on contact initiationMethod
    if (conn.getMediaType() === connect.MediaType.TASK) {
      return this._isInbound();
    }

    return conn ? conn.getType() === connect.ConnectionType.INBOUND : false;
  };

  Contact.prototype.isConnected = function () {
    return this.getStatus().type === connect.ContactStateType.CONNECTED;
  };

  Contact.prototype.accept = function (callbacks) {
    var client = connect.core.getClient();
    var self = this;
    var contactId = this.getContactId();

    connect.publishClickStreamData({
      contactId: this.getContactId(),
      clickType: connect.ClickType.ACCEPT,
      clickTime: new Date().toISOString()
    });

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
          event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, self.getContactId()),
          data: new connect.Contact(contactId)
        });

        // In Firefox, there's a browser restriction that an unfocused browser tab is not allowed to access the user's microphone.
        // The problem is that the restriction could cause a webrtc session creation timeout error when you get an incoming call while you are not on the primary tab.
        // It was hard to workaround the issue especially when you have multiple tabs open because you needed to find the right tab and accept the contact before the timeout.
        // To avoid the error, when multiple tabs are open in Firefox, a webrtc session is not immediately created as an incoming softphone contact is detected.
        // Instead, it waits until contact.accept() is called on a tab and lets the tab become the new primary tab and start the web rtc session there
        // because the tab should be focused at the moment and have access to the user's microphone.
        var contact = new connect.Contact(contactId);
        if (connect.isFirefoxBrowser() && contact.isSoftphoneCall()) {
          connect.core.triggerReadyToStartSessionEvent();
        }
        if (callbacks && callbacks.success) {
          callbacks.success(data);
        }
      },
      failure: function (err, data) {
        connect.getLog().error("Accept Contact failed").sendInternalLogToServer()
          .withException(err)
          .withObject({
            data
          });

        connect.publishMetric({
          name: "ContactAcceptFailure",
          data: { count: 1 }
        })

        if (callbacks && callbacks.failure) {
          callbacks.failure(connect.ContactStateType.ERROR);
        }
      }
    });
  };

  Contact.prototype.destroy = function () {
    connect.getLog().warn("contact.destroy() has been deprecated.");
  };

  Contact.prototype.reject = function (callbacks) {
    var client = connect.core.getClient();

    connect.publishClickStreamData({
      contactId: this.getContactId(),
      clickType: connect.ClickType.REJECT,
      clickTime: new Date().toISOString()
    });

    client.call(connect.ClientMethods.REJECT_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
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

    connect.publishSoftphoneStats({
      contactId: this.getContactId(),
      ccpVersion: global.ccpVersion,
      stats: softphoneStreamStatistics
    });
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

  Contact.prototype.isMultiPartyConferenceEnabled = function () {
    var contactFeatures = this.getContactFeatures();
    return !!(contactFeatures && contactFeatures.multiPartyConferenceEnabled);
  }

  Contact.prototype.updateMonitorParticipantState = function (targetState, callbacks) {
    if (!targetState || !Object.values(connect.MonitoringMode).includes(targetState.toUpperCase())) {
      connect.getLog().error(`Invalid target state was provided: ${targetState}`).sendInternalLogToServer();
      if (callbacks && callbacks.failure) {
        callbacks.failure(connect.MonitoringErrorTypes.INVALID_TARGET_STATE);
      }
    } else {
      var client = connect.core.getClient();
      client.call(connect.ClientMethods.UPDATE_MONITOR_PARTICIPANT_STATE, {
        contactId: this.getContactId(),
        targetMonitorMode: targetState.toUpperCase()
      }, callbacks);
    }
  }

  Contact.prototype.isUnderSupervision = function () {
    var nonAgentConnections = this.getConnections().filter((conn) => conn.getType() !== connect.ConnectionType.AGENT);
    var supervisorConnection = nonAgentConnections && nonAgentConnections.find(conn => conn.isBarge() && conn.isActive());
    return supervisorConnection !== undefined;
  }

  Contact.prototype.silentMonitor = function (callbacks) {
    return this.updateMonitorParticipantState(connect.MonitoringMode.SILENT_MONITOR, callbacks);
  }

  Contact.prototype.bargeIn = function (callbacks) {
    return this.updateMonitorParticipantState(connect.MonitoringMode.BARGE, callbacks);
  }
  
  Contact.prototype.pause = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.PAUSE_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.resume = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.RESUME_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
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
    return connect.contains(connect.CONNECTION_CONNECTED_STATES, this.getStatus().type);
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
    connect.publishClickStreamData({
      contactId: this.getContactId(),
      clickType: connect.ClickType.HANGUP,
      clickTime: new Date().toISOString()
    });

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

  /*----------------------------------------------------------------
  * Voice authenticator VoiceId
  */

  var VoiceId = function (contactId) {
    this.contactId = contactId;
  };

  VoiceId.prototype.getSpeakerId = function () {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      const params = {
        "contactId": self.contactId,
        "instanceId": connect.core.getAgentDataProvider().getInstanceId(),
        "awsAccountId": connect.core.getAgentDataProvider().getAWSAccountId()
      };
      connect.getLog().info("getSpeakerId called").withObject(params).sendInternalLogToServer();
      client.call(connect.AgentAppClientMethods.GET_CONTACT, params, {
        success: function (data) {
          if (data.contactData.customerId) {
            var obj = {
              speakerId: data.contactData.customerId
            }
            connect.getLog().info("getSpeakerId succeeded").withObject(data).sendInternalLogToServer();
            resolve(obj);
          } else {
            var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.NO_SPEAKER_ID_FOUND, "No speakerId assotiated with this call");
            reject(error);
          }

        },
        failure: function (err) {
          connect.getLog().error("Get SpeakerId failed")
            .withObject({
              err: err
            }).sendInternalLogToServer();
          var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.GET_SPEAKER_ID_FAILED, "Get SpeakerId failed", err);
          reject(error);
        }
      });
    });
  };

  VoiceId.prototype.getSpeakerStatus = function () {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      self.getSpeakerId().then(function (data) {
        self.getDomainId().then(function (domainId) {
          const params = {
            "SpeakerId": connect.assertNotNull(data.speakerId, 'speakerId'),
            "DomainId": domainId
          };
          connect.getLog().info("getSpeakerStatus called").withObject(params).sendInternalLogToServer();
          client.call(connect.AgentAppClientMethods.DESCRIBE_SPEAKER, params, {
            success: function (data) {
              connect.getLog().info("getSpeakerStatus succeeded").withObject(data).sendInternalLogToServer();
              resolve(data);
            },
            failure: function (err) {
              var error;
              var parsedErr = JSON.parse(err);
              switch (parsedErr.status) {
                case 400:
                case 404:
                  var data = parsedErr;
                  data.type = data.type ? data.type : connect.VoiceIdErrorTypes.SPEAKER_ID_NOT_ENROLLED;
                  connect.getLog().info("Speaker is not enrolled.").sendInternalLogToServer();
                  resolve(data);
                  break;
                default:
                  connect.getLog().error("getSpeakerStatus failed")
                    .withObject({
                      err: err
                    }).sendInternalLogToServer();
                  var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.GET_SPEAKER_STATUS_FAILED, "Get SpeakerStatus failed", err);
                  reject(error);
              }
            }
          });
        }).catch(function (err) {
          reject(err);
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  // internal only
  VoiceId.prototype._optOutSpeakerInLcms = function (speakerId, generatedSpeakerId) {
    var self = this;
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      const params = {
        "ContactId": self.contactId,
        "InstanceId": connect.core.getAgentDataProvider().getInstanceId(),
        "AWSAccountId": connect.core.getAgentDataProvider().getAWSAccountId(),
        "CustomerId": connect.assertNotNull(speakerId, 'speakerId'),
        "VoiceIdResult": {
          "SpeakerOptedOut": true,
          "generatedSpeakerId": generatedSpeakerId
        }
      };
      connect.getLog().info("_optOutSpeakerInLcms called").withObject(params).sendInternalLogToServer();
      client.call(connect.AgentAppClientMethods.UPDATE_VOICE_ID_DATA, params, {
        success: function (data) {
          connect.getLog().info("optOutSpeakerInLcms succeeded").withObject(data).sendInternalLogToServer();
          resolve(data);
        },
        failure: function (err) {
          connect.getLog().error("optOutSpeakerInLcms failed")
            .withObject({
              err: err,
            }).sendInternalLogToServer();
          var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_IN_LCMS_FAILED, "optOutSpeakerInLcms failed", err);
          reject(error);
        }
      });
    });
  };

  VoiceId.prototype.optOutSpeaker = function () {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      self.getSpeakerId().then(function (data) {
        self.getDomainId().then(function (domainId) {
          var speakerId = data.speakerId;
          const params = {
            "SpeakerId": connect.assertNotNull(speakerId, 'speakerId'),
            "DomainId": domainId
          };
          connect.getLog().info("optOutSpeaker called").withObject(params).sendInternalLogToServer();
          client.call(connect.AgentAppClientMethods.OPT_OUT_SPEAKER, params, {
            success: function (data) {
              self._optOutSpeakerInLcms(speakerId, data.generatedSpeakerId).catch(function () { });
              connect.getLog().info("optOutSpeaker succeeded").withObject(data).sendInternalLogToServer();
              resolve(data);
            },
            failure: function (err) {
              connect.getLog().error("optOutSpeaker failed")
                .withObject({
                  err: err,
                }).sendInternalLogToServer();
              var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_FAILED, "optOutSpeaker failed.", err);
              reject(error);
            }
          });
        }).catch(function (err) {
          reject(err);
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  VoiceId.prototype.deleteSpeaker = function () {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      self.getSpeakerId().then(function (data) {
        self.getDomainId().then(function (domainId) {
          const params = {
            "SpeakerId": connect.assertNotNull(data.speakerId, 'speakerId'),
            "DomainId": domainId
          };
          connect.getLog().info("deleteSpeaker called").withObject(params).sendInternalLogToServer();
          client.call(connect.AgentAppClientMethods.DELETE_SPEAKER, params, {
            success: function (data) {
              connect.getLog().info("deleteSpeaker succeeded").withObject(data).sendInternalLogToServer();
              resolve(data);
            },
            failure: function (err) {
              connect.getLog().error("deleteSpeaker failed")
                .withObject({
                  err: err,
                }).sendInternalLogToServer();
              var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.DELETE_SPEAKER_FAILED, "deleteSpeaker failed.", err);
              reject(error);
            }
          });
        }).catch(function (err) {
          reject(err);
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  VoiceId.prototype.startSession = function () {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      self.getDomainId().then(function (domainId) {
        const params = {
          "contactId": self.contactId,
          "instanceId": connect.core.getAgentDataProvider().getInstanceId(),
          "customerAccountId": connect.core.getAgentDataProvider().getAWSAccountId(),
          "clientToken": AWS.util.uuid.v4(),
          "domainId": domainId
        };
        connect.getLog().info("startSession called").withObject(params).sendInternalLogToServer();
        client.call(connect.AgentAppClientMethods.START_VOICE_ID_SESSION, params, {
          success: function (data) {
            if (data.sessionId) {
              resolve(data);
            } else {
              connect.getLog().error("startVoiceIdSession failed, no session id returned")
                .withObject({
                  data: data
                }).sendInternalLogToServer();
              var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.START_SESSION_FAILED, "No session id returned from start session api");
              reject(error);
            }
          },
          failure: function (err) {
            connect.getLog().error("startVoiceIdSession failed")
              .withObject({
                err: err
              }).sendInternalLogToServer();
            var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.START_SESSION_FAILED, "startVoiceIdSession failed", err);
            reject(error);
          }
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  VoiceId.prototype.evaluateSpeaker = function (startNew) {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    var pollTimes = 0;
    return new Promise(function (resolve, reject) {
      function evaluate() {
        self.getDomainId().then(function (domainId) {
          const params = {
            "SessionNameOrId": contactData.initialContactId || this.contactId,
            "DomainId": domainId
          };
          connect.getLog().info("evaluateSpeaker called").withObject(params).sendInternalLogToServer();
          client.call(connect.AgentAppClientMethods.EVALUATE_SESSION, params, {
            success: function (data) {
              if (++pollTimes < connect.VoiceIdConstants.EVALUATION_MAX_POLL_TIMES) {
                if (data.StreamingStatus === connect.VoiceIdStreamingStatus.PENDING_CONFIGURATION) {
                  setTimeout(evaluate, connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
                } else {
                  if (!data.AuthenticationResult) {
                    data.AuthenticationResult = {};
                    data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.NOT_ENABLED;
                  }

                  if (!data.FraudDetectionResult) {
                    data.FraudDetectionResult = {};
                    data.FraudDetectionResult.Decision = connect.ContactFlowFraudDetectionDecision.NOT_ENABLED;
                  }

                  // Resolve if both authentication and fraud detection are not enabled.
                  if (!self.isAuthEnabled(data.AuthenticationResult.Decision) &&
                    !self.isFraudEnabled(data.FraudDetectionResult.Decision)) {
                    connect.getLog().info("evaluateSpeaker succeeded").withObject(data).sendInternalLogToServer();
                    resolve(data);
                    return;
                  }

                  if (data.StreamingStatus === connect.VoiceIdStreamingStatus.ENDED) {
                    if (self.isAuthResultNotEnoughSpeech(data.AuthenticationResult.Decision)) {
                      data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.INCONCLUSIVE;
                    }
                    if (self.isFraudResultNotEnoughSpeech(data.FraudDetectionResult.Decision)) {
                      data.FraudDetectionResult.Decision = connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE;
                    }
                  }
                  // Voice print is not long enough for both authentication and fraud detection
                  if (self.isAuthResultInconclusive(data.AuthenticationResult.Decision) &&
                    self.isFraudResultInconclusive(data.FraudDetectionResult.Decision)) {
                    connect.getLog().info("evaluateSpeaker succeeded").withObject(data).sendInternalLogToServer();
                    resolve(data);
                    return;
                  }

                  if (!self.isAuthResultNotEnoughSpeech(data.AuthenticationResult.Decision) &&
                    self.isAuthEnabled(data.AuthenticationResult.Decision)) {
                    switch (data.AuthenticationResult.Decision) {
                      case connect.VoiceIdAuthenticationDecision.ACCEPT:
                        data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.AUTHENTICATED;
                        break;
                      case connect.VoiceIdAuthenticationDecision.REJECT:
                        data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.NOT_AUTHENTICATED;
                        break;
                      case connect.VoiceIdAuthenticationDecision.SPEAKER_OPTED_OUT:
                        data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.OPTED_OUT;
                        break;
                      case connect.VoiceIdAuthenticationDecision.SPEAKER_NOT_ENROLLED:
                        data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.NOT_ENROLLED;
                        break;
                      default:
                        data.AuthenticationResult.Decision = connect.ContactFlowAuthenticationDecision.ERROR;
                    }
                  }

                  if (!self.isFraudResultNotEnoughSpeech(data.FraudDetectionResult.Decision) &&
                    self.isFraudEnabled(data.FraudDetectionResult.Decision)) {
                    switch (data.FraudDetectionResult.Decision) {
                      case connect.VoiceIdFraudDetectionDecision.HIGH_RISK:
                        data.FraudDetectionResult.Decision = connect.ContactFlowFraudDetectionDecision.HIGH_RISK;
                        break;
                      case connect.VoiceIdFraudDetectionDecision.LOW_RISK:
                        data.FraudDetectionResult.Decision = connect.ContactFlowFraudDetectionDecision.LOW_RISK;
                        break;
                      default:
                        data.FraudDetectionResult.Decision = connect.ContactFlowFraudDetectionDecision.ERROR;
                    }
                  }

                  if (!self.isAuthResultNotEnoughSpeech(data.AuthenticationResult.Decision) &&
                    !self.isFraudResultNotEnoughSpeech(data.FraudDetectionResult.Decision)) {
                    // Resolve only when both authentication and fraud detection have results. Otherwise, keep polling.
                    connect.getLog().info("evaluateSpeaker succeeded").withObject(data).sendInternalLogToServer();
                    resolve(data);
                    return;
                  } else {
                    setTimeout(evaluate, connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
                  }
                }
              } else {
                connect.getLog().error("evaluateSpeaker timeout").sendInternalLogToServer();
                var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_TIMEOUT, "evaluateSpeaker timeout");
                reject(error);
              }
            },
            failure: function (err) {
              var error;
              var parsedErr = JSON.parse(err);
              switch (parsedErr.status) {
                case 400:
                case 404:
                  error = connect.VoiceIdError(connect.VoiceIdErrorTypes.SESSION_NOT_EXISTS, "evaluateSpeaker failed, session not exists", err);
                  connect.getLog().error("evaluateSpeaker failed, session not exists").withObject({ err: err }).sendInternalLogToServer();
                  break;
                default:
                  error = connect.VoiceIdError(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_FAILED, "evaluateSpeaker failed", err);
                  connect.getLog().error("evaluateSpeaker failed").withObject({ err: err }).sendInternalLogToServer();
              }
              reject(error);
            }
          })
        }).catch(function (err) {
          reject(err);
        });
      }

      if (!startNew) {
        self.syncSpeakerId().then(function () {
          evaluate();
        }).catch(function (err) {
          connect.getLog().error("syncSpeakerId failed when session startNew=false")
            .withObject({ err: err }).sendInternalLogToServer();
          reject(err);
        })
      } else {
        self.startSession().then(function (data) {
          self.syncSpeakerId().then(function (data) {
            setTimeout(evaluate, connect.VoiceIdConstants.EVALUATE_SESSION_DELAY);
          }).catch(function (err) {
            connect.getLog().error("syncSpeakerId failed when session startNew=true")
              .withObject({ err: err }).sendInternalLogToServer();
            reject(err);
          });
        }).catch(function (err) {
          connect.getLog().error("startSession failed when session startNew=true")
            .withObject({ err: err }).sendInternalLogToServer();
          reject(err)
        });
      }
    });
  };

  VoiceId.prototype.describeSession = function () {
    var self = this;
    var client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    return new Promise(function (resolve, reject) {
      self.getDomainId().then(function (domainId) {
        const params = {
          "SessionNameOrId": contactData.initialContactId || this.contactId,
          "DomainId": domainId
        };
        connect.getLog().info("describeSession called").withObject(params).sendInternalLogToServer();
        client.call(connect.AgentAppClientMethods.DESCRIBE_SESSION, params, {
          success: function (data) {
            resolve(data)
          },
          failure: function (err) {
            connect.getLog().error("describeSession failed")
              .withObject({
                err: err
              }).sendInternalLogToServer();
            var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.DESCRIBE_SESSION_FAILED, "describeSession failed", err);
            reject(error);
          }
        })
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  VoiceId.prototype.checkEnrollmentStatus = function (callbackOnAudioCollectionComplete) {
    connect.getLog().info("checkEnrollmentStatus called").sendInternalLogToServer();
    var self = this;
    var pollingTimes = 0;
    var callbackOnAudioCollectionCompleteHasBeenInvoked = false;

    return new Promise(function (resolve, reject) {
      function describe() {
        if (++pollingTimes < connect.VoiceIdConstants.ENROLLMENT_MAX_POLL_TIMES) {
          self.describeSession().then(function (data) {
            switch (data.Session.EnrollmentRequestDetails.Status) {
              case connect.VoiceIdEnrollmentRequestStatus.COMPLETED:
                resolve(data);
                break;
              case connect.VoiceIdEnrollmentRequestStatus.IN_PROGRESS:
                if (!callbackOnAudioCollectionCompleteHasBeenInvoked && typeof callbackOnAudioCollectionComplete === 'function') {
                  callbackOnAudioCollectionComplete(data);
                  callbackOnAudioCollectionCompleteHasBeenInvoked = true;
                }
                setTimeout(describe, connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
                break;
              case connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH:
                if (data.Session.StreamingStatus !== connect.VoiceIdStreamingStatus.ENDED) {
                  setTimeout(describe, connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
                } else {
                  setTimeout(function () {
                    self.startSession().then(function (data) {
                      describe();
                    }).catch(function (err, data) {
                      reject(err);
                    });
                  }, connect.VoiceIdConstants.START_SESSION_DELAY);
                }
                break;
              default:
                var message = data.Session.EnrollmentRequestDetails.Message ? data.Session.EnrollmentRequestDetails.Message : "enrollSpeaker failed. Unknown enrollment status has been received";
                connect.getLog().error(message).sendInternalLogToServer();
                var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_FAILED, message, data.Session.EnrollmentRequestDetails.Status);
                reject(error);
            }
          });
        } else {
          connect.getLog().error("enrollSpeaker timeout").sendInternalLogToServer();
          var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_TIMEOUT, "enrollSpeaker timeout");
          reject(error);
        }
      }
      describe();
    });
  };

  VoiceId.prototype.enrollSpeaker = function (callbackOnAudioCollectionComplete) {
    connect.getLog().info("enrollSpeaker called").sendInternalLogToServer();
    var self = this;
    self.checkConferenceCall();
    return new Promise(function (resolve, reject) {
      self.syncSpeakerId().then(function () {
        self.getSpeakerStatus().then(function (data) {
          if (data.Speaker && data.Speaker.Status == connect.VoiceIdSpeakerStatus.OPTED_OUT) {
            self.deleteSpeaker().then(function () {
              self.enrollSpeakerHelper(resolve, reject, callbackOnAudioCollectionComplete);
            }).catch(function (err) {
              reject(err);
            });
          } else {
            self.enrollSpeakerHelper(resolve, reject, callbackOnAudioCollectionComplete);
          }
        }).catch(function (err) {
          reject(err);
        })
      }).catch(function (err) {
        reject(err)
      })
    })
  }

  VoiceId.prototype.enrollSpeakerHelper = function (resolve, reject, callbackOnAudioCollectionComplete) {
    var self = this;
    var client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    self.getDomainId().then(function (domainId) {
      const params = {
        "SessionNameOrId": contactData.initialContactId || this.contactId,
        "DomainId": domainId
      };
      connect.getLog().info("enrollSpeakerHelper called").withObject(params).sendInternalLogToServer();
      client.call(connect.AgentAppClientMethods.ENROLL_BY_SESSION, params, {
        success: function (data) {
          if (data.Status === connect.VoiceIdEnrollmentRequestStatus.COMPLETED) {
            connect.getLog().info("enrollSpeaker succeeded").withObject(data).sendInternalLogToServer();
            resolve(data);
          } else {
            self.checkEnrollmentStatus(callbackOnAudioCollectionComplete).then(function (data) {
              connect.getLog().info("enrollSpeaker succeeded").withObject(data).sendInternalLogToServer();
              resolve(data);
            }).catch(function (err) {
              reject(err);
            })
          }
        },
        failure: function (err) {
          connect.getLog().error("enrollSpeaker failed")
            .withObject({
              err: err
            }).sendInternalLogToServer();
          var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_FAILED, "enrollSpeaker failed", err);
          reject(error);
        }
      });
    }).catch(function (err) {
      reject(err);
    });
  };

  // internal only
  VoiceId.prototype._updateSpeakerIdInLcms = function (speakerId, generatedSpeakerId) {
    var self = this;
    var client = connect.core.getClient();
    return new Promise(function (resolve, reject) {
      const params = {
        "ContactId": self.contactId,
        "InstanceId": connect.core.getAgentDataProvider().getInstanceId(),
        "AWSAccountId": connect.core.getAgentDataProvider().getAWSAccountId(),
        "CustomerId": connect.assertNotNull(speakerId, 'speakerId'),
        "VoiceIdResult": {
          "generatedSpeakerId": generatedSpeakerId
        }
      };
      connect.getLog().info("_updateSpeakerIdInLcms called").withObject(params).sendInternalLogToServer();
      client.call(connect.AgentAppClientMethods.UPDATE_VOICE_ID_DATA, params, {
        success: function (data) {
          connect.getLog().info("updateSpeakerIdInLcms succeeded").withObject(data).sendInternalLogToServer();
          resolve(data);
        },
        failure: function (err) {
          connect.getLog().error("updateSpeakerIdInLcms failed")
            .withObject({
              err: err,
            }).sendInternalLogToServer();
          var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED, "updateSpeakerIdInLcms failed", err);
          reject(error);
        }
      });
    });
  };

  VoiceId.prototype.updateSpeakerIdInVoiceId = function (speakerId) {
    var self = this;
    self.checkConferenceCall();
    var client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    return new Promise(function (resolve, reject) {
      self.getDomainId().then(function (domainId) {
        const params = {
          "SessionNameOrId": contactData.initialContactId || this.contactId,
          "SpeakerId": connect.assertNotNull(speakerId, 'speakerId'),
          "DomainId": domainId
        };
        connect.getLog().info("updateSpeakerIdInVoiceId called").withObject(params).sendInternalLogToServer();
        client.call(connect.AgentAppClientMethods.UPDATE_SESSION, params, {
          success: function (data) {
            connect.getLog().info("updateSpeakerIdInVoiceId succeeded").withObject(data).sendInternalLogToServer();
            var generatedSpeakerId = data && data.Session && data.Session.GeneratedSpeakerId;
            self._updateSpeakerIdInLcms(speakerId, generatedSpeakerId)
              .then(function () {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              });
          },
          failure: function (err) {
            var error;
            var parsedErr = JSON.parse(err);
            switch (parsedErr.status) {
              case 400:
              case 404:
                error = connect.VoiceIdError(connect.VoiceIdErrorTypes.SESSION_NOT_EXISTS, "updateSpeakerIdInVoiceId failed, session not exists", err);
                connect.getLog().error("updateSpeakerIdInVoiceId failed, session not exists").withObject({ err: err }).sendInternalLogToServer();
                break;
              default:
                error = connect.VoiceIdError(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_FAILED, "updateSpeakerIdInVoiceId failed", err);
                connect.getLog().error("updateSpeakerIdInVoiceId failed").withObject({ err: err }).sendInternalLogToServer();
            }
            reject(error);
          }
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  VoiceId.prototype.syncSpeakerId = function () {
    connect.getLog().info("syncSpeakerId called").sendInternalLogToServer();
    var self = this;
    return new Promise(function (resolve, reject) {
      self.getSpeakerId().then(function (data) {
        self.updateSpeakerIdInVoiceId(data.speakerId).then(function (data) {
          resolve(data);
        }).catch(function (err) {
          reject(err);
        })
      }).catch(function (err) {
        reject(err);
      });
    })
  }

  VoiceId.prototype.getDomainId = function () {
    return new Promise(function (resolve, reject) {
      const agent = new connect.Agent();
      if (!agent.getPermissions().includes(connect.AgentPermissions.VOICE_ID)) {
        reject(new Error("Agent doesn't have the permission for Voice ID"));
      } else if (connect.core.voiceIdDomainId) {
        resolve(connect.core.voiceIdDomainId);
      } else {
        var client = connect.core.getClient();
        const params = {
          "InstanceId": connect.core.getAgentDataProvider().getInstanceId(),
          "IntegrationType": "VOICE_ID"
        };
        connect.getLog().info("getDomainId called").withObject(params).sendInternalLogToServer();
        client.call(connect.AgentAppClientMethods.LIST_INTEGRATION_ASSOCIATIONS, params, {
          success: function (data) {
            try {
              var domainId;
              if (data.IntegrationAssociationSummaryList.length >= 1) {
                var integrationArn = data.IntegrationAssociationSummaryList[0].IntegrationArn;
                domainId = integrationArn.replace(/^.*domain\//i, '');
              }
              if (!domainId) {
                connect.getLog().info("getDomainId: no domainId found").sendInternalLogToServer();
                var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.NO_DOMAIN_ID_FOUND);
                reject(error);
                return;
              }
              connect.getLog().info("getDomainId succeeded").withObject(data).sendInternalLogToServer();
              connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
                event: connect.VoiceIdEvents.UPDATE_DOMAIN_ID,
                data: { domainId: domainId }
              });
              resolve(domainId);
            } catch (err) {
              connect.getLog().error("getDomainId failed").withObject({ err: err }).sendInternalLogToServer();
              var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED, "getDomainId failed", err);
              reject(error);
            }
          },
          failure: function (err) {
            connect.getLog().error("getDomainId failed").withObject({ err: err }).sendInternalLogToServer();
            var error = connect.VoiceIdError(connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED, "getDomainId failed", err);
            reject(error);
          }
        });
      }
    });
  }

  VoiceId.prototype.checkConferenceCall = function () {
    var self = this;
    var isConferenceCall = connect.core.getAgentDataProvider().getContactData(self.contactId).connections.filter(function (conn) {
      return connect.contains(connect.CONNECTION_ACTIVE_STATES, conn.state.type);
    }).length > 2;
    if (isConferenceCall) {
      throw new connect.NotImplementedError("VoiceId is not supported for conference calls");
    }
  }

  VoiceId.prototype.isAuthEnabled = function (authResult) {
    return authResult !== connect.ContactFlowAuthenticationDecision.NOT_ENABLED;
  }

  VoiceId.prototype.isAuthResultNotEnoughSpeech = function (authResult) {
    return authResult === connect.VoiceIdAuthenticationDecision.NOT_ENOUGH_SPEECH;
  }

  VoiceId.prototype.isAuthResultInconclusive = function (authResult) {
    return authResult === connect.ContactFlowAuthenticationDecision.INCONCLUSIVE;
  }

  VoiceId.prototype.isFraudEnabled = function (fraudResult) {
    return fraudResult !== connect.ContactFlowFraudDetectionDecision.NOT_ENABLED;
  }

  VoiceId.prototype.isFraudResultNotEnoughSpeech = function (fraudResult) {
    return fraudResult === connect.VoiceIdFraudDetectionDecision.NOT_ENOUGH_SPEECH;
  }

  VoiceId.prototype.isFraudResultInconclusive = function (fraudResult) {
    return fraudResult === connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE;
  }

  /**
   * @class VoiceConnection
   * @param {number} contactId
   * @param {number} connectionId
   * @description - Provides voice media specific operations
   */
  var VoiceConnection = function (contactId, connectionId) {
    this._speakerAuthenticator = new VoiceId(contactId);
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

  VoiceConnection.prototype.getVoiceIdSpeakerId = function () {
    return this._speakerAuthenticator.getSpeakerId();
  }

  VoiceConnection.prototype.getVoiceIdSpeakerStatus = function () {
    return this._speakerAuthenticator.getSpeakerStatus();
  }

  VoiceConnection.prototype.optOutVoiceIdSpeaker = function () {

    return this._speakerAuthenticator.optOutSpeaker();
  }

  VoiceConnection.prototype.deleteVoiceIdSpeaker = function () {
    return this._speakerAuthenticator.deleteSpeaker();
  }

  VoiceConnection.prototype.evaluateSpeakerWithVoiceId = function (startNew) {
    return this._speakerAuthenticator.evaluateSpeaker(startNew);
  }

  VoiceConnection.prototype.enrollSpeakerInVoiceId = function (callbackOnAudioCollectionComplete) {
    return this._speakerAuthenticator.enrollSpeaker(callbackOnAudioCollectionComplete);
  }

  VoiceConnection.prototype.updateVoiceIdSpeakerId = function (speakerId) {
    return this._speakerAuthenticator.updateSpeakerIdInVoiceId(speakerId);
  }

  VoiceConnection.prototype.getQuickConnectName = function () {
    return this._getData().quickConnectName;
  };

  VoiceConnection.prototype.isSilentMonitor = function () {
    return this.getMonitorStatus() === connect.MonitoringMode.SILENT_MONITOR;
  };

  VoiceConnection.prototype.isBarge = function () {
    return this.getMonitorStatus() === connect.MonitoringMode.BARGE;
  };

  VoiceConnection.prototype.isBargeEnabled = function () {
    var monitoringCapabilities = this.getMonitorCapabilities();
    return monitoringCapabilities && monitoringCapabilities.includes(connect.MonitoringMode.BARGE);
  };

  VoiceConnection.prototype.isSilentMonitorEnabled = function () {
    var monitoringCapabilities = this.getMonitorCapabilities();
    return monitoringCapabilities && monitoringCapabilities.includes(connect.MonitoringMode.SILENT_MONITOR);
  };

  VoiceConnection.prototype.getMonitorCapabilities = function () {
    return this._getData().monitorCapabilities;
  };

  VoiceConnection.prototype.getMonitorStatus = function () {
    return this._getData().monitorStatus;
  };

  VoiceConnection.prototype.isMute = function () {
    return this._getData().mute;
  };

  VoiceConnection.prototype.isForcedMute = function () {
    return this._getData().forcedMute;
  };

  VoiceConnection.prototype.muteParticipant = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.MUTE_PARTICIPANT, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  VoiceConnection.prototype.unmuteParticipant = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.UNMUTE_PARTICIPANT, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  VoiceConnection.prototype.canSendVideo = function () {
    const capabilities = this.getCapabilities();
    return capabilities && capabilities.Video === connect.VideoCapability.SEND;
  };

  VoiceConnection.prototype.canSendScreenShare = function () {
    const capabilities = this.getCapabilities();
    return capabilities && capabilities.ScreenShare === connect.ScreenShareCapability.SEND;
  };

  VoiceConnection.prototype.getCapabilities = function () {
    return this._getData().capabilities;
  };

  VoiceConnection.prototype.getVideoConnectionInfo = function () {
    const client = connect.core.getClient();
    const transportDetails = {
      transportType: connect.TRANSPORT_TYPES.WEB_RTC,
      contactId: this.contactId,
    };
    return new Promise(function (resolve, reject) {
      client.call(connect.ClientMethods.CREATE_TRANSPORT, transportDetails, {
        success: function (data) {
          connect.getLog().info("getVideoConnectionInfo succeeded").sendInternalLogToServer();
          resolve(data.webRTCTransport);
        },
        failure: function (err, data) {
          connect.getLog().error("getVideoConnectionInfo failed").sendInternalLogToServer()
            .withObject({
              err: err,
              data: data
            });
          reject(Error("getVideoConnectionInfo failed"));
        }
      });
    });
  };


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
          connect.getLog().error(connect.LogComponent.CHAT, "Connection data is invalid")
            .withObject(data)
            .withException(e)
            .sendInternalLogToServer();
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
    var client = connect.core.getClient();
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    var transportDetails = {
      transportType: connect.TRANSPORT_TYPES.CHAT_TOKEN,
      participantId: this.connectionId,
      contactId: this.contactId
    };
    return new Promise(function (resolve, reject) {
      client.call(connect.ClientMethods.CREATE_TRANSPORT, transportDetails, {
        success: function (data) {
          connect.getLog().info("getConnectionToken succeeded").sendInternalLogToServer();
          resolve(data);
        },
        failure: function (err, data) {
          connect.getLog().error("getConnectionToken failed").sendInternalLogToServer()
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

  ChatConnection.prototype.isBargeEnabled = function () {
    var monitoringCapabilities = this.getMonitorCapabilities();
    return monitoringCapabilities && monitoringCapabilities.includes(connect.MonitoringMode.BARGE);
  };

  ChatConnection.prototype.isSilentMonitorEnabled = function () {
    var monitoringCapabilities = this.getMonitorCapabilities();
    return monitoringCapabilities && monitoringCapabilities.includes(connect.MonitoringMode.SILENT_MONITOR);
  };

  ChatConnection.prototype.getMonitorCapabilities = function () {
    return this._getData().monitorCapabilities;
  };

  ChatConnection.prototype.isBarge = function () {
    return this.getMonitorStatus() === connect.MonitoringMode.BARGE;
  };

  ChatConnection.prototype.isSilentMonitor = function () {
    return this.getMonitorStatus() === connect.MonitoringMode.SILENT_MONITOR;
  };

  ChatConnection.prototype.getMonitorStatus = function () {
    return this._getData().monitorStatus;
  };

  /**
   * @class TaskConnection
   * @param {*} contactId
   * @param {*} connectionId
   * @description adds the task media specific functionality
   */
  var TaskConnection = function (contactId, connectionId) {
    Connection.call(this, contactId, connectionId);
  };
  TaskConnection.prototype = Object.create(Connection.prototype);
  TaskConnection.prototype.constructor = TaskConnection;

  TaskConnection.prototype.getMediaType = function () {
    return connect.MediaType.TASK;
  }

  TaskConnection.prototype.getMediaInfo = function () {
    var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
    var mediaObject = {
      contactId: this.contactId,
      initialContactId: contactData.initialContactId || this.contactId,
    };
    return mediaObject;
  };

  TaskConnection.prototype.getMediaController = function () {
    return connect.core.mediaFactory.get(this);
  };

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
   * the given topic, we become the master and start the function unless
   * shouldNotBecomeMasterIfNone is true.
   *
   * @param topic The master topic we are concerned about.
   * @param f_true The callback to be invoked if we are the master.
   * @param f_else [optional] A callback to be invoked if we are not the master.
   * @param shouldNotBecomeMasterIfNone [optional] if true, this tab won't become master.
   */
  connect.ifMaster = function (topic, f_true, f_else, shouldNotBecomeMasterIfNone) {
    connect.assertNotNull(topic, "A topic must be provided.");
    connect.assertNotNull(f_true, "A true callback must be provided.");

    if (!connect.core.masterClient) {
      // We can't be the master because there is no master client!
      connect.getLog().warn("We can't be the master for topic '%s' because there is no master client!", topic).sendInternalLogToServer();
      if (f_else) {
        f_else();
      }
      return;
    }

    var masterClient = connect.core.getMasterClient();
    masterClient.call(connect.MasterMethods.CHECK_MASTER, {
      topic: topic,
      shouldNotBecomeMasterIfNone: shouldNotBecomeMasterIfNone
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
   * Notify the shared worker and other CCP tabs that we are now the master for the given topic.
   */
  connect.becomeMaster = function (topic, successCallback, failureCallback) {
    connect.assertNotNull(topic, "A topic must be provided.");

    if (!connect.core.masterClient) {
      // We can't be the master because there is no master client!
      connect.getLog().warn("We can't be the master for topic '%s' because there is no master client!", topic);
      if (failureCallback) {
        failureCallback();
      }
    } else {
      var masterClient = connect.core.getMasterClient();
      masterClient.call(connect.MasterMethods.BECOME_MASTER, {
        topic: topic
      }, {
        success: function () {
          if (successCallback) {
            successCallback();
          }
        }
      });
    }
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
  connect.TaskConnection = TaskConnection;
  connect.ConnectionSnapshot = ConnectionSnapshot;
  connect.Endpoint = Endpoint;
  connect.Address = Endpoint;
  connect.SoftphoneError = SoftphoneError;
  connect.VoiceId = VoiceId;
  connect.QuickResponses = QuickResponses;
})();

