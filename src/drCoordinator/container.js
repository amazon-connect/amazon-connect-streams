/*
 * Copyright 2014-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
  var global = this || globalThis;
  var connect = global.connect || {};
  global.connect = connect;
  global.globalConnect = {}
  global.lily = connect;

  globalConnect.Container = null;

  var FRAME_DIMENSIONS = "margin: 0; border: 0; padding: 0px; width: 0px; height: 0px";
  var LATEST_STREAMJS_BASE64_CODE = "INSERT_LATEST_STREAMJS_BASE64_CODE";
  var LATEST_STREAMJS_CODE = window.atob(LATEST_STREAMJS_BASE64_CODE);
  const REGION_STRING_DELIMITER = '.';


  /**
   Connect instance container
   It holds the connect api context within an iframe window.

   usage:
   var newContainer = new Container({ccpUrl: "bla", ...})
   */
  var Container = function(resource) {
    this.id = resource.region;
    resource.region = this._normalizeRegionString(resource.region);
    this.height = resource.height;
    this.style = resource.iframe_style;
    this.ccp = this._createFramedCcp(resource);
  };

  Container.prototype._createFramedCcp = function (resource) {
    var permission = permission || "microphone; autoplay; clipboard-write";
    var style = this.style || FRAME_DIMENSIONS;
    var iframe = document.createElement('iframe');
    iframe.srcdoc = this.getContent(resource);
    iframe.allow = permission;
    iframe.id = this.id;
    iframe.style = style;
    iframe.scrolling = "no";
    return iframe;
  };

  Container.prototype.getContent = function(params) {
    return [
      "<!DOCTYPE html>",
      "<meta charset='UTF-8'>",
      "<html>",
        "<head>",
          "<script type='text/javascript'>",
            LATEST_STREAMJS_CODE,
          "</script>",
          "<style>",
            "html, body, iframe { width: 100%;height: 100%;margin: 0px;padding: 0px; border: 0px;}",
          "</style>",
        "</head>",
        "<body>",
          "<div id=containerDiv style='width: 100%;height: 100%;'></div>",
          "<script type='text/javascript'>",
            "function init() {",
              "connect.core.initCCP(containerDiv," + JSON.stringify(params) + ");",
            "}",
          "</script>",
        "</body>",
      "</html>"
    ].join('');
  };

  /**
   * Helper function to retrieve the actual region from a region string that may contain a delimiter
   * e.g. "us-east-1.instance0" -> "us-east-1"
   */
  Container.prototype._normalizeRegionString = function(regionString) {
    const delimiterIndex = regionString.indexOf(REGION_STRING_DELIMITER);
    if (delimiterIndex === -1) {
      return regionString;
    } else {
      return regionString.substring(0, delimiterIndex);
    }
  }

  globalConnect.Container = Container;
})();