(function(){

  function careerUnlockRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      return SparkState.getRoot();
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function careerUnlockRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = careerUnlockRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function careerUnlockWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = careerUnlockRoot();
    if(root) root[path] = value;
    return value;
  }

  function getCareerProgressState(){
    return careerUnlockRead("careerProgress", null);
  }

  function _ensureCP(){
    if(typeof ensureCareerProgress === "function") ensureCareerProgress();
    else{
      var careerProgress = getCareerProgressState();
      if(!careerProgress || typeof careerProgress !== "object") careerProgress = {};
      if(!careerProgress.unlockedTiers) careerProgress.unlockedTiers = {};
      if(!careerProgress.unlockedStages) careerProgress.unlockedStages = {};
      if(!careerProgress.unlockedSongs) careerProgress.unlockedSongs = {};
      if(!careerProgress.songRatings) careerProgress.songRatings = {};
      if(!careerProgress.stageCompletion) careerProgress.stageCompletion = {};
      careerUnlockWrite("careerProgress", careerProgress);
    }
  }

  function unlockCareerTier(id){
    _ensureCP();
    getCareerProgressState().unlockedTiers[id] = true;
    saveState();
  }

  function unlockCareerStage(id){
    _ensureCP();
    getCareerProgressState().unlockedStages[id] = true;
    saveState();
  }

  function unlockCareerSong(id){
    _ensureCP();
    getCareerProgressState().unlockedSongs[id] = true;
    saveState();
  }

  function isCareerSongUnlocked(id){
    _ensureCP();
    return !!getCareerProgressState().unlockedSongs[id];
  }

  function evaluateCareerUnlocks(careerId){
    _ensureCP();
    var careerProgress = getCareerProgressState();
    var career = getCareerItem("careers", careerId || careerUnlockRead("activeCareerId", null));
    if(!career) return;
    for(var t=0;t<career.tiers.length;t++){
      var tier = getCareerItem("tiers", career.tiers[t]);
      if(!tier) continue;
      if(t===0) unlockCareerTier(tier.id);
      for(var s=0;s<tier.stages.length;s++){
        var stage = getCareerItem("stages", tier.stages[s]);
        if(!stage) continue;
        if(t===0 && s===0){
          unlockCareerStage(stage.id);
        }
        if(careerProgress.unlockedStages[stage.id]){
          for(var i=0;i<(stage.songs || []).length;i++){
            unlockCareerSong(stage.songs[i]);
          }
        }
      }
    }
  }

  function checkStageCompletion(stageId){
    _ensureCP();
    var stage = getCareerItem("stages", stageId);
    if(!stage) return false;
    for(var i=0;i<(stage.songs || []).length;i++){
      if(!hasSongClearedCareer(stage.songs[i])){
        return false;
      }
    }
    getCareerProgressState().stageCompletion[stageId] = true;
    saveState();
    return true;
  }

  function hasSongClearedCareer(songId){
    _ensureCP();
    var ratings = getCareerProgressState().songRatings || {};
    for(var key in ratings){
      if(key.indexOf(String(songId) + "::") === 0 && (ratings[key].bestStars || 0) >= 2){
        return true;
      }
    }
    return false;
  }

  window.unlockCareerTier = unlockCareerTier;
  window.unlockCareerStage = unlockCareerStage;
  window.unlockCareerSong = unlockCareerSong;
  window.isCareerSongUnlocked = isCareerSongUnlocked;
  window.evaluateCareerUnlocks = evaluateCareerUnlocks;
  window.checkStageCompletion = checkStageCompletion;
  window.hasSongClearedCareer = hasSongClearedCareer;

})();
