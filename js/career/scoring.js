(function(){

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
    var stars = getStarsForPerformance(result);
    var key = getCareerSongKey(result.songId, result.arrangementType);
    if(!S.careerProgress.songRatings[key]){
      S.careerProgress.songRatings[key] = {
        bestStars: 0,
        bestAccuracy: 0,
        plays: 0
      };
    }
    var row = S.careerProgress.songRatings[key];
    row.bestStars = Math.max(row.bestStars, stars);
    row.bestAccuracy = Math.max(row.bestAccuracy, result.accuracy || 0);
    row.plays++;
    saveState();
    return stars;
  }

  window.getStarsForPerformance = getStarsForPerformance;
  window.updateSongCareerRating = updateSongCareerRating;
  window.getCareerSongKey = getCareerSongKey;

})();
