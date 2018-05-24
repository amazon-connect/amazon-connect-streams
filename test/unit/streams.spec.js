require("../unit/test-setup.js");

describe('Streams', function () {

    describe('WindowStream', function () {
        it('Validate send and onMessage methods are implemented', function () {
            var windowStream = new connect.WindowStream(window, "amazon.com");
            assert.isFunction(windowStream.send);
            assert.isFunction(windowStream.onMessage);
            assert.exists(windowStream.window);
            assert.exists(windowStream.domain);
        });
    });

    describe('WindowIOStream', function () {
        it('Validate send and onMessage methods are implemented with input and output - communication between IFrame/popup windows', function () {
            var WindowIOStream = new connect.WindowIOStream(window, window, "amazon.com");
            assert.isFunction(WindowIOStream.send);
            assert.isFunction(WindowIOStream.onMessage);
            assert.exists(WindowIOStream.input);
            assert.exists(WindowIOStream.output);
            assert.exists(WindowIOStream.domain);
        });
    });

    describe('PortStream', function () {
        it('Validate workers stream is initialized properly with the connected port', function () {
            var PortStream = new connect.PortStream(1000);
            assert.isFunction(PortStream.send);
            assert.isFunction(PortStream.onMessage);
            assert.exists(PortStream.port);
        });
    });

    describe('Conduit', function () {

        before(function () {
            this.stream = {
                send: sinon.spy(),
                onMessage: sinon.spy()
            }
        });

        it('validate send downstream and upstream APIs', function () {
            var conduit = new connect.Conduit("ConnectSharedWorkerConduit",
                this.stream, this.stream);
            conduit.sendDownstream("Event", {});
            expect(conduit.upstream.send.withArgs("Event", {}).calledOnce);

            conduit.sendUpstream("Event", {});
            expect(conduit.downstream.send.withArgs("Event", {}).calledOnce);
        });
    });


    describe('TODO', function () {
        it('Test cases for Stream Multiplexer');
        it('Test cases for Iframe condult');
    });

});