(function() {
  var GUITAR_RECOMMENDATION_HINTS = {
    guitar_orientation:    { priorityBoost: 0,  reason: "Get comfortable holding the guitar before adding any motion.",            focusTag: "orientation" },
    guitar_tuning:         { priorityBoost: 0,  reason: "A quick tune-up so every string sounds clean.",                            focusTag: "tuning" },
    open_strings:          { priorityBoost: 1,  reason: "Hear each open string ring cleanly so chord notes have a reference.",      focusTag: "sound" },
    pick_downstrokes:      { priorityBoost: 1,  reason: "Lock in steady downstrokes before adding chord shapes.",                   focusTag: "groove" },
    quarter_counting:      { priorityBoost: 2,  reason: "Anchor the strum to a slow quarter-note count.",                            focusTag: "rhythm" },
    first_riff:            { priorityBoost: 2,  reason: "Stitch open strings into a satisfying two-bar riff.",                       focusTag: "performance" },
    em_chord:              { priorityBoost: 2,  reason: "Land Em cleanly — it's the easiest gateway chord.",                          focusTag: "chord" },
    g_chord:               { priorityBoost: 3,  reason: "Add G so the first switches start opening up.",                              focusTag: "chord" },
    c_chord:               { priorityBoost: 3,  reason: "C unlocks most beginner songbook progressions.",                             focusTag: "chord" },
    d_chord:               { priorityBoost: 4,  reason: "Add D to round out the four-chord loop.",                                    focusTag: "chord" },
    am_chord:              { priorityBoost: 4,  reason: "Pair Am with C and you've got a minor sound at hand.",                       focusTag: "chord" },
    e_a_chords:            { priorityBoost: 5,  reason: "Tackle E and A so blues and rock feel familiar.",                            focusTag: "chord" },
    open_chord_switching:  { priorityBoost: 5,  reason: "Smooth out the most-used switches across open chords.",                      focusTag: "switches" },
    four_chord_loop:       { priorityBoost: 6,  reason: "Run the full C-G-D-Am loop to glue every switch together.",                  focusTag: "progression" },
    eighth_strumming:      { priorityBoost: 6,  reason: "Add eighth-note feel so strums breathe with the music.",                      focusTag: "rhythm" },
    down_up_strumming:     { priorityBoost: 7,  reason: "Keep the strum hand alternating down-up so groove stays alive.",              focusTag: "rhythm" },
    muted_strumming:       { priorityBoost: 7,  reason: "Layer left-hand mutes for that funk-pop feel.",                                focusTag: "muting" },
    syncopation_intro:     { priorityBoost: 8,  reason: "Add deliberate gaps so off-beat accents land with intention.",                focusTag: "syncopation" },
    two_chord_song:        { priorityBoost: 5,  reason: "Stitch your first two chords into a real song loop.",                          focusTag: "song" },
    four_chord_song:       { priorityBoost: 7,  reason: "Use a full four-chord arrangement to test the loop.",                          focusTag: "song" },
    song_phrase_retry:     { priorityBoost: 8,  reason: "Loop the weakest phrase until the rough spot disappears.",                     focusTag: "phrase_retry" },
    song_performance:      { priorityBoost: 9,  reason: "Run a full easy song top-to-bottom without stopping.",                          focusTag: "performance" },
    power_chords:          { priorityBoost: 9,  reason: "Add the moveable root-fifth shape so rock vocabulary opens up.",                focusTag: "rock" },
    barre_intro:           { priorityBoost: 10, reason: "Build barre strength gradually — partial barres first.",                        focusTag: "barre" },
    minor_pentatonic:      { priorityBoost: 8,  reason: "Map box 1 of the minor pentatonic so leads have a home.",                       focusTag: "lead" },
    single_note_timing:    { priorityBoost: 9,  reason: "Lock single-note phrasing to the click before adding speed.",                   focusTag: "timing" },
    bend_slide_intro:      { priorityBoost: 10, reason: "Add slides and tiny bends to color single-note lines.",                          focusTag: "expression" },
    fingerstyle_pima:      { priorityBoost: 9,  reason: "Develop independent thumb and finger motion with PIMA.",                        focusTag: "fingerstyle" },
    caged_intro:           { priorityBoost: 11, reason: "See chord shapes up the neck so the fretboard makes sense.",                    focusTag: "fretboard" },
    triads_intro:          { priorityBoost: 11, reason: "Play three-string triads to free up the upper neck.",                            focusTag: "triads" },
    performance_set:       { priorityBoost: 12, reason: "Turn the current skill stack into a confident playthrough set.",                  focusTag: "performance" }
  };

  function GuitarRhythmAdapterFacade() {
    if (typeof SparkGuitarRhythmAdapter === "function") {
      return new SparkGuitarRhythmAdapter();
    }
    return null;
  }

  window.SparkGuitarModule = {
    id: "guitar",
    appId: "chordspark",
    name: "Guitar",

    getSkillTree: function() {
      return window.SparkGuitarSkillTree || [];
    },

    getCurriculum: function() {
      return window.SparkGuitarCurriculum || null;
    },

    getLessons: function() {
      return window.SparkGuitarLessons || [];
    },

    getCurriculumMap: function() {
      return this.getLessons();
    },

    getExercises: function(skillOrLessonId) {
      var lib = window.SparkGuitarExercises || {};
      return lib[skillOrLessonId] || [];
    },

    getTuning: function() {
      return window.SparkGuitarTuning || null;
    },

    getPacks: function() {
      return window.SparkGuitarPacks || [];
    },

    getProgressionRules: function() {
      return window.SparkGuitarProgression || null;
    },

    getRuntimeAdapter: function() {
      return window.SparkGuitarRuntimeAdapter || null;
    },

    getCapabilities: function() {
      return {
        stringCount: 6,
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
      return window.SparkGuitarRepertoire || [];
    },

    getSongLibrary: function() {
      return window.SparkGuitarSongs || {};
    },

    getRhythmAdapter: function() {
      return GuitarRhythmAdapterFacade();
    },

    getRhythmChartLibrary: function() {
      return window.SparkGuitarChartLibrary
        ? (typeof window.SparkGuitarChartLibrary.getAll === "function" ? window.SparkGuitarChartLibrary.getAll() : {})
        : {};
    },

    getPracticeRecommendation: function(lesson, exercise, state) {
      lesson = lesson || {};
      exercise = exercise || {};
      state = state || {};
      var hint = GUITAR_RECOMMENDATION_HINTS[lesson.skill] || {
        priorityBoost: 0,
        reason: "Continue guitar progression.",
        focusTag: "guitar"
      };
      var completedCount = Array.isArray(state.completedLessonIds) ? state.completedLessonIds.length : 0;
      var priorityBoost = hint.priorityBoost + Math.min(4, Math.floor(completedCount / 2));
      return {
        priorityBoost: priorityBoost,
        reason: hint.reason,
        focusTag: hint.focusTag,
        labelSuffix: exercise.type === "performance" ? "Performance" : null
      };
    }
  };
})();
