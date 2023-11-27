/**
 * Module which gets used for the Request storage access
 * Exposes init, hasAccess, request and onRequest methods.
 * utilizes core post message technique to communicate back to the parent which invokes the storage access
 *
 * @usage - Used by initCCP and customer can make use of onRequest callbacks , this will be called even before agent login
 *
 * Example -
 * connect.storageAccess.onRequest({
 *  onInit(){},
 *  onDeny(){},
 *  onGrant(){}
 * });
 *
 * There are 4 lifecycle methods in the storage access check
 *
 * a)  Request - StreamJS would request for storage access check to the embedded Connect hosted storage access banner
 * b)  Init - Storage access banner inits the access check and sends back the current access state with hasAccess set to true or false
 *           this is the step where we show the actual RSA banner to agents and for custom use cases hidden container will be shown
 * c)  Grant [optional] - Executes when Agent/user accepts storage access or already given grant
 * d)  Deny [optional] - Executes when Agent/user deny the storage access/
 *
 * In a positive flow - we should expect Request, Init, Grant and negative Request, Init, Deny
 *
 * Chrome Implementation of RSA API can be found here - https://github.com/cfredric/chrome-storage-access-api
 */
(function () {
  const global = this || globalThis;
  const connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  const requestStorageAccessPath = '/request-storage-access';
  /**
   * Configurable options exposed via initCCP
   * By default canRequest will be set to false to make this as a explicit opt in
   */
  const defaultStorageAccessParams = {
    /* Config which controls the opt out/in - we expect customers to explicitely opt out. */
    canRequest: true,
    /* ["custom", "default"] - decides the rsa page view */
    mode: 'default',
    custom: {
      hideCCP: true, // only applicable in custom mode
      /**
       * Only applicable for custom type RSA page and these messages should be localized by customers
       *
       * title: 'Cookie Notice',
       * header: 'Please provide access'
       *
       */
    },
  };

  let storageParams = {};
  let originalCCPUrl = '';
  let rsaContainer = null;
  let requesthandlerUnsubscriber;

  const storageAccessEvents = {
    INIT: 'storageAccess::init',
    GRANTED: 'storageAccess::granted',
    DENIED: 'storageAccess::denied',
    REQUEST: 'storageAccess::request',
  };

  const initStorageParams = (params = {}) => {
    params.custom = params.custom || {};
    storageParams = {
      ...defaultStorageAccessParams,
      ...params,
      custom: {
        ...defaultStorageAccessParams.custom,
        ...params.custom,
      },
    };
    storageParams.canRequest = !(storageParams.canRequest === 'false' || storageParams.canRequest === false);
  };

  const resetStorageAccessState = () => {
    storageParams = {};
    originalCCPUrl = '';
    rsaContainer = null;
  };

  /**
   * Handle display none/block properties for the RTSA container, if customer have different settings like height, opacity, positions etc configured they are encouraged to use
   * onRequest Callback handle to reset the same.
   * */
  const getRSAContainer = () => ({
    show: () => {
      rsaContainer.style.display = 'block';
    },
    hide: () => {
      rsaContainer.style.display = 'none';
    },
  });

  /**
   * Custom Mode will show minimalistic UI - without any Connect references or Connect headers
   *  This will allow fully Custom CCPs to use banner and use minimal real estate to show the storage access Content
   * */
  const isCustomRequestAccessMode = () => storageParams && storageParams.mode === 'custom';

  /**
   * Check if the user wants to hide CCP
   * By default this is true
   */
  const hideCCP = () => storageParams?.custom?.hideCCP;

  const isConnectDomain = (origin) =>
    origin.match(/.connect.aws.a2z.com|.my.connect.aws|.govcloud.connect.aws|.awsapps.com/);

  /**
   * Given the URL, this method generates the prefixed connect domain request storage access URL
   * @param {string} url
   * @returns {string}
   */
  const getRsaUrlWithprefix = (url) => {
    const { origin, pathname } = new URL(url);
    if (origin.match(/.awsapps.com/)) {
      let prefix = 'connect';
      if (pathname.startsWith('/connect-gamma')) {
        prefix = 'connect-gamma';
      }
      return `${origin}/${prefix}${requestStorageAccessPath}`;
    } else {
      return `${origin}${requestStorageAccessPath}`;
    }
  };

  const isLocalhost = (url) => url.match(/^https?:\/\/localhost/);

  /**
   * Fetches the landat path for request storage access page to navigate. This is typically CCP path or channel view
   * @returns {string}
   */
  const getlandAtPath = () => {
    if (!originalCCPUrl) {
      throw new Error('[StorageAccess] [getlandAtPath] Invoke connect.storageAccess.init first');
    }

    if (isConnectDomain(originalCCPUrl) || isLocalhost(originalCCPUrl)) {
      const { pathname } = new URL(originalCCPUrl);
      return pathname;
    }

    return '/connect/ccp-v2';
  };

  /**
   *
   * Method which returns the relative request-storage-access page path.
   * Validates against localhost and connect domains and returns prefixed path
   * @returns {string}
   */
  const getRequestStorageAccessUrl = () => {
    // ccpUrl may contain non standard direct SSO URLs in which case we may ask customers to provide instanceUrl as part of storage access params

    if (!originalCCPUrl) {
      throw new Error('[StorageAccess] [getRequestStorageAccessUrl] Invoke connect.storageAccess.init first');
    }

    if (isConnectDomain(originalCCPUrl)) {
      return getRsaUrlWithprefix(originalCCPUrl);
    } else if (isLocalhost(originalCCPUrl)) {
      connect.getLog().info(`[StorageAccess] [CCP] Local testing`);
      return `${originalCCPUrl}${requestStorageAccessPath}`;
    } else if (storageParams.instanceUrl && isConnectDomain(storageParams.instanceUrl)) {
      connect
        .getLog()
        .info(
          `[StorageAccess] [getRequestStorageAccessUrl] Customer has provided storageParams.instanceUrl ${storageParams.instanceUrl}`
        );

      return getRsaUrlWithprefix(storageParams.instanceUrl);
    } else if (storageParams.instanceUrl && isLocalhost(storageParams.instanceUrl)) {
      connect.getLog().info(`[StorageAccess] [getRequestStorageAccessUrl] Local testing`);
      return `${storageParams.instanceUrl}${requestStorageAccessPath}`;
    } else {
      connect
        .getLog()
        .error(
          `[StorageAccess] [getRequestStorageAccessUrl] Invalid Connect instance/CCP URL provided, please pass the correct ccpUrl or storageAccess.instanceUrl parameters`
        );
      // FIXME - For test cases to succeed passing original parameter back instead throw an error by fixing all the CCP URL parameters accross the tests.
      throw new Error(
        `[StorageAccess] [getRequestStorageAccessUrl] Invalid Connect instance/CCP URL provided, please pass the valid Connect CCP URL or in case CCP URL is configured to be the SSO URL then use storageAccess.instanceUrl and pass the Connect CCP URL`
      );
    }
  };

  /**
   * Method which allows customers to listen on Storage access request and it's state changes
   * @param {Object} consists of callbacks for the onInit, onDeny and onGrants
   */
  const onRequestHandler = ({ onInit, onDeny, onGrant }) => {
    function handleUpstreamMessages({ data, source }) {
      const iframeContainer = connect.core._getCCPIframe();
      if (iframeContainer.contentWindow !== source) {
        // disabling the logs for now
        // connect.getLog().error('[StorageAccess][onRequestHandler] Request Coming from unknown domain %s', origin);
        return false;
      }

      if (connect.core.initialized) {
        window.removeEventListener('message', handleUpstreamMessages);
      }

      switch (data.event) {
        case storageAccessEvents.INIT: {
          connect.getLog().info(`[StorageAccess][INIT] message recieved`).withObject(data);
          if (onInit) {
            onInit(data);
          }
          break;
        }

        case storageAccessEvents.GRANTED: {
          connect.getLog().info(`[StorageAccess][GRANTED] message recieved`).withObject(data);
          if (onGrant) {
            onGrant(data);
          }
          break;
        }

        case storageAccessEvents.DENIED: {
          connect.getLog().info(`[StorageAccess][DENIED] message recieved`).withObject(data);
          if (onDeny) {
            onDeny(data);
          }
          break;
        }

        default: {
          // Make sure to clean up the handler as soon as the access is granted.
          if (connect.core.initialized) {
            window.removeEventListener('message', handleUpstreamMessages);
          }
          break;
        }
      }
    }
    // do this only if canRequest is set to true
    if (storageParams.canRequest) {
      window.addEventListener('message', handleUpstreamMessages);
    }

    return {
      unsubscribe: () => {
        window.removeEventListener('message', handleUpstreamMessages);
      },
    };
  };

  /**
   * setupRequestHandlers - method which attaches post message handlers and let the initCCP flow to continue.
   * In case of custom CCPs - it also does hide/show the container.
   * @param {*} param0
   */
  const setupRequestHandlers = ({ onGrant: onGrantCallback }) => {
    if (requesthandlerUnsubscriber) {
      requesthandlerUnsubscriber.unsubscribe();
    }

    let onGrantCallbackInvoked = false;

    requesthandlerUnsubscriber = onRequestHandler({
      onInit: (messageData) => {
        console.log('%c[StorageAccess][INIT]', 'background:yellow; color:black; font-size:large');
        connect.getLog().info(`[StorageAccess][onInit] callback executed`).withObject(messageData?.data);

        if (!messageData?.data.hasAccess && isCustomRequestAccessMode()) {
          getRSAContainer().show();
        }
      },

      onDeny: () => {
        console.log('%c[StorageAccess][DENIED]', 'background:red; color:black; font-size:large');
        connect.getLog().info(`[StorageAccess][onDeny] callback executed`);
        if (isCustomRequestAccessMode()) {
          getRSAContainer().show();
        }
      },

      onGrant: () => {
        console.log('%c[StorageAccess][GRANTED]', 'background:lime; color:black; font-size:large');
        connect.getLog().info(`[StorageAccess][onGrant] callback executed`);
        if (isCustomRequestAccessMode() && hideCCP()) {
          getRSAContainer().hide();
        }
        // Invoke onGrantCallback only once as it setsup initCCP callbacks and events
        if (!onGrantCallbackInvoked) {
          onGrantCallback();
          onGrantCallbackInvoked = true;
        }
      },
    });
  };

  connect.storageAccess = Object.freeze({
    /**
     * Checks wther user has opted out for storage Access checks or not
     * @returns {boolean}
     */
    canRequest: () => storageParams.canRequest,

    /**
     * Mainly used by Tests, by default storage access is enabled for all
     */
    optOutFromRequestAccess: () => {
      defaultStorageAccessParams.canRequest = false;
    },

    /**
     * Mainly used by Tests
     */
    optInForRequestAccess: () => {
      defaultStorageAccessParams.canRequest = true;
    },

    /**
     * Method which inits the Storage Access module with Customer paramters.
     * and generates request storage access URL and apply customization to the default paramters
     * @param {*} params -  storage access params
     * @param {*} container - Container where CCP is being shown
     * @returns {{canRequest, requestAccessPageurl}}
     */
    init: (ccpUrl, containerDiv, params = {}) => {
      connect.assertNotNull(ccpUrl, 'ccpUrl');
      connect.assertNotNull(containerDiv, 'container');
      rsaContainer = containerDiv;
      originalCCPUrl = ccpUrl;
      initStorageParams(params);
      connect
        .getLog()
        .info(
          `[StorageAccess][init] Request Storage Acccess init called with ccpUrl - ${ccpUrl} - ${
            !storageParams.canRequest
              ? 'user has opted out, skipping request storage access'
              : 'Proceeding with requesting storage access'
          }`
        )
        .withObject(storageParams);
    },

    setupRequestHandlers,
    getRequestStorageAccessUrl,
    storageAccessEvents,
    resetStorageAccessState,
    getStorageAccessParams: () => storageParams,
    onRequest: onRequestHandler,
    request: () => {
      const iframeContainer = connect.core._getCCPIframe();
      iframeContainer.contentWindow.postMessage(
        {
          event: storageAccessEvents.REQUEST,
          data: { ...storageParams, landat: getlandAtPath() },
        },
        '*'
      );
    },
  });
})();
