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
    }
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
      enginePreset: chartDefinition.enginePreset || this.getDefaultPreset(),
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
      if (skillId.indexOf("walk") >= 0 || skillId.indexOf("arp") >= 0) return BASS_RHYTHM_LIBRARY.bass_walk_intro_01;
      if (skillId.indexOf("fifth") >= 0 || skillId.indexOf("octave") >= 0) return BASS_RHYTHM_LIBRARY.bass_fifth_drive_01;
    }
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

    getExercises: function() {
      return window.BASS_EXERCISES || [];
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

    getRhythmChartLibrary: function() {
      return BASS_RHYTHM_LIBRARY;
    }
  };

  window.SparkBassRhythmAdapter = BassRhythmAdapter;
})();
