require("../unit/test-setup.js");

describe('Connections API', function () {

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
      customerName: "CustomerName"
    };

    before(function () {

      connect.core.getAgentDataProvider = sinon.stub().returns({
        getContactData: () => { return {} },
        _initMediaController: initMediaController,
        getConnectionData: () => {
          return {
            state: {},
            chatMediaInfo: chatMediaInfo,
            monitoringInfo: chatMonitorInfo,
            getMediaController: () => { }
          }
        },
      })
    });

    after(function () {
      initMediaController.resetHistory();
      connect.core.getAgentDataProvider.resetBehavior();
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
  });
 
  describe('#Voice Connection API', function () {
 
     const connectionId = "connectionId";
     const contactId = "contactId";
     const instanceId = "instanceId";
     const AWSAccountId = "AWSAccountId";
     const initMediaController = sinon.spy();
 
     before(function () {
       connect.core.getClient = sinon.stub();
       connect.core.getAgentDataProvider = sinon.stub().returns({
         getContactData: () => { return {connections:[{}]} },
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
       initMediaController.resetHistory();
       connect.core.getAgentDataProvider.resetBehavior();
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

      connect.core.getAgentDataProvider = sinon.stub().returns({
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
      connect.core.getAgentDataProvider.resetBehavior();
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

