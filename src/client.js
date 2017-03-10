(function() {

   var global = this;
   lily = global.lily || {};
   global.lily = lily;

   /**---------------------------------------------------------------
    * enum ClientMethods
    */
   lily.ClientMethods = lily.makeEnum([
         'getAgent',
         'updateAgentConfiguration',
         'updateAgentStatus',
         'acceptContact',
         'createOutboundContact',
         'destroyContact',
         'notifyContactIssue',
         'addContactAttributes',
         'createAdditionalConnection',
         'destroyConnection',
         'sendDigits',
         'holdConnection',
         'resumeConnection',
         'toggleActiveConnections',
         'conferenceConnections',
         'getAddresses',
         'sendClientLogs',
         'sendSoftphoneCallMetrics',
         'sendSoftphoneCallReport'
   ]);

   /**---------------------------------------------------------------
    * enum MasterMethods
    */
   lily.MasterMethods = lily.makeEnum([
         'becomeMaster',
         'checkMaster'
   ]);

   /**---------------------------------------------------------------
    * abstract class LilyClientBase
    */
   var LilyClientBase = function() {};
   LilyClientBase.EMPTY_CALLBACKS = {
      success: function() { },
      failure: function() { }
   };

   LilyClientBase.prototype.call = function(method, paramsIn, callbacksIn) {
      lily.assertNotNull(method, 'method');
      var params = paramsIn || {};
      var callbacks = callbacksIn || LilyClientBase.EMPTY_CALLBACKS;
      this._callImpl(method, params, callbacks);
   };

   LilyClientBase.prototype._callImpl = function(method, params, callbacks) {
      throw new lily.NotImplementedError();
   };

   /**---------------------------------------------------------------
    * class NullClient extends LilyClientBase
    */
   var NullClient = function() {
      LilyClientBase.call(this);
   };
   NullClient.prototype = Object.create(LilyClientBase.prototype);
   NullClient.prototype.constructor = NullClient;

   NullClient.prototype._callImpl = function(method, params, callbacks) {
      if (callbacks && callbacks.failure) {
         var message = lily.sprintf('No such method exists on NULL client: %s', method);
         callbacks.failure(new lily.ValueError(message), {message: message});
      }
   };

   /**---------------------------------------------------------------
    * abstract class UpstreamConduitClientBase extends LilyClientBase
    */
   var UpstreamConduitClientBase = function(conduit, requestEvent, responseEvent) {
      LilyClientBase.call(this);
      this.conduit = conduit;
      this.requestEvent = requestEvent;
      this.responseEvent = responseEvent;
      this._requestIdCallbacksMap = {};

      this.conduit.onUpstream(responseEvent, lily.hitch(this, this._handleResponse));
   };

   UpstreamConduitClientBase.prototype = Object.create(LilyClientBase.prototype);
   UpstreamConduitClientBase.prototype.constructor = UpstreamConduitClientBase;

   UpstreamConduitClientBase.prototype._callImpl = function(method, params, callbacks) {
      var request = lily.EventFactory.createRequest(this.requestEvent, method, params);
      this._requestIdCallbacksMap[request.requestId] = callbacks;
      this.conduit.sendUpstream(request.event, request);
   };

   UpstreamConduitClientBase.prototype._getCallbacksForRequest = function(requestId) {
      var callbacks = this._requestIdCallbacksMap[requestId] || null;

      if (callbacks != null) {
         delete this._requestIdCallbacksMap[requestId];
      }

      return callbacks;
   };

   UpstreamConduitClientBase.prototype._handleResponse = function(data) {
      var callbacks = this._getCallbacksForRequest(data.requestId);
      if (callbacks == null) {
         return;
      }

      if (data.err) {
         callbacks.failure(data.err, data.data);

      } else {
         callbacks.success(data.data);
      }
   };

   /**---------------------------------------------------------------
    * class UpstreamConduitLilyClient extends LilyClientBase
    */
   var UpstreamConduitLilyClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, lily.EventType.API_REQUEST, lily.EventType.API_RESPONSE);
   };
   UpstreamConduitLilyClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitLilyClient.prototype.constructor = UpstreamConduitLilyClient;

   /**---------------------------------------------------------------
    * class UpstreamConduitMasterClient extends LilyClientBase
    */
   var UpstreamConduitMasterClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, lily.EventType.MASTER_REQUEST, lily.EventType.MASTER_RESPONSE);
   };
   UpstreamConduitMasterClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitMasterClient.prototype.constructor = UpstreamConduitMasterClient;

   /**---------------------------------------------------------------
    * class AWSLilyClient extends LilyClientBase
    */
   var AWSLilyClient = function(authToken, region, endpointIn) {
      lily.assertNotNull(authToken, 'authToken');
      lily.assertNotNull(region, 'region');
      LilyClientBase.call(this);
      AWS.config.credentials = new lily.AuthTokenCredentials(authToken);
      AWS.config.region = region;
      var endpointUrl = endpointIn || lily.getBaseUrl() + '/lily/api';
      var endpoint = new AWS.Endpoint(endpointUrl);
      this.client = new AWS.Lily({endpoint: endpoint});
   };
   AWSLilyClient.prototype = Object.create(LilyClientBase.prototype);
   AWSLilyClient.prototype.constructor = AWSLilyClient;

   AWSLilyClient.prototype._callImpl = function(method, params, callbacks) {
      if (! lily.contains(this.client, method)) {
         var message = lily.sprintf('No such method exists on AWS client: %s', method);
         callbacks.failure(new lily.ValueError(message), {message: message});

      } else {
         this.client[method](params, function(err, data) {
            // LARS returns this header when the session expire.
            if (this.httpResponse.headers['x-amz-unauthorized'] === 'true') {
                callbacks.authFailure();
            }
            try {
               if (err) {
                  callbacks.failure(err, data);
               } else {
                  callbacks.success(data);
               }
            } catch (e) {
               lily.getLog().error("Failed to handle AWS API request for method %s", method)
                  .withException(e);
            }
         });
      }
   };

   lily.NullClient = NullClient;
   lily.UpstreamConduitLilyClient = UpstreamConduitLilyClient;
   lily.UpstreamConduitMasterClient = UpstreamConduitMasterClient;
   lily.AWSLilyClient = AWSLilyClient;

})();
