const COPYABLE_EVENT_FIELDS = ["bubbles", "cancelBubble", "cancelable", "composed", "data", "defaultPrevented", "eventPhase", "isTrusted", "lastEventId", "origin", "returnValue", "timeStamp", "type"];

// jsdom forbids reassigning window.location; delete then set a fresh URL.
function setLocation(url) {
  delete window.location;
  window.location = new URL(url);
}

describe('Utils', () => {

  describe('connect.hitch', () => {
    let callback;
    let obj;

    beforeEach(() => {
      callback = jest.fn();
      obj = {};
    });

    it('calls original function with right this and args', () => {
      connect.hitch(obj, callback, 1, 2, 3)();
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.instances[0]).toBe(obj);
      expect(callback).toHaveBeenCalledWith(1, 2, 3);
    });

    it("returns the return value from the original function", () => {
      const cb = jest.fn().mockReturnValue("10");
      const result = connect.hitch(obj, cb, 1, 2, 3)();
      expect(result).toBe("10");
    });

    it('should throw a ValueError if its call without the parameter', () => {
      expect(connect.hitch).toThrow(connect.ValueError);
    });

    it('should bind initial args to the closure and merge with call-time args', () => {
      const cb = jest.fn();
      const bound = connect.hitch({}, cb, 'a', 'b');
      bound('c');
      expect(cb).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe("connect.keys", () => {
    let myTestObject;

    beforeEach(() => {
      myTestObject = {
        name: "test",
        value: "test"
      };
    });

    it('should return Array of keys within the object if we pass an object', () => {
      expect(connect.keys(myTestObject)).toEqual(["name", "value"]);
    });

    it('should throw a ValueError if we call without the parameter', () => {
      expect(connect.keys).toThrow(connect.ValueError);
    });
  });

  describe('connect.isFunction', () => {
    let myTestFunction;
    let myTestvariable;

    beforeEach(() => {
      myTestFunction = function () { };
      myTestvariable = 10;
    });

    it('should return false if we do not pass a function', () => {
      expect(connect.isFunction(myTestvariable)).toBe(false);
    });

    it('Should return true if we pass a function', () => {
      expect(connect.isFunction(myTestFunction)).toBe(true);
    });
  });

  describe('connect.hasOtherConnectedCCPs', () => {
    it.each([
      [0, false],
      [1, false],
      [2, true],
    ])('numberOfConnectedCCPs %i -> hasOtherConnectedCCPs returns %p', (count, expected) => {
      connect.numberOfConnectedCCPs = count;
      expect(connect.hasOtherConnectedCCPs()).toBe(expected);
    });
  });

  describe('connect.isCCP', () => {
    let originalUpstream;

    beforeEach(() => {
      originalUpstream = connect.core.upstream;
    });

    afterEach(() => {
      connect.core.upstream = originalUpstream;
    });

    it('should return true when the upstream.name is ConnectSharedWorkerConduit', () => {
      connect.core.upstream = { name: 'ConnectSharedWorkerConduit' }; // Set upstream to truthy value
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ name: 'ConnectSharedWorkerConduit' });
      expect(connect.isCCP()).toBe(true);
    });
    it('should return false when the upstream.name is NOT ConnectSharedWorkerConduit', () => {
      connect.core.upstream = { name: 'https://ccp.url.com' }; // Set upstream to truthy value
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ name: 'https://ccp.url.com' });
      expect(connect.isCCP()).toBe(false);
    });
  });

  describe('connect.isSharedWorker', () => {
    let originalClientEngine;

    beforeEach(() => {
      originalClientEngine = connect.worker.clientEngine;
    });

    afterEach(() => {
      connect.worker.clientEngine = originalClientEngine;
    });

    it('should return true when worker.clientEngine is set', () => {
      connect.worker.clientEngine = true;
      expect(connect.isSharedWorker()).toBe(true);
    });
    it('should return false when worker.clientEngine is not set', () => {
      connect.worker.clientEngine = null;
      expect(connect.isSharedWorker()).toBe(false);
    });
  });

  describe('connect.isCRM', () => {
    let originalUpstream;

    beforeEach(() => {
      originalUpstream = connect.core.upstream;
    });

    afterEach(() => {
      connect.core.upstream = originalUpstream;
    });

    it('should return true when the upstream is instance of IFrameConduit', () => {
      connect.core.upstream = {}; // Set upstream to truthy value
      // isCRM() does an instanceof check, so getUpstream() must return a real
      // connect.IFrameConduit instance, not a plain mock.
      const iframe = { contentWindow: {} };
      const fakeWindow = { addEventListener: () => {} };
      const conduit = new connect.IFrameConduit('name', fakeWindow, iframe);
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue(conduit);
      expect(connect.isCRM()).toBe(true);
    });

    it('should return false when the upstream is not an instance of IFrameConduit', () => {
      connect.core.upstream = {}; // Set upstream to truthy value
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({ name: 'https://ccp.url.com' });
      expect(connect.isCRM()).toBe(false);
    });
  });

  describe('connect.deepcopyCrossOriginEvent', () => {
    it('should ignore all fields but those hardcoded in the method.', () => {
      let obj = { "heyo": "hi" };
      let obj2 = {};
      COPYABLE_EVENT_FIELDS.forEach((key) => {
        obj[key] = "hello";
        obj2[key] = "hello";
      });
      expect(connect.deepcopyCrossOriginEvent(obj)).not.toEqual(obj);
      expect(connect.deepcopyCrossOriginEvent(obj)).toEqual(obj2);
      expect(connect.deepcopyCrossOriginEvent(obj2)).toEqual(obj2);
    });
  });

  describe('connect.isValidLocale', () => {
    it('should return true for a valid locale', () => {
      expect(connect.isValidLocale('en_US')).toBe(true);
    });
    it('should return false for an invalid locale', () => {
      expect(connect.isValidLocale('incorrect')).toBe(false);
    });
  });




  describe('PopupManager', () => {
    let popupManager;
    let mockWindow;

    beforeEach(() => {
      popupManager = new connect.PopupManager();

      global.window = global.window || {};
      global.window.open = global.window.open || function () {};

      mockWindow = {
        closed: false,
        focus: jest.fn(),
        opener: global.window,
        location: { href: 'https://example.com' }
      };

      jest.spyOn(global.window, 'open').mockReturnValue(mockWindow);
      jest.spyOn(connect, 'getLog').mockReturnValue({
        info: jest.fn().mockReturnThis(),
        warn: jest.fn().mockReturnThis(),
        sendInternalLogToServer: jest.fn(),
        withObject: jest.fn().mockReturnThis(),
        withException: jest.fn().mockReturnThis()
      });
    });

    describe('open - Window Reuse', () => {
      it('should reuse existing window when called with same URL and name', () => {
        popupManager.open('https://example.com', 'test', { width: 500, height: 600 });
        popupManager.open('https://example.com', 'test', { width: 500, height: 600 });

        expect(global.window.open).toHaveBeenCalledTimes(1);
        expect(mockWindow.focus).toHaveBeenCalled();
      });

      it('should NOT reload page when reusing window', () => {
        popupManager.open('https://example.com', 'test');
        const initialLocation = mockWindow.location.href;

        popupManager.open('https://example.com', 'test');

        expect(mockWindow.location.href).toBe(initialLocation);
      });

      it('should open new window if cached window is closed', () => {
        popupManager.open('https://example.com', 'test');

        mockWindow.closed = true;
        const mockWindow2 = { closed: false, focus: jest.fn(), opener: global.window };
        global.window.open.mockReturnValue(mockWindow2);

        popupManager.open('https://example.com', 'test');

        expect(global.window.open).toHaveBeenCalledTimes(2);
      });

      it('should clean up cached window reference when window is closed', () => {
        popupManager.open('https://example.com', 'test');

        mockWindow.closed = true;
        popupManager.open('https://example.com', 'test');

        expect(popupManager.windows['test']).toBeUndefined();
        expect(popupManager.windowUrls['test']).toBeUndefined();
      });
    });

    describe('open - Cross-Origin Handling', () => {
      it('should handle cross-origin errors when checking window.closed', () => {
        popupManager.open('https://example.com', 'test');

        Object.defineProperty(mockWindow, 'closed', {
          get: function () {
            throw new Error('Cross-origin');
          }
        });

        const mockWindow2 = { closed: false, focus: jest.fn(), opener: global.window };
        global.window.open.mockReturnValue(mockWindow2);

        expect(function () {
          popupManager.open('https://example.com', 'test');
        }).not.toThrow();

        expect(global.window.open).toHaveBeenCalledTimes(2);
      });

      it('should handle errors when calling focus()', () => {
        mockWindow.focus = jest.fn(() => { throw new Error('Cannot focus'); });

        popupManager.open('https://example.com', 'test');

        expect(function () {
          popupManager.open('https://example.com', 'test');
        }).not.toThrow();
      });
    });

    describe('open - Popup Blocking', () => {
      it('should handle when window.open returns null (popup blocked)', () => {
        global.window.open.mockReturnValue(null);

        const result = popupManager.open('https://example.com', 'test');

        expect(result).toBeNull();
        expect(popupManager.windows['test']).toBeUndefined();
      });
    });

    describe('open - Window Tracking', () => {
      it('should track window reference in windows map', () => {
        popupManager.open('https://example.com', 'test');

        expect(popupManager.windows['test']).toBe(mockWindow);
      });

      it('should track window URL in windowUrls map', () => {
        popupManager.open('https://example.com', 'test');

        expect(popupManager.windowUrls['test']).toBe('https://example.com');
      });

      it('should maintain separate tracking for different window names', () => {
        const mockWindow2 = { closed: false, focus: jest.fn(), opener: global.window };

        popupManager.open('https://example.com', 'test1');

        global.window.open.mockReturnValue(mockWindow2);
        popupManager.open('https://example.com', 'test2');

        expect(popupManager.windows['test1']).toBe(mockWindow);
        expect(popupManager.windows['test2']).toBe(mockWindow2);
      });
    });

    describe('open - Feature String', () => {
      it('should include dimensions in feature string when options provided', () => {
        popupManager.open('https://example.com', 'test', {
          width: 500,
          height: 600,
          top: 10,
          left: 20
        });

        const features = global.window.open.mock.calls[0][2];
        expect(features).toContain('width=500');
        expect(features).toContain('height=600');
        expect(features).toContain('top=10');
        expect(features).toContain('left=20');
      });

      it('should use default dimensions when not provided', () => {
        popupManager.open('https://example.com', 'test', {});

        const features = global.window.open.mock.calls[0][2];
        expect(features).toContain('width=433');
        expect(features).toContain('height=578');
      });

      it('should pass empty string when no options provided', () => {
        popupManager.open('https://example.com', 'test');

        const features = global.window.open.mock.calls[0][2];
        expect(features).toBe('');
      });
    });

    describe('clear', () => {
      it('should remove window from tracking when cleared', () => {
        popupManager.open('https://example.com', 'test');

        popupManager.clear('test');

        expect(popupManager.windows['test']).toBeUndefined();
        expect(popupManager.windowUrls['test']).toBeUndefined();
      });

      it('should remove from localStorage when cleared', () => {
        // jsdom supplies a real localStorage whose removeItem lives on
        // Storage.prototype, so spy there (auto-restored by restoreMocks).
        const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

        popupManager.clear('test');

        expect(removeItemSpy).toHaveBeenCalledWith('connectPopupManager::test');
      });
    });

    describe('open - Direct URL Navigation', () => {
      it('should open window directly to target URL', () => {
        popupManager.open('https://example.com/login', 'test');

        const url = global.window.open.mock.calls[0][0];
        expect(url).toBe('https://example.com/login');
      });

      it('should not open to blank first', () => {
        popupManager.open('https://example.com/login', 'test');

        expect(global.window.open).toHaveBeenCalledTimes(1);
        const url = global.window.open.mock.calls[0][0];
        expect(url).not.toBe('');
        expect(url).not.toBe('about:blank');
      });
    });

    describe('open - Logging', () => {
      it('should log when opening new popup', () => {
        const logger = connect.getLog();

        popupManager.open('https://example.com', 'test');

        expect(logger.info).toHaveBeenCalledWith('[PopupManager] Opened popup window');
      });

      it('should log when reusing existing popup', () => {
        const logger = connect.getLog();

        popupManager.open('https://example.com', 'test');
        popupManager.open('https://example.com', 'test');

        expect(logger.info).toHaveBeenCalledWith('[PopupManager] Reusing existing popup window');
      });
    });
  });

  describe('connect.isActiveConduit', () => {
    it('Test response with default conduit in place', () => {
      jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
        sendUpstream: jest.fn(),
      });
      const logger = connect.getLog();
      const loggerdebug = jest.spyOn(logger, "debug");
      const response = connect.isActiveConduit();
      expect(response).toBe(true);
      expect(loggerdebug).toHaveBeenCalled();
      expect(loggerdebug).toHaveBeenCalledWith("connect.isActiveConduit is called but there is no GR proxy conduit");
    });

    it('test response when GR proxy conduit in place', () => {
      const containerDiv = { appendChild: jest.fn() };
      const softphoneParams = { ringtoneUrl: "customVoiceRingtone.amazon.com" };
      const chatParams = { ringtoneUrl: "customChatRingtone.amazon.com" };
      const taskParams = { ringtoneUrl: "customTaskRingtone.amazon.com" };
      const pageOptionsParams = {
        enableAudioDeviceSettings: false,
        enablePhoneTypeSettings: true
      };
      const shouldAddNamespaceToLogs = false;
      const params = {
        enableGlobalResiliency: true,
        ccpUrl: "url.com",
        secondaryCCPUrl: "url2.com",
        loginUrl: "loginUrl.com",
        softphone: softphoneParams,
        chat: chatParams,
        task: taskParams,
        loginOptions: { autoClose: true },
        pageOptions: pageOptionsParams,
        shouldAddNamespaceToLogs: shouldAddNamespaceToLogs
      };
      const fakePostMessage = jest.fn();
      const fakeContentWindow = { postMessage: fakePostMessage };
      // Distinct objects per call so primaryIframe/secondaryIframe don't alias the
      // same mock (otherwise secondaryIframe.src would overwrite primaryIframe.src).
      jest.spyOn(connect.core, "_createCCPIframe")
        .mockReturnValueOnce({ contentWindow: fakeContentWindow })
        .mockReturnValueOnce({ contentWindow: fakeContentWindow });
      const primaryIframe = connect.core._createCCPIframe(containerDiv, params, 'primary');
      const secondaryIframe = connect.core._createCCPIframe(
        containerDiv,
        {
          ...params,
          ccpUrl: params.secondaryCCPUrl,
        },
        'secondary'
      );
      primaryIframe.src = 'http://localhost.com';
      secondaryIframe.src = 'http://localhost2.com';

      const win = {
        addEventListener: () => {}
      };
      const grProxyConduit = new connect.GRProxyIframeConduit(win, [{ iframe: primaryIframe, label: 'primary' }, { iframe: secondaryIframe, label: 'secondary' }], primaryIframe.src);
      grProxyConduit.activeRegionUrl = "activeurl";
      jest.spyOn(connect.core, "getUpstream").mockReturnValue(grProxyConduit);
      const logger = connect.getLog();
      const loggerdebug = jest.spyOn(logger, "debug");
      const response = connect.isActiveConduit({ name: "activeurl" });
      expect(response).toBe(true);
      // A GR proxy conduit is present, so the "no GR proxy" debug branch must not run at all.
      expect(loggerdebug).not.toHaveBeenCalled();
    });
  });


  describe('collection helpers', () => {
    it('contains returns true/false for array membership (strict equality)', () => {
      expect(connect.contains([1, 2, 3], 2)).toBe(true);
      expect(connect.contains([1, 2, 3], 5)).toBe(false);
    });

    it('contains tests key existence for objects', () => {
      expect(connect.contains({ a: 1, b: 2 }, 'a')).toBe(true);
      expect(connect.contains({ a: 1, b: 2 }, 'c')).toBe(false);
    });

    it('containsValue searches array elements', () => {
      expect(connect.containsValue([1, 2, 3], 2)).toBe(true);
      expect(connect.containsValue([1, 2, 3], 5)).toBe(false);
    });

    it('containsValue searches object values (not keys)', () => {
      expect(connect.containsValue({ a: 1, b: 2 }, 2)).toBe(true);
      expect(connect.containsValue({ a: 1, b: 2 }, 5)).toBe(false);
    });

    it('find returns the first matching element or null', () => {
      expect(connect.find([1, 2, 3, 4], (v) => v > 2)).toBe(3);
      expect(connect.find([1, 2, 3], (v) => v > 10)).toBeNull();
      expect(connect.find([{ id: 1, ok: true }, { id: 2, ok: true }], (o) => o.ok).id).toBe(1);
    });

    it('entries maps an object to {key, value} pairs', () => {
      const result = connect.entries({ a: 1, b: 2 });
      expect(result).toContainEqual({ key: 'a', value: 1 });
      expect(result).toContainEqual({ key: 'b', value: 2 });
      expect(result.length).toBe(2);
      expect(connect.entries({})).toEqual([]);
    });

    it('values returns an object\'s values and asserts non-null', () => {
      expect(connect.values({ a: 1, b: 2 })).toEqual([1, 2]);
      expect(connect.values({})).toEqual([]);
      expect(() => connect.values(null)).toThrow(connect.ValueError);
    });

    it('index keys a list by a key-producing function', () => {
      const items = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
      const result = connect.index(items, (item) => item.id);
      expect(result[1]).toEqual({ id: 1, name: 'a' });
      expect(result[2]).toEqual({ id: 2, name: 'b' });
    });

    it('set builds a membership map with value 1, deduping keys', () => {
      const result = connect.set([1, 2, 3]);
      expect(result[1]).toBe(1);
      expect(result[2]).toBe(1);
      expect(result[3]).toBe(1);
      const deduped = connect.set([1, 1, 2]);
      expect(Object.keys(deduped).length).toBe(2);
      expect(connect.set([])).toEqual({});
    });

    it('merge combines maps with last-write-wins and returns a fresh object', () => {
      expect(connect.merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      expect(connect.merge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
      expect(connect.merge({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
      expect(connect.merge()).toEqual({});
      const input = { a: 1 };
      const result = connect.merge(input);
      expect(result).not.toBe(input);
      result.b = 2;
      expect(input).toEqual({ a: 1 });
    });

    it('relativeComplement returns keys in B that are absent from A', () => {
      expect(connect.relativeComplement({ a: 1 }, { b: 2, c: 3 })).toEqual({ b: 2, c: 3 });
      expect(connect.relativeComplement({ a: 1, b: 2 }, { a: 10, b: 20, c: 30 })).toEqual({ c: 30 });
      expect(connect.relativeComplement({ a: 1, b: 2 }, { a: 10, b: 20 })).toEqual({});
      expect(connect.relativeComplement({}, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });
  });

  describe('enum factories', () => {
    it('makeEnum upper-cases keys and replaces dots with underscores', () => {
      expect(connect.makeEnum(['granted'])).toEqual({ GRANTED: 'granted' });
      expect(connect.makeEnum(['agent.discovery'])).toEqual({ AGENT_DISCOVERY: 'agent.discovery' });
      expect(connect.makeEnum(['granted', 'denied', 'default'])).toEqual({
        GRANTED: 'granted',
        DENIED: 'denied',
        DEFAULT: 'default',
      });
    });

    it('makeNamespacedEnum prefixes values with namespace::', () => {
      expect(connect.makeNamespacedEnum('permission', ['granted', 'denied'])).toEqual({
        GRANTED: 'permission::granted',
        DENIED: 'permission::denied',
      });
      expect(connect.makeNamespacedEnum('event', ['chat_token', 'web_socket'])).toEqual({
        CHAT_TOKEN: 'event::chat_token',
        WEB_SOCKET: 'event::web_socket',
      });
    });

    it('makeGenericNamespacedEnum joins namespace and value with a custom separator', () => {
      expect(connect.makeGenericNamespacedEnum('namespace', ['value'], '-')).toEqual({ VALUE: 'namespace-value' });
      expect(connect.makeGenericNamespacedEnum('permission', ['granted'], '::')).toEqual({ GRANTED: 'permission::granted' });
      expect(connect.makeGenericNamespacedEnum('event', ['chat_token', 'web_socket'], '-')).toEqual({
        CHAT_TOKEN: 'event-chat_token',
        WEB_SOCKET: 'event-web_socket',
      });
    });
  });

  describe('assertions and error types', () => {
    it.each([
      ['NotImplementedError'],
      ['StateError'],
      ['ValueError'],
    ])('%s is an Error subclass with a formatted message', (errName) => {
      const err = connect[errName]('feature %s in %s not ready', 'auth', 'chrome');
      expect(err instanceof Error).toBe(true);
      expect(err instanceof connect[errName]).toBe(true);
      expect(err.name).toBe(errName);
      expect(err.message).toBe('feature auth in chrome not ready');
    });

    it('VoiceIdError captures type, message, stack, and the underlying error', () => {
      const underlying = new Error('root cause');
      const err = connect.VoiceIdError('network', 'Connection failed', underlying);
      expect(err.type).toBe('network');
      expect(err.message).toBe('Connection failed');
      expect(typeof err.stack).toBe('string');
      expect(err.err).toBe(underlying);
    });

    it('assertNotNull returns the value when present', () => {
      const obj = { prop: 1 };
      expect(connect.assertNotNull(obj, 'test')).toBe(obj);
      expect(connect.assertNotNull('test', 'myParam')).toBe('test');
    });

    it('assertNotNull throws a ValueError for null/undefined', () => {
      expect(() => connect.assertNotNull(null, 'myValue')).toThrow(connect.ValueError);
      expect(() => connect.assertNotNull(null, 'myValue')).toThrow('myValue must be provided');
      expect(() => connect.assertNotNull(undefined, 'myValue')).toThrow(connect.ValueError);
    });

    it('assertTrue does not throw for truthy values', () => {
      expect(() => connect.assertTrue(true, 'msg')).not.toThrow();
      expect(() => connect.assertTrue('text', 'msg')).not.toThrow();
      expect(() => connect.assertTrue(42, 'msg')).not.toThrow();
    });

    it('assertTrue throws a ValueError for falsy values', () => {
      expect(() => connect.assertTrue(false, 'my custom error')).toThrow(connect.ValueError);
      expect(() => connect.assertTrue(false, 'my custom error')).toThrow('my custom error');
      expect(() => connect.assertTrue(0, 'zero failed')).toThrow(connect.ValueError);
      expect(() => connect.assertTrue('', 'empty failed')).toThrow(connect.ValueError);
    });
  });

  describe('url and id helpers', () => {
    let originalLocation;
    beforeEach(() => { originalLocation = window.location; });
    afterEach(() => { delete window.location; window.location = originalLocation; });

    it('getBaseUrl assembles protocol//hostname:port, keeping non-default ports', () => {
      setLocation('https://example.com:8443');
      expect(connect.getBaseUrl()).toBe('https://example.com:8443');
      setLocation('http://localhost:8080');
      expect(connect.getBaseUrl()).toBe('http://localhost:8080');
    });

    it('getUrlWithProtocol leaves a same-protocol url unchanged and prefixes a bare one', () => {
      expect(connect.getUrlWithProtocol('https://example.com')).toBe('https://example.com');
      expect(connect.getUrlWithProtocol('example.com')).toBe('https://example.com');
    });

    it('randomId returns a unique timestamp-suffixed id', () => {
      const id = connect.randomId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
      expect(connect.randomId()).not.toBe(id);
    });
  });

  describe('framing detection', () => {
    let originalTop;
    afterEach(() => {
      if (originalTop !== undefined) {
        Object.defineProperty(window, 'top', { value: originalTop, configurable: true, writable: true });
        originalTop = undefined;
      }
    });

    it('isFramed is false when window.self === window.top', () => {
      expect(connect.isFramed()).toBe(false);
    });

    it('isFramed is true when window.top is a different window', () => {
      originalTop = window.top;
      Object.defineProperty(window, 'top', { value: {}, configurable: true, writable: true });
      expect(connect.isFramed()).toBe(true);
    });

    it('isFramed is true when accessing window.top throws (cross-origin)', () => {
      originalTop = window.top;
      Object.defineProperty(window, 'top', {
        configurable: true,
        get() { throw new Error('SecurityError'); },
      });
      expect(connect.isFramed()).toBe(true);
    });
  });

  describe('connect.fetch', () => {
    let originalFetch;
    beforeEach(() => {
      originalFetch = global.fetch;
      jest.useFakeTimers();
    });
    afterEach(() => {
      global.fetch = originalFetch;
      jest.useRealTimers();
    });

    it('resolves with the parsed JSON on a 200 response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: connect.HTTP_STATUS_CODES.SUCCESS,
        json: () => Promise.resolve({ data: 'ok' }),
      });
      await expect(connect.fetch('http://x', {})).resolves.toEqual({ data: 'ok' });
    });

    it('resolves with {} when the JSON body fails to parse', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: connect.HTTP_STATUS_CODES.SUCCESS,
        json: () => Promise.reject(new Error('bad json')),
      });
      await expect(connect.fetch('http://x', {})).resolves.toEqual({});
    });

    it('retries on a 5xx and resolves once it succeeds', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ status: connect.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        .mockResolvedValueOnce({ status: connect.HTTP_STATUS_CODES.SUCCESS, json: () => Promise.resolve({ ok: true }) });
      const p = connect.fetch('http://x', {}, 100, 3);
      await jest.runAllTimersAsync();
      await expect(p).resolves.toEqual({ ok: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('rejects with the response once retries are exhausted', async () => {
      const failing = { status: connect.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR };
      global.fetch = jest.fn().mockResolvedValue(failing);
      const p = connect.fetch('http://x', {}, 100, 2);
      const assertion = expect(p).rejects.toBe(failing);
      // Drain all scheduled retry timers regardless of their (possibly jittered) delays.
      await jest.runAllTimersAsync();
      await assertion;
    });

    it('rejects when the underlying fetch rejects (network error)', async () => {
      const err = new Error('network down');
      global.fetch = jest.fn().mockRejectedValue(err);
      await expect(connect.fetch('http://x', {})).rejects.toBe(err);
    });
  });

  describe('connect.fetchWithTimeout', () => {
    afterEach(() => jest.restoreAllMocks());

    it('delegates straight to connect.fetch (no signal) when timeoutMs is falsy', async () => {
      const fetchSpy = jest.spyOn(connect, 'fetch').mockResolvedValue({ data: 'ok' });
      await connect.fetchWithTimeout('http://x', null, {}, 100, 2);
      expect(fetchSpy).toHaveBeenCalledWith('http://x', {}, 100, 2);
    });

    it('merges an AbortController signal into options and clears the timer when timeoutMs is set', async () => {
      const fetchSpy = jest.spyOn(connect, 'fetch').mockResolvedValue({ ok: true });
      const clearSpy = jest.spyOn(global, 'clearTimeout');
      await connect.fetchWithTimeout('http://x', 100, { headers: { a: '1' } });
      const passedOptions = fetchSpy.mock.calls[0][1];
      expect(passedOptions.headers).toEqual({ a: '1' });
      expect(passedOptions.signal).toBeInstanceOf(AbortSignal);
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('connect.backoff', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('throws a ValueError when func is not a function', () => {
      expect(() => connect.backoff('not a function', 10, 1)).toThrow(connect.ValueError);
      expect(() => connect.backoff('not a function', 10, 1)).toThrow('func must be a Function');
    });

    it('retries up to maxRetry then invokes the failure callback once', () => {
      const func = jest.fn((cbs) => cbs.failure(new Error('boom')));
      const onFailure = jest.fn();
      connect.backoff(func, 1, 2, { failure: onFailure });
      jest.runAllTimers();
      expect(func).toHaveBeenCalledTimes(3); // initial + 2 retries
      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it('stops retrying and invokes success once the func succeeds', () => {
      let count = 0;
      const onSuccess = jest.fn();
      const onFailure = jest.fn();
      const func = (cbs) => { count += 1; if (count < 2) { cbs.failure('err'); } else { cbs.success('ok'); } };
      connect.backoff(func, 10, 3, { success: onSuccess, failure: onFailure });
      jest.runAllTimers();
      expect(onSuccess).toHaveBeenCalledWith('ok');
      expect(onFailure).not.toHaveBeenCalled();
    });
  });

  describe('connect.NotificationManager', () => {
    let manager;
    let originalNotification;

    beforeEach(() => {
      originalNotification = global.Notification;
      manager = new connect.NotificationManager();
    });
    afterEach(() => {
      global.Notification = originalNotification;
    });

    it('queues notifications while permission is still default', () => {
      manager.show('hello', {});
      expect(manager.queue).toHaveLength(1);
      expect(manager.queue[0]).toEqual({ title: 'hello', options: {} });
    });

    it('shows immediately (via _showImpl) once permission is granted', () => {
      const ctor = jest.fn();
      global.Notification = function (title, options) { ctor(title, options); };
      manager.permission = 'granted';
      manager.show('hi', { body: 'b' });
      expect(ctor).toHaveBeenCalledWith('hi', { body: 'b' });
    });

    it('does not show and does not queue when permission is denied', () => {
      manager.permission = 'denied';
      manager.show('hi', {});
      expect(manager.queue).toHaveLength(0);
    });

    it('_showImpl wires the clicked handler to the notification onclick', () => {
      let instance;
      global.Notification = function (title, options) { this.title = title; instance = this; };
      const clicked = jest.fn();
      const notification = manager._showImpl({ title: 't', options: { clicked } });
      expect(typeof notification.onclick).toBe('function');
      notification.onclick();
      expect(clicked).toHaveBeenCalledTimes(1);
    });

    it('_showQueued flushes the queue through _showImpl and empties it', () => {
      global.Notification = function (title, options) { this.title = title; };
      manager.queue = [{ title: 'a', options: {} }, { title: 'b', options: {} }];
      const shown = manager._showQueued();
      expect(shown).toHaveLength(2);
      expect(manager.queue).toHaveLength(0);
    });

    it('requestPermission marks DENIED when the browser lacks Notification support', () => {
      delete global.Notification;
      manager.requestPermission();
      expect(manager.permission).toBe('denied');
    });
  });

});
