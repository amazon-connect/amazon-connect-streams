describe('app-registry', () => {
  let domContainer;

  beforeEach(() => {
    domContainer = document.createElement('agentApp');
    domContainer.setAttribute('id', 'agentApp');
    document.body.appendChild(domContainer);
  });

  afterEach(() => {
    domContainer.remove();
  });

  describe('register / start', () => {
    it('does not start an unregistered app', () => {
      const initFunc = jest.fn();
      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'test' }, domContainer);

      connect.agentApp.AppRegistry.start('fake', () => ({ init: initFunc }));
      expect(initFunc).not.toHaveBeenCalled();
    });

    it('starts a non-ccp app by initializing it in an iframe', () => {
      const initFunc = jest.fn();
      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'https://example.com' }, domContainer);
      connect.agentApp.AppRegistry.start('agentApp', () => ({ init: initFunc }));

      expect(initFunc).toHaveBeenCalled();

      const iframe = domContainer.querySelector('iframe');
      expect(iframe.src).toBe('https://example.com/');
      expect(iframe.id).toBe('agentApp');
      expect(iframe.getAttribute('sandbox')).toBe(
        'allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
      );
    });

    it('does not create an iframe when starting the ccp app', () => {
      const containerAppendSpy = jest.spyOn(domContainer, 'appendChild');
      const creator = () => ({ init: jest.fn() });
      connect.agentApp.AppRegistry.register('ccp', { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.start('ccp', creator);

      expect(containerAppendSpy).not.toHaveBeenCalled();
      expect(domContainer.querySelector('iframe')).toBeNull();
    });
  });

  describe('stop', () => {
    it('destroys only the matching app and removes it from its container', () => {
      const initFunc = jest.fn();
      const destroyFunc = jest.fn();
      const removeChildSpy = jest.spyOn(domContainer, 'removeChild');
      const creator = () => ({ init: initFunc, destroy: destroyFunc });

      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.start('agentApp', creator);
      expect(initFunc).toHaveBeenCalled();

      connect.agentApp.AppRegistry.stop('test');
      expect(destroyFunc).not.toHaveBeenCalled();
      expect(removeChildSpy).not.toHaveBeenCalled();

      connect.agentApp.AppRegistry.stop('agentApp');
      expect(destroyFunc).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('can stop a customviews app', () => {
      const appName = 'customviews-1';
      const querySelectorSpy = jest.spyOn(domContainer, 'querySelector');
      const creator = () => ({ init: jest.fn(), destroy: jest.fn() });

      connect.agentApp.AppRegistry.register(appName, { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.start(appName, creator);
      connect.agentApp.AppRegistry.stop(appName);

      expect(querySelectorSpy).toHaveBeenCalledWith(`iframe[id='${appName}']`);
    });
  });

  describe('get', () => {
    it('returns the registered module data', () => {
      const config = { endpoint: 'test', style: 'width:100%' };
      connect.agentApp.AppRegistry.register('agentApp', config, domContainer);

      const data = connect.agentApp.AppRegistry.get('agentApp');
      expect(data.endpoint).toBe('test');
      expect(data.containerDOM).toBe(domContainer);
    });

    it('returns undefined for an unregistered app', () => {
      expect(connect.agentApp.AppRegistry.get('missing')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes the registered app', () => {
      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.delete('agentApp');

      expect(connect.agentApp.AppRegistry.get('agentApp')).toBeUndefined();
    });
  });
});
