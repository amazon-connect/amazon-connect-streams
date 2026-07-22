describe('VoiceId', () => {
  const contactId = "contactId";
  const instanceId = "instanceId";
  const AWSAccountId = "AWSAccountId";
  const speakerId = "speakerId";
  const domainId = "domainId";

  let initMediaController;

  beforeEach(() => {
    initMediaController = jest.fn();
    connect.core.getAgentDataProvider = jest.fn().mockReturnValue({
      getContactData: () => ({ connections: [{ state: { type: "connected" } }] }),
      _initMediaController: initMediaController,
      getConnectionData: () => ({
        state: {},
        getMediaController: () => {}
      }),
      getInstanceId: () => instanceId,
      getAWSAccountId: () => AWSAccountId,
      getAgentData: () => ({ configuration: { permissions: ["outboundCall", "voiceId"] } })
    });

    jest.spyOn(connect.core, "getUpstream").mockReturnValue({
      sendUpstream: jest.fn(),
    });
    connect.agent.initialized = true;
  });

  afterEach(() => {
    connect.agent.initialized = false;
  });

  function stubClientSuccess(response) {
    jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
      call: (endpoint, params, callbacks) => { callbacks.success(response); }
    }));
  }

  function stubClientFailure(error = {}) {
    jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
      call: (endpoint, params, callbacks) => { callbacks.failure(error); }
    }));
  }

  describe('getDomainId', () => {
    beforeEach(() => {
      connect.core.voiceIdDomainId = '';
    });

    it('should get resolved immediately when connect.core.voiceIdDomainId already has a value', async () => {
      const cachedDomainId = 'xxx';
      connect.core.voiceIdDomainId = cachedDomainId;
      const voiceId = new connect.VoiceId();
      const result = await voiceId.getDomainId();
      expect(result).toBe(cachedDomainId);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId();
      const result = await voiceId.getDomainId();
      expect(result).toBe(fetchedDomainId);
    });

    it('should get rejected when the agent lacks the Voice ID permission', async () => {
      connect.core.getAgentDataProvider().getAgentData = () => ({
        configuration: { permissions: ["outboundCall"] }
      });
      const getClient = jest.spyOn(connect.core, 'getClient');
      const voiceId = new connect.VoiceId();
      let error;
      try {
        await voiceId.getDomainId();
      } catch (err) {
        error = err;
      }
      expect(error.message).toBe("Agent doesn't have the permission for Voice ID");
      expect(getClient).not.toHaveBeenCalled();
    });

    it('should get rejected if no domain is associated', async () => {
      const response = {
        "IntegrationAssociationSummaryList": []
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        await voiceId.getDomainId();
      } catch (err) {
        error = err;
      }
      expect(error.type).toBe(connect.VoiceIdErrorTypes.NO_DOMAIN_ID_FOUND);
    });

    it('should get rejected if the response is invalid', async () => {
      const response = {};
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        await voiceId.getDomainId();
      } catch (err) {
        error = err;
      }
      expect(error.type).toBe(connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId();
      let error = {};
      try {
        await voiceId.getDomainId();
      } catch (err) {
        error = err;
      }
      expect(error.type).toBe(connect.VoiceIdErrorTypes.GET_DOMAIN_ID_FAILED);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const obj = await voiceId.getSpeakerId();
      expect(obj.speakerId).toBe(customerId);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
    });

    it('should get rejected when no speakerId found', async () => {
      const response = {
        contactData: {}
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      let obj, error;
      try {
        obj = await voiceId.getSpeakerId();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.NO_SPEAKER_ID_FOUND);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      let obj, error;
      try {
        obj = await voiceId.getSpeakerId();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.GET_SPEAKER_ID_FAILED);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.getSpeakerStatus();
      expect(obj.Speaker.Status).toBe(speakerStatus);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.getSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
    });

    it('should get resolved when the status is 400', async () => {
      stubClientFailure(JSON.stringify({ status: 400 }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.getSpeakerStatus();
      expect(obj.type).toBe(connect.VoiceIdErrorTypes.SPEAKER_ID_NOT_ENROLLED);
    });

    it('should get rejected when the status is other than 400', async () => {
      stubClientFailure(JSON.stringify({ status: 500 }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.getSpeakerStatus();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.GET_SPEAKER_STATUS_FAILED);
    });
  });

  describe('optOutSpeakerInLcms', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      const obj = await voiceId._optOutSpeakerInLcms(speakerId);
      expect(obj).toBe(response);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      let obj, error;
      try {
        obj = await voiceId._optOutSpeakerInLcms(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_IN_LCMS_FAILED);
    });
  });

  describe('optOutSpeaker', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId._optOutSpeakerInLcms = jest.fn(() => Promise.resolve());
      const obj = await voiceId.optOutSpeaker();
      expect(obj).toBe(response);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.getSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
      expect(voiceId._optOutSpeakerInLcms).toHaveBeenCalledTimes(1);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId._optOutSpeakerInLcms = jest.fn(() => Promise.resolve());
      let obj, error;
      try {
        obj = await voiceId.optOutSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.OPT_OUT_SPEAKER_FAILED);
    });
  });

  describe('deleteSpeaker', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.deleteSpeaker();
      expect(obj).toBe(response);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.getSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.deleteSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.DELETE_SPEAKER_FAILED);
    });
  });

  describe('startSession', () => {
    it('should get resolved with sessionId', async () => {
      const sessionId = 'sessionId';
      const response = { sessionId };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.startSession();
      expect(obj.sessionId).toBe(sessionId);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
    });

    it('should get rejected when the response is missing the sessionId', async () => {
      const response = {};
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.startSession();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.START_SESSION_FAILED);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.startSession();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.START_SESSION_FAILED);
    });
  });

  describe('evaluateSpeaker', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      voiceId.evaluateSpeaker(true).then((data) => { obj = data; }).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.EVALUATE_SESSION_DELAY);
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      expect(error).toBeUndefined();
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      const fakeCallFn = jest.fn((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
      expect(error).toBeUndefined();
      expect(fakeCallFn).toHaveBeenCalledTimes(2);
    });

    it('should populate the auth result decision with Not_Enabled when the auth result is null', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": null,
        "FraudDetectionResult": {
          "Decision": connect.VoiceIdFraudDetectionDecision.LOW_RISK
        }
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.NOT_ENABLED);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.LOW_RISK);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
    });

    it('should populate the fraud result decision with Not_Enabled when the fraud result is null', async () => {
      const response = {
        "StreamingStatus": connect.VoiceIdStreamingStatus.ONGOING,
        "AuthenticationResult": {
          "Decision": connect.VoiceIdAuthenticationDecision.ACCEPT
        },
        "FraudDetectionResult": null
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.NOT_ENABLED);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.INCONCLUSIVE);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.NOT_ENABLED);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.AUTHENTICATED);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.evaluateSpeaker();
      expect(obj.AuthenticationResult.Decision).toBe(connect.ContactFlowAuthenticationDecision.INCONCLUSIVE);
      expect(obj.FraudDetectionResult.Decision).toBe(connect.ContactFlowFraudDetectionDecision.INCONCLUSIVE);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.startSession).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
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
      const fakeCallFn = jest.fn((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL);
      expect(error).toBeUndefined();
      expect(fakeCallFn).toHaveBeenCalledTimes(2);
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
      const fakeCallFn = jest.fn((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let error;
      voiceId.evaluateSpeaker().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.EVALUATION_POLLING_INTERVAL * connect.VoiceIdConstants.EVALUATION_MAX_POLL_TIMES);
      expect(error.type).toBe(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_TIMEOUT);
      expect(fakeCallFn.mock.calls.length).toBe(connect.VoiceIdConstants.EVALUATION_MAX_POLL_TIMES);
    });

    it('should return session_not_exists error when status code is 400', async () => {
      stubClientFailure(JSON.stringify({ status: 400 }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.evaluateSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.SESSION_NOT_EXISTS);
    });

    it('should return a general error when status code is other than 400', async () => {
      stubClientFailure(JSON.stringify({ status: 500 }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.evaluateSpeaker();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.EVALUATE_SPEAKER_FAILED);
    });

    function evaluateWith(authDecision, fraudDecision) {
      const response = {
        StreamingStatus: connect.VoiceIdStreamingStatus.ONGOING,
        AuthenticationResult: { Decision: authDecision },
        FraudDetectionResult: { Decision: fraudDecision },
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.startSession = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      return voiceId.evaluateSpeaker();
    }

    it.each([
      [connect.VoiceIdAuthenticationDecision.REJECT, connect.ContactFlowAuthenticationDecision.NOT_AUTHENTICATED],
      [connect.VoiceIdAuthenticationDecision.SPEAKER_OPTED_OUT, connect.ContactFlowAuthenticationDecision.OPTED_OUT],
      [connect.VoiceIdAuthenticationDecision.SPEAKER_NOT_ENROLLED, connect.ContactFlowAuthenticationDecision.NOT_ENROLLED],
      [connect.VoiceIdAuthenticationDecision.SPEAKER_EXPIRED, connect.ContactFlowAuthenticationDecision.ERROR],
    ])('maps authentication decision %s to %s', async (authDecision, expected) => {
      const obj = await evaluateWith(authDecision, connect.VoiceIdFraudDetectionDecision.LOW_RISK);
      expect(obj.AuthenticationResult.Decision).toBe(expected);
    });

    it.each([
      [connect.VoiceIdFraudDetectionDecision.HIGH_RISK, connect.ContactFlowFraudDetectionDecision.HIGH_RISK],
      [connect.VoiceIdFraudDetectionDecision.LOW_RISK, connect.ContactFlowFraudDetectionDecision.LOW_RISK],
    ])('maps fraud detection decision %s to %s', async (fraudDecision, expected) => {
      const obj = await evaluateWith(connect.VoiceIdAuthenticationDecision.ACCEPT, fraudDecision);
      expect(obj.FraudDetectionResult.Decision).toBe(expected);
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
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      const obj = await voiceId.describeSession();
      expect(obj.Session.StreamingStatus).toBe(streamingStatus);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
    });

    it('should get rejected when backend api call failed', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));

      let obj, error;
      try {
        obj = await voiceId.describeSession();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.DESCRIBE_SESSION_FAILED);
    });
  });

  describe('checkEnrollmentStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));
      const obj = await voiceId.checkEnrollmentStatus();
      expect(obj.Session.EnrollmentRequestDetails.Status).toBe(enrollmentStatus);
      expect(voiceId.describeSession).toHaveBeenCalledTimes(1);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));
      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
      expect(error).toBeUndefined();
      expect(voiceId.describeSession).toHaveBeenCalledTimes(2);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));
      voiceId.checkEnrollmentStatus().then(() => {}).catch(() => {});
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL);
      expect(voiceId.describeSession).toHaveBeenCalledTimes(2);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));
      voiceId.startSession = jest.fn(() => Promise.resolve());
      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL + connect.VoiceIdConstants.START_SESSION_DELAY);
      expect(error).toBeUndefined();
      expect(voiceId.describeSession).toHaveBeenCalledTimes(2);
      expect(voiceId.startSession).toHaveBeenCalledTimes(1);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));

      let obj, error;
      try {
        obj = await voiceId.checkEnrollmentStatus();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_FAILED);
      expect(voiceId.describeSession).toHaveBeenCalledTimes(1);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));

      let error;
      voiceId.checkEnrollmentStatus().then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersByTimeAsync(connect.VoiceIdConstants.ENROLLMENT_POLLING_INTERVAL * connect.VoiceIdConstants.ENROLLMENT_MAX_POLL_TIMES);
      expect(error.type).toBe(connect.VoiceIdErrorTypes.ENROLL_SPEAKER_TIMEOUT);
      expect(voiceId.describeSession.mock.calls.length).toBe(connect.VoiceIdConstants.ENROLLMENT_MAX_POLL_TIMES - 1);
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
      voiceId.describeSession = jest.fn(() => Promise.resolve(response));

      const callback = jest.fn();
      let error;
      voiceId.checkEnrollmentStatus(callback).then(() => {}).catch((err) => { error = err; });
      await jest.advanceTimersToNextTimerAsync();

      expect(error).toBeUndefined();
      expect(callback).toHaveBeenCalledTimes(1);

      await jest.advanceTimersToNextTimerAsync();
      expect(callback).toHaveBeenCalledTimes(1);
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
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.getSpeakerStatus = jest.fn(() => Promise.resolve(speakerStatus));
      voiceId.deleteSpeaker = jest.fn(() => Promise.resolve());
      voiceId.enrollSpeakerHelper = jest.fn((resolve, reject) => resolve());

      await voiceId.enrollSpeaker();
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.getSpeakerStatus).toHaveBeenCalledTimes(1);
      expect(voiceId.deleteSpeaker).toHaveBeenCalledTimes(1);
      expect(voiceId.enrollSpeakerHelper).toHaveBeenCalledTimes(1);
    });

    it('should not call deleteSpeaker when speakerStatus is not OPTED_OUT', async () => {
      const speakerStatus = {
        Speaker: {
          Status: connect.VoiceIdSpeakerStatus.ENROLLED
        }
      };
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.getSpeakerStatus = jest.fn(() => Promise.resolve(speakerStatus));
      voiceId.deleteSpeaker = jest.fn(() => Promise.resolve());
      voiceId.enrollSpeakerHelper = jest.fn((resolve, reject) => resolve());

      await voiceId.enrollSpeaker();
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.syncSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.getSpeakerStatus).toHaveBeenCalledTimes(1);
      expect(voiceId.deleteSpeaker).not.toHaveBeenCalled();
      expect(voiceId.enrollSpeakerHelper).toHaveBeenCalledTimes(1);
    });
  });

  describe('enrollSpeakerHelper', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call resolve when enrollment status is COMPLETED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.COMPLETED;
      const response = {
        Status: enrollmentStatus
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = jest.fn(() => Promise.resolve({}));
      const fakeResolve = jest.fn();
      const fakeReject = jest.fn();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await jest.advanceTimersToNextTimerAsync();
      expect(fakeResolve).toHaveBeenCalledTimes(1);
      expect(fakeReject).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
      expect(voiceId.checkEnrollmentStatus).not.toHaveBeenCalled();
    });

    it('should call checkEnrollmentStatus when enrollment status is not COMPLETED', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const response = {
        Status: enrollmentStatus
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = jest.fn(() => Promise.resolve({}));
      const fakeResolve = jest.fn();
      const fakeReject = jest.fn();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await jest.advanceTimersToNextTimerAsync();
      expect(fakeResolve).toHaveBeenCalledTimes(1);
      expect(fakeReject).not.toHaveBeenCalled();
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
      expect(voiceId.checkEnrollmentStatus).toHaveBeenCalledTimes(1);
    });

    it('should call reject when ENROLL_SPEAKER_IN_VOICEID api fails', async () => {
      const enrollmentStatus = connect.VoiceIdEnrollmentRequestStatus.NOT_ENOUGH_SPEECH;
      const response = {
        Status: enrollmentStatus
      };
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId.checkEnrollmentStatus = jest.fn(() => Promise.resolve({}));
      const fakeResolve = jest.fn();
      const fakeReject = jest.fn();
      voiceId.enrollSpeakerHelper(fakeResolve, fakeReject);
      await jest.advanceTimersToNextTimerAsync();
      expect(fakeResolve).not.toHaveBeenCalled();
      expect(fakeReject).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
      expect(voiceId.checkEnrollmentStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateSpeakerIdInLcms', () => {
    it('should get resolved with data', async () => {
      const response = 'fakeData';
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      const obj = await voiceId._updateSpeakerIdInLcms(speakerId);
      expect(obj).toBe(response);
    });

    it('should get rejected if backend call fails', async () => {
      stubClientFailure({});
      const voiceId = new connect.VoiceId(contactId);
      let obj, error;
      try {
        obj = await voiceId._updateSpeakerIdInLcms(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED);
    });
  });

  describe('updateSpeakerIdInVoiceId', () => {
    it('should get resolved with data', async () => {
      const response = {
        Session: {
          GeneratedSpeakerId: 'dummy-generated-speaker-id'
        }
      };
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId._updateSpeakerIdInLcms = jest.fn(() => Promise.resolve());
      const obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      expect(obj).toBe(response);
      expect(voiceId.checkConferenceCall).toHaveBeenCalledTimes(1);
      expect(voiceId.getDomainId).toHaveBeenCalledTimes(1);
      expect(voiceId._updateSpeakerIdInLcms).toHaveBeenCalledWith(speakerId, 'dummy-generated-speaker-id');
    });

    it('should get rejected without calling backend when no speakerId is passed in', async () => {
      const response = {
        data: 'fakeData'
      };
      const fakeCallFn = jest.fn((endpoint, params, callbacks) => {
        callbacks.success(response);
      });
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({
        call: fakeCallFn
      }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId();
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(fakeCallFn).not.toHaveBeenCalled();
    });

    it('should get rejected when backend api call fails', async () => {
      stubClientFailure(JSON.stringify({ status: 500 }));
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_FAILED);
    });

    it('should get rejected when _updateSpeakerIdInLcms api call fails', async () => {
      const response = 'fakeData';
      stubClientSuccess(response);
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      voiceId._updateSpeakerIdInLcms = jest.fn(() => Promise.reject({ type: connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED }));

      let obj, error;
      try {
        obj = await voiceId.updateSpeakerIdInVoiceId(speakerId);
      } catch (e) {
        error = e;
      }
      expect(obj).toBeUndefined();
      expect(error.type).toBe(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_IN_LCMS_FAILED);
    });
  });

  describe('syncSpeakerId', () => {
    it('should call getSpeakerId then updateSpeakerIdInVoiceId in a row', async () => {
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      voiceId.updateSpeakerIdInVoiceId = jest.fn(() => Promise.resolve());
      await voiceId.syncSpeakerId();
      expect(voiceId.getSpeakerId).toHaveBeenCalledTimes(1);
      expect(voiceId.updateSpeakerIdInVoiceId).toHaveBeenCalledTimes(1);
    });
  });

  // Every VoiceId method that chains getDomainId()/getSpeakerId()/syncSpeakerId() must reject
  // with the propagated error and NOT call the backend when an upstream dependency fails.
  describe('error propagation', () => {
    const domainErr = () => connect.VoiceIdError(connect.VoiceIdErrorTypes.NO_DOMAIN_ID_FOUND, 'no domain');
    const speakerErr = () => connect.VoiceIdError(connect.VoiceIdErrorTypes.NO_SPEAKER_ID_FOUND, 'no speaker');

    function clientSpy() {
      const call = jest.fn();
      jest.spyOn(connect.core, 'getClient').mockImplementation(() => ({ call }));
      return call;
    }

    it('getSpeakerStatus rejects and makes no API call when getSpeakerId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = speakerErr();
      voiceId.getSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      await expect(voiceId.getSpeakerStatus()).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('getSpeakerStatus rejects when getDomainId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      const err = domainErr();
      voiceId.getDomainId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.getSpeakerStatus()).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('_optOutSpeakerInLcms rejects with a ValueError when speakerId is missing', async () => {
      clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      await expect(voiceId._optOutSpeakerInLcms(null)).rejects.toThrow('speakerId must be provided');
    });

    it('optOutSpeaker rejects and never calls the backend when getDomainId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      const err = domainErr();
      voiceId.getDomainId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.optOutSpeaker()).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('optOutSpeaker rejects when getSpeakerId rejects', async () => {
      clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = speakerErr();
      voiceId.getSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      await expect(voiceId.optOutSpeaker()).rejects.toBe(err);
    });

    it('deleteSpeaker rejects when getSpeakerId rejects', async () => {
      clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = speakerErr();
      voiceId.getSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      await expect(voiceId.deleteSpeaker()).rejects.toBe(err);
    });

    it('startSession rejects and never calls the backend when getDomainId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = domainErr();
      voiceId.getDomainId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.startSession()).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('describeSession rejects and never calls the backend when getDomainId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      const err = domainErr();
      voiceId.getDomainId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.describeSession()).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('updateSpeakerIdInVoiceId rejects and never calls the backend when getDomainId rejects', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = domainErr();
      voiceId.getDomainId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.updateSpeakerIdInVoiceId(speakerId)).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('_updateSpeakerIdInLcms rejects with a ValueError when speakerId is missing', async () => {
      clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      await expect(voiceId._updateSpeakerIdInLcms(null)).rejects.toThrow('speakerId must be provided');
    });

    it('syncSpeakerId rejects when getSpeakerId rejects', async () => {
      const voiceId = new connect.VoiceId(contactId);
      const err = speakerErr();
      voiceId.getSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.updateSpeakerIdInVoiceId = jest.fn(() => Promise.resolve());
      await expect(voiceId.syncSpeakerId()).rejects.toBe(err);
      expect(voiceId.updateSpeakerIdInVoiceId).not.toHaveBeenCalled();
    });

    it('syncSpeakerId rejects when updateSpeakerIdInVoiceId rejects', async () => {
      const voiceId = new connect.VoiceId(contactId);
      voiceId.getSpeakerId = jest.fn(() => Promise.resolve({ speakerId }));
      const err = connect.VoiceIdError(connect.VoiceIdErrorTypes.UPDATE_SPEAKER_ID_FAILED, 'update failed');
      voiceId.updateSpeakerIdInVoiceId = jest.fn(() => Promise.reject(err));
      await expect(voiceId.syncSpeakerId()).rejects.toBe(err);
    });

    it('enrollSpeaker rejects and never calls getSpeakerStatus when syncSpeakerId rejects', async () => {
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = speakerErr();
      voiceId.syncSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.getSpeakerStatus = jest.fn();
      await expect(voiceId.enrollSpeaker()).rejects.toBe(err);
      expect(voiceId.getSpeakerStatus).not.toHaveBeenCalled();
    });

    it('enrollSpeaker rejects and never calls enrollSpeakerHelper when deleteSpeaker fails for an OPTED_OUT speaker', async () => {
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.getSpeakerStatus = jest.fn(() => Promise.resolve({ Speaker: { Status: connect.VoiceIdSpeakerStatus.OPTED_OUT } }));
      const err = connect.VoiceIdError(connect.VoiceIdErrorTypes.DELETE_SPEAKER_FAILED, 'delete failed');
      voiceId.deleteSpeaker = jest.fn(() => Promise.reject(err));
      voiceId.enrollSpeakerHelper = jest.fn();
      await expect(voiceId.enrollSpeaker()).rejects.toBe(err);
      expect(voiceId.enrollSpeakerHelper).not.toHaveBeenCalled();
    });

    it('evaluateSpeaker(false) rejects and never evaluates when syncSpeakerId fails', async () => {
      const call = clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = speakerErr();
      voiceId.syncSpeakerId = jest.fn(() => Promise.reject(err));
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      await expect(voiceId.evaluateSpeaker(false)).rejects.toBe(err);
      expect(call).not.toHaveBeenCalled();
    });

    it('evaluateSpeaker(true) rejects and never syncs when startSession fails', async () => {
      clientSpy();
      const voiceId = new connect.VoiceId(contactId);
      voiceId.checkConferenceCall = jest.fn();
      const err = connect.VoiceIdError(connect.VoiceIdErrorTypes.START_SESSION_FAILED, 'start failed');
      voiceId.startSession = jest.fn(() => Promise.reject(err));
      voiceId.syncSpeakerId = jest.fn(() => Promise.resolve());
      voiceId.getDomainId = jest.fn(() => Promise.resolve(domainId));
      await expect(voiceId.evaluateSpeaker(true)).rejects.toBe(err);
      expect(voiceId.syncSpeakerId).not.toHaveBeenCalled();
    });
  });
});
