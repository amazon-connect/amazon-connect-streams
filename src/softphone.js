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
        if (connect.isFirefoxBrowser()) {
          connect.core.setSoftphoneUserMediaStream(stream);
        }
      },
      failure: function (err) {
        publishError(err, "Your microphone is not enabled in your browser. ", "");
      }
    });
    handleSoftPhoneMuteToggle();

    this.ringtoneEngine = null;
    var cleanMultipleSessions = 'true' === softphoneParams.cleanMultipleSessions;
    var rtcSessions = {};
    // Tracks the agent connection ID, so that if the same contact gets re-routed to the same agent, it'll still set up softphone
    var callsDetected = {};

    // helper method to provide access to rtc sessions
    this.getSession = function (connectionId) {
      return rtcSessions[connectionId];
    }

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
          delete callsDetected[agentConnectionId];
          session.hangup();
        }).catch(function (err) {
          lily.getLog().warn("Clean up the session locally " + agentConnectionId, err.message);
        });
      }
    };

    // When feature access control flag is on, ignore the new call and hang up the previous sessions.
    // Otherwise just log the contact and agent in the client side metrics.
    // TODO: Update when connect-rtc exposes an API to detect session status.
    var sanityCheckActiveSessions = function (rtcSessions) {
      if (Object.keys(rtcSessions).length > 0) {
        if (cleanMultipleSessions) {
          // Error! our state doesn't match, tear it all down.
          for (var connectionId in rtcSessions) {
            if (rtcSessions.hasOwnProperty(connectionId)) {
              // Log an error for the session we are about to end.
              publishMultipleSessionsEvent(HANG_UP_MULTIPLE_SESSIONS_EVENT, rtcSessions[connectionId].callId, connectionId);
              destroySession(connectionId);
            }
          }
          throw new Error("duplicate session detected, refusing to setup new connection");
        } else {
          for (var _connectionId in rtcSessions) {
            if (rtcSessions.hasOwnProperty(_connectionId)) {
              publishMultipleSessionsEvent(MULTIPLE_SESSIONS_EVENT, rtcSessions[_connectionId].callId, _connectionId);
            }
          }
        }
      }
    };

    var onRefreshContact = function (contact, agentConnectionId) {
      if (rtcSessions[agentConnectionId] && isContactTerminated(contact)) {
        destroySession(agentConnectionId);
      }
      if (contact.isSoftphoneCall() && !callsDetected[agentConnectionId] && (
        contact.getStatus().type === connect.ContactStatusType.CONNECTING ||
        contact.getStatus().type === connect.ContactStatusType.INCOMING)) {

        // Set to true, this will block subsequent invokes from entering.
        callsDetected[agentConnectionId] = true;
        logger.info("Softphone call detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId);

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

        if (connect.core.getSoftphoneUserMediaStream()) {
          session.mediaStream = connect.core.getSoftphoneUserMediaStream();
        }

        // Custom Event to indicate the session init operations
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
          event: connect.ConnnectionEvents.SESSION_INIT,
          data: {
            connectionId: agentConnectionId
          }
        });

        session.onSessionFailed = function (rtcSession, reason) {
          delete rtcSessions[agentConnectionId];
          delete callsDetected[agentConnectionId];
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
          publishTelemetryEvent("Softphone Session Completed", contact.getContactId());

          delete rtcSessions[agentConnectionId];
          delete callsDetected[agentConnectionId];
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
        } else {
          session.connect();
        }
      }
    };

    var onInitContact = function (contact) {
      var agentConnectionId = contact.getAgentConnection().connectionId;
      logger.info("Contact detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId);

      if (!callsDetected[agentConnectionId]) {
        contact.onRefresh(function () {
          onRefreshContact(contact, agentConnectionId);
        });
      }
    };

    connect.contact(onInitContact);

    // Contact already in connecting state scenario - In this case contact INIT is missed hence the OnRefresh callback is missed. 
    new connect.Agent().getContacts().forEach(function (contact) {
      var agentConnectionId = contact.getAgentConnection().connectionId;
      logger.info("Contact exist in the snapshot. Reinitiate the Contact and RTC session creation for contactId" + contact.getContactId(), "agent connectionId " + agentConnectionId);
      onInitContact(contact);
      onRefreshContact(contact, agentConnectionId);
    });
  };

  var fireContactAcceptedEvent = function (contact) {
    var conduit = connect.core.getUpstream();
    var agentConnection = contact.getAgentConnection();
    if (!agentConnection) {
      logger.info("Not able to retrieve the auto-accept setting from null AgentConnection, ignoring event publish..");
      return;
    }
    var softphoneMediaInfo = agentConnection.getSoftphoneMediaInfo();
    if (!softphoneMediaInfo) {
      logger.info("Not able to retrieve the auto-accept setting from null SoftphoneMediaInfo, ignoring event publish..");
      return;
    }
    if (softphoneMediaInfo.autoAccept === true) {
      logger.info("Auto-accept is enabled, sending out Accepted event to stop ringtone..");
      conduit.sendUpstream(connect.EventType.BROADCAST, {
        event: connect.ContactEvents.ACCEPTED
      });
      conduit.sendUpstream(connect.EventType.BROADCAST, {
        event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contact.contactId)
      });
    } else {
      logger.info("Auto-accept is disabled, ringtone will be stopped by user action.");
    }
  };

  // Bind events for mute
  var handleSoftPhoneMuteToggle = function () {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.EventType.MUTE, muteToggle);
  };

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
              logger.info("Agent has muted the contact, connectionId -  " + connectionId);
            } else {
              logger.info("Agent has unmuted the contact, connectionId - " + connectionId);
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
      logger.error("Softphone call failed due to CallNotFoundException.");
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

    } else if (typeof navigator.webkitGetUserMedia === "function") {
      promise = new Promise(function (resolve, reject) {
        navigator.webkitGetUserMedia(CONSTRAINT, resolve, reject);
      });

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
      message || "");

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

  var publishTelemetryEvent = function (eventName, contactId, data) {
    if (contactId) {
      connect.publishMetric({
        name: eventName,
        contactId: contactId,
        data: data
      });
    }
  };

  // Publish the contact and agent information in a multiple sessions scenarios
  var publishMultipleSessionsEvent = function (eventName, contactId, agentConnectionId) {
    publishTelemetryEvent(eventName, contactId, [{
      name: "AgentConnectionId",
      value: agentConnectionId
    }]);
    logger.info("Publish multiple session error metrics", eventName, "contactId " + contactId, "agent connectionId " + agentConnectionId);
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
          logger.info("sendSoftphoneMetrics success" + JSON.stringify(streamStats));
        },
        failure: function (data) {
          logger.error("sendSoftphoneMetrics failed.")
            .withObject(data);
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
        logger.info("sendSoftphoneReport success" + JSON.stringify(callReport));
      },
      failure: function (data) {
        logger.error("sendSoftphoneReport failed.")
          .withObject(data);
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
        logger.debug("Failed to get user audio stats.", error);
      });
      rtcSession.getRemoteAudioStats().then(function (stats) {
        var previousRemoteStats = aggregatedRemoteAudioStats;
        aggregatedRemoteAudioStats = stats;
        timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT));
      }, function (error) {
        logger.debug("Failed to get remote audio stats.", error);
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
        method.apply(self._originalLogger, [connect.LogComponent.SOFTPHONE, format].concat(args));
      };
    };
  };

  SoftphoneLogger.prototype.debug = function () {
    this._tee(1, this._originalLogger.debug)(arguments);
  };
  SoftphoneLogger.prototype.info = function () {
    this._tee(2, this._originalLogger.info)(arguments);
  };
  SoftphoneLogger.prototype.log = function () {
    this._tee(3, this._originalLogger.log)(arguments);
  };
  SoftphoneLogger.prototype.warn = function () {
    this._tee(4, this._originalLogger.warn)(arguments);
  };
  SoftphoneLogger.prototype.error = function () {
    this._tee(5, this._originalLogger.error)(arguments);
  };

  connect.SoftphoneManager = SoftphoneManager;
})();
