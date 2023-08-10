require("../../unit/drCoordinator/test-setup-dr.js");
var jsdom = require("mocha-jsdom");

describe('A Container Instance', function () {
  let container;
  jsdom({ url: "http://localhost", skipWindowCheck: true });
  var region = "us-east-1";
  var resource = {
    "ccpUrl": "mock-ccp-url",
    "loginUrl": "mock-login-url",
    "region": region,
    "loginPopup": false,
    "disasterRecoveryOn": true,
    "iframe_style": "margin: 0; border: 0; padding:0px;width: 0px;height: 0px",
    "height": "800px",
    "isPrimary": true
  };

  before(function () {
    container = new globalConnect.Container(resource);
  });

  it('should create a container with an ID, containing an CCP iframe configured with an ID, content, and scrolling disabled', function() {
    global.assert.equal(container.id, region);
    global.assert.equal(container.ccp.id, region);
    global.assert.equal(container.ccp.scrolling, "no");
    global.expect(container.ccp.srcdoc).to.have.string('html');
  });

  it('should create a container with the provided region ID and pass the normalized region to initCCP, if given a region string with a discriminator', function() {
    const regionID = region + ".instance1";
    const discriminatedResource = Object.assign({}, resource);
    discriminatedResource.region = regionID;
    const discriminatedContainer = new globalConnect.Container(discriminatedResource);
    global.assert.equal(discriminatedContainer.id, regionID);
    global.assert.equal(discriminatedContainer.ccp.id, regionID);
    global.expect(discriminatedContainer.ccp.srcdoc).to.include('html');
    global.expect(discriminatedContainer.ccp.srcdoc).to.include(`"region":"${region}"`);
  });

  describe('getContent', function() {
    it ('should return string content', function() {
        global.expect(container.getContent(resource)).to.be.string;
    });
    it('should return html content with initCCP initialization', function() {
        global.expect(container.ccp.srcdoc).to.have.string('initCCP');
    })
  })

  describe('_normalizeRegionString', function() {
    it ("should return the input unchanged if it doesn't contain a delimiter", function() {
      assert.equal(container._normalizeRegionString(region), region);
    });
    it ("should remove the delimiter and characters following it if present", function() {
      assert.equal(container._normalizeRegionString(region + ".instance1"), region);
    });
  });
});