(function() {
  var MAX_LOG = 200;
  var log = [];

  function logEvent(eventName, data) {
    var entry = {
      event: eventName,
      timestamp: Date.now(),
      data: data || {}
    };
    log.push(entry);
    if (log.length > MAX_LOG) log.shift();
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[SparkLog]", eventName, data || "");
    }
  }

  function getLog() {
    return log.slice();
  }

  function getEventsByType(eventName) {
    var results = [];
    for (var i = 0; i < log.length; i++) {
      if (log[i].event === eventName) results.push(log[i]);
    }
    return results;
  }

  function getSessionStats() {
    var sessions = getEventsByType("session_complete");
    var starts = getEventsByType("session_start");
    var retries = getEventsByType("session_retry");
    return {
      totalSessions: sessions.length,
      totalStarts: starts.length,
      completionRate: starts.length > 0 ? sessions.length / starts.length : 0,
      retries: retries.length,
      avgAccuracy: sessions.length > 0
        ? sessions.reduce(function(sum, s) { return sum + (s.data.accuracy || 0); }, 0) / sessions.length
        : 0
    };
  }

  function clearLog() {
    log.length = 0;
  }

  var SparkEventLogger = {
    log: logEvent,
    getLog: getLog,
    getEventsByType: getEventsByType,
    getSessionStats: getSessionStats,
    clear: clearLog
  };

  if (typeof window !== "undefined") window.SparkEventLogger = SparkEventLogger;
  if (typeof module !== "undefined") module.exports = SparkEventLogger;
})();
