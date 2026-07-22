// Jest port of: onIframeRetriesExhausted, _refreshIframeOnTimeout,
// _getCCPIframe, _createCCPIframe, _showIframe/_hideIframe,
// _sendIframeStyleDataUpstreamAfterReasonableWaitTime, _setTabId.

const {
  commonAfterEach,
  setLocation,
  makeContainerDiv,
} = require('./core-test-helpers');

describe('connect.core.onIframeRetriesExhausted', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('subscribes the provided callback to IFRAME_RETRIES_EXHAUSTED', () => {
    const subscribeSpy = jest.fn();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ subscribe: subscribeSpy });
    const cb = jest.fn();

    connect.core.onIframeRetriesExhausted(cb);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenCalledWith(connect.EventType.IFRAME_RETRIES_EXHAUSTED, cb);
  });
});

describe('connect.core._refreshIframeOnTimeout', () => {
  let triggerSpy;
  let getCCPIframeSpy;
  let createCCPIframeSpy;
  let sendStyleSpy;
  let removeChildSpy;
  let fakeContentWindow;

  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
    removeChildSpy = jest.fn();
    fakeContentWindow = { windowProp1: 1 };
    getCCPIframeSpy = jest
      .spyOn(connect.core, '_getCCPIframe')
      .mockReturnValue({ parentNode: { removeChild: removeChildSpy } });
    createCCPIframeSpy = jest
      .spyOn(connect.core, '_createCCPIframe')
      .mockReturnValue({ contentWindow: fakeContentWindow });
    sendStyleSpy = jest
      .spyOn(connect.core, '_sendIframeStyleDataUpstreamAfterReasonableWaitTime')
      .mockImplementation(() => {});
    triggerSpy = jest.fn();
    jest.spyOn(connect.core, 'getEventBus').mockReturnValue({ trigger: triggerSpy });
    connect.core.upstream = { upstream: {} };
  });

  afterEach(() => {
    // Pre-null the timer handle so the helper doesn't try to clear it
    // (its bare `clearTimeout` ref isn't in the bundle's IIFE scope).
    connect.core.iframeRefreshTimeout = null;
    connect.core.iframeRefreshAttempt = null;
    jest.useRealTimers();
    connect.core.upstream = null;
    commonAfterEach();
  });

  it('tears down + recreates iframe on each retry, then stops after CCP_IFRAME_REFRESH_LIMIT (10) attempts', () => {
    const params = { ccpUrl: 'url.com' };
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    connect.core._refreshIframeOnTimeout(params, makeContainerDiv());

    // initial scheduling
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    // CCP_IFRAME_REFRESH_INTERVAL = 5_000 ms (production default; no DR, no override)
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(5000);
    // iframeRefreshAttempt is unset on first call (null); production assigns
    // (obj.iframeRefreshAttempt || 0) + 1 only after the first scheduled tick.
    expect(connect.core.iframeRefreshAttempt == null).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    // first retry tick
    jest.advanceTimersByTime(5001);
    expect(connect.core.iframeRefreshAttempt).toBe(1);
    expect(getCCPIframeSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(createCCPIframeSpy).toHaveBeenCalledTimes(1);
    expect(sendStyleSpy).toHaveBeenCalledTimes(1);
    expect(connect.core.upstream.upstream.output).toBe(fakeContentWindow);
    // schedules its next attempt
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

    const maxRetry = 10;
    for (let retry = 2; retry <= maxRetry; retry++) {
      jest.advanceTimersByTime(5001);
      expect(connect.core.iframeRefreshAttempt).toBe(retry);
    }

    expect(getCCPIframeSpy).toHaveBeenCalledTimes(maxRetry);
    expect(removeChildSpy).toHaveBeenCalledTimes(maxRetry);
    expect(createCCPIframeSpy).toHaveBeenCalledTimes(maxRetry);
    expect(sendStyleSpy).toHaveBeenCalledTimes(maxRetry);

    // exhaust retries: 11th tick increments the counter, but the condition
    // `attempt <= LIMIT` fails so production triggers IFRAME_RETRIES_EXHAUSTED
    // and clears the timeout.
    jest.advanceTimersByTime(30000);
    expect(connect.core.iframeRefreshAttempt).toBe(maxRetry + 1);
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(maxRetry + 2);
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(connect.EventType.IFRAME_RETRIES_EXHAUSTED, undefined);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(maxRetry + 1);
    // The 11th tick takes the else-branch and never calls removeChild.
    expect(removeChildSpy).toHaveBeenCalledTimes(maxRetry);

    // Once exhausted, advancing time further changes nothing.
    jest.advanceTimersByTime(300000);
    expect(connect.core.iframeRefreshAttempt).toBe(maxRetry + 1);
  });

  it('uses ccpLoadTimeout when initCCPParams provides it', () => {
    const params = { ccpUrl: 'url.com', ccpLoadTimeout: 250 };
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    connect.core._refreshIframeOnTimeout(params, makeContainerDiv());
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(250);
  });

  it('uses CCP_DR_IFRAME_REFRESH_INTERVAL when disasterRecoveryOn is true and no override is supplied', () => {
    const params = { ccpUrl: 'url.com', disasterRecoveryOn: true };
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    connect.core._refreshIframeOnTimeout(params, makeContainerDiv());
    // CCP_DR_IFRAME_REFRESH_INTERVAL = 10_000 ms (production default for DR).
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(10000);
  });

  it('preserves the existing iframe.style.cssText onto the new iframe after teardown', () => {
    const params = { ccpUrl: 'url.com' };
    getCCPIframeSpy.mockReturnValueOnce({
      parentNode: { removeChild: removeChildSpy },
      style: { cssText: 'width: 50%;' },
    });
    const newIframe = { contentWindow: fakeContentWindow };
    createCCPIframeSpy.mockReturnValueOnce(newIframe);

    connect.core._refreshIframeOnTimeout(params, makeContainerDiv());
    jest.advanceTimersByTime(5001);

    expect(newIframe.style).toBe('width: 50%;');
  });

  it('still recovers when _getCCPIframe returns null (first run, no prior iframe)', () => {
    const params = { ccpUrl: 'url.com' };
    getCCPIframeSpy.mockReturnValueOnce(null);
    const newIframe = { contentWindow: fakeContentWindow };
    createCCPIframeSpy.mockReturnValueOnce(newIframe);

    connect.core._refreshIframeOnTimeout(params, makeContainerDiv());
    jest.advanceTimersByTime(5001);

    expect(removeChildSpy).not.toHaveBeenCalled();
    expect(createCCPIframeSpy).toHaveBeenCalledTimes(1);
    expect(connect.core.upstream.upstream.output).toBe(fakeContentWindow);
  });
});

describe('connect.core._getCCPIframe', () => {
  beforeEach(() => {
    setLocation('http://localhost');
  });

  afterEach(() => {
    commonAfterEach();
  });

  it('returns the iframe matching CCP_IFRAME_NAME', () => {
    const ccpIframe = { name: 'Amazon Connect CCP' };
    const otherIframe = { name: 'hello' };
    jest
      .spyOn(window.document, 'getElementsByTagName')
      .mockReturnValue([ccpIframe, otherIframe]);

    expect(connect.core._getCCPIframe()).toBe(ccpIframe);
  });

  it('returns null when no iframe matches CCP_IFRAME_NAME', () => {
    jest.spyOn(window.document, 'getElementsByTagName').mockReturnValue([{ name: 'hello' }]);
    expect(connect.core._getCCPIframe()).toBeNull();
  });

  it('filters by data-identifier when one is supplied', () => {
    const primary = { name: 'Amazon Connect CCP', dataset: { identifier: 'primary' } };
    const secondary = { name: 'Amazon Connect CCP', dataset: { identifier: 'secondary' } };
    jest.spyOn(window.document, 'getElementsByTagName').mockReturnValue([primary, secondary]);

    expect(connect.core._getCCPIframe('primary')).toBe(primary);
    expect(connect.core._getCCPIframe('secondary')).toBe(secondary);
    expect(connect.core._getCCPIframe('tertiary')).toBeNull();
  });
});

describe('connect.core._createCCPIframe', () => {
  let fakeIframe;
  let containerDiv;
  let createElementSpy;
  let baseParams;

  const expectedDefault = (overrides = {}) => ({
    iframeId: 1,
    dataset: {},
    src: 'url.com',
    allow: 'microphone; camera; autoplay; clipboard-write; identity-credentials-get',
    style: 'width: 100%; height: 100%;',
    title: 'Amazon Connect CCP',
    name: 'Amazon Connect CCP',
    ...overrides,
  });

  beforeEach(() => {
    setLocation('http://localhost');
    fakeIframe = { iframeId: 1, dataset: {} };
    containerDiv = makeContainerDiv();
    createElementSpy = jest.spyOn(global.document, 'createElement').mockReturnValue(fakeIframe);
    connect.core.iframeStyle = 'width: 100%; height: 100%;';
    baseParams = { ccpUrl: 'url.com' };
  });

  afterEach(() => {
    connect.core.iframeStyle = null;
    commonAfterEach();
  });

  it('appends an iframe with the default title when iframeTitle is not provided', () => {
    const result = connect.core._createCCPIframe(containerDiv, baseParams);
    expect(containerDiv.appendChild).toHaveBeenCalledTimes(1);
    expect(containerDiv.appendChild).toHaveBeenCalledWith(expectedDefault());
    expect(result).toEqual(expectedDefault());
  });

  it('overrides the iframe title when iframeTitle is provided', () => {
    const params = { ...baseParams, iframeTitle: 'title' };
    const result = connect.core._createCCPIframe(containerDiv, params);
    expect(containerDiv.appendChild).toHaveBeenCalledWith(expectedDefault({ title: 'title' }));
    expect(result).toEqual(expectedDefault({ title: 'title' }));
  });

  it('calls document.createElement with "iframe"', () => {
    connect.core._createCCPIframe(containerDiv, baseParams);
    expect(createElementSpy).toHaveBeenCalledTimes(1);
    expect(createElementSpy).toHaveBeenCalledWith('iframe');
  });

  it('honours the style attribute supplied by the caller', () => {
    const style = 'width:200px; height:200px;';
    const result = connect.core._createCCPIframe(containerDiv, { ...baseParams, style });
    expect(containerDiv.appendChild).toHaveBeenCalledWith(expectedDefault({ style }));
    expect(result).toEqual(expectedDefault({ style }));
  });

  it('writes the supplied identifier into iframe.dataset.identifier', () => {
    const result = connect.core._createCCPIframe(containerDiv, baseParams, 'primary');
    expect(result.dataset).toEqual({ identifier: 'primary' });
  });

  it('does not rewrite ccpUrl when isFlexibleWorkspace is omitted', () => {
    const result = connect.core._createCCPIframe(containerDiv, baseParams);
    expect(result.src).toBe('url.com');
  });
});

describe('connect.core._showIframe / _hideIframe', () => {
  let fakeIframe;
  let containerDiv;
  let baseParams;

  beforeEach(() => {
    setLocation('http://localhost');
    fakeIframe = { iframeId: 1, dataset: {} };
    containerDiv = makeContainerDiv();
    jest.spyOn(global.document, 'createElement').mockReturnValue(fakeIframe);
    connect.core.iframeStyle = 'width: 100%; height: 100%;';
    baseParams = { ccpUrl: 'url.com' };
  });

  afterEach(() => {
    connect.core.iframeStyle = null;
    commonAfterEach();
  });

  it('hides the iframe by suffixing display:none and shows it again by restoring iframeStyle', () => {
    const iframe = connect.core._createCCPIframe(containerDiv, baseParams);
    expect(iframe.style).toBe('width: 100%; height: 100%;');

    connect.core._hideIframe(iframe);
    expect(iframe.style).toBe('width: 100%; height: 100%;display: none;');

    connect.core._showIframe(iframe);
    expect(iframe.style).toBe('width: 100%; height: 100%;');
  });

  it('repeated hide/show calls remain stable (idempotent)', () => {
    const iframe = connect.core._createCCPIframe(containerDiv, baseParams);

    connect.core._hideIframe(iframe);
    connect.core._hideIframe(iframe);
    connect.core._hideIframe(iframe);
    expect(iframe.style).toBe('width: 100%; height: 100%;display: none;');

    connect.core._showIframe(iframe);
    connect.core._showIframe(iframe);
    connect.core._showIframe(iframe);
    expect(iframe.style).toBe('width: 100%; height: 100%;');
  });

  it('respects a customer-supplied iframeStyle when toggling', () => {
    const customStyle = 'width: 22%; height: 11%; display: block;';
    connect.core.iframeStyle = customStyle;

    const iframe = connect.core._createCCPIframe(containerDiv, baseParams);
    expect(iframe.style).toBe(customStyle);

    connect.core._hideIframe(iframe);
    expect(iframe.style).toBe(customStyle + 'display: none;');

    connect.core._showIframe(iframe);
    expect(iframe.style).toBe(customStyle);
  });
});

describe('connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime', () => {
  beforeEach(() => {
    setLocation('http://localhost');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    commonAfterEach();
  });

  it('schedules its work via setTimeout(..., 10000)', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const iframe = { offsetWidth: 5, offsetHeight: 5, getClientRects: () => ({ length: 1 }) };
    const conduit = { sendUpstream: jest.fn() };

    connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(iframe, conduit);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(10000);
  });

  it('sends IFRAME_STYLE upstream once the timeout elapses, with computed style data', () => {
    const iframe = {
      offsetWidth: 5,
      offsetHeight: 5,
      getClientRects: () => ({ length: 1 }),
    };
    const sendUpstreamSpy = jest.fn();
    const conduit = { sendUpstream: sendUpstreamSpy };
    jest.spyOn(global.window, 'getComputedStyle').mockReturnValue({ display: 'display' });

    connect.core._sendIframeStyleDataUpstreamAfterReasonableWaitTime(iframe, conduit);
    jest.advanceTimersByTime(10001);

    expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.EventType.IFRAME_STYLE, {
      display: 'display',
      offsetWidth: 5,
      offsetHeight: 5,
      clientRectsLength: 1,
    });
  });
});

describe('connect.core._setTabId', () => {
  let sendUpstreamSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    window.sessionStorage.clear();
    sendUpstreamSpy = jest.fn();
    connect.core.upstream = { sendUpstream: sendUpstreamSpy };
    connect.core.tabId = null;
  });

  afterEach(() => {
    connect.core.upstream = null;
    commonAfterEach();
  });

  it('creates a new tabId and stores it in sessionStorage when none is present', () => {
    connect.core._setTabId();
    const stored = window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID);
    expect(stored).toBeTruthy();
    expect(connect.core.tabId).toBe(stored);
    expect(sendUpstreamSpy).toHaveBeenCalledTimes(1);
    expect(sendUpstreamSpy).toHaveBeenCalledWith(connect.EventType.TAB_ID, { tabId: stored });
  });

  it('reuses the stored tabId on subsequent calls', () => {
    connect.core._setTabId();
    const firstTabId = window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID);
    connect.core.tabId = null;

    connect.core._setTabId();
    const secondTabId = window.sessionStorage.getItem(connect.SessionStorageKeys.TAB_ID);
    expect(secondTabId).toBe(firstTabId);
    expect(connect.core.tabId).toBe(firstTabId);
  });

  it('does not throw if sendUpstream raises (best-effort path)', () => {
    connect.core.upstream.sendUpstream = () => {
      throw new Error('downstream broke');
    };
    expect(() => connect.core._setTabId()).not.toThrow();
  });
});

