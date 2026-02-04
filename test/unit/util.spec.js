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
        var originalClientEngine;
        
        before(function() {
            originalClientEngine = connect.worker.clientEngine;
        });
        
        after(function() {
            connect.worker.clientEngine = originalClientEngine;
        });
        
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

    describe('PopupManager', function () {
        var sandbox;
        var popupManager;
        var mockWindow;

        beforeEach(function () {
            sandbox = sinon.createSandbox();
            popupManager = new connect.PopupManager();
            
            // Ensure window and window.open exist in test environment
            global.window = global.window || {};
            global.window.open = global.window.open || function() {};
            
            // Mock window.open
            mockWindow = {
                closed: false,
                focus: sandbox.stub(),
                opener: global.window,
                location: { href: 'https://example.com' }
            };
            
            sandbox.stub(global.window, 'open').returns(mockWindow);
            sandbox.stub(connect, 'getLog').returns({
                info: sandbox.stub().returnsThis(),
                warn: sandbox.stub().returnsThis(),
                sendInternalLogToServer: sandbox.stub(),
                withObject: sandbox.stub().returnsThis(),
                withException: sandbox.stub().returnsThis()
            });
        });

        afterEach(function () {
            sandbox.restore();
        });

        describe('#open - Window Reuse', function () {
            it('should reuse existing window when called with same URL and name', function () {
                var win1 = popupManager.open('https://example.com', 'test', { width: 500, height: 600 });
                var win2 = popupManager.open('https://example.com', 'test', { width: 500, height: 600 });
                
                assert.strictEqual(global.window.open.callCount, 1, 'window.open should only be called once');
                assert.isTrue(mockWindow.focus.called, 'focus should be called on reused window');
            });

            it('should NOT reload page when reusing window', function () {
                popupManager.open('https://example.com', 'test');
                var initialLocation = mockWindow.location.href;
                
                popupManager.open('https://example.com', 'test');
                
                assert.strictEqual(mockWindow.location.href, initialLocation, 'location should not change');
            });

            it('should open new window if cached window is closed', function () {
                popupManager.open('https://example.com', 'test');
                
                mockWindow.closed = true;
                var mockWindow2 = { closed: false, focus: sandbox.stub(), opener: global.window };
                global.window.open.returns(mockWindow2);
                
                popupManager.open('https://example.com', 'test');
                
                assert.strictEqual(global.window.open.callCount, 2, 'window.open should be called twice');
            });

            it('should clean up cached window reference when window is closed', function () {
                popupManager.open('https://example.com', 'test');
                
                mockWindow.closed = true;
                popupManager.open('https://example.com', 'test');
                
                assert.isUndefined(popupManager.windows['test'], 'windows map should not have test');
                assert.isUndefined(popupManager.windowUrls['test'], 'windowUrls map should not have test');
            });
        });

        describe('#open - Cross-Origin Handling', function () {
            it('should handle cross-origin errors when checking window.closed', function () {
                popupManager.open('https://example.com', 'test');
                
                Object.defineProperty(mockWindow, 'closed', {
                    get: function () {
                        throw new Error('Cross-origin');
                    }
                });
                
                var mockWindow2 = { closed: false, focus: sandbox.stub(), opener: global.window };
                global.window.open.returns(mockWindow2);
                
                assert.doesNotThrow(function () {
                    popupManager.open('https://example.com', 'test');
                }, 'should not throw on cross-origin error');
                
                assert.strictEqual(global.window.open.callCount, 2, 'should open new window after cross-origin error');
            });

            it('should handle errors when calling focus()', function () {
                mockWindow.focus = sandbox.stub().throws(new Error('Cannot focus'));
                
                popupManager.open('https://example.com', 'test');
                
                assert.doesNotThrow(function () {
                    popupManager.open('https://example.com', 'test');
                }, 'should not throw when focus fails');
            });
        });

        describe('#open - Popup Blocking', function () {
            it('should handle when window.open returns null (popup blocked)', function () {
                global.window.open.returns(null);
                
                var result = popupManager.open('https://example.com', 'test');
                
                assert.isNull(result, 'should return null');
                assert.isUndefined(popupManager.windows['test'], 'should not cache null window');
            });
        });

        describe('#open - Window Tracking', function () {
            it('should track window reference in windows map', function () {
                var win = popupManager.open('https://example.com', 'test');
                
                assert.strictEqual(popupManager.windows['test'], mockWindow, 'should track window');
            });

            it('should track window URL in windowUrls map', function () {
                popupManager.open('https://example.com', 'test');
                
                assert.strictEqual(popupManager.windowUrls['test'], 'https://example.com', 'should track URL');
            });

            it('should maintain separate tracking for different window names', function () {
                var mockWindow2 = { closed: false, focus: sandbox.stub(), opener: global.window };
                
                popupManager.open('https://example.com', 'test1');
                
                global.window.open.returns(mockWindow2);
                popupManager.open('https://example.com', 'test2');
                
                assert.strictEqual(popupManager.windows['test1'], mockWindow, 'test1 should be tracked');
                assert.strictEqual(popupManager.windows['test2'], mockWindow2, 'test2 should be tracked');
            });
        });

        describe('#open - Feature String', function () {
            it('should include dimensions in feature string when options provided', function () {
                popupManager.open('https://example.com', 'test', { 
                    width: 500, 
                    height: 600, 
                    top: 10, 
                    left: 20 
                });
                
                var features = global.window.open.getCall(0).args[2];
                assert.include(features, 'width=500', 'should include width');
                assert.include(features, 'height=600', 'should include height');
                assert.include(features, 'top=10', 'should include top');
                assert.include(features, 'left=20', 'should include left');
            });

            it('should use default dimensions when not provided', function () {
                popupManager.open('https://example.com', 'test', {});
                
                var features = global.window.open.getCall(0).args[2];
                assert.include(features, 'width=433', 'should include default width');
                assert.include(features, 'height=578', 'should include default height');
            });

            it('should pass empty string when no options provided', function () {
                popupManager.open('https://example.com', 'test');
                
                var features = global.window.open.getCall(0).args[2];
                assert.strictEqual(features, '', 'features should be empty string');
            });
        });

        describe('#clear', function () {
            it('should remove window from tracking when cleared', function () {
                popupManager.open('https://example.com', 'test');
                
                popupManager.clear('test');
                
                assert.isUndefined(popupManager.windows['test'], 'windows should not have test');
                assert.isUndefined(popupManager.windowUrls['test'], 'windowUrls should not have test');
            });

            it('should remove from localStorage when cleared', function () {
                sandbox.stub(global.localStorage, 'removeItem');
                
                popupManager.clear('test');
                
                assert.isTrue(global.localStorage.removeItem.calledWith('connectPopupManager::test'));
            });
        });

        describe('#open - Direct URL Navigation', function () {
            it('should open window directly to target URL', function () {
                popupManager.open('https://example.com/login', 'test');
                
                var url = global.window.open.getCall(0).args[0];
                assert.strictEqual(url, 'https://example.com/login', 'should open directly to URL');
            });

            it('should not open to blank first', function () {
                popupManager.open('https://example.com/login', 'test');
                
                assert.strictEqual(global.window.open.callCount, 1, 'should only call window.open once');
                var url = global.window.open.getCall(0).args[0];
                assert.notStrictEqual(url, '', 'should not open to blank');
                assert.notStrictEqual(url, 'about:blank', 'should not open to about:blank');
            });
        });

        describe('#open - Logging', function () {
            it('should log when opening new popup', function () {
                var logger = connect.getLog();
                
                popupManager.open('https://example.com', 'test');
                
                assert.isTrue(logger.info.calledWith('[PopupManager] Opened popup window'));
            });

            it('should log when reusing existing popup', function () {
                var logger = connect.getLog();
                
                popupManager.open('https://example.com', 'test');
                popupManager.open('https://example.com', 'test');
                
                assert.isTrue(logger.info.calledWith('[PopupManager] Reusing existing popup window'));
            });
        });
    });

    describe('TODO', function () {
        it("include test cases for all the remaining methods");
    });

});
