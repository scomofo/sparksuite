(function(){

  function careerEngineRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function careerEngineRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = careerEngineRoot();
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

  function recordCareerPerformance(result){
    if(!result || !result.songId) return;
    var stars = updateSongCareerRating(result);
    applyCareerRewards(result.songId, result.arrangementType, stars);
    var stageId = findCareerStageForSong(result.songId);
    if(stageId){
      checkStageCompletion(stageId);
    }
    evaluateCareerUnlocks(careerEngineRead("activeCareerId", null));
    saveState();
  }

  function findCareerStageForSong(songId){
    var stages = SparkCareer.stages || {};
    for(var id in stages){
      if((stages[id].songs || []).indexOf(songId) >= 0){
        return id;
      }
    }
    return null;
  }

  function getRecommendedCareerSong(){
    var activeCareerId = careerEngineRead("activeCareerId", null);
    var careerProgress = careerEngineRead("careerProgress", {}) || {};
    var career = getCareerItem("careers", activeCareerId);
    if(!career) return null;
    for(var t=0;t<career.tiers.length;t++){
      var tier = getCareerItem("tiers", career.tiers[t]);
      if(!tier || !(careerProgress.unlockedTiers || {})[tier.id]) continue;
      for(var s=0;s<tier.stages.length;s++){
        var stage = getCareerItem("stages", tier.stages[s]);
        if(!stage || !(careerProgress.unlockedStages || {})[stage.id]) continue;
        for(var i=0;i<(stage.songs || []).length;i++){
          if(hasSongClearedCareer(stage.songs[i]) === false){
            return stage.songs[i];
          }
        }
      }
    }
    return null;
  }

  window.recordCareerPerformance = recordCareerPerformance;
  window.findCareerStageForSong = findCareerStageForSong;
  window.getRecommendedCareerSong = getRecommendedCareerSong;

})();
