(function(){

  function getCareerProgressValue(key, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(["careerProgress", key], fallback);
    }
    return fallback;
  }

  function buildCareerInsights(){
    var ratings = getCareerProgressValue("songRatings", {});
    var totalSongs = 0;
    var clearedSongs = 0;
    var totalStars = 0;
    for(var k in ratings){
      totalSongs++;
      totalStars += ratings[k].bestStars || 0;
      if((ratings[k].bestStars || 0) >= 2){
        clearedSongs++;
      }
    }
    return {
      totalSongsPlayed: totalSongs,
      clearedSongs: clearedSongs,
      averageStars: totalSongs ? totalStars / totalSongs : 0,
      completedStages: countCompletedStages()
    };
  }

  function countCompletedStages(){
    var row = getCareerProgressValue("stageCompletion", {});
    var n = 0;
    for(var k in row){
      if(row[k]) n++;
    }
    return n;
  }

  window.buildCareerInsights = buildCareerInsights;

})();
