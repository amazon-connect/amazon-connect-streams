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

  connect.worker = {};

  var GET_AGENT_TIMEOUT_MS = 30000;
  var GET_AGENT_RECOVERY_TIMEOUT_MS = 5000;
  var GET_AGENT_SUCCESS_TIMEOUT_MS = 100;
  var LOG_BUFFER_CAP_SIZE = 400;

  var CHECK_ACTIVE_REGION_INTERVAL_MS = 60000;
  var CHECK_AUTH_TOKEN_INTERVAL_MS = 300000; // 5 minutes
  var REFRESH_AUTH_TOKEN_INTERVAL_MS = 10000; // 10 seconds
  var REFRESH_AUTH_TOKEN_MAX_TRY = 4;

  var GET_AGENT_CONFIGURATION_INTERVAL_MS = 30000;
  var GET_AGENT_CONFIGURATION_TIMEOUT_MS = 10000;

  var POLL_FOR_ACTIVE_REGION_METHOD = "LADS.GetAgentFailoverConfiguration";

  /**-----------------------------------------------------------------------*/
  var MasterTopicCoordinator = function () {
    this.topicMasterMap = {};
  };

  MasterTopicCoordinator.prototype.getMaster = function (topic) {
    connect.assertNotNull(topic, 'topic');
    return this.topicMasterMap[topic] || null;
  };

  MasterTopicCoordinator.prototype.setMaster = function (topic, id) {
    connect.assertNotNull(topic, 'topic');
    connect.assertNotNull(id, 'id');
    this.topicMasterMap[topic] = id;
  };

  MasterTopicCoordinator.prototype.removeMaster = function (id) {
    connect.assertNotNull(id, 'id');
    var self = this;

    connect.entries(this.topicMasterMap).filter(function (entry) {
      return entry.value === id;
    }).forEach(function (entry) {
      delete self.topicMasterMap[entry.key];
    });
  };

  /**---------------------------------------------------------------
   * class WorkerClient extends ClientBase
   */
  var WorkerClient = function (conduit) {
    connect.ClientBase.call(this);
    this.conduit = conduit;
  };
  WorkerClient.prototype = Object.create(connect.ClientBase.prototype);
  WorkerClient.prototype.constructor = WorkerClient;

  WorkerClient.prototype._callImpl = function (method, params, callbacks) {
    var self = this;
    var request_start = new Date().getTime();
    if(connect.containsValue(connect.AgentAppClientMethods, method)) {
      connect.core.getAgentAppClient()._callImpl(method, params, {
        success: function (data) {
          self._recordAPILatency(method, request_start);
          callbacks.success(data);
        },
        failure: function (error) {
          self._recordAPILatency(method, request_start, error);
          callbacks.failure(error);
        }
      })
    } else if(connect.containsValue(connect.TaskTemplatesClientMethods, method)) {
      connect.core.getTaskTemplatesClient()._callImpl(method, params, {
        success: function (data) {
          self._recordAPILatency(method, request_start);
          callbacks.success(data);
        },
        failure: function (error) {
          self._recordAPILatency(method, request_start, error);
          callbacks.failure(error);
        }
      })
    } else {
      connect.core.getClient()._callImpl(method, params, {
        success: function (data, dataAttribute) {
          self._recordAPILatency(method, request_start);
          callbacks.success(data, dataAttribute);
        },
        failure: function (error, data) {
          self._recordAPILatency(method, request_start, error);
          callbacks.failure(error, data);
        },
        authFailure: function (error, data) {
          self._recordAPILatency(method, request_start, error);
          callbacks.authFailure();
        },
        accessDenied: function (error, data) {
          self._recordAPILatency(method, request_start, error);
          callbacks.accessDenied && callbacks.accessDenied();
        }
      });
    }

  };

  WorkerClient.prototype._recordAPILatency = function (method, request_start, err) {
    var request_end = new Date().getTime();
    var request_time = request_end - request_start;
    this._sendAPIMetrics(method, request_time, err);
  };

  WorkerClient.prototype._sendAPIMetrics = function (method, time, err) {
    const eventData = {
      name: method,
      time,
      error: err,
      error5xx: 0
    };

    const dimensions = [
      { name: 'Category', value: 'API' },
    ];

    const statusCode = err && err.statusCode || 200;
    const retryStatus = err && err.retryStatus || connect.RetryStatus.NONE;
    const optionalDimensions = [
      { name: 'HttpStatusCode', value: statusCode },
      { name: 'HttpGenericStatusCode', value: `${statusCode.toString().charAt(0)}XX` },
      { name: 'RetryStatus', value: retryStatus },
    ];

    if (statusCode.toString().charAt(0) === '5') {
      eventData.error5xx = 1;
    }
    
    this.conduit.sendDownstream(connect.EventType.API_METRIC, {
        ...eventData,
        dimensions,
        optionalDimensions,
    });
  };

  /**-------------------------------------------------------------------------
   * The object responsible for polling and passing data downstream to all
   * consumer ports.
   */
  var ClientEngine = function () {
    var self = this;

    this.multiplexer = new connect.StreamMultiplexer();
    this.conduit = new connect.Conduit("AmazonConnectSharedWorker", null, this.multiplexer);
    this.client = new WorkerClient(this.conduit);
    this.timeout = null;
    this.agent = null;
    this.nextToken = null;
    this.initData = {};
    this.portConduitMap = {};
    this.streamMapByTabId = {};
    this.masterCoord = new MasterTopicCoordinator();
    this.logsBuffer = [];
    this.suppress = false;
    this.forceOffline = false;
    this.longPollingOptions = {
      allowLongPollingShadowMode: false,
      allowLongPollingWebsocketOnlyMode: false,
    }
    this.drPollingUrl = null;
    this.thisArn = null;
    this.otherArn = null;
    this.pendingFailover = null;
    var webSocketManager = null;

    connect.rootLogger = new connect.DownstreamConduitLogger(this.conduit);

    this.conduit.onDownstream(connect.EventType.SEND_LOGS, function (logsToUpload) {
      // Add softphone logs downstream
      connect.getLog().pushLogsDownstream(logsToUpload);

      self.logsBuffer = self.logsBuffer.concat(logsToUpload);
      //only call API to send logs if buffer reached cap
      if (self.logsBuffer.length > LOG_BUFFER_CAP_SIZE) {
        self.handleSendLogsRequest(self.logsBuffer);
      }
    });
    
    this.conduit.onDownstream(connect.DisasterRecoveryEvents.SUPPRESS, function (data) {
      connect.getLog().debug("[Disaster Recovery] Setting Suppress to %s", data.suppress)
        .sendInternalLogToServer();
      self.suppress = data.suppress || false;
      if (!self.suppress) {
        self.forceOffline = false; // if we are unsuppressing this region, clear retry flag for forceOffline
      }
      //shouldSendFailoverDownstream is undefined iff suppressContacts was called from the old DR artifact,
      //but it is false for the suppressContacts calls made when CCP initializes DR without DR polling enabled,
      //and for all suppressContacts calls made from the new DR artifact.
      const shouldSendFailoverDownstream = (typeof data.shouldSendFailoverDownstream === 'undefined' || data.shouldSendFailoverDownstream);
      //signal other windows that a failover happened, if following the old behavior pattern
      if (shouldSendFailoverDownstream) {
        self.conduit.sendDownstream(connect.DisasterRecoveryEvents.FAILOVER, {
          isPrimary: !self.suppress
        });
      }
    });

    this.conduit.onDownstream(connect.DisasterRecoveryEvents.FORCE_OFFLINE, function (data) {
      connect.getLog().debug("[Disaster Recovery] Setting FORCE_OFFLINE to %s", data.offline)
        .sendInternalLogToServer();
      //signal other windows that a failover happened, unless this force offline is being retried from a previous failure
      if (!self.forceOffline) {
        self.pendingFailover = false;
        self.conduit.sendDownstream(connect.DisasterRecoveryEvents.FAILOVER, {
          isPrimary: false,
          nextActiveArn: data.nextActiveArn
        });
      }
      self.forceOffline = data.offline || false;
    });

    connect.DisasterRecoveryEvents.INIT_DR_POLLING && this.conduit.onDownstream(connect.DisasterRecoveryEvents.INIT_DR_POLLING, function(data) {
      var log = connect.getLog();
      if (self.drPollingUrl) {
        log.debug(`[Disaster Recovery] Adding new CCP to active region polling for instance ${data.instanceArn}`)
          .sendInternalLogToServer();
        self.pollForActiveRegion(true, false);
      } else {
        log.info(`[Disaster Recovery] Initializing active region polling for instance ${data.instanceArn}`)
          .sendInternalLogToServer();
        self.thisArn = data.instanceArn;
        self.otherArn = data.otherArn;
        self.getPresignedDiscoveryUrl().then(
          (presignedUrl) => {
            self.drPollingUrl = presignedUrl;
            self.pollForActiveRegion(true, true);
          },
          (err) => {
            // Each worker is responsible for suppressing itself when needed. If this worker couldn't get a presigned URL,
            // it won't be able to detect whether it needs to be suppressed, but it may still be able to receive contacts.
            // If this should actually be the primary region after all, the other worker will trigger a force offline that will unsuppress this worker.
            log.error(`[Disaster Recovery] Failed to get presigned URL for instance ${data.instanceArn}; suppressing contacts`)
              .withException(err)
              .sendInternalLogToServer();
            self.suppress = true;
          }
        );
      }
    });

    this.conduit.onDownstream(connect.EventType.CONFIGURE, function (data) {
      console.log('@@@ configure event handler', data);
      try {
      if (data.authToken && data.authToken !== self.initData.authToken) {
        self.initData = data;
        connect.core.init(data);
        if (data.longPollingOptions) {
          if (typeof data.longPollingOptions.allowLongPollingShadowMode == "boolean") {
            self.longPollingOptions.allowLongPollingShadowMode = data.longPollingOptions.allowLongPollingShadowMode;
          }
          if (typeof data.longPollingOptions.allowLongPollingWebsocketOnlyMode == "boolean") {
            self.longPollingOptions.allowLongPollingWebsocketOnlyMode = data.longPollingOptions.allowLongPollingWebsocketOnlyMode;
          }
        }
        // init only once.
        if (!webSocketManager) {
          
          connect.getLog().info("Creating a new Websocket connection for CCP")
            .sendInternalLogToServer();

          connect.WebSocketManager.setGlobalConfig({
            loggerConfig: { logger: connect.getLog() }
          });

          webSocketManager = connect.WebSocketManager.create();

          webSocketManager.onInitFailure(function () {
            self.conduit.sendDownstream(connect.WebSocketEvents.INIT_FAILURE);
          });

          webSocketManager.onConnectionOpen(function (response) {
            self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_OPEN, response);
          });

          webSocketManager.onConnectionClose(function (response) {
            self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_CLOSE, response);
          });

          webSocketManager.onConnectionGain(function () {
            self.conduit.sendDownstream(connect.AgentEvents.WEBSOCKET_CONNECTION_GAINED);
            self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_GAIN);
          });

          webSocketManager.onConnectionLost(function (response) {
            self.conduit.sendDownstream(connect.AgentEvents.WEBSOCKET_CONNECTION_LOST, response);
            self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_LOST, response);
          });

          webSocketManager.onSubscriptionUpdate(function (response) {
            self.conduit.sendDownstream(connect.WebSocketEvents.SUBSCRIPTION_UPDATE, response);
          });

          webSocketManager.onSubscriptionFailure(function (response) {
            self.conduit.sendDownstream(connect.WebSocketEvents.SUBSCRIPTION_FAILURE, response);
          });

          webSocketManager.onAllMessage(function (response) {
            self.conduit.sendDownstream(connect.WebSocketEvents.ALL_MESSAGE, response);
          });

          self.conduit.onDownstream(connect.WebSocketEvents.SEND, function (message) {
            webSocketManager.sendMessage(message);
          });

          self.conduit.onDownstream(connect.WebSocketEvents.SUBSCRIBE, function (topics) {
            webSocketManager.subscribeTopics(topics);
          });

          webSocketManager.init(connect.hitch(self, self.getWebSocketUrl)).then(function(response) {
            try {
              if (response && !response.webSocketConnectionFailed) {
                // Start polling for agent data.
                connect.getLog().info("Kicking off agent polling")
                  .sendInternalLogToServer();
                self.pollForAgent();

                connect.getLog().info("Kicking off config polling")
                  .sendInternalLogToServer();
                self.pollForAgentConfiguration({ repeatForever: true });

                connect.getLog().info("Kicking off auth token polling")
                  .sendInternalLogToServer();
                global.setInterval(connect.hitch(self, self.checkAuthToken), CHECK_AUTH_TOKEN_INTERVAL_MS);
              } else {
                if (!connect.webSocketInitFailed) {
                  const event = connect.WebSocketEvents.INIT_FAILURE;
                  self.conduit.sendDownstream(event);
                  connect.webSocketInitFailed = true;
                  throw new Error(event);
                }
              }
            } catch (e) {
              connect.getLog().error("WebSocket failed to initialize")
                .withException(e)
                .sendInternalLogToServer();
            }
          });
        } else {
          connect.getLog().info("Not Initializing a new WebsocketManager instance, since one already exists")
            .sendInternalLogToServer();
        }
      }
      } catch (e) {
        console.error('@@@ error', e);
      }
    });
    this.conduit.onDownstream(connect.EventType.TERMINATE, function () {
      //upload pending logs before terminating.
      self.handleSendLogsRequest(self.logsBuffer);
      connect.core.terminate();
      self.conduit.sendDownstream(connect.EventType.TERMINATED);
    });
    this.conduit.onDownstream(connect.EventType.SYNCHRONIZE, function () {
      self.conduit.sendDownstream(connect.EventType.ACKNOWLEDGE);
    });
    this.conduit.onDownstream(connect.EventType.BROADCAST, function (data) {
      self.conduit.sendDownstream(data.event, data.data);
    });

    /**
     * Called when a consumer port connects to this SharedWorker.
     * Let's add them to our multiplexer.
     */
    global.onconnect = function (event) {
      var port = event.ports[0];
      var stream = new connect.PortStream(port);
      self.multiplexer.addStream(stream);
      port.start();

      var portConduit = new connect.Conduit(stream.getId(), null, stream);
      portConduit.sendDownstream(connect.EventType.ACKNOWLEDGE, { id: stream.getId() });

      self.portConduitMap[stream.getId()] = portConduit;
      self.conduit.sendDownstream(connect.EventType.UPDATE_CONNECTED_CCPS, { length: Object.keys(self.portConduitMap).length });

      if (self.agent !== null) {
        self.updateAgent();
      }

      portConduit.onDownstream(connect.EventType.API_REQUEST,
        connect.hitch(self, self.handleAPIRequest, portConduit));
      portConduit.onDownstream(connect.EventType.MASTER_REQUEST,
        connect.hitch(self, self.handleMasterRequest, portConduit, stream.getId()));
      portConduit.onDownstream(connect.EventType.RELOAD_AGENT_CONFIGURATION,
        connect.hitch(self, self.pollForAgentConfiguration));
      portConduit.onDownstream(connect.EventType.TAB_ID,
        connect.hitch(self, self.handleTabIdEvent, stream));
      portConduit.onDownstream(connect.EventType.CLOSE,
        connect.hitch(self, self.handleCloseEvent, stream));
    };
  };

  /**
   * Use the presigned URL previously retrieved for this ClientEngine to poll for the instance that should be active
   *    and what failover method should be used (soft or hard). We need to poll in one of three cases:
   * 1) We are initializing CCPs for a DR setup where the shared workers were not already running
   *    (i.e. no CCPs already open)
   * 2) We are initializing additional CCPs for a DR setup where the shared workers were already running
   *    (i.e. this is an additional window for this DR setup)
   * 3) We have already polled successfully in this shared worker, and are continuing with the ongoing
   *    polling cycle on a regular interval. (steady-state polling)
   *
   * Polling in cases 1 and 2 is done to ensure the newly-opened DR window is showing the correct region.
   *
   * Typically, failover of the UI (to display the CCP for the newly-active region) will be triggered by
   *    the region that is being set to inactive, after it has been forced offline.
   * The exception is in cases 1 and 2, where both regions' workers will send a UI failover signal.
   * If the region assumed to be the initial primary is degraded at bootstrap time (so it can't request a URL to use for polling),
   *    but the other region is not, and its polling response says it should be made primary, we need that other
   *    instance's worker to be able to tell the UI to fail over to it. (The UI in each DR window will ignore
   *    signals to fail over to the instance already being shown in that window.)
   *
   * The URL used for polling will be global, but the endpoint used to get the URL is regional, so once bootstrapping is complete,
   *    the active region should be able to detect that it needs to be failed out even if its AWS region is degraded.
   */
    ClientEngine.prototype.pollForActiveRegion = function(isFirstPollForCCP, isFirstPollForWorker) {
      var self = this;
      var log = connect.getLog();
      if (!self.drPollingUrl) {
        throw new connect.StateError("[Disaster Recovery] Tried to poll for active region without first initializing DR polling in the worker.");
      }
      log.debug(`[Disaster Recovery] Polling for failover with presigned URL for instance ${self.thisArn}`).sendInternalLogToServer();
      var request_start = new Date().getTime();
      return connect.fetchWithTimeout(self.drPollingUrl, GET_AGENT_CONFIGURATION_TIMEOUT_MS)
        .catch(response => {
          if (response.status) {
            self.client._recordAPILatency(POLL_FOR_ACTIVE_REGION_METHOD, request_start, {statusCode: response.status});
            if ([connect.HTTP_STATUS_CODES.ACCESS_DENIED, connect.HTTP_STATUS_CODES.UNAUTHORIZED].includes(response.status)) {
              log.info("[Disaster Recovery] Active region polling failed; trying to get a new URL for polling.").withObject(response).sendInternalLogToServer();
              return self.getPresignedDiscoveryUrl().then((presignedUrl) => {
                self.drPollingUrl = presignedUrl;
              }).then(() => {
                request_start = new Date().getTime(); // reset request start marker if we had to get a new polling URL
                return connect.fetchWithTimeout(self.drPollingUrl, GET_AGENT_CONFIGURATION_TIMEOUT_MS)
              });
            } else {
              var errMsg = `[Disaster Recovery] Failed to poll for failover for instance ${self.thisArn}, ` +
              `received unexpected response code ${response.status}`;
              log.error(errMsg).withObject(response).sendInternalLogToServer();
              throw new Error(errMsg);
            }
          } else {
            var errMsg = `[Disaster Recovery] Failed to poll for failover for instance ${self.thisArn}, request timed out or aborted`;
            self.client._recordAPILatency(POLL_FOR_ACTIVE_REGION_METHOD, request_start, {statusCode: -1});
            log.error(errMsg).withObject(response).sendInternalLogToServer();
            throw new Error(errMsg);
          }
        })
        .then(response => {
          self.client._recordAPILatency(POLL_FOR_ACTIVE_REGION_METHOD, request_start);
          if (typeof response.TerminateActiveContacts !== 'boolean') {
            log.error("[Disaster Recovery] DR polling response did not contain a valid value for TerminateActiveContacts.").withObject(response).sendInternalLogToServer();
            return;
          }
          var softFailover = !response.TerminateActiveContacts;
          if (!response.InstanceArn) {
            log.error("[Disaster Recovery] DR polling response did not contain a truthy active instance ARN.").withObject(response).sendInternalLogToServer();
            return;
          } else {
            log.debug(`[Disaster Recovery] Successfully polled for active region. Primary instance ARN is ${response.InstanceArn} ` +
              `and soft failover is ${softFailover ? "enabled" : "disabled"}`).sendInternalLogToServer();
          }
  
          if (self.thisArn === response.InstanceArn && !self.suppress && isFirstPollForCCP) {
            log.debug(`[Disaster Recovery] Instance ${self.thisArn} is being set to primary`).sendInternalLogToServer();
            self.conduit.sendDownstream(connect.DisasterRecoveryEvents.FAILOVER, {
              nextActiveArn: response.InstanceArn
            });
          } else if (self.otherArn === response.InstanceArn) {
            // If this poll is to bootstrap the correct region in a newly-opened additional CCP window, and soft failover is enabled,
            // and a soft failover has already/will be queued to occur once the current voice contact is destroyed, send a UI failover signal
            // to ensure the new window will display the previous primary region, in case soft failover will delay the UI failover.
            // Otherwise, the new window may show the wrong region until soft failover completes.
            if (softFailover && !isFirstPollForWorker && isFirstPollForCCP && (!self.suppress || self.pendingFailover)) {
              self.conduit.sendDownstream(connect.DisasterRecoveryEvents.FAILOVER, {
                nextActiveArn: self.thisArn
              });
            }
  
            if (!self.suppress) {
              self.suppress = true;
              const willSoftFailover = softFailover && !isFirstPollForWorker;
              if (willSoftFailover) {
                self.pendingFailover = true;
                log.debug(`[Disaster Recovery] Instance ${self.thisArn} will be set to stand-by using soft failover`).sendInternalLogToServer();
              } else {
                log.debug(`[Disaster Recovery] Instance ${self.thisArn} is being set to stand-by immediately`).sendInternalLogToServer();
              }
              self.conduit.sendDownstream(connect.DisasterRecoveryEvents.FORCE_OFFLINE, {softFailover: willSoftFailover, nextActiveArn: response.InstanceArn});
            }
          } else if (![self.thisArn, self.otherArn].includes(response.InstanceArn)) {
            log.error(`[Disaster Recovery] The current primary instance in this agent's failover group ${response.InstanceArn} ` +
              `doesn't match this instance ${self.thisArn} or the other instance ${self.otherArn}`).sendInternalLogToServer();
          }
        }).catch((response) => {
          if (response.status) {
            self.client._recordAPILatency(POLL_FOR_ACTIVE_REGION_METHOD, request_start, {...response, statusCode: response.status});
          }
          log.error(`[Disaster Recovery] Active region polling failed for instance ${self.thisArn}.`).withObject(response).sendInternalLogToServer();
        }).finally(() => {
          // This polling run should only schedule another poll if the worker has just started, or if this poll was triggered by schedule
          // otherwise, the polling performed when opening each additional CCP window will create its own polling schedule
          if (isFirstPollForWorker || !isFirstPollForCCP) {
            global.setTimeout(connect.hitch(self, self.pollForActiveRegion), CHECK_ACTIVE_REGION_INTERVAL_MS);
          }
        });
    };
  
    // Retrieve pre-signed URL to poll for agent discovery status
    ClientEngine.prototype.getPresignedDiscoveryUrl = function() {
      var self = this;
      return new Promise((resolve, reject) => {
        connect.getLog().info(`[Disaster Recovery] Getting presigned URL for instance ${self.thisArn}`).sendInternalLogToServer();
        this.client.call(connect.ClientMethods.CREATE_TRANSPORT, {transportType: connect.TRANSPORT_TYPES.AGENT_DISCOVERY}, {
          success: function (data) {
            if (data && data.agentDiscoveryTransport && data.agentDiscoveryTransport.presignedUrl) {
              connect.getLog().info("getPresignedDiscoveryUrl succeeded").sendInternalLogToServer();
              resolve(data.agentDiscoveryTransport.presignedUrl);
            } else {
              connect.getLog().info("getPresignedDiscoveryUrl received empty/invalid data").withObject(data).sendInternalLogToServer();
              reject(Error("getPresignedDiscoveryUrl received empty/invalid data"));
            }
          },
          failure: function (err, data) {
            connect.getLog().error(`[Disaster Recovery] Failed to get presigned URL for instance ${self.thisArn}`)
              .withException(err)
              .withObject(data)
              .sendInternalLogToServer();
            reject(new Error('Failed to get presigned URL'));
          },
          authFailure: function () {
            connect.hitch(self, self.handleAuthFail)();
            reject(new Error('Encountered auth failure when getting presigned URL'));
          },
          accessDenied: function () {
            connect.hitch(self, self.handleAccessDenied)();
            reject(new Error('Encountered access denied when getting presigned URL'));
          }
        });
      });
    };

  ClientEngine.prototype.pollForAgent = function () {
    var self = this;
    var onAuthFail = connect.hitch(self, self.handlePollingAuthFail);


    this.client.call(connect.ClientMethods.GET_AGENT_SNAPSHOT, {
      nextToken: self.nextToken,
      timeout: GET_AGENT_TIMEOUT_MS
    }, {
      success: function (data, dataAttribute) {
        try {
          self.agent = self.agent || {};
          self.agent.snapshot = data.snapshot;
          self.agent.snapshot.localTimestamp = connect.now();
          self.agent.snapshot.skew = self.agent.snapshot.snapshotTimestamp - self.agent.snapshot.localTimestamp;
          self.nextToken = data.nextToken;
          if (dataAttribute && dataAttribute.hasOwnProperty('contentLength')) {
            self.agent.snapshot.contentLength = dataAttribute.contentLength;
          }
          connect.getLog().trace("GET_AGENT_SNAPSHOT succeeded.")
            .withObject(data)
            .sendInternalLogToServer();
          self.updateAgent();
        } catch (e) {
          connect.getLog().error("Long poll failed to update agent.")
            .withObject(data)
            .withException(e)
            .sendInternalLogToServer();
        } finally {
          global.setTimeout(connect.hitch(self, self.pollForAgent), GET_AGENT_SUCCESS_TIMEOUT_MS);
        }
      },
      failure: function (err, data) {
        try {
          connect.getLog().error("Failed to get agent data.")
            .sendInternalLogToServer()
            .withObject({
              err: err,
              data: data
            });

        } finally {
          global.setTimeout(connect.hitch(self, self.pollForAgent), GET_AGENT_RECOVERY_TIMEOUT_MS);
        }
      },
      authFailure: function () {
        onAuthFail();
      },
      accessDenied: connect.hitch(self, self.handleAccessDenied)

    });

  };

  ClientEngine.prototype.pollForAgentConfiguration = function (paramsIn) {
    var self = this;
    var params = paramsIn || {};
    var onAuthFail = connect.hitch(self, self.handlePollingAuthFail);

    this.client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, {}, {
      success: function (data) {
        var configuration = data.configuration;
        self.pollForAgentPermissions(configuration);
        self.pollForAgentStates(configuration);
        self.pollForDialableCountryCodes(configuration);
        self.pollForRoutingProfileQueues(configuration);
        if (params.repeatForever) {
          global.setTimeout(connect.hitch(self, self.pollForAgentConfiguration, params),
            GET_AGENT_CONFIGURATION_INTERVAL_MS);
        }
      },
      failure: function (err, data) {
        try {
          connect.getLog().error("Failed to fetch agent configuration data.")
            .sendInternalLogToServer()
            .withObject({
              err: err,
              data: data
            });
        } finally {
          if (params.repeatForever) {
            global.setTimeout(connect.hitch(self, self.pollForAgentConfiguration),
              GET_AGENT_CONFIGURATION_INTERVAL_MS, params);
          }
        }
      },
      authFailure: function () {
        onAuthFail();
      },
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.pollForAgentStates = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_AGENT_STATES, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults

    }, {
      success: function (data) {
        if (data.nextToken) {
          self.pollForAgentStates(configuration, {
            states: (params.states || []).concat(data.states),
            nextToken: data.nextToken,
            maxResults: params.maxResults
          });

        } else {
          configuration.agentStates = (params.states || []).concat(data.states);
          self.updateAgentConfiguration(configuration);
        }
      },
      failure: function (err, data) {
        connect.getLog().error("Failed to fetch agent states list.")
          .sendInternalLogToServer()
          .withObject({
            err: err,
            data: data
          });
      },
      authFailure: connect.hitch(self, self.handlePollingAuthFail),
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.pollForAgentPermissions = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_AGENT_PERMISSIONS, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults

    }, {
      success: function (data) {
        if (data.nextToken) {
          self.pollForAgentPermissions(configuration, {
            permissions: (params.permissions || []).concat(data.permissions),
            nextToken: data.nextToken,
            maxResults: params.maxResults
          });

        } else {
          configuration.permissions = (params.permissions || []).concat(data.permissions);
          self.updateAgentConfiguration(configuration);
        }
      },
      failure: function (err, data) {
        connect.getLog().error("Failed to fetch agent permissions list.")
          .sendInternalLogToServer()
          .withObject({
            err: err,
            data: data
          });
      },
      authFailure: connect.hitch(self, self.handlePollingAuthFail),
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.pollForDialableCountryCodes = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_DIALABLE_COUNTRY_CODES, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults
    }, {
      success: function (data) {
        if (data.nextToken) {
          self.pollForDialableCountryCodes(configuration, {
            countryCodes: (params.countryCodes || []).concat(data.countryCodes),
            nextToken: data.nextToken,
            maxResults: params.maxResults
          });

        } else {
          configuration.dialableCountries = (params.countryCodes || []).concat(data.countryCodes);
          self.updateAgentConfiguration(configuration);
        }
      },
      failure: function (err, data) {
        connect.getLog().error("Failed to fetch dialable country codes list.")
          .sendInternalLogToServer()
          .withObject({
            err: err,
            data: data
          });
      },
      authFailure: connect.hitch(self, self.handlePollingAuthFail),
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.pollForRoutingProfileQueues = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_ROUTING_PROFILE_QUEUES, {
      routingProfileARN: configuration.routingProfile.routingProfileARN,
      nextToken: params.nextToken || null,
      maxResults: params.maxResults
    }, {
      success: function (data) {
        if (data.nextToken) {
          self.pollForRoutingProfileQueues(configuration, {
            countryCodes: (params.queues || []).concat(data.queues),
            nextToken: data.nextToken,
            maxResults: params.maxResults
          });

        } else {
          configuration.routingProfile.queues = (params.queues || []).concat(data.queues);
          self.updateAgentConfiguration(configuration);
        }
      },
      failure: function (err, data) {
        connect.getLog().error("Failed to fetch routing profile queues list.")
          .sendInternalLogToServer()
          .withObject({
            err: err,
            data: data
          });
      },
      authFailure: connect.hitch(self, self.handlePollingAuthFail),
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.handleAPIRequest = function (portConduit, request) {
    var self = this;

    this.client.call(request.method, request.params, {
      success: function (data) {
        var response = connect.EventFactory.createResponse(connect.EventType.API_RESPONSE, request, data);
        portConduit.sendDownstream(response.event, response);
      },
      failure: function (err, data) {
        var response = connect.EventFactory.createResponse(connect.EventType.API_RESPONSE, request, data, JSON.stringify(err));
        portConduit.sendDownstream(response.event, response);
        connect.getLog().error("'%s' API request failed", request.method)
          .withObject({ request: self.filterAuthToken(request), response: response })
          .withException(err)
          .sendInternalLogToServer();
      },
      authFailure: connect.hitch(self, self.handleAuthFail, {authorize: true})
    });
  };

  /**
   * Handle incoming master query or modification requests from connected tab ports.
   */
  ClientEngine.prototype.handleMasterRequest = function (portConduit, portId, request) {
    var multiplexerConduit = this.conduit;
    var response = null;

    switch (request.method) {
      case connect.MasterMethods.BECOME_MASTER:
        var masterId = this.masterCoord.getMaster(request.params.topic);
        var takeOver = Boolean(masterId) && masterId !== portId;
        this.masterCoord.setMaster(request.params.topic, portId);
        response = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: portId,
          takeOver: takeOver,
          topic: request.params.topic
        });
        if (takeOver) {
          multiplexerConduit.sendDownstream(response.event, response);
        }
        break;

      case connect.MasterMethods.CHECK_MASTER:
        var masterId = this.masterCoord.getMaster(request.params.topic);
        if (!masterId && !request.params.shouldNotBecomeMasterIfNone) {
          this.masterCoord.setMaster(request.params.topic, portId);
          masterId = portId;
        }
        response = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: masterId,
          isMaster: portId === masterId,
          topic: request.params.topic
        });
        break;

      default:
        throw new Error("Unknown master method: " + request.method);
    }

    portConduit.sendDownstream(response.event, response);
  };

  ClientEngine.prototype.handleTabIdEvent = function (stream, data) {
    var self = this;
    try {
      let tabId = data.tabId;
      let streamsInThisTab = self.streamMapByTabId[tabId];
      let currentStreamId = stream.getId();
      let tabIds = Object.keys(self.streamMapByTabId);
      let streamsTabsAcrossBrowser = tabIds.filter(tabId => self.streamMapByTabId[tabId].length > 0).length;
      if (streamsInThisTab && streamsInThisTab.length > 0){
        if (!streamsInThisTab.includes(currentStreamId)) {
          self.streamMapByTabId[tabId].push(currentStreamId);
          let updateObject = { length: Object.keys(self.portConduitMap).length, tabId, streamsTabsAcrossBrowser };
          updateObject[tabId] = { length: streamsInThisTab.length };
          self.conduit.sendDownstream(connect.EventType.UPDATE_CONNECTED_CCPS, updateObject);
        }
      }
      else {
        self.streamMapByTabId[tabId] = [stream.getId()];
        let updateObject = { length: Object.keys(self.portConduitMap).length, tabId, streamsTabsAcrossBrowser: streamsTabsAcrossBrowser + 1 };
        updateObject[tabId] = { length: self.streamMapByTabId[tabId].length };
        self.conduit.sendDownstream(connect.EventType.UPDATE_CONNECTED_CCPS, updateObject);
      }
    } catch(e) {
      connect.getLog().error("[Tab Ids] Issue updating connected CCPs within the same tab").withException(e).sendInternalLogToServer();
    }
  };

  ClientEngine.prototype.handleCloseEvent = function(stream) {
    var self = this;
    self.multiplexer.removeStream(stream);
    delete self.portConduitMap[stream.getId()];
    self.masterCoord.removeMaster(stream.getId());
    let updateObject = { length: Object.keys(self.portConduitMap).length };
    let tabIds = Object.keys(self.streamMapByTabId);
    try {
      let tabId = tabIds.find(key => self.streamMapByTabId[key].includes(stream.getId()));
      if (tabId) {
        let streamIndexInMap = self.streamMapByTabId[tabId].findIndex((value) => stream.getId() === value);
        self.streamMapByTabId[tabId].splice(streamIndexInMap, 1);
        let tabLength = self.streamMapByTabId[tabId] ? self.streamMapByTabId[tabId].length : 0;
        updateObject[tabId] = { length: tabLength };
        updateObject.tabId = tabId;
      }
      let streamsTabsAcrossBrowser = tabIds.filter(tabId => self.streamMapByTabId[tabId].length > 0).length;
      updateObject.streamsTabsAcrossBrowser = streamsTabsAcrossBrowser;
    } catch(e) {
      connect.getLog().error("[Tab Ids] Issue updating tabId-specific stream data").withException(e).sendInternalLogToServer();
    }
    self.conduit.sendDownstream(connect.EventType.UPDATE_CONNECTED_CCPS, updateObject);
  };

  ClientEngine.prototype.updateAgentConfiguration = function (configuration) {
    if (configuration.permissions &&
      configuration.dialableCountries &&
      configuration.agentStates &&
      configuration.routingProfile.queues) {

      this.agent = this.agent || {};
      this.agent.configuration = configuration;
      this.updateAgent();

    } else {
      connect.getLog().trace("Waiting to update agent configuration until all config data has been fetched.")
        .sendInternalLogToServer();
    }
  };

  ClientEngine.prototype.updateAgent = function () {
    if (!this.agent) {
      connect.getLog().trace("Waiting to update agent until the agent has been fully constructed.")
        .sendInternalLogToServer();

    } else if (!this.agent.snapshot) {
      connect.getLog().trace("Waiting to update agent until the agent snapshot is available.")
        .sendInternalLogToServer();

    } else if (!this.agent.configuration) {
      connect.getLog().trace("Waiting to update agent until the agent configuration is available.")
        .sendInternalLogToServer();

    } else {
      // Alias some of the properties for backwards compatibility.
      this.agent.snapshot.status = this.agent.state;

      // Sort the contacts on the timestamp
      if (this.agent.snapshot.contacts && this.agent.snapshot.contacts.length > 1) {
        this.agent.snapshot.contacts.sort(function (contactA, contactB) {
          return contactA.state.timestamp.getTime() - contactB.state.timestamp.getTime();
        });
      }

      this.agent.snapshot.contacts.forEach(function (contact) {
        contact.status = contact.state;

        contact.connections.forEach(function (connection) {
          connection.address = connection.endpoint;
        });
      });

      this.agent.configuration.routingProfile.defaultOutboundQueue.queueId =
        this.agent.configuration.routingProfile.defaultOutboundQueue.queueARN;
      this.agent.configuration.routingProfile.queues.forEach(function (queue) {
        queue.queueId = queue.queueARN;
      });
      this.agent.snapshot.contacts.forEach(function (contact) {
        //contact.queue is null when monitoring
        if (contact.queue !== undefined) {
          contact.queue.queueId = contact.queue.queueARN;
        }
      });
      this.agent.configuration.routingProfile.routingProfileId =
        this.agent.configuration.routingProfile.routingProfileARN;

      if (this.suppress) {
        this.agent.snapshot.contacts = this.agent.snapshot.contacts.filter(function(contact){
          return (contact.state.type == connect.ContactStateType.CONNECTED || contact.state.type == connect.ContactStateType.ENDED);
        });
        if (this.forceOffline) {
          this.conduit.sendDownstream(connect.DisasterRecoveryEvents.FORCE_OFFLINE);
        }
      }
      this.conduit.sendDownstream(connect.AgentEvents.UPDATE, this.agent);
    }
  };

  /**
   * Provides a websocket url through the create_transport API.
   * @returns a promise which, upon success, returns the response from the createTransport API.
   */
  ClientEngine.prototype.getWebSocketUrl = function () {
    var self = this;
    var client = connect.core.getClient();
    var onAuthFail = connect.hitch(self, self.handleAuthFail);
    var onAccessDenied = connect.hitch(self, self.handleAccessDenied);
    return new Promise(function (resolve, reject) {
      client.call(connect.ClientMethods.CREATE_TRANSPORT, { transportType: connect.TRANSPORT_TYPES.WEB_SOCKET }, {
        success: function (data) {
          connect.getLog().info("getWebSocketUrl succeeded").sendInternalLogToServer();
          resolve(data);
        },
        failure: function (err, data) {
          connect.getLog().error("getWebSocketUrl failed")
            .sendInternalLogToServer()
            .withObject({
              err: err,
              data: data
            });
          reject({
            reason: 'getWebSocketUrl failed',
            _debug: err
          });
        },
        authFailure: function () {
          connect.getLog().error("getWebSocketUrl Auth Failure").sendInternalLogToServer();
          reject(Error("Authentication failed while getting getWebSocketUrl"));
          onAuthFail();
        },
        accessDenied: function () {
          connect.getLog().error("getWebSocketUrl Access Denied Failure").sendInternalLogToServer();
          reject(Error("Access Denied Failure while getting getWebSocketUrl"));
          onAccessDenied();
        }
      });
    });
  };


  /**
    * Send a message downstream to all consumers when we detect that authentication
    * against one of our APIs has failed.
    */
  ClientEngine.prototype.handleSendLogsRequest = function () {
    var self = this;
    var logEvents = [];
    var logsToSend = self.logsBuffer.slice();
    self.logsBuffer = [];
    logsToSend.forEach(function (log) {
      logEvents.push({
        timestamp: log.time,
        component: log.component,
        message: log.text
      });
    });
    this.client.call(connect.ClientMethods.SEND_CLIENT_LOGS, { logEvents: logEvents }, {
      success: function (data) {
        connect.getLog().info("SendLogs request succeeded.").sendInternalLogToServer();
      },
      failure: function (err, data) {
        connect.getLog().error("SendLogs request failed.")
          .withObject(data).withException(err)
          .sendInternalLogToServer();
      },
      authFailure: connect.hitch(self, self.handleAuthFail)
    });
  };

  ClientEngine.prototype.handleAuthFail = function (data) {
    var self = this;
    if (data) {
      self.conduit.sendDownstream(connect.EventType.AUTH_FAIL, data);
    }
    else {
      self.conduit.sendDownstream(connect.EventType.AUTH_FAIL);
    }
  };

  ClientEngine.prototype.handlePollingAuthFail = function () {
    var self = this;
    self.conduit.sendDownstream(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED);
  }

  ClientEngine.prototype.handleAccessDenied = function () {
    var self = this;
    self.conduit.sendDownstream(connect.EventType.ACCESS_DENIED);
  };

  ClientEngine.prototype.checkAuthToken = function () {
    var self = this;
    var expirationDate = new Date(self.initData.authTokenExpiration);
    var currentTimeStamp = new Date().getTime();
    var thirtyMins = 30 * 60 * 1000;

    // refresh token 30 minutes before expiration
    if (expirationDate.getTime() < (currentTimeStamp + thirtyMins)) {
      connect.getLog().info("Auth token expires at " + expirationDate + " Start refreshing token with retry.")
        .sendInternalLogToServer();
      connect.backoff(connect.hitch(self, self.authorize), REFRESH_AUTH_TOKEN_INTERVAL_MS, REFRESH_AUTH_TOKEN_MAX_TRY);
    }
  };


  ClientEngine.prototype.authorize = function (callbacks) {
    var self = this;
    connect.core.authorize(this.initData.authorizeEndpoint).then(function (response) {
      var expiration = new Date(response.expiration);
      connect.getLog().info("Authorization succeeded and the token expires at %s", expiration)
        .sendInternalLogToServer();
      self.initData.authToken = response.accessToken;
      self.initData.authTokenExpiration = expiration;
      connect.core.initClient(self.initData);
      connect.core.initAgentAppClient(self.initData);
      callbacks.success();
    }).catch(function (response) {
      connect.getLog().error("Authorization failed with code %s", response.status)
        .sendInternalLogToServer();
      if (response.status === 401) {
        self.handleAuthFail();
      } else {
        callbacks.failure();
      }
    });
  };

  /**
   * Filter the 'authentication' field of the request params from the given API_REQUEST event.
   */
  ClientEngine.prototype.filterAuthToken = function (request) {
    var new_request = {};

    for (var keyA in request) {
      if (keyA === 'params') {
        var new_params = {};
        for (var keyB in request.params) {
          if (keyB !== 'authentication') {
            new_params[keyB] = request.params[keyB];
          }
        }

        new_request.params = new_params;
      } else {
        new_request[keyA] = request[keyA];
      }
    }

    return new_request;
  };

  /**-----------------------------------------------------------------------*/
  connect.worker.main = function () {
    connect.worker.clientEngine = new ClientEngine();
  };

})();