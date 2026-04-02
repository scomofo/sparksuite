(function(){

  function recordPracticeSession(result){
    if(!result) return;
    result.ts = Date.now();
    S.practiceHistory.push(result);
    updatePracticeTime(result.durationMin || 0);
    updatePracticeStreak();
    saveState();
  }

  function updatePracticeTime(minutes){
    if(!minutes) return;
    S.totalPracticeMinutes += minutes;
    S.todayPracticeMinutes += minutes;
  }

  function updatePracticeStreak(){
    var today = new Date().toISOString().slice(0,10);
    if(S.lastPracticeDate === today) return;
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    if(S.lastPracticeDate === yesterday){
      S.practiceStreak++;
    }else{
      S.practiceStreak = 1;
    }
    S.lastPracticeDate = today;
  }

  function getPracticeStats(){
    return {
      streak: S.practiceStreak || 0,
      totalMinutes: S.totalPracticeMinutes || 0,
      todayMinutes: S.todayPracticeMinutes || 0,
      sessions: (S.practiceHistory || []).length
    };
  }

  window.recordPracticeSession = recordPracticeSession;
  window.getPracticeStats = getPracticeStats;

})();
