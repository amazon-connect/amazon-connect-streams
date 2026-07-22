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

  describe('AWSClient', () => {
    const authToken = 'some_auth_token';
    const region = 'us-west-2';
    let awsCallbacks;

    beforeEach(() => {
      awsCallbacks = {
        success: jest.fn(),
        failure: jest.fn(),
        authFailure: jest.fn(),
        accessDenied: jest.fn(),
      };
    });

    function createClient(methodStubs = {}) {
      jest.spyOn(AWS, 'Credentials').mockReturnValue({});
      jest.spyOn(AWS, 'Endpoint').mockReturnValue('some-endpoint');
      jest.spyOn(AWS, 'Connect').mockReturnValue(methodStubs);
      return new connect.AWSClient(authToken, region);
    }

    function stubMethodWithSend(method, err, data) {
      const sendStub = jest.fn((cb) => cb(err, data));
      const onStub = jest.fn().mockReturnValue({ send: sendStub });
      const methodStub = jest.fn().mockReturnValue({ on: onStub });
      return { [method]: methodStub };
    }

    describe('_callImpl', () => {
      it('calls failure callback when method does not exist', () => {
        const client = createClient({
          [connect.ClientMethods.GET_AGENT_SNAPSHOT]: () => {},
        });

        client._callImpl('some_non_existent_method', {}, awsCallbacks);

        expect(awsCallbacks.failure).toHaveBeenCalledWith(
          expect.any(connect.ValueError),
          expect.objectContaining({ message: expect.stringContaining('some_non_existent_method') })
        );
      });

      it('sends request through AWS connect client', () => {
        const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
        const sendSpy = jest.fn();
        const onStub = jest.fn().mockReturnValue({ send: sendSpy });
        const methodStub = jest.fn().mockReturnValue({ on: onStub });
        const client = createClient({ [method]: methodStub });

        client._callImpl(method, {}, awsCallbacks);

        expect(sendSpy).toHaveBeenCalledTimes(1);
      });

      it('calls success callback when response code is not an error', () => {
        const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
        const expectedData = { foo: 'bar' };
        const client = createClient(stubMethodWithSend(method, null, expectedData));

        client._callImpl(method, {}, awsCallbacks);

        expect(awsCallbacks.success).toHaveBeenCalledWith(expectedData, expect.anything());
        expect(awsCallbacks.failure).not.toHaveBeenCalled();
        expect(awsCallbacks.authFailure).not.toHaveBeenCalled();
        expect(awsCallbacks.accessDenied).not.toHaveBeenCalled();
      });

      describe('when response is an error other than 401 or 403', () => {
        it('calls failure callback', () => {
          const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
          const raisedError = { code: 'some_not_401_nor_403_code', message: 'some message', stack: ['foo', 'bar'] };
          const expectedData = { foo: 'bar' };
          const client = createClient(stubMethodWithSend(method, raisedError, expectedData));

          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'some_not_401_nor_403_code',
              message: 'some message',
              stack: ['foo', 'bar'],
              retryStatus: connect.RetryStatus.NONE,
            }),
            expectedData
          );
          expect(awsCallbacks.success).not.toHaveBeenCalled();
          expect(awsCallbacks.authFailure).not.toHaveBeenCalled();
          expect(awsCallbacks.accessDenied).not.toHaveBeenCalled();
        });

        it('formats error with object stack as stringified JSON array', () => {
          const method = connect.ClientMethods.GET_AGENT_SNAPSHOT;
          const stack = { foo: 'bar', baz: 'yay!' };
          const raisedError = { code: 'some_code', message: 'some_message', stack };
          const client = createClient(stubMethodWithSend(method, raisedError, {}));

          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({
              stack: [JSON.stringify(stack)],
              retryStatus: connect.RetryStatus.NONE,
            }),
            expect.anything()
          );
        });
      });

      describe('when response is 401 unauthorized', () => {
        const unauthorizedError = {
          code: connect.CTIExceptions.UNAUTHORIZED_EXCEPTION,
          message: 'unauthorized message error',
          stack: 'unauthorized \nmessage \nstack',
        };

        it.each(
          connect.RetryableClientMethodsList.map(m => [m])
        )('calls failure with RETRYING for retryable method %s below retry limit', (method) => {
          const client = createClient(stubMethodWithSend(method, unauthorizedError, { foo: 'bar' }));

          for (let i = 0; i < connect.core.MAX_UNAUTHORIZED_RETRY_COUNT; i++) {
            client._callImpl(method, {}, awsCallbacks);
          }

          expect(awsCallbacks.failure).toHaveBeenCalledTimes(connect.core.MAX_UNAUTHORIZED_RETRY_COUNT);
          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.UNAUTHORIZED_EXCEPTION,
              statusCode: 401,
              retryStatus: connect.RetryStatus.RETRYING,
            }),
            expect.anything()
          );
          expect(awsCallbacks.authFailure).not.toHaveBeenCalled();
          expect(awsCallbacks.accessDenied).not.toHaveBeenCalled();
        });

        it.each(
          connect.RetryableClientMethodsList.map(m => [m])
        )('calls authFailure with EXHAUSTED for retryable method %s above retry limit then resets', (method) => {
          const client = createClient(stubMethodWithSend(method, unauthorizedError, { foo: 'bar' }));

          for (let i = 0; i < connect.core.MAX_UNAUTHORIZED_RETRY_COUNT; i++) {
            client._callImpl(method, {}, awsCallbacks);
          }
          // one more call exceeds the limit
          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.authFailure).toHaveBeenCalledTimes(1);
          expect(awsCallbacks.authFailure).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.UNAUTHORIZED_EXCEPTION,
              statusCode: 401,
              retryStatus: connect.RetryStatus.EXHAUSTED,
            }),
            expect.anything()
          );

          // counter resets — next call should be RETRYING again
          awsCallbacks.failure.mockClear();
          client._callImpl(method, {}, awsCallbacks);
          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({ retryStatus: connect.RetryStatus.RETRYING }),
            expect.anything()
          );
        });

        it('calls authFailure with NONE for a non-retryable method', () => {
          const method = connect.ClientMethods.CREATE_TRANSPORT;
          const client = createClient(stubMethodWithSend(method, unauthorizedError, { foo: 'bar' }));

          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.authFailure).toHaveBeenCalledTimes(1);
          expect(awsCallbacks.authFailure).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.UNAUTHORIZED_EXCEPTION,
              statusCode: 401,
              retryStatus: connect.RetryStatus.NONE,
            }),
            expect.anything()
          );
          expect(awsCallbacks.failure).not.toHaveBeenCalled();
          expect(awsCallbacks.success).not.toHaveBeenCalled();
          expect(awsCallbacks.accessDenied).not.toHaveBeenCalled();
        });
      });

      describe('when response is 403 access denied', () => {
        const accessDeniedError = {
          code: connect.CTIExceptions.ACCESS_DENIED_EXCEPTION,
          message: 'access denied error',
          stack: 'access \ndenied \nstack',
        };

        it.each(
          connect.RetryableClientMethodsList.map(m => [m])
        )('calls failure with RETRYING for retryable method %s below retry limit', (method) => {
          const client = createClient(stubMethodWithSend(method, accessDeniedError, { foo: 'bar' }));

          for (let i = 0; i < connect.core.MAX_ACCESS_DENIED_RETRY_COUNT; i++) {
            client._callImpl(method, {}, awsCallbacks);
          }

          expect(awsCallbacks.failure).toHaveBeenCalledTimes(connect.core.MAX_ACCESS_DENIED_RETRY_COUNT);
          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.ACCESS_DENIED_EXCEPTION,
              statusCode: 403,
              retryStatus: connect.RetryStatus.RETRYING,
            }),
            expect.anything()
          );
          expect(awsCallbacks.authFailure).not.toHaveBeenCalled();
          expect(awsCallbacks.accessDenied).not.toHaveBeenCalled();
        });

        it.each(
          connect.RetryableClientMethodsList.map(m => [m])
        )('calls accessDenied with EXHAUSTED for retryable method %s above retry limit then resets', (method) => {
          const client = createClient(stubMethodWithSend(method, accessDeniedError, { foo: 'bar' }));

          for (let i = 0; i < connect.core.MAX_ACCESS_DENIED_RETRY_COUNT; i++) {
            client._callImpl(method, {}, awsCallbacks);
          }
          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.accessDenied).toHaveBeenCalledTimes(1);
          expect(awsCallbacks.accessDenied).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.ACCESS_DENIED_EXCEPTION,
              statusCode: 403,
              retryStatus: connect.RetryStatus.EXHAUSTED,
            }),
            expect.anything()
          );

          // counter resets
          awsCallbacks.failure.mockClear();
          client._callImpl(method, {}, awsCallbacks);
          expect(awsCallbacks.failure).toHaveBeenCalledWith(
            expect.objectContaining({ retryStatus: connect.RetryStatus.RETRYING }),
            expect.anything()
          );
        });

        it('calls accessDenied with NONE for a non-retryable method', () => {
          const method = connect.ClientMethods.CREATE_TRANSPORT;
          const client = createClient(stubMethodWithSend(method, accessDeniedError, { foo: 'bar' }));

          client._callImpl(method, {}, awsCallbacks);

          expect(awsCallbacks.accessDenied).toHaveBeenCalledTimes(1);
          expect(awsCallbacks.accessDenied).toHaveBeenCalledWith(
            expect.objectContaining({
              type: connect.CTIExceptions.ACCESS_DENIED_EXCEPTION,
              statusCode: 403,
              retryStatus: connect.RetryStatus.NONE,
            }),
            expect.anything()
          );
          expect(awsCallbacks.failure).not.toHaveBeenCalled();
          expect(awsCallbacks.success).not.toHaveBeenCalled();
          expect(awsCallbacks.authFailure).not.toHaveBeenCalled();
        });
      });
    });

    describe('_formatCallError', () => {
      it('preserves stack when it is an array', () => {
        const client = createClient({});
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack: ['foo', 'bar'], statusCode: 404,
        });
        expect(result).toEqual({
          type: 'ERR', message: 'msg', stack: ['foo', 'bar'],
          statusCode: 404, retryStatus: connect.RetryStatus.NONE,
        });
      });

      it('stringifies an object stack into a single-element array', () => {
        const client = createClient({});
        const stack = { foo: 'bar', baz: 'yay!' };
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack, statusCode: 404,
        });
        expect(result.stack).toEqual([JSON.stringify(stack)]);
      });

      it('splits a string stack by newlines', () => {
        const client = createClient({});
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack: 'some \nstack \nmessage', statusCode: 404,
        });
        expect(result.stack).toEqual(['some ', 'stack ', 'message']);
      });

      it('omits statusCode when not present in the original error', () => {
        const client = createClient({});
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack: 'a\nb',
        });
        expect(result).not.toHaveProperty('statusCode');
      });

      it('uses retryStatus from the error when provided', () => {
        const client = createClient({});
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack: 'a\nb',
          statusCode: 400, retryStatus: connect.RetryStatus.RETRYING,
        });
        expect(result.retryStatus).toBe(connect.RetryStatus.RETRYING);
      });

      it('defaults retryStatus to NONE when not provided', () => {
        const client = createClient({});
        const result = client._formatCallError({
          code: 'ERR', message: 'msg', stack: 'a\nb', statusCode: 400,
        });
        expect(result.retryStatus).toBe(connect.RetryStatus.NONE);
      });
    });

    describe('_addStatusCodeToError', () => {
      it('returns the same statusCode if already present', () => {
        const client = createClient({});
        const result = client._addStatusCodeToError({ code: 'X', statusCode: 401 });
        expect(result.statusCode).toBe(401);
      });

      it('defaults to 400 when there is no CTI error code', () => {
        const client = createClient({});
        const result = client._addStatusCodeToError({ message: 'msg' });
        expect(result.statusCode).toBe(400);
      });

      it('maps UNAUTHORIZED_EXCEPTION to 401', () => {
        const client = createClient({});
        const result = client._addStatusCodeToError({ code: connect.CTIExceptions.UNAUTHORIZED_EXCEPTION });
        expect(result.statusCode).toBe(401);
      });

      it('maps ACCESS_DENIED_EXCEPTION to 403', () => {
        const client = createClient({});
        const result = client._addStatusCodeToError({ code: connect.CTIExceptions.ACCESS_DENIED_EXCEPTION });
        expect(result.statusCode).toBe(403);
      });
    });

    describe('_translateParams', () => {
      it('returns the same params if no translation is needed', () => {
        const client = createClient({});
        const params = { foo: 'bar' };
        const result = client._translateParams(connect.ClientMethods.ADD_PARTICIPANT, params);
        expect(result).toBe(params);
      });

      it('adds the authentication param for methods that require it', () => {
        const stubs = { _requiresAuthenticationParam: () => true };
        jest.spyOn(AWS, 'Credentials').mockReturnValue({});
        jest.spyOn(AWS, 'Endpoint').mockReturnValue('some-endpoint');
        jest.spyOn(AWS, 'Connect').mockReturnValue(stubs);
        const client = new connect.AWSClient(authToken, region);
        const params = { foo: 'bar' };

        const result = client._translateParams(connect.ClientMethods.GET_AGENT_SNAPSHOT, params);

        expect(result).toEqual(expect.objectContaining({
          foo: 'bar',
          authentication: { authToken },
        }));
      });

      it('translates the agent configuration for UPDATE_AGENT_CONFIGURATION', () => {
        const client = createClient({});
        const params = {
          configuration: {
            name: 'agent',
            softphoneEnabled: true,
            softphoneAutoAccept: false,
            extension: '1234',
            agentPreferences: { locale: 'en_US' },
            voiceEnhancementMode: 'auto',
            routingProfile: {
              name: 'rp',
              routingProfileARN: 'arn:rp',
              defaultOutboundQueue: { queueARN: 'arn:q', name: 'q', extra: 'dropme' },
            },
          },
        };

        const result = client._translateParams(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION, params);

        expect(result.configuration).toEqual(expect.objectContaining({
          name: 'agent',
          softphoneEnabled: true,
          softphoneAutoAccept: false,
          extension: '1234',
          agentPreferences: { locale: 'en_US' },
          voiceEnhancementMode: 'auto',
        }));
        expect(result.configuration.routingProfile).toEqual({
          name: 'rp',
          routingProfileARN: 'arn:rp',
          defaultOutboundQueue: { queueARN: 'arn:q', name: 'q' },
        });
      });

      it('renames packetsCount to packetCount for SEND_SOFTPHONE_CALL_METRICS', () => {
        const client = createClient({});
        const params = {
          softphoneStreamStatistics: [{ packetsCount: 5, jitter: 1 }],
        };

        const result = client._translateParams(connect.ClientMethods.SEND_SOFTPHONE_CALL_METRICS, params);

        expect(result.softphoneStreamStatistics[0]).toEqual({ packetCount: 5, jitter: 1 });
      });

      it('renames the timing fields for SEND_SOFTPHONE_CALL_REPORT', () => {
        const client = createClient({});
        const params = {
          report: {
            handshakingTimeMillis: 10,
            preTalkingTimeMillis: 20,
            handshakingFailure: true,
            talkingTimeMillis: 30,
            softphoneStreamStatistics: [{ packetsCount: 2 }],
          },
        };

        const result = client._translateParams(connect.ClientMethods.SEND_SOFTPHONE_CALL_REPORT, params);

        expect(result.report).toEqual(expect.objectContaining({
          handshakeTimeMillis: 10,
          preTalkTimeMillis: 20,
          handshakeFailure: true,
          talkTimeMillis: 30,
        }));
        expect(result.report.softphoneStreamStatistics[0]).toEqual({ packetCount: 2 });
        expect(result.report.handshakingTimeMillis).toBeUndefined();
      });
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

  describe('TaskTemplatesClient', () => {
    const methods = connect.TaskTemplatesClientMethods;

    describe('constructor', () => {
      it('uses the endpoint directly when it already targets /task-templates', () => {
        const client = new connect.TaskTemplatesClient('example.com/task-templates/api/ccp');
        expect(client.endpointUrl).toContain('/task-templates/api/ccp');
      });

      it('appends the /connect prefix for awsapps.com endpoints', () => {
        const client = new connect.TaskTemplatesClient('instance.awsapps.com');
        expect(client.endpointUrl).toContain('/connect/task-templates/api/ccp');
      });

      it('omits the /connect prefix for non-awsapps.com endpoints', () => {
        const client = new connect.TaskTemplatesClient('example.com');
        expect(client.endpointUrl).toContain('/task-templates/api/ccp');
        expect(client.endpointUrl).not.toContain('/connect/task-templates');
      });
    });

    describe('_callImpl', () => {
      let client;
      let fetchSpy;

      beforeEach(() => {
        client = new connect.TaskTemplatesClient('example.com/task-templates');
        fetchSpy = jest.spyOn(connect, 'fetch').mockResolvedValue({ ok: true });
      });

      it('drops previousContactId when a relatedContactId is present', () => {
        const params = { instanceId: 'i-1', relatedContactId: 'r-1', previousContactId: 'p-1' };
        client._callImpl(methods.LIST_TASK_TEMPLATES, params, callbacks);
        expect(params.previousContactId).toBeUndefined();
        expect(params.relatedContactId).toBe('r-1');
      });

      it('builds the list URL and appends query params', () => {
        client._callImpl(
          methods.LIST_TASK_TEMPLATES,
          { instanceId: 'i-1', queryParams: { status: 'ACTIVE' } },
          callbacks
        );
        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toContain('/proxy/instance/i-1/task/template');
        expect(url).toContain('status=ACTIVE');
        expect(options.method).toBe('GET');
      });

      it('builds the list URL without a query string when queryParams is empty', () => {
        client._callImpl(methods.LIST_TASK_TEMPLATES, { instanceId: 'i-1', queryParams: {} }, callbacks);
        const [url] = fetchSpy.mock.calls[0];
        expect(url).toContain('/proxy/instance/i-1/task/template');
        expect(url).not.toContain('?');
      });

      it('builds the get URL with a snapshot version when provided', () => {
        client._callImpl(
          methods.GET_TASK_TEMPLATE,
          { instanceId: 'i-1', templateParams: { id: 't-1', version: '3' } },
          callbacks
        );
        const [url] = fetchSpy.mock.calls[0];
        expect(url).toContain('/proxy/instance/i-1/task/template/t-1');
        expect(url).toContain('snapshotVersion=3');
      });

      it('builds the get URL without a version when none is provided', () => {
        client._callImpl(
          methods.GET_TASK_TEMPLATE,
          { instanceId: 'i-1', templateParams: { id: 't-1' } },
          callbacks
        );
        const [url] = fetchSpy.mock.calls[0];
        expect(url).toContain('/proxy/instance/i-1/task/template/t-1');
        expect(url).not.toContain('snapshotVersion');
      });

      it('throws when the get template id is missing', () => {
        expect(() =>
          client._callImpl(methods.GET_TASK_TEMPLATE, { instanceId: 'i-1', templateParams: {} }, callbacks)
        ).toThrow();
      });

      it('sends a PUT with a JSON body for createTemplatedTask', () => {
        client._callImpl(methods.CREATE_TEMPLATED_TASK, { instanceId: 'i-1', title: 'hi' }, callbacks);
        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toContain(`/${methods.CREATE_TEMPLATED_TASK}`);
        expect(options.method).toBe('PUT');
        expect(JSON.parse(options.body)).toMatchObject({ title: 'hi' });
      });

      it('sends a POST with a JSON body for updateContact', () => {
        client._callImpl(methods.UPDATE_CONTACT, { instanceId: 'i-1', foo: 'bar' }, callbacks);
        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toContain(`/${methods.UPDATE_CONTACT}`);
        expect(options.method).toBe('POST');
      });

      it('invokes the success callback with the response', async () => {
        const res = { ok: true };
        fetchSpy.mockResolvedValue(res);
        client._callImpl(methods.LIST_TASK_TEMPLATES, { instanceId: 'i-1' }, callbacks);
        await Promise.resolve();
        expect(callbacks.success).toHaveBeenCalledWith(res);
      });

      it('reads the error body, attaches the status, and invokes the failure callback', async () => {
        const encoded = Uint8Array.from(Buffer.from('{"errorType":"ValidationException"}'));
        const reader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: encoded })
            .mockResolvedValueOnce({ done: true }),
        };
        fetchSpy.mockRejectedValue({ status: 400, body: { getReader: () => reader } });

        client._callImpl(methods.LIST_TASK_TEMPLATES, { instanceId: 'i-1' }, callbacks);
        // Allow the fetch rejection and the two reader.read() microtasks to settle.
        for (let i = 0; i < 5; i++) {
          await Promise.resolve();
        }

        expect(callbacks.failure).toHaveBeenCalledWith(
          expect.objectContaining({ errorType: 'ValidationException', status: 400 })
        );
      });
    });
  });
});
