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

  connect.TaskMediaController = function (mediaInfo) {
    var logger = connect.getLog();
    var logComponent = connect.LogComponent.TASK;

    var createMediaInstance = function () {
      publishTelemetryEvent("Task media controller init", mediaInfo.contactId);
      logger
        .info(logComponent, "Task media controller init")
        .withObject(mediaInfo);

      var controller = connect.TaskSession.create({
        contactId: mediaInfo.contactId,
        initialContactId: mediaInfo.initialContactId,
        websocketManager: connect.core.getWebSocketManager(),
      });

      trackTaskConnectionStatus(controller);

      return controller
        .connect()
        .then(function () {
          logger.info(
            logComponent,
            "Task Session Successfully established for contactId %s",
            mediaInfo.contactId
          );
          publishTelemetryEvent(
            "Task Session Successfully established",
            mediaInfo.contactId
          );
          return controller;
        })
        .catch(function (error) {
          logger
            .error(
              logComponent,
              "Task Session establishement failed for contact %s",
              mediaInfo.contactId
            )
            .withException(error);
          publishTelemetryEvent(
            "Chat Session establishement failed",
            mediaInfo.contactId,
            error
          );
          throw error;
        });
    };

    var publishTelemetryEvent = function (eventName, data) {
      connect.publishMetric({
        name: eventName,
        contactId: mediaInfo.contactId,
        data: data || mediaInfo,
      });
    };

    var trackTaskConnectionStatus = function (controller) {
      controller.onConnectionBroken(function (data) {
        logger
          .error(logComponent, "Task Session connection broken")
          .withException(data);
        publishTelemetryEvent("Task Session connection broken", data);
      });

      controller.onConnectionEstablished(function (data) {
        logger
          .info(logComponent, "Task Session connection established")
          .withObject(data);
        publishTelemetryEvent("Task Session connection established", data);
      });
    };

    return {
      get: function () {
        return createMediaInstance();
      },
    };
  };
})();
