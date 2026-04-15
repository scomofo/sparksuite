(function() {
  "use strict";

  var defaults = {
    time: 0,
    expected: null,
    detected: null,
    delta: 0,
    confidence: 0,
    chord: null,
    detectedNotes: [],
    detectedChord: null,
    feedback: null,
    aiChordErrors: null,
    aiLateHits: 0,
    aiEarlyHits: 0,
    timing: null,
    score: 0,
    rlAction: null,
    accuracy: 0,
    syncError: 0,
    bpm: 0,
    audioMode: null,
    latencyMs: 0,
    frameCount: 0
  };

  var state = {};

  function copyDefaults() {
    var keys = Object.keys(defaults);
    for (var i = 0; i < keys.length; i++) {
      state[keys[i]] = defaults[keys[i]];
    }
  }

  copyDefaults();

  state.update = function(patch) {
    if (patch && typeof patch === "object") {
      var keys = Object.keys(patch);
      for (var i = 0; i < keys.length; i++) {
        state[keys[i]] = patch[keys[i]];
      }
    }
    state.frameCount = state.frameCount + 1;
  };

  state.reset = function() {
    copyDefaults();
  };

  state.toObject = function() {
    var copy = {};
    var keys = Object.keys(defaults);
    for (var i = 0; i < keys.length; i++) {
      copy[keys[i]] = state[keys[i]];
    }
    return copy;
  };

  window.SparkDebugState = state;
})();
