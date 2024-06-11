const { expect } = require('chai');

require('../unit/test-setup.js');

/**
 * Todo of all the test cases which will be handled as part of a separate CR
 */
describe('Request Storage Access module', () => {
  let ccpUrl, container, iframe, sandbox, postMessageSpy;

  if (typeof window === 'undefined') {
    jsdom({ url: 'http://localhost' });
  }

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    ccpUrl = 'https://test122.awsapps.com/connect/ccp-v2';
    container = document.createElement('div');
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    postMessageSpy = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
    document.body.removeChild(iframe);
  });

  function mockMessageFromIframe(data = {}) {
    sandbox.replace(window, 'addEventListener', (type, callback) => {
      console.log('mockMessageFromIframe', data);
      callback({
        data: data,
        source: window,
        origin: ccpUrl,
      });
    });
  }

  function createCcpIframeStub() {
    sandbox.replace(connect.core, '_getCCPIframe', () => {
      console.log('fake iframe ');
      return iframe;
    });
  }

  describe('Init method', () => {
    it('should throw a ValueError if we call without the parameter', function () {
      assert.throws(() => connect.storageAccess.init(null, container), connect.ValueError, 'ccpUrl must be provided');
      assert.throws(() => connect.storageAccess.init(ccpUrl), connect.ValueError, 'container must be provided');
    });

    it('Should return canRequest false with no additional settings from customers and they will be opted out by default', () => {
      connect.storageAccess.init(ccpUrl, container);
      expect(connect.storageAccess.canRequest()).to.be.false;
    });

    it('Should return canRequest false with explicit customer opt out', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: false,
      });
      expect(connect.storageAccess.canRequest()).to.be.false;
    });

    it('Should return canRequest false with explicit customer opt out with string value "false"', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: 'false',
      });
      expect(connect.storageAccess.canRequest()).to.be.false;
    });

    it('Should return canRequest true with customer config "true"', () => {
      connect.storageAccess.init(ccpUrl, container, {
        canRequest: 'true',
      });
      expect(connect.storageAccess.canRequest()).to.be.true;
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

      expect(connect.storageAccess.canRequest()).to.be.true;
      expect(connect.storageAccess.getStorageAccessParams()).to.deep.equal(customParams);
    });
  });

  describe('getRequestStorageAccessUrl method', () => {
    it('should return requestAccessPageurl for new domain', () => {
      connect.storageAccess.init('https://test122.my.connect.aws/ccp-v2', container);

      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
        'https://test122.my.connect.aws/request-storage-access'
      );
    });
    it('should return requestAccessPageurl for old domain', () => {
      connect.storageAccess.init('https://test122.awsapps.com/connect/ccp-v2', container);
      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
        'https://test122.awsapps.com/connect/request-storage-access'
      );
    });

    it('should return requestAccessPageurl as instanceUrl if ccpURL doesnt match the connect domains', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://test.awsapps.com',
      });
      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
        'https://test.awsapps.com/connect/request-storage-access'
      );
    });

    it('should return requestAccessPageurl if ccpUrl being localhost', () => {
      connect.storageAccess.init('https://localhost:3000', container);
      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
        'https://localhost:3000/request-storage-access'
      );
    });

    it('should return requestAccessPageurl for govcloud domain', () => {
      connect.storageAccess.init('https://test122.govcloud.connect.aws/ccp-v2', container);
 
      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
          'https://test122.govcloud.connect.aws/request-storage-access'
      );
    });

    it('should return requestAccessPageurl if instanceUrl being localhost', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://localhost:9000',
      });
      expect(connect.storageAccess.getRequestStorageAccessUrl()).to.be.equal(
        'https://localhost:9000/request-storage-access'
      );
    });

    it('should throw error if no valid connect URLs being provided to initCCP call', () => {
      connect.storageAccess.init('https://test122.com/connect/ccp-v2', container, {
        instanceUrl: 'https://localhossst:9000',
      });

      assert.throws(
        () => {
          connect.storageAccess.getRequestStorageAccessUrl();
        },
        Error,
        '[StorageAccess] [getRequestStorageAccessUrl] Invalid Connect instance/CCP URL provided, please pass the valid Connect CCP URL or in case CCP URL is configured to be the SSO URL then use storageAccess.instanceUrl and pass the Connect CCP URL'
      );
    });

    it('should throw error if getRequestStorageAccessUrl called before init', () => {
      connect.storageAccess.resetStorageAccessState();
      assert.throws(
        () => {
          connect.storageAccess.getRequestStorageAccessUrl();
        },
        Error,
        '[StorageAccess] [getRequestStorageAccessUrl] Invoke connect.storageAccess.init first'
      );
    });
  });

  describe('Request method', () => {
    let onGrantSpy;

    before(() => {
      connect.storageAccess.optInForRequestAccess();
    });

    beforeEach(() => {
      onGrantSpy = sandbox.spy();
      createCcpIframeStub();
      sandbox.replaceGetter(iframe, 'contentWindow', () => window);
      sandbox.replace(window, 'postMessage', postMessageSpy);
    });

    it('Should trigger REQUEST post message and invoke onGrant callback', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container);
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).to.be.false;
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;
      let storageAccessRequestArgs = postMessageSpy.getCall(0).args[0];
      console.log(storageAccessRequestArgs);
      expect(storageAccessRequestArgs.event).to.be.equals('storageAccess::request');
      expect(storageAccessRequestArgs.data.landat).to.be.equals('/connect/ccp-v2');

      expect(onGrantSpy.called).to.be.true;
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).to.be.true;
      connect.storageAccess.request();

      /** Should be called only once */
      expect(onGrantSpy.calledTwice).not.to.be.true;

      connect.storageAccess.resetStorageAccessState();
      expect(connect.storageAccess.getOnGrantCallbackInvoked()).to.be.false;
    });

    it('Should hide container if mode is custom after granting access', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;

      expect(container.style.display).to.be.equals('none');
    });

    it('Should not hide container if specified not to hide the iframe in custom mode', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom', custom: { hideCCP: false } });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;
      
      expect(container.style.display).not.to.be.equals('none');
    });

    it('Should not hide container if mode is default and specified hideCCP to true', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'default' , custom: { hideCCP: true } });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;

      expect(container.style.display).not.to.be.equals('none');
    });

    it('Should not hide container if mode is default', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.GRANTED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'default' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;

      expect(container.style.display).not.to.be.equals('none');
    });

    it('Should display container if denied access for custom types', () => {
      mockMessageFromIframe({
        event: connect.storageAccess.storageAccessEvents.DENIED,
        data: {},
      });

      connect.storageAccess.init(ccpUrl, container, { mode: 'custom' });
      connect.storageAccess.setupRequestHandlers({ onGrant: onGrantSpy });
      connect.storageAccess.request();

      expect(postMessageSpy.called).to.be.true;

      expect(container.style.display).to.be.equals('block');
    });
  });

  describe('OnRequestHandlers', () => {
    let removeListerStub;
    let onInitSpy, onDenySpy, onGrantSpy;

    beforeEach(() => {
      onInitSpy = sandbox.spy();
      onDenySpy = sandbox.spy();
      onGrantSpy = sandbox.spy();
      removeListerStub = sandbox.stub(window, 'removeEventListener');
      createCcpIframeStub();
      sandbox.replaceGetter(iframe, 'contentWindow', () => window);
      sandbox.replace(window, 'postMessage', postMessageSpy);
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

      expect(onInitSpy.called).to.be.true;
      expect(onInitSpy.calledWith({ event: 'storageAccess::init', data: { hasAccess: true } })).to.be.true;
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

      expect(onDenySpy.called).to.be.true;
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

      expect(onGrantSpy.called).to.be.true;
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

      expect(onGrantSpy.called).to.be.true;

      sandbox.stub(connect.core, 'initialized').value(true);

      connect.storageAccess.onRequest({
        onInit: onInitSpy,
        onDeny: onDenySpy,
        onGrant: onGrantSpy,
      });
      expect(removeListerStub.called).to.be.true;
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

      expect(onGrantSpy.called).to.be.true;
      unsubscriber.unsubscribe();
      expect(removeListerStub.called).to.be.true;
    });
  });
});
