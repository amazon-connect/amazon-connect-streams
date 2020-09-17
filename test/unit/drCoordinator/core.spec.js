require("../../unit/drCoordinator/test-setup-dr.js");
 
describe('DR Core', function () {
    var sandbox = sinon.createSandbox();
 
    global.window.getComputedStyle = sinon.stub().returns({
        getPropertyValue: sinon.stub().returns(function (params) {
            return {height: '400px',
                    width: '500px',
                    display: 'none'
                } [params];
        })
    });
 
    describe('#globalConnect.core.initCCP()', function () {
        before(function () {
            this.globalContainerDiv = { appendChild: sandbox.spy() };
            this.params = {
                ccpUrl: "primaryUrl.com",
                loginUrl: "primaryLoginUrl.com",
                region: "primaryRegion",
                ssoEnabled: true,
                getPrimaryRegion: getPrimaryRegion,
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                },
                standByRegion: {
                    ccpUrl: "standByUrl.com",
                    loginUrl: "standByLoginUrl.com",
                    region: "standByRegion"          
                 }
            }; 
 
            function getPrimaryRegion(success, failure) {
                success("primaryRegion");
            }
 
            sandbox.stub(globalConnect.core, "failoverTo");
        });
 
        after(function () {
            sandbox.restore();
        });
 
        it("CCP initialization", function () {
            var spy = sinon.spy(this.params, "getPrimaryRegion");
 
            globalConnect.core.initCCP(this.globalContainerDiv, this.params);
            expect(this.params.getPrimaryRegion).not.to.be.a("null");
            expect(this.params.standByRegion).to.be.a("undefined");
            assert(spy.calledOnce);
        });
 
        it("should check if correct functions are called from globalConnect.core.failover()", function () {
            globalConnect.core.failover();
            assert.isTrue(globalConnect.core.failoverTo.calledOnce);
        });
    });
 
    describe('#globalConnect.core.initCCP() with missing standby region', function () {
        before(function () {
            this.globalContainerDiv = { appendChild: sandbox.spy() };
            this.params = {
                ccpUrl: "primaryUrl.com",
                loginUrl: "primaryLoginUrl.com",
                region: "primaryRegion",
                ssoEnabled: true,
                getPrimaryRegion: function (success, failure) {},
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                }
            }; 
        });
 
        after(function () {
            sandbox.restore();
        });
 
        it("CCP initialization with incorrect parameters", function () {
            assert.throws(globalConnect.core.initCCP, connect.TypeError);
            assert.throws(() => {globalConnect.core.initCCP(this.globalContainerDiv, this.params)}, connect.ValueError, "");
        });
    });
});