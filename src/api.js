(function() {

   var global = this;
   lily = global.lily || {};
   global.lily = lily;

   /*----------------------------------------------------------------
    * enum AgentStatusType
    */
   lily.AgentStatusType = lily.makeEnum([
         'init',
         'routable',
         'not_routable',
         'offline'
   ]);

   /**
    * enum AgentAvailStates
    */
   lily.AgentAvailStates = lily.makeEnum([
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
   lily.AgentErrorStates = lily.makeEnum([
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
   lily.AddressType = lily.makeEnum([
         'phone_number',
         'agent',
         'queue'
   ]);

   /*----------------------------------------------------------------
    * enum ConnectionType
    */
   lily.ConnectionType = lily.makeEnum([
         'agent',
         'inbound',
         'outbound',
         'monitoring'
   ]);

   /*----------------------------------------------------------------
    * enum ConnectionStatusType
    */
   lily.ConnectionStatusType = lily.makeEnum([
         'init',
         'connecting',
         'connected',
         'hold',
         'disconnected'
   ]);

   lily.CONNECTION_ACTIVE_STATES = lily.set([
         lily.ConnectionStatusType.CONNECTING,
         lily.ConnectionStatusType.CONNECTED,
         lily.ConnectionStatusType.HOLD
   ]);

   /*----------------------------------------------------------------
    * enum ContactStatusType
    */
   lily.ContactStatusType = lily.makeEnum([
         'init',
         'incoming',
         'pending',
         'connecting',
         'connected',
         'missed',
         'error',
         'ended'
   ]);

   lily.CONTACT_ACTIVE_STATES = lily.makeEnum([
         'incoming',
         'connecting',
         'connected'
   ]);

   /*----------------------------------------------------------------
    * enum ContactType
    */
   lily.ContactType = lily.makeEnum([
         'voice',
         'queue_callback'
   ]);

   /*----------------------------------------------------------------
    * enum SoftphoneCallType
    */
   lily.SoftphoneCallType = lily.makeEnum([
         'audio_video',
         'video_only',
         'audio_only',
         'none'
   ]);

   /*----------------------------------------------------------------
    * enum for SoftphoneErrorTypes
    */
    lily.SoftphoneErrorTypes = lily.makeEnum([
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
    * class Agent
    */
   var Agent = function() {
      if (! lily.agent.initialized) {
         throw new lily.StateError("The agent is not yet initialized!");
      }
   };

   Agent.prototype._getData = function() {
      return lily.core.getAgentDataProvider().getAgentData();
   };

   Agent.prototype._createContactAPI = function(contactData) {
      return new lily.Contact(contactData.contactId);
   };

   Agent.prototype.onContactPending = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.CONTACT_PENDING, f);
   };

   Agent.prototype.onRefresh = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.REFRESH, f);
   };

   Agent.prototype.onRoutable = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.ROUTABLE, f);
   };

   Agent.prototype.onNotRoutable = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.NOT_ROUTABLE, f);
   };

   Agent.prototype.onOffline = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.OFFLINE, f);
   };

   Agent.prototype.onError = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.ERROR, f);
   };

   Agent.prototype.onSoftphoneError = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.SOFTPHONE_ERROR, f);
   };

   Agent.prototype.onAfterCallWork = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.ACW, f);
   };

   Agent.prototype.onStateChange = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.AgentEvents.STATE_CHANGE, f);
   };

   Agent.prototype.getStatus = function() {
      return this._getData().status;
   };

   Agent.prototype.getStatusDuration = function() {
      return lily.now() - lily.core.getLocalTimestamp() + this._getData().status.duration * 1000;
   };

   Agent.prototype.getPermissions = function() {
      return this._getData().permissions;
   };

   Agent.prototype.getContacts = function(contactTypeFilter) {
      var self = this;
      return this._getData().contacts.map(function(contactData) {
         return self._createContactAPI(contactData);
      }).filter(function(contact) {
         return (! contactTypeFilter) || contact.getType() === contactTypeFilter;
      });
   };

   Agent.prototype.getConfiguration = function() {
      return this._getData().configuration;
   };

   Agent.prototype.getAgentStates = function() {
      return this._getData().agentStates;
   };

   Agent.prototype.getRoutingProfile = function() {
      return this._getData().routingProfile;
   };

   Agent.prototype.getName = function() {
      return this.getConfiguration().name;
   };

   Agent.prototype.getExtension = function() {
      return this.getConfiguration().extension;
   };

   Agent.prototype.getDialableCountries = function() {
      return this.getConfiguration().dialableCountries;
   };

   Agent.prototype.isSoftphoneEnabled = function() {
      return this.getConfiguration().softphoneEnabled;
   };

   Agent.prototype.setConfiguration = function(configuration, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.UPDATE_AGENT_CONFIGURATION, {
         configuration: lily.assertNotNull(configuration, 'configuration')
      }, callbacks);
   };

   Agent.prototype.setStatus = function(status, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.UPDATE_AGENT_STATUS, {
         status: lily.assertNotNull(status, 'status')
      }, callbacks);
   };

   Agent.prototype.connect = function(address, params) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.CREATE_OUTBOUND_CONTACT, {
         address:    lily.assertNotNull(address, 'address'),
         queueId:    params.queueId || this.getRoutingProfile().defaultOutboundQueue.queueId
      }, {
         success: params.success,
         failure: params.failure
      });
   };

   Agent.prototype.getAddresses = function(queueId, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.GET_ADDRESSES, {
         queueId:    queueId || null
      }, {
         success: function(data) {
            callbacks.success({
               addresses: data.addresses.map(function(addr) {
                  return new lily.Address(addr);
               })
            });
         },
         failure: callbacks.failure
      });
   };

   Agent.prototype.toSnapshot = function() {
      return new lily.AgentSnapshot(this._getData());
   };

   /*----------------------------------------------------------------
    * class AgentSnapshot
    */
   var AgentSnapshot = function(agentData) {
      lily.Agent.call(this);
      this.agentData = agentData;
   };
   AgentSnapshot.prototype = Object.create(Agent.prototype);
   AgentSnapshot.prototype.constructor = AgentSnapshot;

   AgentSnapshot.prototype._getData = function() {
      return this.agentData;
   };

   AgentSnapshot.prototype._createContactAPI = function(contactData) {
      return new lily.ContactSnapshot(contactData);
   };

   /*----------------------------------------------------------------
    * class Contact
    */
   var Contact = function(contactId) {
      this.contactId = contactId;
   };

   Contact.prototype._getData = function() {
      return lily.core.getAgentDataProvider().getContactData(this.getContactId());
   };

   Contact.prototype._createConnectionAPI = function(connectionData) {
      return new lily.Connection(this.contactId, connectionData.connectionId);
   };

   Contact.prototype.getEventName = function(eventName) {
      return lily.core.getContactEventName(eventName, this.getContactId());
   };

   Contact.prototype.onRefresh = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.REFRESH), f);
   };

   Contact.prototype.onIncoming = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.INCOMING), f);
   };

   Contact.prototype.onConnecting = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.CONNECTING), f);
   };

   Contact.prototype.onPending = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.PENDING), f);
   };

   Contact.prototype.onAccepted = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.ACCEPTED), f);
   };

   Contact.prototype.onMissed = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.MISSED), f);
   };

   Contact.prototype.onEnded = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.ENDED), f);
      bus.subscribe(this.getEventName(lily.ContactEvents.DESTROYED), f);
   };

   Contact.prototype.onACW = function(f) {
     var bus = lily.core.getEventBus();
     bus.subscribe(this.getEventName(lily.ContactEvents.ACW), f);
   };

   Contact.prototype.onConnected = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(this.getEventName(lily.ContactEvents.CONNECTED), f);
   };

   Contact.prototype.getContactId = function() {
      return this.contactId;
   };

   Contact.prototype.getOriginalContactId = function() {
      return this._getData().originalContactId;
   };

   Contact.prototype.getType = function() {
      return this._getData().type;
   };

   Contact.prototype.getStatus = function() {
      return this._getData().status;
   };

   Contact.prototype.getStatusDuration = function() {
      return lily.now() - lily.core.getLocalTimestamp() + this._getData().status.duration * 1000;
   };

   Contact.prototype.getQueue = function() {
      return this._getData().queue;
   };

   Contact.prototype.getQueueTimestamp = function() {
      return this._getData().queueTimestamp;
   };

   Contact.prototype.getConnections = function() {
      var self = this;
      return this._getData().connections.map(function(connData) {
         return new lily.Connection(self.contactId, connData.connectionId);
      });
   };

   Contact.prototype.getInitialConnection = function() {
      return lily.find(this.getConnections(), function(conn) {
         return conn.isInitialConnection();
      }) || null;
   };

   Contact.prototype.getActiveInitialConnection = function() {
      var initialConn = this.getInitialConnection();
      if (initialConn != null && initialConn.isActive()) {
         return initialConn;
      } else {
         return null;
      }
   };

   Contact.prototype.getThirdPartyConnections = function() {
      return this.getConnections().filter(function(conn) {
         return ! conn.isInitialConnection() && conn.getType() !== lily.ConnectionType.AGENT;
      });
   };

   Contact.prototype.getSingleActiveThirdPartyConnection = function() {
      return this.getThirdPartyConnections().filter(function(conn) {
         return conn.isActive();
      })[0] || null;
   };

   Contact.prototype.getAgentConnection = function() {
      return lily.find(this.getConnections(), function(conn) {
         var connType =  conn.getType();
         return connType === lily.ConnectionType.AGENT || connType === lily.ConnectionType.MONITORING;
      });
   };

   Contact.prototype.getAttributes = function() {
      return this._getData().attributes;
   };

   Contact.prototype.isSoftphoneCall = function() {
      return lily.find(this.getConnections(), function(conn) {
         return conn.getSoftphoneMediaInfo() != null;
      }) != null;
   };

   Contact.prototype.isInbound = function() {
      var conn = this.getInitialConnection();
      return conn ? conn.getType() === lily.ConnectionType.INBOUND : false;
   };

   Contact.prototype.isConnected = function() {
      return this.getStatus().type === lily.ContactStatusType.CONNECTED;
   };

   Contact.prototype.accept = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.ACCEPT_CONTACT, {
         contactId:  this.getContactId()
      }, callbacks);
   };

   Contact.prototype.destroy = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.DESTROY_CONTACT, {
         contactId:  this.getContactId()
      }, callbacks);
   };

   Contact.prototype.notifyIssue = function(issueCode, description, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.NOTIFY_CONTACT_ISSUE, {
         contactId:     this.getContactId(),
         issueCode:     issueCode,
         description:   description
      }, callbacks);
   };

   Contact.prototype.addConnection = function(address, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.CREATE_ADDITIONAL_CONNECTION, {
         contactId:     this.getContactId(),
         address:       address
      }, callbacks);
   };

   Contact.prototype.toggleActiveConnections = function(callbacks) {
      var client = lily.core.getClient();
      var connectionId = null;
      var holdingConn = lily.find(this.getConnections(), function(conn) {
         return conn.getStatus().type === lily.ConnectionStatusType.HOLD;
      });

      if (holdingConn != null) {
         connectionId = holdingConn.getConnectionId();

      } else {
         var activeConns = this.getConnections().filter(function(conn) {
            return conn.isActive();
         });
         if (activeConns.length > 0) {
            connectionId = activeConns[0].getConnectionId();
         }
      }

      client.call(lily.ClientMethods.TOGGLE_ACTIVE_CONNECTIONS, {
         contactId:     this.getContactId(),
         connectionId:  connectionId
      }, callbacks);
   };

   Contact.prototype.sendSoftphoneMetrics = function(softphoneStreamStatistics, callbacks) {
      var client = lily.core.getClient();

      client.call(lily.ClientMethods.SEND_SOFTPHONE_CALL_METRICS, {
         contactId:     this.getContactId(),
         softphoneStreamStatistics:  softphoneStreamStatistics
      }, callbacks);
   };

   Contact.prototype.sendSoftphoneReport = function(report, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.SEND_SOFTPHONE_CALL_REPORT, {
         contactId:     this.getContactId(),
         report:  report
      }, callbacks);
   };

   Contact.prototype.conferenceConnections = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.CONFERENCE_CONNECTIONS, {
         contactId:     this.getContactId()
      }, callbacks);
   };

   Contact.prototype.toSnapshot = function() {
      return new lily.ContactSnapshot(this._getData());
   };

   /*----------------------------------------------------------------
    * class ContactSnapshot
    */
   var ContactSnapshot = function(contactData) {
      lily.Contact.call(this, contactData.contactId);
      this.contactData = contactData;
   };
   ContactSnapshot.prototype = Object.create(Contact.prototype);
   ContactSnapshot.prototype.constructor = ContactSnapshot;

   ContactSnapshot.prototype._getData = function() {
      return this.contactData;
   };

   ContactSnapshot.prototype._createConnectionAPI = function(connectionData) {
      return new lily.ConnectionSnapshot(connectionData);
   };

   /*----------------------------------------------------------------
    * class Connection
    */
   var Connection = function(contactId, connectionId) {
      this.contactId = contactId;
      this.connectionId = connectionId;
   };

   Connection.prototype._getData = function() {
      return lily.core.getAgentDataProvider().getConnectionData(
            this.getContactId(), this.getConnectionId());
   };

   Connection.prototype.getContactId = function() {
      return this.contactId;
   };

   Connection.prototype.getConnectionId = function() {
      return this.connectionId;
   };

   Connection.prototype.getAddress = function() {
      return new lily.Address(this._getData().address);
   };

   Connection.prototype.getStatus = function() {
      return this._getData().status;
   };

   Connection.prototype.getStatusDuration = function() {
      return lily.now() - lily.core.getLocalTimestamp() + this._getData().status.duration * 1000;
   };

   Connection.prototype.getType = function() {
      return this._getData().type;
   };

   Connection.prototype.isInitialConnection = function() {
      return this._getData().initial;
   };

   Connection.prototype.isActive = function() {
      return lily.contains(lily.CONNECTION_ACTIVE_STATES, this.getStatus().type);
   };

   Connection.prototype.isConnected = function() {
      return this.getStatus().type === lily.ConnectionStatusType.CONNECTED;
   };

   Connection.prototype.isConnecting = function() {
      return this.getStatus().type === lily.ConnectionStatusType.CONNECTING;
   };

   Connection.prototype.isOnHold = function() {
      return this.getStatus().type === lily.ConnectionStatusType.HOLD;
   };

   Connection.prototype.getSoftphoneMediaInfo = function() {
      return this._getData().softphoneMediaInfo;
   };

   Connection.prototype.destroy = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.DESTROY_CONNECTION, {
         contactId:     this.getContactId(),
         connectionId:  this.getConnectionId()
      }, callbacks);
   };

   Connection.prototype.sendDigits = function(digits, callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.SEND_DIGITS, {
         contactId:     this.getContactId(),
         connectionId:  this.getConnectionId(),
         digits:        digits
      }, callbacks);
   };

   Connection.prototype.hold = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.HOLD_CONNECTION, {
         contactId:     this.getContactId(),
         connectionId:  this.getConnectionId()
      }, callbacks);
   };

   Connection.prototype.resume = function(callbacks) {
      var client = lily.core.getClient();
      client.call(lily.ClientMethods.RESUME_CONNECTION, {
         contactId:     this.getContactId(),
         connectionId:  this.getConnectionId()
      }, callbacks);
   };

   Connection.prototype.toSnapshot = function() {
      return new lily.ConnectionSnapshot(this._getData());
   };

   /*----------------------------------------------------------------
    * class ConnectionSnapshot
    */
   var ConnectionSnapshot = function(connectionData) {
      lily.Connection.call(this, connectionData.contactId, connectionData.connectionId);
      this.connectionData = connectionData;
   };
   ConnectionSnapshot.prototype = Object.create(Connection.prototype);
   ConnectionSnapshot.prototype.constructor = ConnectionSnapshot;

   ConnectionSnapshot.prototype._getData = function() {
      return this.connectionData;
   };

   var Address = function(paramsIn) {
      var params = paramsIn || {};
      this.addressId = params.addressId || null;
      this.type = params.type || null;
      this.name = params.name || null;
      this.phoneNumber = params.phoneNumber || null;
      this.agentLogin = params.agentLogin || null;
      this.queue = params.queue || null;
   };

   /**
    * Strip the SIP address components from the phoneNumber field.
    */
   Address.prototype.stripPhoneNumber = function() {
      return this.phoneNumber ? this.phoneNumber.replace(/sip:([^@]*)@.*/, "$1") : "";
   };

   /**
    * Create an Address object from the given phone number and name.
    */
   Address.byPhoneNumber = function(number, name) {
      return new Address({
         type:          lily.AddressType.PHONE_NUMBER,
         phoneNumber:   number,
         name:          name || null
      });
   };

   /*----------------------------------------------------------------
    * class SoftphoneError
    */
   var SoftphoneError =  function(errorType, errorMessage, endPointUrl) {
        this.errorType = errorType;
        this.errorMessage = errorMessage;
        this.endPointUrl = endPointUrl;
   };
   SoftphoneError.prototype.getErrorType =  function() {
        return this.errorType;
   };
   SoftphoneError.prototype.getErrorMessage =  function() {
        return this.errorMessage;
   };
   SoftphoneError.prototype.getEndPointUrl =  function() {
        return this.endPointUrl;
   };

   /*----------------------------------------------------------------
    * Root Subscription APIs.
    */
   lily.agent = function(f) {
      if (lily.agent.initialized) {
         f(new lily.Agent());

      } else {
         var bus = lily.core.getEventBus();
         bus.subscribe(lily.AgentEvents.INIT, f);
      }
   };
   lily.agent.initialized = false;

   lily.contact = function(f) {
      var bus = lily.core.getEventBus();
      bus.subscribe(lily.ContactEvents.INIT, f);
   };

   /**
    * Execute the given function asynchronously only if the shared worker
    * says we are the master for the given topic.  If there is no master for
    * the given topic, we become the master and execute the function.
    *
    * @param topic The master topic we are concerned about.
    * @param f_true The callback to be invoked if we are the master.
    * @param f_else [optional] A callback to be invoked if we are not the master.
    */
   lily.ifMaster = function(topic, f_true, f_else) {
      lily.assertNotNull(topic, "A topic must be provided.");
      lily.assertNotNull(f_true, "A true callback must be provided.");

      if (! lily.core.masterClient) {
         // We can't be the master because there is no master client!
         lily.getLog().warn("We can't be the master for topic '%s' because there is no master client!", topic);
         if (f_else) {
            f_else();
         }
         return;
      }

      var masterClient = lily.core.getMasterClient();
      masterClient.call(lily.MasterMethods.CHECK_MASTER, {
         topic: topic
      }, {
         success: function(data) {
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
   lily.becomeMaster = function(topic) {
      lily.assertNotNull(topic, "A topic must be provided.");
      var masterClient = lily.core.getMasterClient();
      masterClient.call(lily.MasterMethods.BECOME_MASTER, {
         topic: topic
      });
   };

   lily.Agent = Agent;
   lily.AgentSnapshot = AgentSnapshot;
   lily.Contact = Contact;
   lily.ContactSnapshot = ContactSnapshot;
   lily.Connection = Connection;
   lily.ConnectionSnapshot = ConnectionSnapshot;
   lily.Address = Address;
   lily.SoftphoneError = SoftphoneError;

})();
