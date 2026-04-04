// js/curriculum/adapters/legacy_curriculum_adapter.js
// Bridges legacy curriculum data formats to the CurriculumService API.
// Allows old-style curriculum arrays (from instrument getData().CURRICULUM)
// to be consumed by the engine without a mass content rewrite.
(function() {

  var SparkLegacyCurriculumAdapter = {

    /**
     * adaptLegacyCurriculum(rawCurriculum)
     * Converts instrument getData().CURRICULUM arrays into a normalized format
     * that CurriculumService can traverse.
     */
    adaptLegacyCurriculum: function(rawCurriculum) {
      if (!Array.isArray(rawCurriculum)) return [];
      var adapted = [];
      for (var i = 0; i < rawCurriculum.length; i++) {
        var item = rawCurriculum[i];
        adapted.push({
          id: item.id || item.num || ("lesson_" + i),
          title: item.title || item.name || ("Lesson " + (i + 1)),
          level: item.level || item.num || (i + 1),
          skill: item.skill || item.focus || null,
          masteryRequired: item.masteryRequired || item.threshold || 0,
          exercises: item.exercises || [],
          prerequisites: item.prerequisites || item.unlockRules || null,
          desc: item.desc || item.description || ""
        });
      }
      return adapted;
    },

    /**
     * adaptLegacyLesson(rawLesson)
     * Normalizes a single lesson object from legacy format.
     */
    adaptLegacyLesson: function(rawLesson) {
      if (!rawLesson) return null;
      return {
        id: rawLesson.id || "unknown",
        title: rawLesson.title || rawLesson.name || "Lesson",
        level: rawLesson.level || rawLesson.num || 1,
        skill: rawLesson.skill || rawLesson.focus || null,
        masteryRequired: rawLesson.masteryRequired || 0,
        exercises: rawLesson.exercises || [],
        desc: rawLesson.desc || rawLesson.description || ""
      };
    },

    /**
     * findNextIncomplete(adaptedCurriculum, completedIds)
     * Returns the first lesson in the adapted curriculum that isn't in completedIds.
     */
    findNextIncomplete: function(adaptedCurriculum, completedIds) {
      completedIds = completedIds || [];
      for (var i = 0; i < adaptedCurriculum.length; i++) {
        if (completedIds.indexOf(adaptedCurriculum[i].id) < 0) {
          return adaptedCurriculum[i];
        }
      }
      return null;
    }
  };

  window.SparkLegacyCurriculumAdapter = SparkLegacyCurriculumAdapter;
})();
