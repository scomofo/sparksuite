// js/performance-core/chart-contract.js
(function() {

  var PerfChartContract = {
    normalizeEvents: function(events) {
      var result = [];
      for (var i = 0; i < events.length; i++) {
        var evt = Object.assign ? Object.assign({}, events[i]) : JSON.parse(JSON.stringify(events[i]));
        if (evt._scored === undefined) evt._scored = false;
        if (evt._hit === undefined) evt._hit = false;
        if (evt._miss === undefined) evt._miss = false;
        if (evt._result === undefined) evt._result = null;
        if (evt._score === undefined) evt._score = 0;
        result.push(evt);
      }
      result.sort(function(a, b) { return a.t - b.t; });
      return result;
    },

    validateEvent: function(evt) {
      var errors = [];
      if (typeof evt.t !== "number" || evt.t < 0) errors.push("Invalid time");
      if (evt.type === "chord" && (!Array.isArray(evt.notes) || evt.notes.length === 0)) errors.push("Chord event missing notes");
      if (!evt.laneLabel) errors.push("Missing laneLabel");
      return { valid: errors.length === 0, errors: errors };
    }
  };

  window.PerfChartContract = PerfChartContract;
})();
