describe('Request Storage Access module', () => {
  let ccpUrl, container, iframe;

  function mockMessageFromIframe(data = {}) {
    jest.spyOn(window, 'addEventListener').mockImplementation((type, callback) => {
      callback({
        data: data,
        source: window,
        origin: ccpUrl,
      });
    });
  }

  function createCcpIframeStub() {
    jest.spyOn(connect.core, '_getCCPIframe').mockImplementation(() => iframe);
  }

  beforeEach(() => {
    delete window.location;
    window.location = new URL('http://localhost');

    ccpUrl = 'https://test122.awsapps.com/connect/ccp-v2';
    container = document.createElement('div');
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  describe('Init method', () => {
    it('should throw a ValueError if we call without the parameter', () => {
      expect(() => connect.storageAccess.init(null, container)).toThrow('ccpUrl must be provided');
      expect(() => connect.storageAccess.init(ccpUrl)).toThrow('container must be provided');
    });

    it('Should return canRequest false with no additional settings from customers and they will be opted out by default', () => {
      connect.storageAccess.init(ccpUrl, container);
      expect(connect.storageAccess.canRequest()).toBe(false);
    });

    it('Should return canRequest false with explicit customer opt out', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: false,
      });
      expect(connect.storageAccess.canRequest()).toBe(false);
    });

    it('Should return canRequest false with explicit customer opt out with string value "false"', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: 'false',
      });
      expect(connect.storageAccess.canRequest()).toBe(false);
    });

    it('Should return canRequest true with customer config "true"', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: 'true',
      });
      expect(connect.storageAccess.canRequest()).toBe(true);
    });

    it('Should apply custom params based on the storage access custom paramters', () => {
      let customParams = {
        header: 'myHeader',
        canRequest: true,
        title: 'title',
        style: {
          'primary-color': 'green',
        },
        mode: 'custom',
        custom: {
          hideCCP: true,
          denyBannerButtonText: 'Try again',
        },
      };
      connect.storageAccess.init(ccpUrl, container, customParams);

      expect(connect.storageAccess.canRequest()).toBe(true);
      expect(connect.storageAccess.getStorageAccessParams()).toEqual(customParams);
    });
  });

  describe('getRequestStorageAccessUrl method', () => {
    it('should return requestAccessPageurl for new domain', () => {
      connect.storageAccess.init('https://test122.my.connect.aws/ccp-v2', container);

      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe(
        'https://test122.my.connect.aws/request-storage-access'
      );
    });

    it('should return requestAccessPageurl for old domain', () => {
      connect.storageAccess.init('https://test122.awsapps.com/connect/ccp-v2', container);
      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe(
        'https://test122.awsapps.com/connect/request-storage-access'
      );
    });

    it('should return requestAccessPageurl as instanceUrl if ccpURL doesnt match the connect domains', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://test.awsapps.com',
      });
      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe(
        'https://test.awsapps.com/connect/request-storage-access'
      );
    });

    it('should return requestAccessPageurl if ccpUrl being localhost', () => {
      connect.storageAccess.init('https://localhost:3000', container);
      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe('https://localhost:3000/request-storage-access');
    });

    it('should return requestAccessPageurl with the connect-gamma prefix for a gamma CCP path', () => {
      connect.storageAccess.init('https://test122.awsapps.com/connect-gamma/ccp-v2', container);
      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe(
        'https://test122.awsapps.com/connect-gamma/request-storage-access'
      );
    });

    it('should return requestAccessPageurl for govcloud domain', () => {
      connect.storageAccess.init('https://test122.govcloud.connect.aws/ccp-v2', container);

      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe(
        'https://test122.govcloud.connect.aws/request-storage-access'
      );
    });

    it('should return requestAccessPageurl if instanceUrl being localhost', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://localhost:9000',
      });
      expect(connect.storageAccess.getRequestStorageAccessUrl()).toBe('https://localhost:9000/request-storage-access');
    });

    it('should throw error if no valid connect URLs being provided to initCCP call', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://localhossst:9000',
      });

      expect(() => {
        connect.storageAccess.getRequestStorageAccessUrl();
      }).toThrow(
        '[StorageAccess] [getRequestStorageAccessUrl] Invalid Connect instance/CCP URL provided, please pass the valid Connect CCP URL or in case CCP URL is configured to be the SSO URL then use storageAccess.instanceUrl and pass the Connect CCP URL'
      );
    });

    it('should throw error if getRequestStorageAccessUrl called before init', () => {
      connect.storageAccess.resetStorageAccessState();
      expect(() => {
        connect.storageAccess.getRequestStorageAccessUrl();
      }).toThrow('[StorageAccess] [getRequestStorageAccessUrl] Invoke connect.storageAccess.init first');
    });
  });

  describe('Request method', () => {
    let onGrantSpy;

    beforeEach(() => {
      // jest.setup opts out every beforeEach; opt back in (canRequest gates the listener).
      connect.storageAccess.optInForRequestAccess();

      onGrantSpy = jest.fn();
      createCcpIframeStub();
      jest.spyOn(iframe, 'contentWindow', 'get').mockReturnValue(window);
      jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    });

    it('Should trigger REQUEST post message and invoke onGrant callback', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container);
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).toBe(false);
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      let storageAccessRequestArgs = window.postMessage.mock.calls[0][0];
      expect(storageAccessRequestArgs.event).toBe('storageAccess::request');
      expect(storageAccessRequestArgs.data.landat).toBe('/connect/ccp-v2');

      expect(onGrantSpy).toHaveBeenCalled();
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).toBe(true);
      connect.storageAccess.request();

      /** Should be called only once */
      expect(onGrantSpy).not.toHaveBeenCalledTimes(2);

      connect.storageAccess.resetStorageAccessState();
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).toBe(false);
    });

    it('Should hide container if mode is custom after granting access', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      expect(container.style.display).toBe('none');
    });

    it('Should not hide container if specified not to hide the iframe in custom mode', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom', custom: { hideCCP: false } });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      expect(container.style.display).toBe('');
    });

    it('Should not hide container if mode is default and specified hideCCP to true', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'default', custom: { hideCCP: true } });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      expect(container.style.display).toBe('');
    });

    it('Should not hide container if mode is default', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'default' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      expect(container.style.display).toBe('');
    });

    it('Should display container if denied access for custom types', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.DENIED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(window.postMessage).toHaveBeenCalled();
      expect(container.style.display).toBe('block');
    });
  });

  describe('OnRequestHandlers', () => {
    let removeListerStub;
    let onInitSpy, onDenySpy, onGrantSpy;

    beforeEach(() => {
      connect.storageAccess.optInForRequestAccess();

      onInitSpy = jest.fn();
      onDenySpy = jest.fn();
      onGrantSpy = jest.fn();
      removeListerStub = jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
      createCcpIframeStub();
      jest.spyOn(iframe, 'contentWindow', 'get').mockReturnValue(window);
      jest.spyOn(window, 'postMessage').mockImplementation(() => {});
      connect.storageAccess.init(ccpUrl, container);
    });

    it('Should execute onInit callback', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.INIT,
        data: {
          hasAccess: true,
        },
      });

      connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });

      expect(onInitSpy).toHaveBeenCalled();
      expect(onInitSpy).toHaveBeenCalledWith({ event: 'storageAccess::init', data: { hasAccess: true } });
    });

    it('Should execute onDeny callback', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.DENIED,
        data: {
          hasAccess: true,
        },
      });

      connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });

      expect(onDenySpy).toHaveBeenCalled();
    });

    it('Should execute onGrant callback', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {
          hasAccess: true,
        },
      });

      connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });

      expect(onGrantSpy).toHaveBeenCalled();
    });

    it('Should remove onRequestHandler event listener as soon as ccp is initialized', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {
          hasAccess: true,
        },
      });

      connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });

      expect(onGrantSpy).toHaveBeenCalled();

      // connect.core.initialized is a plain property (not a getter): set it
      // directly and restore afterward (restoreMocks does not cover assignments).
      const originalInitialized = connect.core.initialized;
      connect.core.initialized = true;
      try {
        connect.storageAccess.onRequest({
          onInit: onInitSpy,
          onDeny: onDenySpy,
          onGrant: onGrantSpy,
        });
        expect(removeListerStub).toHaveBeenCalled();
      } finally {
        connect.core.initialized = originalInitialized;
      }
    });

    it('Should remove onRequestHandler after invoking unsubscribe', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {
          hasAccess: true,
        },
      });

      let unsubscriber = connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });

      expect(onGrantSpy).toHaveBeenCalled();
      unsubscriber.unsubscribe();
      expect(removeListerStub).toHaveBeenCalled();
    });
  });
});
