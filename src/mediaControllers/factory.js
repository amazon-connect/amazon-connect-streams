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

  connect.MediaFactory = function (params) {
    /** controller holder */
    var mediaControllers = {};

    var logger = connect.getLog();
    var logComponent = connect.LogComponent.CHAT;

    var metadata = params || {};
    metadata.region =  metadata.region || "us-west-2"; // Default it to us-west-2

    var getMediaController = function (connectionObj) {
      var connectionId = connectionObj.getConnectionId();
      var mediaInfo = connectionObj.getMediaInfo();
      /** if we do not have the media info then just reject the request */
      if (!mediaInfo) {
        logger.error(logComponent, "Media info does not exists for a media type %s").withObject(connectionObj);
        return Promise.reject("Media info does not exists for this connection");
      }

      if (!mediaControllers[connectionId]) {
        logger.info(logComponent, "media controller of type %s init", connectionObj.getMediaType()).withObject(connectionObj);
        switch (connectionObj.getMediaType()) {
          case connect.MediaType.CHAT:
            return mediaControllers[connectionId] = new connect.ChatMediaController(connectionObj.getMediaInfo(), metadata).get();
          case connect.MediaType.SOFTPHONE:
            return mediaControllers[connectionId] = new connect.SoftphoneMediaController(connectionObj.getMediaInfo()).get();
          default:
            logger.error(logComponent, "Unrecognized media type %s ", connectionObj.getMediaType());
            return Promise.reject();
        }
      } else {
        return mediaControllers[connectionId];
      }
    };

    /** Check all the active states for the connection */
    var ifConnectionActive = function (connectionObj) {
      return connectionObj.isActive();
    };

    var get = function (connectionObj) {
      if (ifConnectionActive(connectionObj)) {
        return getMediaController(connectionObj);
      } else {
        destroy(connectionObj.getConnectionId());
        return Promise.reject("Media Controller is no longer available for this connection");
      }
    };

    var destroy = function (connectionId) {
      if (mediaControllers[connectionId]) {
        logger.info(logComponent, "Destroying mediaController for %s", connectionId);
        delete mediaControllers[connectionId];
      }
    };

    return {
      get: get,
      destroy: destroy
    };
  }
})();
