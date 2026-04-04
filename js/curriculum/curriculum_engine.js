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
    },

    buildLearningQueue: function(userContext) {
      userContext = userContext || {};
      var queue = [];

      // 1. Get review targets (chords needing practice)
      var reviews = this.getReviewTargets(userContext);
      for (var i = 0; i < reviews.length && i < 2; i++) {
        queue.push({
          type: "review",
          id: reviews[i].id,
          label: "Review: " + reviews[i].id,
          priority: reviews[i].priority,
          mastery: reviews[i].mastery
        });
      }

      // 2. Get next lesson from curriculum
      var completedLessons = [];
      if (typeof S !== "undefined") {
        completedLessons = Array.isArray(S.completedLessons) ? S.completedLessons.slice() : [];
        if (S.mastery && S.mastery.lessons) {
          for (var lessonId in S.mastery.lessons) {
            if (S.mastery.lessons[lessonId] && completedLessons.indexOf(lessonId) === -1) {
              completedLessons.push(lessonId);
            }
          }
        }
      }

      // Try to find next lesson from active instrument's curriculum
      var inst = typeof SparkInstruments !== "undefined" ? SparkInstruments.getActive() : null;
      if (inst) {
        var currMap = typeof inst.getCurriculumMap === "function" ? inst.getCurriculumMap() : [];
        if (currMap.length > 0) {
          var firstLessonId = currMap[0] && currMap[0].id ? currMap[0].id : null;
          if (firstLessonId) {
            var nextId = this.getNextLesson(firstLessonId, completedLessons);
            if (nextId) {
              var lesson = this.getLessonById(nextId);
              queue.push({
                type: "lesson",
                id: nextId,
                label: lesson ? lesson.title || nextId : nextId,
                priority: "normal"
              });
            }
          }
        }
      }

      // 3. Add a practice/drill suggestion if queue is short
      if (queue.length < 3 && reviews.length > 0) {
        queue.push({
          type: "drill",
          id: "review_drill",
          label: "Drill: " + reviews[0].id + " practice",
          priority: "low"
        });
      }

      return queue;
    }
  };

})();
