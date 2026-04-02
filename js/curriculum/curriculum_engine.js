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

})();
