(function() {

   /**-----------------------------------------------------------------------*/
   var global = this;
   lily = global.lily || {};
   global.lily = lily;
   lily.worker = {};

   var GET_AGENT_TIMEOUT = 30000;
   var GET_AGENT_RECOVERY_TIMEOUT = 5000;
   var GET_AGENT_SUCCESS_TIMEOUT = 100;
   var LOG_BUFFER_CAP_SIZE = 400;

   /**-----------------------------------------------------------------------*/
   var MasterTopicCoordinator = function() {
      this.topicMasterMap = {};
   };

   MasterTopicCoordinator.prototype.getMaster = function(topic) {
      lily.assertNotNull(topic, 'topic');
      return this.topicMasterMap[topic] || null;
   };

   MasterTopicCoordinator.prototype.setMaster = function(topic, id) {
      lily.assertNotNull(topic, 'topic');
      lily.assertNotNull(id, 'id');
      this.topicMasterMap[topic] = id;
   };

   MasterTopicCoordinator.prototype.removeMaster = function(id) {
      lily.assertNotNull(id, 'id');
      var self = this;

      lily.entries(this.topicMasterMap).filter(function(entry) {
         return entry.value === id;
      }).forEach(function(entry) {
         delete self.topicMasterMap[entry.key];
      });
   };

   /**-------------------------------------------------------------------------
    * The object responsible for polling and passing data downstream to all
    * consumer ports.
    */
   var LilyClientEngine = function() {
      var self = this;

      this.client = null;
      this.multiplexer = new lily.StreamMultiplexer();
      this.conduit = new lily.Conduit("LilySharedWorker", null, this.multiplexer);
      this.timeout = null;
      this.agent = null;
      this.nextToken = null;
      this.initData = {};
      this.portConduitMap = {};
      this.masterCoord = new MasterTopicCoordinator();
      this.logsBuffer = [];

      lily.rootLogger = new lily.DownstreamConduitLogger(this.conduit);

      this.conduit.onDownstream(lily.EventType.SEND_LOGS, function(logsToUpload) {
         self.logsBuffer = self.logsBuffer.concat(logsToUpload);
         //only call API to send logs if buffer reached cap
         if (self.logsBuffer.length > LOG_BUFFER_CAP_SIZE) {
            self.handleSendLogsRequest(self.logsBuffer);
         }
      });
      this.conduit.onDownstream(lily.EventType.CONFIGURE, function(data) {
         if (data.authToken && data.authToken !== self.initData.authToken) {
            self.initData = data;
            lily.core.init(data);

            // Start polling for agent data.
            self.pollForAgent();
         }
      });
      this.conduit.onDownstream(lily.EventType.TERMINATE, function() {
         //upload pending logs before terminating.
         self.handleSendLogsRequest(self.logsBuffer);
         lily.core.terminate();
         self.conduit.sendDownstream(lily.EventType.TERMINATED);
      });
      this.conduit.onDownstream(lily.EventType.SYNCHRONIZE, function() {
         self.conduit.sendDownstream(lily.EventType.ACKNOWLEDGE);
      });

      /**
       * Called when a consumer port connects to this SharedWorker.
       * Let's add them to our multiplexer.
       */
      global.onconnect = function(event) {
         var port = event.ports[0];
         var stream = new lily.PortStream(port);
         self.multiplexer.addStream(stream);
         port.start();

         var portConduit = new lily.Conduit(stream.getId(), null, stream);
         portConduit.sendDownstream(lily.EventType.ACKNOWLEDGE, {id: stream.getId()});

         self.portConduitMap[stream.getId()] = portConduit;

         if (self.agent !== null) {
            portConduit.sendDownstream(lily.AgentEvents.UPDATE, self.agent);
         }

         portConduit.onDownstream(lily.EventType.API_REQUEST, lily.hitch(self, self.handleAPIRequest, portConduit));
         portConduit.onDownstream(lily.EventType.MASTER_REQUEST, lily.hitch(self, self.handleMasterRequest, portConduit, stream.getId()));
         portConduit.onDownstream(lily.EventType.CLOSE, function() {
            self.multiplexer.removeStream(stream);
            delete self.portConduitMap[stream.getId()];
            self.masterCoord.removeMaster(stream.getId());
         });
      };
   };

   LilyClientEngine.prototype.pollForAgent = function() {
      var self = this;
      var client = lily.core.getClient();

      client.call(lily.ClientMethods.GET_AGENT, {
         nextToken:     this.nextToken,
         timeout:       GET_AGENT_TIMEOUT
      }, {
         success: function(data) {
            self.agent = data.agent;
            self.nextToken = data.agent.nextToken;
            self.conduit.sendDownstream(lily.AgentEvents.UPDATE, data.agent);
            global.setTimeout(lily.hitch(self, self.pollForAgent), GET_AGENT_SUCCESS_TIMEOUT);
         },
         failure: function(err, data) {
            try {
               lily.getLog().error("Failed to get agent data.")
                  .withObject({
                     err: err,
                     data: data
                  });

            } finally {
               global.setTimeout(lily.hitch(self, self.pollForAgent), GET_AGENT_RECOVERY_TIMEOUT);
            }
         },
         authFailure: function() {
            self.handleAuthFail();
         }
      });
   };

   LilyClientEngine.prototype.handleAPIRequest = function(portConduit, request) {
      var self = this;
      var client = lily.core.getClient();

      client.call(request.method, request.params, {
         success: function(data) {
            var response = lily.EventFactory.createResponse(lily.EventType.API_RESPONSE, request, data);
            portConduit.sendDownstream(response.event, response);
         },
         failure: function(err, data) {
            var response = lily.EventFactory.createResponse(lily.EventType.API_RESPONSE, request, data, err);
            portConduit.sendDownstream(response.event, response);
            lily.getLog().error("'%s' API request failed: %s", request.method, err)
               .withObject({request: request, response: response});
         },
         authFailure: function() {
            self.handleAuthFail();
         }
      });
   };

   /**
    * Handle incoming master query or modification requests from connected tab ports.
    */
   LilyClientEngine.prototype.handleMasterRequest = function(portConduit, portId, request) {
      var response = null;

      switch(request.method) {
      case lily.MasterMethods.BECOME_MASTER:
         this.masterCoord.setMaster(request.params.topic, portId);
         response = lily.EventFactory.createResponse(lily.EventType.MASTER_RESPONSE, request, {
            masterId:   portId,
            isMaster:   true,
            topic:      request.params.topic
         });

         break;

      case lily.MasterMethods.CHECK_MASTER:
         var masterId = this.masterCoord.getMaster(request.params.topic);
         if (!masterId) {
            this.masterCoord.setMaster(request.params.topic, portId);
            masterId = portId;
         }

         response = lily.EventFactory.createResponse(lily.EventType.MASTER_RESPONSE, request, {
            masterId:   masterId,
            isMaster:   portId === masterId,
            topic:      request.params.topic
         });

         break;

      default:
         throw new Error("Unknown master method: " + request.method);
      }

      portConduit.sendDownstream(response.event, response);
   };

   /**
    * Send a message downstream to all consumers when we detect that authentication
    * against one of our APIs has failed.
    */
   LilyClientEngine.prototype.handleSendLogsRequest = function() {
      var self = this;
      var client = lily.core.getClient();
      var logEvents = [];
      var logsToSend = self.logsBuffer.slice();
      self.logsBuffer = [];
      logsToSend.forEach(function(log) {
         logEvents.push({
            timestamp:  log.time,
            component:  log.component,
            message: log.text
         });
      });
      client.call(lily.ClientMethods.SEND_CLIENT_LOGS, {logEvents: logEvents}, {
         success: function(data) {
            lily.getLog().info("SendLogs request succeeded.");
         },
         failure: function(err, data) {
            lily.getLog().error("SendLogs request failed. %s", err);
         },
         authFailure: function() {
            self.handleAuthFail();
         }
      });
   };

   LilyClientEngine.prototype.handleAuthFail = function() {
      var self = this;
      self.conduit.sendDownstream(lily.EventType.AUTH_FAIL);
   };

   /**-----------------------------------------------------------------------*/
   lily.worker.main = function() {
      lily.worker.clientEngine = new LilyClientEngine();
   };

})();
