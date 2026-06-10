(function() {
  window.SparkDrumsModule = {
    id: "drums",
    appId: "drumspark",
    name: "Drums",

    getSkillTree: function() {
      return window.SparkDrumsSkillTree || [];
    },

    getLessons: function() {
      return window.SparkDrumsLessons || [];
    },

    getCurriculum: function() {
      return window.SparkDrumsCurriculum || null;
    },

    getCurriculumMap: function() {
      return this.getLessons();
    },

    getExercises: function(skillOrLessonId) {
      var exercises = window.SparkDrumsExercises || [];
      if (!skillOrLessonId) return exercises;
      var lessons = this.getLessons();
      for (var i = 0; i < lessons.length; i++) {
        if (lessons[i].id === skillOrLessonId) {
          var ids = lessons[i].exerciseIds || [];
          return exercises.filter(function(exercise) { return ids.indexOf(exercise.id) >= 0; });
        }
      }
      return exercises.filter(function(exercise) {
        return exercise.skill === skillOrLessonId || exercise.id === skillOrLessonId;
      });
    },

    getPatterns: function() {
      return window.SparkDrumsPatterns || {};
    },

    getSongs: function() {
      return window.SparkDrumsSongs || [];
    },

    getKit: function(id) {
      var kits = window.SparkDrumsKits || {};
      return kits[id || "default"] || kits.default || null;
    },

    getInputMapping: function() {
      return window.SparkDrumsMapping || null;
    },

    getNotation: function() {
      return window.SparkDrumsNotation || null;
    },

    getPacks: function() {
      return window.SparkDrumsPacks || [];
    },

    getTuning: function() {
      return null;
    },

    getCapabilities: function() {
      return {
        stringCount: null,
        keyCount: null,
        padCount: 4,
        supportsChords: false,
        supportsScales: false,
        supportsStrumming: false,
        supportsFingerpicking: false,
        supportsMelody: false,
        supportsGrooves: true,
        supportsDrumKits: true,
        preferredRenderer: "drum-lane-highway",
        inputModes: ["keyboard", "midi", "mouse"]
      };
    },

    getProgressionRules: function() {
      return window.SparkDrumsProgression || null;
    },

    getRuntimeAdapter: function() {
      return typeof SparkDrumsRuntimeAdapter === "function" ? new SparkDrumsRuntimeAdapter() : null;
    },

    getRhythmAdapter: function() {
      return typeof SparkDrumsRhythmAdapter === "function" ? new SparkDrumsRhythmAdapter() : this.getRuntimeAdapter();
    },

    getRhythmChartLibrary: function() {
      return window.SparkDrumsChartLibrary ? window.SparkDrumsChartLibrary.getAll() : {};
    },

    getRhythmGuidance: function(skillId, result) {
      result = result || {};
      var weak = result.learning && Array.isArray(result.learning.weakAreas) && result.learning.weakAreas.length
        ? result.learning.weakAreas.join(", ").replace(/_/g, " ")
        : "timing";
      return {
        title: skillId === "one_bar_fills" ? "Drum Fill Checkpoint" : "Drum Groove Checkpoint",
        summary: "Focus on " + weak + " while keeping the count steady.",
        nextStep: "Repeat the pattern at the current BPM, then add the next variation when accuracy is steady."
      };
    }
  };
})();
