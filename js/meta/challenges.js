(function(){

  function challengeStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function challengeStateRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = challengeStateRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function challengeStateWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = challengeStateRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function challengeEnsureArray(path){
    var arr = challengeStateRead(path, null);
    if(!Array.isArray(arr)){
      arr = [];
      challengeStateWrite(path, arr);
    }
    return arr;
  }

  function generateDailyChallenges(){
    var challenges = [];
    challenges.push({
      id: generateId("challenge"),
      type: "practice_minutes",
      target: 15,
      progress: 0,
      xp: 40
    });
    challenges.push({
      id: generateId("challenge"),
      type: "complete_song",
      target: 1,
      progress: 0,
      xp: 60
    });
    challenges.push({
      id: generateId("challenge"),
      type: "weak_spot",
      target: 1,
      progress: 0,
      xp: 50
    });
    challengeStateWrite("dailyChallenges", challenges);
    saveState();
  }

  function updateChallengeProgress(type, amount){
    var arr = challengeEnsureArray("dailyChallenges");
    for(var i=0;i<arr.length;i++){
      if(arr[i].type === type && !arr[i].completed){
        arr[i].progress += amount || 1;
        if(arr[i].progress >= arr[i].target){
          completeChallenge(arr[i]);
        }
      }
    }
  }

  function completeChallenge(ch){
    ch.completed = true;
    awardXP(ch.xp, "challenge");
    challengeStateWrite(["metaProgress", "challengesCompleted"], (challengeStateRead(["metaProgress", "challengesCompleted"], 0) || 0) + 1);
    challengeEnsureArray("challengeHistory").push(ch);
    saveState();
  }

  window.generateDailyChallenges = generateDailyChallenges;
  window.updateChallengeProgress = updateChallengeProgress;

})();
