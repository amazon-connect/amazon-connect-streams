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
        const primaryRegion = "primaryRegion";
        const standByRegion = "standByRegion";
        let getPrimaryRegionStub;
        let params;
        afterEach(function () {
            sandbox.restore();
        });
        describe('testing with primary region provided using getPrimaryRegion function', function() {
            beforeEach(function () {
                getPrimaryRegionStub = sandbox.stub().callsArgWith(0, primaryRegion);
                this.globalContainerDiv = { appendChild: sandbox.spy() };
                params = {
                    ccpUrl: "primaryUrl.com",
                    loginUrl: "primaryLoginUrl.com",
                    region: primaryRegion,
                    getPrimaryRegion: getPrimaryRegionStub,
                    softphone: {
                        ringtoneUrl: "customVoiceRingtone.amazon.com"
                    },
                    standByRegion: {
                        ccpUrl: "standByUrl.com",
                        region: standByRegion
                    }
                };
                sandbox.stub(globalConnect.core, "failoverTo");
                sandbox.stub(globalConnect.core, "activate");

                globalConnect.core.initCCP(this.globalContainerDiv, params);
                sandbox.replace(globalConnect.core, "regions", {"primaryRegion": {}, "standByRegion": {}});
            });
            it("calls getPrimaryRegion function on init", function () {
                sandbox.assert.calledOnce(getPrimaryRegionStub);
            });
            it("calls failoverTo() with the current non-primary region when failover() is called", function () {
                globalConnect.core.failover();
                sandbox.assert.calledWith(globalConnect.core.failoverTo, standByRegion);
            });
            it("calls failoverTo() with the current non-primary region when failover() is called, passing along the argument if provided", function () {
                globalConnect.core.failover(true);
                sandbox.assert.calledWith(globalConnect.core.failoverTo, standByRegion, true);
            });
        });
        describe('testing cases where no region was passed to getPrimaryRegion', function() {
            beforeEach(function () {
                getPrimaryRegionStub = sandbox.stub().callsArg(0);
                this.globalContainerDiv = { appendChild: sandbox.spy() };
                sandbox.stub(globalConnect.core, "failoverTo");
                sandbox.stub(globalConnect.core, "activate");
            });
            describe('polling enabled', function() {
                beforeEach(function () {
                    params = {
                        ccpUrl: "primaryUrl.com",
                        loginUrl: "primaryLoginUrl.com",
                        region: primaryRegion,
                        getPrimaryRegion: getPrimaryRegionStub,
                        instanceArn: "arn",
                        softphone: {
                            ringtoneUrl: "customVoiceRingtone.amazon.com"
                        },
                        pollForFailover: true,
                        standByRegion: {
                            ccpUrl: "standByUrl.com",
                            region: standByRegion,
                            instanceArn: "arn2"
                        }
                    };

                    globalConnect.core.initCCP(this.globalContainerDiv, params);
                    sandbox.replace(globalConnect.core, "regions", {"primaryRegion": {}, "standByRegion": {}});
                });
                it("calls getPrimaryRegion function on init", function () {
                    sandbox.assert.calledOnce(getPrimaryRegionStub);
                });
                it("sets initial primary region to the region of the primary CCP, when no region was passed to getPrimaryRegion and polling is enabled", function() {
                    assert.equal(primaryRegion, globalConnect.core.primaryRegion);
                });
            });
            describe('polling disabled', function() {
                beforeEach(function() {
                    params = {
                        ccpUrl: "primaryUrl.com",
                        loginUrl: "primaryLoginUrl.com",
                        region: primaryRegion,
                        getPrimaryRegion: getPrimaryRegionStub,
                        softphone: {
                            ringtoneUrl: "customVoiceRingtone.amazon.com"
                        },
                        standByRegion: {
                            ccpUrl: "standByUrl.com",
                            region: standByRegion
                        }
                    };
                });
                it("throws an error, when no region was passed to getPrimaryRegion and polling is not enabled", function() {
                    assert.throws(globalConnect.core.initCCP, connect.TypeError);
                });
            });
        });
    });

    describe('#globalConnect.core.initCCP() with missing standby region', function () {
        before(function () {
            this.globalContainerDiv = { appendChild: sandbox.spy() };
            this.params = {
                ccpUrl: "primaryUrl.com",
                loginUrl: "primaryLoginUrl.com",
                region: "primaryRegion",
                getPrimaryRegion: function () {},
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

    describe("globalConnect.extractCcpRegionParams", function () {
        beforeEach(function () {
            this.globalContainerDiv = { appendChild: sandbox.spy() };
            this.params = {
                ccpUrl: "primaryUrl.com",
                loginUrl: "primaryLoginUrl.com",
                region: "primaryRegion",
                getPrimaryRegion: function () {},
                softphone: {
                    ringtoneUrl: "customVoiceRingtone.amazon.com"
                },
                standByRegion: {
                    ccpUrl: "standByUrl.com",
                    region: "standbyRegion"
                }
            };
        });
        describe("pollForFailover enabled", function () {
            const PRIMARY_ARN = "primaryArn";
            const STANDBY_ARN = "standbyArn";
            beforeEach(function() {
                this.params.pollForFailover = true;
            });
            it("throws if pollForFailover is enabled but primary instance ARN was not provided", function () {
                assert.throws(() => {globalConnect.extractCcpRegionParams(this.globalContainerDiv, this.params)}, connect.ValueError, "");
            });
            it("throws if pollForFailover is enabled but secondary instance ARN was not provided", function () {
                this.params.instanceArn = PRIMARY_ARN;
                assert.throws(() => {globalConnect.extractCcpRegionParams(this.globalContainerDiv, this.params)}, connect.ValueError, "");
            });
            it("assigns primary and secondary instance ARNs if they are provided", function () {
                this.params.instanceArn = PRIMARY_ARN;
                this.params.standByRegion.instanceArn = STANDBY_ARN;
                const result = globalConnect.extractCcpRegionParams(this.globalContainerDiv, this.params);
                const primaryParams = result[0];
                assert.equal(primaryParams.instanceArn, PRIMARY_ARN);
                assert.equal(primaryParams.otherArn, STANDBY_ARN);
                const standbyParams = result[1];
                assert.equal(standbyParams.instanceArn, STANDBY_ARN);
                assert.equal(standbyParams.otherArn, PRIMARY_ARN);
            });
        });
    });

    describe("globalConnect.core.onFailoverComplete", function () {
        const REGION = "AWS_REGION";
        const CCP_URL = "CCP_URL";
        const EXPECTED_DATA = {activeRegion: REGION, activeCcpUrl: CCP_URL};

        it("executes logic attached to failover complete event when handlers are triggered", function() {
            const promise = new Promise((resolve) => globalConnect.core.onFailoverComplete((data) => resolve(data)));
            globalConnect._triggerFailoverCompleteHandlers(EXPECTED_DATA);
            return promise.then((data) => assert.equal(data, EXPECTED_DATA));
        });

        it("does not execute logic from triggers that have been deregistered", function() {
            var triggerComplete = false;
            globalConnect.core.onFailoverComplete(() => { triggerComplete = true; })();
            const promise = new Promise((resolve) => globalConnect.core.onFailoverComplete((data) => resolve(data)));
            globalConnect._triggerFailoverCompleteHandlers(EXPECTED_DATA);
            return promise.then(() => assert.isFalse(triggerComplete));
        });

        it("executes logic attached from multiple handlers when triggered", function() {
            const promise1 = new Promise((resolve) => globalConnect.core.onFailoverComplete((data) => resolve(data)));
            const promise2 = new Promise((resolve) => globalConnect.core.onFailoverComplete((data) => resolve(data)));
            globalConnect._triggerFailoverCompleteHandlers(EXPECTED_DATA);
            return Promise.all([promise1, promise2]).then((result) => {
                assert.equal(result[0], EXPECTED_DATA);
                assert.equal(result[1], EXPECTED_DATA);
            });
        });
    });

    describe("globalConnect.core.onFailoverPending", function () {
        const ARN = "ARN";
        const EXPECTED_DATA = {nextActiveArn: ARN};

        it("executes logic attached to failover pending event when handlers are triggered", function() {
            const promise = new Promise((resolve) => globalConnect.core.onFailoverPending((data) => resolve(data)));
            globalConnect._triggerFailoverPendingHandlers(EXPECTED_DATA);
            return promise.then((data) => assert.equal(data, EXPECTED_DATA));
        });

        it("does not execute logic from triggers that have been deregistered", function() {
            var triggerComplete = false;
            globalConnect.core.onFailoverPending(() => { triggerComplete = true; })();
            const promise = new Promise((resolve) => globalConnect.core.onFailoverPending((data) => resolve(data)));
            globalConnect._triggerFailoverPendingHandlers(EXPECTED_DATA);
            return promise.then(() => assert.isFalse(triggerComplete));
        });

        it("executes logic attached from multiple handlers when triggered", function() {
            const promise1 = new Promise((resolve) => globalConnect.core.onFailoverPending((data) => resolve(data)));
            const promise2 = new Promise((resolve) => globalConnect.core.onFailoverPending((data) => resolve(data)));
            globalConnect._triggerFailoverPendingHandlers(EXPECTED_DATA);
            return Promise.all([promise1, promise2]).then((result) => {
                assert.equal(result[0], EXPECTED_DATA);
                assert.equal(result[1], EXPECTED_DATA);
            });
        });
    });

    describe("globalConnect.core.onInit", function () {
        const CONNECT = {"connect": true};
        const REGION = "REGION";
        const EXPECTED_DATA = {"connect": CONNECT, "region": REGION};

        it("executes logic attached to init event when handlers are triggered", function() {
            const promise = new Promise((resolve) => globalConnect.core.onInit((connect, region) => resolve({connect, region})));
            globalConnect._triggerInitHandlers(CONNECT, REGION);
            return promise.then((data) => assert.deepEqual(data, EXPECTED_DATA));
        });

        it("does not execute logic from triggers that have been deregistered", function() {
            var triggerComplete = false;
            globalConnect.core.onInit(() => { triggerComplete = true; })();
            const promise = new Promise((resolve) => globalConnect.core.onInit((connect, region) => resolve({connect, region})));
            globalConnect._triggerInitHandlers(CONNECT, REGION);
            return promise.then(() => assert.isFalse(triggerComplete));
        });

        it("executes logic attached from multiple handlers when triggered", function() {
            const promise1 = new Promise((resolve) => globalConnect.core.onInit((connect, region) => resolve({connect, region})));
            const promise2 = new Promise((resolve) => globalConnect.core.onInit((connect, region) => resolve({connect, region})));
            globalConnect._triggerInitHandlers(CONNECT, REGION);
            return Promise.all([promise1, promise2]).then((result) => {
                assert.deepEqual(result[0], EXPECTED_DATA);
                assert.deepEqual(result[1], EXPECTED_DATA);
            });
        });
    });

    describe("globalConnect.core.downloadLogs", function () {
        const REGION1 = "REGION1";
        const REGION2 = "REGION2";
        var defaultRegions = {};
        var downloadLogStub;

        beforeEach(function() {
            downloadLogStub = sandbox.stub();
            defaultRegions[REGION1] = { connect: { getLog: () => ({download: downloadLogStub}) } };
            defaultRegions[REGION2] = { connect: { getLog: () => ({download: downloadLogStub}) } };
            sandbox.replace(globalConnect.core, "primaryRegion", REGION1);
        });

        afterEach(function() {
            sandbox.restore();
        });

        it("downloads logs for all instances", function() {
            sandbox.replace(globalConnect.core, "regions", defaultRegions);
            globalConnect.core.downloadLogs();
            sandbox.assert.calledTwice(downloadLogStub);
            sandbox.assert.calledWithMatch(downloadLogStub, {logName: "REGION1-agent-log"});
            sandbox.assert.calledWithMatch(downloadLogStub, {logName: "REGION2-agent-log"});
        });

        it("passes options for log name and filterByLogLevel to inner Logger.download()", function() {
            sandbox.replace(globalConnect.core, "regions", defaultRegions);
            globalConnect.core.downloadLogs({logName: "log-name", filterByLogLevel: true});
            sandbox.assert.calledTwice(downloadLogStub);
            sandbox.assert.calledWith(downloadLogStub, {logName: "REGION1-log-name", filterByLogLevel: true});
            sandbox.assert.calledWith(downloadLogStub, {logName: "REGION2-log-name", filterByLogLevel: true});
        });

        it("throws if globalConnect.core.regions is not created yet", function() {
            sandbox.replace(globalConnect.core, "regions", null);
            assert.throws(globalConnect.core.downloadLogs);
        });

        it("throws if globalConnect.core.regions is not populated with the regional Streams objects yet", function() {
            var regions = {};
            regions[REGION1] = {};
            sandbox.replace(globalConnect.core, "regions", regions);
            assert.throws(globalConnect.core.downloadLogs);
        });
    });
});