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
    this._loadRingtone(this._ringtoneUrl).catch(() => { }); // NEXT TODO: trigger ringtone load failure event
    this._driveRingtone();
  };

  // loading audio is async, but browser can handle audio operation like audio.play() or audio.setSinkId() before load complete
  RingtoneEngineBase.prototype._loadRingtone = function (ringtoneUrl, loop = true) {
    return new Promise((resolve, reject) => {
      if (!ringtoneUrl) {
        reject(Error('ringtoneUrl is required!'));
      }
      this._audio = new Audio(ringtoneUrl);
      this._audio.loop = loop;
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
          connect.getLog().info(`Ringtone Start: Succeeded with ${retries} retries remaining`).withObject({ errorList: errorList, contactId: contact.getContactId() }).sendInternalLogToServer();
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
            await this._loadRingtone(this._ringtoneUrl).catch(() => { }); // move on no matter if it has succeeded or not
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
      self._startRingtone(contact, 2).catch(() => { }); // NEXT TODO: trigger ringtone playback failure event with error type

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

      contact.onAccepted((_contact) => {
        if (_contact.isAutoAcceptEnabled()) {
          connect.ifMaster(connect.MasterTopics.RINGTONE, () => {
            this._stopRingtone();
          });
        }
      });
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


  /**
   * Extends the Base ringtone engine and enables the email ringtone engine.
   * @param {*} ringtoneConfig 
   */
  var EmailRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  EmailRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  EmailRingtoneEngine.prototype.constructor = EmailRingtoneEngine;

  EmailRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === connect.ContactType.EMAIL && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Email Ringtone Connecting", contact);
        connect.getLog().info("Email Ringtone Connecting").sendInternalLogToServer();
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

  QueueCallbackRingtoneEngine.prototype._canStartRingtone = (contact) => {
    if (contact instanceof connect.Contact && contact.getStatus().type === connect.ContactStatusType.INCOMING) {
      return true;
    } else {
      connect.getLog().info("Ringtone Start skipped because the contact is already accepted").sendInternalLogToServer();
      return false;
    }
  };

  QueueCallbackRingtoneEngine.prototype._ringtoneSetup = function (contact) {
    connect.ifMaster(connect.MasterTopics.RINGTONE, () => {
      this._startRingtone(contact, 2).catch(() => {});

      // Stop the ringtone when the contact is accepted
      contact.onAccepted(connect.hitch(this, this._stopRingtone));

      // Stop the ringtone upon every state update just in case.
      // This is also helpful for split CCP model where onAccepted isn't triggered.
      contact.onConnected(connect.hitch(this, this._stopRingtone));
      contact.onEnded(connect.hitch(this, this._stopRingtone));
      contact.onDestroy(connect.hitch(this, this._stopRingtone));

      // To stop ringtone as early as possible for split CCP users,
      // for QCB contacts we can listen to onPending and onConnecting.
      contact.onPending(connect.hitch(this, this._stopRingtone));
      contact.onConnecting(connect.hitch(this, this._stopRingtone));

      // Stop the ringtone when the agent connection turns into CONNECTED or contact status is not INCOMING
      contact.onRefresh((contact) => {
        if (
          contact.getStatus().type !== connect.ContactStatusType.INCOMING  ||  
          contact.getAgentConnection().getStatus().type === connect.ConnectionStateType.CONNECTED
        ) {
          connect.getLog().info("Contact onRefresh - _stopRingtone is invoked").sendInternalLogToServer();
          this._stopRingtone();
        }
      });
    });
  };

  const AutoAcceptedRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };

  AutoAcceptedRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);

  AutoAcceptedRingtoneEngine.prototype.constructor = AutoAcceptedRingtoneEngine;

  AutoAcceptedRingtoneEngine.prototype._canStartRingtone = (contact) => {    
    connect
      .getLog()
      .info('Checking if auto-accept tone can be played')
      .sendInternalLogToServer();

    const { type: contactState } = contact.getState();
    const contactType = contact.getType();

    if (
      (contactState === connect.ContactStatusType.INCOMING && contactType === connect.ContactType.QUEUE_CALLBACK) ||
      (contactState === connect.ContactStatusType.CONNECTING && contactType !== connect.ContactType.QUEUE_CALLBACK)
    ) {
      if (contactType === connect.ContactType.VOICE) {
        connect
          .getLog()
          .info('Skipping auto-accept tone for Voice contacts')
          .withObject({ contactState, contactType })
          .sendInternalLogToServer();
        return false;
      }

      connect
        .getLog()
        .info('Contact is in the expected state')
        .withObject({ contactState, contactType })
        .sendInternalLogToServer();

      const isAutoAcceptEnabled = contact.isAutoAcceptEnabled() ?? false;
      const isInbound = contact.isInbound() ?? false;

      connect
        .getLog()
        .info('Checking if the tone should play')
        .withObject({ isAutoAcceptEnabled, isInbound })
        .sendInternalLogToServer();
      return isAutoAcceptEnabled && isInbound;
    }

    return false;
  };

  AutoAcceptedRingtoneEngine.prototype._loadRingtone = function (ringtoneUrl) {
    return RingtoneEngineBase.prototype._loadRingtone.call(this, ringtoneUrl, false);
  };

  AutoAcceptedRingtoneEngine.prototype._ringtoneSetup = function (contact) {
    connect.ifMaster(connect.MasterTopics.RINGTONE, () => {
      this._startRingtone(contact, 1);
    });
  };

  AutoAcceptedRingtoneEngine.prototype._driveRingtone = function () {
    const onAcceptedContactHandler = (contact) => {
      this._ringtoneSetup(contact);
      this._publishTelemetryEvent('AutoAccept tone Connecting', contact);
      connect.getLog().info('AutoAccept tone Connecting').sendInternalLogToServer();
    };

    const onConnectedContactHandler = (contact) => {
      connect.ifMaster(connect.MasterTopics.RINGTONE, () => {
        if (contact.isAutoAcceptEnabled()) {
          connect
            .getLog()
            .info('Stopping auto accept tone')
            .withObject({ contactId: contact.getContactId() })
            .sendInternalLogToServer();
            this._stopRingtone();
        }
      });
    }

    connect.contact((contact) => {
      contact.onAccepted(onAcceptedContactHandler);
      contact.onConnected(onConnectedContactHandler);
    });
  };

  /* export connect.RingtoneEngine */
  connect.VoiceRingtoneEngine = VoiceRingtoneEngine;
  connect.ChatRingtoneEngine = ChatRingtoneEngine;
  connect.TaskRingtoneEngine = TaskRingtoneEngine;
  connect.QueueCallbackRingtoneEngine = QueueCallbackRingtoneEngine;
  connect.EmailRingtoneEngine = EmailRingtoneEngine;
  connect.AutoAcceptedRingtoneEngine = AutoAcceptedRingtoneEngine;
})();
