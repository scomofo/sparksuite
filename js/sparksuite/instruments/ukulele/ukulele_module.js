(function() {
  var UKULELE_RHYTHM_LIBRARY = {
    uke_open_strums_01: {
      id: "uke_open_strums_01",
      title: "Open Strums 01",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "C", skillId: "down_strum", flags: { open: true } },
        { beat: 1, laneMask: 1, label: "Am", skillId: "basic_chords" },
        { beat: 2, laneMask: 5, label: "F", skillId: "basic_chords" },
        { beat: 3, laneMask: 6, label: "G", skillId: "chord_switching" },
        { beat: 4, laneMask: 8, label: "C", skillId: "down_strum", flags: { open: true } },
        { beat: 5, laneMask: 1, label: "Am", skillId: "basic_chords" },
        { beat: 6, laneMask: 5, label: "F", skillId: "basic_chords" },
        { beat: 7, laneMask: 6, label: "G", skillId: "chord_switching", flags: { specialPhrase: true } }
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
        { beat: 0, laneMask: 8, label: "C", skillId: "chord_switching" },
        { beat: 2, laneMask: 1, label: "Am", skillId: "chord_switching" },
        { beat: 4, laneMask: 5, label: "F", skillId: "chord_switching" },
        { beat: 6, laneMask: 6, label: "G", skillId: "chord_switching", flags: { forced: true } },
        { beat: 8, laneMask: 8, label: "C", skillId: "chord_switching" },
        { beat: 10, laneMask: 1, label: "Am", skillId: "chord_switching" },
        { beat: 12, laneMask: 5, label: "F", skillId: "chord_switching" },
        { beat: 14, laneMask: 6, label: "G", skillId: "chord_switching", flags: { specialPhrase: true } }
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
        { beat: 0, laneMask: 8, label: "C", skillId: "strumming_patterns" },
        { beat: 1, laneMask: 8, label: "C", skillId: "strumming_patterns", flags: { tap: true } },
        { beat: 2, laneMask: 1, label: "Am", skillId: "strumming_patterns" },
        { beat: 3, laneMask: 1, label: "Am", skillId: "strumming_patterns", flags: { tap: true } },
        { beat: 4, laneMask: 5, label: "F", skillId: "strumming_patterns" },
        { beat: 5, laneMask: 5, label: "F", skillId: "strumming_patterns" },
        { beat: 6, laneMask: 6, label: "G", skillId: "strumming_patterns", flags: { specialPhrase: true } },
        { beat: 7, laneMask: 6, label: "G", skillId: "strumming_patterns", flags: { specialPhrase: true } }
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
        { beat: 0, laneMask: 8, label: "C", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 1, laneMask: 4, label: "E", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 2, laneMask: 2, label: "G", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 3, laneMask: 1, label: "A", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 4, laneMask: 1, label: "A", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 5, laneMask: 2, label: "G", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 6, laneMask: 4, label: "E", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 7, laneMask: 8, label: "C", skillId: "fingerpicking", flags: { specialPhrase: true, tap: true } }
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
        { beat: 0, laneMask: 8, label: "C", skillId: "melody" },
        { beat: 1, laneMask: 4, label: "E", skillId: "melody", flags: { tap: true } },
        { beat: 2, laneMask: 2, label: "G", skillId: "melody" },
        { beat: 3, laneMask: 1, label: "A", skillId: "melody", flags: { tap: true } },
        { beat: 4, laneMask: 2, label: "G", skillId: "melody" },
        { beat: 5, laneMask: 4, label: "E", skillId: "melody" },
        { beat: 6, laneMask: 8, label: "C", skillId: "melody" },
        { beat: 7, laneMask: 1, label: "A", skillId: "melody", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 1, label: "A", skillId: "melody" },
        { beat: 9, laneMask: 2, label: "B", skillId: "melody", flags: { tap: true } },
        { beat: 10, laneMask: 4, label: "C", skillId: "melody" },
        { beat: 11, laneMask: 2, label: "B", skillId: "melody", flags: { tap: true } },
        { beat: 12, laneMask: 1, label: "A", skillId: "melody" },
        { beat: 13, laneMask: 2, label: "G", skillId: "melody" },
        { beat: 14, laneMask: 4, label: "E", skillId: "melody" },
        { beat: 15, laneMask: 8, label: "C", skillId: "melody", flags: { specialPhrase: true } }
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
        { beat: 0, laneMask: 8, label: "C", skillId: "performance" },
        { beat: 1, laneMask: 8, label: "C", skillId: "performance", flags: { tap: true } },
        { beat: 2, laneMask: 1, label: "Am", skillId: "performance" },
        { beat: 3, laneMask: 5, label: "F", skillId: "performance", flags: { forced: true } },
        { beat: 4, laneMask: 6, label: "G", skillId: "performance" },
        { beat: 5, laneMask: 2, label: "B", skillId: "melody", flags: { tap: true } },
        { beat: 6, laneMask: 1, label: "A", skillId: "melody" },
        { beat: 7, laneMask: 6, label: "G", skillId: "performance", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 8, label: "C", skillId: "performance" },
        { beat: 9, laneMask: 4, label: "E", skillId: "fingerpicking", flags: { tap: true } },
        { beat: 10, laneMask: 1, label: "Am", skillId: "performance" },
        { beat: 11, laneMask: 5, label: "F", skillId: "performance", flags: { forced: true } },
        { beat: 12, laneMask: 6, label: "G", skillId: "performance" },
        { beat: 13, laneMask: 2, label: "B", skillId: "melody", flags: { tap: true } },
        { beat: 14, laneMask: 1, label: "A", skillId: "melody" },
        { beat: 15, laneMask: 8, label: "C", skillId: "performance", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Stage A", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Stage B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };

  var UKULELE_SKILL_CHART_MAP = {
    down_strum: "uke_open_strums_01",
    basic_chords: "uke_open_strums_01",
    chord_switching: "uke_switch_flow_01",
    strumming_patterns: "uke_island_pattern_01",
    songs: "uke_island_pattern_01",
    fingerpicking: "uke_pick_arpeggio_01",
    melody: "uke_melody_lift_01",
    performance: "uke_stage_flow_01"
  };
  var UKULELE_RECOMMENDATION_HINTS = {
    down_strum: {
      priorityBoost: 0,
      reason: "Lock in steady down-strums before adding movement.",
      focusTag: "groove"
    },
    basic_chords: {
      priorityBoost: 1,
      reason: "Add the core campfire chords so more songs open up quickly.",
      focusTag: "chords"
    },
    chord_switching: {
      priorityBoost: 2,
      reason: "Smooth out the common C-Am-F-G switch path.",
      focusTag: "switches"
    },
    strumming_patterns: {
      priorityBoost: 3,
      reason: "Build a more musical island strum instead of straight downstrokes.",
      focusTag: "patterns"
    },
    songs: {
      priorityBoost: 4,
      reason: "Use a full progression loop to connect groove and clean changes.",
      focusTag: "song_flow"
    },
    fingerpicking: {
      priorityBoost: 6,
      reason: "Develop independent finger motion with a steady arpeggio pulse.",
      focusTag: "fingerpicking"
    },
    melody: {
      priorityBoost: 7,
      reason: "Pull lead notes out of chord shapes so the neck feels musical.",
      focusTag: "melody"
    },
    performance: {
      priorityBoost: 8,
      reason: "Turn the current skill stack into a full confident playthrough.",
      focusTag: "performance"
    }
  };

  function UkuleleRhythmAdapter() {
    this.chartIO = new SparkChartIO();
  }

  UkuleleRhythmAdapter.prototype.getLaneCount = function() {
    return 4;
  };

  UkuleleRhythmAdapter.prototype.getAdapterType = function() {
    return "ukulele";
  };

  UkuleleRhythmAdapter.prototype.getLaneLabels = function() {
    return ["G", "C", "E", "A"];
  };

  UkuleleRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  UkuleleRhythmAdapter.prototype.createPayload = function(context) {
    var chartDefinition = selectUkuleleChartDefinition(context);
    var songChart = this.chartIO.fromExerciseDefinition(chartDefinition, this);
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
      songChart: songChart,
      chart: this.chartIO.toLaneChart(songChart, this, {
        chartId: chartDefinition.id,
        laneCount: this.getLaneCount(),
        laneLabels: this.getLaneLabels()
      })
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
    return "down_strum";
  }

  function getUkuleleChartDefinition(chartId) {
    return UKULELE_RHYTHM_LIBRARY[chartId] || UKULELE_RHYTHM_LIBRARY.uke_open_strums_01;
  }

  function getSongs() {
    return [
      { title: "Island Loop", artist: "SparkSuite", progression: ["C", "Am", "F", "G"], bpm: 78, focus: "steady island groove" },
      { title: "Sunset Switches", artist: "SparkSuite", progression: ["F", "G", "Em", "Am"], bpm: 74, focus: "clean chord changes" },
      { title: "Palm Arpeggio", artist: "SparkSuite", progression: ["C", "G", "Am", "F"], bpm: 68, focus: "fingerpicked flow" },
      { title: "Moonlit Picking", artist: "SparkSuite", progression: ["Am", "F", "C", "G"], bpm: 72, focus: "steady arpeggio motion" },
      { title: "Somewhere Over the Rainbow", artist: "IZ", progression: ["C", "Em", "Am", "F"], bpm: 80, focus: "gentle fingerpick flow" },
      { title: "Riptide", artist: "Vance Joy", progression: ["Am", "G", "C", "F"], bpm: 102, focus: "quick strum changes" },
      { title: "I'm Yours", artist: "Jason Mraz", progression: ["C", "G", "Am", "F"], bpm: 76, focus: "relaxed island groove" },
      { title: "Hey Soul Sister", artist: "Train", progression: ["C", "G", "Am", "F"], bpm: 97, focus: "upbeat strumming" },
      { title: "Can't Help Falling in Love", artist: "Elvis", progression: ["C", "Em", "Am", "F", "G"], bpm: 72, focus: "slow waltz feel" },
      { title: "Count on Me", artist: "Bruno Mars", progression: ["C", "Em", "Am", "G"], bpm: 88, focus: "happy fingerpick" },
      { title: "Lava", artist: "Disney", progression: ["C", "G7", "F"], bpm: 76, focus: "simple 3-chord island" },
      { title: "Stand By Me", artist: "Ben E. King", progression: ["C", "Am", "F", "G"], bpm: 120, focus: "steady bass strum" }
    ];
  }

  window.SparkUkuleleModule = {
    id: "ukulele",
    appId: "ukespark",
    name: "Ukulele",

    getSkillTree: function() {
      return window.SparkUkuleleSkillTree || [];
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

    getExercises: function(skill) {
      var lib = window.SparkUkuleleExercises || {};
      return lib[skill] || [];
    },

    getTuning: function() {
      return window.SparkUkuleleTuning || null;
    },

    getSongs: function() {
      return getSongs();
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
        labelSuffix: exercise.type === "performance_run" ? "Performance" : null,
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
