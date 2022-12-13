require("../unit/test-setup.js");

describe('VoiceId', () => {
  const sandbox = sinon.createSandbox();

  const connectionId = "connectionId";
  const contactId = "contactId";
  const instanceId = "instanceId";
  const AWSAccountId = "AWSAccountId";
  const initMediaController = sinon.spy();
  const speakerId = "speakerId";
  const domainId = "domainId";

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
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId();
      const domainId = await voiceId.getDomainId();
      assert.equal(domainId, fetchedDomainId);
      connect.core.getClient.restore();
    });

    it('should get rejected if no domain is associated', async () => {
      const response = {
        "IntegrationAssociationSummaryList": [
        ]
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        const domainId = await voiceId.getDomainId();
      } catch(err) {
        error = err;
      }
      assert.equal(error.type, connect.VoiceIdErrorTypes.NO_DOMAIN_ID_FOUND);
      connect.core.getClient.restore();
    });
  
    it('should get rejected if the response is invalid', async () => {
      const fetchedDomainId = 'xxx';
      const response = {};
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        const domainId = await voiceId.getDomainId();
      } catch(err) {
        error = err;
      }
      assert.equal(error.type, connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
      connect.core.getClient.restore();
    });
  
    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        const domainId = await voiceId.getDomainId();
      } catch(err) {
        error = err;
      }
      assert.equal(error.type, connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('getSpeakerId', () => {
    it('should get resolved with a speaker id', async () => {
      const customerId = "00000000-0000-0000-0000-000000000027";
      const response = {
        contactData: {
          customerId: customerId
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      const obj = await voiceId.getSpeakerId();
      expect(obj.speakerId).to.equal(customerId);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      connect.core.getClient.restore();
    });

    it('should get rejected when no speakerId found', async () => {
      const response = {
        contactData: {}
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      let obj, error;
      try {
        obj = await voiceId.getSpeakerId();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.NO_SPEAKER_ID_FOUND);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      const response = {
        contactData: {}
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      let obj, error;
      try {
        obj = await voiceId.getSpeakerId();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.GET_SPEAKER_ID_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('getSpeakerStatus', () => {
    it('should get resolved with a speaker status', async () => {
      const speakerStatus = connect.VoiceIdSpeakerStatus.ENROLLED;
      const response = {
        Speaker: {
          Status: speakerStatus
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.getSpeakerStatus();
      expect(obj.Speaker.Status).to.equal(speakerStatus);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.getSpeakerId);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should get resolved when the status is 400', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure(JSON.stringify({
            status: 400
          }));
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.getSpeakerStatus();
      expect(obj.type).to.equal(connect.VoiceIdErrorTypes.SPEAKER_ID_NOT_ENROLLED);
      connect.core.getClient.restore();
    });

    it('should get rejected when the status is other than 400', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure(JSON.stringify({
            status: 500
          }));
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.getSpeakerStatus();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.GET_SPEAKER_STATUS_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('optOutSpeakerInLcms', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      const obj = await voiceId._optOutSpeakerInLcms(speakerId);
      expect(obj).to.equal(response);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      let obj, error;
      try {
        obj = await voiceId._optOutSpeakerInLcms(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_IN_LCMS_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('optOutSpeaker', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId._optOutSpeakerInLcms = sinon.stub().callsFake(() => Promise.resolve());
      const obj = await voiceId.optOutSpeaker();
      expect(obj).to.equal(response);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.getSpeakerId);
      sinon.assert.calledOnce(voiceId.getDomainId);
      sinon.assert.calledOnce(voiceId._optOutSpeakerInLcms);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId._optOutSpeakerInLcms = sinon.stub().callsFake(() => Promise.resolve());
      let obj, error;
      try {
        obj = await voiceId.optOutSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('deleteSpeaker', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.deleteSpeaker();
      expect(obj).to.equal(response);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.getSpeakerId);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.deleteSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.DELETE_SPEAKER_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('startSession', () => {
    it('should get resolved with sessionId', async () => {
      const sessionId = 'sessionId';
      const response = { sessionId };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.startSession();
      expect(obj.sessionId).to.equal(sessionId);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should get rejected when the response is missing the sessionId', async () => {
      const response = {};
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.startSession();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.START_SESSION_FAILED);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.startSession();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.START_SESSION_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('evaluateSpeaker', () => {
    let clock;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });

    it('should get resolved when both auth and fraudDetection have results', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should call startSession first if true is passed in', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ENDED,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      voiceId.evaluateSpeaker(true).then((data) => { obj = data }).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.EVALUATE_SESSION_DELAY);
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      expect(error).to.be.a('undefined');
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.calledOnce(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should call Hudsons evaluateSession api again when streaming status is PENDING_CONFIGURATION', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.PENDING_CONFIGURATION,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      const fakeCallFn = sinon.stub().callsFake((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
      expect(error).to.be.a('undefined');
      sinon.assert.calledTwice(fakeCallFn);
      connect.core.getClient.restore();
    });

    it('should populate the auth result decision with Not_Enabled when the auth result is null', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": null,
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.NOT_ENABLED);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should populate the fraud result decision with Not_Enabled when the fraud result is null', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": null
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.NOT_ENABLED);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    // TODO: fix this case. https://issues.amazon.com/issues/LILAX-3451
    it.skip('should populate the auth result decision with Inconclusive when the streaming status is Ended and auth result decision is Not_Enough_Speech', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ENDED,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.NOT_ENOUGH_SPEECH
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.INCONCLUSIVE);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.NOT_ENABLED);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    // TODO: fix this case. https://issues.amazon.com/issues/LILAX-3451
    it.skip('should populate the fraud result decision with Inconclusive when the streaming status is Ended and fraud result decision is Not_Enough_Speech', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ENDED,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.NOT_ENOUGH_SPEECH
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should populate both result decisions with Inconclusive when the streaming status is Ended and both auth and fraud result decisions are Not_Enough_Speech', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ENDED,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.NOT_ENOUGH_SPEECH
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.NOT_ENOUGH_SPEECH
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).to.equal(connect.ContactFlowAuthenticationDecision.INCONCLUSIVE);
      expect(obj.FraudDetectionResult.Decision).to.equal(connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.notCalled(voiceId.startSession);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should call Hudsons evaluateSession api again when either of auth result or fraud detection result is NOT_ENOUGH_SPEECH and streaming status is ONGOING', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.NOT_ENOUGH_SPEECH
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.NOT_ENOUGH_SPEECH
        }
      };
      const fakeCallFn = sinon.stub().callsFake((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
      expect(error).to.be.a('undefined');
      sinon.assert.calledTwice(fakeCallFn);
      connect.core.getClient.restore();
    });

    it('should return timeout error after 120 seconds', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.NOT_ENOUGH_SPEECH
        },
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.NOT_ENOUGH_SPEECH
        }
      };
      const fakeCallFn = sinon.stub().callsFake((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL * connect.VoiceIdConstants.EVALUATION_MAX_POLL_TIMES);
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_TIMEOUT);
      expect(fakeCallFn.callCount).to.equal(connect.VoiceIdConstants.EVALUATION_MAX_POLL_TIMES);
      connect.core.getClient.restore();
    });

    it('should return session_not_exists error when status code is 400', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure(JSON.stringify({
            status: 400
          }));
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.evaluateSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.SESSION_NOT_EXISTS);
      connect.core.getClient.restore();
    });

    it('should return a general error when status code is other than 400', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure(JSON.stringify({
            status: 500
          }));
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.evaluateSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('describeSession', () => {
    it('should get resolved with session data', async () => {
      const streamingStatus = connect.VoiceIdStreamingStatus.ENDED;
      const response = {
        Session: {
          "StreamingStatus": streamingStatus
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      const obj = await voiceId.describeSession();
      expect(obj.Session.StreamingStatus).to.equal(streamingStatus);
      sinon.assert.calledOnce(voiceId.getDomainId);
      connect.core.getClient.restore();
    });

    it('should get rejected when backend api call failed', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.describeSession();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.DESCRIBE_SESSION_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('checkEnrollmentStatus', () => {
    let clock;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });
    it('should get resolved with data when the enrollment status is COMPLETED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.COMPLETED;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          }
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));
      const obj = await voiceId.checkEnrollmentStatus();
      expect(obj.Session.EnrollmentRequestDetails.Status).to.equal(enrollmentStatus);
      sinon.assert.calledOnce(voiceId.describeSession);
    });

    it('should call describeSession again after 5 seconds when the enrollment status is IN_PROGRESS', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.IN_PROGRESS;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          }
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));
      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
      expect(error).to.be.a('undefined');
      sinon.assert.calledTwice(voiceId.describeSession);
    });

    it('should call describeSession again after 5 seconds when the enrollment status is NOT_ENOUGH_SPEECH and streaming status is ONGOING', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const streamingStatus = connect.VoiceIdStreamingStatus.ONGOING;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          },
          "StreamingStatus": streamingStatus
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));
      const obj = voiceId.checkEnrollmentStatus().then(() => {}).catch(() => {});
      await clock.tickAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
      sinon.assert.calledTwice(voiceId.describeSession);
    });

    it('should call describeSession again after calling startSession and wait for 8 seconds when the enrollment status is NOT_ENOUGH_SPEECH and streaming status is ENDED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const streamingStatus = connect.VoiceIdStreamingStatus.ENDED;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          },
          "StreamingStatus": streamingStatus
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));
      voiceId.startSession = sinon.stub().callsFake(() => Promise.resolve());
      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL + connect.VoiceIdConstants.START_SESSION_DELAY);
      expect(error).to.be.a('undefined');
      sinon.assert.calledTwice(voiceId.describeSession);
      sinon.assert.calledOnce(voiceId.startSession);
    });

    it('should return a general error when unknown enrollment status is received', async () => {
      const enrollmentStatus = 'unknown';
      const streamingStatus = connect.VoiceIdStreamingStatus.ONGOING;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          },
          "StreamingStatus": streamingStatus
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));

      let obj, error;
      try {
        obj = await voiceId.checkEnrollmentStatus();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_FAILED);
      sinon.assert.calledOnce(voiceId.describeSession);
    });

    it('should timeout when enrollment doesnt complete in 10 mins', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const streamingStatus = connect.VoiceIdStreamingStatus.ONGOING;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          },
          "StreamingStatus": streamingStatus
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));

      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err });
      await clock.tickAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL * connect.VoiceIdConstants.ENROLLMENT_MAX_POLL_TIMES);
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_TIMEOUT);
      expect(voiceId.describeSession.callCount).to.equal(connect.VoiceIdConstants.ENROLLMENT_MAX_POLL_TIMES - 1);
    });

    it('should invoke a callback when sufficient audio has been collected', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.IN_PROGRESS;
      const streamingStatus = connect.VoiceIdStreamingStatus.ONGOING;
      const response = {
        Session: {
          "EnrollmentRequestDetails": {
            Status: enrollmentStatus
          },
          "StreamingStatus": streamingStatus
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.describeSession = sinon.stub().callsFake(() => Promise.resolve(response));

      const callback = sinon.stub();
      let error;
      voiceId.checkEnrollmentStatus(callback).then(() => {}).catch((err) => { error = err });
      await clock.nextAsync();

      expect(error).to.be.a('undefined');
      sinon.assert.calledOnce(callback);

      await clock.nextAsync();
      sinon.assert.calledOnce(callback);
    });
  });

  describe('enrollSpeaker', () => {
    it('should call deleteSpeaker when speakerStatus is OPTED_OUT', async () => {
      const speakerStatus = {
        Speaker: {
          Status: connect.VoiceIdSpeakerStatus.OPTED_OUT
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getSpeakerStatus = sinon.stub().callsFake(() => Promise.resolve(speakerStatus));
      voiceId.deleteSpeaker = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.enrollSpeakerHelper = sinon.stub().callsFake((resolve, reject) => resolve());

      const obj = await voiceId.enrollSpeaker();
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.calledOnce(voiceId.getSpeakerStatus);
      sinon.assert.calledOnce(voiceId.deleteSpeaker);
      sinon.assert.calledOnce(voiceId.enrollSpeakerHelper);
    });

    it('should not call deleteSpeaker when speakerStatus is not OPTED_OUT', async () => {
      const speakerStatus = {
        Speaker: {
          Status: connect.VoiceIdSpeakerStatus.ENROLLED
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.syncSpeakerId = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.getSpeakerStatus = sinon.stub().callsFake(() => Promise.resolve(speakerStatus));
      voiceId.deleteSpeaker = sinon.stub().callsFake(() => Promise.resolve());
      voiceId.enrollSpeakerHelper = sinon.stub().callsFake((resolve, reject) => resolve());

      const obj = await voiceId.enrollSpeaker();
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.syncSpeakerId);
      sinon.assert.calledOnce(voiceId.getSpeakerStatus);
      sinon.assert.notCalled(voiceId.deleteSpeaker);
      sinon.assert.calledOnce(voiceId.enrollSpeakerHelper);
    });
  });

  describe('enrollSpeakerHelper', () => {
    let clock;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });
    it('should call resolve when enrollment status is COMPLETED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.COMPLETED;
      const response = {
        Status: enrollmentStatus
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = sinon.stub().callsFake(() => Promise.resolve({}));
      const fakeResolve = sinon.stub();
      const fakeReject = sinon.stub();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await clock.nextAsync();
      sinon.assert.calledOnce(fakeResolve);
      sinon.assert.notCalled(fakeReject);
      sinon.assert.calledOnce(voiceId.getDomainId);
      sinon.assert.notCalled(voiceId.checkEnrollmentStatus);
      connect.core.getClient.restore();
    });

    it('should call checkEnrollmentStatus when enrollment status is not COMPLETED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const response = {
        Status: enrollmentStatus
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = sinon.stub().callsFake(() => Promise.resolve({}));
      const fakeResolve = sinon.stub();
      const fakeReject = sinon.stub();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await clock.nextAsync();
      sinon.assert.calledOnce(fakeResolve);
      sinon.assert.notCalled(fakeReject);
      sinon.assert.calledOnce(voiceId.getDomainId);
      sinon.assert.calledOnce(voiceId.checkEnrollmentStatus);
      connect.core.getClient.restore();
    });

    it('should call reject when ENROLL_SPEAKER_IN_VOICEID api fails', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const response = {
        Status: enrollmentStatus
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = sinon.stub().callsFake(() => Promise.resolve({}));
      const fakeResolve = sinon.stub();
      const fakeReject = sinon.stub();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await clock.nextAsync();
      sinon.assert.notCalled(fakeResolve);
      sinon.assert.calledOnce(fakeReject);
      sinon.assert.calledOnce(voiceId.getDomainId);
      sinon.assert.notCalled(voiceId.checkEnrollmentStatus);
      connect.core.getClient.restore();
    });
  });

  describe('updateSpeakerIdInLcms', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      const obj = await voiceId._updateSpeakerIdInLcms(speakerId);
      expect(obj).to.equal(response);
      connect.core.getClient.restore();
    });

    it('should get rejected if backend call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure({});
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      let obj, error;
      try {
        obj = await voiceId._updateSpeakerIdInLcms(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('updateSpeakerIdInVoiceId', () => {
    it('should get resolved with data', async () => {
      const response = {
        Session: {
          GeneratedSpeakerId: 'dummy-generated-speaker-id'
        }
      };
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId._updateSpeakerIdInLcms = sinon.stub().callsFake(() => Promise.resolve());
      const obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      expect(obj).to.equal(response);
      sinon.assert.calledOnce(voiceId.checkConferenceCall);
      sinon.assert.calledOnce(voiceId.getDomainId);
      sinon.assert.calledWith(voiceId._updateSpeakerIdInLcms, speakerId, 'dummy-generated-speaker-id');
      connect.core.getClient.restore();
    });

    it('should get rejected without calling backend when no speakerId is passed in', async () => {
      const response = {
        data: 'fakeData'
      };
      const fakeCallFn = sinon.stub().callsFake((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId();
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      sinon.assert.notCalled(fakeCallFn);
      connect.core.getClient.restore();
    });

    it('should get rejected when backend api call fails', async () => {
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.failure(JSON.stringify({
            status: 500
          }));
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_FAILED);
      connect.core.getClient.restore();
    });

    it('should get rejected when _updateSpeakerIdInLcms api call fails', async () => {
      const response = 'fakeData';
      sinon.stub(connect.core, 'getClient').callsFake(() => ({
        call: (endpoint, params, callbacks) => {
          callbacks.success(response);
        }
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = sinon.stub();
      voiceId.getDomainId = sinon.stub().callsFake(() => Promise.resolve(domainId));
      voiceId._updateSpeakerIdInLcms = sinon.stub().callsFake(() => Promise.reject({ type: connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED }));

      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).to.be.a('undefined');
      expect(error.type).to.equal(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED);
      connect.core.getClient.restore();
    });
  });

  describe('syncSpeakerId', () => {
    it('should call getSpeakerId then updateSpeakerIdInVoiceId in a row', async () => {
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getSpeakerId = sinon.stub().callsFake(() => Promise.resolve({ speakerId }));
      voiceId.updateSpeakerIdInVoiceId = sinon.stub().callsFake(() => Promise.resolve());
      const obj = await voiceId.syncSpeakerId();
      sinon.assert.calledOnce(voiceId.getSpeakerId);
      sinon.assert.calledOnce(voiceId.updateSpeakerIdInVoiceId);
    });
  });
});