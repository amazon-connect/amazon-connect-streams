require("../unit/test-setup.js");

describe('VoiceId', () => {
  const sandbox = sinon.createSandbox();

  const connectionId = "connectionId";
  const contactId = "contactId";
  const instanceId = "instanceId";
  const AWSAccountId = "AWSAccountId";
  const initMediaController = sinon.spy();

  before(() => {
    connect.core.getAgentDataProvider = sinon.stub().returns({
      getContactData: () => ({ connections: [{ state: { type: "connected" }}]}),
      _initMediaController: initMediaController,
      getConnectionData: () => ({
        state: {},
        getMediaController: () => {}
      }),
      getInstanceId: () => instanceId,
      getAWSAccountId: () => AWSAccountId,
      getAgentData: () => ({ configuration: { permissions: ["outboundCall", "voiceId"] }})
    });

    sandbox.stub(connect.core, "getUpstream").returns({
      sendUpstream: sandbox.stub(),
    });
  });

  after(() => {
    initMediaController.resetHistory();
    connect.core.getAgentDataProvider.resetBehavior();
    sandbox.restore();
  });

  describe('getDomainId', () => {
    beforeEach(() => {
      connect.core.voiceIdDomainId = '';
    });

    it('should get resolved immediately when connect.core.voiceIdDomainId already has a value', async () => {
      const cachedDomainId = 'xxx';
      connect.core.voiceIdDomainId = cachedDomainId;
      const voiceId = new connect.VoiceId();
      const domainId = await voiceId.getDomainId();
      assert.equal(domainId, cachedDomainId);
    });

    it('should get resolved with a domainId', async () => {
      const fetchedDomainId = 'xxx';
      const response = {
        "IntegrationAssociationSummaryList": [
          {
            "InstanceId": "66c87b19-f867-45bc-923f-da04abf2a8f0",
            "IntegrationArn": "arn:aws:voiceid:us-west-2:524095038153:domain/" + fetchedDomainId,
            "IntegrationAssociationArn": "arn:aws:connect:us-west-2:524095038153:instance/66c87b19-f867-45bc-923f-da04abf2a8f0/integration-association/06d3fc20-23ec-4e70-b55c-0c3e6bf2b8c3",
            "IntegrationAssociationId": "06d3fc20-23ec-4e70-b55c-0c3e6bf2b8c3",
            "IntegrationType": "VOICE_ID"
          }
        ]
      };
      connect.core.getClient = sinon.stub().returns({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      });
      const voiceId = new connect.VoiceId();
      const domainId = await voiceId.getDomainId();
      assert.equal(domainId, fetchedDomainId);
    });
  });

  it('should get rejected if no domain is associated', async () => {
    const response = {
      "IntegrationAssociationSummaryList": [
      ]
    };
    connect.core.getClient = sinon.stub().returns({
      call: (endpoint, params, callbacks) => {
        callbacks.success(response);
      }
    });
    const voiceId = new connect.VoiceId();
    let error = {};
    try {
      const domainId = await voiceId.getDomainId();
    } catch(err) {
      error = err;
    }
    assert.equal(error.type, connect.VoiceIdErrorTypes.NO_DOMAIN_ID_FOUND);
  });

  it('should get rejected if the response is invalid', async () => {
    const fetchedDomainId = 'xxx';
    const response = {};
    connect.core.getClient = sinon.stub().returns({
      call: (endpoint, params, callbacks) => {
        callbacks.success(response);
      }
    });
    const voiceId = new connect.VoiceId();
    let error = {};
    try {
      const domainId = await voiceId.getDomainId();
    } catch(err) {
      error = err;
    }
    assert.equal(error.type, connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
  });

  it('should get rejected if backend call fails', async () => {
    connect.core.getClient = sinon.stub().returns({
      call: (endpoint, params, callbacks) => {
        callbacks.failure({});
      }
    });
    const voiceId = new connect.VoiceId();
    let error = {};
    try {
      const domainId = await voiceId.getDomainId();
    } catch(err) {
      error = err;
    }
    assert.equal(error.type, connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
  });
});