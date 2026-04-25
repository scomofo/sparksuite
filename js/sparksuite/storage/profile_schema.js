(function() {
  var CURRENT_PROFILE_SCHEMA_VERSION = 4;

  function createAccessibilityDefaults() {
    if (typeof SparkNormalizeAccessibilitySettings === "function") {
      return SparkNormalizeAccessibilitySettings({});
    }
    return {
      reducedMotion: false,
      highContrast: false,
      noteSize: "normal",
      laneLabels: true,
      colorblindSafeLanes: false,
      metronomeVisualOnly: false,
      disableFailureAnimations: false,
      keyboardRemapping: {},
      leftHandedLayout: false,
      slowerDefaultSpeed: false,
      audioCueVolume: 0.8,
      metronomeVolume: 0.6
    };
  }

  function createDefaultProfile(userId) {
    return {
      schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
      userId: userId || "default",
      xp: 0,
      level: 1,
      selectedInstrument: "guitar",
      mastery: {},
      streaks: {},
      achievements: [],
      settings: {
        gameplay: {
          inputLatencyOffsetMs: 0,
          hitWindowMs: 140,
          noteSpeed: 0.32
        },
        accessibility: createAccessibilityDefaults()
      }
    };
  }

  if (typeof window !== "undefined") {
    window.SparkCurrentProfileSchemaVersion = CURRENT_PROFILE_SCHEMA_VERSION;
    window.SparkCreateDefaultProfile = createDefaultProfile;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkCurrentProfileSchemaVersion = CURRENT_PROFILE_SCHEMA_VERSION;
    globalThis.SparkCreateDefaultProfile = createDefaultProfile;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      CURRENT_PROFILE_SCHEMA_VERSION: CURRENT_PROFILE_SCHEMA_VERSION,
      createDefaultProfile: createDefaultProfile
    };
  }
})();
