describe('Global Resiliency', () => {
  const url = 'http://localhost';
  let params;

  describe('connect.globalResiliency.initGRCCP()', () => {
    let containerDiv;
    let primaryIframe;
    let secondaryIframe;
    let conduitParam;
    let clearStub;
    let openStub;
    let closeStub;
    const fakeRingtoneUrl = 'customVoiceRingtone.amazon.com';
    const softphoneParams = { ringtoneUrl: fakeRingtoneUrl };
    const chatParams = { ringtoneUrl: 'customChatRingtone.amazon.com' };
    const taskParams = { ringtoneUrl: 'customTaskRingtone.amazon.com' };
    const logConfigParams = { echoLevel: 'warn', logLevel: 'info' };
    const pageOptionsParams = {
      enableAudioDeviceSettings: false,
      enableVideoDeviceSettings: false,
      enablePhoneTypeSettings: true,
    };
    const shouldAddNamespaceToLogs = false;

    beforeEach(() => {
      jest.useFakeTimers();
      // window.location can't be reassigned directly under jsdom; delete then set.
      delete window.location;
      window.location = new URL(url);

      containerDiv = { appendChild: jest.fn() };
      params = {
        enableGlobalResiliency: true,
        ccpUrl: 'http://localhost/url.com',
        secondaryCCPUrl: 'http://localhost2/url.com',
        loginUrl: 'http://loginUrl.com',
        softphone: softphoneParams,
        chat: chatParams,
        task: taskParams,
        logConfig: logConfigParams,
        loginOptions: { autoClose: true },
        pageOptions: pageOptionsParams,
        shouldAddNamespaceToLogs: shouldAddNamespaceToLogs,
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

      clearStub = jest.fn();
      closeStub = jest.fn();
      openStub = jest.fn().mockReturnValue({ close: closeStub });
      jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
      jest.spyOn(connect.core, '_hideIframe').mockReturnValue(null);
      jest.spyOn(connect.core, '_showIframe').mockReturnValue(null);
      jest.spyOn(connect, 'UpstreamConduitClient').mockImplementation(() => {});
      jest.spyOn(connect, 'UpstreamConduitMasterClient').mockImplementation(() => {});
      jest.spyOn(connect, 'isFramed').mockReturnValue(true);
      jest.spyOn(connect, 'ifMaster').mockImplementation(() => {});
      jest.spyOn(connect, 'VoiceRingtoneEngine').mockImplementation(() => {});
      jest.spyOn(connect, 'QueueCallbackRingtoneEngine').mockImplementation(() => {});
      jest.spyOn(connect, 'ChatRingtoneEngine').mockImplementation(() => {});
      jest.spyOn(document, 'createElement');
      jest.spyOn(connect.core, '_refreshIframeOnTimeout').mockImplementation(() => {});
      jest.spyOn(connect, 'publishMetric').mockImplementation(() => {});
      jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({ clear: clearStub, open: openStub });
      connect.numberOfConnectedCCPs = 0;
      connect.agent.initialized = true;
      jest.spyOn(connect.core, 'getAgentDataProvider').mockReturnValue({
        getAgentData: () => ({}),
      });
      connect.core.eventBus = new connect.EventBus({ logEvents: true });
      connect.globalResiliency._activeRegion = null;

      containerDiv.appendChild.mockClear();
      conduitParam = [
        { iframe: primaryIframe, label: 'primary' },
        { iframe: secondaryIframe, label: 'secondary' },
      ];
    });

    afterEach(() => {
      connect.agent.initialized = false;
      connect.core.initialized = false;
      connect.core.eventBus = null;
      jest.useRealTimers();
    });

    it.each([
      ['secondaryCCPUrl is missing', { secondaryCCPUrl: undefined }],
      ['loginUrl is missing', { loginUrl: undefined }],
      ['enableGlobalResiliency is undefined', { enableGlobalResiliency: undefined }],
      ['enableGlobalResiliency is false', { enableGlobalResiliency: false }],
    ])('falls through to normal CCP init when %s', (_desc, paramOverride) => {
      jest.spyOn(connect.globalResiliency, '_switchActiveRegion').mockImplementation(() => {});
      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      document.createElement.mockClear();
      containerDiv.appendChild.mockClear();

      connect.core.initCCP(containerDiv, { ...params, ...paramOverride });

      expect(connect.globalResiliency._switchActiveRegion).not.toHaveBeenCalled();
      expect(connect.globalResiliency._initializeActiveRegion).not.toHaveBeenCalled();
      expect(connect.core.checkNotInitialized).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(containerDiv.appendChild).toHaveBeenCalledTimes(1);
    });

    it('Two CCP iframes are created.', () => {
      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      jest.spyOn(connect, 'MediaFactory').mockImplementation(() => {});
      jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireAgentUpdateEvents').mockImplementation(() => {});
      jest.spyOn(connect.Conduit.prototype, 'sendUpstream').mockReturnValue(null);
      jest.spyOn(connect.Conduit.prototype, 'sendDownstream').mockImplementation(() => {});
      connect.core.checkNotInitialized.mockRestore();
      jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
      document.createElement.mockClear();
      containerDiv.appendChild.mockClear();

      connect.core.initCCP(containerDiv, params);

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(document.createElement).toHaveBeenCalledTimes(2);
      expect(containerDiv.appendChild).toHaveBeenCalledTimes(2);
    });

    describe('ACGR sendConfigure and listenForConfigureRequest', () => {
      it('should call sendConfigure with ACGR config when ACKNOWLEDGE handler is triggered directly', () => {
        const fakeConduit = {
          sendUpstream: jest.fn(),
          name: 'test-conduit',
        };
        const localParams = {
          softphone: { allowFramedSoftphone: true },
          chat: { enabled: true },
          task: { enabled: false },
          autoAcceptTone: { enabled: true },
          pageOptions: { enableAudioDeviceSettings: true, showInactivityModal: false },
          shouldAddNamespaceToLogs: true,
          enableGlobalResiliency: true,
        };

        jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
        jest.spyOn(connect.core, 'listenForConfigureRequest').mockImplementation(() => {});

        const isACGR = true;
        connect.core.sendConfigure(localParams, fakeConduit, isACGR);

        expect(fakeConduit.sendUpstream).toHaveBeenCalledWith(connect.EventType.CONFIGURE, {
          softphone: localParams.softphone,
          chat: localParams.chat,
          task: localParams.task,
          autoAcceptTone: localParams.autoAcceptTone,
          pageOptions: localParams.pageOptions,
          shouldAddNamespaceToLogs: localParams.shouldAddNamespaceToLogs,
          showInactivityModal: false,
          enableGlobalResiliency: localParams.enableGlobalResiliency,
          instanceState: 'active',
        });
      });

      it('should call sendConfigure with inactive instanceState for inactive conduit', () => {
        const fakeConduit = {
          sendUpstream: jest.fn(),
          name: 'inactive-conduit',
        };
        const localParams = {
          softphone: { allowFramedSoftphone: true },
          enableGlobalResiliency: true,
        };

        jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);

        const isACGR = true;
        connect.core.sendConfigure(localParams, fakeConduit, isACGR);

        expect(fakeConduit.sendUpstream).toHaveBeenCalledWith(
          connect.EventType.CONFIGURE,
          expect.objectContaining({
            enableGlobalResiliency: localParams.enableGlobalResiliency,
            instanceState: 'inactive',
          })
        );
      });

      it('should exclude disasterRecoveryOn when isACGR is true', () => {
        const fakeConduit = {
          sendUpstream: jest.fn(),
          name: 'test-conduit',
        };
        const localParams = {
          softphone: { allowFramedSoftphone: true },
          disasterRecoveryOn: true,
          enableGlobalResiliency: true,
        };

        jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);

        connect.core.sendConfigure(localParams, fakeConduit, true);

        const configArgs = fakeConduit.sendUpstream.mock.calls[0];
        expect(configArgs[1].disasterRecoveryOn).toBeUndefined();
        expect(configArgs[1].enableGlobalResiliency).toBeDefined();
        expect(configArgs[1].instanceState).toBeDefined();
      });

      it('should include disasterRecoveryOn when isACGR is false', () => {
        const fakeConduit = {
          sendUpstream: jest.fn(),
          name: 'test-conduit',
        };
        const localParams = {
          softphone: { allowFramedSoftphone: true },
          disasterRecoveryOn: true,
        };

        connect.core.sendConfigure(localParams, fakeConduit, false);

        const configArgs = fakeConduit.sendUpstream.mock.calls[0];
        expect(configArgs[1].disasterRecoveryOn).toBeDefined();
        expect(configArgs[1].enableGlobalResiliency).toBeUndefined();
        expect(configArgs[1].instanceState).toBeUndefined();
      });
    });

    it('Check conduit settings', () => {
      const fakeIframe = { isIframe: true };
      const fakeActiveConduit = {
        keepalivemanager: 0,
        sendUpstream: jest.fn(),
        onUpstream: jest.fn(),
        iframe: fakeIframe,
      };
      const fakeInactiveConduit = {
        keepalivemanager: 0,
        sendUpstream: jest.fn(),
        onUpstream: jest.fn(),
        iframe: fakeIframe,
      };
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue(fakeActiveConduit),
        getInactiveConduit: jest.fn().mockReturnValue(fakeInactiveConduit),
        getAllConduits: jest.fn().mockReturnValue([fakeActiveConduit, fakeInactiveConduit]),
        onUpstream: jest.fn(),
        onAllUpstream: jest.fn(),
        relayUpstream: jest.fn(),
      };

      jest.spyOn(connect, 'GRProxyIframeConduit').mockReturnValue(fakeGrProxyConduit);
      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      jest.spyOn(connect, 'MediaFactory').mockImplementation(() => {});
      jest.spyOn(connect.core, '_sendIframeStyleDataUpstreamAfterReasonableWaitTime').mockImplementation(() => {});
      jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireAgentUpdateEvents').mockImplementation(() => {});
      connect.core.checkNotInitialized.mockRestore();
      jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
      document.createElement.mockClear();
      containerDiv.appendChild.mockClear();

      connect.core.initCCP(containerDiv, params);

      expect(connect.publishMetric).toHaveBeenCalledWith({ name: 'InitGlobalResiliencyCCPCalled', data: { count: 1 } });

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(document.createElement).toHaveBeenCalledTimes(2);
      expect(containerDiv.appendChild).toHaveBeenCalledTimes(2);

      expect(connect.core.upstream === fakeGrProxyConduit).toBe(true);
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledWith(fakeGrProxyConduit);
      expect(!!connect.core.eventBus).toBe(true);
      expect(!!connect.core.agentDataProvider).toBe(true);
      expect(!!connect.core.mediaFactory).toBe(true);
      expect(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime).toHaveBeenCalledTimes(2);
      expect(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime).toHaveBeenCalledWith(
        fakeIframe,
        fakeActiveConduit
      );
      expect(connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime).toHaveBeenCalledWith(
        fakeIframe,
        fakeInactiveConduit
      );
      expect(!!connect.core.webSocketProvider).toBe(true);
      expect(!!fakeActiveConduit.keepaliveManager).toBe(true);
      expect(!!fakeInactiveConduit.keepaliveManager).toBe(true);

      expect(fakeActiveConduit.onUpstream).toHaveBeenCalledWith(connect.EventType.ACKNOWLEDGE, expect.any(Function));
      expect(fakeInactiveConduit.onUpstream).toHaveBeenCalledWith(connect.EventType.ACKNOWLEDGE, expect.any(Function));

      expect(fakeGrProxyConduit.onUpstream).toHaveBeenCalledWith(connect.EventType.LOG, expect.any(Function));

      expect(fakeActiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.INIT,
        expect.any(Function)
      );
      expect(fakeInactiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.INIT,
        expect.any(Function)
      );

      expect(fakeActiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.FAILOVER_INITIATED,
        expect.any(Function)
      );
      expect(fakeInactiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.FAILOVER_INITIATED,
        expect.any(Function)
      );

      expect(fakeGrProxyConduit.onUpstream).toHaveBeenCalledWith(
        connect.EventType.UPDATE_CONNECTED_CCPS,
        expect.any(Function)
      );

      expect(fakeActiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.VoiceIdEvents.UPDATE_DOMAIN_ID,
        expect.any(Function)
      );
      expect(fakeInactiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.VoiceIdEvents.UPDATE_DOMAIN_ID,
        expect.any(Function)
      );

      expect(!!connect.core.softphoneParams).toBe(true);
      expect(connect.core.softphoneParams.ringtoneUrl === fakeRingtoneUrl).toBe(true);

      expect(fakeActiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.FAILOVER_PENDING,
        expect.any(Function)
      );
      expect(fakeInactiveConduit.onUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.FAILOVER_PENDING,
        expect.any(Function)
      );

      expect(fakeGrProxyConduit.relayUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.FAILOVER_PENDING);
      expect(fakeGrProxyConduit.relayUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.FAILOVER_INITIATED);
      expect(fakeGrProxyConduit.relayUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.FAILOVER_COMPLETE);
      expect(fakeGrProxyConduit.relayUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.HEARTBEAT_SYN);
      expect(fakeGrProxyConduit.relayUpstream).toHaveBeenCalledWith(connect.GlobalResiliencyEvents.HEARTBEAT_ACK);
    });


    describe('initGRCCP upstream handler behavior', () => {
      let fakeActiveConduit;
      let fakeInactiveConduit;
      let fakeGrProxyConduit;

      // Find the callback initGRCCP registered for a given event on a conduit.
      function handlerFor(conduit, eventType) {
        const call = conduit.onUpstream.mock.calls.find((c) => c[0] === eventType);
        return call && call[1];
      }

      afterEach(() => {
        // These are plain properties restoreMocks doesn't reset; clear so they
        // don't leak into sibling tests (e.g. the "Switch active region" test).
        connect.core.agentDataProviderBackup = undefined;
      });

      beforeEach(() => {
        // onUpstream returns a subscription object: initGRCCP's ACKNOWLEDGE handler
        // calls acgrHandler.unsubscribe() on success, so the return must be unsubscribable.
        const onUpstream = () => jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
        fakeActiveConduit = {
          keepalivemanager: 0, sendUpstream: jest.fn(), onUpstream: onUpstream(),
          iframe: { isIframe: true }, name: 'primary', region: undefined,
        };
        fakeInactiveConduit = {
          keepalivemanager: 0, sendUpstream: jest.fn(), onUpstream: onUpstream(),
          iframe: { isIframe: true }, name: 'secondary', region: undefined,
        };
        fakeGrProxyConduit = {
          setActiveConduit: jest.fn(),
          getActiveConduit: jest.fn().mockReturnValue(fakeActiveConduit),
          getInactiveConduit: jest.fn().mockReturnValue(fakeInactiveConduit),
          getAllConduits: jest.fn().mockReturnValue([fakeActiveConduit, fakeInactiveConduit]),
          getOtherConduit: jest.fn().mockReturnValue(fakeInactiveConduit),
          getConduitByRegion: jest.fn(),
          onUpstream: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
          onAllUpstream: jest.fn(),
          relayUpstream: jest.fn(),
        };

        jest.spyOn(connect, 'GRProxyIframeConduit').mockReturnValue(fakeGrProxyConduit);
        jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
        jest.spyOn(connect.globalResiliency, '_switchActiveRegion').mockReturnValue(true);
        jest.spyOn(connect, 'MediaFactory').mockImplementation(() => {});
        jest.spyOn(connect.core, '_sendIframeStyleDataUpstreamAfterReasonableWaitTime').mockImplementation(() => {});
        jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireAgentUpdateEvents').mockImplementation(() => {});
        connect.core.checkNotInitialized.mockRestore();
        jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);

        connect.core.initCCP(containerDiv, params);
      });

      describe('GlobalResiliencyEvents.INIT handler', () => {
        it('ignores INIT events missing required fields', () => {
          const init = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.INIT);
          init({ instanceRegion: 'us-east-1' }); // missing instanceState/activeRegion
          expect(fakeActiveConduit.sendUpstream).not.toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, expect.anything()
          );
        });

        it('assigns regions, configures the conduit, and performs the first-time active-region switch', () => {
          connect.core.initialized = false;
          const init = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.INIT);

          init({ instanceRegion: 'us-east-1', instanceState: 'active', activeRegion: 'us-east-1' });

          expect(fakeActiveConduit.region).toBe('us-east-1');
          expect(fakeActiveConduit.sendUpstream).toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT, { instanceState: 'active' }
          );
          expect(connect.globalResiliency._switchActiveRegion).toHaveBeenCalledWith(fakeGrProxyConduit, fakeActiveConduit.name);
          expect(connect.core.initialized).toBe(true);
        });

        it('dedupes INIT once core is already initialized (no second switch)', () => {
          connect.core.initialized = true;
          connect.globalResiliency._switchActiveRegion.mockClear();
          const init = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.INIT);

          init({ instanceRegion: 'us-east-1', instanceState: 'active', activeRegion: 'us-east-1' });

          expect(connect.globalResiliency._switchActiveRegion).not.toHaveBeenCalled();
        });
      });

      describe('GlobalResiliencyEvents.FAILOVER_DETECTED handler', () => {
        it('relays FAILOVER_DETECTED_CRM and publishes a metric on a new target region', () => {
          const trigger = jest.spyOn(connect.core.getEventBus(), 'trigger');
          const detected = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_DETECTED);

          detected({ activeRegion: 'us-west-2' });

          expect(trigger).toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.FAILOVER_DETECTED_CRM, { nextActiveRegion: 'us-west-2' }
          );
          expect(connect.publishMetric).toHaveBeenCalledWith({ name: 'GlobalResiliencyFailoverDetected', data: { count: 1 } });
        });

        it('dedupes a repeated FAILOVER_DETECTED for the same target region', () => {
          const trigger = jest.spyOn(connect.core.getEventBus(), 'trigger');
          const detected = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_DETECTED);

          detected({ activeRegion: 'us-west-2' });
          trigger.mockClear();
          detected({ activeRegion: 'us-west-2' }); // same region -> deduped

          expect(trigger).not.toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.FAILOVER_DETECTED_CRM, expect.anything()
          );
        });
      });

      describe('GlobalResiliencyEvents.FAILOVER_INITIATED handler', () => {
        it('errors out (no switch) when the event has no activeRegion', () => {
          connect.globalResiliency._switchActiveRegion.mockClear();
          const initiated = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);

          initiated({});

          expect(connect.globalResiliency._switchActiveRegion).not.toHaveBeenCalled();
        });

        it('switches to the conduit matching the new active region', () => {
          fakeGrProxyConduit.getConduitByRegion.mockReturnValue(fakeInactiveConduit);
          connect.globalResiliency._switchActiveRegion.mockClear().mockReturnValue(true);
          const initiated = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);

          initiated({ activeRegion: 'us-west-2' });

          expect(fakeGrProxyConduit.getConduitByRegion).toHaveBeenCalledWith('us-west-2');
          expect(connect.globalResiliency._switchActiveRegion).toHaveBeenCalledWith(fakeGrProxyConduit, fakeInactiveConduit.name);
        });

        it('falls back to a region-less conduit when no conduit matches the region', () => {
          fakeGrProxyConduit.getConduitByRegion.mockReturnValue(undefined);
          fakeInactiveConduit.region = null; // the region-less conduit to adopt the new region
          fakeActiveConduit.region = 'us-east-1';
          connect.globalResiliency._switchActiveRegion.mockClear().mockReturnValue(true);
          const initiated = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_INITIATED);

          initiated({ activeRegion: 'us-west-2' });

          expect(fakeInactiveConduit.region).toBe('us-west-2');
          expect(connect.globalResiliency._switchActiveRegion).toHaveBeenCalledWith(fakeGrProxyConduit, fakeInactiveConduit.name);
        });
      });

      describe('UPDATE_CONNECTED_CCPS handler', () => {
        it('updates connect.numberOfConnectedCCPs from the event payload length', () => {
          const update = handlerFor(fakeGrProxyConduit, connect.EventType.UPDATE_CONNECTED_CCPS);
          update([{}, {}, {}]);
          expect(connect.numberOfConnectedCCPs).toBe(3);
        });
      });

      describe('GlobalResiliencyEvents.FAILOVER_PENDING handler', () => {
        it('relays FAILOVER_PENDING_CRM and publishes a metric for an active conduit', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
          const trigger = jest.spyOn(connect.core.getEventBus(), 'trigger');
          const pending = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_PENDING);

          pending({ activeRegion: 'us-west-2' });

          expect(trigger).toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.FAILOVER_PENDING_CRM, { nextActiveRegion: 'us-west-2' }
          );
          expect(connect.publishMetric).toHaveBeenCalledWith({ name: 'GlobalResiliencyFailoverPendingReceived', data: { count: 1 } });
        });

        it('ignores FAILOVER_PENDING from a non-active conduit', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
          const trigger = jest.spyOn(connect.core.getEventBus(), 'trigger');
          const pending = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_PENDING);

          pending({ activeRegion: 'us-west-2' });

          expect(trigger).not.toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.FAILOVER_PENDING_CRM, expect.anything()
          );
        });

        it('dedupes a repeated FAILOVER_PENDING (only relays once)', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
          const trigger = jest.spyOn(connect.core.getEventBus(), 'trigger');
          const pending = handlerFor(fakeActiveConduit, connect.GlobalResiliencyEvents.FAILOVER_PENDING);

          pending({ activeRegion: 'us-west-2' });
          trigger.mockClear();
          pending({ activeRegion: 'us-west-2' }); // deduped via hasSentFailoverPending

          expect(trigger).not.toHaveBeenCalledWith(
            connect.GlobalResiliencyEvents.FAILOVER_PENDING_CRM, expect.anything()
          );
        });
      });

      describe('ACKNOWLEDGE handler (global signin validation)', () => {
        it('completes initialization when global signin validation succeeds', () => {
          // Drive _validateGlobalSignin's onSuccess (4th arg) synchronously.
          jest.spyOn(connect.globalResiliency, '_validateGlobalSignin')
            .mockImplementation((conduit, params, data, onSuccess) => onSuccess());
          jest.spyOn(connect.globalResiliency, '_completeAcknowledgeInitialization').mockImplementation(() => {});
          const ack = handlerFor(fakeActiveConduit, connect.EventType.ACKNOWLEDGE);

          ack({ some: 'data' });

          expect(connect.globalResiliency._completeAcknowledgeInitialization).toHaveBeenCalledTimes(1);
        });

        it('triggers ACK_TIMEOUT retry when validation fails for the active conduit', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
          jest.spyOn(connect.globalResiliency, '_validateGlobalSignin')
            .mockImplementation((conduit, params, data, onSuccess, onFailure) => onFailure());
          jest.spyOn(connect.globalResiliency, '_completeAcknowledgeInitialization').mockImplementation(() => {});
          var triggered = jest.spyOn(connect.core.getEventBus(), 'trigger');
          connect.globalResiliency.conduitTimerContainerMap = {
            primary: { ccpLoadTimeoutInstance: null },
            secondary: { ccpLoadTimeoutInstance: null },
          };
          const ack = handlerFor(fakeActiveConduit, connect.EventType.ACKNOWLEDGE);

          ack({ some: 'data' });

          expect(connect.globalResiliency._completeAcknowledgeInitialization).not.toHaveBeenCalled();
          expect(triggered).toHaveBeenCalledWith(connect.EventType.ACK_TIMEOUT);
        });
      });

      describe('FETCH_AGENT_DATA_FROM_CCP handler', () => {
        it('swaps the backup provider in when one exists', () => {
          var backup = { updateAgentData: jest.fn() };
          connect.core.agentDataProviderBackup = backup;
          const fetch = handlerFor(fakeGrProxyConduit, connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);

          fetch({ agent: 'data' });

          expect(backup.updateAgentData).toHaveBeenCalledWith({ agent: 'data' });
          expect(connect.core.agentDataProvider).toBe(backup);
          expect(connect.core.agentDataProviderBackup).toBeNull();
        });

        it('updates the existing provider in place when there is no backup', () => {
          connect.core.agentDataProviderBackup = null;
          var provider = { updateAgentData: jest.fn() };
          connect.core.agentDataProvider = provider;
          const fetch = handlerFor(fakeGrProxyConduit, connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP);

          fetch({ agent: 'data' });

          expect(provider.updateAgentData).toHaveBeenCalledWith({ agent: 'data' });
        });
      });

      describe('VoiceIdEvents.UPDATE_DOMAIN_ID handler', () => {
        it('caches the domainId on the conduit and on core for the active conduit', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);
          const update = handlerFor(fakeActiveConduit, connect.VoiceIdEvents.UPDATE_DOMAIN_ID);

          update({ domainId: 'domain-123' });

          expect(fakeActiveConduit.voiceIdDomainId).toBe('domain-123');
          expect(connect.core.voiceIdDomainId).toBe('domain-123');
        });

        it('does not set core domainId for a non-active conduit', () => {
          jest.spyOn(connect, 'isActiveConduit').mockReturnValue(false);
          connect.core.voiceIdDomainId = undefined;
          const update = handlerFor(fakeInactiveConduit, connect.VoiceIdEvents.UPDATE_DOMAIN_ID);

          update({ domainId: 'domain-xyz' });

          expect(fakeInactiveConduit.voiceIdDomainId).toBe('domain-xyz');
          expect(connect.core.voiceIdDomainId).toBeUndefined();
        });
      });
    });

    it('Multiple calls to initCCP does not append multiple CCP iframes', () => {
      jest.spyOn(connect, 'MediaFactory').mockImplementation(() => {});
      jest.spyOn(connect.core.AgentDataProvider.prototype, '_fireAgentUpdateEvents').mockImplementation(() => {});
      jest.spyOn(connect.Conduit.prototype, 'sendUpstream').mockReturnValue(null);
      jest.spyOn(connect.Conduit.prototype, 'sendDownstream').mockImplementation(() => {});
      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      connect.core.checkNotInitialized.mockRestore();
      jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(false);
      document.createElement.mockClear();
      containerDiv.appendChild.mockClear();

      connect.core.initCCP(containerDiv, params);
      // The iframe is created, but window.document.getElementsByTagName will not show them because they
      // don't actually exist on a real page.
      jest.spyOn(connect.core, '_getCCPIframe').mockReturnValue(true);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);
      connect.core.initCCP(containerDiv, params);

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(document.createElement).toHaveBeenCalledTimes(2);
      expect(containerDiv.appendChild).toHaveBeenCalledTimes(2);
    });

    it('Initialize region', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
      };
      connect.ChatSession = { setRegionOverride: jest.fn() };

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

      expect(connect.core.keepaliveManager !== null).toBe(true);
      expect(checkClient !== null).toBe(true);
      expect(checkMasterClient !== null).toBe(true);
      expect(connect.core.agentDataProvider !== null).toBe(true);
      expect(fakeGrProxyConduit.getActiveConduit().sendUpstream).toHaveBeenCalledWith(
        connect.AgentEvents.FETCH_AGENT_DATA_FROM_CCP
      );
      expect(connect.core.mediaFactory !== null).toBe(true);

      expect(connect.core._showIframe).toHaveBeenCalledTimes(1);
      expect(connect.core._hideIframe).toHaveBeenCalledTimes(1);

      expect(connect.globalResiliency._activeRegion === region).toBe(true);
      expect(connect.ChatSession.setRegionOverride).toHaveBeenCalledWith(region);

      expect(fakeGrProxyConduit.getActiveConduit().sendUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT,
        { instanceState: 'active' }
      );
      expect(fakeGrProxyConduit.getInactiveConduit().sendUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT,
        { instanceState: 'inactive' }
      );
    });

    it('Initialize region without region param', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
      };
      connect.ChatSession = { setRegionOverride: jest.fn() };

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

      expect(connect.core.keepaliveManager !== null).toBe(true);
      expect(checkClient !== null).toBe(true);
      expect(checkMasterClient !== null).toBe(true);
      expect(connect.core.agentDataProvider == null).toBe(true);
      expect(connect.core.mediaFactory !== null).toBe(true);

      expect(connect.core._showIframe).toHaveBeenCalledTimes(1);
      expect(connect.core._hideIframe).toHaveBeenCalledTimes(1);

      expect(connect.globalResiliency._activeRegion !== region).toBe(true);
      expect(connect.ChatSession.setRegionOverride).not.toHaveBeenCalled();

      expect(fakeGrProxyConduit.getActiveConduit().sendUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT,
        { instanceState: 'active' }
      );
      expect(fakeGrProxyConduit.getInactiveConduit().sendUpstream).toHaveBeenCalledWith(
        connect.GlobalResiliencyEvents.CONFIGURE_CCP_CONDUIT,
        { instanceState: 'inactive' }
      );
    });

    it('Switch active region', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      connect.core.softphoneManager = { _clearAllSessions: jest.fn() };

      const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);

      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'CalledInternalSwitchActiveRegionSuccessful',
        data: { count: 1 },
      });

      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledTimes(1);
      expect(connect.core.softphoneManager._clearAllSessions).toHaveBeenCalledTimes(1);
      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledWith(grProxyConduit.conduits[1].name);
      expect(didSwitch).toBe(true);

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(connect.core.agentDataProviderBackup).toBeUndefined();
    });

    it('Switch active region succeeds when softphoneManager is absent (optional-chaining skips _clearAllSessions)', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      connect.core.softphoneManager = undefined;

      const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);

      expect(didSwitch).toBe(true);
      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledWith(grProxyConduit.conduits[1].name);
    });

    it('Switch active region only triggers once', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest
        .fn()
        .mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), name: grProxyConduit.conduits[0].name });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});
      connect.globalResiliency._activeRegion = null;
      grProxyConduit.conduits[0].region = 'us-west-2';
      grProxyConduit.conduits[1].region = 'us-east-1';

      let didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
      connect.globalResiliency._activeRegion = grProxyConduit.conduits[0].region; // init active region sets this but is being mocked
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(didSwitch).toBe(true);

      didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(didSwitch).toBe(false);

      didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(didSwitch).toBe(false);

      didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(didSwitch).toBe(false);

      didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[0].name);
      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);
      expect(didSwitch).toBe(false);

      expect(grProxyConduit.setActiveConduit).toHaveBeenCalled();
      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledWith(grProxyConduit.conduits[0].name);
      expect(didSwitch).toBe(false);

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);

      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'CalledInternalSwitchActiveRegionSuccessful',
        data: { count: 1 },
      });
    });

    it('Switch active region, trying with another region', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest
        .fn()
        .mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), name: grProxyConduit.conduits[1].name });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      grProxyConduit.conduits[0].region = 'us-west-2';
      grProxyConduit.conduits[1].region = 'us-east-1';

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});

      const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, grProxyConduit.conduits[1].name);

      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledTimes(1);
      expect(grProxyConduit.setActiveConduit).toHaveBeenCalledWith('http://localhost2');
      expect(didSwitch).toBe(true);

      expect(connect.globalResiliency._initializeActiveRegion).toHaveBeenCalledTimes(1);

      expect(connect.publishMetric).toHaveBeenCalledWith({
        name: 'CalledInternalSwitchActiveRegionSuccessful',
        data: { count: 1 },
      });
    });

    it('Switch active region does nothing if grproxyconduit invalid', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});

      const didSwitch = connect.globalResiliency._switchActiveRegion({ foo: 2 }, grProxyConduit.conduits[1].name);

      expect(grProxyConduit.setActiveConduit).not.toHaveBeenCalled();
      expect(connect.globalResiliency._initializeActiveRegion).not.toHaveBeenCalled();
      expect(didSwitch).toBe(false);
    });

    it('Switch active region does nothing if conduit name is invalid', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.setActiveConduit = jest.fn();
      grProxyConduit.getActiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });
      grProxyConduit.getInactiveConduit = jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() });

      jest.spyOn(connect.globalResiliency, '_initializeActiveRegion').mockImplementation(() => {});

      const didSwitch = connect.globalResiliency._switchActiveRegion(grProxyConduit, 'foo');

      expect(grProxyConduit.setActiveConduit).not.toHaveBeenCalled();
      expect(connect.globalResiliency._initializeActiveRegion).not.toHaveBeenCalled();
      expect(didSwitch).toBe(false);
    });

    it('should call _initiateRtcPeerConnectionManager when initialize region', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
      };

      connect.core.softphoneManager = { _initiateRtcPeerConnectionManager: jest.fn() };

      const region = 'us-east-1';

      const oldClient = connect.core.client;
      const oldMasterClient = connect.core.masterClient;

      connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, region);

      // Need to reset these or softphone unit test will fail due to missing client
      connect.core.masterClient = oldMasterClient;
      connect.core.client = oldClient;

      expect(connect.core.softphoneManager._initiateRtcPeerConnectionManager).toHaveBeenCalledTimes(1);
    });

    it('should create a backup agent data provider if one is already created', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn() }),
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

      expect(connect.core.agentDataProvider).toBe(providerMock);
      expect(connect.core.agentDataProviderBackup).toBeDefined();
    });

    it('destroys the existing agentDataProvider when a region is provided', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), iframe: {} }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), iframe: {} }),
      };
      const destroy = jest.fn();
      const oldClient = connect.core.client;
      const oldMasterClient = connect.core.masterClient;
      connect.core.agentDataProvider = { destroy };

      connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, 'us-east-1');

      connect.core.masterClient = oldMasterClient;
      connect.core.client = oldClient;

      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('does not touch the agentDataProvider when no region is provided', () => {
      const fakeGrProxyConduit = {
        setActiveConduit: jest.fn(),
        getActiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), iframe: {} }),
        getInactiveConduit: jest.fn().mockReturnValue({ keepalivemanager: 0, sendUpstream: jest.fn(), iframe: {} }),
      };
      const destroy = jest.fn();
      const oldClient = connect.core.client;
      const oldMasterClient = connect.core.masterClient;
      connect.core.agentDataProvider = { destroy };

      connect.globalResiliency._initializeActiveRegion(fakeGrProxyConduit, undefined);

      connect.core.masterClient = oldMasterClient;
      connect.core.client = oldClient;

      expect(destroy).not.toHaveBeenCalled();
    });

    describe('connect.globalResiliency.setupAcgrAuthHandlers()', () => {
      let localParams;
      let grProxyConduit;
      let eventBusSpy;
      let authenticateAcgrSpy;
      let localContainerDiv;
      let conduitTimerContainerMap;

      beforeEach(() => {
        localContainerDiv = { appendChild: jest.fn(), getAllConduit: jest.fn() };

        authenticateAcgrSpy = jest
          .spyOn(connect.globalResiliency, 'authenticateAcgr')
          .mockImplementation(() => {});

        grProxyConduit = {
          getActiveConduit: jest.fn().mockReturnValue({
            name: 'test-conduit',
            onUpstream: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
          }),
        };
        conduitTimerContainerMap = {};

        localParams = {
          ccpUrl: 'url.com',
          loginOptions: {},
          ccpAckTimeout: 3000,
        };

        connect.agent.initialized = true;
        connect.core.eventBus = new connect.EventBus({ logEvents: true });
        eventBusSpy = jest.spyOn(connect.core.eventBus, 'subscribe');
      });

      afterEach(() => {
        connect.agent.initialized = false;
        connect.core.initialized = false;
        connect.core.eventBus = null;
      });

      it('should subscribe to ACK_TIMEOUT event', () => {
        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        expect(eventBusSpy).toHaveBeenCalledWith(connect.EventType.ACK_TIMEOUT, expect.any(Function));
      });

      it('should subscribe to TERMINATED event when disableAuthPopupAfterLogout is not set', () => {
        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        expect(eventBusSpy).toHaveBeenCalledWith(connect.EventType.TERMINATED, expect.any(Function));
      });

      it('should subscribe to AUTH_FAIL event when disableAuthPopupAfterLogout is not set', () => {
        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        expect(eventBusSpy).toHaveBeenCalledWith(connect.EventType.AUTH_FAIL, expect.any(Function));
      });

      it('should not subscribe to TERMINATED and AUTH_FAIL when disableAuthPopupAfterLogout is true', () => {
        localParams.loginOptions.disableAuthPopupAfterLogout = true;

        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        const terminatedCall = eventBusSpy.mock.calls.find((call) => call[0] === connect.EventType.TERMINATED);
        const authFailCall = eventBusSpy.mock.calls.find((call) => call[0] === connect.EventType.AUTH_FAIL);

        expect(terminatedCall).toBeUndefined();
        expect(authFailCall).toBeUndefined();
      });

      it('should call authenticateAcgr immediately on ACK_TIMEOUT', () => {
        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        const ackTimeoutHandler = eventBusSpy.mock.calls.find(
          (call) => call[0] === connect.EventType.ACK_TIMEOUT
        )[1];
        ackTimeoutHandler();

        expect(connect.globalResiliency.authenticateAcgr).toHaveBeenCalledTimes(1);
        expect(connect.globalResiliency.authenticateAcgr).toHaveBeenCalledWith(
          localParams,
          localContainerDiv,
          grProxyConduit
        );
      });

      it('should call authenticateAcgr with delay on TERMINATED event', () => {
        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        const terminatedHandler = eventBusSpy.mock.calls.find(
          (call) => call[0] === connect.EventType.TERMINATED
        )[1];
        terminatedHandler();

        expect(authenticateAcgrSpy).not.toHaveBeenCalled();

        jest.advanceTimersByTime(localParams.ccpAckTimeout);

        expect(authenticateAcgrSpy).toHaveBeenCalledTimes(1);
      });

      it('should use default CCP_ACK_TIMEOUT when ccpAckTimeout is not provided', () => {
        delete localParams.ccpAckTimeout;

        connect.globalResiliency.setupAcgrAuthHandlers(localParams, localContainerDiv, grProxyConduit);

        const terminatedHandler = eventBusSpy.mock.calls.find(
          (call) => call[0] === connect.EventType.TERMINATED
        )[1];
        terminatedHandler();

        jest.advanceTimersByTime(10000); // Default CCP_ACK_TIMEOUT
        expect(connect.globalResiliency.authenticateAcgr).toHaveBeenCalledTimes(1);
      });

      it('should publish GlobalResiliencySigninValidationRetriesExhausted metric when retries exhausted with validation failures', () => {
        const activeConduit = {
          name: 'primary',
          onUpstream: jest.fn(),
        };

        grProxyConduit = {
          getActiveConduit: jest.fn().mockReturnValue(activeConduit),
        };

        connect.globalResiliency.setupAcgrAuthHandlers(
          localParams,
          localContainerDiv,
          grProxyConduit,
          conduitTimerContainerMap
        );

        const signinInvalidHandler = activeConduit.onUpstream.mock.calls.find(
          (call) => call[0] === connect.GlobalResiliencyEvents.GLOBAL_SIGNIN_INVALID
        );

        signinInvalidHandler[1]();
        signinInvalidHandler[1]();
        signinInvalidHandler[1]();

        const retriesExhaustedHandler = eventBusSpy.mock.calls.find(
          (call) => call[0] === connect.EventType.IFRAME_RETRIES_EXHAUSTED
        )[1];
        retriesExhaustedHandler('primary');

        expect(connect.publishMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'GlobalResiliencySigninValidationRetriesExhausted',
            data: { count: 3 },
          })
        );
      });

      it('should NOT publish GlobalResiliencySigninValidationRetriesExhausted metric when retries exhausted without validation failures', () => {
        const activeConduit = {
          name: 'primary',
          onUpstream: jest.fn(),
        };

        grProxyConduit = {
          getActiveConduit: jest.fn().mockReturnValue(activeConduit),
        };

        connect.globalResiliency.setupAcgrAuthHandlers(
          localParams,
          localContainerDiv,
          grProxyConduit,
          conduitTimerContainerMap
        );

        const retriesExhaustedHandler = eventBusSpy.mock.calls.find(
          (call) => call[0] === connect.EventType.IFRAME_RETRIES_EXHAUSTED
        )[1];
        retriesExhaustedHandler('primary');

        expect(connect.publishMetric).not.toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'GlobalResiliencySigninValidationRetriesExhausted',
          })
        );
      });
    });

    describe('connect.globalResiliency.authenticateAcgr()', () => {
      let localParams;
      let localContainerDiv;
      let grProxyConduit;
      let activeConduit;
      let inactiveConduit;

      beforeEach(() => {
        localParams = {
          loginPopup: true,
          loginUrl: 'http://loginUrl.com',
          loginOptions: { autoClose: true },
        };
        localContainerDiv = { appendChild: jest.fn() };

        activeConduit = {
          name: 'primary',
          iframe: { src: 'http://primary.com' },
          onUpstream: jest.fn(),
        };

        inactiveConduit = {
          name: 'secondary',
          iframe: { src: 'http://secondary.com' },
          onUpstream: jest.fn(),
        };

        grProxyConduit = {
          getAllConduits: jest.fn().mockReturnValue([activeConduit, inactiveConduit]),
        };

        connect.globalResiliency.conduitTimerContainerMap = {
          primary: { iframeRefreshTimeout: null },
          secondary: { iframeRefreshTimeout: null },
        };

        jest.spyOn(connect, 'isActiveConduit').mockReturnValue(true);

        connect.core.loginWindow = null;
      });

      it('should start iframe refresh for each conduit', () => {
        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        expect(connect.core._refreshIframeOnTimeout).toHaveBeenCalledTimes(2);
      });

      it('opens the login popup by default (loginPopup not false)', () => {
        const openWithLock = jest.spyOn(connect.core, '_openPopupWithLock').mockImplementation(() => {});
        jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({ clear: jest.fn() });

        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        expect(openWithLock).toHaveBeenCalledWith(localParams.loginUrl, localParams.loginOptions);
      });

      it('does not open the login popup when loginPopup is explicitly false', () => {
        const openWithLock = jest.spyOn(connect.core, '_openPopupWithLock').mockImplementation(() => {});
        jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({ clear: jest.fn() });

        connect.globalResiliency.authenticateAcgr({ ...localParams, loginPopup: false }, localContainerDiv, grProxyConduit);

        expect(openWithLock).not.toHaveBeenCalled();
      });

      it('isolates a login-popup failure so authentication still proceeds to iframe refresh', () => {
        jest.spyOn(connect.core, '_openPopupWithLock').mockImplementation(() => { throw new Error('popup blocked'); });
        jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({ clear: jest.fn() });

        expect(() => connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit)).not.toThrow();
        expect(connect.core._refreshIframeOnTimeout).toHaveBeenCalledTimes(2);
      });

      it("should pass globalResiliencyRegion as 'primary' for active conduit", () => {
        connect.isActiveConduit.mockImplementation((c) => c === activeConduit);

        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        const primaryCall = connect.core._refreshIframeOnTimeout.mock.calls.find(
          (call) => call[0].ccpUrl === activeConduit.iframe.src
        );

        expect(primaryCall[0].globalResiliencyRegion).toBe('primary');
      });

      it("should pass globalResiliencyRegion as 'secondary' for inactive conduit", () => {
        connect.isActiveConduit.mockImplementation((c) => c === activeConduit);

        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        const secondaryCall = connect.core._refreshIframeOnTimeout.mock.calls.find(
          (call) => call[0].ccpUrl === inactiveConduit.iframe.src
        );

        expect(secondaryCall[0].globalResiliencyRegion).toBe('secondary');
      });

      it('should not refresh iframe if refresh timeout already exists', () => {
        connect.globalResiliency.conduitTimerContainerMap['primary'].iframeRefreshTimeout = 123;

        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        const primaryCalls = connect.core._refreshIframeOnTimeout.mock.calls.filter(
          (call) => call[0].ccpUrl === activeConduit.iframe.src
        );

        expect(primaryCalls.length).toBe(0);
      });

      it('should setup ACKNOWLEDGE handler to stop iframe refresh', () => {
        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        expect(activeConduit.onUpstream).toHaveBeenCalledWith(connect.EventType.ACKNOWLEDGE, expect.any(Function));
        expect(inactiveConduit.onUpstream).toHaveBeenCalledWith(connect.EventType.ACKNOWLEDGE, expect.any(Function));
      });

      it('should handle iframe refresh errors gracefully', () => {
        connect.core._refreshIframeOnTimeout.mockImplementation(() => {
          throw new Error('Refresh failed');
        });

        connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);

        expect(connect.core._refreshIframeOnTimeout).toHaveBeenCalled();
      });

      describe('ACKNOWLEDGE handler validation callbacks', () => {
        let popupClear;

        function fireAckHandler() {
          connect.globalResiliency.authenticateAcgr(localParams, localContainerDiv, grProxyConduit);
          const ackCall = activeConduit.onUpstream.mock.calls.find(
            (call) => call[0] === connect.EventType.ACKNOWLEDGE
          );
          ackCall[1]({});
        }

        beforeEach(() => {
          // The ACKNOWLEDGE handler is only registered when iframeRefreshTimeout is
          // null (the conduitTimerContainerMap default set above), so leave it null.
          // onUpstream must return a subscription: the onSuccess body unsubscribes.
          activeConduit.onUpstream = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
          inactiveConduit.onUpstream = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
          popupClear = jest.fn();
          jest.spyOn(connect.core, 'getPopupManager').mockReturnValue({ clear: popupClear });
          connect.globalResiliency.conduitTimerContainerMap.primary.iframeRefreshAttempt = 3;
        });

        it('resets the refresh attempt, clears the popup, and closes the login window on validation success with autoClose', () => {
          connect.core.loginWindow = { close: jest.fn() };
          const loginWindowClose = connect.core.loginWindow.close;
          jest.spyOn(connect.globalResiliency, '_validateGlobalSignin').mockImplementation(
            (conduit, params, data, onSuccess) => onSuccess()
          );

          fireAckHandler();

          expect(connect.globalResiliency.conduitTimerContainerMap.primary.iframeRefreshTimeout).toBeNull();
          expect(connect.globalResiliency.conduitTimerContainerMap.primary.iframeRefreshAttempt).toBe(0);
          expect(popupClear).toHaveBeenCalledWith(connect.MasterTopics.LOGIN_POPUP);
          expect(loginWindowClose).toHaveBeenCalledTimes(1);
          expect(connect.core.loginWindow).toBeNull();
        });

        it('keeps the login window open on validation success when autoClose is false', () => {
          localParams.loginOptions.autoClose = false;
          connect.core.loginWindow = { close: jest.fn() };
          const loginWindowClose = connect.core.loginWindow.close;
          jest.spyOn(connect.globalResiliency, '_validateGlobalSignin').mockImplementation(
            (conduit, params, data, onSuccess) => onSuccess()
          );

          fireAckHandler();

          expect(connect.globalResiliency.conduitTimerContainerMap.primary.iframeRefreshAttempt).toBe(0);
          expect(loginWindowClose).not.toHaveBeenCalled();
          expect(connect.core.loginWindow).not.toBeNull();
        });

        it('warns via the active conduit and does not reset state on validation failure', () => {
          connect.core.loginWindow = { close: jest.fn() };
          const loginWindowClose = connect.core.loginWindow.close;
          jest.spyOn(connect.globalResiliency, '_validateGlobalSignin').mockImplementation(
            (conduit, params, data, onSuccess, onFailure) => onFailure()
          );

          fireAckHandler();

          expect(connect.globalResiliency.conduitTimerContainerMap.primary.iframeRefreshAttempt).toBe(3);
          expect(loginWindowClose).not.toHaveBeenCalled();
        });
      });
    });
  });
});
