(function() {

   var global = this;
   lily = global.lily || {};
   global.lily = lily;
   
   var AuthTokenCredentials = AWS.util.inherit(AWS.Credentials, {
      constructor: function LilyAuthTokenCredentials(authToken) {
         AWS.Credentials.call(this);
         this.authToken = authToken;
      }
   });

   var AuthTokenSigner = AWS.util.inherit(AWS.Signers.RequestSigner, {
      addAuthorization: function addAuthorization(credentials, date) {
         this.request.headers.Authorization = lily.sprintf('Bearer %s', credentials.authToken);
      }
   });

   /**
    * Override the AWS.Signers.RequestSigner.getVersion method to allow our own
    * custom signer type 'lilyAuth'.
    */
   var getTraditionalAuthVersion = AWS.Signers.RequestSigner.getVersion;
   AWS.Signers.RequestSigner.getVersion = function getVersion(version) {
     if (version === 'lilyAuth') {
         return AuthTokenSigner;
     } else {
        return getTraditionalAuthVersion(version);
     }
   };

   lily.AuthTokenCredentials = AuthTokenCredentials;
   
})();
