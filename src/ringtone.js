/*
 * control-panel/ringtone.js: Defines the ringtone manager used to play ringtones
 *    for incoming softphone calls and other media.
 *
 * Authors: Lain Supe (supelee), Yuliang Zhou (yuliangz)
 * Date: Wednesday, June 1st 2016
 */
(function() {
   var global = this;
   var lily = global.lily || {};
   global.lily = lily;

   var RingtoneEngine = function(softphoneParams) {
      var self = this;

      this._prevContactId = null;

      lily.assertNotNull(softphoneParams, "softphoneParams");
      if (! softphoneParams.ringtoneUrl || softphoneParams.ringtoneUrl === "") {
         throw new Error("ringtoneUrl is required!");
      }

      if (global.Audio && typeof global.Promise !== "undefined") {
         this._playableAudioPromise = new Promise(function(resolve, reject) {
            self._audio = new Audio(softphoneParams.ringtoneUrl);
            self._audio.loop = true;
            self._audio.addEventListener("canplay", function(){
               self._audioPlayable = true;
               resolve(self._audio);
            });
         });

      } else {
         this._audio = null;
         lily.getLog().error("Unable to provide a ringtone.");
      }

      // TODO: this should triggers onIncoming instead of onConnecting
      // https://issues.amazon.com/issues/LilyGatekeepers-974
      lily.contact(function(contact) {
         contact.onConnecting(function() {
            if (contact.getType() === lily.ContactType.VOICE &&
               contact.isSoftphoneCall() &&
               contact.isInbound()) {

               self._startRingtone();
               self._prevContactId = contact.getContactId();

               contact.onConnected(lily.hitch(self, self._stopRingtone));
               contact.onAccepted(lily.hitch(self, self._stopRingtone));
               contact.onEnded(lily.hitch(self, self._stopRingtone));
            }
         });
      });
   };

   RingtoneEngine.prototype._startRingtone = function() {
      if (this._audio) {
         this._audio.play();
      }
   };

   RingtoneEngine.prototype._stopRingtone = function() {
      if (this._audio) {
         this._audio.pause();
         this._audio.currentTime = 0;
      }
   };

   /**
    * Stop ringtone.
    */
   RingtoneEngine.prototype.stopRingtone = function() {
      this._stopRingtone();
   };

   /**
    * Change the audio device used to play ringtone.
    * If audio element is not fully initialized, the API will wait _audioPlayablePromise for 3 seconds and fail on timeout.
    * This API is supported only by browsers that implemented ES6 Promise and http://www.w3.org/TR/audio-output/
    * Return a Promise that indicates the result of changing output device.
    */
   RingtoneEngine.prototype.setOutputDevice = function(deviceId) {
      if (this._playableAudioPromise) {
         var playableAudioWithTimeout = Promise.race([
            this._playableAudioPromise,
            new Promise(function(resolve, reject){
               global.setTimeout(function(){reject("Timed out waiting for playable audio");}, 3000/*ms*/);
            })
         ]);
         return playableAudioWithTimeout.then(function(audio){
            if (audio.setSinkId) {
               return Promise.resolve(audio.setSinkId(deviceId));
            } else {
               return Promise.reject("Not supported");
            }
         });

      }

      if (global.Promise) {
         return Promise.reject("Not eligible ringtone owner");
      }
   };

   /* export lily.RingtoneEngine */
   lily.RingtoneEngine = RingtoneEngine;
})();
