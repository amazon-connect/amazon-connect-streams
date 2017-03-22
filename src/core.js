/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   connect.core = {};

   connect.core.initialized = false;

   connect.DEFAULT_BATCH_SIZE = 10;

   var CCP_SYN_TIMEOUT = 1000; // 1 sec
   var CCP_ACK_TIMEOUT = 3000; // 3 sec
   var CCP_LOAD_TIMEOUT = 3000; // 3 sec
   var CCP_IFRAME_REFRESH_INTERVAL = 5000; // 5 sec

   var LOGIN_URL_PATTERN = "https://{alias}.awsapps.com/auth/?client_id={client_id}&redirect_uri={redirect}";
   var CLIENT_ID_MAP = {
      "us-east-1":   "06919f4fd8ed324e"
   };
   var createLoginUrl = function(params) {
      //connect.assertTrue(params.region in CLIENT_ID_MAP, "unsupported region");
      var redirect = "https://lily.us-east-1.amazonaws.com/taw/auth/code";
      connect.assertNotNull(params.alias);
      connect.assertNotNull(redirect);

      return LOGIN_URL_PATTERN
         .replace("{alias}", params.alias)
         .replace("{client_id}", CLIENT_ID_MAP["us-east-1"])
         .replace("{redirect}", global.encodeURIComponent(
            redirect));
   };

   /**-------------------------------------------------------------------------
    * Print a warning message if the Connect core is not initialized.
    */
   connect.core.checkNotInitialized = function() {
      if (connect.core.initialized) {
         var log = connect.getLog();
         log.warn("Connect core already initialized, only needs to be initialized once.");
      }
   };

   /**-------------------------------------------------------------------------
    * Basic Connect client initialization.
    * Should be used only by the API Shared Worker.
    */
   connect.core.init = function(params) {
      connect.assertNotNull(params, 'params');

      var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
      var region = connect.assertNotNull(params.region, 'params.region');
      var endpoint = params.endpoint || null;

      connect.core.eventBus = new connect.EventBus();
      connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
      connect.core.client = new connect.AWSClient(authToken, region, endpoint);
      connect.core.initialized = true;
   };

   /**-------------------------------------------------------------------------
    * Uninitialize Connect.
    */
   connect.core.terminate = function() {
      connect.core.client = new connect.NullClient();
      connect.core.masterClient = new connect.NullClient();
      connect.core.eventBus = new connect.EventBus();
      connect.core.initialized = false;
   };

   /**-------------------------------------------------------------------------
    * Setup the SoftphoneManager to be initialized when the agent
    * is determined to have softphone enabled.
    */
   connect.core.softphoneUserMediaStream = null;

   connect.core.getSoftphoneUserMediaStream = function() {
        return connect.core.softphoneUserMediaStream;
   };

   connect.core.setSoftphoneUserMediaStream = function(stream) {
        connect.core.softphoneUserMediaStream = stream;
   };

   connect.core.initSoftphoneManager = function(paramsIn) {
      var params = paramsIn || {};

      var competeForMasterOnAgentUpdate = function(softphoneParamsIn) {
         var softphoneParams = connect.merge(params.softphone || {}, softphoneParamsIn);

         connect.agent(function(agent) {
            agent.onRefresh(function() {
               var sub = this;

               connect.ifMaster(connect.MasterTopics.SOFTPHONE, function() {
                  if (! connect.core.softphoneManager && agent.isSoftphoneEnabled()) {
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
      if (connect.isFramed() && ! params.allowFramedSoftphone) {
         var bus = connect.core.getEventBus();
         bus.subscribe(connect.EventType.CONFIGURE, function(data) {
            if (data.softphone && data.softphone.allowFramedSoftphone) {
               competeForMasterOnAgentUpdate(data.softphone);
            }
         });
      } else {
         competeForMasterOnAgentUpdate(params);
      }
   };

   /**-------------------------------------------------------------------------
    * Initializes Connect by creating or connecting to the API Shared Worker.
    * Used primarily by the CCP.
    */
   connect.core.initSharedWorker = function(params) {
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

      try {
         // Initialize the event bus and agent data providers.
         connect.core.eventBus = new connect.EventBus({logEvents: true});
         connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());

         // Create the shared worker and upstream conduit.
         var worker = new SharedWorker(sharedWorkerUrl, "ConnectSharedWorker");
         var conduit = new connect.Conduit("ConnectSharedWorkerConduit",
               new connect.PortStream(worker.port),
               new connect.WindowIOStream(window, parent));

         // Close our port to the shared worker before the window closes.
         global.onbeforeunload = function() {
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
            authToken:     authToken,
            authTokenExpiration: authTokenExpiration,
            refreshToken:  refreshToken,
            endpoint:      endpoint,
            region:        region
         });
         conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function() {
            connect.getLog().info("Acknowledged by the ConnectSharedWorker!");
            connect.core.initialized = true;
            this.unsubscribe();
         });
         // Add all upstream log entries to our own logger.
         conduit.onUpstream(connect.EventType.LOG, function(logEntry) {
            connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
         });
         // Reload the page if the shared worker detects an API auth failure.
         conduit.onUpstream(connect.EventType.AUTH_FAIL, function(logEntry) {
            location.reload();
         });

         connect.core.client = new connect.UpstreamConduitClient(conduit);
         connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);

         // Pass the TERMINATE request upstream to the shared worker.
         connect.core.getEventBus().subscribe(connect.EventType.TERMINATE,
            conduit.passUpstream());

         // Refresh the page when we receive the TERMINATED response from the
         // shared worker.
         connect.core.getEventBus().subscribe(connect.EventType.TERMINATED, function() {
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
   connect.core.initCCP = function(containerDiv, paramsIn) {
      connect.core.checkNotInitialized();
      if (connect.core.initialized) {
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

      connect.assertNotNull(containerDiv, 'containerDiv');
      connect.assertNotNull(params.ccpUrl, 'params.ccpUrl');

      // Create the CCP iframe and append it to the container div.
      var iframe = document.createElement('iframe');
      iframe.src = params.ccpUrl;
      iframe.style = "width: 100%; height: 100%";
      containerDiv.appendChild(iframe);

      // Initialize the event bus and agent data providers.
      connect.core.eventBus = new connect.EventBus({logEvents: true});
      connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());

      // Build the upstream conduit communicating with the CCP iframe.
      var conduit = new connect.IFrameConduit(params.ccpUrl, window, iframe);
      conduit.onAllUpstream(connect.core.getEventBus().bridge());

      // Initialize the keepalive manager.
      connect.core.keepaliveManager = new KeepaliveManager(conduit,
                                                        connect.core.getEventBus(),
                                                        params.ccpSynTimeout || CCP_SYN_TIMEOUT,
                                                        params.ccpAckTimeout || CCP_ACK_TIMEOUT);
      connect.core.iframeRefreshInterval = null;

      // Allow 10 sec (default) before receiving the first ACK from the CCP.
      connect.core.ccpLoadTimeoutInstance = global.setTimeout(function() {
         connect.core.ccpLoadTimeoutInstance = null;
         connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
      }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);

      // Once we receive the first ACK, setup our upstream API client and establish
      // the SYN/ACK refresh flow.
      conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function() {
         connect.getLog().info("Acknowledged by the CCP!");
         connect.core.client = new connect.UpstreamConduitClient(conduit);
         connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
         connect.core.initialized = true;

         if (softphoneParams) {
            // Send configuration up to the CCP.
            conduit.sendUpstream(connect.EventType.CONFIGURE, {
               softphone:  softphoneParams
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
      conduit.onUpstream(connect.EventType.LOG, function(logEntry) {
         connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
      });

      // Pop a login page when we encounter an ACK timeout.
      connect.core.getEventBus().subscribe(connect.EventType.ACK_TIMEOUT, function() {
         // loginPopup is true by default, only false if explicitly set to false.
         if (params.loginPopup !== false) {
            try {
               var loginUrl = createLoginUrl(params, params.redirectUrl);
               connect.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page if not already open.");
               connect.core.getPopupManager().open(loginUrl, connect.MasterTopics.LOGIN_POPUP);

            } catch (e) {
               connect.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup.").withException(e);
            }
         }

         if (connect.core.iframeRefreshInterval == null) {
            connect.core.iframeRefreshInterval = window.setInterval(function() {
               iframe.src = params.ccpUrl;
            }, CCP_IFRAME_REFRESH_INTERVAL);

            conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function() {
               this.unsubscribe();
               global.clearInterval(connect.core.iframeRefreshInterval);
               connect.core.iframeRefreshInterval = null;
               connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
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

      this.conduit.sendUpstream(connect.EventType.SYNCHRONIZE);
      this.ackSub = this.conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function() {
         this.unsubscribe();
         global.clearTimeout(self.ackTimer);
         self.deferStart();
      });
      this.ackTimer = global.setTimeout(function() {
         self.ackSub.unsubscribe();
         self.eventBus.trigger(connect.EventType.ACK_TIMEOUT);
         self.deferStart();
      }, this.ackTimeout);
   };

   KeepaliveManager.prototype.deferStart = function() {
      if (this.synTimer == null) {
         this.synTimer = global.setTimeout(connect.hitch(this, this.start), this.synTimeout);
      }
   };

   /**-----------------------------------------------------------------------*/
   var AgentDataProvider = function(bus) {
      var agentData = null;
      this.bus = bus;
      this.bus.subscribe(connect.AgentEvents.UPDATE, connect.hitch(this, this.updateAgentData));
   };

   AgentDataProvider.prototype.updateAgentData = function(agentData) {
      var oldAgentData = this.agentData;
      this.agentData = agentData;

      this._calculateDurations();

      if (oldAgentData == null) {
         connect.agent.initialized = true;
         this.bus.trigger(connect.AgentEvents.INIT, new connect.Agent());
      }

      this.bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

      this._fireAgentUpdateEvents(oldAgentData);
   };

   AgentDataProvider.prototype.getAgentData = function() {
      if (this.agentData == null) {
         throw new connect.StateError('No agent data is available yet!');
      }

      return this.agentData;
   };

   AgentDataProvider.prototype.getContactData = function(contactId) {
      var agentData = this.getAgentData();
      var contactData = connect.find(agentData.snapshot.contacts, function(ctdata) {
         return ctdata.contactId === contactId;
      });

      if (contactData == null) {
         throw new connect.StateError('Contact %s no longer exists.', contactId);
      }

      return contactData;
   };

   AgentDataProvider.prototype.getConnectionData = function(contactId, connectionId) {
      var contactData = this.getContactData(contactId);
      var connectionData = connect.find(contactData.connections, function(cdata) {
         return cdata.connectionId === connectionId;
      });

      if (connectionData == null) {
         throw new connect.StateError('Connection %s for contact %s no longer exists.', connectionId, contactId);
      }

      return connectionData;
   };

   AgentDataProvider.prototype._calculateDurations = function() {
      var now = connect.now();
      var self = this;
      this.agentData.snapshot.localTimestamp = now;

      var skew = this.agentData.snapshot.snapshotTimestamp - this.agentData.snapshot.localTimestamp;

      this.agentData.snapshot.state.duration = Math.round(now - this.agentData.snapshot.state.startTimestamp.getTime() + skew);

      this.agentData.snapshot.contacts.forEach(function(contact) {
         var ts = new Date(contact.timestamp).getTime();
         contact.state.duration = Math.round(now - contact.state.timestamp.getTime() + skew);

         contact.connections.forEach(function(conn) {
            conn.state.duration = Math.round(now - conn.state.timestamp.getTime() + skew);
         });
      });
   };

   AgentDataProvider.prototype._diffContacts = function(oldAgentData) {
      var diff = {
         added:      {},
         removed:    {},
         common:     {},
         oldMap:     connect.index(oldAgentData == null ? [] : oldAgentData.snapshot.contacts, function(contact) { return contact.contactId; }),
         newMap:     connect.index(this.agentData.snapshot.contacts, function(contact) { return contact.contactId; })
      };

      connect.keys(diff.oldMap).forEach(function(contactId) {
         if (connect.contains(diff.newMap, contactId)) {
            diff.common[contactId] = diff.newMap[contactId];
         } else {
            diff.removed[contactId] = diff.oldMap[contactId];
         }
      });

      connect.keys(diff.newMap).forEach(function(contactId) {
         if (! connect.contains(diff.oldMap, contactId)) {
            diff.added[contactId] = diff.newMap[contactId];
         }
      });

      return diff;
   };

   AgentDataProvider.prototype._fireAgentUpdateEvents = function(oldAgentData) {
      var self = this;
      var diff = null;
      var oldAgentState = oldAgentData == null ? connect.AgentAvailStates.INIT : oldAgentData.snapshot.state.name;
      var newAgentState = this.agentData.snapshot.state.name;
      var oldRoutingState = oldAgentData == null ? connect.AgentStateType.INIT : oldAgentData.snapshot.state.type;
      var newRoutingState = this.agentData.snapshot.state.type;

      if (oldRoutingState !== newRoutingState) {
         connect.core.getAgentRoutingEventGraph().getAssociations(this, oldRoutingState, newRoutingState).forEach(function(event) {
            self.bus.trigger(event, new connect.Agent());
         });
      }

      if (oldAgentState !== newAgentState) {
         this.bus.trigger(connect.AgentEvents.STATE_CHANGE, {
            agent:      new connect.Agent(),
            oldState:  oldAgentState,
            newState:  newAgentState

         });
         connect.core.getAgentStateEventGraph().getAssociations(this, oldAgentState, newAgentState).forEach(function(event) {
            self.bus.trigger(event, new connect.Agent());
         });
      }

      if (oldAgentData !== null) {
         diff = this._diffContacts(oldAgentData);

      } else {
         diff =  {
            added:      connect.index(this.agentData.snapshot.contacts, function(contact) { return contact.contactId; }),
            removed:    {},
            common:     {},
            oldMap:     {},
            newMap:     connect.index(this.agentData.snapshot.contacts, function(contact) { return contact.contactId; })
         };
      }

      connect.values(diff.added).forEach(function(contactData) {
         self.bus.trigger(connect.ContactEvents.INIT, new connect.Contact(contactData.contactId));
         self._fireContactUpdateEvents(contactData.contactId, connect.ContactStateType.INIT, contactData.state.type);
      });

      connect.values(diff.removed).forEach(function(contactData) {
         self.bus.trigger(connect.ContactEvents.DESTROYED, new connect.ContactSnapshot(contactData));
         self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.DESTROYED, contactData.contactId), new connect.ContactSnapshot(contactData));
         self._unsubAllContactEventsForContact(contactData.contactId);
      });

      connect.keys(diff.common).forEach(function(contactId) {
         self._fireContactUpdateEvents(contactId, diff.oldMap[contactId].state.type, diff.newMap[contactId].state.type);
      });
   };

   AgentDataProvider.prototype._fireContactUpdateEvents = function(contactId, oldContactState, newContactState) {
      var self = this;
      if (oldContactState !== newContactState) {
         connect.core.getContactEventGraph().getAssociations(this, oldContactState, newContactState).forEach(function(event) {
            self.bus.trigger(event, new connect.Contact(contactId));
            self.bus.trigger(connect.core.getContactEventName(event, contactId), new connect.Contact(contactId));
         });
      }

      self.bus.trigger(connect.ContactEvents.REFRESH, new connect.Contact(contactId));
      self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), new connect.Contact(contactId));
   };

   AgentDataProvider.prototype._unsubAllContactEventsForContact = function(contactId) {
      var self = this;
      connect.values(connect.ContactEvents).forEach(function(eventName) {
         self.bus.getSubscriptions(connect.core.getContactEventName(eventName, contactId))
            .map(function(sub) { sub.unsubscribe(); });
      });
   };

   /**-----------------------------------------------------------------------*/
   connect.core.getContactEventName = function(eventName, contactId) {
      connect.assertNotNull(eventName, 'eventName');
      connect.assertNotNull(contactId, 'contactId');
      if (! connect.contains(connect.values(connect.ContactEvents), eventName)) {
         throw new connect.ValueError('%s is not a valid contact event.', eventName);
      }
      return connect.sprintf('%s::%s', eventName, contactId);
   };

   /**-----------------------------------------------------------------------*/
   connect.core.getEventBus = function() {
      return connect.core.eventBus;
   };

   /**-----------------------------------------------------------------------*/
   connect.core.getAgentDataProvider = function() {
      return connect.core.agentDataProvider;
   };

   /**-----------------------------------------------------------------------*/
   connect.core.getLocalTimestamp = function() {
      return connect.core.getAgentDataProvider().getAgentData().snapshot.localTimestamp;
   };

   /**-----------------------------------------------------------------------*/
   connect.core.getAgentRoutingEventGraph = function() {
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
   connect.core.getAgentStateEventGraph = function() {
      return connect.core.agentStateEventGraph;
   };
   connect.core.agentStateEventGraph = new connect.EventGraph()
      .assoc(connect.EventGraph.ANY,
             connect.values(connect.AgentErrorStates),
             connect.AgentEvents.ERROR)
      .assoc(connect.EventGraph.ANY, connect.AgentAvailStates.AFTER_CALL_WORK,
             connect.AgentEvents.ACW);

   /**-----------------------------------------------------------------------*/
   connect.core.getContactEventGraph = function() {
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
      .assoc(connect.ContactStateType.INCOMING,
             connect.ContactStateType.ERROR,
             connect.ContactEvents.MISSED)
      .assoc(connect.EventGraph.ANY,
             connect.ContactStateType.ENDED,
             connect.ContactEvents.ACW)
      .assoc(connect.values(connect.CONTACT_ACTIVE_STATES),
             connect.values(connect.relativeComplement(connect.CONTACT_ACTIVE_STATES, connect.ContactStateType)),
             connect.ContactEvents.ENDED);

   /**-----------------------------------------------------------------------*/
   connect.core.getClient = function() {
      if (! connect.core.client) {
         throw new connect.StateError('The connect core has not been initialized!');
      }
      return connect.core.client;
   };
   connect.core.client = null;

   /**-----------------------------------------------------------------------*/
   connect.core.getMasterClient = function() {
      if (! connect.core.masterClient) {
         throw new connect.StateError('The connect master client has not been initialized!');
      }
      return connect.core.masterClient;
   };
   connect.core.masterClient = null;

   /**-----------------------------------------------------------------------*/
   connect.core.getSoftphoneManager = function() {
      return connect.core.softphoneManager;
   };
   connect.core.softphoneManager = null;

   /**-----------------------------------------------------------------------*/
   connect.core.getNotificationManager = function() {
      if (! connect.core.notificationManager) {
         connect.core.notificationManager = new connect.NotificationManager();
      }
      return connect.core.notificationManager;
   };
   connect.core.notificationManager = null;

   /**-----------------------------------------------------------------------*/
   connect.core.getPopupManager = function() {
      return connect.core.popupManager;
   };
   connect.core.popupManager = new connect.PopupManager();

   /**-----------------------------------------------------------------------*/
   connect.core.AgentDataProvider = AgentDataProvider;

})();
