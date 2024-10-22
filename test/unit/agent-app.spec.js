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
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
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
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint, { ccpParams: { loginPopup: false } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('starts CCP with test parameter', function () {
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/channel-view/?test=true',
        ccpLoadTimeout: 10000,
        loginPopup: false,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', 'https://www.amazon.com/ccp-v2/channel-view/?test=true', { ccpParams: { loginPopup: false } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('starts CCP with test parameter with no leading slash before parameter', function () {
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/channel-view?test=true',
        ccpLoadTimeout: 10000,
        loginPopup: false,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', 'https://www.amazon.com/ccp-v2/channel-view?test=true', { ccpParams: { loginPopup: false } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('starts CCP with multiple test parameters', function () {
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/channel-view/?test=false&test-param=true&testParam=1',
        ccpLoadTimeout: 10000,
        loginPopup: false,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        }
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', 'https://www.amazon.com/ccp-v2/channel-view/?test=false&test-param=true&testParam=1', { ccpParams: { loginPopup: false } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('start CCP with style in ccpParams', function () {
      var style = 'width:200px; height:200px;';
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/',
        ccpLoadTimeout: 10000,
        loginPopup: true,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        },
        style
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint, { ccpParams: { style } });
      expect(connect.core.initCCP.calledWith(domCon, expectedParams)).to.be.true;
      expect(connect.core.getEventBus().subscribe.called).to.be.true;
    });

    it('start CCP with style in agentapp config', function () {
      var style = 'width:200px; height:200px;';
      var expectedParams = {
        ccpUrl: 'https://www.amazon.com/ccp-v2/',
        ccpLoadTimeout: 10000,
        loginPopup: true,
        loginUrl: 'https://www.amazon.com/login',
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: false,
        },
        style
      };
      connect.agentApp.initApp('ccp', 'agent-app-dom', endpoint, { style });
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

  describe('initCustomViewsApp()', function () {
    var connectUrl = 'https://customview.example.com';
    var contact = { getContactId: () => 'ContactId1', getAttributes: sandbox.stub(), onDestroy: sandbox.stub() }
    var contactId = 'contactId3'
    var contactConfig = { customViewsParams: { contact, disableAutoDestory: false } }
    var contactIdConfig = { customViewsParams: { contact: contactId, disableAutoDestroy: false } }
    var containerDOM;
    var terminateCustomViewStub;
    var warnSpy;

    contact.getAttributes.returns({
      DisconnectFlowForAgentUI: { value: 'DisconnectFlowForAgentUI' },
      DefaultFlowForAgentUI: { value: 'DefaultFlowForAgentUI' }
    })

    beforeEach(function () {
      containerDOM = document.createElement('div');
      containerDOM.setAttribute('id', 'customviews-container');
      document.body.appendChild(containerDOM);
      terminateCustomViewStub = sandbox.stub(connect.core, 'terminateCustomView');
      warnSpy = sinon.spy(console, 'warn');
    });

    afterEach(function () {
      document.body.removeChild(containerDOM);
      contact.onDestroy.resetHistory();
      console.warn.restore();
    })

    it('should initialize iframe with correct src with contact object with contactFlowId', function () {
      contactConfig.customViewsParams.contactFlowId = 'abc-flow-id';
      contactConfig.customViewsParams.iframeSuffix = 'ContactId1';
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.src).to.include(`${connectUrl}`);
      expect(iframe.src).to.include('contactFlowId=abc-flow-id');
      expect(iframe.src).to.include(`currentContactId=${contact.getContactId()}`);
      expect(iframe.src).to.include('agentAppTabId');
      expect(iframe.id).to.include(`customviews${contactConfig.customViewsParams.iframeSuffix}`);
    });

    it('should not throw with contact object & no contactFlowId', function () {
      const contactId = 'ContactId2';
      delete contactConfig.customViewsParams.contactFlowId;
      contactConfig.customViewsParams.iframeSuffix = contactId;
      contact.getContactId = () => contactId;
      expect(() => { connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactConfig) }).to.not.throw();

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.src).to.include('contactFlowId');
      expect(iframe.id).to.include('customviewsContactId2');
      sinon.assert.calledWith(warnSpy, '[CustomViews]: Need to provide a contactFlowId when defining contact parameter for initalizing customviews application');
    })

    it('should initialize iframe with correct src with contactId & contactFlowId', function () {
      contactIdConfig.customViewsParams.contactFlowId = 'abc-flow-id-part-2';
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactIdConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.src).to.include('contactFlowId=abc-flow-id-part-2');
      expect(iframe.id).to.include('customviews');
    })

    it('should not throw with contactId & no contactFlowId', function () {
      const contactId = 'ContactId4';
      delete contactIdConfig.customViewsParams.contactFlowId;;
      contactIdConfig.customViewsParams.contact = contactId;
      contactIdConfig.customViewsParams.iframeSuffix = contactId;
      expect(() => { connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactIdConfig) }).to.not.throw();

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.id).to.include('customviewsContactId4');
      sinon.assert.calledWith(warnSpy, '[CustomViews]: Need to provide a contactFlowId when defining contact parameter for initalizing customviews application');
    })

    it('should throw when app with name is already registered', function () {
      contactIdConfig.customViewsParams.iframeSuffix = 'ContactId2';
      expect(() => { connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactIdConfig) }).to.throw();

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.be.null;
    })

    it('should hook an onDestroy event to a contact object when provided contactFlowId and terminateCustomViewOptions', () => {
      const contactId = 'ContactId5';
      const timeout = 3000;
      const hideIframe = false;
      const resolveIframe =false;
      contactConfig.customViewsParams.contactFlowId = contactId;
      contactConfig.customViewsParams.iframeSuffix = contactId;
      contactConfig.customViewsParams.terminateCustomViewOptions = {timeout, hideIframe, resolveIframe};
      contact.getContactId = () => contactId;
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      var onDestroyCallback = contact.onDestroy.getCall(0).args[0];
      onDestroyCallback(contactId);
      sinon.assert.calledWith(terminateCustomViewStub, connectUrl + '/', contactId, {timeout, hideIframe, resolveIframe})
    })

    it('should hook an onDestroy event to a contact object when provided contactFlowId', () => {
      const contactId = 'ContactId5.1';
      contactConfig.customViewsParams.contactFlowId = contactId;
      contactConfig.customViewsParams.iframeSuffix = contactId;
      delete contactConfig.customViewsParams.terminateCustomViewOptions;
      contact.getContactId = () => contactId;
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      var onDestroyCallback = contact.onDestroy.getCall(0).args[0];
      onDestroyCallback(contactId);
      sinon.assert.calledWith(terminateCustomViewStub, connectUrl + '/', contactId, {timeout: 5000, hideIframe: true, resolveIframe: true})
    })


    it('should not hook an onDestroy event to a contact object when disableAutoDestroy is true', () => {
      const contactId = 'ContactId6';
      contactConfig.customViewsParams.contactFlowId = contactId;
      contactConfig.customViewsParams.iframeSuffix = contactId;
      contactConfig.customViewsParams.disableAutoDestroy = true;
      contact.getContactId = () => contactId;
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(() => { contact.onDestroy.getCall(0).args[0] }).to.Throw();
    })

    it('should not hook an onDestroy event to a contactId', () => {
      const contactId = 'ContactId7';
      contactIdConfig.customViewsParams.contactFlowId = contactId;
      contactIdConfig.customViewsParams.iframeSuffix = contactId;
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactIdConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(() => { contact.onDestroy.getCall(0).args[0] }).to.Throw();
    })

    it('should not hook an onDestroy event to an undefined contactId', () => {
      const contactId = 'ContactId8'
      contactIdConfig.customViewsParams.contact = '';
      contactIdConfig.customViewsParams.contactFlowId = contactId;
      contactIdConfig.customViewsParams.iframeSuffix = contactId;
      connect.agentApp.initApp('customviews', containerDOM, connectUrl, contactIdConfig);

      var iframe = document.querySelector('#customviews-container iframe');
      expect(iframe).to.not.be.null;
      expect(() => { contact.onDestroy.getCall(0).args[0] }).to.Throw();
    })
  })
});

