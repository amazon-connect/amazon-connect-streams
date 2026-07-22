// Jest port of #connect.core.terminate() describe.

const { commonAfterEach, makeContainerDiv, setLocation } = require('./core-test-helpers');

describe('connect.core.terminate()', () => {
  let containerDiv;
  let params;
  let createElementSpy;

  beforeEach(() => {
    setLocation('http://localhost');
    containerDiv = makeContainerDiv();
    params = {
      ccpUrl: 'url.com',
      softphone: { allowFramedSoftphone: true },
      loginOptions: { autoClose: true },
    };
    createElementSpy = jest.spyOn(document, 'createElement');
    connect.core.initialized = false;
  });

  afterEach(() => {
    commonAfterEach();
  });

  // The Mocha spec wrapped its assertions in try/catch helpers that returned
  // booleans - silent passes when assertions failed. The Jest port replaces
  // those helpers with direct expects so any unmet invariant fails the test.
  const expectCCPInitialized = () => {
    expect(params.ccpUrl).not.toBeNull();
    expect(containerDiv).not.toBeNull();
    expect(createElementSpy).toHaveBeenCalled();
    expect(containerDiv.appendChild).toHaveBeenCalled();
  };

  const expectCCPTerminated = () => {
    expect(connect.core.client).toEqual({});
    expect(connect.core.apiProxyClient).toEqual({});
    expect(connect.core.masterClient).toEqual({});
    expect(connect.core.agentDataProvider).toBeNull();
    expect(connect.core.softphoneManager).toBeNull();
    expect(connect.core.upstream).toBeNull();
    expect(connect.core.keepaliveManager).toBeNull();
    expect(connect.agent.initialized).toBe(false);
    expect(connect.core.initialized).toBe(false);
    expect(connect.core.eventBus.logEvents).toBe(false);
  };

  it('terminates Connect cleanly after initCCP', () => {
    connect.core.initCCP(containerDiv, params);
    expectCCPInitialized();
    connect.core.terminate();
    expectCCPTerminated();
  });

  it('re-initializes correctly after terminate -> initCCP', () => {
    const storageAccessOriginal = connect.storageAccess;
    connect.storageAccess = { ...connect.storageAccess, resetStorageAccessState: jest.fn() };
    try {
      connect.core.initCCP(containerDiv, params);
      expectCCPInitialized();

      connect.core.terminate();
      expect(connect.storageAccess.resetStorageAccessState).toHaveBeenCalledTimes(1);

      connect.core.terminate();
      expect(connect.storageAccess.resetStorageAccessState).toHaveBeenCalledTimes(2);

      expectCCPTerminated();

      createElementSpy.mockClear();
      containerDiv.appendChild.mockClear();
      connect.core.initCCP(containerDiv, params);
      expectCCPInitialized();
    } finally {
      connect.storageAccess = storageAccessOriginal;
    }
  });
});
