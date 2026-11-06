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
  var global = this || globalThis;
  var connect = global.connect || {};
  global.connect = connect;

  connect.ChatMediaController = function (mediaInfo, metadata) {
    var logger = connect.getLog();
    var logComponent = connect.LogComponent.CHAT;
    const CHAT_SESSION_FAILURE = 'ChatSessionFailure';
    const CHAT_SESSION_FAILURE_REASON = 'ChatSessionFailureReason';

    // resolves to true only when the instance network type is DUAL_STACK; any other
    // value, or a failed lookup, falls back to IPv4
    var resolveUseDualStack = function () {
      return Promise.resolve()
        .then(function () {
          return connect.User.getNetworkType();
        })
        .then(function (response) {
          if (response && response.trim()) {
            return response.trim() === 'DUAL_STACK';
          }
          logger
            .debug(logComponent, 'Network type not found in response, defaulting to IPV4')
            .sendInternalLogToServer();
          return false;
        })
        .catch(function (error) {
          logger
            .warn(logComponent, 'Failed to retrieve network type, defaulting to IPV4')
            .withException(error)
            .sendInternalLogToServer();
          return false;
        });
    };

    var createMediaInstance = function () {
      publishTelemetryEvent('Chat media controller init', mediaInfo.contactId);
      logger
        .info(logComponent, 'Chat media controller init')
        .withObject(mediaInfo)
        .withObject(metadata)
        .sendInternalLogToServer();

      // resolves to null when the region cannot be determined, in which case the chat
      // session falls back to the agent's region from the global config
      return Promise.all([connect._getContactRegion(mediaInfo.contactId), resolveUseDualStack()])
        .then(function ([contactRegion, useDualStack]) {
          const agent = new connect.Agent();
          const agentRegion = agent._getInstanceRegion();
          const networkTypeDimensions = { NetworkType: useDualStack ? 'DUAL_STACK' : 'IPV4' };

          connect.ChatSession.setGlobalConfig({
            loggerConfig: {
              logger: logger,
            },
            region: agentRegion,
            features: metadata.features,
            useDualStack: useDualStack,
          });

          const chatSessionParams = {
            chatDetails: mediaInfo,
            type: 'AGENT',
            websocketManager: connect.core.getWebSocketManager(),
          };

          if (!contactRegion) {
            const errMessage = 'Contact region is missing for chat contact';
            logger.error(logComponent, errMessage, mediaInfo.contactId).sendInternalLogToServer();
            publishTelemetryEvent(errMessage, mediaInfo.contactId);
            connect.publishMetric({
              name: CHAT_SESSION_FAILURE_REASON,
              data: {
                count: 1,
              },
              dimension: {
                ErrorType: 'missing_active_region',
              },
            });
          } else {
            // create the chatSession with the contact's region
            chatSessionParams.options = chatSessionParams.options || {};
            chatSessionParams.options.region = contactRegion;
            logger.debug(`Creating chat session with contact region ${contactRegion}`).sendInternalLogToServer();

            // safeguard in case region override is set. the override will prevent the chat session from
            // communicating with the contact region
            connect.ChatSession.setRegionOverride(null);
          }

          var controller = connect.ChatSession.create(chatSessionParams);
          trackChatConnectionStatus(controller);

          return controller
            .connect()
            .then(function () {
              connect.publishMetric({
                name: CHAT_SESSION_FAILURE,
                data: {
                  error: 0,
                  optionalDimensions: networkTypeDimensions,
                },
              });
              logger
                .info(logComponent, 'Chat Session Successfully established for contactId %s', mediaInfo.contactId)
                .sendInternalLogToServer();
              publishTelemetryEvent('Chat Session Successfully established', mediaInfo.contactId);
              return controller;
            })
            .catch(function (error) {
              logger
                .error(logComponent, 'Chat Session establishment failed for contact %s', mediaInfo.contactId)
                .withException(error)
                .sendInternalLogToServer();
              publishTelemetryEvent('Chat Session establishment failed', mediaInfo.contactId, error);
              connect.publishMetric({
                name: CHAT_SESSION_FAILURE,
                data: {
                  error: 1,
                  optionalDimensions: networkTypeDimensions,
                },
              });
              connect.publishMetric({
                name: CHAT_SESSION_FAILURE_REASON,
                data: {
                  count: 1,
                  optionalDimensions: networkTypeDimensions,
                },
                dimension: {
                  ErrorType: 'failed_to_establish_session',
                },
              });
              throw error;
            });
        });
    };

    var publishTelemetryEvent = function (eventName, data) {
      connect.publishMetric({
        name: eventName,
        contactId: mediaInfo.contactId,
        data: data || mediaInfo,
      });
    };

    var trackChatConnectionStatus = function (controller) {
      controller.onConnectionBroken(function (data) {
        logger.error(logComponent, 'Chat Session connection broken').withException(data).sendInternalLogToServer();
        publishTelemetryEvent('Chat Session connection broken', data);
        connect.publishMetric({
          name: CHAT_SESSION_FAILURE_REASON,
          data: {
            count: 1,
          },
          dimension: {
            ErrorType: 'connection_broken',
          },
        });
        connect.publishMetric({
          name: CHAT_SESSION_FAILURE,
          data: {
            error: 0,
          },
        });
      });

      controller.onConnectionEstablished(function (data) {
        logger.info(logComponent, 'Chat Session connection established').withObject(data).sendInternalLogToServer();
        publishTelemetryEvent('Chat Session connection established', data);
      });
    };

    return {
      get: function () {
        return createMediaInstance();
      },
    };
  };
})();
