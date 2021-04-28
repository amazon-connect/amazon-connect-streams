(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  var APP = {
    CCP: 'ccp',
  };

  function AppRegistry() {
    var moduleData = {};
    var makeAppIframe = function (appName, endpoint, style) {
      var iframe = document.createElement('iframe');
      iframe.src = endpoint;
      iframe.style = style || 'width: 100%; height:100%;';
      iframe.id = appName;
      iframe['aria-label'] = appName;
      iframe.setAttribute(
        "sandbox",
        "allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      );
      // TODO: Update sandbox option for 3P widget

      return iframe;
    };

    return {
      register: function (appName, config, containerDOM) {
        moduleData[appName] = {
          containerDOM: containerDOM,
          endpoint: config.endpoint,
          style: config.style,
          instance: undefined,
        };
      },
      start: function (appName, creator) {
        if (!moduleData[appName]) return;
        var containerDOM = moduleData[appName].containerDOM;
        var endpoint = moduleData[appName].endpoint;
        var style = moduleData[appName].style;
        if (appName !== APP.CCP) {
          var app = makeAppIframe(appName, endpoint, style);
          containerDOM.appendChild(app);
        }

        moduleData[appName].instance = creator(moduleData[appName]);
        return moduleData[appName].instance.init();
      },
      stop: function (appName) {
        if (!moduleData[appName]) return;

        var data = moduleData[appName];
        var app = data.containerDOM.querySelector('iframe');
        data.containerDOM.removeChild(app);

        var result;
        if (data.instance) {
          result = data.instance.destroy();
          delete data.instance;
        }

        return result;
      }
    };
  }

  global.connect.agentApp.AppRegistry = AppRegistry();
})();
