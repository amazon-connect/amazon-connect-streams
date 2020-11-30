(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  connect.agentApp = {};

  var IFRAME_REFRESH_INTERVAL = 5000;
  var APP = {
    CCP: 'ccp',
  };

  connect.agentApp.initCCP = connect.core.initCCP;
  connect.agentApp.isInitialized = function (instanceAlias) {};

  connect.agentApp.initAppCommunication = function (iframeId, endpoint) {
    var iframe = document.getElementById(iframeId);
    var iframeConduit = new connect.IFrameConduit(endpoint, window, iframe);
    var BROADCAST_TYPE = [connect.AgentEvents.UPDATE, connect.ContactEvents.VIEW, connect.EventType.ACKNOWLEDGE, connect.EventType.TERMINATED];
    iframe.addEventListener('load', function (e) {
      BROADCAST_TYPE.forEach(function (type) {
        connect.core.getUpstream().onUpstream(type, function (data) {
          iframeConduit.sendUpstream(type, data);
        });
      });
    });

    var iframeRefreshInterval = window.setInterval(function () {
      iframe.src += '';
    }, IFRAME_REFRESH_INTERVAL);

    connect.core.getUpstream().onUpstream(connect.EventType.ACKNOWLEDGE, function () {
      global.clearInterval(iframeRefreshInterval);
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

  var signInThroughinitCCP = function (ccpUrl, container, config) {
    var defaultParams = {
      ccpUrl: ccpUrl,
      ccpLoadTimeout: 10000,
      loginPopup: true,
      loginUrl: getConnectUrl(ccpUrl) + '/login',
      softphone: {
        allowFramedSoftphone: true,
        disableRingtone: false,
      }
    };
    var ccpParams = connect.merge(defaultParams, config.ccpParams);
    connect.core.initCCP(container, ccpParams);
  };

  connect.agentApp.initApp = function (name, containerId, appUrl, config) {
    config = config ? config : {};
    var endpoint = appUrl.endsWith('/') ? appUrl : appUrl + '/';
    var registerConfig = { endpoint: endpoint, style: config.style };
    connect.agentApp.AppRegistry.register(name, registerConfig, document.getElementById(containerId));
    connect.agentApp.AppRegistry.start(name, function (moduleData) {
      var endpoint = moduleData.endpoint;
      var containerDOM = moduleData.containerDOM;
      return {
        init: function () {
          if (name === APP.CCP) return signInThroughinitCCP(endpoint, containerDOM, config);
          return connect.agentApp.initAppCommunication(name, endpoint);
        },
        destroy: function () {
          if (name === APP.CCP) return signOutThroughCCP(endpoint);
          return null;
        }
      };
    });
  };

  connect.agentApp.stopApp = function (name) {
    return connect.agentApp.AppRegistry.stop(name);
  };
})();
