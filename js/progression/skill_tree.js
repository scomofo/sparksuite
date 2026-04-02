(function(){

  function buildSkillTree(){
    return {
      branches: [
        buildChordBranch(),
        buildTransitionBranch(),
        buildSongBranch(),
        buildRhythmBranch(),
        buildLeadBranch()
      ]
    };
  }

  function buildChordBranch(){
    var nodes = [];

    if(typeof CURRICULUM==="undefined" || !Array.isArray(CURRICULUM)) return { id:"chords", label:"Chords", nodes:[] };

    for(var i=0;i<CURRICULUM.length;i++){
      var level = CURRICULUM[i];
      var levelNode = {
        id:"chord_level_" + level.num,
        branch:"chords",
        label:"Level " + level.num + " \u00b7 " + level.title,
        status:getChordLevelStatus(level),
        progress:getChordLevelProgress(level),
        meta:{ level:level.num, kind:"level" },
        children:[]
      };

      for(var j=0;j<level.chords.length;j++){
        var chordName = level.chords[j];
        var prog = S.chordProgress && S.chordProgress[chordName] || 0;

        levelNode.children.push({
          id:"chord_" + chordName.replace(/\s+/g,"_"),
          branch:"chords",
          label:chordName,
          status:getProgressStatus(prog, level.num),
          progress:prog,
          meta:{ level:level.num, kind:"chord" }
        });
      }

      nodes.push(levelNode);
    }

    return { id:"chords", label:"Chords", nodes:nodes };
  }

  function buildTransitionBranch(){
    var nodes = [];
    var ts = S.transitionStats || {};

    for(var key in ts){
      var row = ts[key];
      if(!row) continue;
      nodes.push({
        id:"transition_" + key.replace(/[^a-zA-Z0-9]/g,"_"),
        branch:"transitions",
        label:key.replace("->"," \u2192 "),
        status:getTransitionStatus(row),
        progress:getTransitionProgress(row),
        meta:{ kind:"transition", attempts:row.attempts || 0, avgTime:row.avgTime || 0 }
      });
    }

    nodes.sort(function(a,b){ return a.progress - b.progress; });
    return { id:"transitions", label:"Transitions", nodes:nodes.slice(0,20) };
  }

  function buildSongBranch(){
    var nodes = [];
    var perf = S.performanceStats || {};

    for(var songId in perf){
      var overview = getSongMasteryOverview(songId);
      nodes.push({
        id:"song_" + songId,
        branch:"songs",
        label:overview.title || songId,
        status:overview.status,
        progress:overview.progress,
        meta:{ kind:"song", mastered:overview.mastered, stars:overview.bestStars || 0 }
      });
    }

    nodes.sort(function(a,b){ return b.progress - a.progress; });
    return { id:"songs", label:"Songs", nodes:nodes };
  }

  function buildRhythmBranch(){
    var rr = S.rhythmResults;
    var progress = rr && typeof rr.accuracy==="number" ? rr.accuracy : 0;

    return {
      id:"rhythm",
      label:"Rhythm",
      nodes:[
        {
          id:"rhythm_core",
          branch:"rhythm",
          label:"Timing Accuracy",
          status:getSimpleMasteryStatus(progress),
          progress:progress,
          meta:{ kind:"rhythm" }
        }
      ]
    };
  }

  function buildLeadBranch(){
    var unlocked = isLeadReady();
    return {
      id:"lead",
      label:"Lead",
      nodes:[
        {
          id:"lead_intro",
          branch:"lead",
          label:"Lead Readiness",
          status:unlocked ? "available" : "locked",
          progress:unlocked ? 50 : 0,
          meta:{ kind:"lead_intro" }
        }
      ]
    };
  }

  function getProgressStatus(progress, levelNum){
    if(levelNum > (S.level || 1)) return "locked";
    if(progress >= 90) return "mastered";
    if(progress >= 25) return "developing";
    return "available";
  }

  function getSimpleMasteryStatus(progress){
    if(progress >= 90) return "mastered";
    if(progress >= 40) return "developing";
    if(progress > 0) return "available";
    return "locked";
  }

  function getChordLevelProgress(level){
    if(!level || !Array.isArray(level.chords) || !level.chords.length) return 0;
    var sum = 0;
    for(var i=0;i<level.chords.length;i++){
      sum += (S.chordProgress && S.chordProgress[level.chords[i]] || 0);
    }
    return Math.round(sum / level.chords.length);
  }

  function getChordLevelStatus(level){
    var progress = getChordLevelProgress(level);
    if(level.num > (S.level || 1)) return "locked";
    return getSimpleMasteryStatus(progress);
  }

  function getTransitionProgress(row){
    if(!row || !row.attempts) return 0;
    var speed = row.avgTime || 10;
    var score = Math.max(0, 100 - Math.round(speed * 20));
    if(row.attempts < 3) score = Math.round(score * 0.6);
    return score;
  }

  function getTransitionStatus(row){
    return getSimpleMasteryStatus(getTransitionProgress(row));
  }

  function getSongMasteryOverview(songId){
    var perf = S.performanceStats || {};
    var songStats = perf[songId];
    if(!songStats) return { title:songId, progress:0, status:"locked", mastered:false, bestStars:0 };

    var bestAcc = 0, bestStars = 0, mastered = false;

    for(var arrangementType in songStats){
      for(var difficultyId in songStats[arrangementType]){
        var b = songStats[arrangementType][difficultyId];
        if(!b) continue;
        if((b.bestAccuracy || 0) > bestAcc) bestAcc = b.bestAccuracy || 0;
        if((b.bestStars || 0) > bestStars) bestStars = b.bestStars || 0;
        if(b.mastered) mastered = true;
      }
    }

    var title = findSongTitleById(songId) || songId;
    return {
      title:title,
      progress:bestAcc,
      status:mastered ? "mastered" : getSimpleMasteryStatus(bestAcc),
      mastered:mastered,
      bestStars:bestStars
    };
  }

  function findSongTitleById(songId){
    if(typeof SONGS==="undefined" || !Array.isArray(SONGS)) return songId;
    for(var i=0;i<SONGS.length;i++){
      var sid = (SONGS[i].title || "song").toLowerCase().replace(/\s+/g,"_");
      if(sid===songId) return SONGS[i].title;
    }
    return songId;
  }

  function isLeadReady(){
    var perf = S.performanceStats || {};
    var masteredCount = 0;

    for(var songId in perf){
      var songStats = perf[songId];
      if(songStats.chords && songStats.chords.normal && songStats.chords.normal.mastered){
        masteredCount++;
      }
    }

    return masteredCount >= 2 || (S.level || 1) >= 4;
  }

  window.buildSkillTree = buildSkillTree;
  window.getSongMasteryOverview = getSongMasteryOverview;
  window.isLeadReady = isLeadReady;

})();
