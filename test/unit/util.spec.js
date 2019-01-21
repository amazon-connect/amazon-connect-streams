require("../unit/test-setup.js");

describe('Utils', function () {

    describe('#connect.hitch', function () {
        // Initialize required test data
        before(function () {
            this.callback = sinon.spy();
            this.obj = {};
        });

        it('calls original function with right this and args', function () {
            var proxy = connect.hitch(this.obj, this.callback, 1, 2, 3)();
            assert(this.callback.called);
            assert(this.callback.calledOn(this.obj));
            assert(this.callback.calledWith(1, 2, 3));
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

    describe('TODO', function () {
        it("include test cases for all the remaining methods");
    });

});