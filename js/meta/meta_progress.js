(function(){

  function updateMetaProgressFromPerformance(result){
    if(!result) return;
    updateChallengeProgress("complete_song", 1);
    updateWeeklyGoal("songs_completed", 1);
    if(result.durationMin){
      updateChallengeProgress("practice_minutes", result.durationMin);
      updateWeeklyGoal("practice_minutes", result.durationMin);
    }
    saveState();
  }

  window.updateMetaProgressFromPerformance = updateMetaProgressFromPerformance;

})();
