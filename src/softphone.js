/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;
  global.ccpVersion = "V2";

  var RTPJobIntervalMs = 1000;
  var statsReportingJobIntervalMs = 30000;
  var streamBufferSize = 500;
  var CallTypeMap = {};
  CallTypeMap[connect.SoftphoneCallType.AUDIO_ONLY] = 'Audio';
  CallTypeMap[connect.SoftphoneCallType.VIDEO_ONLY] = 'Video';
  CallTypeMap[connect.SoftphoneCallType.AUDIO_VIDEO] = 'AudioVideo';
  CallTypeMap[connect.SoftphoneCallType.NONE] = 'None';
  var AUDIO_INPUT = 'audio_input';
  var AUDIO_OUTPUT = 'audio_output';

  var MediaTypeMap = {};
  MediaTypeMap[connect.ContactType.VOICE] = "Voice";
  var UNKNOWN_MEDIA_TYPE = "Unknown";

  var timeSeriesStreamStatsBuffer = [];
  var aggregatedUserAudioStats = {};
  var aggregatedRemoteAudioStats = {};
  var rtpStatsJob = null;
  var reportStatsJob = null;
  //Logger specific to softphone.
  var logger = null;
  var SoftphoneErrorTypes = connect.SoftphoneErrorTypes;
  var HANG_UP_MULTIPLE_SESSIONS_EVENT = "MultiSessionHangUp";
  var MULTIPLE_SESSIONS_EVENT = "MultiSessions";
  var gumLatencies = {};

  var localMediaStream = {};

  var softphoneClientId = connect.randomId();

  var requestIceAccess = function (transport) {
    return new Promise(function (resolve, reject) {
      connect.core.getClient().call(connect.ClientMethods.CREATE_TRANSPORT, transport, {
        success: function (data) {
          resolve(data.softphoneTransport.softphoneMediaConnections);
        },
        failure: function (reason) {
          if (reason.message && reason.message.includes("SoftphoneConnectionLimitBreachedException")) {
            publishError("multiple_softphone_active_sessions", "Number of active sessions are more then allowed limit.", "");
          }
          reject(Error("requestIceAccess failed"));
        },
        authFailure: function () {
          reject(Error("Authentication failed while requestIceAccess"));
        },
        accessDenied: function () {
          reject(Error("Access Denied while requestIceAccess"));
        }
      });
    });
  };

  var SoftphoneManager = function (softphoneParams) {
    var self = this;
    logger = new SoftphoneLogger(connect.getLog());
    logger.info("[Softphone Manager] softphone manager initialization has begun").sendInternalLogToServer();
    var rtcPeerConnectionFactory;
    if (connect.RtcPeerConnectionFactory) {
      rtcPeerConnectionFactory = new connect.RtcPeerConnectionFactory(logger,
        connect.core.getWebSocketManager(),
        softphoneClientId,
        connect.hitch(self, requestIceAccess, {
          transportType: "softphone",
          softphoneClientId: softphoneClientId
        }),
        connect.hitch(self, publishError));
    }
    if (!isBrowserSoftPhoneSupported()) {
      publishError(SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
        "Connect does not support this browser. Some functionality may not work. ",
        "");
    }
    var gumPromise = fetchUserMedia({
      success: function (stream) {
        publishTelemetryEvent("ConnectivityCheckResult", null,
        {
          connectivityCheckType: "MicrophonePermission",
          status: "granted"
        });
        publishTelemetryEvent("GumSucceeded", null, {
          context: "Initializing Softphone Manager"
        }, true);
      },
      failure: function (err) {
        publishError(err, "Your microphone is not enabled in your browser. ", "");
        publishTelemetryEvent("ConnectivityCheckResult", null,
        {
          connectivityCheckType: "MicrophonePermission",
          status: "denied"
        });
        publishTelemetryEvent("GumFailed", null, {
          context: "Initializing Softphone Manager"
        }, true);
      }
    });
    
    handleSoftPhoneMuteToggle();
    handleSpeakerDeviceChange();
    handleMicrophoneDeviceChange();
    monitorMicrophonePermission();

    this.ringtoneEngine = null;
    var rtcSessions = {};
    
    // helper method to provide access to rtc sessions
    this.getSession = function (connectionId) {
      return rtcSessions[connectionId];
    }

    this.replaceLocalMediaTrack = function(connectionId, track) {
      var stream = localMediaStream[connectionId].stream;
      if(stream){
        var oldTrack = stream.getAudioTracks()[0];
        track.enabled = oldTrack.enabled;
        oldTrack.enabled = false;
        stream.removeTrack(oldTrack);
        stream.addTrack(track);
      }
    };

    var isContactTerminated = function (contact) {
      return contact.getStatus().type === connect.ContactStatusType.ENDED ||
        contact.getStatus().type === connect.ContactStatusType.ERROR ||
        contact.getStatus().type === connect.ContactStatusType.MISSED;
    };

    var destroySession = function (agentConnectionId) {
      if (rtcSessions.hasOwnProperty(agentConnectionId)) {
        var session = rtcSessions[agentConnectionId];
        // Currently the assumption is it will throw an exception only and if only it already has been hung up.
        // TODO: Update once the hangup API does not throw exceptions
        new Promise(function (resolve, reject) {
          delete rtcSessions[agentConnectionId];
          session.hangup();
        }).catch(function (err) {
          lily.getLog().warn("Clean up the session locally " + agentConnectionId, err.message).sendInternalLogToServer();
        });
      }
    };

    // When multiple RTC sessions detected, ignore the new call and hang up the previous sessions.
    // TODO: Update when connect-rtc exposes an API to detect session status.
    var sanityCheckActiveSessions = function (rtcSessions) {
      if (Object.keys(rtcSessions).length > 0) {
        // Error! our state doesn't match, tear it all down.
        for (var connectionId in rtcSessions) {
          if (rtcSessions.hasOwnProperty(connectionId)) {
            // Log an error for the session we are about to end.
            publishMultipleSessionsEvent(HANG_UP_MULTIPLE_SESSIONS_EVENT, rtcSessions[connectionId].callId, connectionId);
            destroySession(connectionId);
          }
        }
        throw new Error("duplicate session detected, refusing to setup new connection");
      }
    };

    this.startSession = function (contact, agentConnectionId, userMediaStream, callbacks) {
      if (!contact || !agentConnectionId) {
        throw Error('Missing contact or agentConnectionId');
      }
      
      logger.info("Softphone call detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId).sendInternalLogToServer();

      // Ensure our session state matches our contact state to prevent issues should we lose track of a contact.
      sanityCheckActiveSessions(rtcSessions);

      if (contact.getStatus().type === connect.ContactStatusType.CONNECTING) {
        publishTelemetryEvent("Softphone Connecting", contact.getContactId());
      }

      initializeParams();
      var softphoneInfo = contact.getAgentConnection().getSoftphoneMediaInfo();
      var callConfig = parseCallConfig(softphoneInfo.callConfigJson);
      var webSocketProvider;
      if (callConfig.useWebSocketProvider) {
        webSocketProvider = connect.core.getWebSocketManager();
      }
      var session = new connect.RTCSession(
        callConfig.signalingEndpoint,
        callConfig.iceServers,
        softphoneInfo.callContextToken,
        logger,
        contact.getContactId(),
        agentConnectionId,
        webSocketProvider);

      rtcSessions[agentConnectionId] = session;

      if (userMediaStream) {
        logger.info('[Softphone Manager] Setting custom user media stream').withObject(userMediaStream).sendInternalLogToServer();
        publishTelemetryEvent("CreatingRTCSession", contact.getContactId(), {
          mediaStreamActive: userMediaStream.active
        }, true);
        session.mediaStream = userMediaStream;
      }

      // Custom Event to indicate the session init operations
      connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
        event: connect.ConnectionEvents.SESSION_INIT,
        data: {
          connectionId: agentConnectionId
        }
      });

      session.onSessionFailed = function (rtcSession, reason) {
        if (callbacks && callbacks.onSessionFailed) {
          callbacks.onSessionFailed();
        }
        delete rtcSessions[agentConnectionId];
        publishSoftphoneFailureLogs(rtcSession, reason);
        publishSessionFailureTelemetryEvent(contact.getContactId(), reason);
        stopJobsAndReport(contact, rtcSession.sessionReport);
      };
      session.onSessionConnected = function (rtcSession) {
        publishTelemetryEvent("Softphone Session Connected", contact.getContactId());
        // Become master to send logs, since we need logs from softphone tab.
        connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
        //start stats collection and reporting jobs
        startStatsCollectionJob(rtcSession);
        startStatsReportingJob(contact);
        fireContactAcceptedEvent(contact);
      };

      session.onSessionCompleted = function (rtcSession) {
        if (callbacks && callbacks.onSessionCompleted) {
          callbacks.onSessionCompleted();
        }
        publishTelemetryEvent("Softphone Session Completed", contact.getContactId());

        delete rtcSessions[agentConnectionId];
        // Stop all jobs and perform one last job.
        stopJobsAndReport(contact, rtcSession.sessionReport);

        // Cleanup the cached streams
        deleteLocalMediaStream(agentConnectionId);
      };

      session.onLocalStreamAdded = function (rtcSession, stream) {
        // Cache the streams for mute/unmute
        localMediaStream[agentConnectionId] = {
          stream: stream
        };
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
          event: connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED,
          data: {
            connectionId: agentConnectionId
          }
        });
      };

      session.remoteAudioElement = document.getElementById('remote-audio');
      if (rtcPeerConnectionFactory) {
        session.connect(rtcPeerConnectionFactory.get(callConfig.iceServers));
        publishTelemetryEvent("session.connect called", contact.getContactId(), {
          context: "PeerConnectionFactory"
        }, true);
      } else {
        session.connect();
        publishTelemetryEvent("session.connect called", contact.getContactId(), {
          context: "No PeerConnectionFactory"
        }, true);
      }
    }

    var onRefreshContact = function (contact, agentConnectionId) {
      if (rtcSessions[agentConnectionId] && isContactTerminated(contact)) {
        destroySession(agentConnectionId);
      }
    };

    var onInitContact = function (contact) {
      var agentConnectionId = contact.getAgentConnection().connectionId;
      logger.info("Contact detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId).sendInternalLogToServer();
      gumLatencies['ContactDetected'] = getPerformanceTime();
      gumLatencies['previousStep'] = "ContactDetected";
      gumLatencies['contactId'] = contact.getContactId();

      contact.onRefresh(function () {
        onRefreshContact(contact, agentConnectionId);
      });
    };

    const onInitContactSub = connect.contact(onInitContact);

    // Contact already in connecting state scenario - In this case contact INIT is missed hence the OnRefresh callback is missed. 
    new connect.Agent().getContacts().forEach(function (contact) {
      var agentConnectionId = contact.getAgentConnection().connectionId;
      logger.info("Contact exist in the snapshot. Reinitiate the Contact and RTC session creation for contactId" + contact.getContactId(), "agent connectionId " + agentConnectionId)
        .sendInternalLogToServer();
      onInitContact(contact);
      onRefreshContact(contact, agentConnectionId);
    });

    this.terminate = () => {
      onInitContactSub.unsubscribe();
      if (rtcPeerConnectionFactory.clearIdleRtcPeerConnectionTimerId) {
        // This method needs to be called when destroying the softphone manager instance. 
        // Otherwise the refresh loop in rtcPeerConnectionFactory will keep spawning WebRTCConnections every 60 seconds
        // and you will eventually get SoftphoneConnectionLimitBreachedException later.
        rtcPeerConnectionFactory.clearIdleRtcPeerConnectionTimerId();
      }
      delete rtcPeerConnectionFactory;
    };
  };

  var fireContactAcceptedEvent = function (contact) {
    var conduit = connect.core.getUpstream();
    var agentConnection = contact.getAgentConnection();
    if (!agentConnection) {
      logger.info("Not able to retrieve the auto-accept setting from null AgentConnection, ignoring event publish..").sendInternalLogToServer();
      return;
    }
    var softphoneMediaInfo = agentConnection.getSoftphoneMediaInfo();
    if (!softphoneMediaInfo) {
      logger.info("Not able to retrieve the auto-accept setting from null SoftphoneMediaInfo, ignoring event publish..").sendInternalLogToServer();
      return;
    }
    if (softphoneMediaInfo.autoAccept === true) {
      logger.info("Auto-accept is enabled, sending out Accepted event to stop ringtone..").sendInternalLogToServer();
      conduit.sendUpstream(connect.EventType.BROADCAST, {
        event: connect.ContactEvents.ACCEPTED,
        data: new connect.Contact(contact.contactId)
      });
      conduit.sendUpstream(connect.EventType.BROADCAST, {
        event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contact.contactId),
        data: new connect.Contact(contact.contactId)
      });
    } else {
      logger.info("Auto-accept is disabled, ringtone will be stopped by user action.").sendInternalLogToServer();
    }
  };

  // Bind events for mute
  var handleSoftPhoneMuteToggle = function () {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.EventType.MUTE, muteToggle);
  };

  var handleSpeakerDeviceChange = function() {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, setSpeakerDevice);
  }

  var handleMicrophoneDeviceChange = function () {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, setMicrophoneDevice);
  }

  var monitorMicrophonePermission = function () {
    try {
      if (connect.isChromeBrowser() && connect.getChromeBrowserVersion() > 43){
        navigator.permissions.query({name: 'microphone'})
        .then(function(permissionStatus){
          permissionStatus.onchange = function(){
            logger.info("Microphone Permission: " + permissionStatus.state);
            publishTelemetryEvent("ConnectivityCheckResult", null, 
            {
              connectivityCheckType: "MicrophonePermission",
              status: permissionStatus.state
            });
            if(permissionStatus.state === 'denied'){
              publishError(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
                "Your microphone is not enabled in your browser. ",
                "");
            }
          }
        })
      }
    } catch (e) {
      logger.error("Failed in detecting microphone permission status: " + e);
    }
  }

  // Make sure once we disconnected we get the mute state back to normal
  var deleteLocalMediaStream = function (connectionId) {
    delete localMediaStream[connectionId];
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.AgentEvents.MUTE_TOGGLE,
      data: { muted: false }
    });
  };

  // Check for the local streams if exists  -  revert it
  // And inform other clients about the change 
  var muteToggle = function (data) {
    var status;
    if (connect.keys(localMediaStream).length === 0) {
      return;
    }

    if (data && data.mute !== undefined) {
      status = data.mute;
    }

    for (var connectionId in localMediaStream) {
      if (localMediaStream.hasOwnProperty(connectionId)) {
        var localMedia = localMediaStream[connectionId].stream;
        if (localMedia) {
          var audioTracks = localMedia.getAudioTracks()[0];
          if (status !== undefined) {
            audioTracks.enabled = !status;
            localMediaStream[connectionId].muted = status;

            if (status) {
              logger.info("Agent has muted the contact, connectionId -  " + connectionId).sendInternalLogToServer();
            } else {
              logger.info("Agent has unmuted the contact, connectionId - " + connectionId).sendInternalLogToServer();
            }

          } else {
            status = localMediaStream[connectionId].muted || false;
          }
        }
      }
    }

    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.AgentEvents.MUTE_TOGGLE,
      data: { muted: status }
    });
  };

  var setSpeakerDevice = function (data) {
    if (connect.keys(localMediaStream).length === 0 || !data || !data.deviceId) {
      return;
    }
    var deviceId = data.deviceId;
    var remoteAudioElement = document.getElementById('remote-audio');
    try {
      logger.info("Trying to set speaker to device " + deviceId);
      if (remoteAudioElement && typeof remoteAudioElement.setSinkId === 'function') {
        remoteAudioElement.setSinkId(deviceId);
      }
    } catch (e) {
      logger.error("Failed to set speaker to device " + deviceId);
    }

    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
      data: { deviceId: deviceId }
    });
  }

  var setMicrophoneDevice = function (data) {
    if (connect.keys(localMediaStream).length === 0  || !data || !data.deviceId) {
      return;
    }
    var deviceId = data.deviceId;
    var softphoneManager = connect.core.getSoftphoneManager();
    try {
      navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } })
        .then(function (newMicrophoneStream) {
          var newMicrophoneTrack = newMicrophoneStream.getAudioTracks()[0];
          for (var connectionId in localMediaStream) {
            if (localMediaStream.hasOwnProperty(connectionId)) {
              var localMedia = localMediaStream[connectionId].stream;
              var session = softphoneManager.getSession(connectionId);
              //Replace the audio track in the RtcPeerConnection
              session._pc.getSenders()[0].replaceTrack(newMicrophoneTrack).then(function () {
                //Replace the audio track in the local media stream (for mute / unmute)
                softphoneManager.replaceLocalMediaTrack(connectionId, newMicrophoneTrack);
              });
            }
          }
        });
    } catch(e) {
      logger.error("Failed to set microphone device " + deviceId);
    }

    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED,
      data: { deviceId: deviceId }
    });
  }

  var publishSoftphoneFailureLogs = function (rtcSession, reason) {
    if (reason === connect.RTCErrors.ICE_COLLECTION_TIMEOUT) {
      var endPointUrl = "\n";
      for (var i = 0; i < rtcSession._iceServers.length; i++) {
        for (var j = 0; j < rtcSession._iceServers[i].urls.length; j++) {
          endPointUrl = endPointUrl + rtcSession._iceServers[i].urls[j] + "\n";
        }
      }
      publishError(SoftphoneErrorTypes.ICE_COLLECTION_TIMEOUT, "Ice collection timedout. ", endPointUrl);
    } else if (reason === connect.RTCErrors.USER_BUSY) {
      publishError(SoftphoneErrorTypes.USER_BUSY_ERROR,
        "Softphone call UserBusy error. ",
        "");
    } else if (reason === connect.RTCErrors.SIGNALLING_HANDSHAKE_FAILURE) {
      publishError(SoftphoneErrorTypes.SIGNALLING_HANDSHAKE_FAILURE,
        "Handshaking with Signalling Server " + rtcSession._signalingUri + " failed. ",
        rtcSession._signalingUri);
    } else if (reason === connect.RTCErrors.GUM_TIMEOUT_FAILURE || reason === connect.RTCErrors.GUM_OTHER_FAILURE) {
      publishError(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
        "Your microphone is not enabled in your browser. ",
        "");
    } else if (reason === connect.RTCErrors.SIGNALLING_CONNECTION_FAILURE) {
      publishError(SoftphoneErrorTypes.SIGNALLING_CONNECTION_FAILURE,
        "URL " + rtcSession._signalingUri + " cannot be reached. ",
        rtcSession._signalingUri);
    } else if (reason === connect.RTCErrors.CALL_NOT_FOUND) {
      // No need to publish any softphone error for this case. CCP UX will handle this case.
      logger.error("Softphone call failed due to CallNotFoundException.").sendInternalLogToServer();
    } else {
      publishError(SoftphoneErrorTypes.WEBRTC_ERROR,
        "webrtc system error. ",
        "");
    }
  };

  /** Parse the JSON encoded web call config into the data it represents. */
  var parseCallConfig = function (serializedConfig) {
    // Our underscore is too old for unescape
    // https://issues.amazon.com/issues/CSWF-1467
    var decodedJSON = serializedConfig.replace(/&quot;/g, '"');
    return JSON.parse(decodedJSON);
  };

  var fetchUserMedia = function (callbacksIn) {
    var callbacks = callbacksIn || {};
    callbacks.success = callbacks.success || function () { };
    callbacks.failure = callbacks.failure || function () { };

    var CONSTRAINT = {
      audio: true
    };

    var promise = null;

    if (typeof Promise !== "function") {
      callbacks.failure(SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
      return;
    }

    if (typeof navigator.mediaDevices === "object" && typeof navigator.mediaDevices.getUserMedia === "function") {
      promise = navigator.mediaDevices.getUserMedia(CONSTRAINT);
      publishTelemetryEvent("GumCalled", null, {
        isWebkit: false
      }, true);
    } else if (typeof navigator.webkitGetUserMedia === "function") {
      promise = new Promise(function (resolve, reject) {
        navigator.webkitGetUserMedia(CONSTRAINT, resolve, reject);
      });
      publishTelemetryEvent("GumCalled", null, {
        isWebkit: true
      }, true);

    } else {
      callbacks.failure(SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
      return;
    }

    promise.then(function (stream) {
      var audioTracks = stream.getAudioTracks();
      if (audioTracks && audioTracks.length > 0) {
        callbacks.success(stream);
      } else {
        callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
      }
    }, function (err) {
      callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
    });
    return promise;
  };

  var publishError = function (errorType, message, endPointUrl) {
    logger.error("Softphone error occurred : ", errorType,
      message || "").sendInternalLogToServer();

    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.AgentEvents.SOFTPHONE_ERROR,
      data: new connect.SoftphoneError(errorType, message, endPointUrl)
    });
  };

  var publishSessionFailureTelemetryEvent = function (contactId, reason) {
    publishTelemetryEvent("Softphone Session Failed", contactId, {
      failedReason: reason
    });
  };

  var getPerformanceTime = function () {
    try {
      return performance.now();
    } catch(e) {
      logger.error(e.message);
      return 0;
    }
  }

  var publishTelemetryEvent = function (eventName, contactId, data, isGum=false) {
    try {
      if(isGum) {
        const currentPerformanceTime = getPerformanceTime();
        data['tabId'] = connect.core.tabId || '';
        data['previousStep'] = gumLatencies['previousStep'] || '';
        data['tabInFocus'] = gumLatencies['AlreadyMaster'] ? document.hasFocus() : gumLatencies['TabInFocus'];
        if(gumLatencies['previousStep'] && gumLatencies[gumLatencies['previousStep']]) data['latency'] = currentPerformanceTime - gumLatencies[gumLatencies['previousStep']];
        gumLatencies['previousStep'] = eventName;
        gumLatencies[eventName] = currentPerformanceTime;
        contactId = gumLatencies['contactId'] || null;
      }
      connect.publishMetric({
        name: eventName,
        contactId: contactId,
        data: data
      });
    } catch(e) {
      connect.getLog().error("Error Creating Metric: " + e.message).sendInternalLogToServer();
    }
  };

  // Publish the contact and agent information in a multiple sessions scenarios
  var publishMultipleSessionsEvent = function (eventName, contactId, agentConnectionId) {
    publishTelemetryEvent(eventName, contactId, [{
      name: "AgentConnectionId",
      value: agentConnectionId
    }]);
    logger.info("Publish multiple session error metrics", eventName, "contactId " + contactId, "agent connectionId " + agentConnectionId)
      .sendInternalLogToServer();
  };

  var isBrowserSoftPhoneSupported = function () {
    // In Opera, the true version is after "Opera" or after "Version"
    if (connect.isOperaBrowser() && connect.getOperaBrowserVersion() > 17) {
      return true;
    }
    // In Chrome, the true version is after "Chrome"
    else if (connect.isChromeBrowser() && connect.getChromeBrowserVersion() > 22) {
      return true;
    }
    // In Firefox, the true version is after "Firefox"
    else if (connect.isFirefoxBrowser() && connect.getFirefoxBrowserVersion() > 21) {
      return true;
    } else {
      return false;
    }
  };

  var sendSoftphoneMetrics = function (contact) {
    var streamStats = timeSeriesStreamStatsBuffer.slice();
    timeSeriesStreamStatsBuffer = [];
    if (streamStats.length > 0) {
      contact.sendSoftphoneMetrics(streamStats, {
        success: function () {
          logger.info("sendSoftphoneMetrics success" + JSON.stringify(streamStats))
            .sendInternalLogToServer();
        },
        failure: function (data) {
          logger.error("sendSoftphoneMetrics failed.")
            .withObject(data)
            .sendInternalLogToServer();
        }
      });
    }
  };

  var sendSoftphoneReport = function (contact, report, userAudioStats, remoteAudioStats) {
    report.streamStats = [addStreamTypeToStats(userAudioStats, AUDIO_INPUT),
    addStreamTypeToStats(remoteAudioStats, AUDIO_OUTPUT)];
    var callReport = {
      callStartTime: report.sessionStartTime,
      callEndTime: report.sessionEndTime,
      gumTimeMillis: report.gumTimeMillis,
      initializationTimeMillis: report.initializationTimeMillis,
      iceCollectionTimeMillis: report.iceCollectionTimeMillis,
      signallingConnectTimeMillis: report.signallingConnectTimeMillis,
      handshakingTimeMillis: report.handshakingTimeMillis,
      preTalkingTimeMillis: report.preTalkingTimeMillis,
      talkingTimeMillis: report.talkingTimeMillis,
      cleanupTimeMillis: report.cleanupTimeMillis,
      iceCollectionFailure: report.iceCollectionFailure,
      signallingConnectionFailure: report.signallingConnectionFailure,
      handshakingFailure: report.handshakingFailure,
      gumOtherFailure: report.gumOtherFailure,
      gumTimeoutFailure: report.gumTimeoutFailure,
      createOfferFailure: report.createOfferFailure,
      setLocalDescriptionFailure: report.setLocalDescriptionFailure,
      userBusyFailure: report.userBusyFailure,
      invalidRemoteSDPFailure: report.invalidRemoteSDPFailure,
      noRemoteIceCandidateFailure: report.noRemoteIceCandidateFailure,
      setRemoteDescriptionFailure: report.setRemoteDescriptionFailure,
      softphoneStreamStatistics: report.streamStats
    };
    contact.sendSoftphoneReport(callReport, {
      success: function () {
        logger.info("sendSoftphoneReport success" + JSON.stringify(callReport))
          .sendInternalLogToServer();
      },
      failure: function (data) {
        logger.error("sendSoftphoneReport failed.")
          .withObject(data)
          .sendInternalLogToServer();
      }
    });
  };

  var startStatsCollectionJob = function (rtcSession) {
    rtpStatsJob = window.setInterval(function () {
      rtcSession.getUserAudioStats().then(function (stats) {
        var previousUserStats = aggregatedUserAudioStats;
        aggregatedUserAudioStats = stats;
        timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedUserAudioStats, previousUserStats, AUDIO_INPUT));
      }, function (error) {
        logger.debug("Failed to get user audio stats.", error).sendInternalLogToServer();
      });
      rtcSession.getRemoteAudioStats().then(function (stats) {
        var previousRemoteStats = aggregatedRemoteAudioStats;
        aggregatedRemoteAudioStats = stats;
        timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT));
      }, function (error) {
        logger.debug("Failed to get remote audio stats.", error).sendInternalLogToServer();
      });
    }, 1000);
  };

  var startStatsReportingJob = function (contact) {
    reportStatsJob = window.setInterval(function () {
      sendSoftphoneMetrics(contact);
    }, statsReportingJobIntervalMs);
  };

  var initializeParams = function () {
    aggregatedUserAudioStats = null;
    aggregatedRemoteAudioStats = null;
    timeSeriesStreamStatsBuffer = [];
    rtpStatsJob = null;
    reportStatsJob = null;
  };

  var getTimeSeriesStats = function (currentStats, previousStats, streamType) {
    if (previousStats && currentStats) {
      var packetsLost = currentStats.packetsLost > previousStats.packetsLost ? currentStats.packetsLost - previousStats.packetsLost : 0;
      var packetsCount = currentStats.packetsCount > previousStats.packetsCount ? currentStats.packetsCount - previousStats.packetsCount : 0;
      return new RTPStreamStats(currentStats.timestamp,
        packetsLost,
        packetsCount,
        streamType,
        currentStats.audioLevel,
        currentStats.jbMilliseconds,
        currentStats.rttMilliseconds);
    } else {
      return new RTPStreamStats(currentStats.timestamp,
        currentStats.packetsLost,
        currentStats.packetsCount,
        streamType,
        currentStats.audioLevel,
        currentStats.jbMilliseconds,
        currentStats.rttMilliseconds);
    }
  };

  var stopJob = function (task) {
    if (task !== null) {
      window.clearInterval(task);
    }
    return null;
  };

  var stopJobsAndReport = function (contact, sessionReport) {
    rtpStatsJob = stopJob(rtpStatsJob);
    reportStatsJob = stopJob(reportStatsJob);
    sendSoftphoneReport(contact, sessionReport, addStreamTypeToStats(aggregatedUserAudioStats, AUDIO_INPUT), addStreamTypeToStats(aggregatedRemoteAudioStats, AUDIO_OUTPUT));
    sendSoftphoneMetrics(contact);
  };

  /**
  *   Adding streamtype parameter on top of RTCJS RTStats object.
  */
  var RTPStreamStats = function (timestamp, packetsLost, packetsCount, streamType, audioLevel, jitterBufferMillis, roundTripTimeMillis) {
    this.softphoneStreamType = streamType;
    this.timestamp = timestamp;
    this.packetsLost = packetsLost;
    this.packetsCount = packetsCount;
    this.audioLevel = audioLevel;
    this.jitterBufferMillis = jitterBufferMillis;
    this.roundTripTimeMillis = roundTripTimeMillis;
  };

  var addStreamTypeToStats = function (stats, streamType) {
    stats = stats || {};
    return new RTPStreamStats(stats.timestamp, stats.packetsLost, stats.packetsCount, streamType, stats.audioLevel);
  };

  var SoftphoneLogger = function (logger) {
    this._originalLogger = logger;
    var self = this;
    this._tee = function (level, method) {
      return function () {
        // call the original logger object to output to browser
        //Connect logger follows %s format to print objects to console.
        var args = Array.prototype.slice.call(arguments[0]);
        var format = "";
        args.forEach(function () {
          format = format + " %s";
        });
        return method.apply(self._originalLogger, [connect.LogComponent.SOFTPHONE, format].concat(args));
      };
    };
  };

  SoftphoneLogger.prototype.debug = function () {
    return this._tee(1, this._originalLogger.debug)(arguments);
  };
  SoftphoneLogger.prototype.info = function () {
    return this._tee(2, this._originalLogger.info)(arguments);
  };
  SoftphoneLogger.prototype.log = function () {
    return this._tee(3, this._originalLogger.log)(arguments);
  };
  SoftphoneLogger.prototype.warn = function () {
    return this._tee(4, this._originalLogger.warn)(arguments);
  };
  SoftphoneLogger.prototype.error = function () {
    return this._tee(5, this._originalLogger.error)(arguments);
  };

  // TODO:
  // - integrate competeForMasterOnAgentUpdate logic defined in core.js into this class
  // - add error handling and ensure the error handling to be consistent with how RtcJS handles them
  // - add CSM
  class SoftphoneMasterCoordinator {
    constructor(softphoneParams = {}) {
      this.canCompeteForMaster = connect.isFramed() ? softphoneParams.allowFramedSoftphone : true;
      this.softphoneParams = softphoneParams;
      this.userMediaStream = null;
      this.targetContact = null;
      this.gumTimeoutId = null;
      this.tabFocusIntervalId = null;
      this.tabFocusTimeoutId = null;
      this.callsDetected = {};

      this.bindMethods();
      if (this.canCompeteForMaster) {
        this.setUpListenerForNewSoftphoneContact();
        this.setUpListenerForTakeOverEvent();
      }
    }
    bindMethods() {
      this.setUserMediaStream = this.setUserMediaStream.bind(this);
      this.startSoftphoneSession = this.startSoftphoneSession.bind(this);
      this.getUserMedia = this.getUserMedia.bind(this);
      this.takeOverSoftphoneMaster = this.takeOverSoftphoneMaster.bind(this);
      this.cleanup = this.cleanup.bind(this);
    }
    setUpListenerForNewSoftphoneContact() {
      // The reason why we need to use contact.onRefresh to detect a new softphone call is 
      // to support QCB contacts. A QCB contact is first routed as incoming state without 
      // softphoneMediaInfo populated (which makes isSoftphoneCall() to return false), 
      // and it's populated only after the contact state turns to connecting state.
      const self = this;

      const onRefreshContact = function (contact, agentConnectionId) {
        if (contact.isSoftphoneCall() && !self.callsDetected[agentConnectionId] && (
          contact.getStatus().type === connect.ContactStatusType.CONNECTING ||
          contact.getStatus().type === connect.ContactStatusType.INCOMING)) {
            self.addDetectedCall(agentConnectionId);
            self.setTargetContact(contact);
            self.competeForNextSoftphoneMaster();
        }
      };
  
      const onInitContact = function (contact) {
        const agentConnectionId = contact.getAgentConnection().connectionId;
        gumLatencies['ContactDetected'] = getPerformanceTime();
        gumLatencies['previousStep'] = "ContactDetected";
        gumLatencies['contactId'] = contact.getContactId();

        if (!self.callsDetected[agentConnectionId]) {
          contact.onRefresh(() => onRefreshContact(contact, agentConnectionId));
        }
      };

      connect.contact(onInitContact);
    }
    setUpListenerForTakeOverEvent() {
      const self = this;
      connect.core.getUpstream().onUpstream(connect.EventType.MASTER_RESPONSE, (res) => {
        const data = res ? res.data : null;
        if (!data) return;
        const { topic, takeOver, masterId } = data;
        const isTakenOverByOthers = takeOver && (masterId !== connect.core.portStreamId);
        
        if (topic === connect.MasterTopics.SOFTPHONE && isTakenOverByOthers) {
          self.terminateSoftphoneManager();
        }
      });
    }
    setUserMediaStream(stream) {
      connect.assertNotNull(stream, 'UserMediaStream');
      publishTelemetryEvent("GumSucceeded", this.targetContact, {}, true);
      this.userMediaStream = stream;
    }
    setTargetContact(contact) {
      const self = this;
      connect.assertNotNull(contact, 'Contact');
      if (!contact) return;
      if (self.targetContact && self.targetContact.contactId === contact.contactId) {
        // For an edge case where setTargetContact is called twice for an contact (i.e. gum failed due to mic permission),
        // avoid duplicately add event listeners to the same contact
        return;
      }
      self.targetContact = contact;
      self.targetContact._hasBeenAccepted = false;

      contact.onAccepted((_contact) => {
        self.targetContact._hasBeenAccepted = true;
      });

      contact.onMissed((_contact) => {
        connect.ifMaster(connect.MasterTopics.SEND_LOGS, () => {
          const softphoneMediaInfo = _contact.getAgentConnection().getSoftphoneMediaInfo();
          connect.core.getUpstream().sendUpstream(connect.EventType.REPORT_MISSED_CALL_INFO, {
            contactId: self.targetContact.contactId,
            autoAcceptEnabled: softphoneMediaInfo && softphoneMediaInfo.autoAccept,
            contactHasBeenAccepted: self.targetContact._hasBeenAccepted
          });
        });
      });

      contact.onDestroy((_contact) => {
        // reset targetContact here, not in cleanup() because we want to use them in contact.onMissed()
        self.targetContact = null;
      });
    }
    competeForNextSoftphoneMaster() {
      const self = this;
      connect.ifMaster(connect.MasterTopics.SOFTPHONE, () => {
        gumLatencies["AlreadyMaster"] = true;
        // If this is the master tab, immediately call getUserMedia to accomodate the case where UserMediaCaptureOnFocus is NOT enabled.
        // It could happen either when Google hasn't rolled out the feature or customer manually disables it with a feature flag)
        self.getUserMedia()
          .then(self.setUserMediaStream)
          .then(self.becomeNextSoftphoneMasterIfNone)
          .then(self.startSoftphoneSession)
          .catch(self.handleErrorInCompeteForNextSoftphoneMaster)
          .finally(self.cleanup)

        // For troubleshooting/metrics purpose, check if this master tab has got a focus.
        self.pollForTabFocus()
          .then(() => {})
          .catch(() => {});
      }, () => {
        // If this is not the master tab, pending calling getUserMedia until the tab gets focused
        // in order to avoid unnecessary master tab switch between tabs in case UserMediaCaptureOnFocus is NOT enabled
        self.pollForTabFocus()
          .then(self.getUserMedia)
          .then(self.setUserMediaStream)
          .then(self.becomeNextSoftphoneMasterIfNone)
          .then(self.takeOverSoftphoneMaster)
          .then(self.startSoftphoneSession)
          .catch(self.handleErrorInCompeteForNextSoftphoneMaster)
          .finally(self.cleanup)
      }, true);
    }
    // TODO:
    // - integrate with the existing fetchUserMedia and refactor (follow-up task)
    // - device configuration (follow-up task)
    getUserMedia() {
      const self = this;
      const gumTimeoutPromise = new Promise((resolve, reject) => {
        self.gumTimeoutId = setTimeout(() => {
          reject(Error(SoftphoneMasterCoordinator.errorTypes.GUM_TIMEOUT));
        }, SoftphoneMasterCoordinator.GUM_TIMEOUT);
      });

      const constraint = { audio: true };
      const gumPromise = navigator.mediaDevices.getUserMedia(constraint);
      publishTelemetryEvent("GumCalled", this.targetContact, {
        isWebkit: false
      }, true);
      return Promise.race([gumTimeoutPromise, self.checkIfContactIsInConnectingState(self.targetContact), gumPromise]);
    }
    pollForTabFocus() {
      const self = this;
      
      const tabFocusPromise = new Promise((resolve, reject) => {
        self.tabFocusIntervalId = setInterval(() => {
          gumLatencies['TabInFocus'] = false;
          if (document.hasFocus()) {
            clearInterval(self.tabFocusIntervalId);
            clearTimeout(self.tabFocusTimeoutId);
            gumLatencies['TabInFocus'] = true;
            
            connect.core.getUpstream().sendUpstream(connect.EventType.TAB_FOCUSED_WHILE_SOFTPHONE_CONTACT_CONNECTING, {
              tabId: connect.core.tabId
            });
            resolve();
          }
        }, SoftphoneMasterCoordinator.TAB_FOCUS_POLLING_INTERVAL);

        self.tabFocusTimeoutId = setTimeout(() => {
          reject(Error(SoftphoneMasterCoordinator.errorTypes.TAB_FOCUS_TIMEOUT));
        }, SoftphoneMasterCoordinator.TAB_FOCUS_TIMEOUT);
      });

      return Promise.race([self.checkIfContactIsInConnectingState(self.targetContact), tabFocusPromise]);
    }
    checkIfContactIsInConnectingState(contact) {
      return new Promise((resolve, reject) => {
        rejectIfContactIsNoLongerInConnectingState(contact);
        contact.onRefresh(rejectIfContactIsNoLongerInConnectingState);
        function rejectIfContactIsNoLongerInConnectingState(_c) {
          if (_c.getStatus().type !== connect.ContactStatusType.CONNECTING) {
            reject(Error(SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING));
          }
        }
      });
    }
    becomeNextSoftphoneMasterIfNone() {
      return new Promise((resolve, reject) => {
        connect.ifMaster(connect.MasterTopics.NEXT_SOFTPHONE, () => {
          publishTelemetryEvent("Became NEXT_SOFTPHONE master", null, {}, true);
          resolve();
        }, () => {
          reject(Error(SoftphoneMasterCoordinator.errorTypes.NEXT_SOFTPHONE_MASTER_ALREADY_EXISTS));
        });
      });
    }
    takeOverSoftphoneMaster() {
      const self = this;
      return new Promise((resolve, reject) => {
        connect.becomeMaster(connect.MasterTopics.SOFTPHONE, () => {
          connect.agent((agent) => {
            if (!agent.isSoftphoneEnabled()) {
              reject(Error(SoftphoneMasterCoordinator.errorTypes.SOFTPHONE_NOT_ENABLED));
            } else {
              publishTelemetryEvent("BecameSoftphoneMaster", this.targetContact, {}, true);
              try { self.createSoftphoneManager() } catch (e) { reject(e) }
              resolve(); 
            }
          });
        });
      });
    }
    startSoftphoneSession() {
      const self = this;
      
      return new Promise((resolve, reject) => {
        if (connect.core.softphoneManager) {
          if (self.isMediaStreamValid(self.userMediaStream)) {
            try {
              const agentConnectionId = self.targetContact.getAgentConnection().connectionId;
              const onSessionFailed = () => resolve();
              const onSessionCompleted = () => resolve();
              connect.core.softphoneManager.startSession(self.targetContact, agentConnectionId, self.userMediaStream, { onSessionFailed, onSessionCompleted });
            } catch (e) {
              reject(Error(SoftphoneMasterCoordinator.errorTypes.START_SESSION_FAILED));
            }
          } else {
            reject(Error(SoftphoneMasterCoordinator.errorTypes.INVALID_MEDIA_STREAM));
          }
        } else {
          reject(Error(SoftphoneMasterCoordinator.errorTypes.NO_SOFTPHONE_MANAGER));
        }
      });
    }
    isMediaStreamValid(mediaStream) {
      return mediaStream && mediaStream.active;
    }
    handleErrorInCompeteForNextSoftphoneMaster(error = {}) {
      var validError = false;
      switch(error.message) {
        case SoftphoneMasterCoordinator.errorTypes.GUM_TIMEOUT:
        case SoftphoneMasterCoordinator.errorTypes.TAB_FOCUS_TIMEOUT:
          // Valid case.
          // There shouldn't be major scenarios to get these errors because 
          // the contact state turns to missed state before these errors are triggered.
          // One possible scenario is when agent fails to focus the page within 20 seconds
          // for a manager-listen-in contact whose limit is longer than turning to missed state.
          break;
        case SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING:
          // Valid case. No longer need to compete for NextSoftphoneMaster
          // because contact has already been ended/missed or connected by a different tab.
          break;
        case SoftphoneMasterCoordinator.errorTypes.NEXT_SOFTPHONE_MASTER_ALREADY_EXISTS:
          // Valid case. A different tab has already successfully grabbed user media
          // and has become the NextSoftphoneMaster.
          break;
        case SoftphoneMasterCoordinator.errorTypes.SOFTPHONE_NOT_ENABLED:
          // Valid case. The agent is configured to use desk phone to handle voice contacts.
          break;
        case SoftphoneMasterCoordinator.errorTypes.NO_SOFTPHONE_MANAGER:
          // Invalid case. There is no softphone manager instantiated.
          validError = true;
          connect.getLog().error('[SoftphoneMasterCoordinator] No softphone manager found').sendInternalLogToServer();
          break;
        case SoftphoneMasterCoordinator.errorTypes.INVALID_MEDIA_STREAM:
          // Invalid case. The captured userMediaStream was somehow inactive.
          validError = true;
          connect.getLog().error('[SoftphoneMasterCoordinator] userMediaStream is invalid').sendInternalLogToServer();
          break;
        case SoftphoneMasterCoordinator.errorTypes.START_SESSION_FAILED:
          // Invalid case. Something went wrong while calling SoftphoneManager.startSession().
          validError = true;
          connect.getLog().error('[SoftphoneMasterCoordinator] startSoftphoneSession failed').sendInternalLogToServer();
          break;
        case SoftphoneMasterCoordinator.errorTypes.CREATE_SOFTPHONE_MANAGER_FAILED:
          // Invalid case. Something went wrong while instantiating SoftphoneManager.
          validError = true;
          connect.getLog().error('[SoftphoneMasterCoordinator] createSoftphoneManager failed').sendInternalLogToServer();
          break;
        default:
          validError = true;
          if (error instanceof DOMException) {
            // GUM failed because microphone permission was denied. Do nothing here
          } else {
            connect.getLog().error('[SoftphoneMasterCoordinator] Unknown error:', error.message).withObject({ error }).sendInternalLogToServer();
          }
      }
      // If we don't see GumSucceeded, and it is none of the other GUM failure error messages, then we know the actual GUM API failed.
      if (gumLatencies['GumCalled'] && !gumLatencies['GumSucceeded'] 
          && !(error.message === SoftphoneMasterCoordinator.errorTypes.GUM_TIMEOUT 
              || error.message === SoftphoneMasterCoordinator.errorTypes.CONTACT_NOT_CONNECTING)) {
        publishTelemetryEvent("GumFailed", null, {}, true);
        publishError(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED, "Your microphone is not enabled in your browser.", "");
      }
      publishTelemetryEvent("CompeteForSoftphoneMasterError", null, {
        errorMessage: error.message || "No error Message",
        isValidError: validError
      }, true);
    }
    cleanup() {
      if (this.targetContact) {
        const agentConnectionId = this.targetContact.getAgentConnection().connectionId;
        this.removeDetectedCall(agentConnectionId);
      }
      gumLatencies = {};
      clearTimeout(this.gumTimeoutId);
      clearInterval(this.tabFocusIntervalId);
      clearTimeout(this.tabFocusTimeoutId);
      this.gumTimeoutId = null;
      this.tabFocusIntervalId = null;
      this.tabFocusTimeoutId = null;
      if (this.userMediaStream) {
        this.userMediaStream.getTracks().forEach((track) => track.stop());
      }
      this.userMediaStream = null;
    }
    createSoftphoneManager() {
      connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
      if (connect.core.softphoneManager) {
        connect.getLog().warn('Existing SoftphoneManger detected when creating a new one. Replacing with the new one').sendInternalLogToServer();
        this.terminateSoftphoneManager();
      }
      try {
        connect.core.softphoneManager = new connect.SoftphoneManager(this.softphoneParams);
      } catch (e) {
        throw Error(SoftphoneMasterCoordinator.errorTypes.CREATE_SOFTPHONE_MANAGER_FAILED);
      }
    }
    terminateSoftphoneManager() {
      if (connect.core.softphoneManager) {
        connect.core.softphoneManager.terminate();
        delete connect.core.softphoneManager;
      }
    }
    addDetectedCall(agentConnectionId) {
      connect.assertNotNull(agentConnectionId, 'agentConnectionId');
      this.callsDetected[agentConnectionId] = true;
    }
    removeDetectedCall(agentConnectionId) {
      connect.assertNotNull(agentConnectionId, 'agentConnectionId');
      delete this.callsDetected[agentConnectionId];
    }
  }
  SoftphoneMasterCoordinator.errorTypes = connect.makeEnum([
    'gum_timeout',
    'contact_not_connecting',
    'next_softphone_master_already_exists',
    'tab_focus_timeout',
    'softphone_not_enabled',
    'no_softphone_manager',
    'invalid_media_stream',
    'start_session_failed',
    'create_softphone_manager_failed'
  ]);
  SoftphoneMasterCoordinator.GUM_TIMEOUT = 20 * 1000;
  SoftphoneMasterCoordinator.TAB_FOCUS_TIMEOUT = 20 * 1000;
  SoftphoneMasterCoordinator.TAB_FOCUS_POLLING_INTERVAL = 100;

  connect.SoftphoneManager = SoftphoneManager;
  connect.SoftphoneMasterCoordinator = SoftphoneMasterCoordinator;
})();
