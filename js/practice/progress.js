(function(){

  function practiceProgressRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function practiceProgressRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = practiceProgressRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function practiceProgressWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = practiceProgressRoot();
    if(root) root[path] = value;
    return value;
  }

  function practiceProgressEnsureArray(path){
    var arr = practiceProgressRead(path, null);
    if(!Array.isArray(arr)){
      arr = [];
      practiceProgressWrite(path, arr);
    }
    return arr;
  }

  function recordPracticeSession(result){
    if(!result) return;
    if(window.sparkCore && typeof window.sparkCore.recordLegacyPracticeSession === "function"){
      window.sparkCore.recordLegacyPracticeSession(result);
    }else if(window.SparkProgressBridge && typeof SparkProgressBridge.applyPracticeSessionRecord === "function"){
      SparkProgressBridge.applyPracticeSessionRecord(result);
      saveState();
    }else{
      result.ts = Date.now();
      practiceProgressEnsureArray("practiceHistory").push(result);
      updatePracticeTime(result.durationMin || 0);
      updatePracticeStreak();
      saveState();
    }
  }

  function updatePracticeTime(minutes){
    if(!minutes) return;
    practiceProgressWrite("totalPracticeMinutes", (practiceProgressRead("totalPracticeMinutes", 0) || 0) + minutes);
    practiceProgressWrite("todayPracticeMinutes", (practiceProgressRead("todayPracticeMinutes", 0) || 0) + minutes);
  }

  function updatePracticeStreak(){
    var today = new Date().toISOString().slice(0,10);
    var lastPracticeDate = practiceProgressRead("lastPracticeDate", null);
    if(lastPracticeDate === today) return;
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    if(lastPracticeDate === yesterday){
      practiceProgressWrite("practiceStreak", (practiceProgressRead("practiceStreak", 0) || 0) + 1);
    }else{
      practiceProgressWrite("practiceStreak", 1);
    }
    practiceProgressWrite("lastPracticeDate", today);
  }

  function getPracticeStats(){
    return {
      streak: practiceProgressRead("practiceStreak", 0) || 0,
      totalMinutes: practiceProgressRead("totalPracticeMinutes", 0) || 0,
      todayMinutes: practiceProgressRead("todayPracticeMinutes", 0) || 0,
      sessions: practiceProgressEnsureArray("practiceHistory").length
    };
  }

  window.recordPracticeSession = recordPracticeSession;
  window.getPracticeStats = getPracticeStats;

})();
