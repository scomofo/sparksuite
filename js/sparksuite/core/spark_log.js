/**
 * SparkLog - Structured logging for SparkSuite
 * Provides leveled logging with system tagging.
 * Logs are only emitted when enabled or when window.DEBUG is set.
 */
(function () {
  "use strict";

  var _enabled = false;

  var SparkLog = {

    /**
     * Enable logging output for info and debug levels.
     */
    enable: function () {
      _enabled = true;
    },

    /**
     * Disable logging output for info and debug levels.
     */
    disable: function () {
      _enabled = false;
    },

    /**
     * Log an informational message. Only outputs when enabled or DEBUG is set.
     * @param {string} system - The subsystem name
     * @param {string} message - The log message
     * @param {*} [data] - Optional data payload
     */
    info: function (system, message, data) {
      if (!_enabled && !window.DEBUG) return;
      var tag = "[SPARK:" + system + "]";
      if (data !== undefined) {
        console.log(tag, message, data);
      } else {
        console.log(tag, message);
      }
    },

    /**
     * Log a warning message. Always outputs regardless of enabled state.
     * @param {string} system - The subsystem name
     * @param {string} message - The log message
     * @param {*} [data] - Optional data payload
     */
    warn: function (system, message, data) {
      var tag = "[SPARK:" + system + "]";
      if (data !== undefined) {
        console.warn(tag, message, data);
      } else {
        console.warn(tag, message);
      }
    },

    /**
     * Log an error message. Always outputs regardless of enabled state.
     * @param {string} system - The subsystem name
     * @param {string} message - The log message
     * @param {*} [data] - Optional data payload
     */
    error: function (system, message, data) {
      var tag = "[SPARK:" + system + "]";
      if (data !== undefined) {
        console.error(tag, message, data);
      } else {
        console.error(tag, message);
      }
    },

    /**
     * Log debug data. Only outputs when window.DEBUG is set.
     * @param {string} system - The subsystem name
     * @param {*} data - The debug data
     */
    debug: function (system, data) {
      if (!window.DEBUG) return;
      var tag = "[SPARK:" + system + "]";
      console.debug(tag, data);
    }
  };

  window.SparkLog = SparkLog;
})();
