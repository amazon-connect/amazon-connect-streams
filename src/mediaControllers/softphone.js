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

  // TODO move softphone implementations here - Wil do this for GA
  connect.SoftphoneMediaController = function (mediaInfo) {
    return {
      get: function () {
        return Promise.resolve(mediaInfo);
      },
    };
  };
})();
