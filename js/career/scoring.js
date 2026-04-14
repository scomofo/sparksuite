(function(){

  function careerScoringRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function careerScoringRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = careerScoringRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function careerScoringWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = careerScoringRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function ensureCareerProgress(){
    var progress = careerScoringRead("careerProgress", null);
    if(!progress || typeof progress !== "object" || Array.isArray(progress)) progress = {};
    if(!progress.songRatings) progress.songRatings = {};
    if(!progress.unlockedTiers) progress.unlockedTiers = {};
    if(!progress.unlockedStages) progress.unlockedStages = {};
    if(!progress.unlockedSongs) progress.unlockedSongs = {};
    if(!progress.stageCompletion) progress.stageCompletion = {};
    careerScoringWrite("careerProgress", progress);
    return progress;
  }

  function getStarsForPerformance(result){
    var acc = result && result.accuracy || 0;
    if(acc >= 0.98) return 5;
    if(acc >= 0.93) return 4;
    if(acc >= 0.85) return 3;
    if(acc >= 0.75) return 2;
    if(acc >= 0.60) return 1;
    return 0;
  }

  function getCareerSongKey(songId, arrangementType){
    return String(songId) + "::" + String(arrangementType || "default");
  }

  function updateSongCareerRating(result){
    if(!result || !result.songId) return 0;
    var careerProgress = ensureCareerProgress();
    var stars = getStarsForPerformance(result);
    var key = getCareerSongKey(result.songId, result.arrangementType);
    if(!careerProgress.songRatings[key]){
      careerProgress.songRatings[key] = {
        bestStars: 0,
        bestAccuracy: 0,
        plays: 0
      };
    }
    var row = careerProgress.songRatings[key];
    row.bestStars = Math.max(row.bestStars, stars);
    row.bestAccuracy = Math.max(row.bestAccuracy, result.accuracy || 0);
    row.plays++;
    careerScoringWrite("careerProgress", careerProgress);
    saveState();
    return stars;
  }

  window.getStarsForPerformance = getStarsForPerformance;
  window.updateSongCareerRating = updateSongCareerRating;
  window.getCareerSongKey = getCareerSongKey;
  window.ensureCareerProgress = ensureCareerProgress;

})();
