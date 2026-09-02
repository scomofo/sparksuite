(function(){

  function recordPracticeSession(result){
    if(!result) return;
    if(window.SparkProgressBridge && typeof SparkProgressBridge.applyPracticeSessionRecord === "function"){
      SparkProgressBridge.applyPracticeSessionRecord(result);
    }else{
      result.ts = Date.now();
      if(!Array.isArray(S.practiceHistory)) S.practiceHistory = [];
      S.practiceHistory.push(result);
      updatePracticeTime(result.durationMin || 0);
      updatePracticeStreak();
    }
    saveState();
  }

  function updatePracticeTime(minutes){
    if(!minutes) return;
    S.totalPracticeMinutes = (S.totalPracticeMinutes || 0) + minutes;
    S.todayPracticeMinutes = (S.todayPracticeMinutes || 0) + minutes;
  }

  function updatePracticeStreak(){
    var today = SparkDay.today();
    if(S.lastPracticeDate === today) return;
    var yesterday = SparkDay.addDays(today, -1);
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
