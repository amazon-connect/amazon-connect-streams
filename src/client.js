/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function() {
   var global = this || window;
   var connect = global.connect || {};
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
         'createTaskContact',
         'clearContact',
         'completeContact',
         'destroyContact',
         'rejectContact',
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
         'createTransport',
         'muteParticipant',
         'unmuteParticipant'
   ]);

   /**---------------------------------------------------------------
    * enum AgentAppClientMethods
    */
   connect.AgentAppClientMethods = {
      GET_CONTACT: "AgentAppService.Lcms.getContact",
      DELETE_SPEAKER: "AgentAppService.VoiceId.deleteSpeaker",
      ENROLL_BY_SESSION: "AgentAppService.VoiceId.enrollBySession",
      EVALUATE_SESSION: "AgentAppService.VoiceId.evaluateSession",
      DESCRIBE_SPEAKER: "AgentAppService.VoiceId.describeSpeaker",
      OPT_OUT_SPEAKER: "AgentAppService.VoiceId.optOutSpeaker",
      UPDATE_VOICE_ID_DATA: "AgentAppService.Lcms.updateVoiceIdData",
      DESCRIBE_SESSION: "AgentAppService.VoiceId.describeSession",
      UPDATE_SESSION: "AgentAppService.VoiceId.updateSession",
      START_VOICE_ID_SESSION: "AgentAppService.Nasa.startVoiceIdSession",
      LIST_INTEGRATION_ASSOCIATIONS: "AgentAppService.Acs.listIntegrationAssociations"
   };

   /**---------------------------------------------------------------
    * enum MasterMethods
    */
   connect.MasterMethods = connect.makeEnum([
         'becomeMaster',
         'checkMaster'
   ]);

   /**---------------------------------------------------------------
    * enum TaskTemplatesClientMethods
    */
   connect.TaskTemplatesClientMethods = connect.makeEnum([
      'listTaskTemplates',
      'getTaskTemplate',
      'createTemplatedTask',
      'updateContact'
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
   * class AgentAppClient extends ClientBase
   */
   var AgentAppClient = function(authCookieName, authToken, endpoint) {
      connect.assertNotNull(authCookieName, 'authCookieName');
      connect.assertNotNull(authToken, 'authToken');
      connect.assertNotNull(endpoint, 'endpoint');
      ClientBase.call(this);
      this.endpointUrl = connect.getUrlWithProtocol(endpoint);
      this.authToken = authToken;
      this.authCookieName = authCookieName
   };

   AgentAppClient.prototype = Object.create(ClientBase.prototype);
   AgentAppClient.prototype.constructor = AgentAppClient;

   AgentAppClient.prototype._callImpl = function(method, params, callbacks) {
      var self = this;
      var bear = {};
      bear[self.authCookieName] = self.authToken;
      var options = {
         method: 'post',
         body: JSON.stringify(params || {}),
         headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
               'X-Amz-target': method,
               'X-Amz-Bearer': JSON.stringify(bear)
         }
      };
      connect.fetch(self.endpointUrl, options).then(function(res){
         callbacks.success(res);
      }).catch(function(err){
         const reader = err.body.getReader();
         let body = '';
         const decoder = new TextDecoder();
         reader.read().then(function processText({ done, value }) {
            if (done) {
               var error = JSON.parse(body);
               error.status = err.status;
               callbacks.failure(error);
               return;
            }
            body += decoder.decode(value);
            return reader.read().then(processText);
         });
      })
   };
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

         log.trace("AWSClient: --> Calling operation '%s'", method).sendInternalLogToServer();

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
                        error.stack = [];
                        if (err.stack){
                           try {
                               if (Array.isArray(err.stack)) {
                                   error.stack = err.stack;
                               } else if (typeof err.stack === 'object') {
                                   error.stack = [JSON.stringify(err.stack)];
                               } else if (typeof err.stack === 'string') {
                                   error.stack = err.stack.split('\n');
                               }
                           } catch {}
                        }
                        
                        callbacks.failure(error, data);
                     }

                     log.trace("AWSClient: <-- Operation '%s' failed: %s", method, JSON.stringify(err)).sendInternalLogToServer();

                  } else {
                     log.trace("AWSClient: <-- Operation '%s' succeeded.", method).withObject(data).sendInternalLogToServer();
                     callbacks.success(data);
                  }
               } catch (e) {
                  connect.getLog().error("Failed to handle AWS API request for method %s", method)
                        .withException(e).sendInternalLogToServer();
               }
            });
      }
   };

   AWSClient.prototype._requiresAuthenticationParam = function (method) {
      return method !== connect.ClientMethods.COMPLETE_CONTACT &&
         method !== connect.ClientMethods.CLEAR_CONTACT &&
         method !== connect.ClientMethods.REJECT_CONTACT &&
         method !== connect.ClientMethods.CREATE_TASK_CONTACT;
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

   /**---------------------------------------------------------------
   * class TaskTemplatesClient extends ClientBase
   */
   var TaskTemplatesClient = function(endpoint) {
      connect.assertNotNull(endpoint, 'endpoint');
      ClientBase.call(this);
      if (endpoint.includes('/task-templates')) {
         this.endpointUrl = connect.getUrlWithProtocol(endpoint);
      } else {
         var AWSEndpoint = new AWS.Endpoint(endpoint);
         var CFPrefix = endpoint.includes('.awsapps.com') ? '/connect' : '';
         this.endpointUrl = connect.getUrlWithProtocol(`${AWSEndpoint.host}${CFPrefix}/task-templates/api/ccp`);
      }
   };

   TaskTemplatesClient.prototype = Object.create(ClientBase.prototype);
   TaskTemplatesClient.prototype.constructor = TaskTemplatesClient;

   TaskTemplatesClient.prototype._callImpl = function(method, params, callbacks) {
      connect.assertNotNull(method, 'method');
      connect.assertNotNull(params, 'params');
      var options = {
         credentials: 'include',
         method: 'GET',
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-csrf-token': 'csrf'         
         }
      };
      var instanceId = params.instanceId;
      var url = this.endpointUrl;
      var methods = connect.TaskTemplatesClientMethods;
      switch (method) {
         case methods.LIST_TASK_TEMPLATES: 
            url += `/proxy/instance/${instanceId}/task/template`;
            if (params.queryParams) {
               const queryString = new URLSearchParams(params.queryParams).toString();
               if (queryString) {
                  url += `?${queryString}`;
               }
            }
            break;
         case methods.GET_TASK_TEMPLATE: 
            connect.assertNotNull(params.templateParams, 'params.templateParams');
            const id = connect.assertNotNull(params.templateParams.id, 'params.templateParams.id');
            const version = params.templateParams.version;
            url += `/proxy/instance/${instanceId}/task/template/${id}`;
            if (version) {
               url += `?snapshotVersion=${version}`;
            }
            break;
         case methods.CREATE_TEMPLATED_TASK: 
            url += `/${method}`;
            options.body = JSON.stringify(params);
            options.method = 'PUT';
            break;
         case methods.UPDATE_CONTACT: 
            url += `/${method}`;
            options.body = JSON.stringify(params);
            options.method = 'POST';
      }
      connect.fetch(url, options)
      .then(function(res){
         callbacks.success(res);
      }).catch(function(err){
         const reader = err.body.getReader();
         let body = '';
         const decoder = new TextDecoder();
         reader.read().then(function processText({ done, value }) {
            if (done) {
               var error = JSON.parse(body);
               error.status = err.status;
               callbacks.failure(error);
               return;
            }
            body += decoder.decode(value);
            return reader.read().then(processText);
         });
      })
   };

   connect.ClientBase = ClientBase;
   connect.NullClient = NullClient;
   connect.UpstreamConduitClient = UpstreamConduitClient;
   connect.UpstreamConduitMasterClient = UpstreamConduitMasterClient;
   connect.AWSClient = AWSClient;
   connect.AgentAppClient = AgentAppClient;
   connect.TaskTemplatesClient = TaskTemplatesClient;
})();
