(function() {
  // Vocals charts use a 5-lane pitch highway. laneMask bits map to
  // scale-degree zones returned by SparkVocalsRuntimeAdapter.getPitchLanes:
  //   bit 1 = lane_low (do, degree 1)
  //   bit 2 = lane_low_mid (re, degree 2)
  //   bit 4 = lane_mid (mi, degree 3)
  //   bit 8 = lane_high_mid (sol, degree 5)
  //   bit 16 = lane_high (la, degree 6)
  // Note labels use solfege so the renderer can show pitch words above
  // the lane indicator without needing a key. The runtime adapter chooses
  // the absolute root via getRangeProfile().
  var CHARTS = {
    voc_pitch_match_base: {
      id: "voc_pitch_match_base",
      title: "Pitch Match Base",
      bpm: 60,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1, label: "do", skillId: "pitch_matching", flags: { sustain: true } },
        { beat: 4,  laneMask: 1, label: "do", skillId: "pitch_matching", flags: { sustain: true } },
        { beat: 8,  laneMask: 1, label: "do", skillId: "pitch_matching", flags: { sustain: true } },
        { beat: 12, laneMask: 1, label: "do", skillId: "pitch_matching", flags: { sustain: true, specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Match", startBeat: 0, endBeat: 16, flags: { special: true } }
      ]
    },
    voc_call_response_base: {
      id: "voc_call_response_base",
      title: "Call & Response Base",
      bpm: 64,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1, label: "do", skillId: "call_response", flags: { call: true, sustain: true } },
        { beat: 2,  laneMask: 4, label: "mi", skillId: "call_response", flags: { call: true, sustain: true } },
        { beat: 4,  laneMask: 1, label: "do", skillId: "call_response", flags: { response: true, sustain: true } },
        { beat: 6,  laneMask: 4, label: "mi", skillId: "call_response", flags: { response: true, sustain: true } },
        { beat: 8,  laneMask: 4, label: "mi", skillId: "call_response", flags: { call: true, sustain: true } },
        { beat: 10, laneMask: 8, label: "sol",skillId: "call_response", flags: { call: true, sustain: true } },
        { beat: 12, laneMask: 4, label: "mi", skillId: "call_response", flags: { response: true, sustain: true } },
        { beat: 14, laneMask: 8, label: "sol",skillId: "call_response", flags: { response: true, sustain: true, specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Call",     startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Response", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    voc_stepwise_melody_base: {
      id: "voc_stepwise_melody_base",
      title: "Stepwise Melody Base",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1, label: "do", skillId: "stepwise_melody" },
        { beat: 1,  laneMask: 2, label: "re", skillId: "stepwise_melody" },
        { beat: 2,  laneMask: 4, label: "mi", skillId: "stepwise_melody" },
        { beat: 3,  laneMask: 2, label: "re", skillId: "stepwise_melody" },
        { beat: 4,  laneMask: 1, label: "do", skillId: "stepwise_melody", flags: { specialPhrase: true } },
        { beat: 5,  laneMask: 4, label: "mi", skillId: "stepwise_melody" },
        { beat: 6,  laneMask: 8, label: "sol",skillId: "stepwise_melody" },
        { beat: 7,  laneMask: 4, label: "mi", skillId: "stepwise_melody", flags: { specialPhrase: true } },
        { beat: 8,  laneMask: 8, label: "sol",skillId: "stepwise_melody" },
        { beat: 9,  laneMask: 16,label: "la", skillId: "stepwise_melody" },
        { beat: 10, laneMask: 8, label: "sol",skillId: "stepwise_melody" },
        { beat: 11, laneMask: 4, label: "mi", skillId: "stepwise_melody" },
        { beat: 12, laneMask: 2, label: "re", skillId: "stepwise_melody" },
        { beat: 13, laneMask: 4, label: "mi", skillId: "stepwise_melody" },
        { beat: 14, laneMask: 2, label: "re", skillId: "stepwise_melody" },
        { beat: 15, laneMask: 1, label: "do", skillId: "stepwise_melody", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Melody A", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Melody B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    voc_phrase_song_base: {
      id: "voc_phrase_song_base",
      title: "Song Phrase Base",
      bpm: 84,
      enginePreset: "spark_balanced",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 4, label: "mi", skillId: "song_phrase", flags: { sustain: true } },
        { beat: 2,  laneMask: 8, label: "sol",skillId: "song_phrase", flags: { sustain: true } },
        { beat: 4,  laneMask: 4, label: "mi", skillId: "song_phrase", flags: { sustain: true } },
        { beat: 6,  laneMask: 1, label: "do", skillId: "song_phrase", flags: { sustain: true, specialPhrase: true } },
        { beat: 8,  laneMask: 2, label: "re", skillId: "song_phrase", flags: { sustain: true } },
        { beat: 10, laneMask: 4, label: "mi", skillId: "song_phrase", flags: { sustain: true } },
        { beat: 12, laneMask: 2, label: "re", skillId: "song_phrase", flags: { sustain: true } },
        { beat: 14, laneMask: 1, label: "do", skillId: "song_phrase", flags: { sustain: true, specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Verse",  startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Chorus", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    voc_harmony_drone_base: {
      id: "voc_harmony_drone_base",
      title: "Harmony Drone Base",
      bpm: 60,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1, label: "do",   skillId: "harmony_drone", flags: { sustain: true, drone: true } },
        { beat: 4,  laneMask: 4, label: "mi",   skillId: "harmony_third", flags: { sustain: true } },
        { beat: 8,  laneMask: 1, label: "do",   skillId: "harmony_drone", flags: { sustain: true, drone: true } },
        { beat: 12, laneMask: 4, label: "mi",   skillId: "harmony_third", flags: { sustain: true, specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Drone", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Third", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    voc_stage_flow_base: {
      id: "voc_stage_flow_base",
      title: "Vocal Stage Flow Base",
      bpm: 88,
      enginePreset: "spark_challenge",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 1,  laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 2,  laneMask: 8, label: "sol",skillId: "vocal_performance_set" },
        { beat: 3,  laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 4,  laneMask: 2, label: "re", skillId: "vocal_performance_set" },
        { beat: 5,  laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 6,  laneMask: 2, label: "re", skillId: "vocal_performance_set" },
        { beat: 7,  laneMask: 1, label: "do", skillId: "vocal_performance_set", flags: { specialPhrase: true } },
        { beat: 8,  laneMask: 1, label: "do", skillId: "vocal_performance_set" },
        { beat: 9,  laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 10, laneMask: 8, label: "sol",skillId: "vocal_performance_set" },
        { beat: 11, laneMask: 16,label: "la", skillId: "vocal_performance_set", flags: { forced: true } },
        { beat: 12, laneMask: 8, label: "sol",skillId: "vocal_performance_set" },
        { beat: 13, laneMask: 4, label: "mi", skillId: "vocal_performance_set" },
        { beat: 14, laneMask: 2, label: "re", skillId: "vocal_performance_set" },
        { beat: 15, laneMask: 1, label: "do", skillId: "vocal_performance_set", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Stage A", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Stage B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };

  function cloneChartWithSkill(srcId, newId, newTitle, newSkillId, bpmOverride) {
    var src = CHARTS[srcId];
    if (!src) return;
    CHARTS[newId] = {
      id: newId,
      title: newTitle,
      bpm: typeof bpmOverride === "number" ? bpmOverride : src.bpm,
      enginePreset: src.enginePreset,
      totalBeats: src.totalBeats,
      notes: src.notes.map(function(n) {
        var copy = {};
        for (var k in n) if (Object.prototype.hasOwnProperty.call(n, k)) copy[k] = n[k];
        copy.skillId = newSkillId;
        return copy;
      }),
      phrases: src.phrases.slice()
    };
  }

  // Foundations / setup
  cloneChartWithSkill("voc_pitch_match_base", "voc_setup_comfort_01", "Comfort Setup",         "vocal_comfort_setup", 56);
  cloneChartWithSkill("voc_pitch_match_base", "voc_posture_01",       "Posture Pulse",          "vocal_posture",       58);
  cloneChartWithSkill("voc_pitch_match_base", "voc_breath_quiet_01",  "Quiet Breath",           "vocal_breath",        56);
  cloneChartWithSkill("voc_pitch_match_base", "voc_range_map_01",     "Range Map",              "range_map",           60);

  // Pitch / melody
  cloneChartWithSkill("voc_call_response_base", "voc_three_note_01",  "Three-Note Patterns",    "three_note_patterns", 68);
  cloneChartWithSkill("voc_stepwise_melody_base","voc_intervals_3rds_01","Thirds by Ear",       "intervals_3rds",      72);
  cloneChartWithSkill("voc_stepwise_melody_base","voc_major_scale_01", "Major Scale 1-5",       "major_scale_vocal",   76);

  // Timing
  cloneChartWithSkill("voc_phrase_song_base", "voc_count_entrances_01","Count Entrances",       "entrances",           70);
  cloneChartWithSkill("voc_phrase_song_base", "voc_phrase_timing_01", "Phrase Timing",          "phrase_timing",       78);
  cloneChartWithSkill("voc_phrase_song_base", "voc_syncopation_01",   "Syncopation Intro",      "syncopation_vocal",   86);

  // Tone / diction / musicality
  cloneChartWithSkill("voc_pitch_match_base", "voc_vowels_01",        "Vowels",                  "vowels",              66);
  cloneChartWithSkill("voc_pitch_match_base", "voc_resonance_01",     "Forward Resonance",       "resonance",           68);
  cloneChartWithSkill("voc_phrase_song_base", "voc_dynamics_01",      "Dynamics",                "dynamics",            74);
  cloneChartWithSkill("voc_stepwise_melody_base","voc_consonants_01", "Consonants",              "consonants",          78);

  // Songs / feedback
  cloneChartWithSkill("voc_phrase_song_base", "voc_song_short_phrase_01", "Short Song Phrase",   "song_phrase",         80);
  cloneChartWithSkill("voc_phrase_song_base", "voc_song_verse_chorus_01", "Verse and Chorus",    "verse_chorus",        84);
  cloneChartWithSkill("voc_phrase_song_base", "voc_phrase_retry_01",  "Phrase Retry",            "vocal_phrase_retry",  82);
  cloneChartWithSkill("voc_phrase_song_base", "voc_record_listen_01", "Record and Listen",       "record_listen",       80);

  // Harmony / performance
  cloneChartWithSkill("voc_call_response_base","voc_call_response_improv_01", "Call-Response Improv","call_response_improv", 88);
  cloneChartWithSkill("voc_harmony_drone_base","voc_background_vocals_01",   "Background Vocals", "background_vocals",   84);
  cloneChartWithSkill("voc_phrase_song_base", "voc_mic_technique_01", "Mic Technique",            "mic_technique",       86);
  cloneChartWithSkill("voc_phrase_song_base", "voc_confidence_take_01","Confidence Take",         "confidence_take",     88);
  cloneChartWithSkill("voc_stage_flow_base",  "voc_full_easy_song_01","Full Easy Song",           "full_vocal_song",     92);

  window.SparkVocalsChartLibrary = {
    getChartDefinition: function(chartId) {
      return CHARTS[chartId] || CHARTS.voc_pitch_match_base;
    },
    getAll: function() {
      return CHARTS;
    }
  };
})();
