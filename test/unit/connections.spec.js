require("../unit/test-setup.js");

describe('Connections API', function () {
  const sandbox = sinon.createSandbox();

  describe('#Chat Connection API', function () {

    const connectionId = "connectionId";
    const contactId = "contactId";
    const initMediaController = sinon.spy();

    var chatMonitorInfo = {
      agent: {
        agentName: "Agent",
      },
      customer: {
        CustomerName: "CustomerName",
      },
      joinTime: 123
    };

    var chatMediaInfo = {
      customerName: "CustomerName",
      agentName: "testAgent2"
    };
    var getAgentDataProviderStub;

    before(function () {

      getAgentDataProviderStub = sandbox.stub(connect.core, 'getAgentDataProvider').returns({
        getContactData: () => ({
          segmentAttributes: {
            "connect:CustomerAuthentication": {
              "ValueMap": {
                "IdentityProvider": { "ValueString": "http://my-domain.auth0.com"}, // The identity provider that issued the authentication
                "ClientId": { "ValueString": "xxxxxxxxxxxxexample" }, // The user pool app client that authenticated your user.
                "Status": { "ValueString": "AUTHENTICATED" }, // Enum which represents whether the customer is authenticated or not
                "AssociatedCustomerId": { "ValueString": "3b3fe046ed68479f9d425b5f1a7acbfe"}, // Metadata for the profile associated with the contact
                "AuthenticationMethod": { "ValueString": "CONNECT" } // This should be reserved
              }
            }
          }
        }),
        _initMediaController: initMediaController,
        getConnectionData: () => {
          return {
            state: {},
            chatMediaInfo: chatMediaInfo,
            monitoringInfo: chatMonitorInfo,
            getMediaController: () => { }
          }
        },
        getAgentData: () => ({
          configuration: {
            name: 'mainAgent'
          }
        }),
      })
    });

    after(function () {
      initMediaController.resetHistory();
      sandbox.restore();
    });

    it('Should create new Chat connection Object given the chat Contact and Connection Id ', function () {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      assert.equal(chatConnection.connectionId, connectionId);
      assert.equal(chatConnection.contactId, contactId);
      assert.equal(chatConnection.getMediaType(), connect.MediaType.CHAT);
    });

    it('Should call InitMediaController method on new ChatConnection creation', function () {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      expect(initMediaController.calledOnce);
    });

    it('Should return valid chatMedia Info on getMediaInfo method ', function () {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      const mediaInfo = chatConnection.getMediaInfo();
      assert.equal(mediaInfo.originalInfo.customerName, chatMediaInfo.customerName);
    });

    it('Should return valid monitor Info on getMonitorInfo method ', function () {
      const chatConnection = new connect.ChatConnection(contactId, connectionId);
      const monitorInfo = chatConnection.getMonitorInfo();
      assert.deepEqual(monitorInfo, chatMonitorInfo);
    });

    describe('getAuthenticationDetails', () => {

      it('should return authentication details when presented in segmentAttributes', () => {
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).to.eql({
          "IdentityProvider": "http://my-domain.auth0.com",
          "ClientId": "xxxxxxxxxxxxexample",
          "Status": "AUTHENTICATED",
          "AssociatedCustomerId": "3b3fe046ed68479f9d425b5f1a7acbfe",
          "AuthenticationMethod": "CONNECT"
        });
        expect(chatConnection.isAuthenticated()).to.equal(true);
      });

      it('should return null when authentication details is not present in segmentAttributes', () => {
        getAgentDataProviderStub.returns({
          getContactData: () => { return {}; },
          getConnectionData: () => ({}),
        })
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).to.be.a("null");
        expect(chatConnection.isAuthenticated()).to.equal(false);
      });

      it('should be un-authenticated if partial data is present in segmentAttributes', () => {
        getAgentDataProviderStub.returns({
          getContactData: () => ({
            segmentAttributes: {
              "connect:CustomerAuthentication": {
                "ValueMap": {
                  "IdentityProvider": { "ValueString": "http://my-domain.auth0.com"}, // The identity provider that issued the authentication
                  "AssociatedCustomerId": { "ValueString": "3b3fe046ed68479f9d425b5f1a7acbfe"}, // Metadata for the profile associated with the contact
                  "AuthenticationMethod": { "ValueString": "CONNECT" } // This should be reserved
                }
              }
            }
          }),
          getConnectionData: () => ({}),
        })
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        const result = chatConnection.getAuthenticationDetails();
        expect(result).to.eql({
          "IdentityProvider": "http://my-domain.auth0.com",
          "AssociatedCustomerId": "3b3fe046ed68479f9d425b5f1a7acbfe",
          "AuthenticationMethod": "CONNECT"
        });
        expect(chatConnection.isAuthenticated()).to.equal(false);
      });

      it('throw error if connection type is not Customer connection', () => {
        getAgentDataProviderStub.returns({
          getContactData: () => ({}),
          getConnectionData: () => ({}),
        })
        const chatConnection = new connect.ChatConnection(contactId, connectionId);
        sandbox.stub(chatConnection, "_isAgentConnectionType").returns(true);

        assert.throws(() => chatConnection.getAuthenticationDetails(), Error, 
                  "Authentication details are available only for customer connection");
        assert.throws(() => chatConnection.isAuthenticated(), Error, 
                  "Authentication details are available only for customer connection");
      });
    });

    it('getParticipantName should return the agent\'s name for connection of type agent', () => {
      connect.agent.initialized = true;
      agent = new connect.Agent();
      const agentChatConnection = new connect.ChatConnection(contactId, connectionId);
      sandbox.stub(agentChatConnection, 'getType').returns('agent');
      assert.equal(agentChatConnection.getParticipantName(), 'mainAgent');
    });

    it('getParticipantName should return the customer\'s name for initial connection', () => {
      const customerChatConnection = new connect.ChatConnection(contactId, connectionId);
      sandbox.stub(customerChatConnection, 'isInitialConnection').returns(true);
      assert.equal(customerChatConnection.getParticipantName(), 'CustomerName');
    });

    it('getParticipantName should return the agentName field for third party participant', () => {
      const thirdParticipantChatConnection = new connect.ChatConnection(contactId, connectionId);
      sandbox.stub(thirdParticipantChatConnection, 'getType').returns('outbound');
      assert.equal(thirdParticipantChatConnection.getParticipantName(), 'testAgent2');
    });
  });
 
  describe('#Voice Connection API', function () {
 
    const connectionId = "connectionId";
    const contactId = "contactId";
    const instanceId = "instanceId";
    const AWSAccountId = "AWSAccountId";
    const initMediaController = sinon.spy();
 
    before(function () {
      sinon.stub(connect.core, 'getClient');
      sandbox.stub(connect.core, 'getAgentDataProvider').returns({
        getContactData: () => { return {connections:[{state:{type:"connected"}}]} },
        _initMediaController: initMediaController,
        getConnectionData: () => {
          return {
            state: {},
            getMediaController: () => { }
          }
        },
        getInstanceId: () => {return instanceId},
        getAWSAccountId: () => {return AWSAccountId},
      });
    });
  
    after(function () {
      connect.core.getClient.restore();
      initMediaController.resetHistory();
      sandbox.restore();
    });

    it('Should create new Voice connection Object given the Voice Contact and Connection Id with Speaker Authenticator ', function () {
      const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
      assert.equal(voiceConnection.connectionId, connectionId);
      assert.equal(voiceConnection.contactId, contactId);
      assert.equal(voiceConnection.getMediaType(), connect.MediaType.SOFTPHONE);
      assert.equal(typeof(voiceConnection.getVoiceIdSpeakerId), 'function');
      assert.equal(typeof(voiceConnection.getVoiceIdSpeakerStatus), 'function')
    });

    describe('getVoiceIdSpeakerId', function() {
      it('Should return SpeakerId promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var speakerId = voiceConnection.getVoiceIdSpeakerId();
        assert.equal(Promise.resolve(speakerId), speakerId);
      });
    });

    describe('getVoiceIdSpeakerStatus', function() {
      it('Should return getVoiceIdSpeakerStatus promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var getVoiceIdSpeakerStatus = voiceConnection.getVoiceIdSpeakerStatus();
        assert.equal(Promise.resolve(getVoiceIdSpeakerStatus), getVoiceIdSpeakerStatus);
      });
    });

    describe('optOutVoiceIdSpeaker', function() {
      it('Should return optOutVoiceIdSpeaker promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var optOutVoiceIdSpeaker = voiceConnection.optOutVoiceIdSpeaker();
        assert.equal(Promise.resolve(optOutVoiceIdSpeaker), optOutVoiceIdSpeaker);
      });
    });

    describe('evaluateSpeakerWithVoiceId', function() {
      it('Should return evaluateSpeakerWithVoiceId promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var evaluateSpeakerWithVoiceId = voiceConnection.evaluateSpeakerWithVoiceId();
        assert.equal(Promise.resolve(evaluateSpeakerWithVoiceId), evaluateSpeakerWithVoiceId);
      });
    });

    describe('enrollSpeakerInVoiceId', function() {
      it('Should return enrollSpeakerInVoiceId promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var enrollSpeakerInVoiceId = voiceConnection.enrollSpeakerInVoiceId();
        assert.equal(Promise.resolve(enrollSpeakerInVoiceId), enrollSpeakerInVoiceId);
      });
    });

    describe('updateVoiceIdSpeakerId', function() {
      it('Should return updateVoiceIdSpeakerId promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var updateVoiceIdSpeakerId = voiceConnection.updateVoiceIdSpeakerId();
        assert.equal(Promise.resolve(updateVoiceIdSpeakerId), updateVoiceIdSpeakerId);
      });
    });

    describe('deleteVoiceIdSpeakerId', function() {
      it('Should return deleteVoiceIdSpeakerId promise.', function () {
        const voiceConnection = new connect.VoiceConnection(contactId, connectionId);
        var voiceIdSpeakerId = voiceConnection.deleteVoiceIdSpeaker();
        assert.equal(Promise.resolve(voiceIdSpeakerId), voiceIdSpeakerId);
      });
    });
  });

  describe('#Task Connection API', function () {

    const connectionId = "connectionId";
    const contactId = "contactId";
    const initialContactId = "initialContactId";
    const initMediaController = sinon.spy();

    var taskMediaInfo = {
      contactId,
      initialContactId
    };
   
    const mediaFactoryGet = () => Promise.resolve();

    connect.core.mediaFactory = {};

    before(function () {

      sandbox.stub(connect.core, 'getAgentDataProvider').returns({
        getContactData: () => { return {
          initialContactId: taskMediaInfo.initialContactId
        } },
        _initMediaController: initMediaController,
        getConnectionData: () => {
          return {
            state: {},
            taskMediaInfo,
            getMediaController: () => { }
          }
        },
      });

      connect.core.mediaFactory.get = sinon.stub(mediaFactoryGet);
      connect.TaskConnection.prototype._initMediaController = initMediaController;
    });

    afterEach(function () {
      initMediaController.resetHistory();
    });

    after(function() {
      sandbox.restore();
    });

    it('Should create new Task connection Object given the task Contact and Connection Id ', function () {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      assert.equal(taskConnection.connectionId, connectionId);
      assert.equal(taskConnection.contactId, contactId);
      assert.equal(taskConnection.getMediaType(), connect.MediaType.TASK);
    });

    it('Should call InitMediaController method on new TaskConnection creation', function () {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      expect(initMediaController.calledOnce).to.be.true;
    });

    it('Should return valid taskMedia Info on getMediaInfo method ', function () {
      const taskConnection = new connect.TaskConnection(contactId, connectionId);
      const mediaInfo = taskConnection.getMediaInfo();
      assert.equal(mediaInfo.contactId, taskMediaInfo.contactId);
    });

  });
});

