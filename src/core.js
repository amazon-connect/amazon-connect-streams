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
 
  connect.core = {};
  connect.core.initialized = false;
  connect.version = "STREAMS_VERSION";
  connect.DEFAULT_BATCH_SIZE = 500;
 
  var CCP_SYN_TIMEOUT = 1000; // 1 sec
  var CCP_ACK_TIMEOUT = 3000; // 3 sec
  var CCP_LOAD_TIMEOUT = 3000; // 3 sec
  var CCP_IFRAME_REFRESH_INTERVAL = 5000; // 5 sec
 
  var LEGACY_LOGIN_URL_PATTERN = "https://{alias}.awsapps.com/auth/?client_id={client_id}&redirect_uri={redirect}";
  var CLIENT_ID_MAP = {
    "us-east-1": "06919f4fd8ed324e"
  };
 
  var AUTHORIZE_ENDPOINT = "/auth/authorize";
  var LEGACY_AUTHORIZE_ENDPOINT = "/connect/auth/authorize";
  var AUTHORIZE_RETRY_INTERVAL = 2000;
  var AUTHORIZE_MAX_RETRY = 5;
 
  var LEGACY_WHITELISTED_ORIGINS_ENDPOINT = "/connect/whitelisted-origins";
  var WHITELISTED_ORIGINS_ENDPOINT = "/whitelisted-origins";
  var WHITELISTED_ORIGINS_RETRY_INTERVAL = 2000;
  var WHITELISTED_ORIGINS_MAX_RETRY = 5;
 
  /**
   * @deprecated
   * This function was only meant for internal use. 
   * The name is misleading for what it should do.
   * Internally we have replaced its usage with `getLoginUrl`.
   */
  var createLoginUrl = function (params) {
    var redirect = "https://lily.us-east-1.amazonaws.com/taw/auth/code";
    connect.assertNotNull(redirect);
 
    if (params.loginUrl) {
      return params.loginUrl
    } else if (params.alias) {
      log.warn("The `alias` param is deprecated and should not be expected to function properly. Please use `ccpUrl` or `loginUrl`. See https://github.com/amazon-connect/amazon-connect-streams/blob/master/README.md#connectcoreinitccp for valid parameters.");
      return LEGACY_LOGIN_URL_PATTERN
        .replace("{alias}", params.alias)
        .replace("{client_id}", CLIENT_ID_MAP["us-east-1"])
        .replace("{redirect}", global.encodeURIComponent(
          redirect));
    } else {
      return params.ccpUrl;
    }
  };

  /**
   * Replaces `createLoginUrl`, as that function's name was misleading.
   * The `params.alias` parameter is deprecated. Please refrain from using it.
   */
  var getLoginUrl = function (params) {
    var redirect = "https://lily.us-east-1.amazonaws.com/taw/auth/code";
    connect.assertNotNull(redirect);
    if (params.loginUrl) {
      return params.loginUrl
    } else if (params.alias) {
      log.warn("The `alias` param is deprecated and should not be expected to function properly. Please use `ccpUrl` or `loginUrl`. See https://github.com/amazon-connect/amazon-connect-streams/blob/master/README.md#connectcoreinitccp for valid parameters.");
      return LEGACY_LOGIN_URL_PATTERN
        .replace("{alias}", params.alias)
        .replace("{client_id}", CLIENT_ID_MAP["us-east-1"])
        .replace("{redirect}", global.encodeURIComponent(
          redirect));
    } else {
      return params.ccpUrl;
    }
  };
 
  /**-------------------------------------------------------------------------
  * Returns scheme://host:port for a given url
  */
  function sanitizeDomain(url) {
    var domain = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/ig);
    return domain.length ? domain[0] : "";
  }
 
  /**-------------------------------------------------------------------------
    * Print a warning message if the Connect core is not initialized.
    */
  connect.core.checkNotInitialized = function () {
    if (connect.core.initialized) {
      var log = connect.getLog();
      log.warn("Connect core already initialized, only needs to be initialized once.");
    }
  };
 
  /**-------------------------------------------------------------------------
   * Basic Connect client initialization.
   * Should be used only by the API Shared Worker.
   */
  connect.core.init = function (params) {
    connect.core.eventBus = new connect.EventBus();
    connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
    connect.core.initClient(params);
    connect.core.initialized = true;
  };
 
  /**-------------------------------------------------------------------------
   * Initialized AWS client
   * Should be used by Shared Worker to update AWS client with new credentials
   * after refreshed authentication.
   */
  connect.core.initClient = function (params) {
    connect.assertNotNull(params, 'params');
 
    var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
    var region = connect.assertNotNull(params.region, 'params.region');
    var endpoint = params.endpoint || null;
 
    connect.core.client = new connect.AWSClient(authToken, region, endpoint);
  };
 
  /**-------------------------------------------------------------------------
   * Uninitialize Connect.
   */
  connect.core.terminate = function () {
    connect.core.client = new connect.NullClient();
    connect.core.masterClient = new connect.NullClient();
    var bus = connect.core.getEventBus();
    if (bus) bus.unsubscribeAll();
    connect.core.bus = new connect.EventBus();
    connect.core.agentDataProvider = null;
    connect.core.softphoneManager = null;
    connect.core.upstream = null;
    connect.core.keepaliveManager = null;
    connect.agent.initialized = false;
    connect.core.initialized = false;
  };
 
  /**-------------------------------------------------------------------------
   * Setup the SoftphoneManager to be initialized when the agent
   * is determined to have softphone enabled.
   */
  connect.core.softphoneUserMediaStream = null;
 
  connect.core.getSoftphoneUserMediaStream = function () {
    return connect.core.softphoneUserMediaStream;
  };
 
  connect.core.setSoftphoneUserMediaStream = function (stream) {
    connect.core.softphoneUserMediaStream = stream;
  };
 
  connect.core.initRingtoneEngines = function (params) {
    connect.assertNotNull(params, "params");
 
    var setupRingtoneEngines = function (ringtoneSettings) {
      connect.assertNotNull(ringtoneSettings, "ringtoneSettings");
      connect.assertNotNull(ringtoneSettings.voice, "ringtoneSettings.voice");
      connect.assertTrue(ringtoneSettings.voice.ringtoneUrl || ringtoneSettings.voice.disabled, "ringtoneSettings.voice.ringtoneUrl must be provided or ringtoneSettings.voice.disabled must be true");
      connect.assertNotNull(ringtoneSettings.queue_callback, "ringtoneSettings.queue_callback");
      connect.assertTrue(ringtoneSettings.queue_callback.ringtoneUrl || ringtoneSettings.queue_callback.disabled, "ringtoneSettings.voice.ringtoneUrl must be provided or ringtoneSettings.queue_callback.disabled must be true");
 
      connect.core.ringtoneEngines = {};
 
      connect.agent(function (agent) {
        agent.onRefresh(function () {
          connect.ifMaster(connect.MasterTopics.RINGTONE, function () {
            if (!ringtoneSettings.voice.disabled && !connect.core.ringtoneEngines.voice) {
              connect.core.ringtoneEngines.voice =
                new connect.VoiceRingtoneEngine(ringtoneSettings.voice);
              connect.getLog().info("VoiceRingtoneEngine initialized.");
            }
 
            if (!ringtoneSettings.chat.disabled && !connect.core.ringtoneEngines.chat) {
              connect.core.ringtoneEngines.chat =
                new connect.ChatRingtoneEngine(ringtoneSettings.chat);
              connect.getLog().info("ChatRingtoneEngine initialized.");
            }
            if (!ringtoneSettings.queue_callback.disabled && !connect.core.ringtoneEngines.queue_callback) {
              connect.core.ringtoneEngines.queue_callback =
                new connect.QueueCallbackRingtoneEngine(ringtoneSettings.queue_callback);
              connect.getLog().info("QueueCallbackRingtoneEngine initialized.");
            }
          });
        });
      });
    };
 
    var mergeParams = function (params, otherParams) {
      // For backwards compatibility: support pulling disabled flag and ringtoneUrl
      // from softphone config if it exists from downstream into the ringtone config.
      params.ringtone = params.ringtone || {};
      params.ringtone.voice = params.ringtone.voice || {};
      params.ringtone.queue_callback = params.ringtone.queue_callback || {};
      params.ringtone.chat = params.ringtone.chat || { disabled: true };
      if (otherParams.softphone) {
        if (otherParams.softphone.disableRingtone) {
          params.ringtone.voice.disabled = true;
          params.ringtone.queue_callback.disabled = true;
        }
 
        if (otherParams.softphone.ringtoneUrl) {
          params.ringtone.voice.ringtoneUrl = otherParams.softphone.ringtoneUrl;
          params.ringtone.queue_callback.ringtoneUrl = otherParams.softphone.ringtoneUrl;
        }
      }
      if (otherParams.chat) {
        if (otherParams.chat.disableRingtone) {
          params.ringtone.chat.disabled = true;
        }
        if (otherParams.chat.ringtoneUrl) {
          params.ringtone.chat.ringtoneUrl = otherParams.chat.ringtoneUrl;
        }
      }
      // Merge in ringtone settings from downstream.
      if (otherParams.ringtone) {
        params.ringtone.voice = connect.merge(params.ringtone.voice,
          otherParams.ringtone.voice || {});
        params.ringtone.queue_callback = connect.merge(params.ringtone.queue_callback,
          otherParams.ringtone.voice || {});
        params.ringtone.chat = connect.merge(params.ringtone.chat,
          otherParams.ringtone.chat || {});
      }
    };
    // Merge params from params.softphone and params.chat into params.ringtone
    // for embedded and non-embedded use cases so that defaults are picked up.
    mergeParams(params, params);
 
    if (connect.isFramed()) {
      // If the CCP is in a frame, wait for configuration from downstream.
      var bus = connect.core.getEventBus();
      bus.subscribe(connect.EventType.CONFIGURE, function (data) {
        this.unsubscribe();
        // Merge all params from data into params for any overridden
        // values in either legacy "softphone" or "ringtone" settings.
        mergeParams(params, data);
        setupRingtoneEngines(params.ringtone);
      });
 
    } else {
      setupRingtoneEngines(params.ringtone);
    }
  };
 
  connect.core.initSoftphoneManager = function (paramsIn) {
    var params = paramsIn || {};
 
    var competeForMasterOnAgentUpdate = function (softphoneParamsIn) {
      var softphoneParams = connect.merge(params.softphone || {}, softphoneParamsIn);
 
      connect.agent(function (agent) {
        if (!agent.getChannelConcurrency(connect.ChannelType.VOICE)) {
          return;
        }
        agent.onRefresh(function () {
          var sub = this;
 
          connect.ifMaster(connect.MasterTopics.SOFTPHONE, function () {
            if (!connect.core.softphoneManager && agent.isSoftphoneEnabled()) {
              // Become master to send logs, since we need logs from softphone tab.
              connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
              connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
              sub.unsubscribe();
            }
          });
        });
      });
    };
 
    /**
     * If the window is framed, we need to wait for a CONFIGURE message from
     * downstream before we try to initialize, unless params.allowFramedSoftphone is true.
     */
    if (connect.isFramed() && !params.allowFramedSoftphone) {
      var bus = connect.core.getEventBus();
      bus.subscribe(connect.EventType.CONFIGURE, function (data) {
        if (data.softphone && data.softphone.allowFramedSoftphone) {
          this.unsubscribe();
          competeForMasterOnAgentUpdate(data.softphone);
        }
      });
    } else {
      competeForMasterOnAgentUpdate(params);
    }
 
    connect.agent(function (agent) {
      // Sync mute across all tabs 
      if (agent.isSoftphoneEnabled() && agent.getChannelConcurrency(connect.ChannelType.VOICE)) {
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
          {
            event: connect.EventType.MUTE
          });
      }
    });
  };
 
  //Internal use only.
  connect.core.authorize = function (endpoint) {
    var options = {
      credentials: 'include'
    };

    var authorizeEndpoint = endpoint;
    if (!authorizeEndpoint) {
      authorizeEndpoint = connect.core.isLegacyDomain()
        ? LEGACY_AUTHORIZE_ENDPOINT
        : AUTHORIZE_ENDPOINT;
    }
    return connect.fetch(authorizeEndpoint, options, AUTHORIZE_RETRY_INTERVAL, AUTHORIZE_MAX_RETRY);
  };
 
  /**
   * @deprecated
   * This used to be used internally, but is no longer needed.
   */
  connect.core.verifyDomainAccess = function (authToken, endpoint) {
    connect.getLog().warn("This API will be deprecated in the next major version release");
    if (!connect.isFramed()) {
      return Promise.resolve();
    }
    var options = {
      headers: {
        'X-Amz-Bearer': authToken
      }
    };
    var whitelistedOriginsEndpoint = null;
    if (endpoint){
      whitelistedOriginsEndpoint = endpoint;
    }
    else {
      whitelistedOriginsEndpoint = connect.core.isLegacyDomain() 
        ? LEGACY_WHITELISTED_ORIGINS_ENDPOINT
        : WHITELISTED_ORIGINS_ENDPOINT;
    }
    
    return connect.fetch(whitelistedOriginsEndpoint, options, WHITELISTED_ORIGINS_RETRY_INTERVAL, WHITELISTED_ORIGINS_MAX_RETRY).then(function (response) {
      var topDomain = sanitizeDomain(window.document.referrer);
      var isAllowed = response.whitelistedOrigins.some(function (origin) {
        return topDomain === sanitizeDomain(origin);
      });
      return isAllowed ? Promise.resolve() : Promise.reject();
    });
  };

  /**-------------------------------------------------------------------------
   * Returns true if this window's href is on the legacy connect domain. 
   * Only useful for internal use. 
   */
  connect.core.isLegacyDomain = function(url) {
    url = url || window.location.href;
    return url.includes('.awsapps.com');
  }

 
  /**-------------------------------------------------------------------------
   * Initializes Connect by creating or connecting to the API Shared Worker.
   * Used only by the CCP
   */
  connect.core.initSharedWorker = function (params) {
    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }
    connect.assertNotNull(params, 'params');
 
    var sharedWorkerUrl = connect.assertNotNull(params.sharedWorkerUrl, 'params.sharedWorkerUrl');
    var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
    var refreshToken = connect.assertNotNull(params.refreshToken, 'params.refreshToken');
    var authTokenExpiration = connect.assertNotNull(params.authTokenExpiration, 'params.authTokenExpiration');
    var region = connect.assertNotNull(params.region, 'params.region');
    var endpoint = params.endpoint || null;
    var authorizeEndpoint = params.authorizeEndpoint;
    if (!authorizeEndpoint) {
      authorizeEndpoint = connect.core.isLegacyDomain()
        ? LEGACY_AUTHORIZE_ENDPOINT
        : AUTHORIZE_ENDPOINT;
    }
 
    try {
      // Initialize the event bus and agent data providers.
      connect.core.eventBus = new connect.EventBus({ logEvents: true });
      connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
      connect.core.mediaFactory = new connect.MediaFactory(params);
      
      // Create the shared worker and upstream conduit.
      var worker = new SharedWorker(sharedWorkerUrl, "ConnectSharedWorker");
      var conduit = new connect.Conduit("ConnectSharedWorkerConduit",
        new connect.PortStream(worker.port),
        new connect.WindowIOStream(window, parent));
 
      // Set the global upstream conduit for external use.
      connect.core.upstream = conduit;
      connect.core.webSocketProvider = new WebSocketProvider();
 
      // Close our port to the shared worker before the window closes.
      global.onunload = function () {
        conduit.sendUpstream(connect.EventType.CLOSE);
        worker.port.close();
      };
 
      connect.getLog().scheduleUpstreamLogPush(conduit);
      // Bridge all upstream messages into the event bus.
      conduit.onAllUpstream(connect.core.getEventBus().bridge());
      // Bridge all downstream messages into the event bus.
      conduit.onAllDownstream(connect.core.getEventBus().bridge());
      // Pass all upstream messages (from shared worker) downstream (to CCP consumer).
      conduit.onAllUpstream(conduit.passDownstream());
      // Pass all downstream messages (from CCP consumer) upstream (to shared worker).
      conduit.onAllDownstream(conduit.passUpstream());
      // Send configuration up to the shared worker.
 
      conduit.sendUpstream(connect.EventType.CONFIGURE, {
        authToken: authToken,
        authTokenExpiration: authTokenExpiration,
        endpoint: endpoint,
        refreshToken: refreshToken,
        region: region,
        authorizeEndpoint: authorizeEndpoint
      });
 
      conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
        connect.getLog().info("Acknowledged by the ConnectSharedWorker!");
        connect.core.initialized = true;
        this.unsubscribe();
      });
      // Add all upstream log entries to our own logger.
      conduit.onUpstream(connect.EventType.LOG, function (logEntry) {
        if (logEntry.loggerId !== connect.getLog().getLoggerId()) {
          connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
        }
      });
      // Reload the page if the shared worker detects an API auth failure.
      conduit.onUpstream(connect.EventType.AUTH_FAIL, function (logEntry) {
        location.reload();
      });
 
      connect.core.client = new connect.UpstreamConduitClient(conduit);
      connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
 
      // Pass the TERMINATE request upstream to the shared worker.
      connect.core.getEventBus().subscribe(connect.EventType.TERMINATE,
        conduit.passUpstream());
 
      // Refresh the page when we receive the TERMINATED response from the
      // shared worker.
      connect.core.getEventBus().subscribe(connect.EventType.TERMINATED, function () {
        window.location.reload(true);
      });
 
      worker.port.start();
 
      // Attempt to get permission to show notifications.
      var nm = connect.core.getNotificationManager();
      nm.requestPermission();
 
    } catch (e) {
      connect.getLog().error("Failed to initialize the API shared worker, we're dead!")
        .withException(e);
    }
  };
 
  /**-------------------------------------------------------------------------
   * Initializes Connect by creating or connecting to the API Shared Worker.
   * Initializes Connect by loading the CCP in an iframe and connecting to it.
   */
  connect.core.initCCP = function (containerDiv, paramsIn) {
    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }
 
    // For backwards compatibility, when instead of taking a params object
    // as input we only accepted ccpUrl.
    var params = {};
    if (typeof (paramsIn) === 'string') {
      params.ccpUrl = paramsIn;
    } else {
      params = paramsIn;
    }
    connect.assertNotNull(containerDiv, 'containerDiv');
    connect.assertNotNull(params.ccpUrl, 'params.ccpUrl');
 
    // Create the CCP iframe and append it to the container div.
    var iframe = document.createElement('iframe');
    iframe.src = params.ccpUrl;
    iframe.allow = "microphone; autoplay";
    iframe.style = "width: 100%; height: 100%";
    containerDiv.appendChild(iframe);
 
    // Initialize the event bus and agent data providers.
    // NOTE: Setting logEvents here to FALSE in order to avoid duplicating
    // events which are logged in CCP.
    connect.core.eventBus = new connect.EventBus({ logEvents: false });
    connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
    connect.core.mediaFactory = new connect.MediaFactory(params);
 
    // Build the upstream conduit communicating with the CCP iframe.
    var conduit = new connect.IFrameConduit(params.ccpUrl, window, iframe);
    // Let CCP know if iframe is visible
    iframe.onload = setTimeout(function() {
      var style = window.getComputedStyle(iframe, null);
      var data = {
        display: style.display,
        offsetWidth: iframe.offsetWidth,
        offsetHeight: iframe.offsetHeight,
        clientRectsLength: iframe.getClientRects().length
      };
      conduit.sendUpstream(connect.EventType.IFRAME_STYLE, data);
    }, 10000);
    // Set the global upstream conduit for external use.
    connect.core.upstream = conduit;
 
    // Init webSocketProvider
    connect.core.webSocketProvider = new WebSocketProvider();
 
    conduit.onAllUpstream(connect.core.getEventBus().bridge());
 
    // Initialize the keepalive manager.
    connect.core.keepaliveManager = new KeepaliveManager(conduit,
      connect.core.getEventBus(),
      params.ccpSynTimeout || CCP_SYN_TIMEOUT,
      params.ccpAckTimeout || CCP_ACK_TIMEOUT)
      ;
    connect.core.iframeRefreshInterval = null;
 
    // Allow 10 sec (default) before receiving the first ACK from the CCP.
    connect.core.ccpLoadTimeoutInstance = global.setTimeout(function () {
      connect.core.ccpLoadTimeoutInstance = null;
      connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
    }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);
 
    // Once we receive the first ACK, setup our upstream API client and establish
    // the SYN/ACK refresh flow.
    conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
      connect.getLog().info("Acknowledged by the CCP!");
      connect.core.client = new connect.UpstreamConduitClient(conduit);
      connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
      connect.core.initialized = true;
      if (params.softphone || params.chat) {
        // Send configuration up to the CCP.
        //set it to false if secondary
        conduit.sendUpstream(connect.EventType.CONFIGURE, {
          softphone: params.softphone,
          chat: params.chat
        });
      }
 
      if (connect.core.ccpLoadTimeoutInstance) {
        global.clearTimeout(connect.core.ccpLoadTimeoutInstance);
        connect.core.ccpLoadTimeoutInstance = null;
      }
 
      connect.core.keepaliveManager.start();
      this.unsubscribe();
    });
 
    // Add any logs from the upstream to our own logger.
    conduit.onUpstream(connect.EventType.LOG, function (logEntry) {
      if (logEntry.loggerId !== connect.getLog().getLoggerId()) {
        connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
      }
    });
 
    // Pop a login page when we encounter an ACK timeout.
    connect.core.getEventBus().subscribe(connect.EventType.ACK_TIMEOUT, function () {
      // loginPopup is true by default, only false if explicitly set to false.
      if (params.loginPopup !== false) {
        try {
          var loginUrl = getLoginUrl(params);
          connect.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page if not already open.");
          // clear out last opened timestamp for SAML authentication when there is ACK_TIMEOUT
          if (params.loginUrl) {
             connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
          }
          connect.core.loginWindow = connect.core.getPopupManager().open(loginUrl, connect.MasterTopics.LOGIN_POPUP, params.loginOptions);
        } catch (e) {
          connect.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup.").withException(e);
        }
      }
 
      if (connect.core.iframeRefreshInterval == null) {
        connect.core.iframeRefreshInterval = window.setInterval(function () {
          iframe.src = params.ccpUrl;
        }, CCP_IFRAME_REFRESH_INTERVAL);
 
        conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
          this.unsubscribe();
          global.clearInterval(connect.core.iframeRefreshInterval);
          connect.core.iframeRefreshInterval = null;
          connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
          if ((params.loginPopupAutoClose || (params.loginOptions && params.loginOptions.autoClose)) && 
              connect.core.loginWindow) {
            connect.core.loginWindow.close();
            connect.core.loginWindow = null;
          }
        });
      }
    });
    if (params.onViewContact) {
      connect.core.onViewContact(params.onViewContact);
    }
  };
 
  /**-----------------------------------------------------------------------*/
  var KeepaliveManager = function (conduit, eventBus, synTimeout, ackTimeout) {
    this.conduit = conduit;
    this.eventBus = eventBus;
    this.synTimeout = synTimeout;
    this.ackTimeout = ackTimeout;
    this.ackTimer = null;
    this.synTimer = null;
    this.ackSub = null;
  };
 
  KeepaliveManager.prototype.start = function () {
    var self = this;
 
    this.conduit.sendUpstream(connect.EventType.SYNCHRONIZE);
    this.ackSub = this.conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
      this.unsubscribe();
      global.clearTimeout(self.ackTimer);
      self.deferStart();
    });
    this.ackTimer = global.setTimeout(function () {
      self.ackSub.unsubscribe();
      self.eventBus.trigger(connect.EventType.ACK_TIMEOUT);
      self.deferStart();
    }, this.ackTimeout);
  };
 
  KeepaliveManager.prototype.deferStart = function () {
    if (this.synTimer == null) {
      this.synTimer = global.setTimeout(connect.hitch(this, this.start), this.synTimeout);
    }
  };
 
  /**-----------------------------------------------------------------------*/
 
  var WebSocketProvider = function () {
 
    var callbacks = {
      initFailure: new Set(),
      subscriptionUpdate: new Set(),
      subscriptionFailure: new Set(),
      topic: new Map(),
      allMessage: new Set(),
      connectionGain: new Set(),
      connectionLost: new Set(),
      connectionOpen: new Set(),
      connectionClose: new Set()
    };
 
    var invokeCallbacks = function (callbacks, response) {
      callbacks.forEach(function (callback) {
        callback(response);
      });
    };
 
    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.INIT_FAILURE, function () {
      invokeCallbacks(callbacks.initFailure);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_OPEN, function (response) {
      invokeCallbacks(callbacks.connectionOpen, response);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_CLOSE, function (response) {
      invokeCallbacks(callbacks.connectionClose, response);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_GAIN, function () {
      invokeCallbacks(callbacks.connectionGain);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_LOST, function (response) {
      invokeCallbacks(callbacks.connectionLost, response);
    });
 
    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.SUBSCRIPTION_UPDATE, function (response) {
      invokeCallbacks(callbacks.subscriptionUpdate, response);
    });
 
    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.SUBSCRIPTION_FAILURE, function (response) {
      invokeCallbacks(callbacks.subscriptionFailure, response);
    });
 
    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.ALL_MESSAGE, function (response) {
      invokeCallbacks(callbacks.allMessage, response);
      if (callbacks.topic.has(response.topic)) {
        invokeCallbacks(callbacks.topic.get(response.topic), response);
      }
    });
 
    this.sendMessage = function (webSocketPayload) {
      connect.core.getUpstream().sendUpstream(connect.WebSocketEvents.SEND, webSocketPayload);
    };
 
    this.onInitFailure = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.initFailure.add(cb);
      return function () {
        return callbacks.initFailure.delete(cb);
      };
    };

    this.onConnectionOpen = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionOpen.add(cb);
      return function () {
        return callbacks.connectionOpen.delete(cb);
      };
    };

    this.onConnectionClose = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionClose.add(cb);
      return function () {
        return callbacks.connectionClose.delete(cb);
      };
    };

    this.onConnectionGain = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionGain.add(cb);
      return function () {
        return callbacks.connectionGain.delete(cb);
      };
    };
 
    this.onConnectionLost = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionLost.add(cb);
      return function () {
        return callbacks.connectionLost.delete(cb);
      };
    };
 
    this.onSubscriptionUpdate = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.subscriptionUpdate.add(cb);
      return function () {
        return callbacks.subscriptionUpdate.delete(cb);
      };
    };
 
    this.onSubscriptionFailure = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.subscriptionFailure.add(cb);
      return function () {
        return callbacks.subscriptionFailure.delete(cb);
      };
    };
 
    this.subscribeTopics = function (topics) {
      connect.assertNotNull(topics, 'topics');
      connect.assertTrue(connect.isArray(topics), 'topics must be a array');
      connect.core.getUpstream().sendUpstream(connect.WebSocketEvents.SUBSCRIBE, topics);
    };
 
    this.onMessage = function (topicName, cb) {
      connect.assertNotNull(topicName, 'topicName');
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      if (callbacks.topic.has(topicName)) {
        callbacks.topic.get(topicName).add(cb);
      } else {
        callbacks.topic.set(topicName, new Set([cb]));
      }
      return function () {
        return callbacks.topic.get(topicName).delete(cb);
      };
    };
 
    this.onAllMessage = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.allMessage.add(cb);
      return function () {
        return callbacks.allMessage.delete(cb);
      };
    };
 
  };
 
  /**-----------------------------------------------------------------------*/
  var AgentDataProvider = function (bus) {
    var agentData = null;
    this.bus = bus;
    this.bus.subscribe(connect.AgentEvents.UPDATE, connect.hitch(this, this.updateAgentData));
  };
 
  AgentDataProvider.prototype.updateAgentData = function (agentData) {
    var oldAgentData = this.agentData;
    this.agentData = agentData;
 
    if (oldAgentData == null) {
      connect.agent.initialized = true;
      this.bus.trigger(connect.AgentEvents.INIT, new connect.Agent());
    }
 
    this.bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());
 
    this._fireAgentUpdateEvents(oldAgentData);
  };
 
  AgentDataProvider.prototype.getAgentData = function () {
    if (this.agentData == null) {
      throw new connect.StateError('No agent data is available yet!');
    }
 
    return this.agentData;
  };
 
  AgentDataProvider.prototype.getContactData = function (contactId) {
    var agentData = this.getAgentData();
    var contactData = connect.find(agentData.snapshot.contacts, function (ctdata) {
      return ctdata.contactId === contactId;
    });
 
    if (contactData == null) {
      throw new connect.StateError('Contact %s no longer exists.', contactId);
    }
 
    return contactData;
  };
 
  AgentDataProvider.prototype.getConnectionData = function (contactId, connectionId) {
    var contactData = this.getContactData(contactId);
    var connectionData = connect.find(contactData.connections, function (cdata) {
      return cdata.connectionId === connectionId;
    });
 
    if (connectionData == null) {
      throw new connect.StateError('Connection %s for contact %s no longer exists.', connectionId, contactId);
    }
 
    return connectionData;
  };
 
  AgentDataProvider.prototype._diffContacts = function (oldAgentData) {
    var diff = {
      added: {},
      removed: {},
      common: {},
      oldMap: connect.index(oldAgentData == null ? [] : oldAgentData.snapshot.contacts, function (contact) { return contact.contactId; }),
      newMap: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; })
    };
 
    connect.keys(diff.oldMap).forEach(function (contactId) {
      if (connect.contains(diff.newMap, contactId)) {
        diff.common[contactId] = diff.newMap[contactId];
      } else {
        diff.removed[contactId] = diff.oldMap[contactId];
      }
    });
 
    connect.keys(diff.newMap).forEach(function (contactId) {
      if (!connect.contains(diff.oldMap, contactId)) {
        diff.added[contactId] = diff.newMap[contactId];
      }
    });
 
    return diff;
  };
 
  AgentDataProvider.prototype._fireAgentUpdateEvents = function (oldAgentData) {
    var self = this;
    var diff = null;
    var oldAgentState = oldAgentData == null ? connect.AgentAvailStates.INIT : oldAgentData.snapshot.state.name;
    var newAgentState = this.agentData.snapshot.state.name;
    var oldRoutingState = oldAgentData == null ? connect.AgentStateType.INIT : oldAgentData.snapshot.state.type;
    var newRoutingState = this.agentData.snapshot.state.type;
 
    if (oldRoutingState !== newRoutingState) {
      connect.core.getAgentRoutingEventGraph().getAssociations(this, oldRoutingState, newRoutingState).forEach(function (event) {
        self.bus.trigger(event, new connect.Agent());
      });
    }
 
    if (oldAgentState !== newAgentState) {
      this.bus.trigger(connect.AgentEvents.STATE_CHANGE, {
        agent: new connect.Agent(),
        oldState: oldAgentState,
        newState: newAgentState
 
      });
      connect.core.getAgentStateEventGraph().getAssociations(this, oldAgentState, newAgentState).forEach(function (event) {
        self.bus.trigger(event, new connect.Agent());
      });
    }
 
    if (oldAgentData !== null) {
      diff = this._diffContacts(oldAgentData);
 
    } else {
      diff = {
        added: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; }),
        removed: {},
        common: {},
        oldMap: {},
        newMap: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; })
      };
    }
 
    connect.values(diff.added).forEach(function (contactData) {
      self.bus.trigger(connect.ContactEvents.INIT, new connect.Contact(contactData.contactId));
      self._fireContactUpdateEvents(contactData.contactId, connect.ContactStateType.INIT, contactData.state.type);
    });
 
    connect.values(diff.removed).forEach(function (contactData) {
      self.bus.trigger(connect.ContactEvents.DESTROYED, new connect.ContactSnapshot(contactData));
      self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.DESTROYED, contactData.contactId), new connect.ContactSnapshot(contactData));
      self._unsubAllContactEventsForContact(contactData.contactId);
    });
 
    connect.keys(diff.common).forEach(function (contactId) {
      self._fireContactUpdateEvents(contactId, diff.oldMap[contactId].state.type, diff.newMap[contactId].state.type);
    });
  };
 
  AgentDataProvider.prototype._fireContactUpdateEvents = function (contactId, oldContactState, newContactState) {
    var self = this;
    if (oldContactState !== newContactState) {
      connect.core.getContactEventGraph().getAssociations(this, oldContactState, newContactState).forEach(function (event) {
        self.bus.trigger(event, new connect.Contact(contactId));
        self.bus.trigger(connect.core.getContactEventName(event, contactId), new connect.Contact(contactId));
      });
    }
 
    self.bus.trigger(connect.ContactEvents.REFRESH, new connect.Contact(contactId));
    self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), new connect.Contact(contactId));
  };
 
  AgentDataProvider.prototype._unsubAllContactEventsForContact = function (contactId) {
    var self = this;
    connect.values(connect.ContactEvents).forEach(function (eventName) {
      self.bus.getSubscriptions(connect.core.getContactEventName(eventName, contactId))
        .map(function (sub) { sub.unsubscribe(); });
    });
  };
 
  /** ----- minimal view layer event handling **/
 
  connect.core.onViewContact = function (f) {
    connect.core.getUpstream().onUpstream(connect.ContactEvents.VIEW, f);
  };
 
  /**
   * Used of agent interface control. 
   * connect.core.viewContact("contactId") ->  this is curently programmed to get the contact into view.
   */
  connect.core.viewContact = function (contactId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ContactEvents.VIEW,
      data: {
        contactId: contactId
      }
    });
  };
 
  /** ------------------------------------------------- */
 
  /**
  * This will be helpful for the custom and embedded CCPs 
  * to handle the access denied use case. 
  */
  connect.core.onAccessDenied = function (f) {
    connect.core.getUpstream().onUpstream(connect.EventType.ACCESS_DENIED, f);
  };
 
  /**
  * This will be helpful for SAML use cases to handle the custom logins. 
  */
  connect.core.onAuthFail = function (f) {
    connect.core.getUpstream().onUpstream(connect.EventType.AUTH_FAIL, f);
  };
 
  /** ------------------------------------------------- */
 
  /**
   * Used for handling the rtc session stats.
   * Usage
   * connect.core.onSoftphoneSessionInit(function({ connectionId }) {
   *     var softphoneManager = connect.core.getSoftphoneManager();
   *     if(softphoneManager){
   *        // access session
   *        var session = softphoneManager.getSession(connectionId); 
   *      }
   * });
   */
 
  connect.core.onSoftphoneSessionInit = function (f) {
    connect.core.getUpstream().onUpstream(connect.ConnnectionEvents.SESSION_INIT, f);
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getContactEventName = function (eventName, contactId) {
    connect.assertNotNull(eventName, 'eventName');
    connect.assertNotNull(contactId, 'contactId');
    if (!connect.contains(connect.values(connect.ContactEvents), eventName)) {
      throw new connect.ValueError('%s is not a valid contact event.', eventName);
    }
    return connect.sprintf('%s::%s', eventName, contactId);
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getEventBus = function () {
    return connect.core.eventBus;
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getWebSocketManager = function () {
    return connect.core.webSocketProvider;
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getAgentDataProvider = function () {
    return connect.core.agentDataProvider;
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getLocalTimestamp = function () {
    return connect.core.getAgentDataProvider().getAgentData().snapshot.localTimestamp;
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getSkew = function () {
    return connect.core.getAgentDataProvider().getAgentData().snapshot.skew;
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.getAgentRoutingEventGraph = function () {
    return connect.core.agentRoutingEventGraph;
  };
  connect.core.agentRoutingEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.ROUTABLE,
      connect.AgentEvents.ROUTABLE)
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.NOT_ROUTABLE,
      connect.AgentEvents.NOT_ROUTABLE)
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.OFFLINE,
      connect.AgentEvents.OFFLINE);
 
  /**-----------------------------------------------------------------------*/
  connect.core.getAgentStateEventGraph = function () {
    return connect.core.agentStateEventGraph;
  };
  connect.core.agentStateEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY,
      connect.values(connect.AgentErrorStates),
      connect.AgentEvents.ERROR)
    .assoc(connect.EventGraph.ANY, connect.AgentAvailStates.AFTER_CALL_WORK,
      connect.AgentEvents.ACW);
 
  /**-----------------------------------------------------------------------*/
  connect.core.getContactEventGraph = function () {
    return connect.core.contactEventGraph;
  };
 
  connect.core.contactEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.INCOMING,
      connect.ContactEvents.INCOMING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.PENDING,
      connect.ContactEvents.PENDING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.CONNECTING,
      connect.ContactEvents.CONNECTING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.CONNECTED,
      connect.ContactEvents.CONNECTED)
    .assoc(connect.ContactStateType.CONNECTING,
      connect.ContactStateType.ERROR,
      connect.ContactEvents.MISSED)
    .assoc(connect.ContactStateType.INCOMING,
      connect.ContactStateType.ERROR,
      connect.ContactEvents.MISSED)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.ENDED,
      connect.ContactEvents.ACW)
    .assoc(connect.values(connect.CONTACT_ACTIVE_STATES),
      connect.values(connect.relativeComplement(connect.CONTACT_ACTIVE_STATES, connect.ContactStateType)),
      connect.ContactEvents.ENDED)
    .assoc(connect.EventGraph.ANY,
      connect.values(connect.AgentErrorStates),
      connect.ContactEvents.ERROR);

  /**-----------------------------------------------------------------------*/
  connect.core.getClient = function () {
    if (!connect.core.client) {
      throw new connect.StateError('The connect core has not been initialized!');
    }
    return connect.core.client;
  };
  connect.core.client = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.getMasterClient = function () {
    if (!connect.core.masterClient) {
      throw new connect.StateError('The connect master client has not been initialized!');
    }
    return connect.core.masterClient;
  };
  connect.core.masterClient = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.getSoftphoneManager = function () {
    return connect.core.softphoneManager;
  };
  connect.core.softphoneManager = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.getNotificationManager = function () {
    if (!connect.core.notificationManager) {
      connect.core.notificationManager = new connect.NotificationManager();
    }
    return connect.core.notificationManager;
  };
  connect.core.notificationManager = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.getPopupManager = function () {
    return connect.core.popupManager;
  };
  connect.core.popupManager = new connect.PopupManager();
 
  /**-----------------------------------------------------------------------*/
  connect.core.getUpstream = function () {
    if (!connect.core.upstream) {
      throw new connect.StateError('There is no upstream conduit!');
    }
    return connect.core.upstream;
  };
  connect.core.upstream = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.AgentDataProvider = AgentDataProvider;
 
})();