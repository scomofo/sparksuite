(function(){

  function progressionTreeRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function progressionTreeRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = progressionTreeRoot();
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

  function progressionTreeWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = progressionTreeRoot();
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

  function buildProgressionTree(){
    progressionTreeWrite("progressionTree", {
      chords: ["C","G","Am","F","Dm","E"],
      rhythm: ["quarter","eighth","strum_patterns"],
      songs: ["song1","song2","song3"],
      lessons: ["lesson1","lesson2","lesson3"]
    });
  }

  function getNextRecommendedLesson(){
    if(!progressionTreeRead("progressionTree", null)) buildProgressionTree();
    var progressionTree = progressionTreeRead("progressionTree", {}) || {};
    var lessons = progressionTree.lessons || [];
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
