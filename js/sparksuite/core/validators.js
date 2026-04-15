(function() {
  "use strict";

  // Strict contract enforcement for chart events, inputs, and performance data.
  var SparkValidators = {

    // Throws if event.time is not a number, if event.type is missing,
    // or if event.duration is not a number. Returns the event.
    validateChartEvent: function(event) {
      if (typeof event.time !== "number" || isNaN(event.time)) {
        var msg = "validateChartEvent: event.time must be a number, got " + typeof event.time;
        if (window.SparkLog && typeof window.SparkLog.error === "function") {
          window.SparkLog.error(msg);
        }
        throw new Error(msg);
      }
      if (!event.type) {
        var msg2 = "validateChartEvent: event.type is missing";
        if (window.SparkLog && typeof window.SparkLog.error === "function") {
          window.SparkLog.error(msg2);
        }
        throw new Error(msg2);
      }
      if (typeof event.duration !== "number" || isNaN(event.duration)) {
        var msg3 = "validateChartEvent: event.duration must be a number, got " + typeof event.duration;
        if (window.SparkLog && typeof window.SparkLog.error === "function") {
          window.SparkLog.error(msg3);
        }
        throw new Error(msg3);
      }
      return event;
    },

    // Throws if input.time is not a number. Defaults input.note to null,
    // input.chord to null, input.confidence to 0 if missing. Returns the input.
    validateInput: function(input) {
      if (typeof input.time !== "number" || isNaN(input.time)) {
        var msg = "validateInput: input.time must be a number, got " + typeof input.time;
        if (window.SparkLog && typeof window.SparkLog.error === "function") {
          window.SparkLog.error(msg);
        }
        throw new Error(msg);
      }
      if (input.note === undefined) {
        input.note = null;
      }
      if (input.chord === undefined) {
        input.chord = null;
      }
      if (input.confidence === undefined || typeof input.confidence !== "number") {
        input.confidence = 0;
      }
      return input;
    },

    // Validates chart has a getTimeline method or a timeline array.
    // Validates each event via validateChartEvent. Returns event count.
    validateChart: function(chart) {
      var timeline;
      if (typeof chart.getTimeline === "function") {
        timeline = chart.getTimeline();
      } else if (Array.isArray(chart.timeline)) {
        timeline = chart.timeline;
      } else {
        var msg = "validateChart: chart must have a getTimeline method or a timeline array";
        if (window.SparkLog && typeof window.SparkLog.error === "function") {
          window.SparkLog.error(msg);
        }
        throw new Error(msg);
      }
      for (var i = 0; i < timeline.length; i++) {
        this.validateChartEvent(timeline[i]);
      }
      return timeline.length;
    },

    // Ensures accuracy, timing, consistency are numbers between 0 and 1.
    // Clamps them. Returns the perf object.
    validatePerformance: function(perf) {
      var fields = ["accuracy", "timing", "consistency"];
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (typeof perf[field] !== "number" || isNaN(perf[field])) {
          var msg = "validatePerformance: " + field + " must be a number, got " + typeof perf[field];
          if (window.SparkLog && typeof window.SparkLog.error === "function") {
            window.SparkLog.error(msg);
          }
          throw new Error(msg);
        }
        // Clamp to 0-1 range
        if (perf[field] < 0) perf[field] = 0;
        if (perf[field] > 1) perf[field] = 1;
      }
      return perf;
    }
  };

  window.SparkValidators = SparkValidators;
})();
