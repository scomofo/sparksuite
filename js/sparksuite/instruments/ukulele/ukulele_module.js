(function() {
  // Six base charts. Every other skill is mapped to a clone of one of these
  // (via cloneChartWithSkill) so the rhythm engine attributes mastery to
  // the per-skill chart id rather than to the base chart's original skill.
  var UKULELE_RHYTHM_LIBRARY = {
    uke_open_strums_01: {
      id: "uke_open_strums_01",
      title: "Open Strums 01",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_down_strum", flags: { open: true } },
        { beat: 1, laneMask: 1, label: "Am", skillId: "uke_down_strum" },
        { beat: 2, laneMask: 5, label: "F", skillId: "uke_down_strum" },
        { beat: 3, laneMask: 6, label: "G", skillId: "uke_down_strum" },
        { beat: 4, laneMask: 8, label: "C", skillId: "uke_down_strum", flags: { open: true } },
        { beat: 5, laneMask: 1, label: "Am", skillId: "uke_down_strum" },
        { beat: 6, laneMask: 5, label: "F", skillId: "uke_down_strum" },
        { beat: 7, laneMask: 6, label: "G", skillId: "uke_down_strum", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Open Loop", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    uke_switch_flow_01: {
      id: "uke_switch_flow_01",
      title: "Switch Flow 01",
      bpm: 74,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_chord_switching" },
        { beat: 2, laneMask: 1, label: "Am", skillId: "uke_chord_switching" },
        { beat: 4, laneMask: 5, label: "F", skillId: "uke_chord_switching" },
        { beat: 6, laneMask: 6, label: "G", skillId: "uke_chord_switching", flags: { forced: true } },
        { beat: 8, laneMask: 8, label: "C", skillId: "uke_chord_switching" },
        { beat: 10, laneMask: 1, label: "Am", skillId: "uke_chord_switching" },
        { beat: 12, laneMask: 5, label: "F", skillId: "uke_chord_switching" },
        { beat: 14, laneMask: 6, label: "G", skillId: "uke_chord_switching", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Switch A", startBeat: 0, endBeat: 8, flags: {} },
        { id: 1, name: "Switch B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    uke_island_pattern_01: {
      id: "uke_island_pattern_01",
      title: "Island Pattern 01",
      bpm: 76,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_island_strum" },
        { beat: 1, laneMask: 8, label: "C", skillId: "uke_island_strum", flags: { tap: true } },
        { beat: 2, laneMask: 1, label: "Am", skillId: "uke_island_strum" },
        { beat: 3, laneMask: 1, label: "Am", skillId: "uke_island_strum", flags: { tap: true } },
        { beat: 4, laneMask: 5, label: "F", skillId: "uke_island_strum" },
        { beat: 5, laneMask: 5, label: "F", skillId: "uke_island_strum" },
        { beat: 6, laneMask: 6, label: "G", skillId: "uke_island_strum", flags: { specialPhrase: true } },
        { beat: 7, laneMask: 6, label: "G", skillId: "uke_island_strum", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Pattern A", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    uke_pick_arpeggio_01: {
      id: "uke_pick_arpeggio_01",
      title: "Pick Arpeggio 01",
      bpm: 68,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 1, laneMask: 4, label: "E", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 2, laneMask: 2, label: "G", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 3, laneMask: 1, label: "A", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 4, laneMask: 1, label: "A", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 5, laneMask: 2, label: "G", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 6, laneMask: 4, label: "E", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 7, laneMask: 8, label: "C", skillId: "uke_fingerpicking", flags: { specialPhrase: true, tap: true } }
      ],
      phrases: [
        { id: 0, name: "Arpeggio", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    uke_melody_lift_01: {
      id: "uke_melody_lift_01",
      title: "Melody Lift 01",
      bpm: 80,
      enginePreset: "spark_balanced",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_melody" },
        { beat: 1, laneMask: 4, label: "E", skillId: "uke_melody", flags: { tap: true } },
        { beat: 2, laneMask: 2, label: "G", skillId: "uke_melody" },
        { beat: 3, laneMask: 1, label: "A", skillId: "uke_melody", flags: { tap: true } },
        { beat: 4, laneMask: 2, label: "G", skillId: "uke_melody" },
        { beat: 5, laneMask: 4, label: "E", skillId: "uke_melody" },
        { beat: 6, laneMask: 8, label: "C", skillId: "uke_melody" },
        { beat: 7, laneMask: 1, label: "A", skillId: "uke_melody", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 1, label: "A", skillId: "uke_melody" },
        { beat: 9, laneMask: 2, label: "B", skillId: "uke_melody", flags: { tap: true } },
        { beat: 10, laneMask: 4, label: "C", skillId: "uke_melody" },
        { beat: 11, laneMask: 2, label: "B", skillId: "uke_melody", flags: { tap: true } },
        { beat: 12, laneMask: 1, label: "A", skillId: "uke_melody" },
        { beat: 13, laneMask: 2, label: "G", skillId: "uke_melody" },
        { beat: 14, laneMask: 4, label: "E", skillId: "uke_melody" },
        { beat: 15, laneMask: 8, label: "C", skillId: "uke_melody", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Lift A", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Lift B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    uke_stage_flow_01: {
      id: "uke_stage_flow_01",
      title: "Stage Flow 01",
      bpm: 86,
      enginePreset: "spark_challenge",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "uke_performance_set" },
        { beat: 1, laneMask: 8, label: "C", skillId: "uke_performance_set", flags: { tap: true } },
        { beat: 2, laneMask: 1, label: "Am", skillId: "uke_performance_set" },
        { beat: 3, laneMask: 5, label: "F", skillId: "uke_performance_set", flags: { forced: true } },
        { beat: 4, laneMask: 6, label: "G", skillId: "uke_performance_set" },
        { beat: 5, laneMask: 2, label: "B", skillId: "uke_melody", flags: { tap: true } },
        { beat: 6, laneMask: 1, label: "A", skillId: "uke_melody" },
        { beat: 7, laneMask: 6, label: "G", skillId: "uke_performance_set", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 8, label: "C", skillId: "uke_performance_set" },
        { beat: 9, laneMask: 4, label: "E", skillId: "uke_fingerpicking", flags: { tap: true } },
        { beat: 10, laneMask: 1, label: "Am", skillId: "uke_performance_set" },
        { beat: 11, laneMask: 5, label: "F", skillId: "uke_performance_set", flags: { forced: true } },
        { beat: 12, laneMask: 6, label: "G", skillId: "uke_performance_set" },
        { beat: 13, laneMask: 2, label: "B", skillId: "uke_melody", flags: { tap: true } },
        { beat: 14, laneMask: 1, label: "A", skillId: "uke_melody" },
        { beat: 15, laneMask: 8, label: "C", skillId: "uke_performance_set", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Stage A", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Stage B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };

  // Clone a base chart, retitle it, and re-tag every note's skillId so
  // mastery tracking attributes play time to the new skill rather than the
  // base chart's original skill.
  function cloneChartWithSkill(srcId, newId, newTitle, newSkillId, bpmOverride) {
    var src = UKULELE_RHYTHM_LIBRARY[srcId];
    if (!src) return;
    var clone = {
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
    UKULELE_RHYTHM_LIBRARY[newId] = clone;
  }

  // Foundations (slow, single-string-feel pulse)
  cloneChartWithSkill("uke_open_strums_01", "uke_orientation_01",      "Orientation Pulse 01",     "uke_orientation",       60);
  cloneChartWithSkill("uke_open_strums_01", "uke_tuning_check_01",     "Tuning Check 01",          "uke_tuning",            60);
  cloneChartWithSkill("uke_open_strums_01", "uke_c6_sound_01",         "Open C6 Sound 01",         "uke_c6_sound",          66);
  cloneChartWithSkill("uke_open_strums_01", "uke_quarter_count_01",    "Quarter Count 01",         "uke_quarter_counting",  68);

  // Single-chord pulses
  cloneChartWithSkill("uke_open_strums_01", "uke_c_chord_pulse_01",    "C Chord Pulse 01",         "uke_c_chord");
  cloneChartWithSkill("uke_open_strums_01", "uke_am_chord_pulse_01",   "Am Chord Pulse 01",        "uke_am_chord");
  cloneChartWithSkill("uke_open_strums_01", "uke_f_chord_pulse_01",    "F Chord Pulse 01",         "uke_f_chord");
  cloneChartWithSkill("uke_open_strums_01", "uke_g7_chord_pulse_01",   "G7 Chord Pulse 01",        "uke_g7_chord");
  cloneChartWithSkill("uke_open_strums_01", "uke_g_chord_pulse_01",    "G Chord Pulse 01",         "uke_g_chord");

  // Switching / progressions
  cloneChartWithSkill("uke_switch_flow_01", "uke_two_chord_song_01",   "Two-Chord Song 01",        "uke_two_chord_song",    72);
  cloneChartWithSkill("uke_switch_flow_01", "uke_four_chord_loop_01",  "Four-Chord Loop 01",       "uke_four_chord_loop",   78);

  // Strumming variations
  cloneChartWithSkill("uke_island_pattern_01", "uke_eighth_strum_01",  "Eighth Strum 01",          "uke_eighth_strum",      80);
  cloneChartWithSkill("uke_island_pattern_01", "uke_down_up_strum_01", "Down-Up Strum 01",         "uke_down_up_strum",     78);
  cloneChartWithSkill("uke_island_pattern_01", "uke_chuck_intro_01",   "Chuck Intro 01",           "uke_chuck",             82);
  cloneChartWithSkill("uke_island_pattern_01", "uke_styles_swing_01",  "Style Strums 01",          "uke_styles",            88);

  // Lead / scales
  cloneChartWithSkill("uke_melody_lift_01", "uke_c_scale_climb_01",    "C Scale Climb 01",         "uke_c_scale",           76);

  // Performance / phrase retry
  cloneChartWithSkill("uke_stage_flow_01", "uke_song_run_01",          "Song Run 01",              "uke_song",              82);
  cloneChartWithSkill("uke_stage_flow_01", "uke_phrase_retry_01",      "Phrase Retry 01",          "uke_phrase_retry",      80);

  // Skill → chart routing for the rhythm engine.
  var UKULELE_SKILL_CHART_MAP = {
    uke_orientation:      "uke_orientation_01",
    uke_tuning:           "uke_tuning_check_01",
    uke_c6_sound:         "uke_c6_sound_01",
    uke_down_strum:       "uke_open_strums_01",
    uke_quarter_counting: "uke_quarter_count_01",
    uke_c_chord:          "uke_c_chord_pulse_01",
    uke_am_chord:         "uke_am_chord_pulse_01",
    uke_f_chord:          "uke_f_chord_pulse_01",
    uke_g7_chord:         "uke_g7_chord_pulse_01",
    uke_g_chord:          "uke_g_chord_pulse_01",
    uke_two_chord_song:   "uke_two_chord_song_01",
    uke_chord_switching:  "uke_switch_flow_01",
    uke_four_chord_loop:  "uke_four_chord_loop_01",
    uke_eighth_strum:     "uke_eighth_strum_01",
    uke_down_up_strum:    "uke_down_up_strum_01",
    uke_island_strum:     "uke_island_pattern_01",
    uke_chuck:            "uke_chuck_intro_01",
    uke_fingerpicking:    "uke_pick_arpeggio_01",
    uke_c_scale:          "uke_c_scale_climb_01",
    uke_melody:           "uke_melody_lift_01",
    uke_styles:           "uke_styles_swing_01",
    uke_song:             "uke_song_run_01",
    uke_phrase_retry:     "uke_phrase_retry_01",
    uke_performance_set:  "uke_stage_flow_01"
  };

  var UKULELE_RECOMMENDATION_HINTS = {
    uke_orientation:      { priorityBoost: 0,  reason: "Get comfortable holding the uke before adding any motion.",            focusTag: "orientation" },
    uke_tuning:           { priorityBoost: 0,  reason: "A quick tune-up so every strum sounds clean.",                          focusTag: "tuning" },
    uke_c6_sound:         { priorityBoost: 1,  reason: "Hear the open C6 ring so future chords have something to compare to.",   focusTag: "sound" },
    uke_down_strum:       { priorityBoost: 1,  reason: "Lock in steady down-strums before adding movement.",                     focusTag: "groove" },
    uke_quarter_counting: { priorityBoost: 2,  reason: "Anchor the strum to a slow quarter-note count.",                          focusTag: "rhythm" },
    uke_c_chord:          { priorityBoost: 2,  reason: "Land the one-finger C cleanly so first songs feel easy.",                 focusTag: "chord" },
    uke_am_chord:         { priorityBoost: 3,  reason: "Pair Am with C — you're one chord away from a tiny song.",                focusTag: "chord" },
    uke_f_chord:          { priorityBoost: 3,  reason: "Add F so most campfire progressions open up.",                            focusTag: "chord" },
    uke_g7_chord:         { priorityBoost: 4,  reason: "Drop in G7 to hear the strong pull back to C.",                           focusTag: "chord" },
    uke_g_chord:          { priorityBoost: 4,  reason: "Add G alongside G7 so you have both options.",                             focusTag: "chord" },
    uke_two_chord_song:   { priorityBoost: 5,  reason: "Stitch C and Am into a real song loop for an early payoff.",              focusTag: "song" },
    uke_chord_switching:  { priorityBoost: 5,  reason: "Smooth out the common C-Am-F-G7 switch path.",                            focusTag: "switches" },
    uke_four_chord_loop:  { priorityBoost: 6,  reason: "Run the full C-Am-F-G7 loop to connect every switch you've learned.",     focusTag: "progression" },
    uke_eighth_strum:     { priorityBoost: 6,  reason: "Add eighth-note feel so strums breathe with the music.",                  focusTag: "rhythm" },
    uke_down_up_strum:    { priorityBoost: 7,  reason: "Keep the strum hand alternating down-up so groove stays alive.",          focusTag: "rhythm" },
    uke_island_strum:     { priorityBoost: 7,  reason: "Build the signature D-DU-UDU island feel.",                                focusTag: "patterns" },
    uke_chuck:            { priorityBoost: 8,  reason: "Add the percussive chuck to give rhythms space.",                          focusTag: "percussion" },
    uke_fingerpicking:    { priorityBoost: 8,  reason: "Develop independent finger motion with a steady arpeggio pulse.",          focusTag: "fingerpicking" },
    uke_c_scale:          { priorityBoost: 9,  reason: "Map the C scale across the neck so melodies have a home.",                 focusTag: "scale" },
    uke_melody:           { priorityBoost: 9,  reason: "Pull lead notes out of chord shapes so the neck feels musical.",            focusTag: "melody" },
    uke_styles:           { priorityBoost: 10, reason: "Layer swing and reggae feels onto the patterns you already know.",          focusTag: "style" },
    uke_song:             { priorityBoost: 10, reason: "Use a full song to glue rhythm, switches, and groove together.",            focusTag: "song" },
    uke_phrase_retry:     { priorityBoost: 11, reason: "Loop the weakest phrase until the rough spot disappears.",                  focusTag: "phrase_retry" },
    uke_performance_set:  { priorityBoost: 12, reason: "Turn the current skill stack into a confident playthrough set.",            focusTag: "performance" }
  };

  function UkuleleRhythmAdapter() {
    this.chartIO = new SparkChartIO();
  }

  UkuleleRhythmAdapter.prototype.getLaneCount = function() {
    return 4;
  };

  UkuleleRhythmAdapter.prototype.getLaneLabels = function() {
    return ["G", "C", "E", "A"];
  };

  UkuleleRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  UkuleleRhythmAdapter.prototype.createPayload = function(context) {
    var chartDefinition = selectUkuleleChartDefinition(context);
    return {
      chartId: chartDefinition.id,
      adapterType: "ukulele",
      enginePreset: chartDefinition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showChordNames: true,
        failDisabled: true
      },
      songChart: this.chartIO.fromExerciseDefinition(chartDefinition, this)
    };
  };

  function selectUkuleleChartDefinition(context) {
    context = context || {};
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var skill = getLessonSkill(lessonId);
    var chartId = UKULELE_SKILL_CHART_MAP[skill] || "uke_open_strums_01";
    if (context.segment && context.segment.meta && context.segment.meta.skill) {
      chartId = UKULELE_SKILL_CHART_MAP[context.segment.meta.skill] || chartId;
    }
    return getUkuleleChartDefinition(chartId);
  }

  function getLessonSkill(lessonId) {
    var lessons = window.SparkUkuleleLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i].skill;
    }
    return "uke_down_strum";
  }

  function getUkuleleChartDefinition(chartId) {
    return UKULELE_RHYTHM_LIBRARY[chartId] || UKULELE_RHYTHM_LIBRARY.uke_open_strums_01;
  }

  window.SparkUkuleleModule = {
    id: "ukulele",
    appId: "ukespark",
    name: "Ukulele",

    getSkillTree: function() {
      return window.SparkUkuleleSkillTree || [];
    },

    getCurriculum: function() {
      return window.SparkUkuleleCurriculum || null;
    },

    getLessons: function() {
      return window.SparkUkuleleLessons || [];
    },

    getCurriculumMap: function() {
      return this.getLessons();
    },

    getChords: function() {
      return window.SparkUkuleleChords || {};
    },

    getScales: function() {
      return window.SparkUkuleleScales || {};
    },

    getExercises: function(skillOrLessonId) {
      var lib = window.SparkUkuleleExercises || {};
      return lib[skillOrLessonId] || [];
    },

    getTuning: function() {
      return window.SparkUkuleleTuning || null;
    },

    getPacks: function() {
      return window.SparkUkulelePacks || [];
    },

    getProgressionRules: function() {
      return {
        masteryWeights: {
          chordShapeAccuracy: 0.25,
          switchSmoothness: 0.20,
          strumTiming: 0.25,
          patternConsistency: 0.15,
          songCompletion: 0.10,
          relaxationConsistency: 0.05
        },
        softUnlockThreshold: 0.55,
        defaultMasteryRequired: 0.75
      };
    },

    getRuntimeAdapter: function() {
      return window.SparkUkuleleRuntimeAdapter || null;
    },

    getCapabilities: function() {
      return {
        stringCount: 4,
        keyCount: null,
        supportsChords: true,
        supportsScales: true,
        supportsStrumming: true,
        supportsFingerpicking: true,
        supportsMelody: true,
        preferredRenderer: "string-lane-highway",
        inputModes: ["keyboard", "midi", "mouse"]
      };
    },

    getSongs: function() {
      return window.SparkUkuleleRepertoire || [];
    },

    getSongLibrary: function() {
      return window.SparkUkuleleSongs || {};
    },

    getPracticeRecommendation: function(lesson, exercise, state) {
      lesson = lesson || {};
      exercise = exercise || {};
      state = state || {};
      var hint = UKULELE_RECOMMENDATION_HINTS[lesson.skill] || {
        priorityBoost: 0,
        reason: "Continue ukulele progression.",
        focusTag: "ukulele"
      };
      var completedCount = Array.isArray(state.completedLessonIds) ? state.completedLessonIds.length : 0;
      var progressSummary = typeof summarizeUkuleleSkillProgress === "function"
        ? summarizeUkuleleSkillProgress(lesson.skill, state)
        : null;
      var reason = hint.reason;
      var priorityBoost = hint.priorityBoost + Math.min(4, Math.floor(completedCount / 2));
      if (progressSummary) {
        priorityBoost += progressSummary.stage === "developing" ? 3 : progressSummary.stage === "steady" ? 1 : 0;
        reason = "Ukulele " + progressSummary.weakestMetric + " is at " + Math.round(progressSummary[progressSummary.weakestMetric] * 100) + "%, so " + hint.reason.toLowerCase();
      }
      return {
        priorityBoost: priorityBoost,
        reason: reason,
        focusTag: hint.focusTag,
        labelSuffix: exercise.type === "performance" ? "Performance" : null,
        progressSummary: progressSummary
      };
    },

    getRhythmAdapter: function() {
      return new UkuleleRhythmAdapter();
    },

    getRhythmChartLibrary: function() {
      return UKULELE_RHYTHM_LIBRARY;
    }
  };

  window.SparkUkuleleRhythmAdapter = UkuleleRhythmAdapter;
  window.SparkUkuleleChartLibrary = {
    getChartDefinition: getUkuleleChartDefinition,
    getAll: function() {
      return UKULELE_RHYTHM_LIBRARY;
    }
  };
})();
