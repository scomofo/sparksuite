(function(){

  function recordCareerPerformance(result){
    if(!result || !result.songId) return;
    var stars = updateSongCareerRating(result);
    applyCareerRewards(result.songId, result.arrangementType, stars);
    var stageId = findCareerStageForSong(result.songId);
    if(stageId){
      checkStageCompletion(stageId);
    }
    evaluateCareerUnlocks(S.activeCareerId);
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
    var career = getCareerItem("careers", S.activeCareerId);
    if(!career) return null;
    for(var t=0;t<career.tiers.length;t++){
      var tier = getCareerItem("tiers", career.tiers[t]);
      if(!tier || !S.careerProgress.unlockedTiers[tier.id]) continue;
      for(var s=0;s<tier.stages.length;s++){
        var stage = getCareerItem("stages", tier.stages[s]);
        if(!stage || !S.careerProgress.unlockedStages[stage.id]) continue;
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
