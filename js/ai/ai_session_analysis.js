(function() {
  "use strict";

  function analyzeAISession(events) {
    events = Array.isArray(events) ? events : [];

    var chordErrors = {};
    var lateHits = 0;
    var earlyHits = 0;
    var i;
    var event;
    var chordKey;

    for (i = 0; i < events.length; i++) {
      event = events[i] || {};

      if (!event.correct && event.expectedChord) {
        chordKey = event.expectedChord;
        chordErrors[chordKey] = (chordErrors[chordKey] || 0) + 1;
      }

      if (typeof event.offsetMs === "number") {
        if (event.offsetMs > 100) lateHits++;
        if (event.offsetMs < -100) earlyHits++;
      }
    }

    return {
      chordErrors: chordErrors,
      lateHits: lateHits,
      earlyHits: earlyHits
    };
  }

  window.analyzeAISession = analyzeAISession;
})();
