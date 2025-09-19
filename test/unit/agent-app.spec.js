require("../unit/test-setup.js");

describe('agent-app', function () {
  var sandbox = sinon.createSandbox();
  jsdom({ url: "http://localhost" });

  var endpoint = 'https://www.amazon.com/ccp-v2';
  var domCon;
  var bus;
  var conduit;

  before(function () {
    if (typeof extractContactId === 'undefined') {
      global.extractContactId = contact =>
        (typeof contact === 'string' ? contact : contact.getContactId());
    }
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

  describe('initCustomViewsApp – contact object vs. contact-id', function () {
    const connectUrl = 'https://customview.example.com';
    let sandbox, containerDOM, terminateSpy, warnSpy;
    const uniqueSuffix = (label) =>
      `suffix-${label.replace(/\W+/g, '')}-${Math.random().toString(36).substr(2, 5)}`;
    const buildContact = (contactId = 'ContactIdObj', agentConnId = 'agentConnObj', status = 'connected') => ({
      getContactId: () => contactId,
      toSnapshot: () => ({
        contactData: {
          state: { type: status },
          connections: [{ type: 'agent', connectionId: agentConnId }]
        }
      }),
      onDestroy: sinon.stub(),
      getAttributes: sinon.stub().returns({})
    });
    const cases = [
      {
        label: 'with live contact object',
        makeConfig: () => {
          const contact = buildContact();
          return {
            customViewsParams: {
              contact,
              contactFlowId: 'flow-obj',
              iframeSuffix: uniqueSuffix('live-contact'),
            },
            contactObj: contact
          };
        },
        expectDestroyHook: true,
        expectedFixedParams: {
          contactFlowId: 'flow-obj',
          currentContactId: 'ContactIdObj',
          agentConnectionId: 'agentConnObj',
          duplicateCustomViewsAppId: 'CONNECTED'
        }
      },
      {
        label: 'with contact-id string (resolves successfully)',
        makeConfig: () => {
          sandbox.restore();
          sandbox = sinon.createSandbox();
          const fakeContact = buildContact('ContactIdStr', 'agentConnFromStub');
          const fakeAgent = { getContacts: () => [fakeContact] };
          sandbox.stub(connect, 'agent').callsFake((cb) => cb(fakeAgent));
          return {
            customViewsParams: {
              contact: 'ContactIdStr',
              contactFlowId: 'flow-str',
              iframeSuffix: uniqueSuffix('contact-id-success'),
            }
          };
        },
        expectDestroyHook: false,
        expectedFixedParams: {
          contactFlowId: 'flow-str',
          currentContactId: 'ContactIdStr',
          agentConnectionId: 'agentConnFromStub',
          duplicateCustomViewsAppId: 'CONNECTED'
        }
      },
      {
        label: 'with contact-id string (unresolved)',
        makeConfig: () => {
          sandbox.restore();
          sandbox = sinon.createSandbox();
          sandbox.stub(connect, 'agent').callsFake((cb) => cb({ getContacts: () => [] }));
          return {
            customViewsParams: {
              contact: 'UnmatchedContactId',
              contactFlowId: 'flow-unmatched',
              iframeSuffix: uniqueSuffix('contact-id-unmatched'),
            }
          };
        },
        expectDestroyHook: false,
        expectedFixedParams: {
          contactFlowId: 'flow-unmatched',
          currentContactId: 'UnmatchedContactId',
          duplicateCustomViewsAppId: 'DEFAULT'
        }
      },
      {
        label: 'with undefined contact',
        makeConfig: () => ({
          customViewsParams: {
            contact: undefined,
            contactFlowId: 'flow-nocontact',
            iframeSuffix: uniqueSuffix('no-contact'),
          }
        }),
        expectDestroyHook: false,
        expectedFixedParams: {
          contactFlowId: 'flow-nocontact',
          duplicateCustomViewsAppId: 'DEFAULT'
        }
      },
      {
        label: 'with malformed contact object (no getContactId)',
        makeConfig: () => {
          const contact = {
            toSnapshot: () => ({
              contactData: {
                state: { type: 'missed' },
                connections: [{ type: 'agent', connectionId: 'connBad' }]
              }
            }),
            onDestroy: sinon.stub(),
            getAttributes: sinon.stub().returns({})
          };
          return {
            customViewsParams: {
              contact,
              contactFlowId: 'flow-bad',
              iframeSuffix: uniqueSuffix('malformed-contact'),
            },
            contactObj: contact
          };
        },
        expectDestroyHook: true,
        expectedFixedParams: {
          contactFlowId: 'flow-bad',
          agentConnectionId: 'connBad',
          duplicateCustomViewsAppId: 'MISSED'
        }
      },
      {
        label: 'with contact object but no contactFlowId',
        makeConfig: () => {
          const contact = buildContact('MissingFlowId', 'connMF');
          return {
            customViewsParams: {
              contact,
              iframeSuffix: uniqueSuffix('no-flowid'),
            },
            contactObj: contact
          };
        },
        expectDestroyHook: true,
        expectedFixedParams: {
          currentContactId: 'MissingFlowId',
          agentConnectionId: 'connMF',
          duplicateCustomViewsAppId: 'CONNECTED'
        }
      },
      {
        label: 'with contact object and autoDestroy disabled',
        makeConfig: () => {
          const contact = buildContact('AutoDestroyOffId', 'connNoDestroy');
          return {
            customViewsParams: {
              contact,
              iframeSuffix: uniqueSuffix('autodestroy-disabled'),
              disableAutoDestroy: true
            },
            contactObj: contact
          };
        },
        expectDestroyHook: false,
        expectedFixedParams: {
          currentContactId: 'AutoDestroyOffId',
          agentConnectionId: 'connNoDestroy',
          duplicateCustomViewsAppId: 'CONNECTED'
        }
      },
      {
        label: 'with custom terminateCustomViewOptions',
        makeConfig: () => {
          const contact = buildContact('CustomTerminateOptions', 'connCustomTerm');
          return {
            customViewsParams: {
              contact,
              iframeSuffix: uniqueSuffix('custom-terminate'),
              terminateCustomViewOptions: {
                timeout: 7777,
                hideIframe: false,
                resolveIframe: false
              }
            },
            contactObj: contact
          };
        },
        expectDestroyHook: true,
        expectTerminateOptions: {
          timeout: 7777,
          hideIframe: false,
          resolveIframe: false
        },
        expectedFixedParams: {
          currentContactId: 'CustomTerminateOptions',
          agentConnectionId: 'connCustomTerm',
          duplicateCustomViewsAppId: 'CONNECTED'
        }
      }
    ];
    beforeEach(function () {
      sandbox = sinon.createSandbox();
      containerDOM = document.createElement('div');
      containerDOM.id = 'customviews-container';
      document.body.appendChild(containerDOM);
      terminateSpy = sandbox.spy(connect.core, 'terminateCustomView');
      warnSpy = sandbox.spy(console, 'warn');
    });
    afterEach(function () {
      const iframe = containerDOM.querySelector('iframe');
      if (iframe) {
        const suffix = iframe.id?.replace('customviews-', '');
        if (suffix) {
          connect.core.terminateCustomView(connectUrl, suffix, {
            timeout: 0,
            hideIframe: true,
            resolveIframe: true
          });
        }
      }
      document.body.removeChild(containerDOM);
      sandbox.restore();
      warnSpy.restore();
    });
    cases.forEach(tc => {
      it(`builds iframe src correctly ${tc.label}`, function () {
        const configBundle = tc.makeConfig();
        const config = typeof configBundle.customViewsParams === 'object'
          ? configBundle
          : { customViewsParams: configBundle };
        connect.agentApp.initApp('customviews', containerDOM, connectUrl, config);
        const iframe = containerDOM.querySelector('iframe');
        expect(iframe, 'iframe should exist').to.not.be.null;
        const url = new URL(iframe.src);
        expect(url.origin + url.pathname).to.equal(connectUrl + '/');
        expect(url.searchParams.get('agentAppTabId')).to.match(/-tab$/);
        const paramsObj = {};
        url.searchParams.forEach((value, key) => {
          paramsObj[key] = value;
        });
        Object.entries(tc.expectedFixedParams).forEach(([key, expectedValue]) => {
          expect(paramsObj[key], `Expected param "${key}"`).to.equal(expectedValue);
        });
        const expectedKeys = Object.keys(tc.expectedFixedParams).concat('agentAppTabId');
        expect(Object.keys(paramsObj).sort(), 'Only expected query params').to.deep.equal(expectedKeys.sort());
        const contactObj = configBundle.contactObj;
        if (tc.expectDestroyHook && contactObj?.onDestroy) {
          sinon.assert.calledOnce(contactObj.onDestroy);
          const destroyFn = contactObj.onDestroy.firstCall.args[0];
          destroyFn();
          if (tc.expectTerminateOptions) {
            sinon.assert.calledWithMatch(
              terminateSpy,
              connectUrl,
              config.customViewsParams.iframeSuffix,
              tc.expectTerminateOptions
            );
          } else {
            sinon.assert.calledWithMatch(
              terminateSpy,
              connectUrl,
              config.customViewsParams.iframeSuffix,
              sinon.match({
                timeout: 5000,
                hideIframe: true,
                resolveIframe: true
              })
            );
          }
        } else {
          sinon.assert.neverCalledWith(terminateSpy, connectUrl, config.customViewsParams.iframeSuffix);
        }
      });
    });
  });
});

