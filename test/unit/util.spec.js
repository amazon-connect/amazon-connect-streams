require("../unit/test-setup.js");

var COPYABLE_EVENT_FIELDS = ["bubbles", "cancelBubble", "cancelable", "composed", "data", "defaultPrevented", "eventPhase", "isTrusted", "lastEventId", "origin", "returnValue", "timeStamp", "type"];

describe('Utils', function () {

    describe('#connect.hitch', function () {
        // Initialize required test data
        before(function () {
            this.callback = sinon.spy();
            this.obj = {};
        });

        it('calls original function with right this and args', function () {
            var proxy = connect.hitch(this.obj, this.callback, 1, 2, 3)();
            assert.isTrue(this.callback.called);
            assert.isTrue(this.callback.calledOn(this.obj));
            assert.isTrue(this.callback.calledWith(1, 2, 3));
        });

        it("returns the return value from the original function", function () {
            var callback = sinon.stub().returns("10");
            var result = connect.hitch(this.obj, callback, 1, 2, 3)();
            assert.equal(10, result);
        });

        it('should throw a ValueError if its call without the parameter', function () {
            assert.throws(connect.hitch, connect.ValueError)
        });
    });

    describe("#connect.keys", function () {

        before(function () {
            this.myTestObject = {
                name: "test",
                value: "test"
            }
        });
        // pending test below
        it('should return Array of keys within the object if we pass an object', function () {
            assert.deepEqual(["name", "value"], connect.keys(this.myTestObject))
        });


        it('should throw a ValueError if we call without the parameter', function () {
            assert.throws(connect.keys, connect.ValueError)
        });

    });

    describe('#connect.isFunction', function () {
        // Initialize required test data
        before(function () {
            this.myTestFunction = function () { };
            this.myTestvariable = 10;
        });
        // pending test below
        it('should return false if we do not pass a function', function () {
            assert.equal(false, connect.isFunction(this.myTestvariable))
        });

        it('Should return true if we pass a function', function () {
            assert.equal(true, connect.isFunction(this.myTestFunction))
        });

    });

    describe('#connect.hasOtherConnectedCCPs', function () {
        it('should return false if connect.numberOfConnectedCCPs is 0', function () {
            connect.numberOfConnectedCCPs = 0;
            assert.isFalse(connect.hasOtherConnectedCCPs());
        });
        it('should return false if connect.numberOfConnectedCCPs is 1', function () {
            connect.numberOfConnectedCCPs = 1;
            assert.isFalse(connect.hasOtherConnectedCCPs());
        });
        it('should return false if connect.numberOfConnectedCCPs is 2', function () {
            connect.numberOfConnectedCCPs = 2;
            assert.isTrue(connect.hasOtherConnectedCCPs());
        });
    });

    describe('#connect.isCCP', function () {
        it('should return true when the upstream.name is ConnectSharedWorkerConduit', function () {
            sinon.stub(connect.core, 'getUpstream').returns({ name: 'ConnectSharedWorkerConduit' });
            assert.isTrue(connect.isCCP());
            connect.core.getUpstream.restore();
        });
        it('should return true when the upstream.name is NOT ConnectSharedWorkerConduit', function () {
            sinon.stub(connect.core, 'getUpstream').returns({ name: 'https://ccp.url.com' });
            assert.isFalse(connect.isCCP());
            connect.core.getUpstream.restore();
        });
    });
    
    describe('#connect.isSharedWorker', function () {
        it('should return true when the upstream.name is ConnectSharedWorkerConduit', function () {
            connect.worker.clientEngine = true;
            assert.isTrue(connect.isSharedWorker());
        });
        it('should return false when the upstream.name is NOT ConnectSharedWorkerConduit', function () {
            connect.worker.clientEngine = null;
            assert.isFalse(connect.isSharedWorker());
        });
    })

    describe('#connect.isCRM', function () {
        it('should return true when the upstream is instance of IFrameConduit', function () {

            sinon.stub(connect, 'WindowIOStream').returns(sinon.stub());
            sinon.stub(connect, 'IFrameConduit').returns(sinon.stub());
            sinon.stub(connect.core, 'getUpstream').returns(new connect.IFrameConduit());
            assert.isTrue(connect.isCRM());
            connect.core.getUpstream.restore();
            connect.WindowIOStream.restore();
            connect.IFrameConduit.restore();
        });

        it('should return false when the upstream is not an instance of IFrameConduit', function () {
            sinon.stub(connect.core, 'getUpstream').returns({ name: 'https://ccp.url.com' });
            assert.isFalse(connect.isCRM());
            connect.core.getUpstream.restore();
        });
    })

    describe('#connect.deepcopyCrossOriginEvent', () => {
        it('should ignore all fields but those hardcoded in the method.', () => {
            let obj = {"heyo": "hi"};
            let obj2 = {};
            COPYABLE_EVENT_FIELDS.forEach((key) => {
                obj[key] = "hello";
                obj2[key] = "hello";
            });
            assert.notDeepEqual(connect.deepcopyCrossOriginEvent(obj), obj);
            assert.deepEqual(connect.deepcopyCrossOriginEvent(obj), obj2);
            assert.deepEqual(connect.deepcopyCrossOriginEvent(obj2), obj2);
        });
    });
    describe('#connect.isValidLocale', function () {
        it('should return true for a valid locale', function() {
            assert.equal(true, connect.isValidLocale('en_US'));
        })
        it('should return false for an invalid locale', function() {
            assert.equal(false, connect.isValidLocale('incorrect'));
        });
    });

    describe('#connect.deepcopyCrossOriginEvent', () => {
        it('should ignore all fields but those hardcoded in the method.', () => {
            let obj = {"heyo": "hi"};
            let obj2 = {};
            COPYABLE_EVENT_FIELDS.forEach((key) => {
                obj[key] = "hello";
                obj2[key] = "hello";
            });
            assert.notDeepEqual(connect.deepcopyCrossOriginEvent(obj), obj);
            assert.deepEqual(connect.deepcopyCrossOriginEvent(obj), obj2);
            assert.deepEqual(connect.deepcopyCrossOriginEvent(obj2), obj2);
        });
    });

    describe('TODO', function () {
        it("include test cases for all the remaining methods");
    });

});
