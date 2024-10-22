(function () {
  var global = this || globalThis;
  var connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  connect.agentApp = {};

  var APP = {
    CCP: 'ccp',
    GUIDES: 'customviews',
  };

  connect.agentApp.initCCP = connect.core.initCCP;
  connect.agentApp.isInitialized = function (instanceAlias) {};

  connect.agentApp.initAppCommunication = function (iframeId, endpoint) {
    var iframe = document.getElementById(iframeId);
    var iframeConduit = new connect.IFrameConduit(endpoint, window, iframe);
    var BROADCAST_TYPE = [
      connect.AgentEvents.UPDATE,
      connect.ContactEvents.VIEW,
      connect.EventType.ACKNOWLEDGE,
      connect.EventType.TERMINATED,
      connect.TaskEvents.CREATED
    ];
    iframe.addEventListener('load', function (e) {
      BROADCAST_TYPE.forEach(function (type) {
        connect.core.getUpstream().onUpstream(type, function (data) {
          iframeConduit.sendUpstream(type, data);
        });
      });
    });
  };

  var getConnectUrl = function (ccpUrl) {
    var pos = ccpUrl.indexOf('ccp-v2');
    return ccpUrl.slice(0, pos - 1);
  };

  var signOutThroughCCP = function (ccpUrl) {
      var logoutUrl = getConnectUrl(ccpUrl) + '/logout';
      return connect.fetch(logoutUrl, {
        credentials: 'include',
      }).then(function () {
        var eventBus = connect.core.getEventBus();
        eventBus.trigger(connect.EventType.TERMINATE);
        return true;
      }).catch(function (e) {
        connect
          .getLog()
          .error('An error occured on logout.' + e)
          .withException(e);
        window.location.href = logoutUrl;
        return false;
      });
    };

  var removeAppData = function (appName) {
    connect.agentApp.AppRegistry.delete(appName);
  }

  /**
   * Initializes custom views application for a given contact. It set up the iframe for the custom view and 
   * creates the lifecycle hook of the custom view based on the contact's status.
   * 
   * @param {string} connectUrl - The URL for the custom view.
   * @param {string} containerDOM - The DOM container for the view iframe.
   * @param {AppOptions} config - Configuration object containing contact details and other settings.
   */
  var initCustomViewsApp = function (connectUrl, containerDOM, config) {
    const { contact, disableAutoDestroy, iframeSuffix, terminateCustomViewOptions = {} } = config.customViewsParams;
    let { contactFlowId } = config.customViewsParams;
    let contactId, appName;

    if (contact !== undefined) {
      contactId = extractContactId(contact);

      if (contactId && disableAutoDestroy !== true && typeof contact !== 'string') {
        contact.onDestroy((contact) => {
          connect.core.terminateCustomView(
            connectUrl,
            iframeSuffix,
            {
              timeout: terminateCustomViewOptions.timeout || 5000,
              hideIframe: terminateCustomViewOptions.hideIframe !== undefined ? terminateCustomViewOptions.hideIframe : true,
              resolveIframe: terminateCustomViewOptions.resolveIframe !== undefined ? terminateCustomViewOptions.resolveIframe : true
            });
        });
      }
      if (!contactFlowId) {
        console.warn('[CustomViews]: Need to provide a contactFlowId when defining contact parameter for initalizing customviews application');
      }
    }

    if (iframeSuffix) {
      appName = `${APP.GUIDES}${iframeSuffix}`;
    } else {
      appName = `${APP.GUIDES}`;
    }
    const iframeIdSelector = `iframe[id='${appName}']`;
    const iframe = containerDOM?.querySelector(iframeIdSelector) ||
      document.getElementById(appName) ||
      window.top.document.getElementById(appName);

    if (iframe) {
      const tabId = AWS.util.uuid.v4();
      if (contactId) {
        iframe.src = `${connectUrl}?contactFlowId=${contactFlowId}&currentContactId=${contactId}&agentAppTabId=${tabId}-tab`;
      } else if (contactFlowId) {
        iframe.src = `${connectUrl}?contactFlowId=${contactFlowId}&agentAppTabId=${tabId}-tab`;
      }
    } else {
      throw new Error('[CustomViews]: No iframe found for the app: ', appName);
    }
  };

  var extractContactId = function (contact) {
    if (typeof contact === 'string') {
      return contact;
    }
    try {
      return contact.getContactId();
    } catch {
      console.error('[CustomViews]: Invalid Contact Provided: ', contact);
      return undefined;
    }
  }

  var signInThroughinitCCP = function (ccpUrl, container, config) {
    var defaultParams = {
      ccpUrl: ccpUrl,
      ccpLoadTimeout: 10000,
      loginPopup: true,
      loginUrl: getConnectUrl(ccpUrl) + '/login',
      softphone: {
        allowFramedSoftphone: true,
        disableRingtone: false,
        allowFramedVideoCall: true,
        allowFramedScreenSharing: true,
        allowFramedScreenSharingPopUp: false,
      }
    };
    var ccpParams = connect.merge(defaultParams, config.ccpParams);
    connect.core.initCCP(container, ccpParams);
  };

  var hasAnySearchParameter = function (url) {
    var regex = /[?&]?[^=?&]+=[^=?&]+/g;
    return regex.test(url);
  }

  connect.agentApp.initApp = function (name, containerId, appUrl, config) {
    config = config ? config : {};
    var endpoint = (appUrl.endsWith('/') || hasAnySearchParameter(appUrl))  ? appUrl : appUrl + '/';
    var onLoad = config.onLoad ? config.onLoad : null;
    var registerConfig = { endpoint: endpoint, style: config.style, onLoad: onLoad };
    var filteredName;
    if (name === APP.CCP_DR) {
      filteredName = APP.CCP;
    } else if (name === APP.GUIDES && config.customViewsParams) {
      const { iframeSuffix } = config.customViewsParams
      if (iframeSuffix) {
        filteredName = `${APP.GUIDES}${iframeSuffix}`;
      } else {
        filteredName = `${APP.GUIDES}`;
      }
      if (connect.agentApp.AppRegistry.get(filteredName) !== undefined) {
        throw new Error('[CustomViews]: Custom views application with the same name already exists. Please provide a different iframeSuffix for the custom views application.')
      }
    } else {
      filteredName = name;
    }
    var containerElement = (typeof containerId === 'string') ? document.getElementById(containerId) : containerId;
    connect.agentApp.AppRegistry.register(filteredName, registerConfig, containerElement);
    connect.agentApp.AppRegistry.start(filteredName, function (moduleData) {
      var endpoint = moduleData.endpoint;
      var containerDOM = moduleData.containerDOM;
      return {
        init: function () {
          switch (name) {
            case APP.CCP:
              config.ccpParams = config.ccpParams ? config.ccpParams : {};
              if (config.style) config.ccpParams.style = config.style;
              return signInThroughinitCCP(endpoint, containerDOM, config);
            case APP.GUIDES:
              if (config.customViewsParams !== undefined) {
                connect.agentApp.initAppCommunication(filteredName, endpoint, containerDOM);
                return initCustomViewsApp(endpoint, containerDOM, config);
              } else {
                return connect.agentApp.initAppCommunication(filteredName, endpoint, containerDOM)
              }
            default:
              return connect.agentApp.initAppCommunication(filteredName, endpoint, containerDOM);
          }
        },
        destroy: function () {
          switch (name) {
            case APP.CCP:
              return signOutThroughCCP(endpoint);
            case APP.GUIDES:
              if (config.customViewsParams !== undefined) {
                return removeAppData(filteredName);
              } else {
                return null;
              }
            default:
              return null;
          }
        }
      };
    });
  };

  connect.agentApp.stopApp = function (name) {
    return connect.agentApp.AppRegistry.stop(name);
  };
})();
