(function() {
  var BASS_RHYTHM_LIBRARY = {
    bass_root_pulse_01: {
      id: "bass_root_pulse_01",
      title: "Root Pulse 01",
      bpm: 68,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "E", skillId: "root_notes" },
        { beat: 2, laneMask: 8, label: "E", skillId: "root_notes" },
        { beat: 4, laneMask: 4, label: "A", skillId: "root_notes" },
        { beat: 6, laneMask: 4, label: "A", skillId: "root_notes" },
        { beat: 8, laneMask: 8, label: "E", skillId: "quarter_notes" },
        { beat: 10, laneMask: 8, label: "E", skillId: "quarter_notes" },
        { beat: 12, laneMask: 4, label: "A", skillId: "quarter_notes" },
        { beat: 14, laneMask: 4, label: "A", skillId: "quarter_notes", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Root Pulse", startBeat: 0, endBeat: 16, flags: { special: true } }
      ]
    },
    bass_fifth_drive_01: {
      id: "bass_fifth_drive_01",
      title: "Fifth Drive 01",
      bpm: 82,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "E", skillId: "root_fifth" },
        { beat: 1, laneMask: 2, label: "B", skillId: "root_fifth" },
        { beat: 2, laneMask: 8, label: "E", skillId: "root_fifth" },
        { beat: 3, laneMask: 2, label: "B", skillId: "root_fifth" },
        { beat: 4, laneMask: 4, label: "A", skillId: "octaves" },
        { beat: 5, laneMask: 1, label: "E", skillId: "octaves" },
        { beat: 6, laneMask: 4, label: "A", skillId: "octaves" },
        { beat: 7, laneMask: 1, label: "E", skillId: "octaves" },
        { beat: 8, laneMask: 8, label: "E", skillId: "eighth_notes" },
        { beat: 9, laneMask: 2, label: "B", skillId: "eighth_notes" },
        { beat: 10, laneMask: 8, label: "E", skillId: "eighth_notes" },
        { beat: 11, laneMask: 2, label: "B", skillId: "eighth_notes" },
        { beat: 12, laneMask: 4, label: "A", skillId: "eighth_notes" },
        { beat: 13, laneMask: 1, label: "E", skillId: "eighth_notes" },
        { beat: 14, laneMask: 4, label: "A", skillId: "eighth_notes" },
        { beat: 15, laneMask: 1, label: "E", skillId: "eighth_notes", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Drive A", startBeat: 0, endBeat: 8, flags: {} },
        { id: 1, name: "Drive B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    bass_walk_intro_01: {
      id: "bass_walk_intro_01",
      title: "Walk Intro 01",
      bpm: 92,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 4, label: "C", skillId: "walking_bass" },
        { beat: 1, laneMask: 2, label: "E", skillId: "walking_bass" },
        { beat: 2, laneMask: 1, label: "G", skillId: "walking_bass" },
        { beat: 3, laneMask: 2, label: "A", skillId: "passing_notes", flags: { tap: true } },
        { beat: 4, laneMask: 8, label: "B", skillId: "passing_notes" },
        { beat: 5, laneMask: 4, label: "C", skillId: "walking_bass" },
        { beat: 6, laneMask: 2, label: "D", skillId: "walking_bass" },
        { beat: 7, laneMask: 1, label: "E", skillId: "walking_bass", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 4, label: "F", skillId: "arpeggios" },
        { beat: 9, laneMask: 2, label: "A", skillId: "arpeggios" },
        { beat: 10, laneMask: 1, label: "C", skillId: "arpeggios" },
        { beat: 11, laneMask: 2, label: "D", skillId: "passing_notes", flags: { tap: true } },
        { beat: 12, laneMask: 8, label: "E", skillId: "passing_notes" },
        { beat: 13, laneMask: 4, label: "F", skillId: "arpeggios" },
        { beat: 14, laneMask: 2, label: "G", skillId: "arpeggios" },
        { beat: 15, laneMask: 1, label: "A", skillId: "arpeggios", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Walk 1", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Walk 2", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    bass_ghost_grid_01: {
      id: "bass_ghost_grid_01",
      title: "Ghost Grid 01",
      bpm: 88,
      enginePreset: "spark_balanced",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "E", skillId: "ghost_notes" },
        { beat: 1, laneMask: 8, label: "x", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 2, laneMask: 4, label: "A", skillId: "groove_accents" },
        { beat: 3, laneMask: 4, label: "x", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 4, laneMask: 8, label: "E", skillId: "ghost_notes" },
        { beat: 5, laneMask: 2, label: "B", skillId: "groove_accents" },
        { beat: 6, laneMask: 4, label: "A", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 7, laneMask: 1, label: "D", skillId: "groove_accents", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 8, label: "E", skillId: "ghost_notes" },
        { beat: 9, laneMask: 8, label: "x", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 10, laneMask: 4, label: "A", skillId: "groove_accents" },
        { beat: 11, laneMask: 2, label: "x", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 12, laneMask: 8, label: "E", skillId: "ghost_notes" },
        { beat: 13, laneMask: 2, label: "B", skillId: "groove_accents" },
        { beat: 14, laneMask: 4, label: "A", skillId: "ghost_notes", flags: { tap: true } },
        { beat: 15, laneMask: 1, label: "D", skillId: "groove_accents", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Ghost Grid A", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Ghost Grid B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    bass_funk_push_01: {
      id: "bass_funk_push_01",
      title: "Funk Push 01",
      bpm: 96,
      enginePreset: "spark_challenge",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 8, label: "E", skillId: "funk_grooves" },
        { beat: 0.5, laneMask: 2, label: "B", skillId: "slap", flags: { tap: true } },
        { beat: 1.5, laneMask: 4, label: "A", skillId: "pop", flags: { forced: true } },
        { beat: 2, laneMask: 8, label: "E", skillId: "funk_grooves" },
        { beat: 3, laneMask: 1, label: "D", skillId: "slap", flags: { tap: true } },
        { beat: 4, laneMask: 4, label: "A", skillId: "funk_grooves" },
        { beat: 4.5, laneMask: 2, label: "E", skillId: "pop", flags: { forced: true } },
        { beat: 5.5, laneMask: 8, label: "E", skillId: "slap", flags: { tap: true } },
        { beat: 6, laneMask: 4, label: "A", skillId: "funk_grooves" },
        { beat: 7, laneMask: 1, label: "D", skillId: "pop", flags: { specialPhrase: true } },
        { beat: 8, laneMask: 8, label: "E", skillId: "funk_grooves" },
        { beat: 8.5, laneMask: 2, label: "B", skillId: "slap", flags: { tap: true } },
        { beat: 9.5, laneMask: 4, label: "A", skillId: "pop", flags: { forced: true } },
        { beat: 10, laneMask: 8, label: "E", skillId: "funk_grooves" },
        { beat: 11, laneMask: 1, label: "D", skillId: "slap", flags: { tap: true } },
        { beat: 12, laneMask: 4, label: "A", skillId: "funk_grooves" },
        { beat: 12.5, laneMask: 2, label: "E", skillId: "pop", flags: { forced: true } },
        { beat: 13.5, laneMask: 8, label: "E", skillId: "slap", flags: { tap: true } },
        { beat: 14, laneMask: 4, label: "A", skillId: "funk_grooves" },
        { beat: 15, laneMask: 1, label: "D", skillId: "pop", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Funk Push A", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Funk Push B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };
  var BASS_SKILL_EXERCISE_MAP = {
    posture: ["B-CHROM"],
    plucking: ["B-SPIDER"],
    string_names: ["B-CROSS"],
    quarter_notes: ["B-GROOVE"],
    metronome: ["B-GROOVE"],
    notes_E_string: ["B-CHROM"],
    notes_A_string: ["B-CROSS"],
    root_notes: ["B-GROOVE"],
    note_duration: ["B-MUTE"],
    timing_stability: ["B-GROOVE"],
    root_fifth: ["B-OCTAVE"],
    octaves: ["B-OCTAVE"],
    eighth_notes: ["B-GROOVE"],
    major_scale: ["B-SHIFT"],
    minor_scale: ["B-SHIFT"],
    position_shifting: ["B-SHIFT"],
    walking_bass: ["B-GROOVE"],
    passing_notes: ["B-GHOST"],
    arpeggios: ["B-OCTAVE"],
    syncopation: ["B-GHOST"],
    groove_variations: ["B-GROOVE"],
    drum_loop_playing: ["B-GROOVE"],
    slides: ["B-SHIFT"],
    hammer_ons: ["B-MUTE"],
    pull_offs: ["B-MUTE"],
    ghost_notes: ["B-GHOST"],
    muting_mastery: ["B-MUTE"],
    dynamic_control: ["B-MUTE"],
    groove_accents: ["B-GROOVE"],
    slap: ["B-GHOST"],
    pop: ["B-GHOST"],
    funk_grooves: ["B-GROOVE"],
    improvisation: ["B-SHIFT"],
    walking_multi_key: ["B-GROOVE"],
    jam_tracks: ["B-GROOVE"]
  };
  var BASS_RECOMMENDATION_HINTS = {
    posture: { reason: "Set a relaxed hand shape so the groove stays easy.", focusTag: "fundamentals", priorityBoost: 0 },
    plucking: { reason: "Build steady alternating fingers before chasing speed.", focusTag: "plucking", priorityBoost: 1 },
    root_notes: { reason: "Lock root notes to the pulse before adding motion.", focusTag: "roots", priorityBoost: 2 },
    root_fifth: { reason: "Root-fifth motion is the first real bassline building block.", focusTag: "root_fifth", priorityBoost: 4 },
    octaves: { reason: "Octaves make simple grooves feel like real bass parts.", focusTag: "octaves", priorityBoost: 4 },
    walking_bass: { reason: "Walking lines need steadier note flow and fretboard intent.", focusTag: "walking", priorityBoost: 6 },
    passing_notes: { reason: "Passing notes add movement, but timing has to stay tight.", focusTag: "passing_notes", priorityBoost: 6 },
    arpeggios: { reason: "Arpeggio motion connects harmony to groove on the neck.", focusTag: "arpeggios", priorityBoost: 5 },
    ghost_notes: { reason: "Ghost notes bring life to the groove when timing is controlled.", focusTag: "ghost_notes", priorityBoost: 7 },
    slap: { reason: "Slap technique needs clean touch before it needs force.", focusTag: "slap", priorityBoost: 8 }
  };

  function BassRhythmAdapter() {
    this.chartIO = new SparkChartIO();
  }

  BassRhythmAdapter.prototype.getLaneCount = function() {
    return 4;
  };

  BassRhythmAdapter.prototype.getLaneLabels = function() {
    return ["E", "A", "D", "G"];
  };

  BassRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  BassRhythmAdapter.prototype.createPayload = function(context) {
    var chartDefinition = selectBassChartDefinition(context);
    return {
      chartId: chartDefinition.id,
      adapterType: "bass",
      enginePreset: chartDefinition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showChordNames: false,
        failDisabled: true
      },
      songChart: this.chartIO.fromExerciseDefinition(chartDefinition, this)
    };
  };

  function selectBassChartDefinition(context) {
    context = context || {};
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var sessionNum = parseBassSessionNum(lessonId);
    if (context.segment && context.segment.meta && context.segment.meta.skill) {
      var skillId = String(context.segment.meta.skill);
      if (skillId.indexOf("ghost") >= 0 || skillId.indexOf("accent") >= 0) return BASS_RHYTHM_LIBRARY.bass_ghost_grid_01;
      if (skillId.indexOf("slap") >= 0 || skillId.indexOf("funk") >= 0 || skillId.indexOf("pop") >= 0) return BASS_RHYTHM_LIBRARY.bass_funk_push_01;
      if (skillId.indexOf("walk") >= 0 || skillId.indexOf("arp") >= 0) return BASS_RHYTHM_LIBRARY.bass_walk_intro_01;
      if (skillId.indexOf("fifth") >= 0 || skillId.indexOf("octave") >= 0) return BASS_RHYTHM_LIBRARY.bass_fifth_drive_01;
    }
    if (sessionNum >= 27) return BASS_RHYTHM_LIBRARY.bass_funk_push_01;
    if (sessionNum >= 21) return BASS_RHYTHM_LIBRARY.bass_ghost_grid_01;
    if (sessionNum >= 16) return BASS_RHYTHM_LIBRARY.bass_walk_intro_01;
    if (sessionNum >= 11) return BASS_RHYTHM_LIBRARY.bass_fifth_drive_01;
    return BASS_RHYTHM_LIBRARY.bass_root_pulse_01;
  }

  function parseBassSessionNum(lessonId) {
    if (!lessonId) return 1;
    var match = /session_(\d+)/.exec(String(lessonId));
    return match ? parseInt(match[1], 10) : 1;
  }

  function buildBassLessons() {
    var curriculum = window.BASS_CURRICULUM || [];
    var lessons = [];
    for (var i = 0; i < curriculum.length; i++) {
      var row = curriculum[i];
      lessons.push({
        id: "bass_level_" + row.num,
        skill: row.skills && row.skills.length ? row.skills[0] : "posture",
        title: row.title,
        level: row.num,
        focusSkills: row.skills || [],
        bpmRange: row.bpmRange || [60, 80]
      });
    }
    return lessons;
  }

  function getBassSongs() {
    return window.BASS_SONGS || [];
  }

  function getBassExercisesForSkill(skill) {
    var exercises = window.BASS_EXERCISES || [];
    if (!skill) return exercises.slice();
    var preferredIds = BASS_SKILL_EXERCISE_MAP[skill] || [];
    if (!preferredIds.length) return exercises.slice(0, 2);
    var matches = [];
    for (var i = 0; i < exercises.length; i++) {
      if (preferredIds.indexOf(exercises[i].id) >= 0) matches.push(exercises[i]);
    }
    return matches.length ? matches : exercises.slice(0, 2);
  }

  function summarizeBassSkillProgress(skill, state) {
    state = state || {};
    var map = state.bassSkillProgress || state.skillProgress || {};
    var entry = skill && map ? map[skill] : null;
    if (!entry) return null;
    var groove = normalizeUnit(entry.groove);
    var timing = normalizeUnit(entry.timing);
    var accuracy = normalizeUnit(entry.accuracy);
    var movement = normalizeUnit(entry.movement);
    var mastery = roundUnit((groove + timing + accuracy + movement) / 4);
    var weakestMetric = "groove";
    var weakestValue = groove;
    var metrics = { timing: timing, accuracy: accuracy, movement: movement };
    for (var key in metrics) {
      if (metrics[key] < weakestValue) {
        weakestMetric = key;
        weakestValue = metrics[key];
      }
    }
    return {
      skill: skill,
      groove: groove,
      timing: timing,
      accuracy: accuracy,
      movement: movement,
      mastery: mastery,
      weakestMetric: weakestMetric,
      stage: mastery >= 0.85 ? "ready" : mastery >= 0.7 ? "steady" : "developing"
    };
  }

  function normalizeUnit(value) {
    if (typeof value !== "number" || !isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function roundUnit(value) {
    return Math.round(value * 100) / 100;
  }

  window.SparkBassModule = {
    id: "bass",
    appId: "bassspark",
    name: "Bass",

    getSkillTree: function() {
      return window.BASS_SKILL_TREE || {};
    },

    getLessons: function() {
      return buildBassLessons();
    },

    getCurriculumMap: function() {
      return window.BASS_CURRICULUM || [];
    },

    getExercises: function(skill) {
      return getBassExercisesForSkill(skill);
    },

    getSongs: function() {
      return getBassSongs();
    },

    getTuning: function() {
      return window.BASS_STRINGS || [];
    },

    getRhythmAdapter: function() {
      return new BassRhythmAdapter();
    },

    getPracticeRecommendation: function(lesson, exercise, state) {
      lesson = lesson || {};
      exercise = exercise || {};
      state = state || {};
      var primarySkill = lesson.skill || (lesson.focusSkills && lesson.focusSkills[0]) || "";
      var hint = BASS_RECOMMENDATION_HINTS[primarySkill] || {
        reason: "Continue bass progression with a tighter pocket.",
        focusTag: "bass",
        priorityBoost: 0
      };
      var completedCount = Array.isArray(state.completedLessonIds) ? state.completedLessonIds.length : 0;
      var progressSummary = summarizeBassSkillProgress(primarySkill, state);
      var priorityBoost = hint.priorityBoost + Math.min(4, Math.floor(completedCount / 3));
      var reason = hint.reason;
      if (progressSummary) {
        priorityBoost += progressSummary.stage === "developing" ? 3 : progressSummary.stage === "steady" ? 1 : 0;
        reason = "Bass " + progressSummary.weakestMetric + " is at " + Math.round(progressSummary[progressSummary.weakestMetric] * 100) + "%, so " + hint.reason.toLowerCase();
      }
      return {
        priorityBoost: priorityBoost,
        reason: reason,
        focusTag: hint.focusTag,
        progressSummary: progressSummary,
        labelSuffix: primarySkill === "walking_bass" ? "Walking" : primarySkill === "root_fifth" ? "Groove" : null
      };
    },

    getRhythmChartLibrary: function() {
      return BASS_RHYTHM_LIBRARY;
    }
  };

  window.SparkBassRhythmAdapter = BassRhythmAdapter;
  window.summarizeBassSkillProgress = summarizeBassSkillProgress;
})();
