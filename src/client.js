/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   /**---------------------------------------------------------------
    * enum ClientMethods
    */
   connect.ClientMethods = connect.makeEnum([
         'getAgentSnapshot',
         'putAgentState',
         'getAgentStates',
         'getDialableCountryCodes',
         'getRoutingProfileQueues',
         'getAgentPermissions',
         'getAgentConfiguration',
         'updateAgentConfiguration',
         'acceptContact',
         'createOutboundContact',
         'clearContact',
         'completeContact',
         'notifyContactIssue',
         'updateContactAttributes',
         'createAdditionalConnection',
         'destroyConnection',
         'holdConnection',
         'resumeConnection',
         'toggleActiveConnections',
         'conferenceConnections',
         'sendClientLogs',
         'sendDigits',
         'sendSoftphoneCallReport',
         'sendSoftphoneCallMetrics',
         'getEndpoints',
         'getNewAuthToken',
         'createTransport'
   ]);

   /**---------------------------------------------------------------
    * enum MasterMethods
    */
   connect.MasterMethods = connect.makeEnum([
         'becomeMaster',
         'checkMaster'
   ]);

   /**---------------------------------------------------------------
    * abstract class ClientBase
    */
   var ClientBase = function() {};
   ClientBase.EMPTY_CALLBACKS = {
      success: function() { },
      failure: function() { }
   };

   ClientBase.prototype.call = function(method, paramsIn, callbacksIn) {
      connect.assertNotNull(method, 'method');
      var params = paramsIn || {};
      var callbacks = callbacksIn || ClientBase.EMPTY_CALLBACKS;
      this._callImpl(method, params, callbacks);
   };

   ClientBase.prototype._callImpl = function(method, params, callbacks) {
      throw new connect.NotImplementedError();
   };

   /**---------------------------------------------------------------
    * class NullClient extends ClientBase
    */
   var NullClient = function() {
      ClientBase.call(this);
   };
   NullClient.prototype = Object.create(ClientBase.prototype);
   NullClient.prototype.constructor = NullClient;

   NullClient.prototype._callImpl = function(method, params, callbacks) {
      if (callbacks && callbacks.failure) {
         var message = connect.sprintf('No such method exists on NULL client: %s', method);
         callbacks.failure(new connect.ValueError(message), {message: message});
      }
   };

   /**---------------------------------------------------------------
    * abstract class UpstreamConduitClientBase extends ClientBase
    */
   var UpstreamConduitClientBase = function(conduit, requestEvent, responseEvent) {
      ClientBase.call(this);
      this.conduit = conduit;
      this.requestEvent = requestEvent;
      this.responseEvent = responseEvent;
      this._requestIdCallbacksMap = {};

      this.conduit.onUpstream(responseEvent, connect.hitch(this, this._handleResponse));
   };

   UpstreamConduitClientBase.prototype = Object.create(ClientBase.prototype);
   UpstreamConduitClientBase.prototype.constructor = UpstreamConduitClientBase;

   UpstreamConduitClientBase.prototype._callImpl = function(method, params, callbacks) {
      var request = connect.EventFactory.createRequest(this.requestEvent, method, params);
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

      if (data.err && callbacks.failure) {
         callbacks.failure(data.err, data.data);

      } else if (callbacks.success) {
         callbacks.success(data.data);
      }
   };

   /**---------------------------------------------------------------
    * class UpstreamConduitClient extends ClientBase
    */
   var UpstreamConduitClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, connect.EventType.API_REQUEST, connect.EventType.API_RESPONSE);
   };
   UpstreamConduitClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitClient.prototype.constructor = UpstreamConduitClient;

   /**---------------------------------------------------------------
    * class UpstreamConduitMasterClient extends ClientBase
    */
   var UpstreamConduitMasterClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, connect.EventType.MASTER_REQUEST, connect.EventType.MASTER_RESPONSE);
   };
   UpstreamConduitMasterClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitMasterClient.prototype.constructor = UpstreamConduitMasterClient;

   /**---------------------------------------------------------------
    * class AWSClient extends ClientBase
    */
   var AWSClient = function(authToken, region, endpointIn) {
      connect.assertNotNull(authToken, 'authToken');
      connect.assertNotNull(region, 'region');
      ClientBase.call(this);
      AWS.config.credentials = new AWS.Credentials({});
      AWS.config.region = region;
      this.authToken = authToken;
      var baseUrl = connect.getBaseUrl();
      var endpointUrl = endpointIn || ( 
         baseUrl.includes(".awsapps.com")
            ? baseUrl + '/connect/api'
            : baseUrl + '/api'
      );
      var endpoint = new AWS.Endpoint(endpointUrl);
      this.client = new AWS.Connect({endpoint: endpoint});
   };
   AWSClient.prototype = Object.create(ClientBase.prototype);
   AWSClient.prototype.constructor = AWSClient;

   AWSClient.prototype._callImpl = function(method, params, callbacks) {
      var self = this;
      var log = connect.getLog();

      if (! connect.contains(this.client, method)) {
         var message = connect.sprintf('No such method exists on AWS client: %s', method);
         callbacks.failure(new connect.ValueError(message), {message: message});

      } else {
         params = this._translateParams(method, params);

         log.trace("AWSClient: --> Calling operation '%s'", method);

         this.client[method](params)
            .on('build', function(request) {
               request.httpRequest.headers['X-Amz-Bearer'] = self.authToken;
            })
            .send(function(err, data) {
               try {
                  if (err) {
                     if (err.code === connect.CTIExceptions.UNAUTHORIZED_EXCEPTION) {
                        callbacks.authFailure();
                     } else if (callbacks.accessDenied && (err.code === connect.CTIExceptions.ACCESS_DENIED_EXCEPTION || err.statusCode === 403)) {
                        callbacks.accessDenied();
                     } else {
                        // Can't pass err directly to postMessage
                        // postMessage() tries to clone the err object and failed.
                        // Refer to https://github.com/goatslacker/alt-devtool/issues/5
                        var error = {};
                        error.type = err.code;
                        error.message = err.message;
                        error.stack = err.stack ? err.stack.split('\n') : [];
                        callbacks.failure(error, data);
                     }

                     log.trace("AWSClient: <-- Operation '%s' failed: %s", method, JSON.stringify(err));

                  } else {
                     log.trace("AWSClient: <-- Operation '%s' succeeded.", method).withObject(data);
                     callbacks.success(data);
                  }
               } catch (e) {
                  connect.getLog().error("Failed to handle AWS API request for method %s", method)
                        .withException(e);
               }
            });
      }
   };

   AWSClient.prototype._requiresAuthenticationParam = function (method) {
      return method !== connect.ClientMethods.COMPLETE_CONTACT &&
         method !== connect.ClientMethods.CLEAR_CONTACT &&
         method !== connect.ClientMethods.REJECT_CONTACT;
   };

   AWSClient.prototype._translateParams = function(method, params) {
      switch (method) {
         case connect.ClientMethods.UPDATE_AGENT_CONFIGURATION:
            params.configuration = this._translateAgentConfiguration(params.configuration);
            break;

         case connect.ClientMethods.SEND_SOFTPHONE_CALL_METRICS:
            params.softphoneStreamStatistics = this._translateSoftphoneStreamStatistics(
                  params.softphoneStreamStatistics);
            break;

         case connect.ClientMethods.SEND_SOFTPHONE_CALL_REPORT:
            params.report = this._translateSoftphoneCallReport(params.report);
            break;

         default:
            break;
      }

      if (this._requiresAuthenticationParam(method)) {
         params.authentication = {
            authToken: this.authToken
         };
      }

      return params;
   };

   AWSClient.prototype._translateAgentConfiguration = function(config) {
      return {
         name: config.name,
         softphoneEnabled: config.softphoneEnabled,
         softphoneAutoAccept: config.softphoneAutoAccept,
         extension: config.extension,
         routingProfile: this._translateRoutingProfile(config.routingProfile),
         agentPreferences: config.agentPreferences
      };
   };

   AWSClient.prototype._translateRoutingProfile = function(profile) {
      return {
         name: profile.name,
         routingProfileARN: profile.routingProfileARN,
         defaultOutboundQueue: this._translateQueue(profile.defaultOutboundQueue)
      };
   };

   AWSClient.prototype._translateQueue = function(queue) {
      return {
         queueARN:   queue.queueARN,
         name:       queue.name
      };
   };

   AWSClient.prototype._translateSoftphoneStreamStatistics = function(stats) {
      stats.forEach(function(stat) {
         if ('packetsCount' in stat) {
            stat.packetCount = stat.packetsCount;
            delete stat.packetsCount;
         }
      });

      return stats;
   };

   AWSClient.prototype._translateSoftphoneCallReport = function(report) {
      if ('handshakingTimeMillis' in report) {
         report.handshakeTimeMillis = report.handshakingTimeMillis;
         delete report.handshakingTimeMillis;
      }

      if ('preTalkingTimeMillis' in report) {
         report.preTalkTimeMillis = report.preTalkingTimeMillis;
         delete report.preTalkingTimeMillis;
      }

      if ('handshakingFailure' in report) {
         report.handshakeFailure = report.handshakingFailure;
         delete report.handshakingFailure;
      }

      if ('talkingTimeMillis' in report) {
         report.talkTimeMillis = report.talkingTimeMillis;
         delete report.talkingTimeMillis;
      }

      report.softphoneStreamStatistics = this._translateSoftphoneStreamStatistics(
            report.softphoneStreamStatistics);

      return report;
   };

   connect.ClientBase = ClientBase;
   connect.NullClient = NullClient;
   connect.UpstreamConduitClient = UpstreamConduitClient;
   connect.UpstreamConduitMasterClient = UpstreamConduitMasterClient;
   connect.AWSClient = AWSClient;

})();
