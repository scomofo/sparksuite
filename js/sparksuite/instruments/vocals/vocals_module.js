(function() {
  var VOCALS_RECOMMENDATION_HINTS = {
    vocal_comfort_setup:   { priorityBoost: 0,  reason: "Get the mic comfortable and the volume right before any singing.",          focusTag: "setup" },
    vocal_posture:         { priorityBoost: 0,  reason: "Loosen posture so breath has somewhere to go.",                              focusTag: "posture" },
    vocal_breath:          { priorityBoost: 1,  reason: "A quiet, low breath gives every phrase a relaxed start.",                     focusTag: "breath" },
    pitch_matching:        { priorityBoost: 1,  reason: "Lock in matching one comfortable pitch before adding movement.",              focusTag: "pitch" },
    call_response:         { priorityBoost: 2,  reason: "Repeat short calls so pitch tracking has clear targets.",                     focusTag: "pitch" },
    three_note_patterns:   { priorityBoost: 3,  reason: "Move between do-re-mi so pitch starts to feel directional.",                  focusTag: "pitch" },
    stepwise_melody:       { priorityBoost: 4,  reason: "Stay in stepwise motion so the line stays singable.",                          focusTag: "melody" },
    intervals_3rds:        { priorityBoost: 5,  reason: "Build the small skip between do and mi so harmony can follow.",                focusTag: "ear_training" },
    major_scale_vocal:     { priorityBoost: 5,  reason: "Sing 1-5 in your safe range so songs in the key feel familiar.",                focusTag: "scale" },
    range_map:             { priorityBoost: 2,  reason: "Map low/mid/high comfort notes so future songs avoid strain.",                   focusTag: "range" },
    entrances:             { priorityBoost: 3,  reason: "Anchor the entrance to beat 1 so phrases start cleanly.",                        focusTag: "rhythm" },
    phrase_timing:         { priorityBoost: 4,  reason: "Start and end phrases on time so timing tracks separately from pitch.",          focusTag: "rhythm" },
    syncopation_vocal:     { priorityBoost: 6,  reason: "Add deliberate off-beat entries with the count-in.",                              focusTag: "syncopation" },
    vowels:                { priorityBoost: 3,  reason: "Use ah/oh/ee to discover which vowels stabilize pitch first.",                    focusTag: "tone" },
    resonance:             { priorityBoost: 4,  reason: "Find buzzy forward placement so tone doesn't push from the throat.",              focusTag: "tone" },
    dynamics:              { priorityBoost: 5,  reason: "Practice soft/medium so volume becomes a choice not a side effect.",              focusTag: "musicality" },
    consonants:            { priorityBoost: 4,  reason: "Land consonants rhythmically so phrases stay clear.",                              focusTag: "diction" },
    song_phrase:           { priorityBoost: 6,  reason: "Stitch a single phrase together with pitch and timing combined.",                   focusTag: "song" },
    verse_chorus:          { priorityBoost: 7,  reason: "Sing a verse plus chorus hook so song shape feels familiar.",                       focusTag: "song" },
    vocal_phrase_retry:    { priorityBoost: 8,  reason: "Loop only one phrase and improve a single dimension at a time.",                    focusTag: "phrase_retry" },
    record_listen:         { priorityBoost: 7,  reason: "Listen back kindly — name one good thing and one fix.",                              focusTag: "feedback" },
    harmony_drone:         { priorityBoost: 6,  reason: "Hold a steady note over the drone so pitch drift becomes audible.",                  focusTag: "harmony" },
    harmony_third:         { priorityBoost: 8,  reason: "Sing the third above so you can hear two lines without colliding.",                   focusTag: "harmony" },
    call_response_improv:  { priorityBoost: 9,  reason: "Answer with three notes inside a safe range — no wrong answers.",                     focusTag: "creative" },
    background_vocals:     { priorityBoost: 9,  reason: "Layer a simple harmony pad over a backing track.",                                     focusTag: "harmony" },
    mic_technique:         { priorityBoost: 7,  reason: "Hold mic distance steady so dynamics translate to the recording.",                     focusTag: "mic" },
    confidence_take:       { priorityBoost: 9,  reason: "Record one full take and ignore tiny misses while tracking.",                           focusTag: "confidence" },
    full_vocal_song:       { priorityBoost: 10, reason: "Sing a full easy song top-to-bottom and review by phrase.",                              focusTag: "performance" },
    vocal_performance_set: { priorityBoost: 11, reason: "Run three short takes and pick a focus for the next plan.",                              focusTag: "performance" }
  };

  window.SparkVocalsModule = {
    id: "vocals",
    appId: "vocalspark",
    name: "Vocals",

    getSkillTree: function() {
      return window.SparkVocalsSkillTree || [];
    },

    getCurriculum: function() {
      return window.SparkVocalsCurriculum || null;
    },

    getLessons: function() {
      return window.SparkVocalsLessons || [];
    },

    getCurriculumMap: function() {
      return this.getLessons();
    },

    getExercises: function(skillOrLessonId) {
      var lib = window.SparkVocalsExercises || {};
      var seen;
      var out;
      var key;
      var i;
      if (!skillOrLessonId) {
        seen = {};
        out = [];
        for (key in lib) {
          if (!Object.prototype.hasOwnProperty.call(lib, key)) continue;
          for (i = 0; i < lib[key].length; i++) {
            if (seen[lib[key][i].id]) continue;
            seen[lib[key][i].id] = true;
            out.push(lib[key][i]);
          }
        }
        return out;
      }
      return lib[skillOrLessonId] || [];
    },

    getPacks: function() {
      return window.SparkVocalsPacks || [];
    },

    getProgressionRules: function() {
      return window.SparkVocalsProgression || null;
    },

    getRuntimeAdapter: function() {
      return window.SparkVocalsRuntimeAdapter || null;
    },

    getCapabilities: function() {
      return {
        stringCount: null,
        keyCount: null,
        supportsChords: false,
        supportsScales: true,
        supportsStrumming: false,
        supportsFingerpicking: false,
        supportsMelody: true,
        supportsPitch: true,
        supportsHarmony: true,
        preferredRenderer: "pitch-lane-highway",
        inputModes: ["microphone", "keyboard"]
      };
    },

    getSongs: function() {
      return window.SparkVocalsRepertoire || [];
    },

    getSongLibrary: function() {
      return window.SparkVocalsSongs || {};
    },

    getRhythmAdapter: function() {
      return typeof SparkVocalsRhythmAdapter === "function" ? new SparkVocalsRhythmAdapter() : null;
    },

    getRhythmChartLibrary: function() {
      return window.SparkVocalsChartLibrary
        ? (typeof window.SparkVocalsChartLibrary.getAll === "function" ? window.SparkVocalsChartLibrary.getAll() : {})
        : {};
    },

    getPitchLanes: function() {
      return window.SparkVocalsRuntimeAdapter
        && typeof SparkVocalsRuntimeAdapter.getPitchLanes === "function"
        ? SparkVocalsRuntimeAdapter.getPitchLanes()
        : [];
    },

    getPracticeRecommendation: function(lesson, exercise, state) {
      lesson = lesson || {};
      exercise = exercise || {};
      state = state || {};
      var hint = VOCALS_RECOMMENDATION_HINTS[lesson.skill] || {
        priorityBoost: 0,
        reason: "Continue vocal progression.",
        focusTag: "vocals"
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
