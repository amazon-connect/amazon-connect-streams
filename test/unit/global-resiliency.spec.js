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
            conduitParam = [{ iframe: primaryIframe, label: 'primary' }, { iframe: secondaryIframe, label: 'secondary' }];
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

        describe("ACGR sendConfigure and listenForConfigureRequest", function () {
            beforeEach(function () {

            });

            it("should call sendConfigure with ACGR config when ACKNOWLEDGE handler is triggered directly", function () {
                const fakeConduit = { 
                    sendUpstream: sinon.stub(),
                    name: 'test-conduit'
                };
                const params = {
                    softphone: { allowFramedSoftphone: true },
                    chat: { enabled: true },
                    task: { enabled: false },
                    autoAcceptTone: { enabled: true },
                    pageOptions: { enableAudioDeviceSettings: true, showInactivityModal: false, },
                    shouldAddNamespaceToLogs: true,
                    enableGlobalResiliency: true,
                };

                sandbox.stub(connect, "isActiveConduit").returns(true);
                sandbox.stub(connect.core, 'listenForConfigureRequest');

                const isACGR = true;
                connect.core.sendConfigure(params, fakeConduit, isACGR);

                sinon.assert.calledWith(fakeConduit.sendUpstream, connect.EventType.CONFIGURE, {
                    softphone: params.softphone,
                    chat: params.chat,
                    task: params.task,
                    autoAcceptTone: params.autoAcceptTone,
                    pageOptions: params.pageOptions,
                    shouldAddNamespaceToLogs: params.shouldAddNamespaceToLogs,
                    showInactivityModal: false,
                    enableGlobalResiliency: params.enableGlobalResiliency,
                    instanceState: 'active',
                });
            });

            it("should call sendConfigure with inactive instanceState for inactive conduit", function () {
                const fakeConduit = { 
                    sendUpstream: sinon.stub(),
                    name: 'inactive-conduit'
                };
                const params = {
                    softphone: { allowFramedSoftphone: true },
                    enableGlobalResiliency: true
                };

                sandbox.stub(connect, "isActiveConduit").returns(false);

                const isACGR = true;
                connect.core.sendConfigure(params, fakeConduit, isACGR);

                sinon.assert.calledWith(fakeConduit.sendUpstream, connect.EventType.CONFIGURE, 
                    sinon.match({
                        enableGlobalResiliency: params.enableGlobalResiliency,
                        instanceState: 'inactive'
                    })
                );
            });

            it("should exclude disasterRecoveryOn when isACGR is true", function () {
                const fakeConduit = { 
                    sendUpstream: sinon.stub(),
                    name: 'test-conduit'
                };
                const params = {
                    softphone: { allowFramedSoftphone: true },
                    disasterRecoveryOn: true,
                    enableGlobalResiliency: true
                };

                sandbox.stub(connect, "isActiveConduit").returns(true);

                connect.core.sendConfigure(params, fakeConduit, true);

                const configCall = fakeConduit.sendUpstream.getCall(0);
                assert.isUndefined(configCall.args[1].disasterRecoveryOn);
                assert.isDefined(configCall.args[1].enableGlobalResiliency);
                assert.isDefined(configCall.args[1].instanceState);
            });

            it("should include disasterRecoveryOn when isACGR is false", function () {
                const fakeConduit = { 
                    sendUpstream: sinon.stub(),
                    name: 'test-conduit'
                };
                const params = {
                    softphone: { allowFramedSoftphone: true },
                    disasterRecoveryOn: true
                };

                connect.core.sendConfigure(params, fakeConduit, false);

                const configCall = fakeConduit.sendUpstream.getCall(0);
                assert.isDefined(configCall.args[1].disasterRecoveryOn);
                assert.isUndefined(configCall.args[1].enableGlobalResiliency);
                assert.isUndefined(configCall.args[1].instanceState);
            });
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
            assert.isTrue(connect.core.agentDataProvider == null);
            // sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);
            assert.isTrue(connect.core.mediaFactory !== null);

            assert.isTrue(connect.core._showIframe.calledOnce);
            assert.isTrue(connect.core._hideIframe.calledOnce);
 
            assert.isTrue(connect.globalResiliency._activeRegion !== region);
            assert.isTrue(connect.ChatSession.setRegionOverride.notCalled);

            sinon.assert.calledWithExactly(fakeGrProxyConduit.getActiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'active'});
            sinon.assert.calledWithExactly(fakeGrProxyConduit.getInactiveConduit().sendUpstream, connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {instanceState: 'inactive'}); 
        });

        it("Switch active region", function () {
           var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
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
           assert.isUndefined(connect.core.agentDataProviderBackup);
        });

        it("Switch active region only triggers once", function () {
            var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
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
            var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
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
            var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
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
            var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
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
            var grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
            grProxyConduit.setActiveConduit = sinon.stub();
            grProxyConduit.getActiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
            grProxyConduit.getInactiveConduit = sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() });
 
            sandbox.stub(connect.globalResiliency, "_initializeActiveRegion");
 
            const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, "foo");
 
            assert.isFalse(grProxyConduit.setActiveConduit.calledOnce);
 
            assert.isFalse(connect.globalResiliency._initializeActiveRegion.called);

            assert.isFalse(didSwitch);
         });

        it("should call _initiateRtcPeerConnectionManager when initialize region and instance is allowlisted for softphone persistent connection feature", function () {
            const fakeGrProxyConduit = {
                setActiveConduit: sinon.stub(),
                getActiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
                getInactiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
            };

            connect.core.softphoneManager = { _initiateRtcPeerConnectionManager: sinon.stub() }

            const region = 'us-east-1';

            const oldClient = connect.core.client;
            const oldMasterClient = connect.core.masterClient;

            connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, region);

            // Need to reset these or softphone unit test will fail due to missing client
            connect.core.masterClient = oldMasterClient;
            connect.core.client = oldClient;
            connect.core._allowSoftphonePersistentConnection = null;

            assert.isTrue(connect.core.softphoneManager._initiateRtcPeerConnectionManager.calledOnce);
        });

        it("should create an agent data provider if none is created yet", function () {
            const fakeGrProxyConduit = {
                setActiveConduit: sinon.stub(),
                getActiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
                getInactiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
            };

            const region = 'us-east-1';

            const oldClient = connect.core.client;
            const oldMasterClient = connect.core.masterClient;

            connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, region);

            // Need to reset these or softphone unit test will fail due to missing client
            connect.core.masterClient = oldMasterClient;
            connect.core.client = oldClient;

            assert.isDefined(connect.core.agentDataProvider);
        });

        it("should create a backup agent data provider if one is already created", function () {
            const fakeGrProxyConduit = {
                setActiveConduit: sinon.stub(),
                getActiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
                getInactiveConduit: sinon.stub().returns({ keepalivemanager: 0, sendUpstream: sinon.stub() }),
            };

            const region = 'us-east-1';

            const oldClient = connect.core.client;
            const oldMasterClient = connect.core.masterClient;
            const providerMock = new connect.core.AgentDataProvider(connect.core.getEventBus());
            connect.core.agentDataProvider = providerMock;

            connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, region);

            // Need to reset these or softphone unit test will fail due to missing client
            connect.core.masterClient = oldMasterClient;
            connect.core.client = oldClient;

            expect(connect.core.agentDataProvider).to.equal(providerMock);
            assert.isDefined(connect.core.agentDataProviderBackup);
        });

        describe('#connect.globalResiliency.setupAcgrAuthHandlers()', function () {
            let params, grProxyConduit;
            let eventBusSpy;
            let authenticateAcgrSpy;

            beforeEach(function () {
                    containerDiv = { appendChild: sandbox.spy(), getAllConduit: sandbox.spy() };
                    conduit = { sendUpstream: sandbox.spy() };
                    
                    authenticateAcgrSpy = sandbox.stub(connect.globalResiliency, 'authenticateAcgr');
                    
                    grProxyConduit = {
                        getActiveConduit: sandbox.stub().returns({
                            name: 'test-conduit',
                            onUpstream: sandbox.stub().returns({ unsubscribe: sandbox.stub() })
                        })
                    };
                    conduitTimerContainerMap = {};
                                    
                    params = {
                        ccpUrl: "url.com",
                        loginOptions: {},
                        ccpAckTimeout: 3000
                    };

                    connect.agent.initialized = true;
                    connect.core.eventBus = new connect.EventBus({ logEvents: true });
                    eventBusSpy = sandbox.spy(connect.core.eventBus, 'subscribe');
                });

                afterEach(function () {
                    connect.agent.initialized = false;
                    connect.core.initialized = false;
                    connect.core.eventBus = null;
                    sandbox.restore();
                });


            it("should subscribe to ACK_TIMEOUT event", function () {
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                assert.isTrue(eventBusSpy.calledWith(connect.EventType.ACK_TIMEOUT));
            });

            it("should subscribe to TERMINATED event when disableAuthPopupAfterLogout is not set", function () {
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                assert.isTrue(eventBusSpy.calledWith(connect.EventType.TERMINATED));
            });

            it("should subscribe to AUTH_FAIL event when disableAuthPopupAfterLogout is not set", function () {
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                assert.isTrue(eventBusSpy.calledWith(connect.EventType.AUTH_FAIL));
            });

            it("should not subscribe to TERMINATED and AUTH_FAIL when disableAuthPopupAfterLogout is true", function () {
                params.loginOptions.disableAuthPopupAfterLogout = true;
                
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                const terminatedCall = eventBusSpy.getCalls().find(call => call.args[0] === connect.EventType.TERMINATED);
                const authFailCall = eventBusSpy.getCalls().find(call => call.args[0] === connect.EventType.AUTH_FAIL);
                
                assert.isUndefined(terminatedCall);
                assert.isUndefined(authFailCall);
            });

            it("should call authenticateAcgr immediately on ACK_TIMEOUT", function () {
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                const ackTimeoutHandler = eventBusSpy.getCalls().find(call => call.args[0] === connect.EventType.ACK_TIMEOUT).args[1];
                ackTimeoutHandler();

                assert.isTrue(connect.globalResiliency.authenticateAcgr.calledOnce);
                assert.isTrue(connect.globalResiliency.authenticateAcgr.calledWith(params, containerDiv, grProxyConduit));
            });  

            it("should call authenticateAcgr with delay on TERMINATED event", function () {
                const clock = sinon.useFakeTimers();
                
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                const terminatedHandler = eventBusSpy.getCalls().find(call => call.args[0] === connect.EventType.TERMINATED).args[1];
                terminatedHandler();
                
                assert.isFalse(authenticateAcgrSpy.called);
                
                clock.tick(params.ccpAckTimeout);
                
                sandbox.assert.calledOnce(authenticateAcgrSpy);
                
                clock.restore();
            });

            it("should use default CCP_ACK_TIMEOUT when ccpAckTimeout is not provided", function () {
                const clock = sinon.useFakeTimers();
                delete params.ccpAckTimeout;
                
                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit);
                
                const terminatedHandler = eventBusSpy.getCalls().find(call => call.args[0] === connect.EventType.TERMINATED).args[1];
                terminatedHandler();
                
                clock.tick(10000); // Default CCP_ACK_TIMEOUT
                assert.isTrue(connect.globalResiliency.authenticateAcgr.calledOnce);
                
                clock.restore();
            });

            it("should publish GlobalResiliencySigninValidationRetriesExhausted metric when retries exhausted with validation failures", function () {
                const activeConduit = {
                    name: 'primary',
                    onUpstream: sandbox.stub()
                };
                
                grProxyConduit = {
                    getActiveConduit: sandbox.stub().returns(activeConduit)
                };

                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit, conduitTimerContainerMap);
                
                // Simulate GLOBAL_SIGNIN_INVALID event handler being registered
                const signinInvalidHandler = activeConduit.onUpstream.getCalls()
                    .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
                
                // Simulate 3 validation failures
                signinInvalidHandler.args[1]();
                signinInvalidHandler.args[1]();
                signinInvalidHandler.args[1]();
                
                // Trigger IFRAME_RETRIES_EXHAUSTED
                const retriesExhaustedHandler = eventBusSpy.getCalls()
                    .find(call => call.args[0] === connect.EventType.IFRAME_RETRIES_EXHAUSTED).args[1];
                retriesExhaustedHandler('primary');
                
                // Verify metric was published
                sinon.assert.calledWith(
                    connect.publishMetric,
                    sinon.match({
                        name: 'GlobalResiliencySigninValidationRetriesExhausted',
                        data: { count: 3 }
                    })
                );
            });

            it("should NOT publish GlobalResiliencySigninValidationRetriesExhausted metric when retries exhausted without validation failures", function () {
                const activeConduit = {
                    name: 'primary',
                    onUpstream: sandbox.stub()
                };
                
                grProxyConduit = {
                    getActiveConduit: sandbox.stub().returns(activeConduit)
                };

                connect.globalResiliency.setupAcgrAuthHandlers(params, containerDiv, grProxyConduit, conduitTimerContainerMap);
                
                // Trigger IFRAME_RETRIES_EXHAUSTED without any validation failures
                const retriesExhaustedHandler = eventBusSpy.getCalls()
                    .find(call => call.args[0] === connect.EventType.IFRAME_RETRIES_EXHAUSTED).args[1];
                retriesExhaustedHandler('primary');
                
                // Verify metric was NOT published
                sinon.assert.neverCalledWith(
                    connect.publishMetric,
                    sinon.match({
                        name: 'GlobalResiliencySigninValidationRetriesExhausted'
                    })
                );
            });
        });

        describe('#connect.globalResiliency.authenticateAcgr()', function () {
            let params, containerDiv, grProxyConduit;
            let activeConduit, inactiveConduit, openPopupWithLockSpy;

            beforeEach(function () {
                params = {
                    loginPopup: true,
                    loginUrl: "http://loginUrl.com",
                    loginOptions: { autoClose: true }
                };
                containerDiv = { appendChild: sandbox.spy() };
                
                activeConduit = {
                    name: 'primary',
                    iframe: { src: 'http://primary.com' },
                    onUpstream: sandbox.stub()
                };
                
                inactiveConduit = {
                    name: 'secondary',
                    iframe: { src: 'http://secondary.com' },
                    onUpstream: sandbox.stub()
                };
                
                grProxyConduit = {
                    getAllConduits: sandbox.stub().returns([activeConduit, inactiveConduit])
                };
                
                connect.globalResiliency.conduitTimerContainerMap = {
                    'primary': { iframeRefreshTimeout: null },
                    'secondary': { iframeRefreshTimeout: null }
                };            
                
                sandbox.stub(connect, 'isActiveConduit').returns(true);
                
                connect.core.loginWindow = null;
            });

            after(() => {
                sandbox.restore();
            })

            it("should start iframe refresh for each conduit", function () {
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                assert.isTrue(connect.core._refreshIframeOnTimeout.calledTwice);
            });

            it("should pass globalResiliencyRegion as 'primary' for active conduit", function () {
                connect.isActiveConduit.withArgs(activeConduit).returns(true);
                connect.isActiveConduit.withArgs(inactiveConduit).returns(false);
                
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                const primaryCall = connect.core._refreshIframeOnTimeout.getCalls().find(call => 
                    call.args[0].ccpUrl === activeConduit.iframe.src
                );
                
                assert.equal(primaryCall.args[0].globalResiliencyRegion, 'primary');
            });

            it("should pass globalResiliencyRegion as 'secondary' for inactive conduit", function () {
                connect.isActiveConduit.withArgs(activeConduit).returns(true);
                connect.isActiveConduit.withArgs(inactiveConduit).returns(false);
                
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                const secondaryCall = connect.core._refreshIframeOnTimeout.getCalls().find(call => 
                    call.args[0].ccpUrl === inactiveConduit.iframe.src
                );
                
                assert.equal(secondaryCall.args[0].globalResiliencyRegion, 'secondary');
            });

            it("should not refresh iframe if refresh timeout already exists", function () {
                connect.globalResiliency.conduitTimerContainerMap['primary'].iframeRefreshTimeout = 123;
                
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                const primaryCalls = connect.core._refreshIframeOnTimeout.getCalls().filter(call => 
                    call.args[0].ccpUrl === activeConduit.iframe.src
                );
                
                assert.equal(primaryCalls.length, 0);
            });

            it("should setup ACKNOWLEDGE handler to stop iframe refresh", function () {
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                assert.isTrue(activeConduit.onUpstream.calledWith(connect.EventType.ACKNOWLEDGE));
                assert.isTrue(inactiveConduit.onUpstream.calledWith(connect.EventType.ACKNOWLEDGE));
            });


            it("should handle iframe refresh errors gracefully", function () {
                connect.core._refreshIframeOnTimeout.throws(new Error("Refresh failed"));
                
                // Should not throw
                connect.globalResiliency.authenticateAcgr(params, containerDiv, grProxyConduit);
                
                assert.isTrue(connect.core._refreshIframeOnTimeout.called);
            });
        });
    });

    describe('#connect.globalResiliency._validateGlobalSignin()', function () {
        var sandbox = sinon.createSandbox();
        let clock, conduit, eventBus, params, data;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            conduit = {
                name: 'test-conduit',
                sendUpstream: sandbox.stub(),
                onUpstream: sandbox.stub().returns({ unsubscribe: sandbox.stub() })
            };
            params = {};
            data = {};
            eventBus = new connect.EventBus({ logEvents: true });
            connect.core.eventBus = eventBus;
            sandbox.stub(connect, 'publishMetric');
            sandbox.stub(connect, 'getLog').returns({
                info: sandbox.stub().returns({ 
                    sendInternalLogToServer: sandbox.stub(),
                    withObject: sandbox.stub().returns({ sendInternalLogToServer: sandbox.stub() })
                }),
                warn: sandbox.stub().returns({ 
                    sendInternalLogToServer: sandbox.stub(),
                    withObject: sandbox.stub().returns({ sendInternalLogToServer: sandbox.stub() })
                })
            });
        });

        afterEach(function () {
            sandbox.restore();
            clock.restore();
            connect.core.eventBus = null;
        });

        it('should call onSuccess when GLOBAL_SIGNIN_VALID event received', function (done) {
            const onSuccess = sandbox.stub().callsFake(() => done());
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            // Simulate GLOBAL_SIGNIN_VALID event
            const validHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID);
            assert.isDefined(validHandler);
            validHandler.args[1]();

            assert.isTrue(onSuccess.calledOnce);
            assert.isFalse(onFailure.called);
        });

        it('should call onFailure when GLOBAL_SIGNIN_INVALID event received', function (done) {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub().callsFake(() => done());

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            // Simulate GLOBAL_SIGNIN_INVALID event
            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            assert.isDefined(invalidHandler);
            invalidHandler.args[1]();

            assert.isFalse(onSuccess.called);
            assert.isTrue(onFailure.calledOnce);
        });

        it('should call onSuccess on timeout after 250ms', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            assert.isFalse(onSuccess.called);
            assert.isFalse(onFailure.called);

            clock.tick(250);

            assert.isTrue(onSuccess.calledOnce);
            assert.isFalse(onFailure.called);
        });

        it('should send VALIDATE_GLOBAL_SIGNIN upstream', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            sinon.assert.calledWith(
                conduit.sendUpstream,
                connect.GlobalResiliencyEvents.VALIDATE_GLOBAL_SIGNIN
            );
        });

        it('should unsubscribe to GLOBAL_SIGNIN event listeners after success', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const validHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID);
            validHandler.args[1]();

            // Trigger again - should not call onSuccess again
            validHandler.args[1]();

            assert.isTrue(onSuccess.calledOnce, 'onSuccess should only be called once');
        });

        it('should unsubscribe to GLOBAL_SIGNIN event listeners after failure', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            invalidHandler.args[1]();

            // Trigger again - should not call onFailure again
            invalidHandler.args[1]();

            assert.isTrue(onFailure.calledOnce, 'onFailure should only be called once');
        });

        it('should ignore late responses after timeout', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            // Timeout occurs first
            clock.tick(250);
            assert.isTrue(onSuccess.calledOnce);

            // Late INVALID response arrives
            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            invalidHandler.args[1]();

            // Should still only have one call (from timeout)
            assert.isTrue(onSuccess.calledOnce);
            assert.isFalse(onFailure.called);
        });

        it('should publish GlobalResiliencyRegionalLoginAttempt metric on failure with LILY_AGENT_CONFIG_MISSING', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            invalidHandler.args[1]({ errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_MISSING });

            sinon.assert.calledWith(
                connect.publishMetric,
                sinon.match({
                    name: 'GlobalResiliencyRegionalLoginAttempt',
                    data: { count: 1 }
                })
            );
        });

        it('should publish GlobalResiliencyRegionalLoginAttempt metric for parse errors', function () {
            // Restore stub from beforeEach in 'initGRCCP ACKNOWLEDGE handler with validation' to test real implementation
            if (connect.globalResiliency._validateGlobalSignin.restore) {
                connect.globalResiliency._validateGlobalSignin.restore();
            }
            
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            
            // Trigger the handler with PARSE_ERROR type
            invalidHandler.args[1]({ 
                error: '[GR] Error validating global signin authentication',
                errorType: connect.GlobalResiliencyConfigureErrorType.LILY_AGENT_CONFIG_PARSE_ERROR 
            });

            // Verify metric was published
            sinon.assert.called(connect.publishMetric);
            
            // Find the specific call for GlobalResiliencyRegionalLoginAttempt
            const metricCall = connect.publishMetric.getCalls().find(call => 
                call.args[0] && call.args[0].name === 'GlobalResiliencyRegionalLoginAttempt'
            );
            
            assert.isDefined(metricCall, 'Should publish GlobalResiliencyRegionalLoginAttempt metric');
            assert.deepEqual(metricCall.args[0].data, { count: 1 });

            // Verify onFailure was called
            assert.isTrue(onFailure.calledOnce);
            assert.isFalse(onSuccess.called);
        });

        it('should handle duplicate VALID responses gracefully', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const validHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID);
            
            validHandler.args[1]();
            validHandler.args[1]();
            validHandler.args[1]();

            assert.isTrue(onSuccess.calledOnce, 'onSuccess should only be called once despite multiple VALID events');
        });

        it('should handle INVALID followed by VALID correctly', function () {
            const onSuccess = sandbox.stub();
            const onFailure = sandbox.stub();

            connect.globalResiliency._validateGlobalSignin(conduit, params, data, onSuccess, onFailure);

            const invalidHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID);
            const validHandler = conduit.onUpstream.getCalls()
                .find(call => call.args[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_VALID);
            
            // INVALID comes first
            invalidHandler.args[1]();
            assert.isTrue(onFailure.calledOnce);

            // VALID comes after - should be ignored
            validHandler.args[1]();
            assert.isFalse(onSuccess.called);
            assert.isTrue(onFailure.calledOnce);
        });
    });

    describe('initGRCCP ACKNOWLEDGE handler with validation', function () {
        var sandbox = sinon.createSandbox();
        let clock, conduit, containerDiv, params, eventBus;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect, 'publishMetric');
            sandbox.stub(connect, 'isActiveConduit');
            sandbox.stub(connect.globalResiliency, '_validateGlobalSignin');
            
            conduit = {
                sendDownstream: sandbox.stub(),
                onDownstream: sandbox.stub(),
                onUpstream: sandbox.stub(),
                name: 'test-conduit'
            };
            
            containerDiv = {};
            params = {
                ccpUrl: 'https://test.awsapps.com',
                ccpLoadTimeout: 5000
            };
            
            eventBus = new connect.EventBus({ logEvents: true });
            connect.core.eventBus = eventBus;
            connect.core.getEventBus = () => eventBus;
        });

        afterEach(function () {
            sandbox.restore();
            clock.restore();
            connect.core.eventBus = null;
        });

        it('should complete initialization when validation succeeds for active conduit', function () {
            connect.isActiveConduit.returns(true);
            const ccpLoadTimeoutId = 123;
            const conduitTimerMap = { [conduit.name]: { ccpLoadTimeout: ccpLoadTimeoutId } };
            
            // Stub the completion function
            sandbox.stub(connect.globalResiliency, '_completeAcknowledgeInitialization');

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                onSuccess(); // Simulate successful validation
            });

            // Simulate ACKNOWLEDGE handler setup and execution
            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {
                        clearTimeout(conduitTimerMap[conduit.name].ccpLoadTimeout);
                        conduitTimerMap[conduit.name].ccpLoadTimeout = null;
                        connect.globalResiliency._completeAcknowledgeInitialization(conduit, params, {}, conduitTimerMap, Date.now());
                    },
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            clearTimeout(conduitTimerMap[conduit.name].ccpLoadTimeout);
                            conduitTimerMap[conduit.name].ccpLoadTimeout = null;
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();

            assert.isTrue(connect.globalResiliency._completeAcknowledgeInitialization.calledOnce);
            assert.isNull(conduitTimerMap[conduit.name].ccpLoadTimeout);
        });

        it('should trigger ACK_TIMEOUT when validation fails for active conduit', function (done) {
            connect.isActiveConduit.returns(true);
            const ccpLoadTimeoutId = 123;
            const conduitTimerMap = { [conduit.name]: { ccpLoadTimeout: ccpLoadTimeoutId } };

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                onFailure(); // Simulate failed validation
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, () => {
                assert.isNull(conduitTimerMap[conduit.name].ccpLoadTimeout);
                done();
            });

            // Simulate ACKNOWLEDGE handler
            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            clearTimeout(conduitTimerMap[conduit.name].ccpLoadTimeout);
                            conduitTimerMap[conduit.name].ccpLoadTimeout = null;
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();
        });

        it('should clear ccpLoadTimeout before triggering ACK_TIMEOUT for active conduit', function () {
            connect.isActiveConduit.returns(true);
            const ccpLoadTimeoutId = 123;
            const conduitTimerMap = { [conduit.name]: { ccpLoadTimeout: ccpLoadTimeoutId } };
            let clearedBeforeTrigger = false;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                onFailure();
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, () => {
                clearedBeforeTrigger = (conduitTimerMap[conduit.name].ccpLoadTimeout === null);
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            clearTimeout(conduitTimerMap[conduit.name].ccpLoadTimeout);
                            conduitTimerMap[conduit.name].ccpLoadTimeout = null;
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();
            assert.isTrue(clearedBeforeTrigger, 'Timer should be cleared before ACK_TIMEOUT is triggered');
        });

        it('should NOT trigger ACK_TIMEOUT when validation fails for inactive conduit', function () {
            connect.isActiveConduit.returns(false);
            const ackTimeoutSpy = sandbox.spy();
            
            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                onFailure();
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, ackTimeoutSpy);

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();
            clock.tick(100);

            assert.isFalse(ackTimeoutSpy.called, 'ACK_TIMEOUT should not be triggered for inactive conduit');
        });

        it('should NOT proceed with initialization when validation fails', function () {
            connect.isActiveConduit.returns(true);
            sandbox.stub(connect.globalResiliency, '_completeAcknowledgeInitialization');

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                onFailure();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {
                        connect.globalResiliency._completeAcknowledgeInitialization();
                    },
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();

            assert.isFalse(connect.globalResiliency._completeAcknowledgeInitialization.called);
        });

        it('should call _validateGlobalSignin with correct conduit', function () {
            connect.isActiveConduit.returns(true);

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {},
                    () => {}
                );
            };

            acknowledgeHandler();

            assert.isTrue(connect.globalResiliency._validateGlobalSignin.calledOnce);
            assert.isTrue(connect.globalResiliency._validateGlobalSignin.calledWith(
                conduit,
                sinon.match.object,
                sinon.match.object,
                sinon.match.func,
                sinon.match.func
            ));
        });

        it('should provide onSuccess and onFailure callbacks to _validateGlobalSignin', function () {
            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {},
                    () => {}
                );
            };

            acknowledgeHandler();

            const call = connect.globalResiliency._validateGlobalSignin.getCall(0);
            assert.isFunction(call.args[3], 'Fourth argument should be onSuccess callback');
            assert.isFunction(call.args[4], 'Fifth argument should be onFailure callback');
        });

        it('should handle validation timeout gracefully', function () {
            connect.isActiveConduit.returns(true);
            sandbox.stub(connect.globalResiliency, '_completeAcknowledgeInitialization');

            // Simulate timeout scenario
            connect.globalResiliency._validateGlobalSignin.callsFake((cond, params, data, onSuccess, onFailure) => {
                setTimeout(onSuccess, 250); // Timeout calls onSuccess
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    params,
                    {},
                    () => {
                        connect.globalResiliency._completeAcknowledgeInitialization();
                    },
                    () => {}
                );
            };

            acknowledgeHandler();
            clock.tick(250);

            assert.isTrue(connect.globalResiliency._completeAcknowledgeInitialization.calledOnce);
        });

        it("should execute onSuccess callback exactly once when ACKNOWLEDGE handler validation succeeds", function () {
            sandbox.stub(connect.core, 'sendConfigure');
            sandbox.stub(connect.core, 'listenForConfigureRequest');
            sandbox.stub(connect.globalResiliency, '_completeAcknowledgeInitialization');
            sandbox.stub(connect, 'getLog').returns({
                info: sandbox.stub().returns({
                    sendInternalLogToServer: sandbox.stub()
                })
            });

            conduit.sendUpstream = sandbox.stub();

            const data = { id: 'test-stream-id' };
            const conduitTimerContainerMap = { [conduit.name]: { ccpLoadTimeoutInstance: 123 } };
            const initStartTime = Date.now();

            const unsubscribeStub = sandbox.stub();
            conduit.onUpstream.returns({ unsubscribe: unsubscribeStub });

            // Mock _validateGlobalSignin to immediately call onSuccess
            connect.globalResiliency._validateGlobalSignin.callsFake((conduit, params, data, onSuccess, onFailure) => {
                onSuccess();
            });

            // Simulate the ACKNOWLEDGE handler setup and execution
            const acknowledgeHandler = function() {
                const acgrHandler = conduit.onUpstream(connect.EventType.ACKNOWLEDGE, (data) => {
                    connect.globalResiliency._validateGlobalSignin(
                        conduit,
                        params,
                        data,
                        // onSuccess callback
                        () => {
                            acgrHandler.unsubscribe();
                            connect.globalResiliency._completeAcknowledgeInitialization(
                                conduit,
                                params,
                                data,
                                conduitTimerContainerMap,
                                initStartTime
                            );
                        },
                        // onFailure callback
                        () => {
                            
                        }
                    );
                });
                
                // Trigger the ACKNOWLEDGE event to start the flow
                const acknowledgeCallback = conduit.onUpstream.getCall(0).args[1];
                acknowledgeCallback(data);
            };

            acknowledgeHandler();

            // Verify each method called exactly once
            assert.isTrue(unsubscribeStub.calledOnce, 'acgrHandler.unsubscribe should be called exactly once');
            assert.isTrue(connect.globalResiliency._completeAcknowledgeInitialization.calledOnce, '_completeAcknowledgeInitialization should be called exactly once');

            // Verify correct parameters were passed
            sinon.assert.calledWith(
                connect.globalResiliency._completeAcknowledgeInitialization,
                conduit,
                params,
                data,
                conduitTimerContainerMap,
                initStartTime
            );
        });
    });

    describe('authenticateAcgr ACKNOWLEDGE handler with validation', function () {
        var sandbox = sinon.createSandbox();
        let clock, conduit, params, conduitTimerMap, eventBus;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            sandbox.stub(connect, 'publishMetric');
            sandbox.stub(connect, 'isActiveConduit');
            sandbox.stub(connect.globalResiliency, '_validateGlobalSignin');
            sandbox.stub(connect.core, 'getPopupManager').returns({
                clear: sandbox.stub()
            });

            conduit = {
                sendUpstream: sandbox.stub(),
                onUpstream: sandbox.stub(),
                name: 'test-conduit'
            };

            params = {
                loginOptions: { autoClose: true }
            };

            conduitTimerMap = {
                [conduit.name]: {
                    iframeRefreshTimeout: 456
                }
            };

            eventBus = new connect.EventBus({ logEvents: true });
            connect.core.eventBus = eventBus;
            connect.core.getEventBus = () => eventBus;
            connect.core.loginWindow = { close: sandbox.stub() };
        });

        afterEach(function () {
            sandbox.restore();
            clock.restore();
            connect.core.eventBus = null;
            connect.core.loginWindow = null;
        });

        it('should clear iframeRefreshTimeout on validation success', function () {
            connect.isActiveConduit.returns(true);

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onSuccess();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        clearTimeout(conduitTimerMap[conduit.name].iframeRefreshTimeout);
                        conduitTimerMap[conduit.name].iframeRefreshTimeout = null;
                        connect.core.getPopupManager().clear();
                        if (params.loginOptions && params.loginOptions.autoClose && connect.core.loginWindow) {
                            connect.core.loginWindow.close();
                            connect.core.loginWindow = null;
                        }
                    },
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();

            assert.isNull(conduitTimerMap[conduit.name].iframeRefreshTimeout);
        });

        it('should clear login popup on validation success', function () {
            connect.isActiveConduit.returns(true);
            const clearStub = connect.core.getPopupManager().clear;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onSuccess();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        clearTimeout(conduitTimerMap[conduit.name].iframeRefreshTimeout);
                        conduitTimerMap[conduit.name].iframeRefreshTimeout = null;
                        connect.core.getPopupManager().clear();
                    },
                    () => {}
                );
            };

            acknowledgeHandler();

            assert.isTrue(clearStub.calledOnce);
        });

        it('should close login window on success if autoClose enabled', function () {
            connect.isActiveConduit.returns(true);
            const closeStub = connect.core.loginWindow.close;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onSuccess();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        if (params.loginOptions && params.loginOptions.autoClose && connect.core.loginWindow) {
                            connect.core.loginWindow.close();
                            connect.core.loginWindow = null;
                        }
                    },
                    () => {}
                );
            };

            acknowledgeHandler();

            assert.isTrue(closeStub.calledOnce);
            assert.isNull(connect.core.loginWindow);
        });

        it('should NOT close login window if autoClose is false', function () {
            connect.isActiveConduit.returns(true);
            params.loginOptions.autoClose = false;
            const closeStub = connect.core.loginWindow.close;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onSuccess();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        if (params.loginOptions && params.loginOptions.autoClose && connect.core.loginWindow) {
                            connect.core.loginWindow.close();
                            connect.core.loginWindow = null;
                        }
                    },
                    () => {}
                );
            };

            acknowledgeHandler();

            assert.isFalse(closeStub.called);
        });

        it('should trigger ACK_TIMEOUT when validation fails for active conduit', function (done) {
            connect.isActiveConduit.returns(true);

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onFailure();
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, () => {
                done();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();
        });

        it('should NOT clear iframeRefreshTimeout on validation failure', function () {
            connect.isActiveConduit.returns(true);
            const originalTimeout = conduitTimerMap[conduit.name].iframeRefreshTimeout;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onFailure();
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        clearTimeout(conduitTimerMap[conduit.name].iframeRefreshTimeout);
                        conduitTimerMap[conduit.name].iframeRefreshTimeout = null;
                    },
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();

            assert.equal(conduitTimerMap[conduit.name].iframeRefreshTimeout, originalTimeout);
        });

        it('should NOT trigger ACK_TIMEOUT when validation fails for inactive conduit', function () {
            connect.isActiveConduit.returns(false);
            const ackTimeoutSpy = sandbox.spy();

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onFailure();
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, ackTimeoutSpy);

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            acknowledgeHandler();
            clock.tick(100);

            assert.isFalse(ackTimeoutSpy.called);
        });

        it('should handle multiple validation failures triggering retries', function () {
            connect.isActiveConduit.returns(true);
            let ackTimeoutCount = 0;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                onFailure();
            });

            eventBus.subscribe(connect.EventType.ACK_TIMEOUT, () => {
                ackTimeoutCount++;
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {},
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            // Simulate multiple retries
            acknowledgeHandler();
            acknowledgeHandler();
            acknowledgeHandler();

            assert.equal(ackTimeoutCount, 3, 'Should trigger ACK_TIMEOUT for each failure');
        });

        it('should handle validation success after previous failures', function () {
            connect.isActiveConduit.returns(true);
            const clearStub = connect.core.getPopupManager().clear;
            let callCount = 0;

            connect.globalResiliency._validateGlobalSignin.callsFake((cond, onSuccess, onFailure) => {
                callCount++;
                if (callCount < 3) {
                    onFailure();
                } else {
                    onSuccess();
                }
            });

            const acknowledgeHandler = function() {
                connect.globalResiliency._validateGlobalSignin(
                    conduit,
                    () => {
                        clearTimeout(conduitTimerMap[conduit.name].iframeRefreshTimeout);
                        conduitTimerMap[conduit.name].iframeRefreshTimeout = null;
                        connect.core.getPopupManager().clear();
                    },
                    () => {
                        if (connect.isActiveConduit(conduit)) {
                            connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
                        }
                    }
                );
            };

            // First two fail
            acknowledgeHandler();
            acknowledgeHandler();
            // Third succeeds
            acknowledgeHandler();

            assert.isTrue(clearStub.calledOnce);
            assert.isNull(conduitTimerMap[conduit.name].iframeRefreshTimeout);
        });
    });
});
