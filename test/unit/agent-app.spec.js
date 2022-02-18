require("../unit/test-setup.js");

describe('agent-app', function () {
  var sandbox = sinon.createSandbox();
  jsdom({ url: "http://localhost" });

  var endpoint = 'https://www.amazon.com/ccp-v2';
  var domCon;
  var bus;
  var conduit;

  before(function () {
    bus = new connect.EventBus();
    conduit = new connect.IFrameConduit(endpoint, window, document.createElement('iframe'));
    conduit.upstreamBus = bus;
    conduit.downstreamBus = bus;
  });

  beforeEach(function () {
    if (!domCon) {
      domCon = document.createElement('div');
      domCon.setAttribute('id', 'agent-app-dom');
      document.body.appendChild(domCon);
    }
    sandbox.spy(connect.agentApp.AppRegistry, 'register');
    sandbox.spy(connect.agentApp.AppRegistry, 'start');
    sandbox.spy(connect.agentApp.AppRegistry, 'stop');
    sandbox.spy(conduit, "sendUpstream");
    sandbox.spy(bus, "subscribe");
    sandbox.stub(connect.core, "getEventBus").returns(bus);
    sandbox.stub(connect.core, "getUpstream").returns(conduit);
    sandbox.stub(connect, "IFrameConduit").returns(conduit);
  });

  afterEach(function () {
    domCon.remove();
    domCon = null;
    sandbox.restore();
  });

  describe('initCCP()', function () {
    it('should be same to core.initCCP', function () {
      expect(connect.agentApp.initCCP).to.equal(connect.core.initCCP);
    });
  });

  describe('initAppCommunication', function () {
    it('should trigger sendUpstream', function () {
      connect.agentApp.initAppCommunication('agent-app-dom', endpoint);
      var event = document.createEvent('Event');
      event.initEvent('load', true, true);
      domCon.dispatchEvent(event);
      bus.trigger(connect.EventType.ACKNOWLEDGE);
      expect(connect.core.getUpstream().sendUpstream.called).to.be.true;
    });
  });

  describe('initApp()', function () {
    beforeEach(function () {
      sandbox.spy(connect.core, "initCCP");
      sandbox.spy(connect.agentApp, 'initAppCommunication');
      sandbox.spy(connect, 'fetch');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('start an app', function () {
      connect.agentApp.initApp('agentApp', 'agent-app-dom', endpoint, {});
      expect(connect.agentApp.AppRegistry.register.called).to.be.true;
      expect(connect.agentApp.AppRegistry.start.called).to.be.true;
    });

    it('start CCP without config', function () {
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/',
        ccpLoadTimeout: 10000,
        loginPopup: true,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint);
      console.log(connect.core.initCCP.firstCall.args);
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
    });

    it('start CCP with config', function () {
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/',
        ccpLoadTimeout: 10000,
        loginPopup: false,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint, { ccpParams: { loginPopup: false } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('adds a trailing slash to the url', function () {
      connect.agentApp.initApp('customer-profiles', 'agent-app-dom', endpoint);
      expect(connect.agentApp.initAppCommunication.calledWith('customer-profiles', endpoint + '/')).to.be.true;
    });

    it('leaves trailing slash on the url', function () {
      connect.agentApp.initApp('customer-profiles', 'agent-app-dom', endpoint + '/');
      expect(connect.agentApp.initAppCommunication.calledWith('customer-profiles', endpoint + '/')).to.be.true;
    });

    it('signs out of ccp on destroy with correct cf url', async function () {
      var ccpEndpoint = 'https://amazon.awsapps.com/connect/ccp-v2';
      connect.agentApp.initApp('ccp', 'agent-app-dom', ccpEndpoint, {});
      connect.agentApp.stopApp('ccp');
      expect(connect.fetch.calledWith('https://amazon.awsapps.com/connect/logout')).to.be.true;
    });

    it('signs out of ccp on destroy with correct nginx url', function () {
      var ccpEndpoint = 'https://amazon.my.connect.aws/ccp-v2';
      connect.agentApp.initApp('ccp', 'agent-app-dom', ccpEndpoint, {});
      connect.agentApp.stopApp('ccp');
      expect(connect.fetch.calledWith('https://amazon.my.connect.aws/logout')).to.be.true;
    });

    it('signs out of ccp on destroy with longer softphone ccp url', function () {
      var ccpEndpoint = 'https://amazon.my.connect.aws/ccp-v2/softphone/';
      connect.agentApp.initApp('ccp', 'agent-app-dom', ccpEndpoint, {});
      connect.agentApp.stopApp('ccp');
      expect(connect.fetch.calledWith('https://amazon.my.connect.aws/logout')).to.be.true;
    });

    it('adds onload function', function () {
      var divElement = document.createElement('div');
      divElement.setAttribute('id', 'agent-app-onload');
      document.body.appendChild(divElement);
      var onLoad = sandbox.spy();
      connect.agentApp.initApp('agentApp', 'agent-app-onload', endpoint, { onLoad: onLoad });

      var iframe = document.querySelector('#agent-app-onload iframe');
      iframe.onload()

      expect(iframe.onload).to.equal(onLoad);
      expect(connect.agentApp.AppRegistry.register.called).to.be.true;
      expect(connect.agentApp.AppRegistry.start.called).to.be.true;
      expect(onLoad.called).to.be.true;
    });
  });

  describe('stopApp()', function () {
    it('Stop an app', function () {
      connect.agentApp.initApp('agentApp', 'agent-app-dom', endpoint, {});
      connect.agentApp.stopApp('agentApp');
      expect(connect.agentApp.AppRegistry.stop.called).to.be.true;
    });

    it('Stop CCP when fetch fails', function (done) {
      try {
        connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint, {});
        connect.agentApp.stopApp('ccp');
        expect(connect.agentApp.AppRegistry.stop.called).to.be.true;
      } catch (e) {
        expect(window.location.href).to.equal('endpoint/logout');
      }
      done();
    });
  });
});
