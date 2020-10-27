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

