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
    OMNISSA: "OMNISSA",
    CITRIX_413 : "CITRIX_413"
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

  // We buffer only last 3 hours (10800 seconds) of a call's RTP stream stats.
  var MAX_RTP_STREAM_STATS_BUFFER_SIZE = 10800;
  var LOW_AUDIO_LEVEL_THRESHOLD = 1;

  // Agent connection specific stats tracking - each agent connection gets its own stats object
  var agentConnectionStatsMap = {};
  var isConnected = false;
  // Time from CCP received the softphone contact till local media is added to the softphone session
  var ccpMediaReadyLatencyMillis = 0;
  var vdiPlatform = null;

  var allowExtendedPersistentConnection = false;

  var rtpStatsJobMap = {};
  var reportStatsJobMap = {};

  // Helper function to get or create agent connection specific stats
  var getAgentConnectionStats = function(agentConnectionId) {
    if (!agentConnectionStatsMap[agentConnectionId]) {
      agentConnectionStatsMap[agentConnectionId] = {
        consecutiveNoAudioInputPackets: 0,
        consecutiveLowInputAudioLevel: 0,
        consecutiveNoAudioOutputPackets: 0,
        consecutiveLowOutputAudioLevel: 0,
        audioInputConnectedDurationSeconds: 0,
        consecutiveAudioOutputMuteDurationSeconds: 0,
        timeSeriesStreamStatsBuffer: [],
        inputRTPStreamStatsBuffer: [],
        outputRTPStreamStatsBuffer: [],
        aggregatedUserAudioStats: null,
        aggregatedRemoteAudioStats: null
      };
    }
    return agentConnectionStatsMap[agentConnectionId];
  };
  
  // Helper function to clean up agent connection stats
  var cleanupAgentConnectionStats = function(agentConnectionId) {
    delete agentConnectionStatsMap[agentConnectionId];
  };
  // Logger specific to softphone.
  var logger = null;
  var SoftphoneErrorTypes = connect.SoftphoneErrorTypes;
  var HANG_UP_MULTIPLE_SESSIONS_EVENT = "MultiSessionHangUp";
  var ECHO_CANCELLATION_CHECK = "echoCancellationCheck";

  var localMediaStream = {};

  var softphoneClientId = connect.randomId();

  let errorBatchMap = {};

  //used for bullet routing - only the last active contact can make changes to the media stream.
  let lastActiveContactID = "";
  const contactAgentConnectionIdMap = {}

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
    allowExtendedPersistentConnection = !!softphoneParams.allowExtendedPersistentConnection;
    
    this._setRtcJsStrategy = function () {
      if (softphoneParams.VDIPlatform) {
        vdiPlatform = softphoneParams.VDIPlatform;
        try {
          switch (vdiPlatform) {
            case VDIPlatformType.CITRIX:
            case VDIPlatformType.CITRIX_413: // intentional fallthrough
              this.rtcJsStrategy = new connect.CitrixVDIStrategy(vdiPlatform, true);
              break;
            case VDIPlatformType.AWS_WORKSPACE:
              this.rtcJsStrategy = new connect.DCVWebRTCStrategy();
              break;
            case VDIPlatformType.OMNISSA:
              this.rtcJsStrategy = new connect.OmnissaVDIStrategy();
              break;
            default:
              publishError(SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED, "VDI Strategy not supported", "");
          }
          logger.info(`[SoftphoneManager] Strategy constructor retrieved: ${this.rtcJsStrategy}`).sendInternalLogToServer();
        } catch (error) {
          logger.warn(`[SoftphoneManager] VDI Strategy constructor error for ${vdiPlatform}: ${error.message}`).sendInternalLogToServer();
          if (error.message === "VDI Strategy not supported") {
            publishError(SoftphoneErrorTypes.VDI_STRATEGY_NOT_SUPPORTED, error.message, "");
          }
          else if (error.message === "Citrix WebRTC redirection feature is NOT supported!") {
            publishError(SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED, error.message, "");
          }
          else if (error.message === "DCV WebRTC redirection feature is NOT supported!") {
            publishError(SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED, error.message, "");
          }
          else if (error.message === "Omnissa WebRTC Redirection API failed to initialize!") {
            publishError(SoftphoneErrorTypes.VDI_REDIR_NOT_SUPPORTED, error.message, "");
          }
          else {
            publishError(SoftphoneErrorTypes.OTHER, error.message, "");
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
          const isPPCEnabled = agent.getConfiguration().softphonePersistentConnection;
          const shouldUseV2 = !!connect.RtcPeerConnectionManagerV2;

          if (this.rtcPeerConnectionManager) {
            // If the manager exists and the current manager type doesn't match what we should be using,
            // we need to reinitialize the manager completely
            const isUsingV2 = this.rtcPeerConnectionManager instanceof connect.RtcPeerConnectionManagerV2;

            if (Boolean(isUsingV2) !== Boolean(shouldUseV2)) {
              logger.info("FAC flag changed, reinitializing RtcPeerConnectionManager with shouldUseV2: "+Boolean(shouldUseV2) ).sendInternalLogToServer();
              this._initiateRtcPeerConnectionManager();
            } else {
              this.rtcPeerConnectionManager.handlePersistentPeerConnectionToggle(isPPCEnabled);
            }
          } else {
            this._initiateRtcPeerConnectionManager();
          }
        });
      });
    }

    this._initiateRtcPeerConnectionManager = function() {
      // close existing peer connection managed by rtcPeerConnectionManager, if the peer connection is not used in a call
      const existingPCManager = self?.rtcPeerConnectionManager;
      let hasActivePeerConnection = false;

      if (existingPCManager) {
        const managerType = existingPCManager instanceof connect.RtcPeerConnectionManagerV2 ? "V2" : "V1";
        const sessionState = existingPCManager?._rtcSession?._state?.name;

        logger.info(`Closing existing RTC peer connection manager: Type=${managerType}, HasPeerConnection=${hasActivePeerConnection}, SessionState=${sessionState}`).sendInternalLogToServer();
        existingPCManager.close();
        hasActivePeerConnection = existingPCManager._pc !== null && existingPCManager._pc !== undefined;
        // if the peer connection is NOT used in a call and get cleared properly then we should be good to close the existing pcm and create new pcm
        if (!hasActivePeerConnection) {
          self.rtcPeerConnectionManager = null;
        } else {
          logger.warn("Cannot close existing RTC peer connection manager as it has an active peer connection.").sendInternalLogToServer();
        }
      }

      var isPPCEnabled = softphoneParams.isSoftphonePersistentConnectionEnabled;
      // browserId will be used to handle browser page refresh, iceRestart scenarios
      var browserId;
      if (!global.localStorage.getItem(BROWSER_ID)) {
        global.localStorage.setItem(BROWSER_ID, AWS.util.uuid.v4());
      }
      browserId = global.localStorage.getItem(BROWSER_ID);

      if (connect.RtcPeerConnectionManager) {
        if (self.rtcPeerConnectionFactory?.close) {
          self.rtcPeerConnectionFactory.close();
          self.rtcPeerConnectionFactory = null;
        }

        const shouldUseV2 = !hasActivePeerConnection && connect.RtcPeerConnectionManagerV2;

        if (shouldUseV2) {
          logger.info("Using RtcPeerConnectionManagerV2").sendInternalLogToServer();
          const v2Config = {
            transportHandle: connect.hitch(self, requestIceAccess, {
              transportType: "softphone",
              softphoneClientId: softphoneClientId
            }),
            publishError: connect.hitch(self, publishError),
            clientId: softphoneClientId,
            logger: logger,
            webSocketManager: connect.core.getWebSocketManager(),
            rtcJsStrategy: self.rtcJsStrategy === null ? new connect.StandardStrategy() : self.rtcJsStrategy,
            isPersistentConnectionEnabled: isPPCEnabled,
            allowExtendedPersistentConnection: !!softphoneParams.allowExtendedPersistentConnection,
            browserId: browserId
          };
          self.rtcPeerConnectionManager = new connect.RtcPeerConnectionManagerV2(v2Config);
        } else if (connect.RtcPeerConnectionManager) {
          logger.info("Using RtcPeerConnectionManager").sendInternalLogToServer();
          self.rtcPeerConnectionManager = new connect.RtcPeerConnectionManager(
              null, // signalingURI for ccpv1
              null, // iceServers
              connect.hitch(self, requestIceAccess, {
                transportType: "softphone",
                softphoneClientId: softphoneClientId
              }), // transportHandle
              connect.hitch(self, publishError), // publishError
              softphoneClientId, // clientId
              null, // callContextToken
              logger,
              null, // contactId
              null, // agent connectionId
              connect.core.getWebSocketManager(),
              self.rtcJsStrategy === null ? new connect.StandardStrategy() : self.rtcJsStrategy,
              isPPCEnabled,
              browserId
          );
        } else {
          // customer who doesn't upgrade RTC.js will not be able to use RtcPeerConnectionManager to initialize persistent peer connection, but calls still work for them.
          logger.info("RtcPeerConnectionManager does NOT exist, please upgrade RTC.js");
        }
      }
    }

    logger = new SoftphoneLogger(connect.getLog());
    logger.info("[Softphone Manager] softphone manager initialization has begun").sendInternalLogToServer();

    logger.info(`[SoftphoneManager] Client Provided Strategy: ${softphoneParams.VDIPlatform}`).sendInternalLogToServer();

    this._setRtcJsStrategy();
    this._refreshRtcPeerConnectionFactory();
    // Initiate RtcPeerConnectionManager if it hasn't been initialized yet
    if (this.rtcPeerConnectionManager === null) {
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

    /**
     * Replace the media stream in RTC session with enhanced version when VE feature is enabled.
     * We expect the first invocation is always from the `onLocalStreamAdded` callback. This sets the mic to the best suitable default device.
     * However, if the AudioDeviceSettings is enabled on the Security Profile, we expect a second invocation from the `setMicrophoneDevice` callback
     * which supplies 'newDeviceId' and reflects the device chosen on the CCP itself.
     * 
     * @param {*} newDeviceId The exact microphone device id to get media from browser.
     */
    this.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia = async function (newDeviceId) {
      try {
          if (softphoneParams.VDIPlatform != null) {
            logger.info(`[Softphone Manager] Skipping media stream replace with enhanced media for VDI: ${softphoneParams.VDIPlatform}`);
            return;
          }
          let audioConstraint = {
            audio: {
              echoCancellation: true,
            }
          };
          if (newDeviceId) {
            audioConstraint.audio.deviceId = { exact: newDeviceId };
          }
          if (softphoneParams.disableEchoCancellation) {
            audioConstraint.audio.echoCancellation = false;
            audioConstraint.audio.autoGainControl = true; // Enable autoGainControl to fix the low mic issue.
          }
          connect.publishMetric({ 
            name: "IsEchoCancellationEnabled",
            data: {
              count: audioConstraint.audio.echoCancellation ? 1 : 0,
            }
          });
          const sourceStream = await navigator.mediaDevices.getUserMedia(audioConstraint);
          logger.info(`[Softphone Manager] Got stream ${sourceStream?.id} for device ${audioConstraint.audio.deviceId}`);

          const enhancedAudioStream = await connect.VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceStream, {
            onError: () => publishError('audio_enhancement_failure', 'Failed to enhance audio stream', '')
          });
          await this.replaceMediaStreamInRTCSession(enhancedAudioStream);
          logger.info(`[Softphone Manager] Replaced local audio stream ${sourceStream.id} with audio stream: ${enhancedAudioStream.id}`).sendInternalLogToServer();
      } catch (error) {
          logger.error(`[Softphone Manager] Failed to replace media stream in rtc session`)
            .withException(error)
            .sendInternalLogToServer();
      }
    }

    /**
     * Replaces the audio track in all active RTC connections with a new track from the provided media stream
     * @param {MediaStream} mediaStream - The media stream containing the new audio track
     * @returns {Promise<void>} Resolves when all track replacements are complete
     * @throws {Error} If mediaStream is invalid or track replacement fails
     */
    this.replaceMediaStreamInRTCSession = async function (mediaStream) {
      try {
        if (!mediaStream || !mediaStream.getAudioTracks || !mediaStream.getAudioTracks().length) {
          throw new Error('Invalid media stream or no audio tracks available');
        }

        const newAudioTrack = mediaStream.getAudioTracks()[0];
        const trackReplacements = [];

        for (const connectionId in localMediaStream) {
          if (localMediaStream.hasOwnProperty(connectionId)) {

            const session = this.getSession(connectionId);
            if (!session || !session._pc || !session._pc.getSenders) {
              logger.warn(`[Softphone Manager] Invalid session or peer connection for connectionId: ${connectionId}`).sendInternalLogToServer();
              continue;
            }

            const sender = session._pc.getSenders()[0];
            if (!sender) {
              logger.warn(`[Softphone Manager] No RTP sender found for connectionId: ${connectionId}`).sendInternalLogToServer();
              continue;
            }

            const trackReplacement = sender.replaceTrack(newAudioTrack)
              .then(() => {
                this.replaceLocalMediaTrack(connectionId, newAudioTrack);
                session._isUserProvidedStream = true;
                logger.info(`[Softphone Manager] Audio track successfully replaced for connectionId: ${connectionId}`).sendInternalLogToServer();
                logger.info(`[Softphone Manager] Audio track settings: ${JSON.stringify(newAudioTrack.getSettings())}`).sendInternalLogToServer();
              })
              .catch(error => {
                logger.error(`[Softphone Manager] Failed to replace track for connectionId: ${connectionId}`)
                  .withException(error)
                  .sendInternalLogToServer();
              });

            trackReplacements.push(trackReplacement);
          }
        }

        await Promise.all(trackReplacements);
        logger.info('[Softphone Manager] Successfully replaced all audio tracks').sendInternalLogToServer();
      } catch (error) {
          logger.error('[Softphone Manager] Failed to replace media stream in rtc session')
            .withException(error)
            .sendInternalLogToServer();
      }
    };

    this.replaceLocalMediaTrack = function (connectionId, track) {
      var stream = localMediaStream[connectionId].stream;
      if (stream) {
        var oldTrack = stream.getAudioTracks()[0];
        // Skip if the new track is the same as the existing track
        if (oldTrack === track) {
          logger.info(`[Softphone Manager] Skipping track replacement as tracks are identical for connectionId ${connectionId}, trackId: ${track.id}`).sendInternalLogToServer();
          return;
        }
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

    this.destroySession = (agentConnectionId) => {
      if (rtcSessions.hasOwnProperty(agentConnectionId)) {
        var session = rtcSessions[agentConnectionId];
        // Currently the assumption is it will throw an exception only and if only it already has been hung up.
        // TODO: Update once the hangup API does not throw exceptions
        new Promise((resolve, reject) => {
          delete rtcSessions[agentConnectionId];
          delete callsDetected[agentConnectionId];
          // if rtcPeerConnectionManager exists, it will hang up the session
          if (this.rtcPeerConnectionManager) {
            this.rtcPeerConnectionManager.hangup(agentConnectionId);
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

    // LEGACY FUNCITON: Iterates through the current "active" sessions and should kill all sessions that ARE NOT currently presented in the snapshot based on agent connection id.
    // With the addition of bullet routing this function has been updated to also account for queued callback (which follows a different agent connection id pattern)
    // we want to make sure that we DON'T kill the incoming QCB contact when its a bullet contact.
    // TODO: Update when connect-rtc exposes an API to detect session status.
    this.sanityCheckActiveSessions = function (rtcSessions) {
      if (Object.keys(rtcSessions).length === 0)
        return;

      
      const voiceContacts = new connect.Agent().getContacts()
        .filter((contact) => contact.getType() == connect.ContactType.VOICE || contact.getType() == connect.ContactType.QUEUE_CALLBACK);

      const agentConnectionIds = voiceContacts.map((contact) => contact.getAgentConnection()?.getConnectionId());
      
      // Build set of active contactIds for validation
      const activeContactIds = new Set(voiceContacts.map(c => c.getContactId()));

      let duplicateSessionDetected = false;
      // Error! our state doesn't match, tear it all down.
      for (var connectionId in rtcSessions) {
        // For queued callbacks, agentConnectionId changes when contact connects, but rtcSession uses the original connectionId.
        // Check if connectionId is current OR if it maps to an active contact via contactAgentConnectionIdMap
        const isCurrentConnection = agentConnectionIds.includes(connectionId);
        const mappedContactId = contactAgentConnectionIdMap[connectionId];
        const isValidMappedConnection = mappedContactId && activeContactIds.has(mappedContactId);
        
        if (rtcSessions.hasOwnProperty(connectionId) && !isCurrentConnection && !isValidMappedConnection) {
          // Log an error for the session we are about to end.
          SoftphoneManager.publishMultipleSessionsEvent(HANG_UP_MULTIPLE_SESSIONS_EVENT, rtcSessions[connectionId].callId, connectionId);
          self.destroySession(connectionId);
          duplicateSessionDetected = true;
        }
      }

      if (duplicateSessionDetected)
        throw new Error("duplicate session detected, refusing to setup new connection");
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
          this.destroySession(connectionId);
        }
      }
    }

    this.startSession = function (_contact, _agentConnectionId, userMediaStream, callbacks) {
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
      this.sanityCheckActiveSessions(rtcSessions);

      if (contact.getStatus().type === connect.ContactStatusType.CONNECTING) {
        publishTelemetryEvent("Softphone Connecting", contact.getContactId());
      }

      var softphoneInfo = contact.getAgentConnection().getSoftphoneMediaInfo();
      var callConfig = parseCallConfig(softphoneInfo.callConfigJson);
      var webSocketProvider;
      if (callConfig.useWebSocketProvider) {
        webSocketProvider = connect.core.getWebSocketManager();
      }

      // initialize rtcPeerConnectionManager if it is not existed
      if (this.rtcPeerConnectionManager === null) {
        this._initiateRtcPeerConnectionManager();
      }

      var session;
      // if rtcPeerConnectionManager exists, it will create rtcSession object
      if (connect.RtcPeerConnectionManager && this.rtcPeerConnectionManager) {
        session = this.rtcPeerConnectionManager.createSession(
          contact.getContactId(),
          callConfig.iceServers,
          softphoneInfo.callContextToken,
          agentConnectionId,
          webSocketProvider,
          this.rtcJsStrategy === null ? new connect.StandardStrategy() : this.rtcJsStrategy);
      } else {
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
      }

      if (userMediaStream) {
        logger.info('[Softphone Manager] Setting custom user media stream').sendInternalLogToServer();
        session.mediaStream = userMediaStream;
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
        // publish voice focus metrics
        connect.VoiceFocusProvider.publishMetrics({ contactId: contact.getContactId() });
        // clean voice focus models
        connect.VoiceFocusProvider.cleanVoiceFocus();

        if (callbacks && callbacks.onSessionFailed) {
          callbacks.onSessionFailed(rtcSession, reason);
        }
      };

      session.onSessionConnected = function (rtcSession) {
        publishTelemetryEvent("Softphone Session Connected", contact.getContactId());
        // start stats collection and reporting jobs
        startStatsCollectionJob(contact, rtcSession);
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

        // publish voice focus metrics
        connect.VoiceFocusProvider.publishMetrics({ contactId: contact.getContactId() });
        // clean voice focus models
        connect.VoiceFocusProvider.cleanVoiceFocus();

        if (callbacks && callbacks.onSessionCompleted) {
          callbacks.onSessionCompleted(rtcSession);
        }
      };

      session.onLocalStreamAdded = function (rtcSession, stream) {
        // Cache the streams for mute/unmute
        localMediaStream[agentConnectionId] = {
          stream: stream
        };

        logger.info(`[Softphone Manager] On local media stream set, call voice enhancement for stream: ${stream.id}`);
        self.replaceAudioTracksInRTCSessionWithVoiceEnhancedMedia().then(() => {
          connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
            event: connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED,
            data: {
              connectionId: agentConnectionId
            }
          });
        }).catch((error) => {
          logger.error("[Softphone Manager] Failed to replace audio tracks in RTC session.").withException(error).sendInternalLogToServer();
          connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
            event: connect.AgentEvents.LOCAL_MEDIA_STREAM_CREATED,
            data: {
              connectionId: agentConnectionId
            }
          });
        });
      };

      session.remoteAudioElement = document.getElementById('remote-audio') || window.parent.parent.document.getElementById('remote-audio');
      if (this.rtcPeerConnectionManager) {
        this.rtcPeerConnectionManager.connect(agentConnectionId);
      } else {
        if (this.rtcPeerConnectionFactory) {
          session.connect(this.rtcPeerConnectionFactory.get(callConfig.iceServers));
        } else {
          session.connect();
        }
      }
    }

    var onDestroyContact = function (agentConnectionId) {
      // handle an edge case where a connecting contact gets cleared and the next agent snapshot doesn't contain the contact thus the onRefreshContact callback below can't properly clean up the stale session.
      if (rtcSessions[agentConnectionId]) {
        self.destroySession(agentConnectionId);
      }
    }

    var onRefreshContact = function (contact, agentConnectionId) {
      if (rtcSessions[agentConnectionId] && isContactTerminated(contact)) {
        self.destroySession(agentConnectionId);
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
            self.startSession(contact, agentConnectionId);
        }
      }
    };
    var setLastActiveContactId = function(contact, agentConnectionId) {
      lastActiveContactID = contact.getContactId();
      //this has to exist, all contacts must have an agent type connection;
      contactAgentConnectionIdMap[agentConnectionId] = contact.getContactId();
    }

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

        //used to track last active contact ID in bullet routing - This will be used to sync local media states
        //Pass the initial agentConnectionId captured at contact init because for Queue Callbacks,
        //the agentConnectionId changes after the contact connects. The localMediaStream uses the 
        //initial agentConnectionId, so we must use it here to ensure contactAgentConnectionIdMap 
        //correctly maps to the contact for mute/unmute operations.
        const resumeSub = contact.getAgentConnection().onParticipantResume(() => {
            setLastActiveContactId(contact, agentConnectionId);
        });
        const connectedSub = contact.onConnected(() => {
            setLastActiveContactId(contact, agentConnectionId);
        });
        const endedSub = contact.onEnded(() => {
            resumeSub.unsubscribe();
            connectedSub.unsubscribe();
            endedSub.unsubscribe();
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
    if (contact.isAutoAcceptEnabled() && contact.getType() === connect.ContactType.VOICE) {
      logger.info('Auto-accept is enabled, sending out Accepted event to stop ringtone..').sendInternalLogToServer();
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
        var isActiveContact = contactAgentConnectionIdMap[connectionId] === lastActiveContactID;
        logger.info("Agent's current active active media stream").withObject({
          isActiveContact,
          contactAgentConnectionIdMap,
          lastActiveContactID,
          localMediaStream,
          connectionId
        }).sendInternalLogToServer();
        if (localMedia && isActiveContact) {
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
                session._isUserProvidedStream = true;
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

  var getPerformanceTime = function () {
    try {
      return performance.now();
    } catch (e) {
      logger.error(e.message);
      return 0;
    }
  }

  var publishTelemetryEvent = function (eventName, contactId, data) {
    try {
      connect.publishMetric({
        name: eventName,
        contactId: contactId,
        data: data
      });
    } catch (e) {
      connect.getLog().error("Error Creating Metric: " + e.message).sendInternalLogToServer();
    }
  };

  // Publish the contact and agent information in a multiple sessions scenarios
  SoftphoneManager.publishMultipleSessionsEvent = function (eventName, contactId, agentConnectionId) {
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
    const agentConnectionId = contact.getAgentConnection().getConnectionId();
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    var streamStats = agentConnectionStats.timeSeriesStreamStatsBuffer.slice();
    agentConnectionStats.timeSeriesStreamStatsBuffer = [];
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
    const agentConnectionId = contact.getAgentConnection().getConnectionId();
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

    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    var streamPerSecondStats = {
      AUDIO_INPUT: {
        packetsCount: agentConnectionStats.inputRTPStreamStatsBuffer.map(stats => stats.packetsCount),
        packetsLost: agentConnectionStats.inputRTPStreamStatsBuffer.map(stats => stats.packetsLost),
        audioLevel: agentConnectionStats.inputRTPStreamStatsBuffer.map(stats => stats.audioLevel),
        jitterBufferMillis: agentConnectionStats.inputRTPStreamStatsBuffer.map(stats => stats.jitterBufferMillis)
      },
      AUDIO_OUTPUT: {
        packetsCount: agentConnectionStats.outputRTPStreamStatsBuffer.map(stats => stats.packetsCount),
        packetsLost: agentConnectionStats.outputRTPStreamStatsBuffer.map(stats => stats.packetsLost),
        audioLevel: agentConnectionStats.outputRTPStreamStatsBuffer.map(stats => stats.audioLevel),
        jitterBufferMillis: agentConnectionStats.outputRTPStreamStatsBuffer.map(stats => stats.jitterBufferMillis),
        roundTripTimeMillis: agentConnectionStats.outputRTPStreamStatsBuffer.map(stats => stats.roundTripTimeMillis)
      }
    }

    var telemetryCallReport = {
      ...callReport,
      softphoneStreamPerSecondStatistics: streamPerSecondStats,
      iceConnectionsLost: report.iceConnectionsLost,
      iceConnectionsFailed: report.iceConnectionsFailed || null,
      peerConnectionFailed: report.peerConnectionFailed || null,
      rtcJsVersion: report.rtcJsVersion || null,
      firstRTPTimeMillis: report.firstRTPTimeMillis || null,
      isMediaClusterPath: report.isMediaClusterPath,
      isPersistentPeerConnection: report.isPersistentPeerConnection,
      isExistingPersistentPeerConnection: report.isExistingPersistentPeerConnection || false,
      consecutiveNoAudioInputPackets: agentConnectionStats.consecutiveNoAudioInputPackets,
      consecutiveLowInputAudioLevel: agentConnectionStats.consecutiveLowInputAudioLevel,
      consecutiveNoAudioOutputPackets: agentConnectionStats.consecutiveNoAudioOutputPackets,
      consecutiveLowOutputAudioLevel: agentConnectionStats.consecutiveLowOutputAudioLevel,
      audioInputConnectedDurationSeconds: agentConnectionStats.audioInputConnectedDurationSeconds,
      ccpMediaReadyLatencyMillis: ccpMediaReadyLatencyMillis,
      contactSubtype: contact.getContactSubtype(),
      vdiPlatform: vdiPlatform || null,
      userAgentData: report.userAgentData || null,
      isConnected: isConnected,
      consecutiveAudioOutputMuteDurationSeconds: agentConnectionStats.consecutiveAudioOutputMuteDurationSeconds,
      streamJsVersion: connect.version,
      skewTimeMillis: connect.core.getSkew(),
      activePeerConnectionCount: connect.activePeerConnectionCount || null,
      isPCMv2Path: report.isPCMv2Path || null,
      iceCredentialSource: report.iceCredentialSource || null,
      isContactCredentialsDifferentRegion: report.isContactCredentialsDifferentRegion || null,
      iceRestartAttempts: report.iceRestartAttempts || 0,
      iceRestartSuccesses: report.iceRestartSuccesses || 0,
      iceRestartInviteRetries: report.iceRestartInviteRetries || 0,
      iceRestartTimeMillis: report.iceRestartTimeMillis || null,
      iceRestartFailed: report.iceRestartFailed || null
    }
    ccpMediaReadyLatencyMillis = 0;
    isConnected = false;
    connect.publishSoftphoneReport({
      contactId: contact.getContactId(),
      ccpVersion: global.ccpVersion,
      report: telemetryCallReport
    });

    logger.info("sent TelemetryCallReport " + JSON.stringify(telemetryCallReport))
      .sendInternalLogToServer();
  };

  var startStatsCollectionJob = function (contact, rtcSession) {
    const agentConnectionId = contact.getAgentConnection().getConnectionId();
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    rtpStatsJobMap[agentConnectionId] = window.setInterval(function () {
      rtcSession.getUserAudioStats().then(function (stats) {
        var previousUserStats = agentConnectionStats.aggregatedUserAudioStats;
        agentConnectionStats.aggregatedUserAudioStats = stats;
        var currRTPStreamStat = getTimeSeriesStats(agentConnectionStats.aggregatedUserAudioStats, previousUserStats, AUDIO_INPUT, agentConnectionId);
        agentConnectionStats.timeSeriesStreamStatsBuffer.push(currRTPStreamStat);
        telemetryCallReportRTPStreamStatsBuffer(currRTPStreamStat, agentConnectionId);
      }, function (error) {
        logger.debug("Failed to get user audio stats.", error).sendInternalLogToServer();
      });
      rtcSession.getRemoteAudioStats().then(function (stats) {
        var previousRemoteStats = agentConnectionStats.aggregatedRemoteAudioStats;
        agentConnectionStats.aggregatedRemoteAudioStats = stats;
        var currRTPStreamStat = getTimeSeriesStats(agentConnectionStats.aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT, agentConnectionId);
        agentConnectionStats.timeSeriesStreamStatsBuffer.push(currRTPStreamStat);
        telemetryCallReportRTPStreamStatsBuffer(currRTPStreamStat, agentConnectionId);
      }, function (error) {
        logger.debug("Failed to get remote audio stats.", error).sendInternalLogToServer();
      });
      if(rtcSession?.mediaStream?.getAudioTracks()?.[0]?.enabled){
        agentConnectionStats.consecutiveAudioOutputMuteDurationSeconds = 0;
      } else {
        agentConnectionStats.consecutiveAudioOutputMuteDurationSeconds++;
      }
    }, 1000);
  };

  var startStatsReportingJob = function (contact) {
    const agentConnectionId = contact.getAgentConnection().getConnectionId();
    reportStatsJobMap[agentConnectionId] = window.setInterval(function () {
      sendSoftphoneMetrics(contact);
    }, statsReportingJobIntervalMs);
  };

  var getTimeSeriesStats = function (currentStats, previousStats, streamType, agentConnectionId) {
    if (previousStats && currentStats) {
      var packetsLost = currentStats.packetsLost > previousStats.packetsLost ? currentStats.packetsLost - previousStats.packetsLost : 0;
      var packetsCount = currentStats.packetsCount > previousStats.packetsCount ? currentStats.packetsCount - previousStats.packetsCount : 0;
      checkConsecutiveNoPackets(packetsCount, streamType, agentConnectionId);
      checkConsecutiveNoAudio(currentStats.audioLevel, streamType, agentConnectionId);

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

  var telemetryCallReportRTPStreamStatsBuffer = function (rtpStreamStats, agentConnectionId) {
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    if (rtpStreamStats.softphoneStreamType === AUDIO_INPUT) {
      while (agentConnectionStats.inputRTPStreamStatsBuffer.length >= MAX_RTP_STREAM_STATS_BUFFER_SIZE) {
        agentConnectionStats.inputRTPStreamStatsBuffer.shift();
      }
      agentConnectionStats.inputRTPStreamStatsBuffer.push(rtpStreamStats);
    } else if (rtpStreamStats.softphoneStreamType === AUDIO_OUTPUT) {
      while (agentConnectionStats.outputRTPStreamStatsBuffer.length >= MAX_RTP_STREAM_STATS_BUFFER_SIZE) {
        agentConnectionStats.outputRTPStreamStatsBuffer.shift();
      }
      agentConnectionStats.outputRTPStreamStatsBuffer.push(rtpStreamStats);
    }
  };

  var checkConsecutiveNoPackets = function (packetsCount, streamType, agentConnectionId) {
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    if (streamType === AUDIO_INPUT) {
      agentConnectionStats.audioInputConnectedDurationSeconds++;
      if (packetsCount <= 0) {
        agentConnectionStats.consecutiveNoAudioInputPackets++;
      } else {
        agentConnectionStats.consecutiveNoAudioInputPackets = 0;
      }
    } else if (streamType === AUDIO_OUTPUT) {
      if (packetsCount <= 0) {
        agentConnectionStats.consecutiveNoAudioOutputPackets++;
      } else {
        agentConnectionStats.consecutiveNoAudioOutputPackets = 0;
      }
    }
  };

  var checkConsecutiveNoAudio = function (audioLevel, streamType, agentConnectionId) {
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    if (streamType === AUDIO_INPUT) {
      if (audioLevel !== null && audioLevel <= LOW_AUDIO_LEVEL_THRESHOLD) {
        agentConnectionStats.consecutiveLowInputAudioLevel++;
      } else {
        agentConnectionStats.consecutiveLowInputAudioLevel = 0;
      }
    } else if (streamType === AUDIO_OUTPUT) {
      if (audioLevel !== null && audioLevel <= LOW_AUDIO_LEVEL_THRESHOLD) {
        agentConnectionStats.consecutiveLowOutputAudioLevel++;
      } else {
        agentConnectionStats.consecutiveLowOutputAudioLevel = 0;
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
    const agentConnectionId = contact.getAgentConnection().getConnectionId();
    const rtpStatsJob = rtpStatsJobMap[agentConnectionId];
    if (rtpStatsJob) {
      stopJob(rtpStatsJob);
      delete rtpStatsJobMap[agentConnectionId];
    }
    const reportStatsJob = reportStatsJobMap[agentConnectionId]
    if(reportStatsJob) {
      stopJob( reportStatsJob);
      delete reportStatsJobMap[agentConnectionId]
    }
    var agentConnectionStats = getAgentConnectionStats(agentConnectionId);
    sendSoftphoneReport(contact, sessionReport, addStreamTypeToStats(agentConnectionStats.aggregatedUserAudioStats, AUDIO_INPUT), addStreamTypeToStats(agentConnectionStats.aggregatedRemoteAudioStats, AUDIO_OUTPUT));
    sendSoftphoneMetrics(contact);
    cleanupAgentConnectionStats(agentConnectionId);
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