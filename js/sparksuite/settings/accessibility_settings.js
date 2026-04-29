(function() {
  var DefaultAccessibilitySettings = Object.freeze({
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
  });

  function normalizeAccessibilitySettings(settings) {
    settings = settings && typeof settings === "object" ? settings : {};
    return {
      reducedMotion: !!settings.reducedMotion,
      highContrast: !!settings.highContrast,
      noteSize: normalizeNoteSize(settings.noteSize),
      laneLabels: settings.laneLabels !== false,
      colorblindSafeLanes: !!settings.colorblindSafeLanes,
      metronomeVisualOnly: !!settings.metronomeVisualOnly,
      disableFailureAnimations: !!settings.disableFailureAnimations,
      keyboardRemapping: normalizeKeyboardRemapping(settings.keyboardRemapping),
      leftHandedLayout: !!settings.leftHandedLayout,
      slowerDefaultSpeed: !!settings.slowerDefaultSpeed,
      audioCueVolume: normalizeUnit(settings.audioCueVolume, DefaultAccessibilitySettings.audioCueVolume),
      metronomeVolume: normalizeUnit(settings.metronomeVolume, DefaultAccessibilitySettings.metronomeVolume)
    };
  }

  function normalizeNoteSize(value) {
    if (value === "large" || value === "compact") return value;
    return "normal";
  }

  function normalizeKeyboardRemapping(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? clone(value)
      : {};
  }

  function normalizeUnit(value, fallback) {
    var next = typeof value === "number" && isFinite(value) ? value : fallback;
    return Math.max(0, Math.min(1, next));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  if (typeof window !== "undefined") {
    window.SparkDefaultAccessibilitySettings = DefaultAccessibilitySettings;
    window.SparkNormalizeAccessibilitySettings = normalizeAccessibilitySettings;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkDefaultAccessibilitySettings = DefaultAccessibilitySettings;
    globalThis.SparkNormalizeAccessibilitySettings = normalizeAccessibilitySettings;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      DefaultAccessibilitySettings: DefaultAccessibilitySettings,
      normalizeAccessibilitySettings: normalizeAccessibilitySettings
    };
  }
})();
