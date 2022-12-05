const mochaJsdom = require("mocha-jsdom");

require("../unit/test-setup.js");

// TODO: Make these work as standalone, for some reason they require a initCCP call to not fail
describe('SoftphoneManager', function () {
    jsdom({ url: "http://localhost" });
    
    var sandbox = sinon.createSandbox();

    describe('#SoftphoneManager RTC session for Chrome browser', function () {
        var bus,
            contact,
            contactId;

        before(function () {
            bus = new connect.EventBus();
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub()
            });
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
            var streamsFake = {
                getAudioTracks: () => {
                    return [{ kind: "audio", enabled: true, }];
                },
            };
            global.navigator = {
                mediaDevices: {
                    enumerateDevices: () => new Promise((resolve) => {
                        setTimeout(() => {
                            resolve([{
                                toJSON: () => ({
                                    deviceId: "deviceId",
                                    groupId: "groupId",
                                    kind: "audioinput",
                                    label: "Microphone"
                                })
                            }])
                        }, 500);
                    }),
                    getUserMedia: () => new Promise((resolve) => {
                        resolve(streamsFake);
                    }),
                },
            };
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            sandbox.stub(connect, 'RTCSession').returns({
                connect: sandbox.stub()
            });
            sandbox.stub(connect, 'isChromeBrowser').returns(true);
            sandbox.stub(connect, 'getChromeBrowserVersion').returns(79);
            sandbox.stub(contact, 'getAgentConnection').returns({
                getSoftphoneMediaInfo: sandbox.stub().returns({
                    callConfigJson: "{}"
                }),
                connectionId: '0987654321'
            });
            sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
            connect.agent.initialized = true;
        });

        after(function () {
            sandbox.restore();
        });

        afterEach(function () {
            contact.getStatus.restore();
        });

        it('RTC session created for a incoming contact', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTING
            });
            new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCSession.calledOnce);
        });

        it('RTC session will not be created for the contact which is already connected with one RTC session', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTED
            });
            connect.RTCsession = sandbox.spy();
            new connect.SoftphoneManager({});
            bus.trigger(connect.ContactEvents.INIT, contact);
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCsession.notCalled);
        });

        it('RTC session is not created in case of contact INIT event is missed!', function () {
            sandbox.stub(contact, "getStatus").returns({
                type: connect.ContactStatusType.CONNECTING
            });
            connect.RTCsession = sandbox.spy();
            new connect.SoftphoneManager({});
            bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
            assert.isTrue(connect.RTCsession.notCalled);
        });

        describe("FIXME", function () {
            // Include the test cases once we merge the changes
            it('Multiple RTC session should not be created in case of voice system failures!')
        });
    });

    describe('#SoftphoneManager RTC session for Firefox browser', function () {
        var bus, contact, contactId;

        before(function () {
            bus = new connect.EventBus();
            contactId = "1234567890";
            contact = new connect.Contact(contactId);
        });

        beforeEach(function () {
            sandbox.stub(connect.core, "getEventBus").returns(bus);
            sandbox.stub(connect.core, "getUpstream").returns({
                sendUpstream: sandbox.stub()
            });
            sandbox.stub(contact, "isSoftphoneCall").returns(true);
            sandbox.stub(contact, "isInbound").returns(true);
            sandbox.stub(connect, 'RTCSession').returns({
                connect: sandbox.stub()
            });
            sandbox.stub(connect, 'isChromeBrowser').returns(false);
            sandbox.stub(connect, 'isFirefoxBrowser').returns(true);
            sandbox.stub(connect, 'getFirefoxBrowserVersion').returns(84);
            sandbox.stub(connect.Agent.prototype, 'getContacts').returns([]);
        });

        afterEach(function () {
            sandbox.restore();
        });

        describe('RTC session created immediately for an incoming contact', function () {
            it('when only one CCP tab is opened', function () {
                sandbox.stub(contact, "getStatus").returns({
                    type: connect.ContactStatusType.CONNECTING
                });
                sandbox.stub(connect, 'hasOtherConnectedCCPs').returns(false);
                sandbox.stub(contact, 'getAgentConnection').returns({
                    getSoftphoneMediaInfo: sandbox.stub().returns({
                        callConfigJson: "{}",
                        autoAccept: false
                    }),
                    connectionId: '0987654321'
                });
                new connect.SoftphoneManager({});
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                assert.isTrue(connect.RTCSession.calledOnce);
            });
        });
        describe('RTC session is not created for an incoming contact', function () {
            it('when multiple CCP tabs are opened', function () {
                sandbox.stub(contact, "getStatus").returns({
                    type: connect.ContactStatusType.CONNECTING
                });
                sandbox.stub(connect, 'hasOtherConnectedCCPs').returns(true);
                sandbox.stub(contact, 'getAgentConnection').returns({
                    getSoftphoneMediaInfo: sandbox.stub().returns({
                        callConfigJson: "{}",
                        autoAccept: false
                    }),
                    connectionId: '0987654321'
                });
                var softphoneManager = new connect.SoftphoneManager({});
                bus.trigger(connect.ContactEvents.INIT, contact);
                bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), contact);
                assert.isFalse(connect.RTCSession.calledOnce);

                // RTC session created after startSession() is called
                softphoneManager.startSession();
                assert.isTrue(connect.RTCSession.calledOnce);
            });
        });
    });
});
