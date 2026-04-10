/**
 * SparkFeelSystem — Single source of truth for animation timing,
 * audio feedback, gameplay feel, typography, and spacing constants.
 *
 * Handoffs 25 (Animation), 26 (Audio/Typography), 27 (Gameplay Feel)
 */
(function() {
  var SparkFeelSystem = {
    // === Animation Timing (Handoff 25) ===
    timing: {
      FAST: 120,    // ms
      MED: 180,
      SLOW: 240
    },
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",

    // === Gameplay Feel (Handoff 27) ===
    input: {
      INPUT_OFFSET_MS: -15,
      PERFECT_WINDOW: 30,    // ±ms
      GOOD_WINDOW: 70,
      NOTE_TRAVEL_TIME: 2000  // ms
    },

    // === Hit Animations (Handoffs 25, 27) ===
    hitAnimation: {
      perfect: { scale: 1.15, duration: 120 },
      good: { scale: 1.05, duration: 120 },
      miss: { shake: 6, duration: 120 }
    },

    // === Lane Flash ===
    laneFlash: { opacity: 0.2, duration: 100 },

    // === UI Transitions ===
    transition: {
      screen: { scale: 0.98, duration: 180 },
      button: { scale: 0.96, duration: 120 }
    },

    // === Audio Feedback Events (Handoff 26) ===
    audio: {
      hit_perfect: "tick_soft",
      hit_good: "tick_light",
      miss: "tap_low",
      menu_tap: "tap_soft"
    },

    // === Typography Scale (Handoff 26) ===
    typography: {
      h1: 28,
      h2: 20,
      body: 16,
      caption: 13
    },

    // === Spacing System (Handoff 26) ===
    spacing: [4, 8, 16, 24, 32],

    // === Results Animations (Handoff 25) ===
    results: {
      starStagger: 120,  // ms between each star
      countUpDuration: 800
    },

    // === Judgment Function (Handoff 27) ===
    judge: function(deltaMs) {
      var d = deltaMs + SparkFeelSystem.input.INPUT_OFFSET_MS;
      if (Math.abs(d) <= SparkFeelSystem.input.PERFECT_WINDOW) return "perfect";
      if (Math.abs(d) <= SparkFeelSystem.input.GOOD_WINDOW) return "good";
      return "miss";
    },

    // === Frame Timing (Handoff 28) ===
    frame: {
      TARGET_FPS: 60,
      FRAME_TIME: 16.67,
      VISUAL_OFFSET_MS: 0,
      AUDIO_OFFSET_MS: 0
    }
  };

  if (typeof window !== "undefined") window.SparkFeelSystem = SparkFeelSystem;
  if (typeof module !== "undefined") module.exports = SparkFeelSystem;
})();
