const { assert, expect } = require("chai");
require("../unit/test-setup.js");

describe('Global Resiliency', function () {
    var sandbox = sinon.createSandbox();
    const defaultRingtoneUrl = "https://d366s8lxuwna4d.cloudfront.net/ringtone-ba0c9bd8a1d12786318965fd908eb2998bdb8f4c.mp3";
    const url = "http://localhost";
    let params;

    beforeEach(function () {
    });

    after(() => {
        sandbox.restore();
    })

    describe('#connect.globalResiliency.initGRCCP()', function () {
        jsdom({ url: url });
        let clock;
        let containerDiv;
        let clearStub, openStub, closeStub;
        const fakeRingtoneUrl = "customVoiceRingtone.amazon.com";
        const softphoneParams = { ringtoneUrl: fakeRingtoneUrl };
        const chatParams = { ringtoneUrl: "customChatRingtone.amazon.com" };
        const taskParams = { ringtoneUrl: "customTaskRingtone.amazon.com" };
        const pageOptionsParams = {
            enableAudioDeviceSettings: false,
            enableVideoDeviceSettings: false,
            enablePhoneTypeSettings: true
        };
        const shouldAddNamespaceToLogs = false;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            containerDiv = { appendChild: sandbox.spy() };
            params = {
                enableGlobalResiliency: true,
                ccpUrl: "http://localhost/url.com",
                secondaryCCPUrl: "http://localhost2/url.com",
                loginUrl: "http://loginUrl.com",
                softphone: softphoneParams,
                chat: chatParams,
                task: taskParams,
                loginOptions: { autoClose: true },
                pageOptions: pageOptionsParams,
                shouldAddNamespaceToLogs: shouldAddNamespaceToLogs
            };
            primaryIframe = connect.core._createCCPIframe(containerDiv, params, 'primary');
            secondaryIframe = connect.core._createCCPIframe(
            containerDiv,
            {
                ...params,
                ccpUrl: params.secondaryCCPUrl,
            },
            'secondary'
            );
            primaryIframe.src = 'http://localhost/url.com';
            secondaryIframe.src = 'http://localhost2/url.com';

            clearStub = sandbox.fake();
            closeStub = sandbox.fake();
            openStub = sandbox.fake.returns({ close: closeStub });
            sandbox.stub(connect.core, "checkNotInitialized").returns(false);
            sandbox.stub(connect.core, "_hideIframe").returns(null);
            sandbox.stub(connect.core, "_showIframe").returns(null);
            sandbox.stub(connect, "UpstreamConduitClient");
            sandbox.stub(connect, "UpstreamConduitMasterClient");
            sandbox.stub(connect, "isFramed").returns(true);
            sandbox.stub(connect, "ifMaster");
            sandbox.stub(connect, "VoiceRingtoneEngine");
            sandbox.stub(connect, "QueueCallbackRingtoneEngine");
            sandbox.stub(connect, "ChatRingtoneEngine");
            sandbox.spy(document, "createElement");
            sandbox.stub(connect.core, "_refreshIframeOnTimeout");
            sandbox.stub(connect, "publishMetric");
            sandbox.stub(connect.core, "getPopupManager").returns({ clear: clearStub, open: openStub })
            connect.numberOfConnectedCCPs = 0;
            connect.agent.initialized = true;
            sandbox.stub(connect.core, 'getAgentDataProvider').returns({
                getAgentData: () => ({})
            });
            connect.core.eventBus = new connect.EventBus({ logEvents: true });
            connect.globalResiliency._activeRegion = null;

            containerDiv.appendChild.resetHistory();
        });

        afterEach(function () {
            connect.agent.initialized = false;
            connect.core.initialized = false;
            connect.core.eventBus = null;
            sandbox.restore();
            clock.restore();
        });

       
        it("CCP Global Resiliency initialization with missing secondary CCP URL - leads to normal CCP init", function () {
            sandbox.resetHistory();
            sandbox.stub(connect.globalResiliency, "_switchActiveRegion");
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");

            connect.core.initCCP(containerDiv, {...params, secondaryCCPUrl: undefined});

            assert.isFalse(connect.globalResiliency._switchActiveRegion.called);
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);
            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(containerDiv.appendChild.calledOnce);
        });
    
        it("CCP Global Resiliency initialization with missing login CCP URL - leads to normal CCP init", function () {
            sandbox.resetHistory();
            sandbox.stub(connect.globalResiliency, "_switchActiveRegion");
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");

            connect.core.initCCP
            (containerDiv, {...params, loginUrl: undefined});

            assert.isFalse(connect.globalResiliency._switchActiveRegion.called);
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(containerDiv.appendChild.calledOnce);
        });

        it("CCP Global Resiliency initialization with missing enableGlobalResiliency CCP URL - leads to normal CCP init", function () {
            sandbox.resetHistory();
            sandbox.stub(connect.globalResiliency, "_switchActiveRegion");
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");

            connect.core.initCCP(containerDiv, {...params, enableGlobalResiliency: undefined});

            assert.isFalse(connect.globalResiliency._switchActiveRegion.called);
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(containerDiv.appendChild.calledOnce);
        });

        it("CCP Global Resiliency initialization with false enableGlobalResiliency CCP URL - leads to normal CCP init", function () {
            sandbox.resetHistory();
            sandbox.stub(connect.globalResiliency, "_switchActiveRegion");
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");


            connect.core.initCCP(containerDiv, {...params, enableGlobalResiliency: false});

            assert.isFalse(connect.globalResiliency._switchActiveRegion.called);
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            expect(params.ccpUrl).not.to.be.a("null");
            expect(containerDiv).not.to.be.a("null");
            assert.isTrue(connect.core.checkNotInitialized.called);
            assert.isTrue(document.createElement.calledOnce);
            assert.isTrue(containerDiv.appendChild.calledOnce);
        });

        it("Two CCP iframes are created.", function () {
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
            sandbox.stub(connect, "MediaFactory");
            sandbox.stub(connect.core.AgentDataProvider.prototype, "_fireAgentUpdateEvents");
            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
            sandbox.stub(connect.Conduit.prototype, 'sendDownstream');
            connect.core.checkNotInitialized.restore();

            connect.core.initCCP(containerDiv, params);

            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isTrue(document.createElement.calledTwice);
            assert.isTrue(containerDiv.appendChild.calledTwice);
        });

        it("Check conduit settings", function () {
            const fakeIframe = { isIframe: true };
            const fakeActiveConduit = { keepalivemanager: 0, sendUpstream: sinon.stub(), onUpstream: sinon.stub(), iframe: fakeIframe };
            const fakeInactiveConduit = { keepalivemanager: 0, sendUpstream: sinon.stub(), onUpstream: sinon.stub(), iframe: fakeIframe };
            const fakeGrProxyConduit = { 
                setActiveConduit: sinon.stub(),
                getActiveConduit: sinon.stub().returns(fakeActiveConduit),
                getInactiveConduit: sinon.stub().returns(fakeInactiveConduit),
                getAllConduits: sinon.stub().returns([fakeActiveConduit, fakeInactiveConduit]),
                onUpstream: sinon.stub(),
                onAllUpstream: sinon.stub(),
                relayUpstream: sinon.stub()
            };

            sandbox.stub(connect, "GRProxyIframeConduit").returns(fakeGrProxyConduit);
            
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
            sandbox.stub(connect, "MediaFactory");
            sandbox.stub(connect.core, "_sendIframeStyleDataUpstreamAfterReasonableWaitTime");
            sandbox.stub(connect.core.AgentDataProvider.prototype, "_fireAgentUpdateEvents");
            // sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
            // sandbox.stub(connect.Conduit.prototype, 'sendDownstream');
            sandbox.stub(connect.getLog(), 'scheduleUpstreamOuterContextCCPLogsPush');
            sandbox.stub(connect.getLog(), 'scheduleUpstreamOuterContextCCPserverBoundLogsPush');
            connect.core.checkNotInitialized.restore();

            connect.core.initCCP(containerDiv, params);

            sinon.assert.calledWithExactly(connect.publishMetric, { name: 'InitGlobalResiliencyCCPCalled', data: { count: 1 } })

            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isTrue(document.createElement.calledTwice);
            assert.isTrue(containerDiv.appendChild.calledTwice);

            //TODO: Check conduit functions called with expected 
            assert.isTrue(connect.core.upstream === fakeGrProxyConduit);
            sinon.assert.calledWithExactly(connect.globalResiliency._initializeActiveRegion, fakeGrProxyConduit);
            assert.isTrue(!!connect.core.eventBus);
            assert.isTrue(!!connect.core.agentDataProvider);
            assert.isTrue(!!connect.core.mediaFactory);
            assert.isTrue(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime.calledTwice);
            sinon.assert.calledWithExactly(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime, fakeIframe, fakeActiveConduit);
            sinon.assert.calledWithExactly(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime, fakeIframe, fakeInactiveConduit);
            assert.isTrue(!!connect.core.webSocketProvider);
            // sinon.assert.calledTwice(connect.core.getEventBus().bridge());
            assert.isTrue(!!fakeActiveConduit.keepaliveManager);
            assert.isTrue(!!fakeInactiveConduit.keepaliveManager);
            sinon.assert.calledWithExactly(connect.getLog().scheduleUpstreamOuterContextCCPLogsPush, fakeGrProxyConduit);
            sinon.assert.calledWithExactly(connect.getLog().scheduleUpstreamOuterContextCCPserverBoundLogsPush, fakeGrProxyConduit);
            
            sinon.assert.calledWith(fakeActiveConduit.onUpstream, connect.EventType.ACKNOWLEDGE);
            sinon.assert.calledWith(fakeInactiveConduit.onUpstream, connect.EventType.ACKNOWLEDGE);

            sinon.assert.calledWith(fakeGrProxyConduit.onUpstream, connect.EventType.LOG);

            sinon.assert.calledWith(fakeActiveConduit.onUpstream, connect.GlobalResiliencyEvents.INIT);
            sinon.assert.calledWith(fakeInactiveConduit.onUpstream, connect.GlobalResiliencyEvents.INIT);

            sinon.assert.calledWith(fakeActiveConduit.onUpstream, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);
            sinon.assert.calledWith(fakeInactiveConduit.onUpstream, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);

            sinon.assert.calledWith(fakeGrProxyConduit.onUpstream, connect.EventType.UPDATE_CONNECTED_CCPS);

            sinon.assert.calledWith(fakeActiveConduit.onUpstream, connect.VoiceIdEvents.UPDATE_DOMAIN_ID);
            sinon.assert.calledWith(fakeInactiveConduit.onUpstream, connect.VoiceIdEvents.UPDATE_DOMAIN_ID);

            assert.isTrue(!!connect.core.softphoneParams);
            assert.isTrue(connect.core.softphoneParams.ringtoneUrl === fakeRingtoneUrl);

            sinon.assert.calledWith(fakeActiveConduit.onUpstream, connect.GlobalResiliencyEvents.FAILOVER_PENDING);
            sinon.assert.calledWith(fakeInactiveConduit.onUpstream, connect.GlobalResiliencyEvents.FAILOVER_PENDING);

            sinon.assert.calledWith(fakeGrProxyConduit.relayUpstream, connect.GlobalResiliencyEvents.FAILOVER_PENDING);
            sinon.assert.calledWith(fakeGrProxyConduit.relayUpstream, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);
            sinon.assert.calledWith(fakeGrProxyConduit.relayUpstream, connect.GlobalResiliencyEvents.FAILOVER_COMPLETE);
            sinon.assert.calledWith(fakeGrProxyConduit.relayUpstream, connect.GlobalResiliencyEvents.HEARTBEAT_SYN);
            sinon.assert.calledWith(fakeGrProxyConduit.relayUpstream, connect.GlobalResiliencyEvents.HEARTBEAT_ACK);
        });

        it("Multiple calls to initCCP does not append multiple CCP iframes", function () {
            sandbox.stub(connect, "MediaFactory");
            sandbox.stub(connect.core.AgentDataProvider.prototype, "_fireAgentUpdateEvents");
            sandbox.stub(connect.Conduit.prototype, 'sendUpstream').returns(null);
            sandbox.stub(connect.Conduit.prototype, 'sendDownstream');
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
            connect.core.checkNotInitialized.restore();

            connect.core.initCCP(containerDiv, params);
            // The iframe is created, but window.document.getElementsByTagName will not show them because they
            // don't actually exist on a real page.
            sandbox.stub(connect.core, '_getCCPIframe').returns(true);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);
            connect.core.initCCP(containerDiv, params);

            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isTrue(document.createElement.calledTwice);
            assert.isTrue(containerDiv.appendChild.calledTwice);
        });

        it("Initialize region", function () {
            const fakeGrProxyConduit = { 
             setActiveConduit: sinon.stub(),
             getActiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
             getInactiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
            };
            connect.ChatSession = { setRegionOverride: sinon.stub() }

            const region = 'us-east-1';

            const oldClient = connect.core.client;
            const oldMasterClient = connect.core.masterClient;

            connect.core.keepaliveManager = null;
            connect.core.client = null;
            connect.core.masterClient = null;
            connect.core.agentDataProvider = null;
            connect.core.mediaFactory = null;

            connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, region);

            const checkClient = connect.core.client;
            const checkMasterClient = connect.core.masterClient;

            // Need to reset these or softphone unit test will fail due to missing client
            connect.core.masterClient = oldMasterClient;
            connect.core.client = oldClient;

            assert.isTrue(connect.core.keepaliveManager !== null);
            assert.isTrue(checkClient !== null);
            assert.isTrue(checkMasterClient !== null);
            assert.isTrue(connect.core.agentDataProvider !== null);
            sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);
            assert.isTrue(connect.core.mediaFactory !== null);

            assert.isTrue(connect.core._showIframe.calledOnce);
            assert.isTrue(connect.core._hideIframe.calledOnce);
 
            assert.isTrue(connect.globalResiliency._activeRegion === region);
            sinon.assert.calledWithExactly(connect.ChatSession.setRegionOverride, region);

            sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'active'});
            sinon.assert.calledWithExactly(fakeGrProxyConduit.getInactiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'inactive'}); 
        });

        it("Initialize region without region param", function () {
            const fakeGrProxyConduit = { 
             setActiveConduit: sinon.stub(),
             getActiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
             getInactiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
            };
            connect.ChatSession = { setRegionOverride: sinon.stub() }

            const region = 'us-east-1';

            const oldClient = connect.core.client;
            const oldMasterClient = connect.core.masterClient;

            connect.core.keepaliveManager = null;
            connect.core.client = null;
            connect.core.masterClient = null;
            connect.core.agentDataProvider = null;
            connect.core.mediaFactory = null;

            connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit);

            const checkClient = connect.core.client;
            const checkMasterClient = connect.core.masterClient;

            // Need to reset these or softphone unit test will fail due to missing client
            connect.core.masterClient = oldMasterClient;
            connect.core.client = oldClient;

            assert.isTrue(connect.core.keepaliveManager !== null);
            assert.isTrue(checkClient !== null);
            assert.isTrue(checkMasterClient !== null);
            assert.isTrue(connect.core.agentDataProvider !== null);
            sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);
            assert.isTrue(connect.core.mediaFactory !== null);

            assert.isTrue(connect.core._showIframe.calledOnce);
            assert.isTrue(connect.core._hideIframe.calledOnce);
 
            assert.isTrue(connect.globalResiliency._activeRegion !== region);
            assert.isTrue(connect.ChatSession.setRegionOverride.notCalled);

            sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'active'});
            sinon.assert.calledWithExactly(fakeGrProxyConduit.getInactiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'inactive'}); 
        });

        it("Switch active region", function () {
           var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
           grProxyConduit.setActiveConduit = sinon.stub();
           grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
           grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });

           sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");

           let didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);

           sinon.assert.calledWithExactly(connect.publishMetric, {
            name: 'CalledInternalSwitchActiveRegionSuccessful',
            data: { count: 1 }
           })

           assert.isTrue(grProxyConduit.setActiveConduit.calledOnce);
           sinon.assert.calledWithExactly(grProxyConduit.setActiveConduit, grProxyConduit.conduits[1].name);
           assert.isTrue(didSwitch);

           assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
        });

        it("Switch active region only triggers once", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub(), name: grProxyConduit.conduits[0].name });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });

            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
            connect.globalResiliency._activeRegion = null;
            grProxyConduit.conduits[0].region = 'us-west-2';
            grProxyConduit.conduits[1].region = 'us-east-1';
 
            let didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
            connect.globalResiliency._activeRegion = grProxyConduit.conduits[0].region; // init active region sets this but is being mocked
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isTrue(didSwitch)

            didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isFalse(didSwitch);

            didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isFalse(didSwitch);

            didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isFalse(didSwitch);

            didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);
            assert.isFalse(didSwitch);
 
            assert.isTrue(grProxyConduit.setActiveConduit.called);
            sinon.assert.calledWithExactly(grProxyConduit.setActiveConduit, grProxyConduit.conduits[0].name);
            assert.isFalse(didSwitch);
 
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);

            sinon.assert.calledWithExactly(connect.publishMetric, {
                name: 'CalledInternalSwitchActiveRegionSuccessful',
                data: { count: 1 }
            })
         });

        it("Switch active region, trying with another region", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub(), name: grProxyConduit.conduits[1].name });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });

            grProxyConduit.conduits[0].region = 'us-west-2';
            grProxyConduit.conduits[1].region = 'us-east-1';

            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");

            const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);
 
            assert.isTrue(grProxyConduit.setActiveConduit.calledOnce);
            sinon.assert.calledWithExactly(grProxyConduit.setActiveConduit, 'http://localhost2');
            assert.isTrue(didSwitch)
 
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);

            sinon.assert.calledWithExactly(connect.publishMetric, {
                name: 'CalledInternalSwitchActiveRegionSuccessful',
                data: { count: 1 }
            })
         });

         it("Switch active region without region param", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub(), name: grProxyConduit.conduits[1].name });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });

            const iframesource = 'iframesource';
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
 
            const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);
            assert.isTrue(grProxyConduit.setActiveConduit.calledOnce);
            sinon.assert.calledWithExactly(grProxyConduit.setActiveConduit, 'http://localhost2');
            assert.isTrue(didSwitch);
 
            assert.isTrue(connect.globalResiliency._initializeActiveRegion.calledOnce);

            sinon.assert.calledWithExactly(connect.publishMetric, {
                name: 'CalledInternalSwitchActiveRegionSuccessful',
                data: { count: 1 }
            })
         });

         it("Switch active region does nothing if grproxyconduit invalid", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
 
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
 
            const didSwitch = connect.globalResiliency._switchActiveRegion({foo: 2}, grProxyConduit.conduits[1].name);
 
            assert.isFalse(grProxyConduit.setActiveConduit.calledOnce);
 
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            assert.isFalse(didSwitch);
         });

         it("Switch active region does nothing if conduit name is invalid", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, [primaryIframe, secondaryIframe], primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
 
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
 
            const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, "foo");
 
            assert.isFalse(grProxyConduit.setActiveConduit.calledOnce);
 
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            assert.isFalse(didSwitch);
         });
    });
});
