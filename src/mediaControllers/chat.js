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

(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  

  connect.ChatMediaController = function (mediaInfo, metadata) {

    var logger = connect.getLog();
    var logComponent = connect.LogComponent.CHAT;

    var createMediaInstance = function () {
      publishTelemetryEvent("Chat media controller init", mediaInfo.contactId);
      logger.info(logComponent, "Chat media controller init").withObject(mediaInfo);

      connect.ChatSession.setGlobalConfig({
        loggerConfig: {
          logger: logger
        },
        region: metadata.region
      });

      var getConnectionDetails = function(transport) {
        var self = this;
        var client = connect.core.getClient();
        var onAuthFail = connect.hitch(self, handleAuthFail);
        var onAccessDenied = connect.hitch(self, handleAccessDenied);

        return new Promise(function (resolve, reject) {
          client.call(connect.ClientMethods.CREATE_TRANSPORT, transport, {
            success: function (data) {
              connect.getLog().info("getConnectionDetails succeeded");
              resolve(data);
            },
            failure: function (err, data) {
              connect.getLog().error("getConnectionDetails failed")
                  .withObject({
                    err: err,
                    data: data
                  });
              reject(Error("getConnectionDetails failed"));
            },
            authFailure: function () {
              connect.getLog().error("getConnectionDetails Auth Failure");
              reject(Error("Authentication failed while getting getConnectionDetails"));
              onAuthFail();
            },
            accessDenied: function () {
              connect.getLog().error("getConnectionDetails Access Denied");
              reject(Error("Access Denied while getting getConnectionDetails"));
              onAccessDenied();
            }
          });
        });
      };
      /** Could be also CUSTOMER -  For now we are creating only Agent connection media object */
      var controller = connect.ChatSession.create({
        chatDetails: mediaInfo,
        type: "AGENT",
        websocketManager: connect.core.getWebSocketManager(),
        createTransport: connect.hitch(connect.core, connect.core.getConnectionDetails)
      });
      
      trackChatConnectionStatus(controller);
      return controller
        .connect()
        .then(function (data) {
          logger.info(logComponent, "Chat Session Successfully established for contactId %s", mediaInfo.contactId);
          publishTelemetryEvent("Chat Session Successfully established", mediaInfo.contactId);
          return controller;
        })
        .catch(function (error) {
          logger.error(logComponent, "Chat Session establishement failed for contact %s", mediaInfo.contactId).withException(error);
          publishTelemetryEvent("Chat Session establishement failed", mediaInfo.contactId, error);
          throw error;
        });
    };

    var publishTelemetryEvent = function (eventName, data) {
      connect.publishMetric({
        name: eventName,
        contactId: mediaInfo.contactId,
        data: data || mediaInfo
      });
    };

    var trackChatConnectionStatus = function (controller) {
      controller.onConnectionBroken(function (data) {
        logger.error(logComponent, "Chat Session connection broken").withException(data);
        publishTelemetryEvent("Chat Session connection broken", data);
      });

      controller.onConnectionEstablished(function (data) {
        logger.info(logComponent, "Chat Session connection established").withObject(data);
        publishTelemetryEvent("Chat Session connection established", data);
      });
    }

    var handleAuthFail = function() {

    };

    var handleAccessDenied = function() {

    };

    return {
      get: function () {
        return createMediaInstance();
      }
    }
  }
})();
