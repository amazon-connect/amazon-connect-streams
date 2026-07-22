// Jest port of the auth-handler describes from core.spec.js:
// _handleAuthorizeSuccess, _handleAuthFail, _handleAuthorizeFail,
// _redirectOnAuthFail, _redirectToLogin, _handleCTIAuthFail,
// _triggerAuthorizeSuccess / _triggerAuthFail, _getAuthRetryCount,
// _incrementAuthRetryCount, onAuthorizeRetriesExhausted/onCTIAuthorizeRetriesExhausted,
// onLogout, legacy endpoint, new endpoint.

const {
  commonAfterEach,
  defaultParams,
  installCoreMocks,
  setLocation,
} = require('./core-test-helpers');

describe('connect.core._handleAuthorizeSuccess', () => {
  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('resets the authRetryCount to 0', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, '5');
    connect.core._handleAuthorizeSuccess();
    expect(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT)).toBe('0');
  });
});

describe('connect.core._handleAuthFail', () => {
  const loginUrl = 'fakeLoginUrl.com/login';
  const authorizeEndpoint = '/authorize';
  let handleAuthorizeFailSpy;
  let handleCTIAuthFailSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    handleAuthorizeFailSpy = jest.spyOn(connect.core, '_handleAuthorizeFail').mockImplementation(() => {});
    handleCTIAuthFailSpy = jest.spyOn(connect.core, '_handleCTIAuthFail').mockImplementation(() => {});
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('calls _handleAuthorizeFail when authFailData has authorize=true', () => {
    connect.core._handleAuthFail(loginUrl, authorizeEndpoint, { authorize: true });
    expect(handleAuthorizeFailSpy).toHaveBeenCalledTimes(1);
    expect(handleAuthorizeFailSpy).toHaveBeenCalledWith(loginUrl);
  });

  it('calls _handleCTIAuthFail when authFailData is null', () => {
    connect.core._handleAuthFail(loginUrl, authorizeEndpoint, null);
    expect(handleCTIAuthFailSpy).toHaveBeenCalledTimes(1);
    expect(handleCTIAuthFailSpy).toHaveBeenCalledWith(authorizeEndpoint);
  });
});

describe('connect.core._handleAuthorizeFail', () => {
  const loginUrl = 'fakeLoginUrl.com/login';
  let redirectToLoginSpy;
  let triggerSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    jest.useFakeTimers();
    redirectToLoginSpy = jest.spyOn(connect.core, '_redirectToLogin').mockImplementation(() => {});
    triggerSpy = jest.fn();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ trigger: triggerSpy });
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('does not call redirectToLogin when authRetryCount exceeds the session max', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, '4');
    connect.core._handleAuthorizeFail(loginUrl);
    jest.runAllTimers();

    expect(redirectToLoginSpy).not.toHaveBeenCalled();
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED);
  });

  it('does not call redirectToLogin when authorizeTimeoutId is set', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, '0');
    connect.core.authorizeTimeoutId = 'randomId';
    connect.core._handleAuthorizeFail(loginUrl);
    jest.runAllTimers();

    expect(redirectToLoginSpy).not.toHaveBeenCalled();
  });

  it('calls redirectToLogin when retries remain and timeout is clear', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, '0');
    connect.core.authorizeTimeoutId = null;
    connect.core._handleAuthorizeFail(loginUrl);
    jest.runAllTimers();

    expect(redirectToLoginSpy).toHaveBeenCalledWith(loginUrl);
  });
});

describe('connect.core._redirectToLogin', () => {
  let assignSpy;
  let reloadSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    assignSpy = window.location.assign;
    reloadSpy = window.location.reload;
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('assigns window.location when loginUrl is a string', () => {
    connect.core._redirectToLogin('fakeLogin/login');
    expect(assignSpy).toHaveBeenCalledWith('fakeLogin/login');
  });

  it('reloads the page when loginUrl is not a string', () => {
    connect.core._redirectToLogin(undefined);
    expect(reloadSpy).toHaveBeenCalled();
  });
});

describe('connect.core._handleCTIAuthFail', () => {
  const authorizeEndpoint = 'fakeLoginUrl.com/authorize';
  let authorizeSpy;
  let triggerSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    jest.useFakeTimers();
    authorizeSpy = jest.spyOn(connect.core, 'authorize').mockResolvedValue();
    jest.spyOn(connect.core, '_triggerAuthorizeSuccess').mockImplementation(() => {});
    jest.spyOn(connect.core, '_triggerAuthFail').mockImplementation(() => {});
    triggerSpy = jest.fn();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ trigger: triggerSpy });
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('does nothing when ctiTimeoutId is set', () => {
    connect.core.ctiAuthRetryCount = 0;
    connect.core.ctiTimeoutId = 'someId';
    connect.core._handleCTIAuthFail(authorizeEndpoint);

    expect(authorizeSpy).not.toHaveBeenCalled();
  });

  it('fires CTI_AUTHORIZE_RETRIES_EXHAUSTED when retry count exceeds the max', () => {
    connect.core.ctiAuthRetryCount = 11;
    connect.core._handleCTIAuthFail(authorizeEndpoint);

    expect(authorizeSpy).not.toHaveBeenCalled();
    expect(triggerSpy).toHaveBeenCalledWith(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED);
  });

  it('calls authorize after a delay when retries remain', async () => {
    connect.core.ctiAuthRetryCount = 0;
    connect.core.ctiTimeoutId = null;
    connect.core._handleCTIAuthFail(authorizeEndpoint);
    await jest.advanceTimersByTimeAsync(1000);

    expect(authorizeSpy).toHaveBeenCalledWith(authorizeEndpoint);
  });
});

describe('connect.core._triggerAuthorizeSuccess / _triggerAuthFail', () => {
  let triggerSpy;
  let sendDownstreamSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    triggerSpy = jest.fn();
    sendDownstreamSpy = jest.fn();
    jest.spyOn(connect.core, 'getUpstream').mockReturnValue({
      upstreamBus: { trigger: triggerSpy },
      sendDownstream: sendDownstreamSpy,
    });
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('triggers AUTHORIZE_SUCCESS and AUTH_FAIL on the upstreamBus', () => {
    connect.core._triggerAuthorizeSuccess();
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(connect.EventType.AUTHORIZE_SUCCESS);

    const data = { authorize: true };
    connect.core._triggerAuthFail(data);
    expect(triggerSpy).toHaveBeenCalledWith(connect.EventType.AUTH_FAIL, data);
  });
});

describe('connect.core._getAuthRetryCount', () => {
  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('returns 0 when the storage key is unset', () => {
    expect(connect.core._getAuthRetryCount()).toBe(0);
  });

  it('throws when the storage value is non-numeric', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, 'hellllllllo');
    expect(() => connect.core._getAuthRetryCount()).toThrow();
  });

  it('returns the storage field as an int when it is a valid number', () => {
    window.sessionStorage.setItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT, '5');
    expect(connect.core._getAuthRetryCount()).toBe(5);
  });
});

describe('connect.core._incrementAuthRetryCount', () => {
  let getAuthRetryCountSpy;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    getAuthRetryCountSpy = jest.spyOn(connect.core, '_getAuthRetryCount').mockReturnValue(0);
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('sets the storage key to count + 1', () => {
    connect.core._incrementAuthRetryCount();
    expect(parseInt(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT), 10)).toBe(1);

    getAuthRetryCountSpy.mockReturnValue(1);
    connect.core._incrementAuthRetryCount();
    expect(parseInt(window.sessionStorage.getItem(connect.SessionStorageKeys.AUTHORIZE_RETRY_COUNT), 10)).toBe(2);
  });
});

describe('connect.core.onAuthorizeRetriesExhausted / onCTIAuthorizeRetriesExhausted', () => {
  let subscribeSpy;
  let inputFn;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    subscribeSpy = jest.fn();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ subscribe: subscribeSpy });
    inputFn = jest.fn();
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('subscribes the input function to AUTHORIZE_RETRIES_EXHAUSTED and CTI_AUTHORIZE_RETRIES_EXHAUSTED', () => {
    connect.core.onAuthorizeRetriesExhausted(inputFn);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenCalledWith(connect.EventType.AUTHORIZE_RETRIES_EXHAUSTED, inputFn);

    connect.core.onCTIAuthorizeRetriesExhausted(inputFn);
    expect(subscribeSpy).toHaveBeenCalledTimes(2);
    expect(subscribeSpy).toHaveBeenCalledWith(connect.EventType.CTI_AUTHORIZE_RETRIES_EXHAUSTED, inputFn);
  });
});


describe('connect.core.initSharedWorker - legacy endpoint', () => {
  let params;

  beforeEach(() => {
    setLocation('https://abc.awsapps.com/connect/ccp-v2');
    installCoreMocks();
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(true);
    params = defaultParams();
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('uses the legacy /connect/auth/authorize endpoint for an awsapps.com URL', () => {
    connect.core.initSharedWorker(params);
    expect(connect.Conduit.prototype.sendUpstream).toHaveBeenCalled();
    const lastCall = connect.Conduit.prototype.sendUpstream.mock.calls[0];
    const lastArg = lastCall[lastCall.length - 1];
    expect(lastArg.authorizeEndpoint).toBe('/connect/auth/authorize');
  });
});

describe('connect.core.initSharedWorker - new endpoint', () => {
  let params;

  beforeEach(() => {
    setLocation('https://abc.my.connect.aws/ccp-v2');
    installCoreMocks();
    jest.spyOn(connect.core, 'checkNotInitialized').mockReturnValue(true);
    params = defaultParams({ baseUrl: 'https://abc.my.connect.aws' });
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('uses the new /auth/authorize endpoint for a my.connect.aws URL', () => {
    connect.core.initSharedWorker(params);
    expect(connect.Conduit.prototype.sendUpstream).toHaveBeenCalled();
    const lastCall = connect.Conduit.prototype.sendUpstream.mock.calls[0];
    const lastArg = lastCall[lastCall.length - 1];
    expect(lastArg.authorizeEndpoint).toBe('/auth/authorize');
  });
});
