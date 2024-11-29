/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this || globalThis;
  var connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  var RingtoneEngineBase = function (ringtoneConfig) {
    connect.assertNotNull(ringtoneConfig, "ringtoneConfig");
    this._audio = null;
    this._deviceId = '';
    this._ringtoneUrl = ringtoneConfig.ringtoneUrl;
    this._loadRingtone(this._ringtoneUrl).catch(() => {}); // NEXT TODO: trigger ringtone load failure event
    this._driveRingtone();
  };

  // loading audio is async, but browser can handle audio operation like audio.play() or audio.setSinkId() before load complete
  RingtoneEngineBase.prototype._loadRingtone = function (ringtoneUrl) {
    return new Promise((resolve, reject) => {
      if (!ringtoneUrl) {
        reject(Error('ringtoneUrl is required!'));
      }
      this._audio = new Audio(ringtoneUrl);
      this._audio.loop = true;
      this.setOutputDevice(this._deviceId); // re-applying deviceId for audio reloading scenario

      // just in case "canplay" doesn't fire at all for some reasons
      const timerId = setTimeout(() => {
        connect.getLog().warn("Ringtone isn't loaded in 1 second but proceeding: ", + ringtoneUrl).sendInternalLogToServer();
        resolve();
      }, 1000);

      this._audio.addEventListener('canplay', () => {
        connect.getLog().info("Ringtone is ready to play: ", + ringtoneUrl).sendInternalLogToServer();
        clearTimeout(timerId);
        resolve();
      });

      this._audio.addEventListener('error', () => {
        connect.getLog().error("Ringtone load error: ", + ringtoneUrl).sendInternalLogToServer();
        clearTimeout(timerId);
        reject(Error('Ringtone load error: ' + ringtoneUrl));
      });
    });
  };

  RingtoneEngineBase.prototype._driveRingtone = function () {
    throw new Error("Not implemented.");
  };

  RingtoneEngineBase.prototype._startRingtone = async function (contact, retries = 0, errorList = []) {
    return new Promise((resolve, reject) => {
      if (!this._audio) reject(Error('No audio object found'));

      // Empty string as sinkId means audio gets sent to the default device
      connect.getLog().info(`Attempting to start ringtone to device ${this._audio.sinkId || "''"}`).sendInternalLogToServer();
    
      this._audio.play()
        .then(() => {
          this._publishTelemetryEvent("Ringtone Start", contact);
          connect.getLog().info(`Ringtone Start: Succeeded with ${retries} retries remaining`).withObject({errorList: errorList, contactId: contact.getContactId()}).sendInternalLogToServer();
          resolve();
        })
        .catch(async (e) => {
          this._publishTelemetryEvent("Ringtone Playback Failure", contact);
          connect.getLog().error(`Ringtone Playback Failure: ${retries} retries remaining.`).withException(e).withObject({
            currentSrc: this._audio.currentSrc,
            sinkId: this._audio.sinkId,
            volume: this._audio.volume,
            contactId: contact.getContactId()
          }).sendInternalLogToServer();
          
          errorList.push(e.toString());
          if (retries > 0) {
            await this._loadRingtone(this._ringtoneUrl).catch(() => {}); // move on no matter if it has succeeded or not
            await this._startRingtone(contact, retries - 1, errorList).then(resolve).catch(() => reject(errorList));
          } else {
            connect.getLog().error("Ringtone Retries Exhausted").withObject({
              errorList,
              contactId: contact.getContactId()
            }).sendInternalLogToServer();
            reject(errorList);
          }
        });
    });
  };

  RingtoneEngineBase.prototype._stopRingtone = function (contact) {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._publishTelemetryEvent("Ringtone Stop", contact);
      connect.getLog().info("Ringtone Stop").sendInternalLogToServer();
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
      self._startRingtone(contact, 2).catch(() => {}); // NEXT TODO: trigger ringtone playback failure event with error type

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
    return new Promise((resolve, reject) => {
      if (this._audio && this._audio.setSinkId) {
        this._audio.setSinkId(deviceId)
          .then(() => {
            this._deviceId = deviceId;
            resolve(deviceId);
          })
          .catch((err) => {
            reject(`RingtoneEngineBase.setOutputDevice failed: audio.setSinkId() failed with error ${err}`);
          });
      } else {
        reject(`RingtoneEngineBase.setOutputDevice failed: ${this._audio ? "audio" : "audio.setSinkId"} not found.`);
      }
    });
  };

  var VoiceRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  VoiceRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  VoiceRingtoneEngine.prototype.constructor = VoiceRingtoneEngine;

  VoiceRingtoneEngine.prototype._driveRingtone = function () {
    const onContactConnect = (contact) => {
      if (contact.getType() === connect.ContactType.VOICE && contact.isSoftphoneCall() && contact.isInbound()) {
        this._ringtoneSetup(contact);
        this._publishTelemetryEvent("Ringtone Connecting", contact);
        connect.getLog().info("Ringtone Connecting").sendInternalLogToServer();
      }
    };

    connect.contact((contact) => {
      contact.onConnecting(onContactConnect);
    });

    // handle the case where there's a contact already in connecting state at initialization
    new connect.Agent().getContacts().forEach((contact) => {
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
        var supervisorConnection = contact.getConnections().filter((conn) => conn.getType() === connect.ConnectionType.AGENT && conn.isSilentMonitor());

        if (supervisorConnection.length === 0) {
          self._ringtoneSetup(contact);
          self._publishTelemetryEvent("Chat Ringtone Connecting", contact);
          connect.getLog().info("Chat Ringtone Connecting").sendInternalLogToServer();
        }
      }
    };

    connect.contact(function (contact) {
      contact.onConnecting(onContactConnect);
    });
  };

  var TaskRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  TaskRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  TaskRingtoneEngine.prototype.constructor = TaskRingtoneEngine;

  TaskRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === lily.ContactType.TASK && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Task Ringtone Connecting", contact);
        connect.getLog().info("Task Ringtone Connecting").sendInternalLogToServer();
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
          connect.getLog().info("Callback Ringtone Connecting").sendInternalLogToServer();
        }
      });
    });
  };

  /* export connect.RingtoneEngine */
  connect.VoiceRingtoneEngine = VoiceRingtoneEngine;
  connect.ChatRingtoneEngine = ChatRingtoneEngine;
  connect.TaskRingtoneEngine = TaskRingtoneEngine;
  connect.QueueCallbackRingtoneEngine = QueueCallbackRingtoneEngine;
})();
