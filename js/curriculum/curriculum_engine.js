(function(){

  function getNextLessonFromCurriculum(curriculumId, completedLessons){
    var curriculum = getCurriculumItem("curriculums", curriculumId);
    if(!curriculum) return null;
    for(var t=0;t<curriculum.tracks.length;t++){
      var track = getCurriculumItem("tracks", curriculum.tracks[t]);
      if(!track) continue;
      for(var u=0;u<track.units.length;u++){
        var unit = getCurriculumItem("units", track.units[u]);
        if(!unit) continue;
        for(var l=0;l<unit.lessons.length;l++){
          var lessonId = unit.lessons[l];
          if(completedLessons.indexOf(lessonId) < 0){
            return lessonId;
          }
        }
      }
    }
    return null;
  }

  function checkLessonUnlockRules(lessonId){
    var lesson = getCurriculumItem("lessons", lessonId);
    if(!lesson || !lesson.unlockRules) return true; // no rules = unlocked
    var rules = lesson.unlockRules;

    if(rules.lessonsCompleted && Array.isArray(rules.lessonsCompleted)){
      var completedLessons = (S.mastery && S.mastery.lessons) || {};
      for(var i=0;i<rules.lessonsCompleted.length;i++){
        if(!completedLessons[rules.lessonsCompleted[i]]) return false;
      }
    }

    if(rules.playerLevel && (S.playerLevel || 1) < rules.playerLevel){
      return false;
    }

    if(rules.mastery && rules.mastery.chords){
      var chordMastery = (S.mastery && S.mastery.chords) || {};
      for(var j=0;j<rules.mastery.chords.length;j++){
        if(!chordMastery[rules.mastery.chords[j]]) return false;
      }
    }

    return true;
  }

  window.getNextLessonFromCurriculum = getNextLessonFromCurriculum;
  window.checkLessonUnlockRules = checkLessonUnlockRules;

  // Service wrapper for engine-first architecture (Phase 5)
  window.SparkCurriculumService = {
    getNextLesson: function(curriculumId, completedLessons) {
      return getNextLessonFromCurriculum(curriculumId, completedLessons);
    },

    isLessonUnlocked: function(lessonId) {
      return checkLessonUnlockRules(lessonId);
    },

    getLessonById: function(lessonId) {
      if (typeof getCurriculumItem === "function") {
        return getCurriculumItem("lessons", lessonId);
      }
      return null;
    },

    getReviewTargets: function(userContext) {
      userContext = userContext || {};
      var targets = [];
      var chordMastery = {};
      var lessonMastery = {};

      // Read mastery data from global state or userContext
      if (typeof S !== "undefined" && S.mastery) {
        chordMastery = S.mastery.chords || {};
        lessonMastery = S.mastery.lessons || {};
      }
      if (userContext.chordMastery) chordMastery = userContext.chordMastery;
      if (userContext.lessonMastery) lessonMastery = userContext.lessonMastery;

      // Find chords below mastery threshold (below 75 = needs review)
      var chordProgress = (typeof S !== "undefined" && S.chordProgress) ? S.chordProgress : {};
      for (var chordName in chordProgress) {
        if (!Object.prototype.hasOwnProperty.call(chordProgress, chordName)) continue;
        var progress = chordProgress[chordName];
        if (progress > 0 && progress < 75) {
          targets.push({
            type: "chord",
            id: chordName,
            mastery: progress,
            priority: progress < 25 ? "high" : progress < 50 ? "medium" : "low"
          });
        }
      }

      // Sort by priority: high first (lowest mastery)
      targets.sort(function(a, b) { return a.mastery - b.mastery; });

      // Limit to top 5 review targets
      return targets.slice(0, 5);
    }
  };

})();
