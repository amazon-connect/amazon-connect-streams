/*
 * Copyright 2014-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Note: load utils before core.js
 */

(function () {
  var global = this || globalThis;
  var connect = global.connect || {};
  var globalConnect = global.globalConnect || {};
  global.connect = connect;
  global.globalConnect = globalConnect;
  global.lily = connect;

  connect.core = {};
  globalConnect.core = { regions: {} };

  var IFRAME_STYLE = "margin: 0; border: 0; padding:0px;width: 0px;height: 0px";
  var GLOBALIFRAME_STYLE =
    "margin: 0; border: 0; padding:0px;width: 100%;height: 100%";
  var DIV_DEFAULT_HEIGHT = {
    height: "465px",
  };
  var uiFailoverEnabled = true;

  var extractCcpRegionParams = function (globalContainerDiv, paramsIn) {
    connect.assertNotNull(paramsIn.standByRegion, "ccpBackupResource");
    connect.assertNotNull(paramsIn.standByRegion.ccpUrl, "ccpUrl");
    connect.assertNotNull(paramsIn.standByRegion.loginUrl, "loginUrl");
    connect.assertNotNull(paramsIn.standByRegion.region, "region");

    var regionAParams = paramsIn;
    var regionBParams = Object.assign({}, paramsIn, {
      ccpUrl: paramsIn.standByRegion.ccpUrl,
      loginUrl: paramsIn.standByRegion.loginUrl,
      region: paramsIn.standByRegion.region,
    });

    var divStyle = extractDivStyle(globalContainerDiv);

    if (divStyle.display == "none") {
      uiFailoverEnabled = false;
    }

    if (parseInt(divStyle.height) <= 0) {
      globalContainerDiv.style.height = DIV_DEFAULT_HEIGHT.height; // populating ccp
      divStyle.height = DIV_DEFAULT_HEIGHT.height;
    }

    return [regionAParams, regionBParams].map(function (params) {
      connect.assertNotNull(params.ccpUrl, "ccpUrl");
      connect.assertNotNull(params.loginUrl, "loginUrl");
      connect.assertNotNull(params.region, "region");
      delete params.standByRegion;
      params.loginPopup = false;
      //signal CCP as part of a disaster recovery fleet
      params.disasterRecoveryOn = true;
      params.iframe_style = IFRAME_STYLE;
      params.height = divStyle.height;
      return params;
    });
  };

  var extractDivStyle = function (globalContainerDiv) {
    var style = window.getComputedStyle(globalContainerDiv);
    return {
      height: style.getPropertyValue("height"),
      width: style.getPropertyValue("width"),
      display: style.getPropertyValue("display"),
    };
  };

  var validateRegion = function (region, availableRegions) {
    connect.assertTrue(
      typeof region == "string",
      "Region provided " + region + " is not a valid string"
    );
    var regions = availableRegions || globalConnect.core.regions;
    if (!regions.hasOwnProperty(region)) {
      var message = "Region provided " + region + " is not found!";
      throw new connect.ValueError(message);
    }
  };

  /**
   * A callback that should be used by a getPrimaryRegionCallback when it successfully gets the primary region.
   * 
   * @callback getPrimaryRegionSuccessCallback
   * @param {string} region -- A string representing an AWS region (e.g. "us-west-2") that is serving as the primary region in the disaster recovery setup.
   */

  /**
   * A callback that should be used by a getPrimaryRegionCallback when it fails to get the primary region.
   * 
   * @callback getPrimaryRegionFailureCallback
   *
   */

  /**
   * Callback for fetching the primary region in a disaster recovery setup.
   * 
   * @callback getPrimaryRegionCallback
   * @param {getPrimaryRegionSuccessCallback} success -- A success callback that getPrimaryRegionCallback should call upon successfully fetching the primary region string.
   * @param {getPrimaryRegionFailureCallback} failure -- A failure callback that getPrimaryRegionCalllback should call upon unsuccessfully fetching the primary region string.
   */


  /**
   * Particular to DR, the getPrimaryRegion paramsIn field is new, and required. It returns a promise that is resolved once the CCP and namespace are successfully initialized. 
   * It is recommended that you do not attempt to use the connect object before this promise is resolved.
   * @param {object} globalContainerDiv -- The container div for the active and secondary CCPs for use with DR.
   * @param {object} paramsIn -- Identical to connect.core.initCCP's paramsIn, save for one additional param.
   * @param {getPrimaryRegionCallback} paramsIn.getPrimaryRegion -- Required. A callback function that fetches the primary region for DR as a string (like "us-west-2") and feeds it into the success callback.
   */
  globalConnect.core.initCCP = function (globalContainerDiv, paramsIn) {
    connect.assertNotNull(paramsIn.getPrimaryRegion, "getPrimaryRegion");
    connect.assertTrue(
      connect.isFunction(paramsIn.getPrimaryRegion),
      "getPrimaryRegion must be a function"
    );
    var getPrimaryRegionFunc = paramsIn.getPrimaryRegion;
    delete paramsIn.getPrimaryRegion;

    var dualCcpResources = extractCcpRegionParams(globalContainerDiv, paramsIn);
    getPrimaryRegionFunc(
      function (primaryRegion) {
        return new Promise(resolve => {
          var regions = dualCcpResources.reduce(function (obj, resource) {
            obj[resource.region] = null;
            return obj;
          }, {});
          validateRegion(primaryRegion, regions);

          var containers = dualCcpResources.map(function (resource) {
            if (resource.region === primaryRegion) {
              resource.isPrimary = true;
            }
            return new globalConnect.Container(resource);
          });

          //Create global Iframe and attach ccp containers
          var ccpIframes = containers.map(function (container) {
            return container.ccp.outerHTML;
          });
          var globalIframe = document.createElement("iframe");
          globalIframe.style = GLOBALIFRAME_STYLE;
          globalIframe.id = "globalCCP";
          globalIframe.scrolling = "no";

          // surface single instance connect api in main window
          globalIframe.onload = function () {
            if (uiFailoverEnabled) {
              var secondaryRegion = Object.keys(regions).find(function (
                region
              ) {
                return region != primaryRegion;
              });

              activateUI(primaryRegion, globalIframe.id);
              deactivateUI(secondaryRegion, globalIframe.id);
            }
            containers.map(function (container) {
              globalConnect.core.regions[container.region] =
                globalIframe.contentDocument.getElementById(
                  container.id
                ).contentWindow.connect;
              //listen to failover state change from other window
              var regionalConnect =
                globalConnect.core.regions[container.region];
              regionalConnect.core
                .getUpstream()
                .onUpstream(
                  regionalConnect.DisasterRecoveryEvents.FAILOVER,
                  function (data) {
                    if (data.isPrimary) {
                      connect = regionalConnect;
                      primaryRegion = connect.core.region;
                      if (uiFailoverEnabled) {
                        activateUI(primaryRegion, globalIframe.id);
                      }
                    } else if (uiFailoverEnabled) {
                      secondaryRegion = regionalConnect.core.region;
                      deactivateUI(secondaryRegion, globalIframe.id);
                    }
                  }
                );
            });
            connect = globalConnect.core.regions[primaryRegion];
            resolve();
          };
          globalIframe.srcdoc = ccpIframes.join("");
          globalContainerDiv.appendChild(globalIframe);
        });
      },
      function (callback) {
        console.error(
          "[Disaster Recovery] An error occured, while attempting to retrieve your primary region;"
        );
        callback();
      }
    );
  };

  var deactivateUI = function (regionID, globalIframeID) {
    regionID = regionID.replace(/-/g, "_");
    var renderedGlobalIframe = document.getElementById(globalIframeID);
    renderedGlobalIframe.contentDocument.getElementById(regionID).style =
      "height: 0; width: 0; border: 0px";
  };

  var activateUI = function (regionID, globalIframeID) {
    regionID = regionID.replace(/-/g, "_");
    var renderedGlobalIframe = document.getElementById(globalIframeID);
    renderedGlobalIframe.contentDocument.getElementById(regionID).style =
      "height:800px;width:100%;border:0px";
  };

  var getFailoverRegion = function (primaryRegion) {
    var primaryRegion = primaryRegion || connect.core.region;
    return Object.keys(globalConnect.core.regions).find(function (r) {
      return r !== primaryRegion;
    });
  };

  globalConnect.core.failover = function () {
    globalConnect.core.failoverTo(getFailoverRegion());
  };

  globalConnect.core.failoverTo = function (electedNewPrimaryRegion) {
      validateRegion(electedNewPrimaryRegion);
      var currentPrimaryRegion = getFailoverRegion(electedNewPrimaryRegion);
      deactivate(currentPrimaryRegion);
      activate(electedNewPrimaryRegion);
      connect = globalConnect.core.regions[electedNewPrimaryRegion];
  };

  /**-------------------------------------------------------------------------
   * Deactivates a region
   */
  var deactivate = function (region) {
    var connect = globalConnect.core.regions[region];
    connect
      .getLog()
      .info("[Disaster Recovery] Deactivating %s region.", connect.core.region)
      .sendInternalLogToServer();
    // call this to suppress contacts
    connect.core.suppressContacts(true);
    connect.core.forceOffline();
  };

  /**-------------------------------------------------------------------------
   * Activates Stand-by region on failover using suppress==false event
   */
  var activate = function (region) {
    var connect = globalConnect.core.regions[region];
    connect
      .getLog()
      .info("[Disaster Recovery] Activating %s region.", connect.core.region)
      .sendInternalLogToServer();
    connect.core.suppressContacts(false);
  };

  //reference to globalConnect initCCP. This is to mimic the single initialization CCP behavior
  connect.core.initCCP = globalConnect.core.initCCP;
})();
