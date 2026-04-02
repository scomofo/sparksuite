(function(){

  function awardXP(amount, reason){
    if(!amount) return;
    S.playerXP += amount;
    checkLevelUp();
    logXPEvent(amount, reason);
    saveState();
  }

  function logXPEvent(amount, reason){
    if(!S.xpLog) S.xpLog = [];
    S.xpLog.push({
      xp: amount,
      reason: reason,
      ts: Date.now()
    });
  }

  function awardPracticeXP(minutes){
    awardXP(Math.round(minutes * 2), "practice");
  }

  function awardSongXP(accuracy){
    awardXP(20 + Math.round(accuracy * 20), "song");
  }

  function awardLessonXP(){
    awardXP(40, "lesson");
  }

  function awardStreakXP(days){
    awardXP(days * 5, "streak");
  }

  window.awardXP = awardXP;
  window.awardPracticeXP = awardPracticeXP;
  window.awardSongXP = awardSongXP;
  window.awardLessonXP = awardLessonXP;
  window.awardStreakXP = awardStreakXP;

})();
