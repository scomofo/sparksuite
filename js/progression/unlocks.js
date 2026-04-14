(function(){

  function progressionUnlockRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function progressionUnlockRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = progressionUnlockRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function progressionUnlockWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = progressionUnlockRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function unlockContent(type, id){
    var unlocks = progressionUnlockRead("unlocks", {}) || {};
    if(!unlocks[type] || typeof unlocks[type] !== "object") unlocks[type] = {};
    unlocks[type][id] = true;
    progressionUnlockWrite("unlocks", unlocks);
    saveState();
  }

  function isUnlocked(type, id){
    var unlocks = progressionUnlockRead("unlocks", {}) || {};
    return unlocks[type] && unlocks[type][id];
  }

  function evaluateUnlocks(){
    // Chord unlock rules
    if(getMastery("chords","C") > 0.7 &&
       getMastery("chords","G") > 0.7){
      unlockContent("chords","F");
    }

    // Lesson unlock rules
    if(getAverageMastery("rhythm") > 0.6){
      unlockContent("lessons","strumming_1");
    }

    if(getAverageMastery("transitions") > 0.7){
      unlockContent("lessons","transitions_2");
    }

    // Song unlock rules
    if(getAverageMastery("songs") > 0.75){
      unlockContent("songs","song_2");
    }
  }

  window.unlockContent = unlockContent;
  window.isUnlocked = isUnlocked;
  window.evaluateUnlocks = evaluateUnlocks;

})();
