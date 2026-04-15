(function() {
  function resolveSkill(context) {
    if (context && context.segment && context.segment.meta && context.segment.meta.skill) {
      return String(context.segment.meta.skill);
    }
    if (context && context.curriculum && context.curriculum.nextLessonId) {
      var lessonId = String(context.curriculum.nextLessonId);
      if (lessonId.indexOf("capo_") === 0) {
        if (lessonId === "capo_L5") return "capo_song_playing";
        if (lessonId === "capo_L6") return "capo_transposition";
        if (lessonId === "capo_L7") return "capo_singer_mode";
        if (lessonId === "capo_L8") return "capo_multi_position";
        if (lessonId === "capo_L3" || lessonId === "capo_L4") return "capo_keys";
        return "capo_basics";
      }
    }
    return "";
  }

  window.SparkGuitarRhythmCurriculum = {
    selectChartId: function(context) {
      context = context || {};
      var skillId = resolveSkill(context);
      if (skillId.indexOf("capo_song") >= 0) return "capo_progressions_01";
      if (
        skillId.indexOf("capo_transposition") >= 0 ||
        skillId.indexOf("capo_singer") >= 0 ||
        skillId.indexOf("capo_multi") >= 0
      ) {
        return "capo_transpose_01";
      }
      if (skillId.indexOf("capo_") >= 0) return "capo_shapes_01";
      if (context && context.segment && context.segment.meta && context.segment.meta.accuracy < 75) {
        return "power_chords_01";
      }
      return "power_chords_01";
    }
  };
})();
