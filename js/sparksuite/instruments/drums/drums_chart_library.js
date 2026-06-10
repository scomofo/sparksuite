(function() {
  var LANES = ["Kick", "Snare", "Hat", "Aux"];

  function getMapping() {
    return window.SparkDrumsMapping || {
      semanticToLane: { kick: "kick", snare: "snare", hi_hat_closed: "hat", hi_hat_open: "aux", crash: "aux", ride: "aux", tom_high: "aux", tom_mid: "aux", tom_low: "aux", rim: "snare" },
      laneIndex: { kick: 0, snare: 1, hat: 2, aux: 3 }
    };
  }

  function laneMaskFor(semanticLane) {
    var mapping = getMapping();
    var lane = mapping.semanticToLane[semanticLane] || "aux";
    var index = mapping.laneIndex[lane];
    return 1 << (index == null ? 3 : index);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function exerciseByChartId(chartId) {
    var exercises = window.SparkDrumsExercises || [];
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i].chartId === chartId || exercises[i].id === chartId) return exercises[i];
    }
    return null;
  }

  function buildChartDefinition(chartId) {
    var exercise = exerciseByChartId(chartId) || exerciseByChartId("drums_lane_tap_01") || {
      id: "ex_drums_lane_tap_01",
      chartId: "drums_lane_tap_01",
      title: "Lane Tap Orientation",
      skill: "kit_orientation",
      patternId: "pattern_drums_lane_tap_01",
      bpm: 60
    };
    var patterns = window.SparkDrumsPatterns || {};
    var pattern = patterns[exercise.patternId] || patterns.pattern_drums_lane_tap_01 || { events: [], totalBeats: 8 };
    var notes = (pattern.events || []).map(function(event, index) {
      return {
        id: chartId + "_evt_" + (index + 1),
        beat: event.beat || 0,
        laneMask: laneMaskFor(event.lane),
        label: event.kind === "crash" ? "Crash" : event.lane,
        skillId: event.skillId || exercise.skill,
        flags: {
          semanticLane: event.lane,
          velocity: event.velocity == null ? 1 : event.velocity,
          drumKind: event.kind || "hit"
        }
      };
    });
    return {
      id: exercise.chartId || chartId,
      exerciseId: exercise.id,
      title: exercise.title,
      bpm: exercise.bpm || 72,
      enginePreset: exercise.bpm > 78 ? "spark_balanced" : "spark_learning",
      totalBeats: pattern.totalBeats || 16,
      laneCount: 4,
      laneLabels: LANES,
      timingWindowMs: { perfect: 50, good: 90, late: 135 },
      groove: { feel: "straight", swing: 0, humanizeMs: 2 },
      notes: notes,
      phrases: [
        { id: pattern.id || exercise.patternId, name: pattern.title || exercise.title, startBeat: 0, endBeat: Math.min(pattern.totalBeats || 8, 8), flags: { special: exercise.type === "fill" || exercise.type === "song" } }
      ]
    };
  }

  window.SparkDrumsChartLibrary = {
    getChartDefinition: function(id) {
      return clone(buildChartDefinition(id || "drums_lane_tap_01"));
    },
    getAll: function() {
      var out = {};
      var exercises = window.SparkDrumsExercises || [];
      for (var i = 0; i < exercises.length; i++) {
        out[exercises[i].chartId] = buildChartDefinition(exercises[i].chartId);
      }
      return out;
    },
    laneMaskFor: laneMaskFor
  };
})();
