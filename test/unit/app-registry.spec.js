require("./test-setup.js");

describe('app-registry', function () {
  var sandbox = sinon.createSandbox();
  jsdom({ url: "http://localhost" });

  after(function () {
    sandbox.restore();
  });

  describe('register', function () {
    it('can start a app with dom', function () {
      var domContainer = document.createElement('agentApp');
      domContainer.setAttribute('id', 'agentApp');
      document.body.appendChild(domContainer);
      sandbox.spy(domContainer, 'appendChild');
      sandbox.spy(document.body, 'appendChild');
      var initFunc = sandbox.spy();
      var creator = function () { return { init: initFunc } };

      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.start('fake', creator);
      expect(initFunc.called).to.be.false;
      expect(document.body.appendChild.called).to.be.false;
      connect.agentApp.AppRegistry.start('agentApp', creator);
      expect(initFunc.called).to.be.true;
      expect(document.body.appendChild.called).to.be.false;
      expect(domContainer.appendChild.called).to.be.true;
    });
  });

  describe('stop', function () {
    it('can stop a given app', function () {
      var initFunc = sandbox.spy();
      var destoryFunc = sandbox.spy();
      var domContainer = document.getElementById('agentApp');
      sandbox.spy(domContainer, 'removeChild');
      var creator = function () { return { init: initFunc, destroy: destoryFunc } };

      connect.agentApp.AppRegistry.register('agentApp', { endpoint: 'test' }, domContainer);
      connect.agentApp.AppRegistry.start('agentApp', creator);
      expect(initFunc.called).to.be.true;

      connect.agentApp.AppRegistry.stop('test');
      expect(destoryFunc.called).to.be.false;
      expect(domContainer.removeChild.called).to.be.false;

      connect.agentApp.AppRegistry.stop('agentApp');
      expect(destoryFunc.called).to.be.true;
      expect(domContainer.removeChild.called).to.be.true;
    });
  });
});
