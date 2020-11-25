/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this;
  var connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  var RingtoneEngineBase = function (ringtoneConfig) {
    var self = this;
    this._prevContactId = null;

    connect.assertNotNull(ringtoneConfig, "ringtoneConfig");
    if (!ringtoneConfig.ringtoneUrl) {
      throw new Error("ringtoneUrl is required!");
    }

    if (global.Audio && typeof global.Promise !== "undefined") {
      this._playableAudioPromise = new Promise(function (resolve, reject) {
        self._audio = new Audio(ringtoneConfig.ringtoneUrl);
        self._audio.loop = true;
        self._audio.addEventListener("canplay", function () {
          self._audioPlayable = true;
          resolve(self._audio);
        });
      });

    } else {
      this._audio = null;
      connect.getLog().error("Unable to provide a ringtone.");
    }

    self._driveRingtone();
  };

  RingtoneEngineBase.prototype._driveRingtone = function () {
    throw new Error("Not implemented.");
  };

  RingtoneEngineBase.prototype._startRingtone = function (contact) {
    if (this._audio) {
      this._audio.play()
        .catch(function(e) {
          this._publishTelemetryEvent("Ringtone Playback Failure", contact);
        });
      this._publishTelemetryEvent("Ringtone Start", contact);
    }
  };

  RingtoneEngineBase.prototype._stopRingtone = function (contact) {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._publishTelemetryEvent("Ringtone Stop", contact);
    }
  };

  /**
   * Stop ringtone.
   */
  RingtoneEngineBase.prototype.stopRingtone = function () {
    this._stopRingtone();
  };

  RingtoneEngineBase.prototype._ringtoneSetup = function (contact) {
    var self = this;
    connect.ifMaster(connect.MasterTopics.RINGTONE, function () {
      self._startRingtone(contact);
      self._prevContactId = contact.getContactId();

      contact.onConnected(lily.hitch(self, self._stopRingtone));
      contact.onAccepted(lily.hitch(self, self._stopRingtone));
      contact.onEnded(lily.hitch(self, self._stopRingtone));
      // Just to make sure to stop the ringtone in case of the failures of specific callbacks(onAccepted,onConnected);
      contact.onRefresh(function (contact) {
        if (contact.getStatus().type !== connect.ContactStatusType.CONNECTING &&
          contact.getStatus().type !== connect.ContactStatusType.INCOMING) {
          self._stopRingtone();
        }
      });
    });
  };

  RingtoneEngineBase.prototype._publishTelemetryEvent = function (eventName, contact) {
    if (contact && contact.getContactId()) {
      connect.publishMetric({
        name: eventName,
        contactId: contact.getContactId()
      });
    }
  };

  /**
   * Change the audio device used to play ringtone.
   * If audio element is not fully initialized, the API will wait _audioPlayablePromise for 3 seconds and fail on timeout.
   * This API is supported only by browsers that implemented ES6 Promise and http://www.w3.org/TR/audio-output/
   * Return a Promise that indicates the result of changing output device.
   */
  RingtoneEngineBase.prototype.setOutputDevice = function (deviceId) {
    if (this._playableAudioPromise) {
      var playableAudioWithTimeout = Promise.race([
        this._playableAudioPromise,
        new Promise(function (resolve, reject) {
          global.setTimeout(function () { reject("Timed out waiting for playable audio"); }, 3000/*ms*/);
        })
      ]);
      return playableAudioWithTimeout.then(function (audio) {
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

  var VoiceRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  VoiceRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  VoiceRingtoneEngine.prototype.constructor = VoiceRingtoneEngine;

  VoiceRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === lily.ContactType.VOICE &&
        contact.isSoftphoneCall() && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Ringtone Connecting", contact);
      }
    };

    connect.contact(function (contact) {
      contact.onConnecting(onContactConnect);
    });

    new connect.Agent().getContacts().forEach(function (contact) {
      if (contact.getStatus().type === connect.ContactStatusType.CONNECTING) {
        onContactConnect(contact);
      }
    });
  };


  var ChatRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  ChatRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  ChatRingtoneEngine.prototype.constructor = ChatRingtoneEngine;

  ChatRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === lily.ContactType.CHAT && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Chat Ringtone Connecting", contact);
      }
    };

    connect.contact(function (contact) {
      contact.onConnecting(onContactConnect);
    });
  };

  var QueueCallbackRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  QueueCallbackRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  QueueCallbackRingtoneEngine.prototype.constructor = QueueCallbackRingtoneEngine;

  QueueCallbackRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    connect.contact(function (contact) {
      contact.onIncoming(function () {
        if (contact.getType() === lily.ContactType.QUEUE_CALLBACK) {
          self._ringtoneSetup(contact);
          self._publishTelemetryEvent("Callback Ringtone Connecting", contact);
        }
      });
    });
  };

  /* export connect.RingtoneEngine */
  connect.VoiceRingtoneEngine = VoiceRingtoneEngine;
  connect.ChatRingtoneEngine = ChatRingtoneEngine;
  connect.QueueCallbackRingtoneEngine = QueueCallbackRingtoneEngine;
})();
