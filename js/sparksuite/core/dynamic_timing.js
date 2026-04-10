(function() {

  // === Feel Presets ===
  var PRESETS = {
    arcade: { perfect: 25, good: 60, inputOffset: -15, label: "Arcade" },
    training: { perfect: 40, good: 90, inputOffset: -10, label: "Training" }
  };

  // === Dynamic Offset State ===
  var dynamicState = {
    offset: 0,
    recentDeltas: [],
    maxDeltas: 20
  };

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  // Record a hit delta for adaptive offset computation
  function recordDelta(deltaMs) {
    dynamicState.recentDeltas.push(deltaMs);
    if (dynamicState.recentDeltas.length > dynamicState.maxDeltas) {
      dynamicState.recentDeltas.shift();
    }
  }

  // Compute the average timing bias from recent hits
  function computeTimingBias() {
    if (dynamicState.recentDeltas.length < 5) return 0;
    var sum = 0;
    for (var i = 0; i < dynamicState.recentDeltas.length; i++) {
      sum += dynamicState.recentDeltas[i];
    }
    return sum / dynamicState.recentDeltas.length;
  }

  // Update dynamic offset (call periodically, e.g., every 10 hits)
  function updateDynamicOffset() {
    var bias = computeTimingBias();
    // Gradual adjustment: move 10% toward correcting the bias
    dynamicState.offset = clamp(
      dynamicState.offset - bias * 0.1,
      -40, 40
    );
    return dynamicState.offset;
  }

  function getDynamicOffset() {
    return dynamicState.offset;
  }

  function resetDynamic() {
    dynamicState.offset = 0;
    dynamicState.recentDeltas = [];
  }

  // === Player Profile ===
  function createProfile() {
    return {
      preferredOffset: -15,
      consistency: 0.5,
      timingBias: "neutral",   // "early" | "neutral" | "late"
      preset: "arcade"
    };
  }

  function updateProfile(profile) {
    // Smooth the dynamic offset into the preferred offset
    profile.preferredOffset = Math.round(
      0.8 * profile.preferredOffset + 0.2 * (profile.preferredOffset + dynamicState.offset)
    );

    // Classify timing bias
    var bias = computeTimingBias();
    if (bias > 10) profile.timingBias = "late";
    else if (bias < -10) profile.timingBias = "early";
    else profile.timingBias = "neutral";

    // Consistency: lower variance = higher consistency
    if (dynamicState.recentDeltas.length >= 5) {
      var mean = computeTimingBias();
      var variance = 0;
      for (var i = 0; i < dynamicState.recentDeltas.length; i++) {
        var diff = dynamicState.recentDeltas[i] - mean;
        variance += diff * diff;
      }
      variance /= dynamicState.recentDeltas.length;
      // Map variance to 0-1: variance of 0 = 1.0, variance of 2500 (50ms std) = 0
      profile.consistency = clamp(1 - (variance / 2500), 0, 1);
      profile.consistency = Math.round(profile.consistency * 100) / 100;
    }

    return profile;
  }

  // === Preset Application ===
  function getPreset(name) {
    return PRESETS[name] || PRESETS.arcade;
  }

  function applyPreset(name) {
    var p = getPreset(name);
    if (typeof window.SparkFeelSystem !== "undefined") {
      window.SparkFeelSystem.input.PERFECT_WINDOW = p.perfect;
      window.SparkFeelSystem.input.GOOD_WINDOW = p.good;
      window.SparkFeelSystem.input.INPUT_OFFSET_MS = p.inputOffset;
    }
    return p;
  }

  function getPresetList() {
    var list = [];
    for (var key in PRESETS) {
      list.push({ id: key, label: PRESETS[key].label, perfect: PRESETS[key].perfect, good: PRESETS[key].good });
    }
    return list;
  }

  var SparkDynamicTiming = {
    recordDelta: recordDelta,
    computeTimingBias: computeTimingBias,
    updateDynamicOffset: updateDynamicOffset,
    getDynamicOffset: getDynamicOffset,
    resetDynamic: resetDynamic,
    createProfile: createProfile,
    updateProfile: updateProfile,
    getPreset: getPreset,
    applyPreset: applyPreset,
    getPresetList: getPresetList,
    PRESETS: PRESETS
  };

  if (typeof window !== "undefined") window.SparkDynamicTiming = SparkDynamicTiming;
  if (typeof module !== "undefined") module.exports = SparkDynamicTiming;
})();
