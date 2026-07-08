describe('agent-app', () => {
  const endpoint = 'https://www.amazon.com/ccp-v2';
  let domCon;
  let bus;
  let conduit;

  beforeEach(() => {
    bus = new connect.EventBus();
    conduit = new connect.IFrameConduit(endpoint, window, document.createElement('iframe'));
    conduit.upstreamBus = bus;
    conduit.downstreamBus = bus;
    global.globalConnect = { core: { initCCP: () => {} } };

    domCon = document.createElement('div');
    domCon.setAttribute('id', 'agent-app-dom');
    document.body.appendChild(domCon);

    jest.spyOn(connect.agentApp.AppRegistry, 'register');
    jest.spyOn(connect.agentApp.AppRegistry, 'start');
    jest.spyOn(connect.agentApp.AppRegistry, 'stop');
    jest.spyOn(conduit, 'sendUpstream');
    jest.spyOn(bus, 'subscribe');
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue(bus);
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue(conduit);
    jest.spyOn(connect, 'IFrameConduit').mockReturnValue(conduit);
  });

  afterEach(() => {
    domCon.remove();
    domCon = null;
    bus.unsubscribeAll();
  });

  describe('initAppCommunication', () => {
    it('forwards the app load event upstream after acknowledge', () => {
      connect.agentApp.initAppCommunication('agent-app-dom', endpoint);
      const event = document.createEvent('Event');
      event.initEvent('load', true, true);
      domCon.dispatchEvent(event);
      bus.trigger(connect.EventType.ACKNOWLEDGE);
      expect(connect.core.getUpstream().sendUpstream).toHaveBeenCalled();
    });
  });

  describe('initApp()', () => {
    beforeEach(() => {
      jest.spyOn(connect.core, 'initCCP');
      jest.spyOn(global.globalConnect.core, 'initCCP').mockReturnValue(null);
      jest.spyOn(connect.agentApp, 'initAppCommunication');
      jest.spyOn(connect, 'fetch');
    });

    it('registers and starts a non ccp app', () => {
      connect.agentApp.initApp('agentApp', 'agent-app-dom', endpoint, {});
      expect(connect.agentApp.AppRegistry.register).toHaveBeenCalled();
      expect(connect.agentApp.AppRegistry.start).toHaveBeenCalled();
    });

    it('starts CCP with default params when no config is given', () => {
      const expectedParams = {
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
      expect(connect.core.initCCP).toHaveBeenCalledWith(domCon, expectedParams);
    });

    it('starts CCP with caller config merged over defaults', () => {
      const expectedParams = {
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
      expect(connect.core.initCCP).toHaveBeenCalledWith(domCon, expectedParams);
      expect(connect.core.getEventBus().subscribe).toHaveBeenCalled();
    });

    it('passes the ccp url through to initCCP unchanged regardless of query string shape', () => {
      const ccpUrls = [
        'https://www.amazon.com/ccp-v2/channel-view/?test=true',
        'https://www.amazon.com/ccp-v2/channel-view?test=true',
        'https://www.amazon.com/ccp-v2/channel-view/?test=false&test-param=true&testParam=1',
      ];

      ccpUrls.forEach((ccpUrl) => {
        connect.core.initCCP.mockClear();
        connect.agentApp.initApp('ccp', 'agent-app-dom', ccpUrl, { ccpParams: { loginPopup: false } });
        expect(connect.core.initCCP).toHaveBeenCalledWith(domCon, {
          ccpUrl,
          ccpLoadTimeout: 10000,
          loginPopup: false,
          loginUrl: 'https://www.amazon.com/login',
          softphone: {
            allowFramedSoftphone: true,
            disableRingtone: false,
            allowFramedVideoCall: true,
            allowFramedScreenSharing: true,
            allowFramedScreenSharingPopUp: false,
          },
        });
        expect(connect.core.getEventBus().subscribe).toHaveBeenCalled();
      });
    });

    it('applies style passed in ccpParams', () => {
      const style = 'width:200px; height:200px;';
      const expectedParams = {
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
      expect(connect.core.initCCP).toHaveBeenCalledWith(domCon, expectedParams);
      expect(connect.core.getEventBus().subscribe).toHaveBeenCalled();
    });

    it('applies style passed at the top level of the agent app config', () => {
      const style = 'width:200px; height:200px;';
      const expectedParams = {
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
      expect(connect.core.initCCP).toHaveBeenCalledWith(domCon, expectedParams);
      expect(connect.core.getEventBus().subscribe).toHaveBeenCalled();
    });

    it('appends a trailing slash to an endpoint that lacks one', () => {
      connect.agentApp.initApp('customer-profiles', 'agent-app-dom', endpoint);
      expect(connect.agentApp.initAppCommunication).toHaveBeenCalledWith('customer-profiles', endpoint + '/', expect.anything());
    });

    it('does not add a second trailing slash when one is already present', () => {
      connect.agentApp.initApp('customer-profiles', 'agent-app-dom', endpoint + '/');
      expect(connect.agentApp.initAppCommunication).toHaveBeenCalledWith('customer-profiles', endpoint + '/', expect.anything());
    });

    it('signs out via the logout endpoint derived from the ccp url on stop', () => {
      const cases = [
        { ccpEndpoint: 'https://amazon.awsapps.com/connect/ccp-v2', logout: 'https://amazon.awsapps.com/connect/logout' },
        { ccpEndpoint: 'https://amazon.my.connect.aws/ccp-v2', logout: 'https://amazon.my.connect.aws/logout' },
        { ccpEndpoint: 'https://amazon.my.connect.aws/ccp-v2/softphone/', logout: 'https://amazon.my.connect.aws/logout' },
      ];

      cases.forEach(({ ccpEndpoint, logout }) => {
        connect.fetch.mockClear();
        connect.agentApp.initApp('ccp', 'agent-app-dom', ccpEndpoint, {});
        connect.agentApp.stopApp('ccp');
        expect(connect.fetch).toHaveBeenCalledWith(logout, expect.anything());
      });
    });

    it('adds onload function', () => {
      const divElement = document.createElement('div');
      divElement.setAttribute('id', 'agent-app-onload');
      document.body.appendChild(divElement);
      const onLoad = jest.fn();
      connect.agentApp.initApp('agentApp', 'agent-app-onload', endpoint, { onLoad: onLoad });

      const iframe = document.querySelector('#agent-app-onload iframe');
      iframe.onload();

      expect(iframe.onload).toBe(onLoad);
      expect(connect.agentApp.AppRegistry.register).toHaveBeenCalled();
      expect(connect.agentApp.AppRegistry.start).toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalled();

      divElement.remove();
    });
  });

  describe('stopApp()', () => {
    it('stops a registered app via AppRegistry.stop', () => {
      connect.agentApp.initApp('agentApp', 'agent-app-dom', endpoint, {});
      connect.agentApp.stopApp('agentApp');
      expect(connect.agentApp.AppRegistry.stop).toHaveBeenCalled();
    });
  });

  describe('initCustomViewsApp iframe construction', () => {
    const connectUrl = 'https://customview.example.com';
    let containerDOM;
    let terminateSpy;
    let suffixCounter = 0;
    const uniqueSuffix = (label) => `suffix-${label.replace(/\W+/g, '')}-${suffixCounter++}`;
    const buildContact = (contactId = 'ContactIdObj', agentConnId = 'agentConnObj', status = 'connected') => ({
      getContactId: () => contactId,
      toSnapshot: () => ({
        contactData: {
          state: { type: status },
          connections: [{ type: 'agent', connectionId: agentConnId }]
        }
      }),
      onDestroy: jest.fn(),
      getAttributes: jest.fn().mockReturnValue({})
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
        label: 'when a contact id string resolves to a live contact',
        makeConfig: () => {
          const fakeContact = buildContact('ContactIdStr', 'agentConnFromStub');
          const fakeAgent = { getContacts: () => [fakeContact] };
          jest.spyOn(connect, 'agent').mockImplementation((cb) => cb(fakeAgent));
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
        label: 'when a contact id string does not resolve to a contact',
        makeConfig: () => {
          jest.spyOn(connect, 'agent').mockImplementation((cb) => cb({ getContacts: () => [] }));
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
        label: 'when the contact object lacks getContactId',
        makeConfig: () => {
          const contact = {
            toSnapshot: () => ({
              contactData: {
                state: { type: 'missed' },
                connections: [{ type: 'agent', connectionId: 'connBad' }]
              }
            }),
            onDestroy: jest.fn(),
            getAttributes: jest.fn().mockReturnValue({})
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

    beforeEach(() => {
      containerDOM = document.createElement('div');
      containerDOM.id = 'customviews-container';
      document.body.appendChild(containerDOM);
      terminateSpy = jest.spyOn(connect.core, 'terminateCustomView');
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
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
    });

    cases.forEach(tc => {
      it(`builds iframe src correctly ${tc.label}`, () => {
        const configBundle = tc.makeConfig();
        const config = typeof configBundle.customViewsParams === 'object'
          ? configBundle
          : { customViewsParams: configBundle };
        connect.agentApp.initApp('customviews', containerDOM, connectUrl, config);
        const iframe = containerDOM.querySelector('iframe');
        expect(iframe).not.toBeNull();
        const url = new URL(iframe.src);
        expect(url.origin + url.pathname).toBe(connectUrl + '/');
        expect(url.searchParams.get('agentAppTabId')).toMatch(/-tab$/);
        const paramsObj = {};
        url.searchParams.forEach((value, key) => {
          paramsObj[key] = value;
        });
        Object.entries(tc.expectedFixedParams).forEach(([key, expectedValue]) => {
          expect(paramsObj[key]).toBe(expectedValue);
        });
        const expectedKeys = Object.keys(tc.expectedFixedParams).concat('agentAppTabId');
        expect(Object.keys(paramsObj).sort()).toEqual(expectedKeys.sort());
        const contactObj = configBundle.contactObj;
        if (tc.expectDestroyHook && contactObj?.onDestroy) {
          expect(contactObj.onDestroy).toHaveBeenCalledTimes(1);
          const destroyFn = contactObj.onDestroy.mock.calls[0][0];
          destroyFn();
          if (tc.expectTerminateOptions) {
            expect(terminateSpy).toHaveBeenCalledWith(
              expect.stringContaining(connectUrl),
              config.customViewsParams.iframeSuffix,
              expect.objectContaining(tc.expectTerminateOptions)
            );
          } else {
            expect(terminateSpy).toHaveBeenCalledWith(
              expect.stringContaining(connectUrl),
              config.customViewsParams.iframeSuffix,
              expect.objectContaining({
                timeout: 5000,
                hideIframe: true,
                resolveIframe: true
              })
            );
          }
        } else {
          expect(terminateSpy).not.toHaveBeenCalledWith(
            connectUrl,
            config.customViewsParams.iframeSuffix,
            expect.anything()
          );
        }
      });
    });
  });
});
