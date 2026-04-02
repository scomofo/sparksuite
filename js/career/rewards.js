(function(){

  function applyCareerRewards(songId, arrangementType, stars){
    var song = getCareerItem("songs", songId);
    if(!song) return;
    if(song.rewards && song.rewards.xp){
      if(typeof awardXP === "function") awardXP(song.rewards.xp, "career_song_clear");
    }
    if(song.rewards && Array.isArray(song.rewards.unlockSongs)){
      for(var i=0;i<song.rewards.unlockSongs.length;i++){
        unlockCareerSong(song.rewards.unlockSongs[i]);
      }
    }
    if(stars >= 3 && typeof evaluateAchievements === "function"){
      evaluateAchievements();
    }
    saveState();
  }

  window.applyCareerRewards = applyCareerRewards;

})();
