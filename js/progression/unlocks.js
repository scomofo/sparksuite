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
    if(getMastery("chords","C") > 70 &&
       getMastery("chords","G") > 70){
      unlockContent("chords","F");
    }

    // Lesson unlock rules
    if(getAverageMastery("rhythm") > 60){
      unlockContent("lessons","strumming_1");
    }

    if(getAverageMastery("transitions") > 70){
      unlockContent("lessons","transitions_2");
    }

    // Song unlock rules
    if(getAverageMastery("songs") > 75){
      unlockContent("songs","song_2");
    }
  }

  window.unlockContent = unlockContent;
  window.isUnlocked = isUnlocked;
  window.evaluateUnlocks = evaluateUnlocks;

})();
