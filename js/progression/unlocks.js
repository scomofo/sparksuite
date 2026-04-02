(function(){

  function unlockContent(type, id){
    if(!S.unlocks[type]) S.unlocks[type] = {};
    S.unlocks[type][id] = true;
    saveState();
  }

  function isUnlocked(type, id){
    return S.unlocks[type] && S.unlocks[type][id];
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
