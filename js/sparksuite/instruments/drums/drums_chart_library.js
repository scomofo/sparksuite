(function() {
  var CHARTS = {
    drums_lane_tap_01: {
      id: "drums_lane_tap_01",
      title: "Lane Tap Orientation",
      bpm: 60,
      enginePreset: "spark_learning",
      totalBeats: 8,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 1, lane: "kick", limb: "right_foot", skillId: "kit_orientation" },
        { beat: 1, laneMask: 2, lane: "snare", limb: "left_hand", skillId: "kit_orientation" },
        { beat: 2, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "kit_orientation" },
        { beat: 3, laneMask: 1, lane: "kick", limb: "right_foot", skillId: "kit_orientation" }
      ],
      phrases: [{ id: 0, name: "Kit lanes", startBeat: 0, endBeat: 4 }]
    },

    drums_quarter_tap_01: {
      id: "drums_quarter_tap_01",
      title: "Quarter Note Pulse",
      bpm: 64,
      enginePreset: "spark_learning",
      totalBeats: 8,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "counting_quarters" },
        { beat: 1, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "counting_quarters" },
        { beat: 2, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "counting_quarters" },
        { beat: 3, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "counting_quarters" }
      ],
      phrases: [{ id: 0, name: "Count 1-2-3-4", startBeat: 0, endBeat: 4 }]
    },

    drums_single_stroke_01: {
      id: "drums_single_stroke_01",
      title: "Single Strokes",
      bpm: 68,
      enginePreset: "spark_learning",
      totalBeats: 8,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 2, lane: "snare", limb: "right_hand", skillId: "single_strokes" },
        { beat: 1, laneMask: 2, lane: "snare", limb: "left_hand", skillId: "single_strokes" },
        { beat: 2, laneMask: 2, lane: "snare", limb: "right_hand", skillId: "single_strokes" },
        { beat: 3, laneMask: 2, lane: "snare", limb: "left_hand", skillId: "single_strokes" }
      ],
      phrases: [{ id: 0, name: "R-L-R-L", startBeat: 0, endBeat: 4 }]
    },

    drums_click_lock_01: {
      id: "drums_click_lock_01",
      title: "Lock to Click",
      bpm: 70,
      enginePreset: "spark_learning",
      totalBeats: 8,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 1, lane: "kick", limb: "right_foot", skillId: "metronome_lock" },
        { beat: 1, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "metronome_lock" },
        { beat: 2, laneMask: 2, lane: "snare", limb: "left_hand", skillId: "metronome_lock" },
        { beat: 3, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "metronome_lock" }
      ],
      phrases: [{ id: 0, name: "Click lock", startBeat: 0, endBeat: 4 }]
    },

    drums_kick_01: {
      id: "drums_kick_01",
      title: "Kick on Beat 1",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 8,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 1, lane: "kick", limb: "right_foot", skillId: "kick_control" },
        { beat: 1, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "kick_control" },
        { beat: 2, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "kick_control" },
        { beat: 3, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "kick_control" }
      ],
      phrases: [{ id: 0, name: "Kick plus time", startBeat: 0, endBeat: 4 }]
    },

    drums_backbeat_01: {
      id: "drums_backbeat_01",
      title: "First Backbeat",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 16,
      laneCount: 3,
      laneLabels: ["Kick", "Snare", "Hat"],
      notes: [
        { beat: 0, laneMask: 5, lane: "kick+hat", limb: "right_foot+right_hand", skillId: "basic_backbeat" },
        { beat: 1, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "basic_backbeat" },
        { beat: 2, laneMask: 6, lane: "snare+hat", limb: "left_hand+right_hand", skillId: "basic_backbeat" },
        { beat: 3, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "basic_backbeat" },
        { beat: 4, laneMask: 5, lane: "kick+hat", limb: "right_foot+right_hand", skillId: "basic_backbeat" },
        { beat: 5, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "basic_backbeat" },
        { beat: 6, laneMask: 6, lane: "snare+hat", limb: "left_hand+right_hand", skillId: "basic_backbeat" },
        { beat: 7, laneMask: 4, lane: "hi_hat_closed", limb: "right_hand", skillId: "basic_backbeat" }
      ],
      phrases: [{ id: 0, name: "Backbeat", startBeat: 0, endBeat: 8 }]
    }
  };

  window.SparkDrumsChartLibrary = {
    getChartDefinition: function(chartId) {
      return CHARTS[chartId] || CHARTS.drums_lane_tap_01;
    },
    getAll: function() {
      return CHARTS;
    }
  };
})();
