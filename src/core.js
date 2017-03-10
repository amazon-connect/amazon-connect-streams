(function() {

   var global = this;
   lily = global.lily || {};
   global.lily = lily;

   lily.core = {};

   lily.core.initialized = false;

   var CCP_SYN_TIMEOUT = 1000; // 1 sec
   var CCP_ACK_TIMEOUT = 3000; // 3 sec
   var CCP_LOAD_TIMEOUT = 10000; // 10 sec
   var CCP_IFRAME_REFRESH_INTERVAL = 5000; // 5 sec

   var LOGIN_URL_PATTERN = "https://{alias}.awsapps.com/auth/?client_id={client_id}&redirect_uri={redirect}";
   var CLIENT_ID_MAP = {
      "devo":        "b661e4d55bcdc85f",
      "us-east-1":   "06919f4fd8ed324e"
   };
   var createLoginUrl = function(params, redirect) {
      lily.assertTrue(params.region in CLIENT_ID_MAP, "unsupported region");
      lily.assertNotNull(params.alias);
      lily.assertNotNull(redirect);

      return LOGIN_URL_PATTERN
         .replace("{alias}", params.alias)
         .replace("{client_id}", CLIENT_ID_MAP[params.region])
         .replace("{redirect}", global.encodeURIComponent(
            redirect));
   };

   /**-------------------------------------------------------------------------
    * Print a warning message if the Lily core is not initialized.
    */
   lily.core.checkNotInitialized = function() {
      if (lily.core.initialized) {
         var log = lily.getLog();
         log.warn("Lily core already initialized, only needs to be initialized once.");
      }
   };

   /**-------------------------------------------------------------------------
    * Basic Lily client initialization.
    * Should be used only by the API Shared Worker.
    */
   lily.core.init = function(params) {
      lily.assertNotNull(params, 'params');

      var authToken = lily.assertNotNull(params.authToken, 'params.authToken');
      var region = lily.assertNotNull(params.region, 'params.region');
      var endpoint = params.endpoint || null;

      lily.core.eventBus = new lily.EventBus();
      lily.core.agentDataProvider = new AgentDataProvider(lily.core.getEventBus());
      lily.core.client = new lily.AWSLilyClient(authToken, region, endpoint);
      lily.core.initialized = true;
   };

   /**-------------------------------------------------------------------------
    * Uninitialize Lily.
    */
   lily.core.terminate = function() {
      lily.core.client = new lily.NullClient();
      lily.core.masterClient = new lily.NullClient();
      lily.core.eventBus = new lily.EventBus();
      lily.core.initialized = false;
   };

   /**-------------------------------------------------------------------------
    * Setup the SoftphoneManager to be initialized when the agent
    * is determined to have softphone enabled.
    */
   lily.core.softphoneUserMediaStream = null;

   lily.core.getSoftphoneUserMediaStream = function() {
        return lily.core.softphoneUserMediaStream;
   };

   lily.core.setSoftphoneUserMediaStream = function(stream) {
        lily.core.softphoneUserMediaStream = stream;
   };

   lily.core.initSoftphoneManager = function(paramsIn) {
      var params = paramsIn || {};

      var competeForMasterOnAgentUpdate = function(softphoneParamsIn) {
         var softphoneParams = lily.merge(params.softphone || {}, softphoneParamsIn);

         lily.agent(function(agent) {
            agent.onRefresh(function() {
               var sub = this;

               lily.ifMaster(lily.MasterTopics.SOFTPHONE, function() {
                  if (! lily.core.softphoneManager && agent.isSoftphoneEnabled()) {
                     // Become master to send logs, since we need logs from softphone tab.
                     lily.becomeMaster(lily.MasterTopics.SEND_LOGS);
                     lily.core.softphoneManager = new lily.SoftphoneManager(softphoneParams);
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
      if (lily.isFramed() && ! params.allowFramedSoftphone) {
         var bus = lily.core.getEventBus();
         bus.subscribe(lily.EventType.CONFIGURE, function(data) {
            if (data.softphone && data.softphone.allowFramedSoftphone) {
               competeForMasterOnAgentUpdate(data.softphone);
            }
         });
      } else {
         competeForMasterOnAgentUpdate(params);
      }
   };

   /**-------------------------------------------------------------------------
    * Initializes Lily by creating or connecting to the API Shared Worker.
    * Used primarily by the CCP.
    */
   lily.core.initSharedWorker = function(params) {
      lily.core.checkNotInitialized();
      if (lily.core.initialized) {
         return;
      }
      lily.assertNotNull(params, 'params');

      var sharedWorkerUrl = lily.assertNotNull(params.sharedWorkerUrl, 'params.sharedWorkerUrl');
      var authToken = lily.assertNotNull(params.authToken, 'params.authToken');
      var region = lily.assertNotNull(params.region, 'params.region');
      var endpoint = params.endpoint || null;

      try {
         // Initialize the event bus and agent data providers.
         lily.core.eventBus = new lily.EventBus({logEvents: true});
         lily.core.agentDataProvider = new AgentDataProvider(lily.core.getEventBus());

         // Create the shared worker and upstream conduit.
         var worker = new SharedWorker(sharedWorkerUrl, "LilySharedWorker");
         var conduit = new lily.Conduit("LilySharedWorkerConduit",
               new lily.PortStream(worker.port),
               new lily.WindowIOStream(window, parent));

         // Close our port to the shared worker before the window closes.
         global.onbeforeunload = function() {
            conduit.sendUpstream(lily.EventType.CLOSE);
            worker.port.close();
         };

         lily.getLog().scheduleUpstreamLogPush(conduit);
         // Bridge all upstream messages into the event bus.
         conduit.onAllUpstream(lily.core.getEventBus().bridge());
         // Bridge all downstream messages into the event bus.
         conduit.onAllDownstream(lily.core.getEventBus().bridge());
         // Pass all upstream messages (from shared worker) downstream (to CCP consumer).
         conduit.onAllUpstream(conduit.passDownstream());
         // Pass all downstream messages (from CCP consumer) upstream (to shared worker).
         conduit.onAllDownstream(conduit.passUpstream());
         // Send configuration up to the shared worker.
         conduit.sendUpstream(lily.EventType.CONFIGURE, {
            authToken:     authToken,
            endpoint:      endpoint,
            region:        region
         });
         conduit.onUpstream(lily.EventType.ACKNOWLEDGE, function() {
            lily.getLog().info("Acknowledged by the LilySharedWorker!");
            lily.core.initialized = true;
            this.unsubscribe();
         });
         // Add all upstream log entries to our own logger.
         conduit.onUpstream(lily.EventType.LOG, function(logEntry) {
            lily.getLog().addLogEntry(lily.LogEntry.fromObject(logEntry));
         });
         // Reload the page if the shared worker detects an API auth failure.
         conduit.onUpstream(lily.EventType.AUTH_FAIL, function(logEntry) {
            location.reload();
         });

         lily.core.client = new lily.UpstreamConduitLilyClient(conduit);
         lily.core.masterClient = new lily.UpstreamConduitMasterClient(conduit);

         // Pass the TERMINATE request upstream to the shared worker.
         lily.core.getEventBus().subscribe(lily.EventType.TERMINATE,
            conduit.passUpstream());

         // Refresh the page when we receive the TERMINATED response from the
         // shared worker.
         lily.core.getEventBus().subscribe(lily.EventType.TERMINATED, function() {
            window.location.reload(true);
         });

         worker.port.start();

         // Attempt to get permission to show notifications.
         var nm = lily.core.getNotificationManager();
         nm.requestPermission();

      } catch (e) {
         lily.getLog().error("Failed to initialize the API shared worker, we're dead!")
            .withException(e);
      }
   };

   /**-------------------------------------------------------------------------
    * Initializes Lily by creating or connecting to the API Shared Worker.
    * Initializes Lily by loading the CCP in an iframe and connecting to it.
    */
   lily.core.initCCP = function(containerDiv, paramsIn) {
      lily.core.checkNotInitialized();
      if (lily.core.initialized) {
         return;
      }

      // For backwards compatibility, when instead of taking a params object
      // as input we only accepted ccpUrl.
      var params = {};
      if (typeof(paramsIn) === 'string') {
         params.ccpUrl = paramsIn;
      } else {
         params = paramsIn;
      }

      var softphoneParams = params.softphone || null;

      lily.assertNotNull(containerDiv, 'containerDiv');
      lily.assertNotNull(params.ccpUrl, 'params.ccpUrl');

      // Create the CCP iframe and append it to the container div.
      var iframe = document.createElement('iframe');
      iframe.src = params.ccpUrl;
      iframe.style = "width: 100%; height: 100%";
      containerDiv.appendChild(iframe);

      // Initialize the event bus and agent data providers.
      lily.core.eventBus = new lily.EventBus({logEvents: true});
      lily.core.agentDataProvider = new AgentDataProvider(lily.core.getEventBus());

      // Build the upstream conduit communicating with the CCP iframe.
      var conduit = new lily.IFrameConduit(params.ccpUrl, window, iframe);
      conduit.onAllUpstream(lily.core.getEventBus().bridge());

      // Initialize the keepalive manager.
      lily.core.keepaliveManager = new KeepaliveManager(conduit,
                                                        lily.core.getEventBus(),
                                                        params.ccpSynTimeout || CCP_SYN_TIMEOUT,
                                                        params.ccpAckTimeout || CCP_ACK_TIMEOUT);
      lily.core.iframeRefreshInterval = null;

      // Allow 10 sec (default) before receiving the first ACK from the CCP.
      lily.core.ccpLoadTimeoutInstance = global.setTimeout(function() {
         lily.core.ccpLoadTimeoutInstance = null;
         lily.core.getEventBus().trigger(lily.EventType.ACK_TIMEOUT);
      }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);

      // Once we receive the first ACK, setup our upstream API client and establish
      // the SYN/ACK refresh flow.
      conduit.onUpstream(lily.EventType.ACKNOWLEDGE, function() {
         lily.getLog().info("Acknowledged by the CCP!");
         lily.core.client = new lily.UpstreamConduitLilyClient(conduit);
         lily.core.masterClient = new lily.UpstreamConduitMasterClient(conduit);
         lily.core.initialized = true;

         if (softphoneParams) {
            // Send configuration up to the CCP.
            conduit.sendUpstream(lily.EventType.CONFIGURE, {
               softphone:  softphoneParams
            });
         }

         if (lily.core.ccpLoadTimeoutInstance) {
            global.clearTimeout(lily.core.ccpLoadTimeoutInstance);
            lily.core.ccpLoadTimeoutInstance = null;
         }

         lily.core.keepaliveManager.start();
         this.unsubscribe();
      });

      // Add any logs from the upstream to our own logger.
      conduit.onUpstream(lily.EventType.LOG, function(logEntry) {
         lily.getLog().addLogEntry(lily.LogEntry.fromObject(logEntry));
      });

      // Pop a login page when we encounter an ACK timeout.
      lily.core.getEventBus().subscribe(lily.EventType.ACK_TIMEOUT, function() {
         try {
            var loginUrl = createLoginUrl(params, params.redirectUrl);
            lily.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page if not already open.");
            lily.core.getPopupManager().open(loginUrl, lily.MasterTopics.LOGIN_POPUP);

         } catch (e) {
            lily.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup.").withException(e);
         }

         if (lily.core.iframeRefreshInterval == null) {
            lily.core.iframeRefreshInterval = window.setInterval(function() {
               iframe.src = params.ccpUrl;
            }, CCP_IFRAME_REFRESH_INTERVAL);

            conduit.onUpstream(lily.EventType.ACKNOWLEDGE, function() {
               this.unsubscribe();
               global.clearInterval(lily.core.iframeRefreshInterval);
               lily.core.iframeRefreshInterval = null;
               lily.core.getPopupManager().clear(lily.MasterTopics.LOGIN_POPUP);
            });
         }
      });
   };

   /**-----------------------------------------------------------------------*/
   var KeepaliveManager = function(conduit, eventBus, synTimeout, ackTimeout) {
      this.conduit = conduit;
      this.eventBus = eventBus;
      this.synTimeout = synTimeout;
      this.ackTimeout = ackTimeout;
      this.ackTimer = null;
      this.synTimer = null;
      this.ackSub = null;
   };

   KeepaliveManager.prototype.start = function() {
      var self = this;

      this.conduit.sendUpstream(lily.EventType.SYNCHRONIZE);
      this.ackSub = this.conduit.onUpstream(lily.EventType.ACKNOWLEDGE, function() {
         this.unsubscribe();
         global.clearTimeout(self.ackTimer);
         self.deferStart();
      });
      this.ackTimer = global.setTimeout(function() {
         self.ackSub.unsubscribe();
         self.eventBus.trigger(lily.EventType.ACK_TIMEOUT);
         self.deferStart();
      }, this.ackTimeout);
   };

   KeepaliveManager.prototype.deferStart = function() {
      if (this.synTimer == null) {
         this.synTimer = global.setTimeout(lily.hitch(this, this.start), this.synTimeout);
      }
   };

   /**-----------------------------------------------------------------------*/
   var AgentDataProvider = function(bus) {
      var agentData = null;
      this.bus = bus;
      this.bus.subscribe(lily.AgentEvents.UPDATE, lily.hitch(this, this.updateAgentData));
   };

   AgentDataProvider.prototype.updateAgentData = function(agentData) {
      var oldAgentData = this.agentData;
      this.agentData = agentData;

      this._calculateDurations();

      if (oldAgentData == null) {
         lily.agent.initialized = true;
         this.bus.trigger(lily.AgentEvents.INIT, new lily.Agent());
      }

      this.bus.trigger(lily.AgentEvents.REFRESH, new lily.Agent());

      this._fireAgentUpdateEvents(oldAgentData);
   };

   AgentDataProvider.prototype.getAgentData = function() {
      if (this.agentData == null) {
         throw new lily.StateError('No agent data is available yet!');
      }

      return this.agentData;
   };

   AgentDataProvider.prototype.getContactData = function(contactId) {
      var agentData = this.getAgentData();
      var contactData = lily.find(agentData.contacts, function(ctdata) {
         return ctdata.contactId === contactId;
      });

      if (contactData == null) {
         throw new lily.StateError('Contact %s no longer exists.', contactId);
      }

      return contactData;
   };

   AgentDataProvider.prototype.getConnectionData = function(contactId, connectionId) {
      var contactData = this.getContactData(contactId);
      var connectionData = lily.find(contactData.connections, function(cdata) {
         return cdata.connectionId === connectionId;
      });

      if (connectionData == null) {
         throw new lily.StateError('Connection %s for contact %s no longer exists.', connectionId, contactId);
      }

      return connectionData;
   };

   AgentDataProvider.prototype._calculateDurations = function() {
      var now = lily.now();
      var self = this;
      this.agentData.localTimestamp = now;

      var skew = this.agentData.timestamp - this.agentData.localTimestamp;

      this.agentData.status.duration = Math.round(now - this.agentData.status.timestamp.getTime() + skew);

      this.agentData.contacts.forEach(function(contact) {
         var ts = new Date(contact.timestamp).getTime();
         contact.status.duration = Math.round(now - contact.status.timestamp.getTime() + skew);

         contact.connections.forEach(function(conn) {
            conn.status.duration = Math.round(now - conn.status.timestamp.getTime() + skew);
         });
      });
   };

   AgentDataProvider.prototype._diffContacts = function(oldAgentData) {
      var diff = {
         added:      {},
         removed:    {},
         common:     {},
         oldMap:     lily.index(oldAgentData == null ? [] : oldAgentData.contacts, function(contact) { return contact.contactId; }),
         newMap:     lily.index(this.agentData.contacts, function(contact) { return contact.contactId; })
      };

      lily.keys(diff.oldMap).forEach(function(contactId) {
         if (lily.contains(diff.newMap, contactId)) {
            diff.common[contactId] = diff.newMap[contactId];
         } else {
            diff.removed[contactId] = diff.oldMap[contactId];
         }
      });

      lily.keys(diff.newMap).forEach(function(contactId) {
         if (! lily.contains(diff.oldMap, contactId)) {
            diff.added[contactId] = diff.newMap[contactId];
         }
      });

      return diff;
   };

   AgentDataProvider.prototype._fireAgentUpdateEvents = function(oldAgentData) {
      var self = this;
      var diff = null;
      var oldAgentStatus = oldAgentData == null ? lily.AgentAvailStates.INIT : oldAgentData.status.name;
      var newAgentStatus = this.agentData.status.name;
      var oldRoutingStatus = oldAgentData == null ? lily.AgentStatusType.INIT : oldAgentData.status.type;
      var newRoutingStatus = this.agentData.status.type;

      if (oldRoutingStatus !== newRoutingStatus) {
         lily.core.getAgentRoutingEventGraph().getAssociations(this, oldRoutingStatus, newRoutingStatus).forEach(function(event) {
            self.bus.trigger(event, new lily.Agent());
         });
      }

      if (oldAgentStatus !== newAgentStatus) {
         this.bus.trigger(lily.AgentEvents.STATE_CHANGE, {
            agent:      new lily.Agent(),
            oldState:  oldAgentStatus,
            newState:  newAgentStatus

         });
         lily.core.getAgentStateEventGraph().getAssociations(this, oldAgentStatus, newAgentStatus).forEach(function(event) {
            self.bus.trigger(event, new lily.Agent());
         });
      }

      if (oldAgentData !== null) {
         diff = this._diffContacts(oldAgentData);

      } else {
         diff =  {
            added:      lily.index(this.agentData.contacts, function(contact) { return contact.contactId; }),
            removed:    {},
            common:     {},
            oldMap:     {},
            newMap:     lily.index(this.agentData.contacts, function(contact) { return contact.contactId; })
         };
      }

      lily.values(diff.added).forEach(function(contactData) {
         self.bus.trigger(lily.ContactEvents.INIT, new lily.Contact(contactData.contactId));
         self._fireContactUpdateEvents(contactData.contactId, lily.ContactStatusType.INIT, contactData.status.type);
      });

      lily.values(diff.removed).forEach(function(contactData) {
         self.bus.trigger(lily.ContactEvents.DESTROYED, new lily.ContactSnapshot(contactData));
         self.bus.trigger(lily.core.getContactEventName(lily.ContactEvents.DESTROYED, contactData.contactId), new lily.ContactSnapshot(contactData));
         self._unsubAllContactEventsForContact(contactData.contactId);
      });

      lily.keys(diff.common).forEach(function(contactId) {
         self._fireContactUpdateEvents(contactId, diff.oldMap[contactId].status.type, diff.newMap[contactId].status.type);
      });
   };

   AgentDataProvider.prototype._fireContactUpdateEvents = function(contactId, oldContactStatus, newContactStatus) {
      var self = this;
      if (oldContactStatus !== newContactStatus) {
         lily.core.getContactEventGraph().getAssociations(this, oldContactStatus, newContactStatus).forEach(function(event) {
            self.bus.trigger(event, new lily.Contact(contactId));
            self.bus.trigger(lily.core.getContactEventName(event, contactId), new lily.Contact(contactId));
         });
      }

      self.bus.trigger(lily.ContactEvents.REFRESH, new lily.Contact(contactId));
      self.bus.trigger(lily.core.getContactEventName(lily.ContactEvents.REFRESH, contactId), new lily.Contact(contactId));
   };

   AgentDataProvider.prototype._unsubAllContactEventsForContact = function(contactId) {
      var self = this;
      lily.values(lily.ContactEvents).forEach(function(eventName) {
         self.bus.getSubscriptions(lily.core.getContactEventName(eventName, contactId))
            .map(function(sub) { sub.unsubscribe(); });
      });
   };

   /**-----------------------------------------------------------------------*/
   lily.core.getContactEventName = function(eventName, contactId) {
      lily.assertNotNull(eventName, 'eventName');
      lily.assertNotNull(contactId, 'contactId');
      if (! lily.contains(lily.values(lily.ContactEvents), eventName)) {
         throw new lily.ValueError('%s is not a valid contact event.', eventName);
      }
      return lily.sprintf('%s::%s', eventName, contactId);
   };

   /**-----------------------------------------------------------------------*/
   lily.core.getEventBus = function() {
      return lily.core.eventBus;
   };

   /**-----------------------------------------------------------------------*/
   lily.core.getAgentDataProvider = function() {
      return lily.core.agentDataProvider;
   };

   /**-----------------------------------------------------------------------*/
   lily.core.getLocalTimestamp = function() {
      return lily.core.getAgentDataProvider().getAgentData().localTimestamp;
   };

   /**-----------------------------------------------------------------------*/
   lily.core.getAgentRoutingEventGraph = function() {
      return lily.core.agentRoutingEventGraph;
   };
   lily.core.agentRoutingEventGraph = new lily.EventGraph()
      .assoc(lily.EventGraph.ANY, lily.AgentStatusType.ROUTABLE,
             lily.AgentEvents.ROUTABLE)
      .assoc(lily.EventGraph.ANY, lily.AgentStatusType.NOT_ROUTABLE,
             lily.AgentEvents.NOT_ROUTABLE)
      .assoc(lily.EventGraph.ANY, lily.AgentStatusType.OFFLINE,
             lily.AgentEvents.OFFLINE);

   /**-----------------------------------------------------------------------*/
   lily.core.getAgentStateEventGraph = function() {
      return lily.core.agentStateEventGraph;
   };
   lily.core.agentStateEventGraph = new lily.EventGraph()
      .assoc(lily.EventGraph.ANY,
             lily.values(lily.AgentErrorStates),
             lily.AgentEvents.ERROR)
      .assoc(lily.EventGraph.ANY, lily.AgentAvailStates.AFTER_CALL_WORK,
             lily.AgentEvents.ACW);

   /**-----------------------------------------------------------------------*/
   lily.core.getContactEventGraph = function() {
      return lily.core.contactEventGraph;
   };

   lily.core.contactEventGraph = new lily.EventGraph()
      .assoc(lily.EventGraph.ANY,
             lily.ContactStatusType.INCOMING,
             lily.ContactEvents.INCOMING)
      .assoc(lily.EventGraph.ANY,
             lily.ContactStatusType.PENDING,
             lily.ContactEvents.PENDING)
      .assoc(lily.EventGraph.ANY,
             lily.ContactStatusType.CONNECTING,
             lily.ContactEvents.CONNECTING)
      .assoc(lily.EventGraph.ANY,
             lily.ContactStatusType.CONNECTED,
             lily.ContactEvents.CONNECTED)
      .assoc(lily.ContactStatusType.INCOMING,
             lily.ContactStatusType.ERROR,
             lily.ContactEvents.MISSED)
      .assoc(lily.EventGraph.ANY,
             lily.ContactStatusType.ENDED,
             lily.ContactEvents.ACW)
      .assoc(lily.values(lily.CONTACT_ACTIVE_STATES),
             lily.values(lily.relativeComplement(lily.CONTACT_ACTIVE_STATES, lily.ContactStatusType)),
             lily.ContactEvents.ENDED);

   /**-----------------------------------------------------------------------*/
   lily.core.getClient = function() {
      if (! lily.core.client) {
         throw new lily.StateError('The lily core has not been initialized!');
      }
      return lily.core.client;
   };
   lily.core.client = null;

   /**-----------------------------------------------------------------------*/
   lily.core.getMasterClient = function() {
      if (! lily.core.masterClient) {
         throw new lily.StateError('The lily master client has not been initialized!');
      }
      return lily.core.masterClient;
   };
   lily.core.masterClient = null;

   /**-----------------------------------------------------------------------*/
   lily.core.getSoftphoneManager = function() {
      return lily.core.softphoneManager;
   };
   lily.core.softphoneManager = null;

   /**-----------------------------------------------------------------------*/
   lily.core.getNotificationManager = function() {
      if (! lily.core.notificationManager) {
         lily.core.notificationManager = new lily.NotificationManager();
      }
      return lily.core.notificationManager;
   };
   lily.core.notificationManager = null;

   /**-----------------------------------------------------------------------*/
   lily.core.getPopupManager = function() {
      return lily.core.popupManager;
   };
   lily.core.popupManager = new lily.PopupManager();

   /**-----------------------------------------------------------------------*/
   lily.core.AgentDataProvider = AgentDataProvider;

})();
