/*
 * Copyright 2014-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
 
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.globalConnect = {}
  global.lily = connect;

  globalConnect.Container = null;

  var FRAME_DIMENSIONS = "margin: 0; border: 0; padding: 0px; width: 0px; height: 0px";

  var LATEST_STREAMJS_BASE64_CODE = "INSERT_LATEST_STREAMJS_BASE64_CODE";

  var LATEST_STREAMJS_CODE = window.atob(LATEST_STREAMJS_BASE64_CODE);


  /**
   Connect instance container
   It holds the connect api context within an iframe window.

   usage:
   var newContainer = new Container({ccpUrl: "bla", ...})
   */
  var Container = function(resource) {
      this.region = resource.region;
      this.id = this.region.replace(/-/g, '_');
      this.height = resource.height;
      this.style = resource.iframe_style; 
      this.ccp = this._createFramedCcp(JSON.stringify(resource));
  };

  Container.prototype._createFramedCcp = function (resource) {
    var permission = permission || "microphone; autoplay";
    var style = this.style || FRAME_DIMENSIONS;
    var iframe = document.createElement('iframe');
    iframe.srcdoc = this.getContent(resource);
    iframe.allow = permission;
    iframe.id = this.id;
    iframe.style = style;
    iframe.scrolling = "no";
    return iframe; 
  };

  Container.prototype.getContent = function(resource){
     return [
       "<!DOCTYPE html>",
       "<meta charset='UTF-8'>",
       "<html>",
         "<head>",
           "<script type='text/javascript'>",
             LATEST_STREAMJS_CODE,
           "</script>",
         "</head>",
         "<body onload='init()'>",
           "<div id=containerDiv style='width: 100%;height: " + this.height + "'></div>",
           "<script type='text/javascript'>",
             "function init() {",
               "connect.core.initCCP(containerDiv," + resource + ");",
            "}",
           "</script>",
         "</body>",
       "</html>"
     ].join('');
   };

  globalConnect.Container = Container;
})();