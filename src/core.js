/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this || window;
  var connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  connect.core = {};
  connect.core.initialized = false;
  connect.version = "STREAMS_VERSION";
  connect.DEFAULT_BATCH_SIZE = 500;
 
  var CCP_SYN_TIMEOUT = 1000; // 1 sec
  var CCP_ACK_TIMEOUT = 3000; // 3 sec
  var CCP_LOAD_TIMEOUT = 5000; // 5 sec
  var CCP_IFRAME_REFRESH_INTERVAL = 5000; // 5 sec
  var CCP_DR_IFRAME_REFRESH_INTERVAL = 10000; //10 s
  var CCP_IFRAME_REFRESH_LIMIT = 6; // 6 attempts
  var CCP_IFRAME_NAME = 'Amazon Connect CCP';
 
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

  var CSM_IFRAME_REFRESH_ATTEMPTS = 'IframeRefreshAttempts';
  var CSM_IFRAME_INITIALIZATION_SUCCESS = 'IframeInitializationSuccess';
  var CSM_IFRAME_INITIALIZATION_TIME = 'IframeInitializationTime';

  var CONNECTED_CCPS_SINGLE_TAB = 'ConnectedCCPSingleTabCount';
  var CCP_TABS_ACROSS_BROWSER_COUNT = 'CCPTabsAcrossBrowserCount';

  connect.numberOfConnectedCCPs = 0;
  connect.numberOfConnectedCCPsInThisTab = 0;

  connect.core.MAX_AUTHORIZE_RETRY_COUNT_FOR_SESSION = 3;
  connect.core.MAX_CTI_AUTH_RETRY_COUNT = 10;
  connect.core.ctiAuthRetryCount = 0;
  connect.core.authorizeTimeoutId = null;
  connect.core.ctiTimeoutId = null;

  /*----------------------------------------------------------------
   * enum SessionStorageKeys
   */
  connect.SessionStorageKeys = connect.makeEnum([
    'tab_id',
    'authorize_retry_count',
  ]);

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
      log.warn("Connect core already initialized, only needs to be initialized once.").sendInternalLogToServer();
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
    connect.core.initAgentAppClient(params);
    connect.core.initTaskTemplatesClient(params);
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
   * Initialized AgentApp client
   * Should be used by Shared Worker to update AgentApp client with new credentials
   * after refreshed authentication.
   */
  connect.core.initAgentAppClient = function (params) {
    connect.assertNotNull(params, 'params');    
    var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
    var authCookieName = connect.assertNotNull(params.authCookieName, 'params.authCookieName');
    var endpoint = connect.assertNotNull(params.agentAppEndpoint, 'params.agentAppEndpoint');
    
    connect.core.agentAppClient = new connect.AgentAppClient(authCookieName, authToken, endpoint);
  };

  /**-------------------------------------------------------------------------
   * Initialized TaskTemplates client
   */
  connect.core.initTaskTemplatesClient = function (params) {
    connect.assertNotNull(params, 'params');
    var endpoint = params.taskTemplatesEndpoint || params.endpoint;
    connect.assertNotNull(endpoint, 'taskTemplatesEndpoint');
    connect.core.taskTemplatesClient = new connect.TaskTemplatesClient(endpoint);
  };
 
  /**-------------------------------------------------------------------------
   * Uninitialize Connect.
   */
  connect.core.terminate = function () {
    connect.core.client = new connect.NullClient();
    connect.core.agentAppClient = new connect.NullClient();
    connect.core.taskTemplatesClient = new connect.NullClient();
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
              connect.getLog().info("VoiceRingtoneEngine initialized.").sendInternalLogToServer();
            }
 
            if (!ringtoneSettings.chat.disabled && !connect.core.ringtoneEngines.chat) {
              connect.core.ringtoneEngines.chat =
                new connect.ChatRingtoneEngine(ringtoneSettings.chat);
              connect.getLog().info("ChatRingtoneEngine initialized.").sendInternalLogToServer();
            }
 
            if (!ringtoneSettings.task.disabled && !connect.core.ringtoneEngines.task) {
              connect.core.ringtoneEngines.task =
                new connect.TaskRingtoneEngine(ringtoneSettings.task);
                connect.getLog().info("TaskRingtoneEngine initialized.").sendInternalLogToServer();
            }
 
            if (!ringtoneSettings.queue_callback.disabled && !connect.core.ringtoneEngines.queue_callback) {
              connect.core.ringtoneEngines.queue_callback =
                new connect.QueueCallbackRingtoneEngine(ringtoneSettings.queue_callback);
              connect.getLog().info("QueueCallbackRingtoneEngine initialized.").sendInternalLogToServer();
            }
          });
        });
      });

      handleRingerDeviceChange();
    };
 
    var mergeParams = function (params, otherParams) {
      // For backwards compatibility: support pulling disabled flag and ringtoneUrl
      // from softphone config if it exists from downstream into the ringtone config.
      params.ringtone = params.ringtone || {};
      params.ringtone.voice = params.ringtone.voice || {};
      params.ringtone.queue_callback = params.ringtone.queue_callback || {};
      params.ringtone.chat = params.ringtone.chat || { disabled: true };
      params.ringtone.task = params.ringtone.task || { disabled: true };
 
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

  var handleRingerDeviceChange = function() {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.ConfigurationEvents.SET_RINGER_DEVICE, setRingerDevice);
  }

  var setRingerDevice = function (data){
    if(connect.keys(connect.core.ringtoneEngines).length === 0 || !data || !data.deviceId){
      return;
    }
    var deviceId = data.deviceId;
    for (var ringtoneType in connect.core.ringtoneEngines) {
      connect.core.ringtoneEngines[ringtoneType].setOutputDevice(deviceId);
    }

    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.RINGER_DEVICE_CHANGED,
      data: { deviceId: deviceId }
    });
  }

  connect.core.initSoftphoneManager = function (paramsIn) {
    connect.getLog().info("[Softphone Manager] initSoftphoneManager started").sendInternalLogToServer();
    var params = paramsIn || {};
 
    var competeForMasterOnAgentUpdate = function (softphoneParamsIn) {
      var softphoneParams = connect.merge(params.softphone || {}, softphoneParamsIn);
      connect.getLog().info("[Softphone Manager] competeForMasterOnAgentUpdate executed").sendInternalLogToServer();
      connect.agent(function (agent) {
        if (!agent.getChannelConcurrency(connect.ChannelType.VOICE)) {
          return;
        }
        agent.onRefresh(function () {
          var sub = this;
          connect.getLog().info("[Softphone Manager] agent refresh handler executed").sendInternalLogToServer();
 
          connect.ifMaster(connect.MasterTopics.SOFTPHONE, function () {
            connect.getLog().info("[Softphone Manager] confirmed as softphone master topic").sendInternalLogToServer();
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
        connect.getLog().info("[Softphone Manager] Configure event handler executed").sendInternalLogToServer();
        if (data.softphone && data.softphone.allowFramedSoftphone) {
          this.unsubscribe();
          competeForMasterOnAgentUpdate(data.softphone);
          
        }
        setupEventListenersForMultiTabUseInFirefox(data.softphone);
      });
    } else {
      competeForMasterOnAgentUpdate(params);
      setupEventListenersForMultiTabUseInFirefox(params);
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

    function setupEventListenersForMultiTabUseInFirefox(softphoneParamsIn) {
      var softphoneParams = connect.merge(params.softphone || {}, softphoneParamsIn);

      // keep the softphone params for external use
      connect.core.softphoneParams = softphoneParams;

      if (connect.isFirefoxBrowser()) {
        // In Firefox, when a tab takes over another tab's softphone primary,
        // the previous primary tab should delete sofphone manager and stop microphone
        connect.core.getUpstream().onUpstream(connect.EventType.MASTER_RESPONSE, function (res) {
          if (res.data && res.data.topic === connect.MasterTopics.SOFTPHONE && res.data.takeOver && (res.data.masterId !== connect.core.portStreamId)) {
            if (connect.core.softphoneManager) {
              connect.core.softphoneManager.onInitContactSub.unsubscribe();
              delete connect.core.softphoneManager;
            }
            var userMediaStream = connect.core.getSoftphoneUserMediaStream();
            if (userMediaStream) {
              userMediaStream.getTracks().forEach(function(track) { track.stop(); });
              connect.core.setSoftphoneUserMediaStream(null);
            }
          }
        });

        // In Firefox, when multiple tabs are open,
        // webrtc session is not started until READY_TO_START_SESSION event is triggered
        connect.core.getEventBus().subscribe(connect.ConnectionEvents.READY_TO_START_SESSION, function () {
          connect.ifMaster(connect.MasterTopics.SOFTPHONE, function () {
            if (connect.core.softphoneManager) {
              connect.core.softphoneManager.startSession();
            }
          }, function () {
            connect.becomeMaster(connect.MasterTopics.SOFTPHONE, function () {
              connect.agent(function (agent) {
                if (!connect.core.softphoneManager && agent.isSoftphoneEnabled()) {
                  connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
                  connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
                  connect.core.softphoneManager.startSession();
                }
              });
            });
          });
        });

        // handling outbound-call and auto-accept cases for pending session
        connect.contact(function (c) {
          connect.agent(function (agent) {
            c.onRefresh(function (contact) {
              if (
                connect.hasOtherConnectedCCPs() &&
                document.visibilityState === 'visible' &&
                (contact.getStatus().type === connect.ContactStatusType.CONNECTING || contact.getStatus().type === connect.ContactStatusType.INCOMING)
              ) {
                var isOutBoundCall = contact.isSoftphoneCall() && !contact.isInbound();
                var isAutoAcceptEnabled = contact.isSoftphoneCall() && agent.getConfiguration().softphoneAutoAccept;
                var isQueuedCallback = contact.getType() === connect.ContactType.QUEUE_CALLBACK;
                if (isOutBoundCall || isAutoAcceptEnabled || isQueuedCallback) {
                  connect.core.triggerReadyToStartSessionEvent();
                }
              }
            });
          });
        });
      }
    }
  };

  // trigger READY_TO_START_SESSION event in a context with Softphone Manager
  // internal use only
  connect.core.triggerReadyToStartSessionEvent = function () {
    var allowFramedSoftphone = connect.core.softphoneParams && connect.core.softphoneParams.allowFramedSoftphone;
    if (connect.isCCP()) {
      if (allowFramedSoftphone) {
        // the event is triggered in this iframed CCP context
        connect.core.getEventBus().trigger(connect.ConnectionEvents.READY_TO_START_SESSION);
      } else {
        if (connect.isFramed()) {
          // if this is an iframed CCP, the event is send to downstream (CRM)
          connect.core.getUpstream().sendDownstream(connect.ConnectionEvents.READY_TO_START_SESSION);
        } else {
          // if this is a standalone CCP, trigger this event in this CCP context
          connect.core.getEventBus().trigger(connect.ConnectionEvents.READY_TO_START_SESSION);
        }
      }
    } else {
      if (allowFramedSoftphone) {
        // the event is send to the upstream (iframed CCP)
        connect.core.getUpstream().sendUpstream(connect.ConnectionEvents.READY_TO_START_SESSION);
      } else {
        // the event is triggered in this CRM context
        connect.core.getEventBus().trigger(connect.ConnectionEvents.READY_TO_START_SESSION);
      }
    }
  };

  connect.core.initPageOptions = function (params) {
    connect.assertNotNull(params, "params");
    if (connect.isFramed()) {
      // If the CCP is in a frame, wait for configuration from downstream.
      var bus = connect.core.getEventBus();
      bus.subscribe(connect.EventType.CONFIGURE, function (data) {
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
          {
            event: connect.ConfigurationEvents.CONFIGURE,
            data: data
          });
      });
      // Listen for iframe media devices request from CRM
      bus.subscribe(connect.EventType.MEDIA_DEVICE_REQUEST, function () {
        function sendDevices(devices) {
          connect.core.getUpstream().sendDownstream(connect.EventType.MEDIA_DEVICE_RESPONSE, devices);
        }
        if (navigator && navigator.mediaDevices) {
          navigator.mediaDevices.enumerateDevices()
          .then(function (devicesIn) {
            devices = devicesIn || [];
            devices = devices.map(function(d) { return d.toJSON() });
            sendDevices(devices);
          })
          .catch(function (err) {
            sendDevices({error: err.message});
          }); 
        } else {
          sendDevices({error: "No navigator or navigator.mediaDevices object found"});
        }
      });
    }
  };

  /**-------------------------------------------------------------------------
   * Get the list of media devices from iframed CCP
   * Timeout for the request is passed on an optional argument
   * The default timeout is 1000ms
   */
  connect.core.getFrameMediaDevices = function (timeoutIn) {
    var sub = null;
    var timeout = timeoutIn || 1000;
    var timeoutPromise = new Promise(function (resolve, reject) {
      setTimeout(function () { 
        reject(new Error("Timeout exceeded")); 
      }, timeout);
    });
    var mediaDevicesPromise = new Promise(function (resolve, reject) { 
      if (connect.isFramed() || connect.isCCP()) {
        if (navigator && navigator.mediaDevices) {
          navigator.mediaDevices.enumerateDevices()
          .then(function (devicesIn) {
            devices = devicesIn || [];
            devices = devices.map(function (d) { return d.toJSON() });
            resolve(devices);
          });
        } else {
          reject(new Error("No navigator or navigator.mediaDevices object found"));
        }
      } else {
        var bus = connect.core.getEventBus();
        sub = bus.subscribe(connect.EventType.MEDIA_DEVICE_RESPONSE, function (data) {
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data);
          }
        });
        connect.core.getUpstream().sendUpstream(connect.EventType.MEDIA_DEVICE_REQUEST);
      }
    })
    return Promise.race([mediaDevicesPromise, timeoutPromise])
    .finally(function () {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }

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
    var agentAppEndpoint = params.agentAppEndpoint || null;
    var taskTemplatesEndpoint = params.taskTemplatesEndpoint || null;
    var authCookieName = params.authCookieName || null;
 
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
      connect.getLog().scheduleDownstreamClientSideLogsPush();
      // Bridge all upstream messages into the event bus.
      conduit.onAllUpstream(connect.core.getEventBus().bridge());
      // Pass all upstream messages (from shared worker) downstream (to CCP consumer).
      conduit.onAllUpstream(conduit.passDownstream());

      if (connect.isFramed()) {
        // Bridge all downstream messages into the event bus.
        conduit.onAllDownstream(connect.core.getEventBus().bridge());
        // Pass all downstream messages (from CCP consumer) upstream (to shared worker).
        conduit.onAllDownstream(conduit.passUpstream());
      }

      // Send configuration up to the shared worker.
      conduit.sendUpstream(connect.EventType.CONFIGURE, {
        authToken: authToken,
        authTokenExpiration: authTokenExpiration,
        endpoint: endpoint,
        refreshToken: refreshToken,
        region: region,
        authorizeEndpoint: authorizeEndpoint,
        agentAppEndpoint: agentAppEndpoint,
        taskTemplatesEndpoint: taskTemplatesEndpoint,
        authCookieName: authCookieName,
        longPollingOptions: params.longPollingOptions || undefined
      });
 
      conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function (data) {
        connect.getLog().info("Acknowledged by the ConnectSharedWorker!").sendInternalLogToServer();
        connect.core.initialized = true;
        connect.core._setTabId();
        connect.core.portStreamId = data.id;
        this.unsubscribe();
      });
      // Add all upstream log entries to our own logger.
      conduit.onUpstream(connect.EventType.LOG, function (logEntry) {
        if (logEntry.loggerId !== connect.getLog().getLoggerId()) {
          connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
        }
      });
      // Get worker logs
      conduit.onUpstream(connect.EventType.SERVER_BOUND_INTERNAL_LOG, function (logEntry) {
        connect.getLog().sendInternalLogEntryToServer(connect.LogEntry.fromObject(logEntry));
      });
      // Get outer context logs
      conduit.onDownstream(connect.EventType.SERVER_BOUND_INTERNAL_LOG, function (logs) {
        if (connect.isFramed() && Array.isArray(logs)) {
          logs.forEach(function (log) {
            connect.getLog().sendInternalLogEntryToServer(connect.LogEntry.fromObject(log));
          });
        }
      });
      // Get log from outer context
      conduit.onDownstream(connect.EventType.LOG, function (log) {
        if (connect.isFramed() && log.loggerId !== connect.getLog().getLoggerId()) { 
          connect.getLog().addLogEntry(connect.LogEntry.fromObject(log));
        }
      });

      connect.core.onAuthFail(connect.hitch(connect.core, connect.core._handleAuthFail, params.loginEndpoint || null, authorizeEndpoint)); // For auth retry logic on 401s.
      connect.core.onAuthorizeSuccess(connect.hitch(connect.core, connect.core._handleAuthorizeSuccess)); // For auth retry logic on 401s.

      connect.getLog().info("User Agent: " + navigator.userAgent).sendInternalLogToServer();
      connect.getLog().info("isCCPv2: " + true).sendInternalLogToServer();
      connect.getLog().info("isFramed: " + connect.isFramed()).sendInternalLogToServer();
      connect.core.upstream.onDownstream(connect.EventType.OUTER_CONTEXT_INFO, function (data) {
        var streamsVersion = data.streamsVersion;
        connect.getLog().info("StreamsJS Version: " + streamsVersion).sendInternalLogToServer();
      });

      conduit.onUpstream(connect.EventType.UPDATE_CONNECTED_CCPS, function (data) {
        connect.getLog().info("Number of connected CCPs updated: " + data.length).sendInternalLogToServer();
        connect.numberOfConnectedCCPs = data.length;
        if (data[connect.core.tabId] && !isNaN(data[connect.core.tabId].length)){
          if (connect.numberOfConnectedCCPsInThisTab !== data[connect.core.tabId].length) {
            connect.numberOfConnectedCCPsInThisTab = data[connect.core.tabId].length;
            if (connect.numberOfConnectedCCPsInThisTab > 1) {
              connect.getLog().warn("There are " + connect.numberOfConnectedCCPsInThisTab + " connected CCPs in this tab. Please adjust your implementation to avoid complications. If you are embedding CCP, please do so exclusively with initCCP. InitCCP will not let you embed more than one CCP.").sendInternalLogToServer();
            }
            connect.publishMetric({
              name: CONNECTED_CCPS_SINGLE_TAB,
              data: { count: connect.numberOfConnectedCCPsInThisTab}
            });
          }
        }
        if (data.tabId && data.streamsTabsAcrossBrowser) {
          connect.ifMaster(connect.MasterTopics.METRICS, () =>
            connect.agent(() => connect.publishMetric({
              name: CCP_TABS_ACROSS_BROWSER_COUNT,
              data: { tabId: data.tabId, count: data.streamsTabsAcrossBrowser }
            }))
          );
        }
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

      conduit.onUpstream(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, function (data) {
        if (data && data.domainId) {
          connect.core.voiceIdDomainId = data.domainId;
        }
      });

      // try fetching voiceId's domainId once the agent is initialized
      connect.agent(function () {
        var voiceId = new connect.VoiceId();
        voiceId.getDomainId()
          .then(function(domainId) {
            connect.getLog().info("voiceId domainId successfully fetched at agent initialization: " + domainId).sendInternalLogToServer();
          })
          .catch(function(err) {
            connect.getLog().info("voiceId domainId not fetched at agent initialization").withObject({ err: err }).sendInternalLogToServer();
          });
      });
 
      // Attempt to get permission to show notifications.
      var nm = connect.core.getNotificationManager();
      nm.requestPermission();
 
    } catch (e) {
      connect.getLog().error("Failed to initialize the API shared worker, we're dead!")
        .withException(e).sendInternalLogToServer();
    }
  };

  connect.core._setTabId = function() {
    try {
      connect.core.tabId = window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID);
      if (!connect.core.tabId){
        connect.core.tabId = connect.randomId();
        window.sessionStorage.setItem(connect.SessionStorageKeys.TAB_ID, connect.core.tabId);
      }
      connect.core.upstream.sendUpstream(connect.EventType.TAB_ID, {tabId: connect.core.tabId});
    } catch(e) {
      connect.getLog().error("[Tab Id] There was an issue setting the tab Id").withException(e).sendInternalLogToServer();
    }
  }
 
  /**-------------------------------------------------------------------------
   * Initializes Connect by creating or connecting to the API Shared Worker.
   * Initializes Connect by loading the CCP in an iframe and connecting to it.
   */
  connect.core.initCCP = function (containerDiv, paramsIn) {
    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }
    connect.getLog().info("Iframe initialization started").sendInternalLogToServer();
    var initStartTime = Date.now();
    // Check if CCP iframe has already been initialized through initCCP
    try {
      if (connect.core._getCCPIframe()) {
          connect.getLog().error('Attempted to call initCCP when an iframe generated by initCCP already exists').sendInternalLogToServer();
          return;
        }
    } catch(e) {
      connect.getLog().error('Error while checking if initCCP has already been called').withException(e).sendInternalLogToServer();
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
    var iframe = connect.core._createCCPIframe(containerDiv, params);

    // Initialize the event bus and agent data providers.
    // NOTE: Setting logEvents here to FALSE in order to avoid duplicating
    // events which are logged in CCP.
    connect.core.eventBus = new connect.EventBus({ logEvents: false });
    connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
    connect.core.mediaFactory = new connect.MediaFactory(params);
 
    // Build the upstream conduit communicating with the CCP iframe.
    var conduit = new connect.IFrameConduit(params.ccpUrl, window, iframe);
 
    // Let CCP know if iframe is visible
    connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(iframe, conduit);
 
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
    connect.core.iframeRefreshTimeout = null;
 
    // Allow 5 sec (default) before receiving the first ACK from the CCP.
    connect.core.ccpLoadTimeoutInstance = global.setTimeout(function () {
      connect.core.ccpLoadTimeoutInstance = null;
      connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
    }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);

    connect.getLog().scheduleUpstreamOuterContextCCPLogsPush(conduit);
    connect.getLog().scheduleUpstreamOuterContextCCPserverBoundLogsPush(conduit);
 
    // Once we receive the first ACK, setup our upstream API client and establish
    // the SYN/ACK refresh flow.
    conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function (data) {
      connect.getLog().info("Acknowledged by the CCP!").sendInternalLogToServer();
      connect.core.client = new connect.UpstreamConduitClient(conduit);
      connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
      connect.core.portStreamId = data.id;

      if (params.softphone || params.chat || params.pageOptions || params.shouldAddNamespaceToLogs) {
        // Send configuration up to the CCP.
        //set it to false if secondary
        conduit.sendUpstream(connect.EventType.CONFIGURE, {
          softphone: params.softphone,
          chat: params.chat,
          pageOptions: params.pageOptions,
          shouldAddNamespaceToLogs: params.shouldAddNamespaceToLogs,
        });
      }
 
      if (connect.core.ccpLoadTimeoutInstance) {
        global.clearTimeout(connect.core.ccpLoadTimeoutInstance);
        connect.core.ccpLoadTimeoutInstance = null;
      }

      conduit.sendUpstream(connect.EventType.OUTER_CONTEXT_INFO, { streamsVersion: connect.version });
 
      connect.core.keepaliveManager.start();
      this.unsubscribe();

      connect.core.initialized = true;
      connect.core.getEventBus().trigger(connect.EventType.INIT);
      if (initStartTime) {
        var initTime = Date.now() - initStartTime;
        var refreshAttempts = connect.core.iframeRefreshAttempt || 0;
        connect.getLog().info('Iframe initialization succeeded').sendInternalLogToServer();
        connect.getLog().info(`Iframe initialization time ${initTime}`).sendInternalLogToServer();
        connect.getLog().info(`Iframe refresh attempts ${refreshAttempts}`).sendInternalLogToServer();
        setTimeout(() => {
          connect.publishMetric({
            name: CSM_IFRAME_REFRESH_ATTEMPTS,
            data: { count: refreshAttempts} 
          });
          connect.publishMetric({
            name: CSM_IFRAME_INITIALIZATION_SUCCESS,
            data: { count: 1} 
          });
          connect.publishMetric({
            name: CSM_IFRAME_INITIALIZATION_TIME,
            data: { count: initTime} 
          });
          //to avoid metric emission after initialization
          initStartTime = null;
        },1000)
      }
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
          connect.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page if not already open.").sendInternalLogToServer();
          // clear out last opened timestamp for SAML authentication when there is ACK_TIMEOUT
          if (params.loginUrl) {
            connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
          }
          connect.core.loginWindow = connect.core.getPopupManager().open(loginUrl, connect.MasterTopics.LOGIN_POPUP, params.loginOptions);
        } catch (e) {
          connect.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup.").withException(e).sendInternalLogToServer();
        }
      }

      if (connect.core.iframeRefreshTimeout == null) {
        try {
          conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
            this.unsubscribe();
            global.clearTimeout(connect.core.iframeRefreshTimeout);
            connect.core.iframeRefreshTimeout = null;
            connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
            if ((params.loginPopupAutoClose || (params.loginOptions && params.loginOptions.autoClose)) && connect.core.loginWindow) {
              connect.core.loginWindow.close();
              connect.core.loginWindow = null;
            }
          });
          connect.core._refreshIframeOnTimeout(params, containerDiv);
        } catch (e) {
          connect.getLog().error("Error occurred while refreshing iframe").withException(e).sendInternalLogToServer();
        }
      }
    });
 
    if (params.onViewContact) {
      connect.core.onViewContact(params.onViewContact);
    }

    conduit.onUpstream(connect.EventType.UPDATE_CONNECTED_CCPS, function (data) {
      connect.numberOfConnectedCCPs = data.length;
    });

    conduit.onUpstream(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, function (data) {
      if (data && data.domainId) {
        connect.core.voiceIdDomainId = data.domainId;
      }
    });

    connect.core.getEventBus().subscribe(connect.EventType.IFRAME_RETRIES_EXHAUSTED, function () {
      if (initStartTime) {
        var refreshAttempts = connect.core.iframeRefreshAttempt - 1;
        connect.getLog().info('Iframe initialization failed').sendInternalLogToServer();
        connect.getLog().info(`Time after iframe initialization started ${Date.now() - initStartTime}`).sendInternalLogToServer();
        connect.getLog().info(`Iframe refresh attempts ${refreshAttempts}`).sendInternalLogToServer();
        connect.publishMetric({
          name: CSM_IFRAME_REFRESH_ATTEMPTS,
          data: { count: refreshAttempts}
        });
        connect.publishMetric({
          name: CSM_IFRAME_INITIALIZATION_SUCCESS,
          data: { count: 0}
        });
        initStartTime = null;
      }
    });

    // keep the softphone params for external use
    connect.core.softphoneParams = params.softphone;
  };

  connect.core.onIframeRetriesExhausted = function(f) {
    connect.core.getEventBus().subscribe(connect.EventType.IFRAME_RETRIES_EXHAUSTED, f);
  }

  connect.core._refreshIframeOnTimeout = function(initCCPParams, containerDiv) {
    connect.assertNotNull(initCCPParams, 'initCCPParams');
    connect.assertNotNull(containerDiv, 'containerDiv');
    var ccpIframeRefreshInterval = (initCCPParams.disasterRecoveryOn) ? CCP_DR_IFRAME_REFRESH_INTERVAL : CCP_IFRAME_REFRESH_INTERVAL;
    var retryDelay = AWS.util.calculateRetryDelay(connect.core.iframeRefreshAttempt || 0, { base: 2000 });
    var timeout = ccpIframeRefreshInterval + retryDelay;
    global.clearTimeout(connect.core.iframeRefreshTimeout);
    connect.core.iframeRefreshTimeout = global.setTimeout(function() {
      connect.core.iframeRefreshAttempt = (connect.core.iframeRefreshAttempt || 0) + 1;
      if (connect.core.iframeRefreshAttempt <= CCP_IFRAME_REFRESH_LIMIT) {
        try {
          var iframe = connect.core._getCCPIframe();
          if (iframe) {
            iframe.parentNode.removeChild(iframe); // The only way to force a synchronous reload of the iframe without the old iframe continuing to function is to remove the old iframe entirely.
          }
          var newIframe = connect.core._createCCPIframe(containerDiv, initCCPParams);
          connect.core.upstream.upstream.output = newIframe.contentWindow; //replaces the output window (old iframe's contentWindow) of the WindowIOStream (within the IFrameConduit) with the new iframe's contentWindow.
          connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(newIframe, connect.core.upstream);
        } catch(e) {
          connect.getLog().error('Error while checking for, and recreating, the CCP IFrame').withException(e).sendInternalLogToServer();
        }
        connect.core._refreshIframeOnTimeout(initCCPParams, containerDiv);
      } else {
        connect.core.getEventBus().trigger(connect.EventType.IFRAME_RETRIES_EXHAUSTED);
        global.clearTimeout(connect.core.iframeRefreshTimeout);
      }
    }, timeout);
  }


  connect.core._getCCPIframe = function() {
    for (var iframe of window.document.getElementsByTagName('iframe')) {
      if (iframe.name === CCP_IFRAME_NAME) {
        return iframe;
      }
    }
    return null;
  }

  connect.core._createCCPIframe = function(containerDiv, initCCPParams) {
    connect.assertNotNull(initCCPParams, 'initCCPParams');
    connect.assertNotNull(containerDiv, 'containerDiv');
    var iframe = document.createElement('iframe');
    iframe.src = initCCPParams.ccpUrl;
    iframe.allow = "microphone; autoplay";
    iframe.style = initCCPParams.style || "width: 100%; height: 100%";
    iframe.title = initCCPParams.iframeTitle || CCP_IFRAME_NAME;
    iframe.name = CCP_IFRAME_NAME;
    containerDiv.appendChild(iframe);
    return iframe;
  }

  connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime = function(iframe, conduit) {
    connect.assertNotNull(iframe, 'iframe');
    connect.assertNotNull(conduit, 'conduit');
    setTimeout(function() {
      var style = window.getComputedStyle(iframe, null);
      var data = {
        display: style.display,
        offsetWidth: iframe.offsetWidth,
        offsetHeight: iframe.offsetHeight,
        clientRectsLength: iframe.getClientRects().length
      };
      conduit.sendUpstream(connect.EventType.IFRAME_STYLE, data);
    }, 10000);
  }
 
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
      self._deferStart();
    });
    this.ackTimer = global.setTimeout(function () {
      self.ackSub.unsubscribe();
      self.eventBus.trigger(connect.EventType.ACK_TIMEOUT);
      self._deferStart();
    }, this.ackTimeout);
  };
 
  //Fixes the keepalivemanager.
  KeepaliveManager.prototype._deferStart = function () {
    this.synTimer = global.setTimeout(connect.hitch(this, this.start), this.synTimeout);
  };

  // For backwards compatibility only, in case customers are using this to start the keepalivemanager for some reason.
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

  AgentDataProvider.prototype.getInstanceId = function(){
    return this.getAgentData().configuration.routingProfile.routingProfileId.match(/instance\/([0-9a-fA-F|-]+)\//)[1];
  }

  AgentDataProvider.prototype.getAWSAccountId = function(){
    return this.getAgentData().configuration.routingProfile.routingProfileId.match(/:([0-9]+):instance/)[1];
  }
 
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

    var oldNextState = oldAgentData && oldAgentData.snapshot.nextState ? oldAgentData.snapshot.nextState.name : null;
    var newNextState = this.agentData.snapshot.nextState ? this.agentData.snapshot.nextState.name : null;
    if (oldNextState !== newNextState && newNextState) {
      self.bus.trigger(connect.AgentEvents.ENQUEUED_NEXT_STATE, new connect.Agent());
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
   * connect.core.viewContact("contactId") ->  this is currently programmed to get the contact into view.
   */
  connect.core.viewContact = function (contactId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ContactEvents.VIEW,
      data: {
        contactId: contactId
      }
    });
  };

  /** ----- minimal view layer event handling **/
 
  connect.core.onActivateChannelWithViewType = function (f) {
    connect.core.getUpstream().onUpstream(connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE, f);
  };
 
  /**
   * Used of agent interface control. 
   * connect.core.activateChannelWithViewType() ->  this is currently programmed to get either the number pad, quick connects, or create task into view.
   * the valid combinations are ("create_task", "task"), ("number_pad", "softphone"), ("create_task", "softphone"), ("quick_connects", "softphone")
   * the softphone with create_task combo is a special case in the channel view to allow all three view type buttons to appear on the softphone screen
   *
   * The 'source' is an optional parameter which indicates the requester. For example, if invoked with ("create_task", "task", "agentapp") we would know agentapp requested open task view.
   */
  connect.core.activateChannelWithViewType = function (viewType, mediaType, source) {
    const data = { viewType, mediaType };
    if (source) {
      data.source = source;
    }
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ChannelViewEvents.ACTIVATE_CHANNEL_WITH_VIEW_TYPE,
      data
    });
  };

  /**
   * Used to publish 'task created' event
   */
  connect.core.triggerTaskCreated = function (data) {
    connect.core.getUpstream().upstreamBus.trigger(connect.TaskEvents.CREATED, data);
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

  connect.core.onAuthorizeSuccess = function (f) {
    connect.core.getUpstream().onUpstream(connect.EventType.AUTHORIZE_SUCCESS, f);
  }

  connect.core._handleAuthorizeSuccess = function() {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 0);
  }

  connect.core._handleAuthFail = function(loginUrl, authorizeEndpoint, authFailData) {
    if (authFailData && authFailData.authorize) {
      connect.core._handleAuthorizeFail(loginUrl);
    }
    else {
      connect.core._handleCTIAuthFail(authorizeEndpoint);
    }
  }

  connect.core._handleAuthorizeFail = function(loginUrl) {
    let authRetryCount = connect.core._getAuthRetryCount()
    if (!connect.core.authorizeTimeoutId) {
      if (authRetryCount < connect.core.MAX_AUTHORIZE_RETRY_COUNT_FOR_SESSION) {
        connect.core._incrementAuthRetryCount();
        let retryDelay = AWS.util.calculateRetryDelay(authRetryCount + 1 || 0, { base: 2000 });
        connect.core.authorizeTimeoutId = setTimeout(() => {
          connect.core._redirectToLogin(loginUrl);
        }, retryDelay); //We don't have to clear the timeoutId because we are redirecting away from this origin once the timeout completes.
      }
      else  {
        connect.getLog().warn("We have exhausted our authorization retries due to 401s from the authorize api. No more retries will be attempted in this session until the authorize api returns 200.").sendInternalLogToServer();
        connect.core.getEventBus().trigger(connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED);
      }
    }
  }

  connect.core._redirectToLogin = function(loginUrl) {
    if (typeof(loginUrl) === 'string') {
      location.assign(loginUrl);
    } else {
      location.reload();
    }
  }

  connect.core._handleCTIAuthFail = function(authorizeEndpoint) {
    if (!connect.core.ctiTimeoutId) {
      if (connect.core.ctiAuthRetryCount < connect.core.MAX_CTI_AUTH_RETRY_COUNT) {
        connect.core.ctiAuthRetryCount++;
        let retryDelay = AWS.util.calculateRetryDelay(connect.core.ctiAuthRetryCount || 0, { base: 500 });
        connect.core.ctiTimeoutId = setTimeout(() => {
          connect.core.authorize(authorizeEndpoint).then(connect.core._triggerAuthorizeSuccess.bind(connect.core)).catch(connect.core._triggerAuthFail.bind(connect.core, {authorize: true}));
          connect.core.ctiTimeoutId = null;
        }, retryDelay);
      }
      else {
        connect.getLog().warn("We have exhausted our authorization retries due to 401s from the CTI service. No more retries will be attempted until the page is refreshed.").sendInternalLogToServer();
        connect.core.getEventBus().trigger(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED);
      }
    }
  }

  connect.core._triggerAuthorizeSuccess = function() {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.AUTHORIZE_SUCCESS);
  }

  connect.core._triggerAuthFail = function(data) {
    connect.core.getUpstream().upstreamBus.trigger(connect.EventType.AUTH_FAIL, data);
  }

  connect.core._getAuthRetryCount = function() {
    let item = window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT);
    if (item !== null) {
      if (!isNaN(parseInt(item))) {
        return parseInt(item);
      } else {
        throw new connect.StateError("The session storage value for auth retry count was NaN");
      }
    } else {
      window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 0);
      return 0;
    } 
  }

  connect.core._incrementAuthRetryCount = function() {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, (connect.core._getAuthRetryCount()+1).toString());
  }

  connect.core.onAuthorizeRetriesExhausted = function(f) {
    connect.core.getEventBus().subscribe(connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED, f);
  }

  connect.core.onCTIAuthorizeRetriesExhausted = function(f) {
    connect.core.getEventBus().subscribe(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED, f);
  }
 
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
    connect.core.getUpstream().onUpstream(connect.ConnectionEvents.SESSION_INIT, f);
  };
 
  /**-----------------------------------------------------------------------*/
  connect.core.onConfigure = function(f) {
    connect.core.getUpstream().onUpstream(connect.ConfigurationEvents.CONFIGURE, f);
  }

   /**-----------------------------------------------------------------------*/
   connect.core.onInitialized = function(f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.EventType.INIT, f);
  }

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
      connect.ContactStateType.ERROR,
      connect.ContactEvents.ERROR)
    .assoc(connect.ContactStateType.CONNECTING,
      connect.ContactStateType.MISSED,
      connect.ContactEvents.MISSED);

  /**-----------------------------------------------------------------------*/
  connect.core.getClient = function () {
    if (!connect.core.client) {
      throw new connect.StateError('The connect core has not been initialized!');
    }
    return connect.core.client;
  };
  connect.core.client = null;

  /**-----------------------------------------------------------------------*/
  connect.core.getAgentAppClient = function () {
    if (!connect.core.agentAppClient) {
      throw new connect.StateError('The connect AgentApp Client has not been initialized!');
    }
    return connect.core.agentAppClient;
  };
  connect.core.agentAppClient = null;
 
  /**-----------------------------------------------------------------------*/
  connect.core.getTaskTemplatesClient = function () {
    if (!connect.core.taskTemplatesClient) {
      throw new connect.StateError('The connect TaskTemplates Client has not been initialized!');
    }
    return connect.core.taskTemplatesClient;
  };
  connect.core.taskTemplatesClient = null;

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