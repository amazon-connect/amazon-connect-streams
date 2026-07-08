describe('client', () => {
  let callbacks;

  beforeEach(() => {
    callbacks = {
      success: jest.fn(),
      failure: jest.fn(),
    };
  });

  describe('ClientBase', () => {
    it('uses empty params and default callbacks when none are provided', () => {
      const client = new connect.ClientBase();
      const callImpl = jest.spyOn(client, '_callImpl').mockImplementation(() => {});

      client.call('myMethod');
      expect(callImpl).toHaveBeenCalledWith('myMethod', {}, connect.ClientBase.EMPTY_CALLBACKS);

      client.call('myMethod', { a: 1 }, callbacks);
      expect(callImpl).toHaveBeenCalledWith('myMethod', { a: 1 }, callbacks);
    });

    it('throws when no method is provided', () => {
      const client = new connect.ClientBase();
      expect(() => client.call()).toThrow();
    });

    it('throws NotImplementedError when called on the base class', () => {
      const client = new connect.ClientBase();
      expect(() => client.call('myMethod', {}, callbacks)).toThrow(connect.NotImplementedError);
    });
  });

  describe('NullClient', () => {
    it('invokes the failure callback with a ValueError for any method', () => {
      const client = new connect.NullClient();

      client.call('someMethod', {}, callbacks);

      expect(callbacks.failure).toHaveBeenCalledTimes(1);
      const [error, info] = callbacks.failure.mock.calls[0];
      expect(error).toBeInstanceOf(connect.ValueError);
      expect(info.message).toContain('someMethod');
      expect(callbacks.success).not.toHaveBeenCalled();
    });
  });

  describe('UpstreamConduitClient', () => {
    let conduit;
    let responseHandler;

    beforeEach(() => {
      conduit = {
        sendUpstream: jest.fn(),
        onUpstream: jest.fn((event, handler) => {
          responseHandler = handler;
        }),
      };
    });

    it('subscribes for the response event on construction', () => {
      // eslint-disable-next-line no-new
      new connect.UpstreamConduitClient(conduit);
      expect(conduit.onUpstream).toHaveBeenCalledWith(connect.EventType.API_RESPONSE, expect.any(Function));
    });

    it('sends the request upstream and records its callbacks', () => {
      const client = new connect.UpstreamConduitClient(conduit);

      client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, { a: 1 }, callbacks);

      expect(conduit.sendUpstream).toHaveBeenCalledTimes(1);
      const [event, request] = conduit.sendUpstream.mock.calls[0];
      expect(event).toBe(connect.EventType.API_REQUEST);
      expect(request.method).toBe(connect.ClientMethods.GET_AGENT_CONFIGURATION);
      expect(client._requestIdCallbacksMap[request.requestId]).toBe(callbacks);
    });

    it('routes a successful response to the matching callback and clears it', () => {
      const client = new connect.UpstreamConduitClient(conduit);
      client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, {}, callbacks);
      const { requestId } = conduit.sendUpstream.mock.calls[0][1];

      responseHandler({ requestId, err: null, data: { ok: true } });

      expect(callbacks.success).toHaveBeenCalledWith({ ok: true });
      expect(callbacks.failure).not.toHaveBeenCalled();
      expect(client._requestIdCallbacksMap[requestId]).toBeUndefined();
    });

    it('routes an error response to the failure callback', () => {
      const client = new connect.UpstreamConduitClient(conduit);
      client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, {}, callbacks);
      const { requestId } = conduit.sendUpstream.mock.calls[0][1];

      responseHandler({ requestId, err: 'boom', data: { detail: 1 } });

      expect(callbacks.failure).toHaveBeenCalledWith('boom', { detail: 1 });
      expect(callbacks.success).not.toHaveBeenCalled();
    });

    it('ignores a response with an unknown requestId', () => {
      const client = new connect.UpstreamConduitClient(conduit);
      client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, {}, callbacks);

      responseHandler({ requestId: 'does-not-exist', err: null, data: {} });

      expect(callbacks.success).not.toHaveBeenCalled();
      expect(callbacks.failure).not.toHaveBeenCalled();
    });
  });

  describe('ApiProxyClient', () => {
    beforeEach(() => {
      connect.core.eventBus = new connect.EventBus({ logEvents: true });
      jest.spyOn(connect.core.eventBus, 'trigger');
    });

    it('sends the request through the API_PROXY_REQUEST event', () => {
      const method = connect.ApiProxyClientMethods.QR_INTEGRATION_EXISTS;
      const params = { exampleData: 'hello' };
      const client = new connect.ApiProxyClient();

      client.call(method, params, callbacks);

      expect(connect.core.getEventBus().trigger).toHaveBeenCalledWith(
        connect.EventType.API_PROXY_REQUEST,
        expect.objectContaining({
          event: connect.EventType.API_PROXY_REQUEST,
          method,
          params: expect.objectContaining(params),
          requestId: expect.anything(),
        })
      );
    });

    it('calls the failure callback when the response is an error', () => {
      const client = new connect.ApiProxyClient();
      client._requestIdCallbacksMap.TEST_1 = callbacks;

      client._handleResponse({ requestId: 'TEST_1', err: true, data: 1 });

      expect(callbacks.failure).toHaveBeenCalledWith(true, 1);
      expect(callbacks.success).not.toHaveBeenCalled();
    });

    it('calls the success callback when the response completes', () => {
      const client = new connect.ApiProxyClient();
      client._requestIdCallbacksMap.TEST_1 = callbacks;

      client._handleResponse({ requestId: 'TEST_1', err: false, data: 2 });

      expect(callbacks.success).toHaveBeenCalledWith(2);
      expect(callbacks.failure).not.toHaveBeenCalled();
    });
  });
});
