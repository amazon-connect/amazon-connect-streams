/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

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
   var aggregatedUserAudioStats = null;
   var aggregatedRemoteAudioStats = null;
   var rtpStatsJob = null;
   var reportStatsJob = null;
   //Logger specific to softphone.
   var logger = null;

   var SoftphoneErrorTypes = connect.SoftphoneErrorTypes;

   var SoftphoneManager = function(softphoneParams) {
      logger = new SoftphoneLogger(connect.getLog());
      if (!isBrowserSoftPhoneSupported()) {
         publishError(SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
                      "Connect does not support this browser. Some functionality may not work. ",
                      "");
      }
      var gumPromise = fetchUserMedia({
         success: function(stream) {
            if (connect.isFirefoxBrowser()) {
                connect.core.setSoftphoneUserMediaStream(stream);
            }
         },
         failure: function(err) {
            publishError(err, "Your microphone is not enabled in your browser. ", "");
         }
      });

      this.ringtoneEngine = null;

      connect.contact(function(contact) {
         var callDetected = false;

         contact.onRefresh(function() {
            if (contact.isSoftphoneCall() && !callDetected && (
                     contact.getStatus().type === connect.ContactStatusType.CONNECTING ||
                     contact.getStatus().type === connect.ContactStatusType.INCOMING)) {

               callDetected = true;
               logger.info("Softphone call detected: ", contact.getContactId());
               initializeParams();
               var softphoneInfo = contact.getAgentConnection().getSoftphoneMediaInfo();
               var callConfig = parseCallConfig(softphoneInfo.callConfigJson);

               var session = new connect.RTCSession(
                     callConfig.signalingEndpoint,
                     callConfig.iceServers,
                     softphoneInfo.callContextToken,
                     logger,
                     contact.getContactId());
               if (connect.core.getSoftphoneUserMediaStream()) {
                    session.mediaStream = connect.core.getSoftphoneUserMediaStream();
               }
               session.onSessionFailed = function(rtcSession, reason) {
                   if (reason === connect.RTCErrors.ICE_COLLECTION_TIMEOUT) {
                        var endPointUrl = "\n";
                        for (var i=0; i < rtcSession._iceServers.length; i++) {
                            for (var j=0; j < rtcSession._iceServers[i].urls.length; j++) {
                                endPointUrl = endPointUrl + rtcSession._iceServers[i].urls[j] + "\n";
                            }
                        }
                        publishError(SoftphoneErrorTypes.ICE_COLLECTION_TIMEOUT, "Ice collection timedout. " ,endPointUrl);
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
                        "URL " +  rtcSession._signalingUri + " cannot be reached. ",
                        rtcSession._signalingUri);
                   } else if (reason === connect.RTCErrors.CALL_NOT_FOUND) {
                        //No need to publish any softphone error for this case. CCP UX will handle this case.
                        logger.error("Softphone call failed due to CallNotFoundException.");
                   } else {
                        publishError(SoftphoneErrorTypes.WEBRTC_ERROR,
                        "webrtc system error. ",
                        "");
                   }
                   stopJobsAndReport(contact, rtcSession.sessionReport);
               };
               session.onSessionConnected = function(rtcSession) {
                    //Become master to send logs, since we need logs from softphone tab.
                    connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
                    //start stats collection and reporting jobs
                    startStatsCollectionJob(rtcSession);
                    startStatsReportingJob(contact);
               };

               session.onSessionCompleted = function(rtcSession) {
                    //stop all jobs and perform one last job
                    stopJobsAndReport(contact, rtcSession.sessionReport);
               };
               session.remoteAudioElement = document.getElementById('remote-audio');
               session.connect();
            }
         });
      });
   };

   /** Parse the JSON encoded web call config into the data it represents. */
   var parseCallConfig = function(serializedConfig) {
       // Our underscore is too old for unescape
       // https://issues.amazon.com/issues/CSWF-1467
       var decodedJSON = serializedConfig.replace(/&quot;/g, '"');
       return JSON.parse(decodedJSON);
   };

   var fetchUserMedia = function(callbacksIn) {
      var callbacks = callbacksIn || {};
      callbacks.success = callbacks.success || function() {};
      callbacks.failure = callbacks.failure || function() {};

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
         promise = new Promise(function(resolve, reject) {
            navigator.webkitGetUserMedia(CONSTRAINT, resolve, reject);
         });

      } else {
         callbacks.failure(SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
         return;
      }

      promise.then(function(stream) {
         var audioTracks = stream.getAudioTracks();
         if (audioTracks && audioTracks.length > 0) {
            callbacks.success(stream);
         } else {
            callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
         }
      }, function(err) {
         callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
      });
      return promise;
   };

   var publishError = function(errorType, message, endPointUrl) {
      var bus = connect.core.getEventBus();
      logger.error("Softphone error occurred : ", errorType,
            message || "");
      bus.trigger(connect.AgentEvents.SOFTPHONE_ERROR, new connect.SoftphoneError(errorType, message, endPointUrl));
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

    var sendSoftphoneMetrics = function(contact) {
        var streamStats = timeSeriesStreamStatsBuffer.slice();
        timeSeriesStreamStatsBuffer = [];
        if (streamStats.length > 0) {
            contact.sendSoftphoneMetrics(streamStats, {
               success: function(){
                   logger.info("sendSoftphoneMetrics success");
               },
               failure: function(data){
                   logger.error("sendSoftphoneMetrics failed.")
                      .withObject(data);
               }
            });
        }
    };

    var sendSoftphoneReport = function(contact, report, userAudioStats, remoteAudioStats) {
        report.streamStats = [ addStreamTypeToStats(userAudioStats || {}, AUDIO_INPUT),
                                addStreamTypeToStats(remoteAudioStats || {}, AUDIO_OUTPUT) ];
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
            success: function(){
                logger.info("sendSoftphoneReport success");
            },
            failure: function(data){
                logger.error("sendSoftphoneReport failed.")
                    .withObject(data);
            }
        });
    };

    var startStatsCollectionJob = function(rtcSession) {
        rtpStatsJob = window.setInterval(function() {
            rtcSession.getUserAudioStats().then(function(stats) {
                var previousUserStats = aggregatedUserAudioStats;
                aggregatedUserAudioStats = stats;
                timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedUserAudioStats, previousUserStats, AUDIO_INPUT));
            }, function(error) {
                logger.debug("Failed to get user audio stats.", error);
            });
            rtcSession.getRemoteAudioStats().then(function(stats) {
                var previousRemoteStats = aggregatedRemoteAudioStats;
                aggregatedRemoteAudioStats = stats;
                timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT));
            }, function(error) {
                logger.debug("Failed to get remote audio stats.", error);
            });
        }, 1000);
    };

    var startStatsReportingJob = function(contact) {
        reportStatsJob = window.setInterval(function() {
                           sendSoftphoneMetrics(contact);
        }, statsReportingJobIntervalMs);
    };

    var initializeParams = function() {
        aggregatedUserAudioStats = null;
        aggregatedRemoteAudioStats = null;
        timeSeriesStreamStatsBuffer = [];
        rtpStatsJob = null;
        reportStatsJob = null;
    };

    var getTimeSeriesStats = function(currentStats, previousStats, streamType) {
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

    var stopJob = function(task) {
        if (task !== null){
            window.clearInterval(task);
        }
        return null;
    };

    var stopJobsAndReport = function(contact, sessionReport) {
       rtpStatsJob = stopJob(rtpStatsJob);
       reportStatsJob = stopJob(reportStatsJob);
       sendSoftphoneReport(contact, sessionReport, addStreamTypeToStats(aggregatedUserAudioStats, AUDIO_INPUT), addStreamTypeToStats(aggregatedRemoteAudioStats, AUDIO_OUTPUT));
       sendSoftphoneMetrics(contact);
    };

    /**
    *   Adding streamtype parameter on top of RTCJS RTStats object.
    */
    var RTPStreamStats = function(timestamp, packetsLost, packetsCount, streamType, audioLevel, jitterBufferMillis, roundTripTimeMillis) {
        this.softphoneStreamType = streamType;
        this.timestamp = timestamp;
        this.packetsLost = packetsLost;
        this.packetsCount = packetsCount;
        this.audioLevel = audioLevel;
        this.jitterBufferMillis = jitterBufferMillis;
        this.roundTripTimeMillis = roundTripTimeMillis;
    };

    var addStreamTypeToStats = function(stats, streamType) {
        return new RTPStreamStats(stats.timestamp, stats.packetsLost, stats.packetsCount, streamType, stats.audioLevel);
    };

    var SoftphoneLogger = function(logger) {
        this._originalLogger = logger;
        var self = this;
        this._tee = function(level, method) {
            return function() {
                // call the original logger object to output to browser
                //Connect logger follows %s format to print objects to console.
                var args = Array.prototype.slice.call(arguments[0]);
                var format = "";
                args.forEach(function(){
                    format = format + " %s";
                });
                method.apply(self._originalLogger, [connect.LogComponent.SOFTPHONE, format].concat(args));
            };
        };
    };

    SoftphoneLogger.prototype.debug =  function() {
        this._tee(1, this._originalLogger.debug)(arguments);
    };
    SoftphoneLogger.prototype.info =  function() {
        this._tee(2, this._originalLogger.info)(arguments);
    };
    SoftphoneLogger.prototype.log =  function() {
        this._tee(3, this._originalLogger.log)(arguments);
    };
    SoftphoneLogger.prototype.warn =  function() {
        this._tee(4, this._originalLogger.warn)(arguments);
    };
    SoftphoneLogger.prototype.error =  function() {
        this._tee(5, this._originalLogger.error)(arguments);
    };

    connect.SoftphoneManager = SoftphoneManager;
})();
