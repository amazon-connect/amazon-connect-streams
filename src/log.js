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

  // How frequently logs should be collected and reported to shared worker.
  var LOG_REPORT_INTERVAL_MILLIS = 5000;

  // The default log roll interval (30min)
  var DEFAULT_LOG_ROLL_INTERVAL = 1800000;

  /**
   * An enumeration of common logging levels.
   */
  var LogLevel = {
    TEST: "TEST",
    TRACE: "TRACE",
    DEBUG: "DEBUG",
    INFO: "INFO",
    LOG: "LOG",
    WARN: "WARN",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL"
  };

  /**
   * An enumeration of common logging components.
   */
  var LogComponent = {
    CCP: "ccp",
    SOFTPHONE: "softphone",
    CHAT: "chat"
  };

  /**
   * The numeric order of the logging levels above.
   * They are spaced to allow the addition of other log
   * levels at a later time.
   */
  var LogLevelOrder = {
    TEST: 0,
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    LOG: 40,
    WARN: 50,
    ERROR: 100,
    CRITICAL: 200

  };

  /**
   * A map from log level to console logger function.
   */
  var CONSOLE_LOGGER_MAP = {
    TRACE: function (text) { console.info(text); },
    DEBUG: function (text) { console.info(text); },
    INFO: function (text) { console.info(text); },
    LOG: function (text) { console.log(text); },
    TEST: function (text) { console.log(text); },
    WARN: function (text) { console.warn(text); },
    ERROR: function (text) { console.error(text); },
    CRITICAL: function (text) { console.error(text); }
  };

  /**
  * Checks if it is a valid log component enum
  */

  var isValidLogComponent = function (component) {
    return [LogComponent.SOFTPHONE, LogComponent.CCP, LogComponent.CHAT].indexOf(component) !== -1;
  };

  /**
  * Extract the custom arguments as required by the logger
  */
  var extractLoggerArgs = function (loggerArgs) {
    var args = Array.prototype.slice.call(loggerArgs, 0);
    var firstArg = args.shift();
    var format;
    var component;
    if (isValidLogComponent(firstArg)) {
      component = firstArg;
      format = args.shift();
    } else {
      //default to CCP component
      format = firstArg;
      component = LogComponent.CCP;
    }
    return {
      format: format,
      component: component,
      args: args
    };
  };

  /**
   * A log entry.
   *
   * @param level The log level of this log entry.
   * @param text The text contained in the log entry.
   *
   * Log entries are aware of their timestamp, order,
   * and can contain objects and exception stack traces.
   */
  var LogEntry = function (component, level, text) {
    this.component = component;
    this.level = level;
    this.text = text;
    this.time = new Date();
    this.exception = null;
    this.objects = [];
    this.line = 0;
  };

  LogEntry.fromObject = function (obj) {
    var entry = new LogEntry(LogComponent.CCP, obj.level, obj.text);

    // Required to check for Date objects sent across frame boundaries
    if (Object.prototype.toString.call(obj.time) === '[object Date]') {
      entry.time = new Date(obj.time.getTime());
    } else if (typeof obj.time === 'number') {
      entry.time = new Date(obj.time);
    } else if (typeof obj.time === 'string') {
      entry.time = Date.parse(obj.time);
    } else {
      entry.time = new Date();
    }
    entry.exception = obj.exception;
    entry.objects = obj.objects;
    return entry;
  };

  /**
   * Pulls the type, message, and stack trace
   * out of the given exception for JSON serialization.
   */
  var LoggedException = function (e) {
    this.type = Object.prototype.toString.call(e);
    this.message = e.message;
    this.stack = e.stack ? e.stack.split('\n') : [];
  };

  /**
   * Minimally stringify this log entry for printing
   * to the console.
   */
  LogEntry.prototype.toString = function () {
    return connect.sprintf("[%s] [%s]: %s",
      this.getTime() && this.getTime().toISOString ? this.getTime().toISOString() : "???",
      this.getLevel(),
      this.getText());
  };

  /**
   * Get the log entry timestamp.
   */
  LogEntry.prototype.getTime = function () {
    return this.time;
  };

  /**
   * Get the level of the log entry.
   */
  LogEntry.prototype.getLevel = function () {
    return this.level;
  };

  /**
   * Get the log entry text.
   */
  LogEntry.prototype.getText = function () {
    return this.text;
  };

  /**
   * Get the log entry component.
   */
  LogEntry.prototype.getComponent = function () {
    return this.component;
  };

  /**
   * Add an exception stack trace to this log entry.
   * A log entry may contain only one exception stack trace.
   */
  LogEntry.prototype.withException = function (e) {
    this.exception = new LoggedException(e);
    return this;
  };

  /**
   * Add an arbitrary object to the log entry.  A log entry
   * may contain any number of objects.
   */
  LogEntry.prototype.withObject = function (obj) {
    this.objects.push(connect.deepcopy(obj));
    return this;
  };

  /**
   * The logger instance.
   */
  var Logger = function () {
    this._logs = [];
    this._rolledLogs = [];
    this._logsToPush = [];
    this._echoLevel = LogLevelOrder.INFO;
    this._logLevel = LogLevelOrder.INFO;
    this._lineCount = 0;
    this._logRollInterval = 0;
    this._logRollTimer = null;
    this.setLogRollInterval(DEFAULT_LOG_ROLL_INTERVAL);
  };

  /**
   * Sets the interval in milliseconds that the logs will be rotated.
   * Logs are rotated out completely at the end of the second roll
   * and will eventually be garbage collected.
   */
  Logger.prototype.setLogRollInterval = function (interval) {
    var self = this;

    if (!(this._logRollTimer) || interval !== this._logRollInterval) {
      if (this._logRollTimer) {
        global.clearInterval(this._logRollTimer);
      }
      this._logRollInterval = interval;
      this._logRollTimer = global.setInterval(function () {
        this._rolledLogs = this._logs;
        this._logs = [];
        self.info("Log roll interval occurred.");
      }, this._logRollInterval);
    } else {
      this.warn("Logger is already set to the given interval: %d", this._logRollInterval);
    }
  };

  /**
   * Set the log level.  This is the minimum level at which logs will
   * be kept for later archiving.
   */
  Logger.prototype.setLogLevel = function (level) {
    if (level in LogLevelOrder) {
      this._logLevel = LogLevelOrder[level];
    } else {
      throw new Error("Unknown logging level: " + level);
    }
  };

  /**
   * Set the echo level.  This is the minimum level at which logs will
   * be printed to the javascript console.
   */
  Logger.prototype.setEchoLevel = function (level) {
    if (level in LogLevelOrder) {
      this._echoLevel = LogLevelOrder[level];
    } else {
      throw new Error("Unknown logging level: " + level);
    }
  };

  /**
   * Write a particular log entry.
   *
   * @param level The logging level of the entry.
   * @param text The text contents of the entry.
   *
   * @returns The new log entry.
   */
  Logger.prototype.write = function (component, level, text) {
    var logEntry = new LogEntry(component, level, text);
    this.addLogEntry(logEntry);
    return logEntry;
  };

  Logger.prototype.addLogEntry = function (logEntry) {
    this._logs.push(logEntry);
    //For now only send softphone logs only.
    //TODO add CCP logs once we are sure that no sensitive data is being logged.
    if (LogComponent.SOFTPHONE === logEntry.component) {
      this._logsToPush.push(logEntry);
    }

    if (logEntry.level in LogLevelOrder &&
      LogLevelOrder[logEntry.level] >= this._logLevel) {

      if (LogLevelOrder[logEntry.level] >= this._echoLevel) {
        CONSOLE_LOGGER_MAP[logEntry.getLevel()](logEntry.toString());
      }

      logEntry.line = this._lineCount++;
    }
  };

  /**
   * Remove all objects from all log entries.
   */
  Logger.prototype.clearObjects = function () {
    for (var x = 0; x < this._logs.length; x++) {
      if (this._logs[x].objects) {
        delete this._logs[x].objects;
      }
    }
  };

  /**
   * Remove all exception stack traces from the log entries.
   */
  Logger.prototype.clearExceptions = function () {
    for (var x = 0; x < this._logs.length; x++) {
      if (this._logs[x].exception) {
        delete this._logs[x].exception;
      }
    }
  };

  Logger.prototype.trace = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.TRACE, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.debug = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.DEBUG, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.info = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.INFO, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.log = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.LOG, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.test = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.TEST, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.warn = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.WARN, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.error = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.ERROR, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.critical = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.ERROR, connect.vsprintf(logArgs.format, logArgs.args));
  };

  /**
   * Create a string representation of the logger contents.
   */
  Logger.prototype.toString = function () {
    var lines = [];
    for (var x = 0; x < this._logs.length; x++) {
      lines.push(this._logs[x].toString());
    }

    return lines.join("\n");
  };

  Logger.prototype.download = function () {
    var logBlob = new global.Blob([JSON.stringify(this._rolledLogs.concat(this._logs), undefined, 4)], ['text/plain']);
    var downloadLink = document.createElement('a');
    downloadLink.href = global.URL.createObjectURL(logBlob);
    downloadLink.download = 'agent-log.txt';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  Logger.prototype.scheduleUpstreamLogPush = function (conduit) {
    if (!connect.upstreamLogPushScheduled) {
      connect.upstreamLogPushScheduled = true;
      /** Schedule pushing logs frequently to sharedworker upstream, sharedworker will report to LARS*/
      global.setInterval(connect.hitch(this, this.reportMasterLogsUpStream, conduit), LOG_REPORT_INTERVAL_MILLIS);
    }
  };

  Logger.prototype.reportMasterLogsUpStream = function (conduit) {
    var logsToPush = this._logsToPush.slice();
    this._logsToPush = [];
    connect.ifMaster(connect.MasterTopics.SEND_LOGS, function () {
      if (logsToPush.length > 0) {
        conduit.sendUpstream(connect.EventType.SEND_LOGS, logsToPush);
      }
    });
  };

  var DownstreamConduitLogger = function (conduit) {
    Logger.call(this);
    this.conduit = conduit;
    global.setInterval(connect.hitch(this, this._pushLogsDownstream),
      DownstreamConduitLogger.LOG_PUSH_INTERVAL);

    // Disable log rolling, we will purge our own logs once they have
    // been pushed downstream.
    global.clearInterval(this._logRollTimer);
    this._logRollTimer = null;
  };
  // How frequently logs should be collected and delivered downstream.
  DownstreamConduitLogger.LOG_PUSH_INTERVAL = 1000;
  DownstreamConduitLogger.prototype = Object.create(Logger.prototype);
  DownstreamConduitLogger.prototype.constructor = DownstreamConduitLogger;

  DownstreamConduitLogger.prototype._pushLogsDownstream = function () {
    var self = this;
    this._logs.forEach(function (log) {
      self.conduit.sendDownstream(connect.EventType.LOG, log);
    });
    this._logs = [];
  };

  /** Create the singleton logger instance. */
  connect.rootLogger = new Logger();

  /** Fetch the singleton logger instance. */
  var getLog = function () {
    return connect.rootLogger;
  };

  connect = connect || {};
  connect.getLog = getLog;
  connect.LogEntry = LogEntry;
  connect.Logger = Logger;
  connect.LogLevel = LogLevel;
  connect.LogComponent = LogComponent;
  connect.DownstreamConduitLogger = DownstreamConduitLogger;
})();
