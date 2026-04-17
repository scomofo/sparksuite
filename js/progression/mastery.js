(function(){

  function masteryRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function masteryRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = masteryRoot();
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

  function masteryWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = masteryRoot();
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

  function ensureMasteryBucket(skillType){
    var mastery = masteryRead("mastery", null);
    if(!mastery || typeof mastery !== "object" || Array.isArray(mastery)) mastery = {};
    if(!mastery[skillType] || typeof mastery[skillType] !== "object" || Array.isArray(mastery[skillType])) mastery[skillType] = {};
    masteryWrite("mastery", mastery);
    return mastery[skillType];
  }

  function updateMastery(skillType, skillId, accuracy){
    var bucket = ensureMasteryBucket(skillType);
    if(!bucket[skillId]){
      bucket[skillId] = accuracy;
    }else{
      var prev = bucket[skillId];
      bucket[skillId] = (prev * 0.7) + (accuracy * 0.3);
    }
    masteryWrite(["mastery", skillType], bucket);
  }

  function updateMasteryFromPerformance(result){
    if(!result) return;

    if(result.chords){
      for(var c in result.chords){
        updateMastery("chords", c, result.chords[c]);
      }
    }

    if(result.transitions){
      for(var t in result.transitions){
        updateMastery("transitions", t, result.transitions[t]);
      }
    }

    if(result.rhythm){
      for(var r in result.rhythm){
        updateMastery("rhythm", r, result.rhythm[r]);
      }
    }

    if(result.songId){
      updateMastery("songs", result.songId, result.accuracy);
    }

    saveState();
  }

  function getMastery(skillType, skillId){
    return masteryRead(["mastery", skillType, skillId], 0) || 0;
  }

  function getAverageMastery(skillType){
    var bucket = masteryRead(["mastery", skillType], {}) || {};
    var total = 0;
    var count = 0;
    for(var k in bucket){
      total += bucket[k];
      count++;
    }
    return count ? total / count : 0;
  }

  window.updateMasteryFromPerformance = updateMasteryFromPerformance;
  window.getMastery = getMastery;
  window.getAverageMastery = getAverageMastery;

})();
