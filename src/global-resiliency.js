/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  const global = this || globalThis;
  const connect = global.connect || {};
  global.connect = connect;

  const CCP_SYN_TIMEOUT = 1000; // 1 sec
  const CCP_ACK_TIMEOUT = 3000; // 3 sec
  const CCP_LOAD_TIMEOUT = 5000; // 5 sec

  const CSM_IFRAME_REFRESH_ATTEMPTS = 'IframeRefreshAttempts';
  const CSM_IFRAME_INITIALIZATION_SUCCESS = 'IframeInitializationSuccess';
  const CSM_IFRAME_INITIALIZATION_TIME = 'IframeInitializationTime';

  connect.globalResiliency._downloadCCPLogs = function () {
    connect.core.getEventBus().trigger(connect.EventType.DOWNLOAD_LOG_FROM_CCP);
  };

  connect.globalResiliency._initializeActiveRegion = function (grProxyConduit, region) {
    // agentDataProvider needs to be reinitialized in order to avoid side effects from the drastic agent snapshot change
    try {
      if (region) {
        connect.core.agentDataProvider?.destroy();
        if (!connect.core.agentDataProvider)
          connect.core.agentDataProvider = new connect.core.AgentDataProvider(connect.core.getEventBus());
        else connect.core.agentDataProviderBackup = new connect.core.AgentDataProvider(connect.core.getEventBus());
        grProxyConduit.getActiveConduit().sendUpstream(connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);
      }
    } catch (e) {
      connect
        .getLog()
        .error('[GR] There was an error reinitializing the agent data provider.')
        .withException(e)
        .sendInternalLogToServer();

      connect.publishMetric({
        name: 'GlobalResiliencySwitchRegionAgentDataProviderFailure',
        data: { count: 1 },
      });
    }

    // Set one to the connect.core.keepaliveManager just in case for backward compatibility, but most likely it won't be used.
    connect.core.keepaliveManager = grProxyConduit.getActiveConduit().keepaliveManager;

    connect.core.client = new connect.UpstreamConduitClient(grProxyConduit.getActiveConduit());
    connect.core.masterClient = new connect.UpstreamConduitMasterClient(grProxyConduit.getActiveConduit());

    connect.core.mediaFactory = new connect.MediaFactory({
      ...connect.globalResiliency.params,
      ccpUrl: grProxyConduit.getActiveConduit().name,
    });

    // Because normal flow is initCCP > init softphone manager,
    // it is possible the softphone manager was not yet initialized
    try {
      if (connect.core?.softphoneManager) {
        if (connect.core._allowSoftphonePersistentConnection) {
          connect
            .getLog()
            .info('[GR] Refreshing softphone manager RTC peer connection manager.')
            .sendInternalLogToServer();
          connect.core.softphoneManager._initiateRtcPeerConnectionManager();
        } else {
          connect
            .getLog()
            .info('[GR] Refreshing softphone manager RTC peer connection factory.')
            .sendInternalLogToServer();
          connect.core.softphoneManager._refreshRtcPeerConnectionFactory();
        }
      } else {
        connect
          .getLog()
          .info('[GR] Softphone manager not initialized or not used, not refreshing softphone manager.')
          .sendInternalLogToServer();
      }
    } catch (e) {
      connect
        .getLog()
        .error('[GR] There was an error refreshing the softphone manager.')
        .withException(e)
        .sendInternalLogToServer();

      connect.publishMetric({
        name: 'GlobalResiliencySwitchRegionWebRTCFailure',
        data: { count: 1 },
      });
    }

    if (region) {
      connect.globalResiliency._activeRegion = region;

      if (connect.ChatSession) {
        if (connect.ChatSession.setRegionOverride) {
          connect.getLog().info(`[GR] Updating ChatJS region to ${region}`).sendInternalLogToServer();
          connect.ChatSession.setRegionOverride(region);
        } else {
          connect
            .getLog()
            .warn(`[GR] ChatJS present, but setRegionOverride not found. Consider updating to latest ChatJS version`)
            .sendInternalLogToServer();
        }
      } else {
        connect.getLog().info('[GR] ChatJS not present, not updating ChatSession region.').sendInternalLogToServer();
      }
    }

    grProxyConduit
      .getActiveConduit()
      .sendUpstream(connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, { instanceState: 'active' });
    grProxyConduit
      .getInactiveConduit()
      .sendUpstream(connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, { instanceState: 'inactive' });

    try {
      connect.core._showIframe(grProxyConduit.getActiveConduit().iframe);
      connect.core._hideIframe(grProxyConduit.getInactiveConduit().iframe);
    } catch (e) {
      connect
        .getLog()
        .error('[GR] There was an error updating the IFrame visibility.')
        .withException(e)
        .sendInternalLogToServer();

      connect.publishMetric({
        name: 'GlobalResiliencySwitchRegionIFrameSwapFailure',
        data: { count: 1 },
      });
    }
  };

  connect.globalResiliency._switchActiveRegion = function (grProxyConduit, newActiveConduitName) {
    if (!(grProxyConduit instanceof connect.GRProxyIframeConduit)) {
      connect
        .getLog()
        .error('[GR] Tried to switch over active region, but proxy conduit was not of expected type.')
        .withObject({ type: typeof grProxyConduit })
        .sendInternalLogToServer();
      return false;
    }

    const newActiveConduit = grProxyConduit.getConduitByName(newActiveConduitName);

    if (!(newActiveConduit instanceof connect.IFrameConduit)) {
      connect
        .getLog()
        .error('[GR] Tried to switch over active region, but conduit name was invalid')
        .withObject({ newActiveConduitName })
        .sendInternalLogToServer();
      return false;
    }

    if (
      grProxyConduit.getActiveConduit().name === newActiveConduit.name &&
      connect.globalResiliency._activeRegion === newActiveConduit.region
    ) {
      connect
        .getLog()
        .info('[GR] Not switching over active region as we are already on active region.')
        .sendInternalLogToServer();
      return false;
    }

    connect
      .getLog()
      .info(
        `[GR] Switching active region from ${grProxyConduit.getActiveConduit()?.region} / ${
          grProxyConduit.getActiveConduit()?.name
        } to ${newActiveConduit?.region} / ${newActiveConduit?.name}`
      )
      .sendInternalLogToServer();

    // We need to clear all sessions now as it is not guarenteed that a snapshot informing
    // the softphone manager that the contact is ended will be received before the failover occurrs
    connect.core?.softphoneManager?._clearAllSessions();

    grProxyConduit.setActiveConduit(newActiveConduit.name);

    connect.globalResiliency._initializeActiveRegion(grProxyConduit, newActiveConduit.region);

    connect
      .getLog()
      .info(
        `[GR] Switched active region to ${grProxyConduit.getActiveConduit()?.region} / ${
          grProxyConduit.getActiveConduit()?.name
        }`
      )
      .sendInternalLogToServer();

    connect.publishMetric({
      name: 'CalledInternalSwitchActiveRegionSuccessful',
      data: { count: 1 },
    });

    return true;
  };

  connect.globalResiliency.initGRCCP = function (containerDiv, paramsIn) {
    // Legacy auth flow must be enabled for now to allow GR to work
    const params = {
      ...paramsIn,
      loginOptions: {
        legacyAuthFlow: true,
      },
    };
    connect.globalResiliency.params = params;

    const conduitTimerContainerMap = {};
    let hasSentFailoverPending = false;
    connect.globalResiliency._activeRegion = null;
    connect.globalResiliency.globalResiliencyEnabled = true;

    let LAST_FAILOVER_PENDING_TIME;
    let LAST_FAILOVER_INITIATED_TIME;
    let LAST_FAILOVER_COMPLETED_TIME;

    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }

    // The initialization metric works only for the active region
    connect.getLog().info('[GR] Iframe initialization started').sendInternalLogToServer();
    let initStartTime = Date.now();

    connect.assertNotNull(containerDiv, 'containerDiv');

    const primaryURLOrigin = new URL(params.ccpUrl).origin;
    const secondaryURLOrigin = new URL(params.secondaryCCPUrl).origin;
    const primaryIframe = connect.core._createCCPIframe(containerDiv, params, primaryURLOrigin);
    const secondaryIframe = connect.core._createCCPIframe(
      containerDiv,
      {
        ...params,
        ccpUrl: params.secondaryCCPUrl,
      },
      secondaryURLOrigin
    );

    // Create an upstream conduit communicating with all the CCP iframes.
    // This is a sort of a multiplexer of all upstream conduits, i.e.
    //   - connect.core.upstream.sendUpstream(msg) will postMessage to all iframes
    //   - connect.core.upstream.onUpstream(event, f) will register a callback to be invoked when one of the iframes postMessages us
    const grProxyConduit = new connect.GRProxyIframeConduit(
      window,
      [primaryIframe, secondaryIframe],
      primaryIframe.src
    );
    connect.core.upstream = grProxyConduit;

    // Initialize the core event bus. The event subscriptions never get lost after failover
    connect.core.eventBus = new connect.EventBus({ logEvents: false });

    connect.globalResiliency._initializeActiveRegion(grProxyConduit);

    connect.publishMetric({
      name: 'InitGlobalResiliencyCCPCalled',
      data: { count: 1 },
    });

    // Let each CCP know if the iframe is visible to users or not
    grProxyConduit.getAllConduits().forEach((conduit) => {
      connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(conduit.iframe, conduit);
    });

    // Initialize websocket provider that exchanges websocket specific events with the shared worker.
    // It receives messages only from the active conduit.
    // It sends messages only to active condit, except for topic subscription so that inactive regions' media channels can be initialized.
    connect.core.webSocketProvider = new connect.WebSocketProvider();

    // Bridge all events sent from upstream to the core event bus.
    // However most of events from inactive conduits are ignored.
    grProxyConduit.onAllUpstream(connect.core.getEventBus().bridge());

    // Initialize a keep alive manager for each conduit, that sends back a SYN event in response to ACK event from its shared worker
    grProxyConduit.getAllConduits().forEach((conduit) => {
      // set it to conduit for later use
      conduit.keepaliveManager = new connect.KeepaliveManager(
        conduit,
        connect.core.getEventBus(),
        params.ccpSynTimeout || CCP_SYN_TIMEOUT,
        params.ccpAckTimeout || CCP_ACK_TIMEOUT
      );
    });

    // The CRM layer CCP logs are sent to each CCP
    connect.getLog().scheduleUpstreamOuterContextCCPLogsPush(grProxyConduit);
    connect.getLog().scheduleUpstreamOuterContextCCPserverBoundLogsPush(grProxyConduit);

    // After switching over, we need to grab the agent data of the new CCP
    grProxyConduit.onUpstream(connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP, (agentData) => {
      if (connect.core.agentDataProviderBackup) {
        connect.core.agentDataProviderBackup.updateAgentData(agentData);
        connect.core.agentDataProvider = connect.core.agentDataProviderBackup;
        connect.core.agentDataProviderBackup = null;
      } else {
        connect.core.agentDataProvider.updateAgentData(agentData);
      }
      connect.getLog().info('[GR] Fetched agent data from CCP.').sendInternalLogToServer();
    });

    // Trigger ACK_TIMEOUT event if there's no ACK from the primary CCP for 5 sec.
    // Ignore and just emit a log for non-primary CCPs.
    grProxyConduit.getAllConduits().forEach((conduit) => {
      conduitTimerContainerMap[conduit.name] = { iframeRefreshTimeout: null };

      conduitTimerContainerMap[conduit.name].ccpLoadTimeoutInstance = setTimeout(() => {
        conduitTimerContainerMap[conduit.name].ccpLoadTimeoutInstance = null;

        if (connect.isActiveConduit(conduit)) {
          connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
          connect.getLog().info(`CCP LoadTimeout triggered. ${conduit.name}`).sendInternalLogToServer();
        } else {
          connect
            .getLog()
            .error(`CCP LoadTimeout detected but ignored for non-primary regions. ${conduit.name}`)
            .sendInternalLogToServer();
        }
      }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);
    });

    // Listen to the first ACK event sent from each conduit.
    grProxyConduit.getAllConduits().forEach((conduit) => {
      conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function (data) {
        connect.getLog().info(`Acknowledged by the CCP! ${conduit.name}`).sendInternalLogToServer();

        conduit.sendUpstream(connect.EventType.CONFIGURE, {
          softphone: params.softphone,
          chat: params.chat,
          pageOptions: params.pageOptions,
          shouldAddNamespaceToLogs: params.shouldAddNamespaceToLogs,
          enableGlobalResiliency: params.enableGlobalResiliency,
          instanceState: connect.isActiveConduit(conduit) ? 'active' : 'inactive',
        });

        // Clear the load timeout timer
        if (conduitTimerContainerMap[conduit.name].ccpLoadTimeoutInstance) {
          global.clearTimeout(conduitTimerContainerMap[conduit.name].ccpLoadTimeoutInstance);
          conduitTimerContainerMap[conduit.name].ccpLoadTimeoutInstance = null;
        }

        // Send outer context info to each CCP
        conduit.sendUpstream(connect.EventType.OUTER_CONTEXT_INFO, {
          streamsVersion: connect.version,
          initCCPParams: params,
        });

        // Start keepalive manager. Only active region's one can trigger ACK_TIMEOUT event
        conduit.keepaliveManager.start();

        if (connect.isActiveConduit(conduit)) {
          // Only active conduit initialize these since we only need one instance
          connect.core.client = new connect.UpstreamConduitClient(conduit);
          connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
          connect.core.portStreamId = data.id; // We should update this at failover

          // Only active conduit emits these metircs since we don't allow non-active conduits to broadcast events
          if (initStartTime) {
            const initTime = Date.now() - initStartTime;
            const refreshAttempts = conduitTimerContainerMap[conduit.name].iframeRefreshAttempt || 0;
            connect.getLog().info('Iframe initialization succeeded').sendInternalLogToServer();
            connect.getLog().info(`Iframe initialization time ${initTime}`).sendInternalLogToServer();
            connect.getLog().info(`Iframe refresh attempts ${refreshAttempts}`).sendInternalLogToServer();
            setTimeout(() => {
              connect.publishMetric({
                name: CSM_IFRAME_REFRESH_ATTEMPTS,
                data: { count: refreshAttempts },
              });
              connect.publishMetric({
                name: CSM_IFRAME_INITIALIZATION_SUCCESS,
                data: { count: 1 },
              });
              connect.publishMetric({
                name: CSM_IFRAME_INITIALIZATION_TIME,
                data: { count: initTime },
              });
              // to avoid metric emission after initialization
              initStartTime = null;
            }, 1000);
          }
        }
        conduit.portStreamId = data.id; // keep this id for future failover

        this.unsubscribe();
      });
    });

    // Add logs from the active upstream conduit to our own logger.
    grProxyConduit.onUpstream(connect.EventType.LOG, (logEntry) => {
      if (logEntry.loggerId !== connect.getLog().getLoggerId()) {
        connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
      }
    });

    // Pop a login page when we encounter an ACK_TIMEOUT event.
    // The event can only be triggered from active region.
    connect.core.getEventBus().subscribe(connect.EventType.ACK_TIMEOUT, () => {
      // loginPopup is true by default, only false if explicitly set to false.
      if (params.loginPopup !== false) {
        try {
          // For GR, we assume getLoginUrl() always returns the loginUrl for global sign-in page.
          // LoginUrl existence was checked before calling initGRCCP
          const { loginUrl } = params;

          connect
            .getLog()
            .warn('ACK_TIMEOUT occurred, attempting to pop the login page if not already open.')
            .sendInternalLogToServer();
          // clear out last opened timestamp for SAML authentication when there is ACK_TIMEOUT
          connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);

          connect.core._openPopupWithLock(loginUrl, params.loginOptions);
        } catch (e) {
          connect
            .getLog()
            .error('ACK_TIMEOUT occurred but we are unable to open the login popup.')
            .withException(e)
            .sendInternalLogToServer();
        }
      }

      // Start iframe refresh for each region's CCP
      grProxyConduit.getAllConduits().forEach((conduit) => {
        if (conduitTimerContainerMap[conduit.name].iframeRefreshTimeout === null) {
          try {
            // Stop the iframe refresh when ACK event is sent from upstream
            conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
              this.unsubscribe();
              global.clearTimeout(conduitTimerContainerMap[conduit.name].iframeRefreshTimeout);
              conduitTimerContainerMap[conduit.name].iframeRefreshTimeout = null;

              connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);

              if (
                (params.loginPopupAutoClose || (params.loginOptions && params.loginOptions.autoClose)) &&
                connect.core.loginWindow
              ) {
                connect.core.loginWindow.close();
                connect.core.loginWindow = null;
              }
            });

            // Kick off the iframe refresh
            connect.core._refreshIframeOnTimeout(
              { ...params, ccpUrl: conduit.iframe.src },
              containerDiv,
              conduitTimerContainerMap[conduit.name],
              conduit.name
            );
          } catch (e) {
            connect.getLog().error('Error occurred while refreshing iframe').withException(e).sendInternalLogToServer();
          }
        }
      });
    });

    grProxyConduit.getAllConduits().forEach((conduit) => {
      conduit.onUpstream(connect.GlobalResiliencyEvents.INIT, (data) => {
        if (!data?.instanceRegion || !data?.instanceState || !data?.activeRegion) {
          connect
            .getLog()
            .error(
              `[GR] Expected GlobalResiliencyEvents.INIT to have instance region, state, and current active region, but did not find it.`
            )
            .withObject({ data })
            .sendInternalLogToServer();
          return;
        }

        connect
          .getLog()
          .info(
            `[GR] Received GlobalResiliencyEvents.INIT indicating ${conduit.name} in region ${data?.instanceRegion} is ${data?.instanceState}.`
          )
          .withObject({ data })
          .sendInternalLogToServer();

        const initialConduit =
          data.instanceRegion === data.activeRegion ? conduit : grProxyConduit.getOtherConduit(conduit);

        if (!conduit.region || !initialConduit.region) {
          conduit.region = data.instanceRegion;
          initialConduit.region = data.activeRegion;
        }

        conduit.sendUpstream(connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, {
          instanceState: data.instanceState,
        });

        if (!connect.core.initialized) {
          connect
            .getLog()
            .info(
              `[GR] Setting initial active iframe to ${initialConduit.name} in region ${initialConduit.region} because the instance state was active`
            )
            .sendInternalLogToServer();

          try {
            connect.globalResiliency._switchActiveRegion(grProxyConduit, initialConduit.name);

            connect.publishMetric({
              name: 'GlobalResiliencySwitchRegionSuccess',
              data: { count: 1 },
            });
          } catch (e) {
            connect
              .getLog()
              .error(`[GR] Failure switching active region at initialization.`)
              .withException(e)
              .sendInternalLogToServer();

            connect.publishMetric({
              name: 'GlobalResiliencySwitchRegionFailure',
              data: { count: 1 },
            });
          }
          connect.core.getEventBus().trigger(connect.EventType.INIT);
          connect.core.initialized = true;
          // We do no trigger FAILOVER_COMPLETE here as that should only be triggered after initiaization

          connect.publishMetric({
            name: 'GlobalResiliencyCoreInitialized',
            data: { count: 1 },
          });
        } else {
          connect
            .getLog()
            .log(`[GR] Deduping GlobalResiliencyEvents.INIT - Core is already initialized.`)
            .sendInternalLogToServer();
        }
      });

      conduit.onUpstream(connect.GlobalResiliencyEvents.FAILOVER_INITIATED, (data) => {
        LAST_FAILOVER_INITIATED_TIME = Date.now();

        connect.publishMetric({
          name: 'GlobalResiliencyFailoverInitiatedReceived',
          data: { count: 1 },
        });

        if (hasSentFailoverPending) {
          connect.publishMetric({
            name: 'GlobalResiliencyPendingToInitiatedLatency',
            data: { latency: LAST_FAILOVER_INITIATED_TIME - LAST_FAILOVER_PENDING_TIME },
          });
        }

        if (!data?.activeRegion) {
          connect
            .getLog()
            .error(
              `[GR] Expected GlobalResiliencyEvents.FAILOVER_INITIATED to have new active region, but did not find it.`
            )
            .withObject({ data })
            .sendInternalLogToServer();
          return;
        }

        connect
          .getLog()
          .info(
            `[GR] Received GlobalResiliencyEvents.FAILOVER_INITIATED indicating the activeRegion is ${data.activeRegion}.`
          );

        let newActiveConduit = grProxyConduit.getConduitByRegion(data.activeRegion);

        if (!newActiveConduit) {
          connect
            .getLog()
            .debug(
              `[GR] A conduit did not received GLOBAL_RESILIENCY.INIT event, leading to the region field being unpopulated.`
            );

          grProxyConduit.getAllConduits().forEach((searchConduit) => {
            if (searchConduit.region === undefined || searchConduit.region === null) {
              searchConduit.region = data.activeRegion;
              newActiveConduit = searchConduit;
            }
          });
        }

        let didSwitch;

        try {
          didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, newActiveConduit.name);

          connect.publishMetric({
            name: 'GlobalResiliencySwitchRegionSuccess',
            data: { count: 1 },
          });
        } catch (e) {
          connect.getLog().error(`[GR] Failure switching active region.`).withException(e).sendInternalLogToServer();

          connect.publishMetric({
            name: 'GlobalResiliencySwitchRegionFailure',
            data: { count: 1 },
          });
        }

        if (didSwitch) {
          hasSentFailoverPending = false;

          const agentUpdateSub = grProxyConduit.onUpstream(connect.AgentEvents.UPDATE, () => {
            agentUpdateSub.unsubscribe();

            connect.core
              .getEventBus()
              .trigger(connect.GlobalResiliencyEvents.FAILOVER_COMPLETE, { activeRegion: data.activeRegion });

            grProxyConduit.sendUpstream(connect.GlobalResiliencyEvents.FAILOVER_COMPLETE);

            connect.getLog().info(`[GR] GlobalResiliencyEvents.FAILOVER_COMPLETE emitted.`).sendInternalLogToServer();

            LAST_FAILOVER_COMPLETED_TIME = Date.now();

            connect.publishMetric({
              name: 'GlobalResiliencyFailoverCompleted',
              data: { count: 1 },
            });

            connect.publishMetric({
              name: 'GlobalResiliencyInitiatedToCompletedLatency',
              data: { latency: LAST_FAILOVER_COMPLETED_TIME - LAST_FAILOVER_INITIATED_TIME },
            });
          });
        }
      });
    });

    // Not clear what this is about. Probably for backward compatibilty for pre-StreamsJS customers
    if (params.onViewContact) {
      connect.core.onViewContact(params.onViewContact);
    }

    // Update the numberOfConnectedCCPs value when sent from upstream.
    // On CRM layer, this information is not used by any other component in Streams.
    grProxyConduit.onUpstream(connect.EventType.UPDATE_CONNECTED_CCPS, (data) => {
      connect.numberOfConnectedCCPs = data.length;
    });

    // Update and cache the voiceIdDomainId value when sent from each upstream conduit.
    // The value needs to be updated when switching the active region as each region might have a different VoiceId domain associated.
    grProxyConduit.getAllConduits().forEach((conduit) => {
      conduit.onUpstream(connect.VoiceIdEvents.UPDATE_DOMAIN_ID, (data) => {
        if (data && data.domainId) {
          conduit.voiceIdDomainId = data.domainId;
          if (connect.isActiveConduit(conduit)) {
            connect.core.voiceIdDomainId = data.domainId;
          }
        }
      });
    });

    connect.core.getEventBus().subscribe(connect.EventType.IFRAME_RETRIES_EXHAUSTED, (conduitName) => {
      if (conduitName !== grProxyConduit.getActiveConduit().name) {
        // Ignore IFRAME_RETRIES_EXHAUSTED event from non-active region
        return;
      }
      if (initStartTime) {
        const refreshAttempts =
          conduitTimerContainerMap[grProxyConduit.getActiveConduit().name].iframeRefreshAttempt - 1;
        connect.getLog().info('Iframe initialization failed').sendInternalLogToServer();
        connect
          .getLog()
          .info(`Time after iframe initialization started ${Date.now() - initStartTime}`)
          .sendInternalLogToServer();
        connect.getLog().info(`Iframe refresh attempts ${refreshAttempts}`).sendInternalLogToServer();
        connect.publishMetric({
          name: CSM_IFRAME_REFRESH_ATTEMPTS,
          data: { count: refreshAttempts },
        });
        connect.publishMetric({
          name: CSM_IFRAME_INITIALIZATION_SUCCESS,
          data: { count: 0 },
        });

        initStartTime = null;
      }
    });

    // keep the softphone params for external use
    connect.core.softphoneParams = params.softphone;

    grProxyConduit.getAllConduits().forEach((conduit) => {
      conduit.onUpstream(connect.GlobalResiliencyEvents.FAILOVER_PENDING, (data) => {
        if (!connect.isActiveConduit(conduit)) {
          return;
        }

        if (hasSentFailoverPending) {
          connect
            .getLog()
            .info(`[GR] Received FAILOVER_PENDING - deduping, will not trigger event subscription.`)
            .withObject({ data })
            .sendInternalLogToServer();

          return;
        }

        connect.getLog().info(`[GR] Received FAILOVER_PENDING`).withObject({ data }).sendInternalLogToServer();
        connect.core
          .getEventBus()
          .trigger(connect.GlobalResiliencyEvents.FAILOVER_PENDING_CRM, { nextActiveRegion: data.activeRegion });

        hasSentFailoverPending = true;

        LAST_FAILOVER_PENDING_TIME = Date.now();

        connect.publishMetric({
          name: 'GlobalResiliencyFailoverPendingReceived',
          data: { count: 1 },
        });
      });
    });

    grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.FAILOVER_PENDING);
    grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.FAILOVER_INITIATED);
    grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.FAILOVER_COMPLETE);
    grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.HEARTBEAT_SYN);
    grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.HEARTBEAT_ACK);

    connect.core.getEventBus().subscribe(connect.EventType.DOWNLOAD_LOG_FROM_CCP, () => {
      grProxyConduit.getAllConduits().forEach((conduit) => {
        const region = conduit.region || 'region';
        conduit.sendUpstream(connect.EventType.DOWNLOAD_LOG_FROM_CCP, { logName: `ccp-${region}-agent-log` });
      });
    });

    setTimeout(() => {
      let count = 0;
      grProxyConduit.getAllConduits().forEach((conduit) => {
        if (conduit.region) {
          count += 1;
        }
      });

      if (count < 2) {
        connect
          .getLog()
          .info(`[GR] One or more conduits did not GlobalResiliency.INIT event to CRM layer.`)
          .withObject({
            firstConduitName: grProxyConduit.getAllConduits()[0].name,
            firstConduitRegion: grProxyConduit.getAllConduits()[0].region,
            secondConduitName: grProxyConduit.getAllConduits()[1].name,
            secondConduitRegion: grProxyConduit.getAllConduits()[1].region,
          })
          .sendInternalLogToServer();

        connect.publishMetric({
          name: 'GlobalResiliencyPartialInitialization',
          data: { count: 1 },
        });
      }
    }, 30000);
  };
})();
