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
  global.ccpVersion = "V2";

  const VDIPlatformType = {
    CITRIX: "CITRIX",
    AWS_WORKSPACE: "AWS_WORKSPACE",
  }

  const BROWSER_ID = "browserId" // A key which is used for storing browser id value in local storage

  var statsReportingJobIntervalMs = 30000;
  var CallTypeMap = {};
  CallTypeMap[connect.SoftphoneCallType.AUDIO_ONLY] = 'Audio';
  CallTypeMap[connect.SoftphoneCallType.VIDEO_ONLY] = 'Video';
  CallTypeMap[connect.SoftphoneCallType.AUDIO_VIDEO] = 'AudioVideo';
  CallTypeMap[connect.SoftphoneCallType.NONE] = 'None';
  var AUDIO_INPUT = 'audio_input';
  var AUDIO_OUTPUT = 'audio_output';

  var MediaTypeMap = {};
  MediaTypeMap[connect.ContactType.VOICE] = "Voice";

  var timeSeriesStreamStatsBuffer = [];

  // We buffer only last 3 hours (10800 seconds) of a call's RTP stream stats.
  var MAX_RTP_STREAM_STATS_BUFFER_SIZE = 10800;
  var inputRTPStreamStatsBuffer = [];
  var outputRTPStreamStatsBuffer = [];

  var aggregatedUserAudioStats = {};
  var aggregatedRemoteAudioStats = {};
  var LOW_AUDIO_LEVEL_THRESHOLD = 1;
  var consecutiveNoAudioInputPackets = 0;
  var consecutiveLowInputAudioLevel = 0;
  var consecutiveNoAudioOutputPackets = 0;
  var consecutiveLowOutputAudioLevel = 0;
  var audioInputConnectedDurationSeconds = 0;
  // Time from CCP received the softphone contact till local media is added to the softphone session
  var ccpMediaReadyLatencyMillis = 0;
  var allowEarlyGum = false;
  var earlyGumWorked = false;
  var vdiPlatform = null;
  var rtpStatsJob = null;
  var reportStatsJob = null;
  //Logger specific to softphone.
  var logger = null;
  var SoftphoneErrorTypes = connect.SoftphoneErrorTypes;
  var HANG_UP_MULTIPLE_SESSIONS_EVENT = "MultiSessionHangUp";
  var ECHO_CANCELLATION_CHECK = "echoCancellationCheck";

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

  var SoftphoneManager = function (softphoneParams = {}) {
    var self = this;
    this.rtcPeerConnectionFactory = null;
    this.rtcJsStrategy = null;
    this.rtcPeerConnectionManager = null;

    this._setRtcJsStrategy = function () {
      if (softphoneParams.VDIPlatform) {
        vdiPlatform = softphoneParams.VDIPlatform;
        try {
          if (softphoneParams.VDIPlatform === VDIPlatformType.CITRIX) {
            this.rtcJsStrategy = new connect.CitrixVDIStrategy();
            logger.info(`[SoftphoneManager] Strategy constructor retrieved: ${this.rtcJsStrategy}`).sendInternalLogToServer();
          }
          else if (softphoneParams.VDIPlatform === VDIPlatformType.AWS_WORKSPACE) {
            this.rtcJsStrategy = new connect.DCVWebRTCStrategy();
            logger.info(`[SoftphoneManager] Strategy constructor retrieved: ${this.rtcJsStrategy}`).sendInternalLogToServer();
          } else {
            throw new Error("VDI Strategy not supported");
          }
        } catch (error) {
          if (error.message === "VDI Strategy not supported") {
            publishError(SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED, error.message, "");
            throw error;
          }
          else if (error.message === "Citrix WebRTC redirection feature is NOT supported!") {
            publishError(SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED, error.message, "");
            throw error;
          }
          else if (error.message === "DCV WebRTC redirection feature is NOT supported!") {
            publishError(SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED, error.message, "");
            throw error;
          }
          else {
            publishError(SoftphoneErrorTypes.OTHER, error.message, "");
            throw error;
          }
        }
      }
    }

    this._refreshRtcPeerConnectionFactory = function () {
      if (connect?.core?.softphoneManager?.rtcPeerConnectionFactory?.close){
        connect.core.softphoneManager.rtcPeerConnectionFactory.close()
      }

      if (connect.RtcPeerConnectionFactory) {
        if (this.rtcJsStrategy) {
          this.rtcPeerConnectionFactory = new connect.RtcPeerConnectionFactory(logger,
            connect.core.getWebSocketManager(),
            softphoneClientId,
            connect.hitch(self, requestIceAccess, {
              transportType: "softphone",
              softphoneClientId: softphoneClientId
            }),
            connect.hitch(self, publishError),
            this.rtcJsStrategy
          );
        } else {
          this.rtcPeerConnectionFactory = new connect.RtcPeerConnectionFactory(logger,
            connect.core.getWebSocketManager(),
            softphoneClientId,
            connect.hitch(self, requestIceAccess, {
              transportType: "softphone",
              softphoneClientId: softphoneClientId
            }),
            connect.hitch(self, publishError));
        }
      }
    };

    // destroy or initiate persistent peer connection based on agent configuration change
    const listenAgentConfigurationUpdate = () => {
      connect.agent( (a) => {
        const sub = a.onRefresh( (agent) => {
          if (this.rtcPeerConnectionManager) {
            const isPPCEnabled = agent.getConfiguration().softphonePersistentConnection;
            // if softphonePersistentConnection changed in agent configuration
            if (this.rtcPeerConnectionManager.isPPCEnabled !== isPPCEnabled) {
              this.rtcPeerConnectionManager.isPPCEnabled = isPPCEnabled;
              // if softphonePersistentConnection changed to true, use rtcPeerConnectionManager to initiate a new persistent peer connection
              if (this.rtcPeerConnectionManager.isPPCEnabled) {
                logger.info("softphonePersistentConnection changed to ture, initiate a persistent peer connection").sendInternalLogToServer();
                this.rtcPeerConnectionManager.rtcJsStrategy = this.rtcJsStrategy;
                this.rtcPeerConnectionManager.closeEarlyMediaConnection(); // close standby peer connection
                this.rtcPeerConnectionManager.requestPeerConnection().then(() => { // request a new persistent peer connection
                  this.rtcPeerConnectionManager.createSession();
                  this.rtcPeerConnectionManager.connect();
                });
              } else {
                // if softphonePersistentConnection changed to false, use rtcPeerConnectionManager to tear down the currentpersistent peer connection
                logger.info("softphonePersistentConnection changed to false, destroy the existing persistent peer connection").sendInternalLogToServer();
                this.rtcPeerConnectionManager.destroy();
                this.rtcPeerConnectionManager.requestPeerConnection(); // This will create standby(early media) peer connection for supported browsers
              }
            }
          } else if (connect.core._allowSoftphonePersistentConnection) { // TODO: Remove else when Persistent Connection GA
            this._initiateRtcPeerConnectionManager();
          } else {
            sub.unsubscribe(); // unsubscribe the event if account is not allowlisted.
          }
        });
      });
    }

    this._initiateRtcPeerConnectionManager = function () {
      // close existing peer connection managed by rtcPeerConnectionManager
      if (connect?.core?.softphoneManager?.rtcPeerConnectionManager?.close) {
        connect.core.softphoneManager.rtcPeerConnectionManager.close();
        connect.core.softphoneManager.rtcPeerConnectionManager = null;
      }

      var isPPCEnabled = softphoneParams.isSoftphonePersistentConnectionEnabled;

      // browserId will be used to handle browser page refresh, iceRestart scenarios
      var browserId;
      if (!global.localStorage.getItem(BROWSER_ID)) {
        global.localStorage.setItem(BROWSER_ID, AWS.util.uuid.v4());
      }
      browserId = global.localStorage.getItem(BROWSER_ID);

      if (connect.RtcPeerConnectionManager) {
        // Disable earlyGum and close rtcPeerConnectionFactory before creating RtcPeerConnectionManager
        allowEarlyGum = false;
        if (self.rtcPeerConnectionFactory?.close){
          self.rtcPeerConnectionFactory.close();
          self.rtcPeerConnectionFactory = null;
        }

        self.rtcPeerConnectionManager = new connect.RtcPeerConnectionManager(
          null, // signalingURI for ccpv1
          null, // iceServers
          connect.hitch(self, requestIceAccess, {
            transportType: "softphone",
            softphoneClientId: softphoneClientId
          }), // transportHandle
          connect.hitch(self, publishError), // publishError
          softphoneClientId,  // clientId
          null, // callContextToken
          logger,
          null,  // contactId
          null, // agent connectionId
          connect.core.getWebSocketManager(),
          self.rtcJsStrategy === null ? new connect.StandardStrategy(): self.rtcJsStrategy,
          isPPCEnabled,
          browserId
        );
      } else {
        // customer who doesn't upgrade RTC.js will not be able to use RtcPeerConnectionManager to initialize persistent peer connection, but calls still work for them.
        logger.info("RtcPeerConnectionManager does NOT exist, please upgrade RTC.js");
      }
    }

    logger = new SoftphoneLogger(connect.getLog());
    logger.info("[Softphone Manager] softphone manager initialization has begun").sendInternalLogToServer();

    if(softphoneParams.allowEarlyGum !== false  && (connect.isChromeBrowser() || connect.isEdgeBrowser())){
      logger.info("[Softphone Manager] earlyGum mechanism enabled").sendInternalLogToServer();
      allowEarlyGum = true;
    } else {
      logger.info("[Softphone Manager] earlyGum mechanism NOT enabled").sendInternalLogToServer();
      allowEarlyGum = false;
    }

    logger.info(`[SoftphoneManager] Client Provided Strategy: ${softphoneParams.VDIPlatform}`).sendInternalLogToServer();

    this._setRtcJsStrategy();
    this._refreshRtcPeerConnectionFactory();
    // if allowSoftphonePersistentConnection FAC is true, initiate RtcPeerConnectionManager
    if (connect.core._allowSoftphonePersistentConnection && this.rtcPeerConnectionManager === null) {
      this._initiateRtcPeerConnectionManager();
    }
    listenAgentConfigurationUpdate();

    if (!SoftphoneManager.isBrowserSoftPhoneSupported()) {
      publishError(SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
        "Connect does not support this browser. Some functionality may not work. ",
        "");
    }

    if(softphoneParams.VDIPlatform !== VDIPlatformType.AWS_WORKSPACE) {
      var gumPromise = fetchUserMedia({
        success: function (stream) {
          publishTelemetryEvent("ConnectivityCheckResult", null,
              {
                connectivityCheckType: "MicrophonePermission",
                status: "granted"
              });
          publishTelemetryEvent("MicCheckSucceeded", null, {
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
    }

    const onMuteSub = handleSoftPhoneMuteToggle();
    const onSetSpeakerDeviceSub = handleSpeakerDeviceChange();
    const onSetMicrophoneDeviceSub = handleMicrophoneDeviceChange(!softphoneParams.disableEchoCancellation);
    monitorMicrophonePermission();

    this.ringtoneEngine = null;
    var rtcSessions = {};
    // Tracks the agent connection ID, so that if the same contact gets re-routed to the same agent, it'll still set up softphone
    var callsDetected = {};

    // variables for firefox multitab
    var isSessionPending = false;
    var pendingContact = null;
    var pendingAgentConnectionId = null;
    var postponeStartingSession = function (contact, agentConnectionId) {
      isSessionPending = true;
      pendingContact = contact;
      pendingAgentConnectionId = agentConnectionId;
    }
    var cancelPendingSession = function () {
      isSessionPending = false;
      pendingContact = null;
      pendingAgentConnectionId = null;
    }

    // helper method to provide access to rtc sessions
    this.getSession = function (connectionId) {
      return rtcSessions[connectionId];
    }

    this.replaceLocalMediaTrack = function (connectionId, track) {
      var stream = localMediaStream[connectionId].stream;
      if (stream) {
        var oldTrack = stream.getAudioTracks()[0];
        track.enabled = oldTrack.enabled;
        oldTrack.enabled = false;
        stream.removeTrack(oldTrack);
        if (softphoneParams.VDIPlatform === VDIPlatformType.AWS_WORKSPACE) {
          oldTrack.stop()
        }
        stream.addTrack(track);
      }
    };

    var isContactTerminated = function (contact) {
      return contact.getStatus().type === connect.ContactStatusType.ENDED ||
        contact.getStatus().type === connect.ContactStatusType.ERROR ||
        contact.getStatus().type === connect.ContactStatusType.MISSED;
    };

    var destroySession = (agentConnectionId) => {
      if (rtcSessions.hasOwnProperty(agentConnectionId)) {
        var session = rtcSessions[agentConnectionId];
        // Currently the assumption is it will throw an exception only and if only it already has been hung up.
        // TODO: Update once the hangup API does not throw exceptions
        new Promise((resolve, reject) => {
          delete rtcSessions[agentConnectionId];
          delete callsDetected[agentConnectionId];
          // if rtcPeerConnectionManager exists, it will hang up the session
          if (this.rtcPeerConnectionManager) {
            this.rtcPeerConnectionManager.hangup();
          } else {
            session.hangup();
          }
        }).catch(function (err) {
          lily.getLog()
            .warn(`There was an error destroying the softphone session for connection ID ${agentConnectionId} : ${err.message}`)
            .withObject({agentConnectionId: agentConnectionId, errorMessage: err.message})
            .sendInternalLogToServer();
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

    this._clearAllSessions = function () {
      connect
        .getLog()
        .info(
          `Clearing all active sessions`
        )
        .sendInternalLogToServer();

      for (var connectionId in rtcSessions) {
        if (rtcSessions.hasOwnProperty(connectionId)) {
          destroySession(connectionId);
        }
      }
    }

    this.startSession = function (_contact, _agentConnectionId) {
      var contact = isSessionPending ? pendingContact : _contact;
      var agentConnectionId = isSessionPending ? pendingAgentConnectionId : _agentConnectionId;
      if (!contact || !agentConnectionId) {
        return;
      }
      cancelPendingSession();
      
      // Set to true, this will block subsequent invokes from entering.
      callsDetected[agentConnectionId] = true;
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
      var session;
      if (this.rtcJsStrategy) {
        session = new connect.RTCSession(
          callConfig.signalingEndpoint,
          callConfig.iceServers,
          softphoneInfo.callContextToken,
          logger,
          contact.getContactId(),
          agentConnectionId,
          webSocketProvider,
          this.rtcJsStrategy);
      } else {
        session = new connect.RTCSession(
          callConfig.signalingEndpoint,
          callConfig.iceServers,
          softphoneInfo.callContextToken,
          logger,
          contact.getContactId(),
          agentConnectionId,
          webSocketProvider);
      }

      session.echoCancellation = !softphoneParams.disableEchoCancellation;

      rtcSessions[agentConnectionId] = session;

      // Custom Event to indicate the session init operations
      connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
        event: connect.ConnectionEvents.SESSION_INIT,
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

      session.remoteAudioElement = document.getElementById('remote-audio') || window.parent.parent.document.getElementById('remote-audio');
      if (this.rtcPeerConnectionFactory) {
        session.connect(this.rtcPeerConnectionFactory.get(callConfig.iceServers));
      } else {
        session.connect();
      }
    }

    var onDestroyContact = function (agentConnectionId) {
      // handle an edge case where a connecting contact gets cleared and the next agent snapshot doesn't contain the contact thus the onRefreshContact callback below can't properly clean up the stale session.
      if (rtcSessions[agentConnectionId]) {
        destroySession(agentConnectionId);
      }
    }

    var onRefreshContact = function (contact, agentConnectionId) {
      if (rtcSessions[agentConnectionId] && isContactTerminated(contact)) {
        destroySession(agentConnectionId);
        cancelPendingSession();
      }
      if (contact.isSoftphoneCall() && !callsDetected[agentConnectionId] && (
        contact.getStatus().type === connect.ContactStatusType.CONNECTING ||
        contact.getStatus().type === connect.ContactStatusType.INCOMING)) {
        publishTelemetryEvent('SoftphoneConfigDetected', contact.getContactId(), {}, true);
        if (connect.isFirefoxBrowser() && connect.hasOtherConnectedCCPs()) {
          logger.info('[Softphone Manager] Postpone starting session: ' + contact.getContactId()).sendInternalLogToServer();
          postponeStartingSession(contact, agentConnectionId);
        } else {
          if (allowEarlyGum && connect.core.userMediaProvider?.precapturedMediaStreamAvailable()) {
            earlyGumWorked = true;
            logger.info('[Softphone Manager] starting session using precapturedMediaStream').sendInternalLogToServer();
            self.startSession(contact, agentConnectionId, connect.core.userMediaProvider.getPrecapturedMediaStream());
          } else {
            earlyGumWorked = false;
            if(connect.core._isEarlyGumDisabled){
              allowEarlyGum = false;
            }
            self.startSession(contact, agentConnectionId);
          }
        }
      }
    };

    var onInitContact = function (contact) {
      var agentConnectionId = contact.getAgentConnection().connectionId;
      logger.info("Contact detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId).sendInternalLogToServer();

      if (!callsDetected[agentConnectionId]) {
        contact.onRefresh(function (_contact) {
          onRefreshContact(_contact, agentConnectionId);
        });
        contact.onDestroy(function () {
          onDestroyContact(agentConnectionId);
          // clean up localMediaStream
          if (localMediaStream[agentConnectionId]) deleteLocalMediaStream(agentConnectionId);
        });
      }
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
      onInitContactSub && onInitContactSub.unsubscribe && onInitContactSub.unsubscribe();
      onMuteSub && onMuteSub.unsubscribe && onMuteSub.unsubscribe();
      onSetSpeakerDeviceSub && onSetSpeakerDeviceSub.unsubscribe && onSetSpeakerDeviceSub.unsubscribe();
      onSetMicrophoneDeviceSub && onSetMicrophoneDeviceSub.unsubscribe && onSetMicrophoneDeviceSub.unsubscribe();
      if (this.rtcPeerConnectionFactory.clearIdleRtcPeerConnectionTimerId) {
        // This method needs to be called when destroying the softphone manager instance.
        // Otherwise the refresh loop in rtcPeerConnectionFactory will keep spawning WebRTCConnections every 60 seconds
        // and you will eventually get SoftphoneConnectionLimitBreachedException later.
        this.rtcPeerConnectionFactory.clearIdleRtcPeerConnectionTimerId();
      }
      this.rtcPeerConnectionFactory = null;
      if (this.rtcPeerConnectionManager && this.rtcPeerConnectionManager.clearIdleRtcPeerConnectionTimerId) {
        this.rtcPeerConnectionManager.clearIdleRtcPeerConnectionTimerId();
      }
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
    return bus.subscribe(connect.EventType.MUTE, muteToggle);
  };

  var handleSpeakerDeviceChange = function() {
    var bus = connect.core.getEventBus();
    return bus.subscribe(connect.ConfigurationEvents.SET_SPEAKER_DEVICE, setSpeakerDevice);
  }

  var handleMicrophoneDeviceChange = function (enableEchoCancellation) {
    var bus = connect.core.getEventBus();
    return bus.subscribe(connect.ConfigurationEvents.SET_MICROPHONE_DEVICE, (data) => setMicrophoneDevice({ ...data, enableEchoCancellation }));
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

  var setSpeakerDevice = function (data = {}) {
    const deviceId = data.deviceId || '';
    connect.getLog().info(`[Audio Device Settings] Attempting to set speaker device ${deviceId}`).sendInternalLogToServer();

    if (!deviceId) {
      connect.getLog().warn("[Audio Device Settings] Setting speaker device cancelled due to missing deviceId").sendInternalLogToServer();
      return;
    }

    var remoteAudioElement = document.getElementById('remote-audio') || window.parent.parent.document.getElementById('remote-audio');
    if (remoteAudioElement && typeof remoteAudioElement.setSinkId === 'function') {
        remoteAudioElement.setSinkId(deviceId).then(() => {
          connect.getLog().info(`[Audio Device Settings] Speaker device ${deviceId} successfully set to speaker audio element`).sendInternalLogToServer();
          connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
            event: connect.ConfigurationEvents.SPEAKER_DEVICE_CHANGED,
            data: { deviceId: deviceId }
          });
        }).catch((e) => {
          connect.getLog().error("[Audio Device Settings] Failed to set speaker device " + deviceId).withException(e).sendInternalLogToServer()
        });
    } else {
      connect.getLog().warn("[Audio Device Settings] Setting speaker device cancelled due to missing remoteAudioElement").sendInternalLogToServer();
    }
  }

  var setMicrophoneDevice = function (data = {}) {
    const deviceId = data.deviceId || '';
    connect.getLog().info(`[Audio Device Settings] Attempting to set microphone device ${deviceId}`).sendInternalLogToServer();

    if (connect.keys(localMediaStream).length === 0) {
      connect.getLog().warn("[Audio Device Settings] Setting microphone device cancelled due to missing localMediaStream").sendInternalLogToServer();
      return;
    }
    if (!deviceId) {
      connect.getLog().warn("[Audio Device Settings] Setting microphone device cancelled due to missing deviceId").sendInternalLogToServer();
      return;
    }
    var softphoneManager = connect.core.getSoftphoneManager();
    var CONSTRAINT = { audio: { deviceId: { exact: deviceId } } };
    if (!data.enableEchoCancellation) CONSTRAINT.audio.echoCancellation = false;
    connect.publishMetric({
      name: ECHO_CANCELLATION_CHECK,
      data: {
        count: 1,
        disableEchoCancellation: !data.enableEchoCancellation
      }
    });
     navigator.mediaDevices.getUserMedia(CONSTRAINT)
        .then((newMicrophoneStream) => {
          try {
            var newMicrophoneTrack = newMicrophoneStream.getAudioTracks()[0];
            for (var connectionId in localMediaStream) {
              if (localMediaStream.hasOwnProperty(connectionId)) {
                var localMedia = localMediaStream[connectionId].stream;
                var session = softphoneManager.getSession(connectionId);
                //Replace the audio track in the RtcPeerConnection
                session._pc.getSenders()[0].replaceTrack(newMicrophoneTrack).then(function () {
                  //Replace the audio track in the local media stream (for mute / unmute)
                  softphoneManager.replaceLocalMediaTrack(connectionId, newMicrophoneTrack);
                  connect.getLog().info(`[Audio Device Settings] Microphone device ${deviceId} successfully set to local media stream in RTCRtpSender`).sendInternalLogToServer();
                });
              }
            }
          } catch(e) {
            connect.getLog().error("[Audio Device Settings] Failed to set microphone device " + deviceId).withException(e).sendInternalLogToServer();
            return;
          }
          connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
            event: connect.ConfigurationEvents.MICROPHONE_DEVICE_CHANGED,
            data: { deviceId: deviceId }
          });
        }).catch((e) => {
          connect.getLog().error("[Audio Device Settings] Failed to set microphone device " + deviceId).withException(e).sendInternalLogToServer();
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

  var publishTelemetryEvent = function (eventName, contactId, data) {
    connect.publishMetric({
      name: eventName,
      contactId: contactId,
      data: data
    });
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

  SoftphoneManager.isBrowserSoftPhoneSupported = function () {
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

    var streamPerSecondStats = {
      AUDIO_INPUT : {
        packetsCount: inputRTPStreamStatsBuffer.map(stats => stats.packetsCount),
        packetsLost: inputRTPStreamStatsBuffer.map(stats => stats.packetsLost),
        audioLevel: inputRTPStreamStatsBuffer.map(stats => stats.audioLevel),
        jitterBufferMillis: inputRTPStreamStatsBuffer.map(stats => stats.jitterBufferMillis)
      },
      AUDIO_OUTPUT : {
        packetsCount: outputRTPStreamStatsBuffer.map(stats => stats.packetsCount),
        packetsLost: outputRTPStreamStatsBuffer.map(stats => stats.packetsLost),
        audioLevel: outputRTPStreamStatsBuffer.map(stats => stats.audioLevel),
        jitterBufferMillis: outputRTPStreamStatsBuffer.map(stats => stats.jitterBufferMillis),
        roundTripTimeMillis: outputRTPStreamStatsBuffer.map(stats => stats.roundTripTimeMillis)
      }
    }

    var telemetryCallReport = {
      ...callReport,
      softphoneStreamPerSecondStatistics: streamPerSecondStats,
      iceConnectionsLost: report.iceConnectionsLost,
      iceConnectionsFailed: report.iceConnectionsFailed || null,
      peerConnectionFailed: report.peerConnectionFailed || null,
      rtcJsVersion: report.rtcJsVersion || null,
      consecutiveNoAudioInputPackets: consecutiveNoAudioInputPackets,
      consecutiveLowInputAudioLevel: consecutiveLowInputAudioLevel,
      consecutiveNoAudioOutputPackets: consecutiveNoAudioOutputPackets,
      consecutiveLowOutputAudioLevel: consecutiveLowOutputAudioLevel,
      audioInputConnectedDurationSeconds: audioInputConnectedDurationSeconds,
      ccpMediaReadyLatencyMillis: ccpMediaReadyLatencyMillis,
      contactSubtype: contact.getContactSubtype(),
      earlyGumEnabled: allowEarlyGum,
      earlyGumWorked: earlyGumWorked,
      vdiPlatform: vdiPlatform || null,
      streamJsVersion: connect.version
    }

    connect.publishSoftphoneReport({
      contactId: contact.getContactId(),
      ccpVersion: global.ccpVersion,
      report: telemetryCallReport
    });

    logger.info("sent TelemetryCallReport " + JSON.stringify(telemetryCallReport))
      .sendInternalLogToServer();
  };

  var startStatsCollectionJob = function (rtcSession) {
    rtpStatsJob = window.setInterval(function () {
      rtcSession.getUserAudioStats().then(function (stats) {
        var previousUserStats = aggregatedUserAudioStats;
        aggregatedUserAudioStats = stats;
        var currRTPStreamStat = getTimeSeriesStats(aggregatedUserAudioStats, previousUserStats, AUDIO_INPUT);
        timeSeriesStreamStatsBuffer.push(currRTPStreamStat);
        telemetryCallReportRTPStreamStatsBuffer(currRTPStreamStat);
      }, function (error) {
        logger.debug("Failed to get user audio stats.", error).sendInternalLogToServer();
      });
      rtcSession.getRemoteAudioStats().then(function (stats) {
        var previousRemoteStats = aggregatedRemoteAudioStats;
        aggregatedRemoteAudioStats = stats;
        var currRTPStreamStat = getTimeSeriesStats(aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT);
        timeSeriesStreamStatsBuffer.push(currRTPStreamStat);
        telemetryCallReportRTPStreamStatsBuffer(currRTPStreamStat);
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
    inputRTPStreamStatsBuffer = [];
    outputRTPStreamStatsBuffer = [];
    rtpStatsJob = null;
    reportStatsJob = null;
    consecutiveNoAudioInputPackets = 0;
    consecutiveLowInputAudioLevel = 0;
    consecutiveNoAudioOutputPackets = 0;
    consecutiveLowOutputAudioLevel = 0;
    audioInputConnectedDurationSeconds = 0;
  };

  var getTimeSeriesStats = function (currentStats, previousStats, streamType) {
    if (previousStats && currentStats) {
      var packetsLost = currentStats.packetsLost > previousStats.packetsLost ? currentStats.packetsLost - previousStats.packetsLost : 0;
      var packetsCount = currentStats.packetsCount > previousStats.packetsCount ? currentStats.packetsCount - previousStats.packetsCount : 0;
      checkConsecutiveNoPackets(packetsCount, streamType);
      checkConsecutiveNoAudio(currentStats.audioLevel, streamType);

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

  var telemetryCallReportRTPStreamStatsBuffer = function (rtpStreamStats) {
    if (rtpStreamStats.softphoneStreamType === AUDIO_INPUT) {
      while (inputRTPStreamStatsBuffer.length >= MAX_RTP_STREAM_STATS_BUFFER_SIZE) {
        inputRTPStreamStatsBuffer.shift();
      }
      inputRTPStreamStatsBuffer.push(rtpStreamStats);
    } else if (rtpStreamStats.softphoneStreamType === AUDIO_OUTPUT) {
      while (outputRTPStreamStatsBuffer.length >= MAX_RTP_STREAM_STATS_BUFFER_SIZE) {
        outputRTPStreamStatsBuffer.shift();
      }
      outputRTPStreamStatsBuffer.push(rtpStreamStats);
    }
  };

  var checkConsecutiveNoPackets = function (packetsCount, streamType) {
    if (streamType === AUDIO_INPUT) {
      audioInputConnectedDurationSeconds++;
      if (packetsCount <= 0){
        consecutiveNoAudioInputPackets++;
      } else {
        consecutiveNoAudioInputPackets = 0;
      }
    } else if (streamType === AUDIO_OUTPUT){
      if (packetsCount <= 0){
        consecutiveNoAudioOutputPackets++;
      } else {
        consecutiveNoAudioOutputPackets = 0;
      }
    }
  };

  var checkConsecutiveNoAudio = function (audioLevel, streamType) {
    if (streamType === AUDIO_INPUT) {
      if (audioLevel !== null && audioLevel <= LOW_AUDIO_LEVEL_THRESHOLD){
        consecutiveLowInputAudioLevel++;
      } else{
        consecutiveLowInputAudioLevel = 0;
      }
    } else if (streamType === AUDIO_OUTPUT){
      if (audioLevel !== null && audioLevel <= LOW_AUDIO_LEVEL_THRESHOLD){
        consecutiveLowOutputAudioLevel++;
      } else{
        consecutiveLowOutputAudioLevel = 0;
      }
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

  connect.SoftphoneManager = SoftphoneManager;
})();