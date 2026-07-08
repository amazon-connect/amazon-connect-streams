describe('Streams', () => {
  describe('WindowStream', () => {
    it('sends a message to the window via postMessage with the configured domain', () => {
      const win = { postMessage: jest.fn(), addEventListener: jest.fn() };
      const windowStream = new connect.WindowStream(win, 'amazon.com');

      windowStream.send({ foo: 'bar' });
      expect(win.postMessage).toHaveBeenCalledWith({ foo: 'bar' }, 'amazon.com');
    });

    it('registers an onMessage handler on the window', () => {
      const win = { postMessage: jest.fn(), addEventListener: jest.fn() };
      const handler = jest.fn();
      const windowStream = new connect.WindowStream(win, 'amazon.com');

      windowStream.onMessage(handler);
      expect(win.addEventListener).toHaveBeenCalledWith('message', handler);
    });

    it("defaults the domain to '*' when none is provided", () => {
      const windowStream = new connect.WindowStream(window);
      expect(windowStream.domain).toBe('*');
    });
  });

  describe('WindowIOStream', () => {
    it('sends a message on the output window via postMessage', () => {
      const input = { addEventListener: jest.fn() };
      const output = { postMessage: jest.fn() };
      const windowIOStream = new connect.WindowIOStream(input, output, 'amazon.com');

      windowIOStream.send({ foo: 'bar' });
      expect(output.postMessage).toHaveBeenCalledWith({ foo: 'bar' }, 'amazon.com');
    });

    it('only forwards input messages that originate from the output window', () => {
      const input = { addEventListener: jest.fn() };
      const output = {};
      const handler = jest.fn();
      const windowIOStream = new connect.WindowIOStream(input, output, 'amazon.com');

      windowIOStream.onMessage(handler);
      const listener = input.addEventListener.mock.calls[0][1];

      listener({ source: output, data: 'fromOutput' });
      expect(handler).toHaveBeenCalledTimes(1);

      listener({ source: {}, data: 'fromElsewhere' });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('PortStream', () => {
    it('sends a message on the port and registers an onMessage handler', () => {
      const port = { postMessage: jest.fn(), addEventListener: jest.fn() };
      const handler = jest.fn();
      const portStream = new connect.PortStream(port);

      portStream.send({ foo: 'bar' });
      expect(port.postMessage).toHaveBeenCalledWith({ foo: 'bar' });

      portStream.onMessage(handler);
      expect(port.addEventListener).toHaveBeenCalledWith('message', handler);
    });

    it('exposes a stable generated id via getId', () => {
      const portStream = new connect.PortStream({});
      expect(typeof portStream.getId()).toBe('string');
      expect(portStream.getId()).toBe(portStream.getId());
    });
  });

  describe('Stream base class', () => {
    it('throws NotImplementedError for send and onMessage', () => {
      const stream = new connect.Stream();
      expect(() => stream.send({})).toThrow(connect.NotImplementedError);
      expect(() => stream.onMessage(() => {})).toThrow(connect.NotImplementedError);
    });
  });

  describe('StreamMultiplexer', () => {
    let portA;
    let portB;

    function makePortStream(id, port) {
      return {
        getId: () => id,
        port,
        send: jest.fn(),
        onMessage: jest.fn(),
      };
    }

    beforeEach(() => {
      portA = makePortStream('a', { name: 'portA' });
      portB = makePortStream('b', { name: 'portB' });
    });

    it('broadcasts a message to every stream', () => {
      const mux = new connect.StreamMultiplexer([portA, portB]);
      mux.send({ foo: 'bar' });

      expect(portA.send).toHaveBeenCalledWith({ foo: 'bar' });
      expect(portB.send).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('registers an onMessage listener on all existing streams', () => {
      const mux = new connect.StreamMultiplexer([portA, portB]);
      const handler = jest.fn();

      mux.onMessage(handler);
      expect(portA.onMessage).toHaveBeenCalledWith(handler);
      expect(portB.onMessage).toHaveBeenCalledWith(handler);
    });

    it('applies existing listeners to a stream added later', () => {
      const mux = new connect.StreamMultiplexer([portA]);
      const handler = jest.fn();
      mux.onMessage(handler);

      mux.addStream(portB);
      expect(portB.onMessage).toHaveBeenCalledWith(handler);
      expect(mux.getStreams()).toContain(portB);
    });

    it('removes a stream from the multiplexer', () => {
      const mux = new connect.StreamMultiplexer([portA, portB]);
      mux.removeStream(portA);

      expect(mux.getStreams()).not.toContain(portA);
      expect(mux.getStreams()).toContain(portB);
    });

    it('finds the stream matching a given port', () => {
      const mux = new connect.StreamMultiplexer([portA, portB]);
      expect(mux.getStreamForPort(portB.port)).toBe(portB);
      expect(mux.getStreamForPort({ name: 'unknown' })).toBeNull();
    });
  });

  describe('Conduit', () => {
    let testUpstream;
    let testDownstream;
    let mockData;

    beforeEach(() => {
      testUpstream = {
        send: jest.fn(),
        onMessage: jest.fn(),
      };
      testDownstream = {
        send: jest.fn(),
        onMessage: jest.fn(),
      };
      mockData = {
        foo: 3,
        bar: 'some_string',
      };
    });

    it('validate send downstream and upstream APIs are unaffected by the postmessage filter', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      conduit.sendUpstream('Event', mockData);
      expect(conduit.upstream.send).toHaveBeenCalledTimes(1);
      expect(conduit.upstream.send).toHaveBeenCalledWith({ event: 'Event', data: mockData });

      conduit.sendDownstream('Event', mockData);
      expect(conduit.downstream.send).toHaveBeenCalledTimes(1);
      expect(conduit.downstream.send).toHaveBeenCalledWith({ event: 'Event', data: mockData });

      conduit.setInactive();
      conduit.sendUpstream('Event', mockData);
      conduit.sendDownstream('Event', mockData);
      expect(conduit.upstream.send).toHaveBeenCalledTimes(2);
      expect(conduit.downstream.send).toHaveBeenCalledTimes(2);
    });

    it('blocks pass downstream and upstream events when the postmessage filter is inactive', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      conduit.setInactive();

      conduit.passUpstream()(mockData, 'Event');
      expect(conduit.upstream.send).not.toHaveBeenCalled();

      conduit.passDownstream()(mockData, 'Event');
      expect(conduit.downstream.send).not.toHaveBeenCalled();
    });

    it('passes downstream and upstream events after the filter is toggled back to active', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      conduit.setInactive();
      conduit.setActive();

      conduit.passUpstream()(mockData, 'Event');
      expect(conduit.upstream.send).toHaveBeenCalledTimes(1);
      expect(conduit.upstream.send).toHaveBeenCalledWith({ event: 'Event', data: mockData });

      conduit.passDownstream()(mockData, 'Event');
      expect(conduit.downstream.send).toHaveBeenCalledTimes(1);
      expect(conduit.downstream.send).toHaveBeenCalledWith({ event: 'Event', data: mockData });
    });

    it('blocks pass downstream and upstream events again after toggling active then inactive', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      conduit.setInactive();
      conduit.setActive();
      conduit.setInactive();

      conduit.passUpstream()(mockData, 'Event');
      expect(conduit.upstream.send).not.toHaveBeenCalled();

      conduit.passDownstream()(mockData, 'Event');
      expect(conduit.downstream.send).not.toHaveBeenCalled();
    });

    it('passes allow listed events even when the filter is inactive', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      conduit.setInactive();

      for (const event of conduit.allowedEvents) {
        conduit.passUpstream()(mockData, event);
        expect(conduit.upstream.send).toHaveBeenCalledWith({ event, data: mockData });

        conduit.passDownstream()(mockData, event);
        expect(conduit.downstream.send).toHaveBeenCalledWith({ event, data: mockData });
      }
    });

    it('validate postmessage filter allowed events', () => {
      const conduit = new connect.Conduit('ConnectSharedWorkerConduit', testUpstream, testDownstream);

      const eventsThatShouldBeAllowed = [
        ...Object.entries(connect.GlobalResiliencyEvents).map((keyValue) => keyValue[1]),
        connect.EventType.CONFIGURE,
        connect.EventType.SYNCHRONIZE,
        connect.EventType.ACKNOWLEDGE,
        connect.EventType.LOG,
        connect.EventType.SERVER_BOUND_INTERNAL_LOG,
        connect.EventType.DOWNLOAD_LOG_FROM_CCP,
      ];

      expect(conduit.allowedEvents.length === eventsThatShouldBeAllowed.length).toBe(true);
      for (const event of eventsThatShouldBeAllowed) {
        expect(conduit.allowedEvents.includes(event)).toBe(true);
      }
    });
  });

  describe('GRProxyConduit', () => {
    let primaryIframe;
    let secondaryIframe;
    let containerDiv;
    let params;
    let conduitParam;

    beforeEach(() => {
      containerDiv = { appendChild: jest.fn() };
      const softphoneParams = { ringtoneUrl: 'customVoiceRingtone.amazon.com' };
      const chatParams = { ringtoneUrl: 'customChatRingtone.amazon.com' };
      const taskParams = { ringtoneUrl: 'customTaskRingtone.amazon.com' };
      const pageOptionsParams = {
        enableAudioDeviceSettings: false,
        enablePhoneTypeSettings: true,
      };
      const shouldAddNamespaceToLogs = false;
      params = {
        enableGlobalResiliency: true,
        ccpUrl: 'url.com',
        secondaryCCPUrl: 'url2.com',
        loginUrl: 'loginUrl.com',
        softphone: softphoneParams,
        chat: chatParams,
        task: taskParams,
        loginOptions: { autoClose: true },
        pageOptions: pageOptionsParams,
        shouldAddNamespaceToLogs,
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

      primaryIframe.src = 'http://localhost.com';
      secondaryIframe.src = 'http://localhost2.com';

      conduitParam = [
        { iframe: primaryIframe, label: 'primary' },
        { iframe: secondaryIframe, label: 'secondary' },
      ];
    });

    it('validate getAllConduits returns conduits', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit instanceof connect.IFrameConduit).toBe(true);
      });
    });

    it('validate onUpstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.onUpstream = jest.fn();
      });

      const sub = grProxyConduit.onUpstream('Event', () => {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.onUpstream).toHaveBeenCalledTimes(1);
      });

      expect(typeof sub.unsubscribe === 'function').toBe(true);
    });

    it('validate onAllUpstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.onAllUpstream = jest.fn();
      });

      const sub = grProxyConduit.onAllUpstream(() => {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.onAllUpstream).toHaveBeenCalledTimes(1);
      });

      expect(typeof sub.unsubscribe === 'function').toBe(true);
    });

    it('validate onDownstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.onDownstream = jest.fn();
      });

      const sub = grProxyConduit.onDownstream('Event', () => {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.onDownstream).toHaveBeenCalledTimes(1);
      });

      expect(typeof sub.unsubscribe === 'function').toBe(true);
    });

    it('validate onAllDownstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.onAllDownstream = jest.fn();
      });

      const sub = grProxyConduit.onAllDownstream(() => {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.onAllDownstream).toHaveBeenCalledTimes(1);
      });

      expect(typeof sub.unsubscribe === 'function').toBe(true);
    });

    it('validate sendUpstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.sendUpstream = jest.fn();
      });

      grProxyConduit.sendUpstream('Event', {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
      });
    });

    it('validate sendDownstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.sendDownstream = jest.fn();
      });

      grProxyConduit.sendDownstream('Event', {});

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.sendDownstream).toHaveBeenCalledTimes(1);
      });
    });

    it('validate getActiveConduit', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      expect(grProxyConduit.getActiveConduit() instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getActiveConduit().name === 'http://localhost.com').toBe(true);
    });

    it('validate getInactiveConduit', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      expect(grProxyConduit.getInactiveConduit() instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getInactiveConduit().name === 'http://localhost2.com').toBe(true);
    });

    it('validate getOtherConduit', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      expect(grProxyConduit.getOtherConduit(grProxyConduit.getActiveConduit()) instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getOtherConduit(grProxyConduit.getInactiveConduit()) instanceof connect.IFrameConduit).toBe(true);

      expect(grProxyConduit.getOtherConduit(grProxyConduit.getActiveConduit()).name === 'http://localhost2.com').toBe(true);
      expect(grProxyConduit.getOtherConduit(grProxyConduit.getInactiveConduit()).name === 'http://localhost.com').toBe(true);
    });

    it('validate relayUpstream', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(
        window,
        [
          { iframe: primaryIframe, label: 'primary' },
          { iframe: secondaryIframe, label: 'secondary' },
        ],
        primaryIframe.src
      );
      grProxyConduit.getAllConduits().forEach((conduit) => {
        conduit.onUpstream = jest.fn();
      });

      grProxyConduit.relayUpstream(connect.GlobalResiliencyEvents.FAILOVER_PENDING);

      grProxyConduit.getAllConduits().forEach((conduit) => {
        expect(conduit.onUpstream).toHaveBeenCalledTimes(1);
      });
    });

    it('validate setActiveConduit', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      expect(grProxyConduit.name === new URL(primaryIframe.src).origin).toBe(true);
      expect(grProxyConduit.name === grProxyConduit.getActiveConduit().name).toBe(true);
      expect(grProxyConduit.upstream === grProxyConduit.getActiveConduit().upstream).toBe(true);
      expect(grProxyConduit.downstream === grProxyConduit.getActiveConduit().downstream).toBe(true);
      expect(grProxyConduit.upstreamBus === grProxyConduit.getActiveConduit().upstreamBus).toBe(true);
      expect(grProxyConduit.downstreamBus === grProxyConduit.getActiveConduit().downstreamBus).toBe(true);

      expect(grProxyConduit.name === grProxyConduit.getAllConduits()[0].name).toBe(true);
      expect(grProxyConduit.upstream === grProxyConduit.getAllConduits()[0].upstream).toBe(true);
      expect(grProxyConduit.downstream === grProxyConduit.getAllConduits()[0].downstream).toBe(true);
      expect(grProxyConduit.upstreamBus === grProxyConduit.getAllConduits()[0].upstreamBus).toBe(true);
      expect(grProxyConduit.downstreamBus === grProxyConduit.getAllConduits()[0].downstreamBus).toBe(true);

      grProxyConduit.setActiveConduit('http://localhost2.com');

      expect(grProxyConduit.name === new URL(secondaryIframe.src).origin).toBe(true);
      expect(grProxyConduit.name === grProxyConduit.getActiveConduit().name).toBe(true);
      expect(grProxyConduit.upstream === grProxyConduit.getActiveConduit().upstream).toBe(true);
      expect(grProxyConduit.downstream === grProxyConduit.getActiveConduit().downstream).toBe(true);
      expect(grProxyConduit.upstreamBus === grProxyConduit.getActiveConduit().upstreamBus).toBe(true);
      expect(grProxyConduit.downstreamBus === grProxyConduit.getActiveConduit().downstreamBus).toBe(true);

      expect(grProxyConduit.name === grProxyConduit.getAllConduits()[1].name).toBe(true);
      expect(grProxyConduit.upstream === grProxyConduit.getAllConduits()[1].upstream).toBe(true);
      expect(grProxyConduit.downstream === grProxyConduit.getAllConduits()[1].downstream).toBe(true);
      expect(grProxyConduit.upstreamBus === grProxyConduit.getAllConduits()[1].upstreamBus).toBe(true);
      expect(grProxyConduit.downstreamBus === grProxyConduit.getAllConduits()[1].downstreamBus).toBe(true);
    });

    it('validate getConduitByRegion', () => {
      const pdx = 'us-west-2';
      const iad = 'us-east-1';

      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);
      grProxyConduit.getActiveConduit().region = pdx;
      grProxyConduit.getInactiveConduit().region = iad;

      expect(grProxyConduit.getConduitByRegion(pdx) instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByRegion(pdx).region === pdx).toBe(true);

      expect(grProxyConduit.getConduitByRegion(iad) instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByRegion(iad).region === iad).toBe(true);

      expect(grProxyConduit.getConduitByRegion('') instanceof connect.IFrameConduit).toBe(false);
    });

    it('validate getConduitByName', () => {
      const grProxyConduit = new connect.GRProxyIframeConduit(window, conduitParam, primaryIframe.src);

      expect(grProxyConduit.getConduitByName(grProxyConduit.conduits[0].name) instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByName(grProxyConduit.conduits[0].name).name === grProxyConduit.conduits[0].name).toBe(true);
      expect(grProxyConduit.getConduitByName('http://localhost.com') instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByName('http://localhost.com').name === 'http://localhost.com').toBe(true);

      expect(grProxyConduit.getConduitByName(grProxyConduit.conduits[1].name) instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByName(grProxyConduit.conduits[1].name).name === grProxyConduit.conduits[1].name).toBe(true);
      expect(grProxyConduit.getConduitByName('http://localhost2.com') instanceof connect.IFrameConduit).toBe(true);
      expect(grProxyConduit.getConduitByName('http://localhost2.com').name === 'http://localhost2.com').toBe(true);

      expect(grProxyConduit.getConduitByName('') instanceof connect.IFrameConduit).toBe(false);
    });
  });
});
