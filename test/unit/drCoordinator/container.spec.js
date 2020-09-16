require("../../unit/drCoordinator/test-setup-dr.js");


describe('A Container Instance', function () {
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

  var container = new globalConnect.Container(resource)
  var containerId = region.replace(/-/g, '_');

  it('should have an id', function () {
    global.assert.equal(container.id, containerId)
  });

  it('should create an iframe container', function() {
    global.assert.equal(container.ccp.id, containerId);
    global.assert.equal(container.ccp.scrolling, "no");
    global.expect(container.ccp.srcdoc).to.have.string('html');
  });
  
  describe('getContent', function() {
    var result = container.getContent(resource);
    it ('should return a string content', function() {
        global.expect(result).to.be.string;
    });
    
    it('should return html content with initCCP initialization', function() {
        global.expect(container.ccp.srcdoc).to.have.string('initCCP');
    })
  })

  

});