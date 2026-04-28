(function() {
  window.SparkDrumsModule = {
    id: "drums",

    getSkillTree: function() {
      return window.SparkDrumsSkillTree || [];
    },

    getLessons: function() {
      return window.SparkDrumsLessons || [];
    },

    getCurriculum: function() {
      return { id: "drums_core", tracks: ["foundations"] };
    },

    getExercises: function(skill) {
      return [];
    },

    getRuntimeAdapter: function() {
      return {
        getLaneCount: function() { return 3; },
        getLaneLabels: function() { return ["Kick","Snare","Hat"]; },
        getDefaultInputMode: function() { return "keyboard_or_midi"; }
      };
    }
  };
})();
