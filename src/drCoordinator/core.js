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

  globalConnect.core = {};

  var IFRAME_STYLE = "margin: 0; border: 0; padding:0px;width: 0px;height: 0px";
  var GLOBALIFRAME_STYLE =
    "margin: 0; border: 0; padding:0px;width: 100%;height: 100%";
  var GLOBALIFRAME_ID = "globalCCP";
  var DIV_DEFAULT_HEIGHT = {
    height: "465px",
  };

  globalConnect.extractCcpRegionParams = function (globalContainerDiv, paramsIn) {
    connect.assertNotNull(paramsIn.standByRegion, "ccpBackupResource");
    connect.assertNotNull(paramsIn.standByRegion.ccpUrl, "ccpUrl");
    connect.assertNotNull(paramsIn.standByRegion.region, "region");
    if (paramsIn.pollForFailover) {
      connect.assertNotNull(paramsIn.loginUrl, "loginUrl");
      connect.assertNotNull(paramsIn.instanceArn, "primary ARN");
      paramsIn.otherArn = connect.assertNotNull(paramsIn.standByRegion.instanceArn, "backup ARN");
    }

    var regionAParams = paramsIn;
    var regionBParams = Object.assign({}, paramsIn, {
      ccpUrl: paramsIn.standByRegion.ccpUrl,
      region: paramsIn.standByRegion.region,
      instanceArn: paramsIn.standByRegion.instanceArn,
      otherArn: paramsIn.instanceArn,
      loginPopup: false
    });

    var divStyle = extractDivStyle(globalContainerDiv);

    if (parseInt(divStyle.height) <= 0) {
      globalContainerDiv.style.height = DIV_DEFAULT_HEIGHT.height; // populating ccp
      divStyle.height = DIV_DEFAULT_HEIGHT.height;
    }

    return [regionAParams, regionBParams].map(function (params) {
      connect.assertNotNull(params.ccpUrl, "ccpUrl");
      connect.assertNotNull(params.region, "region");
      delete params.standByRegion;
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
   * Particular to DR, the getPrimaryRegion paramsIn field is new, and required. It returns a promise that is resolved once the CCP and namespace are successfully initialized.
   * It is recommended that you do not attempt to use the connect object before this promise is resolved.
   * @param {object} globalContainerDiv -- The container div for the active and secondary CCPs for use with DR.
   * @param {object} paramsIn -- Identical to connect.core.initCCP's paramsIn, save for one additional param.
   * @param {getPrimaryRegionCallback} paramsIn.getPrimaryRegion -- Required. A callback function that returns a promise that is resolved once the CCP and namespace are successfully initialized.
   */
  globalConnect.core.initCCP = function (globalContainerDiv, paramsIn) {
    connect.assertNotNull(paramsIn.getPrimaryRegion, "getPrimaryRegion");
    connect.assertTrue(
      connect.isFunction(paramsIn.getPrimaryRegion),
      "getPrimaryRegion must be a function"
    );
    var getPrimaryRegionFunc = paramsIn.getPrimaryRegion;
    delete paramsIn.getPrimaryRegion;
    delete paramsIn.provider;

    var dualCcpResources = globalConnect.extractCcpRegionParams(globalContainerDiv, paramsIn);
    getPrimaryRegionFunc(
      function (primaryRegion) {
        return new Promise(resolve => {
          var initialRegion;
          if (paramsIn.pollForFailover) { // allow getPrimaryRegion function to pass a missing/untruthy region, if polling is enabled
            initialRegion = primaryRegion || paramsIn.region;
          } else {
            initialRegion = connect.assertNotNull(primaryRegion);
          }
          globalConnect.core.regions = dualCcpResources.reduce(function (obj, resource) {
            obj[resource.region] = { ccpParams: resource };
            return obj;
          }, {});
          var arnToRegionMap = dualCcpResources.reduce(function (obj, resource) {
            obj[resource.instanceArn] = resource.region;
            return obj;
          }, {});
          validateRegion(initialRegion, globalConnect.core.regions);
          globalConnect.core.primaryRegion = initialRegion;
          globalConnect.core.secondaryRegion = Object.keys(globalConnect.core.regions).find(function (
            region
          ) {
            return region != globalConnect.core.primaryRegion;
          });

          var containers = dualCcpResources.map(function (resource) {
            if (resource.region === globalConnect.core.primaryRegion) {
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
          globalIframe.allow = "microphone; camera; autoplay; clipboard-write; identity-credentials-get";
          globalIframe.id = GLOBALIFRAME_ID;
          globalIframe.scrolling = "no";

          // surface single instance connect api in main window
          globalIframe.onload = function () {
            activateUI(globalConnect.core.primaryRegion);
            deactivateUI(globalConnect.core.secondaryRegion);
            containers.map(function (container) {
              var regionalFrame = globalIframe.contentDocument.getElementById(container.id);
              var contentDocument = regionalFrame.contentDocument;
              var contentWindow = regionalFrame.contentWindow;
              // inject additionalScripts if specified
              if (paramsIn.additionalScripts && Array.isArray(paramsIn.additionalScripts)) {
                paramsIn.additionalScripts.forEach(script => {
                  var scriptElt = contentDocument.createElement('script');
                  scriptElt.src = script;
                  contentDocument.body.appendChild(scriptElt);
                });
              }
              // trigger initCCP
              contentWindow.init();
              var regionalConnect = contentWindow.connect;
              globalConnect.core.regions[container.id].connect = regionalConnect;
              //listen to failover state change from other window
              regionalConnect.core.getUpstream().onUpstream(regionalConnect.DisasterRecoveryEvents.FAILOVER, function (data) {
                if (data.nextActiveArn && globalConnect.core.secondaryRegion === arnToRegionMap[data.nextActiveArn]) {
                  switchDisplayedRegion(arnToRegionMap[data.nextActiveArn], globalConnect.core.primaryRegion);
                } else if (data.isPrimary === false && container.id === globalConnect.core.primaryRegion) {
                  switchDisplayedRegion(globalConnect.core.secondaryRegion, container.id);
                } else {
                  return; // failover request ignored
                }
                delete globalConnect._failoverPending;
                globalConnect._triggerFailoverCompleteHandlers({
                  activeRegion: globalConnect.core.primaryRegion,
                  activeCcpUrl: globalConnect.core.regions[globalConnect.core.primaryRegion].ccpParams.ccpUrl
                });
              });
              regionalConnect.core.getUpstream().onUpstream(regionalConnect.DisasterRecoveryEvents.FAILOVER_PENDING, function ({nextActiveArn}) {
                if (!globalConnect._failoverPending) {
                  globalConnect._triggerFailoverPendingHandlers({nextActiveArn});
                  globalConnect._failoverPending = true;
                }
              });
              if (container.id === globalConnect.core.primaryRegion) {
                window.connect = regionalConnect;
              }
              globalConnect._triggerInitHandlers(regionalConnect, container.id);
            });
            resolve(globalConnect.core.regions[globalConnect.core.primaryRegion].connect);
          };
          globalIframe.srcdoc = [
            "<!DOCTYPE html>",
            "<meta charset='UTF-8'>",
            "<html>",
              "<head>",
                "<style>",
                  "html, body { width: 100%;height: 100%;margin: 0px;padding: 0px; border: 0px;}",
                "</style>",
              "</head>",
              "<body>",
              ccpIframes.join(""),
              "</body>",
            "</html>",
          ].join('');
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

  var switchDisplayedRegion = function(newPrimaryRegionId, newSecondaryRegionId) {
    globalConnect.core.primaryRegion = newPrimaryRegionId;
    globalConnect.core.secondaryRegion = newSecondaryRegionId;
    window.connect = globalConnect.core.regions[newPrimaryRegionId].connect;
    globalConnect.core.activate(newPrimaryRegionId);
    activateUI(newPrimaryRegionId);
    deactivateUI(newSecondaryRegionId);
  }

  var deactivateUI = function (regionID) {
    var renderedGlobalIframe = document.getElementById(GLOBALIFRAME_ID);
    renderedGlobalIframe.contentDocument.getElementById(regionID).style =
      "height: 0; width: 0; border: 0px";
  };

  var activateUI = function (regionID) {
    var renderedGlobalIframe = document.getElementById(GLOBALIFRAME_ID);
    renderedGlobalIframe.contentDocument.getElementById(regionID).style =
      "height:100%;width:100%;border:0px";
  };

  /**
   * Register a function to be triggered after globalConnect.core.initCCP() is invoked, and once the
   * Global Resiliency setup has been successfully initialized on the page and agents are able to begin
   * taking contacts. If you wish, you can set up hooks using this function before calling globalConnect.core.initCCP().
   *
   * @param f A function that will be triggered when the Global Resiliency setup has been
   * successfully initialized on the page and agents are able to begin taking contacts.
   *     The function will be called twice (once for each Connect instance in the setup), with two parameters:
   *     1. The Streams API object (the connect object) for one of the Connect instances in the Global Resiliency setup
   *     2. A string parameter with the AWS region associated with the Connect instance whose Streams API object
   *        was provided in the first parameter.
   *
   * @returns A function that can be called if you wish to deregister the trigger.
   */
  globalConnect.core.onInit = function(f) {
    globalConnect.core._onInitHandlers = globalConnect.core._onInitHandlers || {};
    const subId = connect.randomId();
    globalConnect.core._onInitHandlers[subId] = f;
    return () => delete globalConnect.core._onInitHandlers[subId];
  }

  globalConnect._triggerInitHandlers = function(connect, region) {
    const handlers = globalConnect.core._onInitHandlers;
    if (handlers) {
      Object.values(handlers).forEach(f => f(connect, region));
    }
  }

  /**
   * Register a function to be triggered when the UI changes to display a different region, and agents are able to
   * begin taking contacts in the new CCP region. If automatic region selection is in use for this multi-region setup,
   * this function will also be triggered when CCP is initialized and ready for use, if the region provided to the `getPrimaryRegion`
   * callback is not the currently active region for the agent.
   *
   * @param f A function that will be triggered when the UI changes to show CCP for a different region.
   *     The function will be called with an Object parameter with two properties:
   *     1. `activeRegion`: the string name of the AWS region for the newly-active CCP instance
   *     2. `activeCcpUrl`: the value of the `ccpUrl` parameter for the newly-active instance,
   *         as originally provided in the `initCCP()` parameters
   *
   * @returns A function that can be called if you wish to deregister the trigger.
   */
  globalConnect.core.onFailoverComplete = function(f) {
    globalConnect.core._failoverCompleteHandlers = globalConnect.core._failoverCompleteHandlers || {};
    const subId = connect.randomId();
    globalConnect.core._failoverCompleteHandlers[subId] = f;
    return () => delete globalConnect.core._failoverCompleteHandlers[subId];
  }

  globalConnect._triggerFailoverCompleteHandlers = function(data) {
    const handlers = globalConnect.core._failoverCompleteHandlers;
    if (handlers) {
      Object.values(handlers).forEach(f => f(data));
    }
  }

  /**
   * Register a function to be triggered when an active region change has been detected, when soft failover is enabled and
   * a voice contact is active. The UI will wait to change over to the new region until the active voice contact is destroyed.
   *
   * @param f A function that will be triggered when a soft failover has been scheduled to occur when the active voice contact is destroyed.
   *     The function will be called with an Object parameter with one property:
   *     1. `nextActiveArn`: the ARN of the Connect instance that will become active in the UI once the active voice contact is destroyed.
   *
   * @returns A function that can be called if you wish to deregister the trigger.
   */
  globalConnect.core.onFailoverPending = function(f) {
    globalConnect.core._failoverPendingHandlers = globalConnect.core._failoverPendingHandlers || {};
    const subId = connect.randomId();
    globalConnect.core._failoverPendingHandlers[subId] = f;
    return () => delete globalConnect.core._failoverPendingHandlers[subId];
  }

  globalConnect._triggerFailoverPendingHandlers = function(data) {
    const handlers = globalConnect.core._failoverPendingHandlers;
    if (handlers) {
      Object.values(handlers).forEach(f => f(data));
    }
  }

  /**
   * Download CCP agent logs from the CCP instances in this multi-region setup. A separate log file
   * will be produced for each instance. The options are the same as for `connect.getLog().download()`,
   * except each log name will be prefixed with the AWS region associated with that log's Connect instance.
   *
   * @param options Optional parameter of type Object, providing Download options:
   *     { logName: 'agent-log', // (the default name)
   *       filterByLogLevel: false // download all logs (the default)
   *     }
   *     e.g. in a multi-region setup with one CCP instance in us-west-2 and another in us-east-1, this will
   *     download two files: us-west-2-agent-log.txt and us-east-1-agent-log.txt.
   */
  globalConnect.core.downloadLogs = function(options) {
    if (globalConnect.core.regions && globalConnect.core.regions[globalConnect.core.primaryRegion]
        && globalConnect.core.regions[globalConnect.core.primaryRegion].connect) {
      Object.entries(globalConnect.core.regions).forEach(([region, {connect}]) => {
        const logName = `${region}-${options && options.logName || 'agent-log'}`;
        connect.getLog().download({logName, filterByLogLevel: options && options.filterByLogLevel});
      });
    } else {
      throw new Error("CCP is not initialized yet. Please call initCCP() first and wait until the getPrimaryRegion promise resolves.");
    }
  };

  globalConnect.core.failover = function (useSoftFailover) {
    globalConnect.core.failoverTo(globalConnect.core.secondaryRegion, useSoftFailover);
  };

  globalConnect.core.failoverTo = function (electedNewPrimaryRegion, useSoftFailover) {
    validateRegion(electedNewPrimaryRegion);
    if (electedNewPrimaryRegion === globalConnect.core.primaryRegion) {
      connect
        .getLog()
        .info(`[Disaster Recovery] Ignoring request to fail over to region ${electedNewPrimaryRegion} since it is already the currently active region.`)
        .sendInternalLogToServer();
    } else {
      globalConnect.core.deactivate(globalConnect.core.primaryRegion, useSoftFailover);
    }
  };

  /**-------------------------------------------------------------------------
   * Deactivates a region
   */
   globalConnect.core.deactivate = function (region, useSoftFailover) {
    var connect = globalConnect.core.regions[region].connect;
    connect
      .getLog()
      .info("[Disaster Recovery] Deactivating %s region.", region)
      .sendInternalLogToServer();
    // call this to suppress contacts
    if (connect.core.suppressContacts && connect.core.forceOffline) {
      connect.core.suppressContacts(true);
      connect.core.forceOffline({softFailover: useSoftFailover});
    } else {
      connect.getLog().error("[Disaster Recovery] CCP did not load successfully for region %s; unable to deactivate region", region);
    }
  };

  /**-------------------------------------------------------------------------
   * Activates Stand-by region on failover using suppress==false event
   */
   globalConnect.core.activate = function (region) {
    var connect = globalConnect.core.regions[region].connect;
    connect
      .getLog()
      .info("[Disaster Recovery] Activating %s region.", region)
      .sendInternalLogToServer();
    if (connect.core.suppressContacts) {
      connect.core.suppressContacts(false);
    } else {
      connect.getLog().error("[Disaster Recovery] CCP did not load successfully for region %s; unable to activate region", region);
    }
  };
})();