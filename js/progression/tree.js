(function(){

  function buildProgressionTree(){
    S.progressionTree = {
      chords: ["C","G","Am","F","Dm","E"],
      rhythm: ["quarter","eighth","strum_patterns"],
      songs: ["song1","song2","song3"],
      lessons: ["lesson1","lesson2","lesson3"]
    };
  }

  function getNextRecommendedLesson(){
    if(!S.progressionTree) buildProgressionTree();
    var lessons = S.progressionTree.lessons;
    for(var i=0;i<lessons.length;i++){
      if(!isUnlocked("lessons", lessons[i])){
        return lessons[i];
      }
    }
    return null;
  }

  window.buildProgressionTree = buildProgressionTree;
  window.getNextRecommendedLesson = getNextRecommendedLesson;

})();
