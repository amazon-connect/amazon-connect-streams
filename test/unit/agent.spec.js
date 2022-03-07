require("../unit/test-setup.js");

describe('Agent APIs', () => {
  const sandbox = sinon.createSandbox();
  let agent;
  before(() => {
    connect.agent.initialized = true;
    connect.core.getAgentDataProvider = sinon.stub().returns({
      getAgentData: () => ({})
    });
    agent = new connect.Agent();
  });
  after(() => {
    connect.agent.initialized = false;
    sandbox.restore();
  });
  describe('setConfiguration', () => {
    let mockedClientCall;
    before(() => {
      mockedClientCall = sinon.stub();
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: mockedClientCall
      }));
    });
    afterEach(() => {
      mockedClientCall.resetHistory();
    });
    after(() => {
      connect.core.getClient.restore();
    });
    it('should call UPDATE_AGENT_CONFIGURATION api with a given configuration object', () => {
      const configuration = {
        agentPreferences: { locale: "en_US" },
        someValue: 'test'
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration });
    });

    it('should copy LANGUAGE value to locale if locale is missing and LANGUAGE exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "en_US" }
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "en_US" }
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration: expectedConfiguration });
    });

    it('should NOT copy LANGUAGE value to locale if locale already exists', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "de_DE" }
      };
      const expectedConfiguration = {
        agentPreferences: { LANGUAGE: "en_US", locale: "de_DE" }
      };
      agent.setConfiguration(configuration);
      expect(mockedClientCall.firstCall.args[0]).to.equal(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION);
      expect(mockedClientCall.firstCall.args[1]).to.deep.equal({ configuration: expectedConfiguration });
    });

    it('should assert if configuration object is not passed in', () => {
      sinon.stub(connect, 'assertNotNull');
      agent.setConfiguration();
      expect(connect.assertNotNull.called).to.be.true;
      connect.assertNotNull.restore();
    });

    it('should invoke failure callback if the provided locale is invalid', () => {
      const configuration = {
        agentPreferences: { locale: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).not.to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).to.be.true;
      expect(callbacks.failure.firstCall.args[0]).to.equal(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should invoke failure callback if the provided LANGUAGE is invalid', () => {
      const configuration = {
        agentPreferences: { LANGUAGE: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).not.to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).to.be.true;
      expect(callbacks.failure.firstCall.args[0]).to.equal(connect.AgentErrorStates.INVALID_LOCALE);
    });

    it('should NOT invoke failure callback if the provided LANGUAGE is invalid but locale is valid', () => {
      const configuration = {
        agentPreferences: { locale: "en_US", LANGUAGE: "invalid" }
      };
      const callbacks = {
        success: sinon.stub(),
        failure: sinon.stub()
      };
      agent.setConfiguration(configuration, callbacks);
      expect(mockedClientCall.called).to.be.true;
      expect(callbacks.success.called).not.to.be.true;
      expect(callbacks.failure.called).not.to.be.true;
    });
  });
});