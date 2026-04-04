(function(){

  function _ensureCP(){
    if(typeof ensureCareerProgress === "function") ensureCareerProgress();
    else{
      if(!S.careerProgress) S.careerProgress = {};
      if(!S.careerProgress.unlockedTiers) S.careerProgress.unlockedTiers = {};
      if(!S.careerProgress.unlockedStages) S.careerProgress.unlockedStages = {};
      if(!S.careerProgress.unlockedSongs) S.careerProgress.unlockedSongs = {};
      if(!S.careerProgress.songRatings) S.careerProgress.songRatings = {};
      if(!S.careerProgress.stageCompletion) S.careerProgress.stageCompletion = {};
    }
  }

  function unlockCareerTier(id){
    _ensureCP();
    S.careerProgress.unlockedTiers[id] = true;
    saveState();
  }

  function unlockCareerStage(id){
    _ensureCP();
    S.careerProgress.unlockedStages[id] = true;
    saveState();
  }

  function unlockCareerSong(id){
    _ensureCP();
    S.careerProgress.unlockedSongs[id] = true;
    saveState();
  }

  function isCareerSongUnlocked(id){
    _ensureCP();
    return !!S.careerProgress.unlockedSongs[id];
  }

  function evaluateCareerUnlocks(careerId){
    _ensureCP();
    var career = getCareerItem("careers", careerId || S.activeCareerId);
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
        if(S.careerProgress.unlockedStages[stage.id]){
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
    S.careerProgress.stageCompletion[stageId] = true;
    saveState();
    return true;
  }

  function hasSongClearedCareer(songId){
    _ensureCP();
    var ratings = S.careerProgress.songRatings || {};
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
