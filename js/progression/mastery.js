(function(){

  function updateMastery(skillType, skillId, accuracy){
    if(!S.mastery[skillType]) S.mastery[skillType] = {};
    if(!S.mastery[skillType][skillId]){
      S.mastery[skillType][skillId] = accuracy;
    }else{
      var prev = S.mastery[skillType][skillId];
      S.mastery[skillType][skillId] = (prev * 0.7) + (accuracy * 0.3);
    }
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
    if(!S.mastery[skillType]) return 0;
    return S.mastery[skillType][skillId] || 0;
  }

  function getAverageMastery(skillType){
    var bucket = S.mastery[skillType] || {};
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
