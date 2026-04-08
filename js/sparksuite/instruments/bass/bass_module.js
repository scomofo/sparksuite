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
  var BASS_ADVANCED_EXERCISES = {
    walking_bass: [
      { id: "bass_walk_lines_01", type: "bassline", name: "Walk Lines 01", focus: "walking_bass", pattern: "Root-3-5-6", duration: 75 },
      { id: "bass_turnaround_01", type: "bassline", name: "Turnaround Steps", focus: "passing_notes", pattern: "3-2-1-walk", duration: 75 }
    ],
    passing_notes: [
      { id: "bass_passing_notes_01", type: "bassline", name: "Passing Notes 01", focus: "passing_notes", pattern: "Root chromatic walk-up", duration: 70 }
    ],
    arpeggios: [
      { id: "bass_arpeggio_climb_01", type: "arpeggio", name: "Arpeggio Climb", focus: "arpeggios", pattern: "1-3-5-8", duration: 70 }
    ],
    ghost_notes: [
      { id: "bass_ghost_grid_02", type: "groove", name: "Ghost Grid 02", focus: "ghost_notes", pattern: "Note-x-note-x", duration: 80 }
    ],
    groove_accents: [
      { id: "bass_accent_lock_01", type: "groove", name: "Accent Lock", focus: "groove_accents", pattern: "Accent on 2 and 4", duration: 80 }
    ],
    slap: [
      { id: "bass_slap_pop_01", type: "technique", name: "Slap Pop 01", focus: "slap", pattern: "Thumb-pop-thumb", duration: 75 }
    ],
    pop: [
      { id: "bass_pop_snaps_01", type: "technique", name: "Pop Snaps", focus: "pop", pattern: "Pop-octave-pop", duration: 75 }
    ],
    funk_grooves: [
      { id: "bass_funk_grid_01", type: "groove", name: "Funk Grid", focus: "funk_grooves", pattern: "16th note syncopation", duration: 90 }
    ],
    improvisation: [
      { id: "bass_improv_cells_01", type: "improv", name: "Improv Cells", focus: "improvisation", pattern: "Root-fifth-fill", duration: 90 }
    ]
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
    var advanced = BASS_ADVANCED_EXERCISES[skill];
    if (advanced && advanced.length) return advanced.slice();
    var preferredIds = BASS_SKILL_EXERCISE_MAP[skill] || [];
    if (!preferredIds.length) return exercises.slice(0, 2);
    var matches = [];
    for (var i = 0; i < exercises.length; i++) {
      if (preferredIds.indexOf(exercises[i].id) >= 0) matches.push(exercises[i]);
    }
    return matches.length ? matches : exercises.slice(0, 2);
  }

  function pickBassPracticeExercise(lesson, exercises, state) {
    lesson = lesson || {};
    exercises = Array.isArray(exercises) ? exercises.slice() : [];
    state = state || {};
    if (!exercises.length) return null;
    var progress = summarizeBassSkillProgress(lesson.skill, state);
    if (!progress) return exercises[0];
    var targetByWeakness = {
      movement: {
        walking_bass: "bass_walk_lines_01",
        root_fifth: "B-OCTAVE",
        slap: "bass_slap_pop_01",
        pop: "bass_pop_snaps_01"
      },
      timing: {
        walking_bass: "bass_turnaround_01",
        ghost_notes: "bass_ghost_grid_02",
        groove_accents: "bass_accent_lock_01",
        funk_grooves: "bass_funk_grid_01"
      },
      accuracy: {
        arpeggios: "bass_arpeggio_climb_01",
        passing_notes: "bass_passing_notes_01",
        improvisation: "bass_improv_cells_01"
      },
      groove: {
        walking_bass: "bass_walk_lines_01",
        funk_grooves: "bass_funk_grid_01",
        ghost_notes: "bass_ghost_grid_02"
      }
    };
    var preferredId = targetByWeakness[progress.weakestMetric] && targetByWeakness[progress.weakestMetric][lesson.skill];
    if (!preferredId) return exercises[0];
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i].id === preferredId) return exercises[i];
    }
    return exercises[0];
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

  function getBassRhythmGuidance(focus, result) {
    focus = String(focus || "");
    var weakAreas = result && result.learning && Array.isArray(result.learning.weakAreas)
      ? result.learning.weakAreas
      : [];
    var accuracy = result && result.gameplay && typeof result.gameplay.accuracy === "number"
      ? Math.round(result.gameplay.accuracy * 100)
      : 0;
    var byFocus = {
      walking_bass: {
        title: "Bass Walking Checkpoint",
        success: "Your line is starting to flow. Keep each note even and connected.",
        late: "Walking lines are landing late. Think one step ahead so the next note arrives before the beat slips.",
        wrong_fret: "The walking shape is breaking down under motion. Slow the line and keep the root landmarks visible.",
        next: "Run the walking line again, then loop the turnaround if the motion still feels jumpy."
      },
      passing_notes: {
        title: "Passing Tone Control",
        success: "The connecting tones are sounding intentional instead of rushed.",
        late: "The passing tones are dragging behind the beat. Keep the connector notes lighter and earlier.",
        wrong_fret: "The chromatic walk-up is losing fret accuracy. Re-center the shape before adding speed.",
        next: "Repeat the line and listen for smooth movement into the target note."
      },
      arpeggios: {
        title: "Arpeggio Motion",
        success: "The shape is outlining the harmony cleanly.",
        late: "The arpeggio climb is a little late. Commit to the shape before each jump.",
        wrong_fret: "The arpeggio pattern is missing its target notes. Anchor the root and rebuild upward.",
        next: "Loop the phrase and aim for one clean climb before increasing intensity."
      },
      ghost_notes: {
        title: "Ghost Note Pocket",
        success: "The mute notes are adding groove without crowding the line.",
        late: "The ghost notes are dragging. Make the mute strokes lighter so the pulse stays ahead.",
        wrong_fret: "The groove is opening up too much on the fret hand. Keep the left hand relaxed and muted.",
        next: "Retry the ghost grid and lock the note-x-note-x feel before going faster."
      },
      groove_accents: {
        title: "Accent Placement",
        success: "Your accents are making the groove speak clearly.",
        late: "The accents are arriving late. Hear beats 2 and 4 internally before you strike.",
        wrong_fret: "The accented notes are losing shape. Set the fretting hand early and hit through the note.",
        next: "Loop the accented phrase and keep the unaccented notes smaller."
      },
      slap: {
        title: "Slap Technique",
        success: "The thumb and pop motions are starting to feel controlled.",
        late: "The slap hits are late. Let the thumb motion fall through the string instead of forcing it.",
        wrong_fret: "The slap phrase is missing its fret shape. Set the octave frame before each attack.",
        next: "Retry the slap phrase and keep the thumb relaxed."
      },
      pop: {
        title: "Pop Technique",
        success: "The popped notes are speaking with more confidence.",
        late: "The pop attacks are a touch behind. Prepare the finger under the string sooner.",
        wrong_fret: "The pop phrase is missing its landing notes. Rebuild the octave shape before the pop.",
        next: "Loop the pop phrase and make the motion compact."
      },
      funk_grooves: {
        title: "Funk Pocket",
        success: "The groove is sounding tighter and more deliberate.",
        late: "The funk grid is leaning late. Keep the sixteenth-note pulse moving under the hand.",
        wrong_fret: "The groove shape is slipping under syncopation. Shrink the left-hand motion and stay anchored.",
        next: "Run the groove again and aim for cleaner subdivision, not just bigger attack."
      }
    };
    var guidance = byFocus[focus] || {
      title: "Bass Groove Checkpoint",
      success: "The groove is settling in.",
      late: "The line is landing late. Keep the pulse more active in your body.",
      wrong_fret: "The fret shape is slipping. Slow down and lock the shape before the hit.",
      next: "Repeat the drill and aim for steadier pocket control."
    };
    var summary = guidance.success;
    if (weakAreas.indexOf("late") >= 0 || weakAreas.indexOf("late_strums") >= 0) summary = guidance.late;
    else if (weakAreas.indexOf("wrong_fret") >= 0) summary = guidance.wrong_fret;
    return {
      title: guidance.title,
      summary: summary,
      nextStep: guidance.next,
      accuracy: accuracy
    };
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

    pickPracticeExercise: function(lesson, exercises, state) {
      return pickBassPracticeExercise(lesson, exercises, state);
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

    getRhythmGuidance: function(focus, result) {
      return getBassRhythmGuidance(focus, result);
    },

    getRhythmChartLibrary: function() {
      return BASS_RHYTHM_LIBRARY;
    }
  };

  window.SparkBassRhythmAdapter = BassRhythmAdapter;
  window.summarizeBassSkillProgress = summarizeBassSkillProgress;
})();
