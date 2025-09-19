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
      connect.TaskEvents.CREATED,
      connect.EmailEvents.CREATED
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
   * Initializes custom views application for a given contact. It sets up the iframe for the custom view and 
   * creates the lifecycle hook of the custom view based on the contact's status.
   * Extended to support deduplication. 
   * Works whether the contact ID is passed directly in config or derived from a live connect.Contact object.
   * 
   * @param {string} connectUrl - The URL for the custom view.
   * @param {string} containerDOM - The DOM container for the view iframe.
   * @param {AppOptions} config - Configuration object containing contact details and other settings.
   */
  var initCustomViewsApp = function (connectUrl, containerDOM, config) {
    const {
      contact,
      disableAutoDestroy,
      iframeSuffix,
      terminateCustomViewOptions = {},
      deduplicate = true
    } = config.customViewsParams;
    let { contactFlowId } = config.customViewsParams;
    let contactId = extractContactId(contact);
    let agentConnectionId;
    let contactStatus;
    const resolveContactObject = (callback) => {
      if (typeof contact === 'string') {
        console.debug('[CustomViews] Resolving contact ID string...');
        connect.agent((agent) => {
          const matchedContact = agent.getContacts().find((c) => {
            try {
              return c.getContactId?.() === contact;
            } catch {
              return false;
            }
          });
          if (!matchedContact) {
            console.warn('[CustomViews] Unable to resolve contact ID to live contact object.');
          }
          callback(matchedContact);
        });
      } else {
        callback(contact);
      }
    };
    const bindOnDestroy = (resolvedContact) => {
      if (disableAutoDestroy) return;
      resolvedContact.onDestroy(() => {
        connect.core.terminateCustomView(connectUrl, iframeSuffix, {
          timeout: terminateCustomViewOptions.timeout ?? 5000,
          hideIframe: terminateCustomViewOptions.hideIframe ?? true,
          resolveIframe: terminateCustomViewOptions.resolveIframe ?? true,
        });
      });
      console.debug('[CustomViews] onDestroy handler registered.');
    };
    const extractAgentConnectionId = (resolvedContact) => {
      try {
        const connections = resolvedContact.toSnapshot().contactData.connections;
        const agentConn = connections.find((conn) => conn.type === 'agent');
        return agentConn?.connectionId;
      } catch (err) {
        console.warn('[CustomViews] Failed to extract agentConnectionId.');
        return undefined;
      }
    };
    const extractContactStatus = (resolvedContact) => {
      try {
        return resolvedContact.toSnapshot().contactData.state.type;
      } catch (err) {
        console.warn('[CustomViews] Failed to extract contact status.');
        return undefined;
      }
    };
    const continueInit = (contactId, agentConnectionId, status) => {
      const appName = iframeSuffix ? `${APP.GUIDES}${iframeSuffix}` : APP.GUIDES;
      const iframe =
        containerDOM?.querySelector(`iframe[id='${appName}']`) ||
        document.getElementById(appName) ||
        window.top?.document.getElementById(appName);
      if (!iframe) {
        throw new Error(`[CustomViews] Iframe not found for app: ${appName}`);
      }
      const tabId = AWS.util.uuid.v4();
      const params = new URLSearchParams({ agentAppTabId: `${tabId}-tab` });
      if (contactFlowId) params.set('contactFlowId', contactFlowId);
      if (contactId) params.set('currentContactId', contactId);
      if (agentConnectionId) params.set('agentConnectionId', agentConnectionId);
      const dedupId = deduplicate ? (status ? status.toUpperCase() : 'DEFAULT') : 'ADHOC';
      params.set('duplicateCustomViewsAppId', dedupId);
      iframe.src = `${connectUrl}?${params.toString()}`;
      console.debug('[CustomViews] Iframe source initialized with state identifier: ', dedupId);
    };
    resolveContactObject((resolvedContact) => {
      if (resolvedContact) {
        contactStatus = extractContactStatus(resolvedContact);
        contactId = extractContactId(resolvedContact);
        agentConnectionId = extractAgentConnectionId(resolvedContact);
        if (agentConnectionId) {
          console.debug('[CustomViews] Agent connection ID derived from contact object');
        }
        bindOnDestroy(resolvedContact);
      }
      continueInit(contactId, agentConnectionId, contactStatus);
    });
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
