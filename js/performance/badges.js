(function(){

  var PERFORMANCE_BADGES = [
    {
      id:"perf_first_clear",
      label:"First Performance",
      icon:"\uD83C\uDFB8",
      desc:"Complete your first performance run",
      check:function(summary){ return !!summary && summary.totalEvents > 0; }
    },
    {
      id:"perf_first_mastery",
      label:"Performance Master",
      icon:"\uD83C\uDFC6",
      desc:"Master your first performance chart",
      check:function(summary, stats){ return !!stats && !!stats.mastered; }
    },
    {
      id:"perf_first_rhythm_clear",
      label:"In The Pocket",
      icon:"\uD83E\uDD41",
      desc:"Complete your first rhythm arrangement",
      check:function(summary){ return !!summary && summary.arrangementType==="rhythm_chords"; }
    },
    {
      id:"perf_three_star_song",
      label:"Three-Star Spark",
      icon:"\u2B50",
      desc:"Earn 3 or more stars on a performance",
      check:function(summary){ return !!summary && (summary.stars||0) >= 3; }
    },
    {
      id:"perf_five_star_song",
      label:"Five-Star Fire",
      icon:"\uD83C\uDF1F",
      desc:"Earn 5 stars on a performance",
      check:function(summary){ return !!summary && (summary.stars||0) >= 5; }
    },
    {
      id:"perf_pro_clear",
      label:"Pro Clear",
      icon:"\u26A1",
      desc:"Clear a song on Pro difficulty",
      check:function(summary){ return !!summary && summary.difficultyId==="pro" && (summary.totalEvents||0) > 0; }
    },
    {
      id:"perf_phrase_master",
      label:"Phrase Master",
      icon:"\uD83C\uDFAF",
      desc:"Master a phrase with 90%+ accuracy twice",
      check:function(summary, stats){
        if(!stats || !stats.phrases) return false;
        for(var pid in stats.phrases){
          var p = stats.phrases[pid];
          if(p && p.mastered) return true;
        }
        return false;
      }
    }
  ];

  function hasPerformanceBadge(id){
    return Array.isArray(S.performanceBadges) && S.performanceBadges.indexOf(id)!==-1;
  }

  function awardPerformanceBadge(badge){
    if(!badge || hasPerformanceBadge(badge.id)) return false;
    if(!Array.isArray(S.performanceBadges)) S.performanceBadges = [];
    S.performanceBadges.push(badge.id);
    S.performanceMilestoneToast = {
      type:"badge",
      icon:badge.icon,
      label:badge.label,
      desc:badge.desc,
      time:Date.now()
    };
    return true;
  }

  function evaluatePerformanceBadges(summary, stats){
    var newlyAwarded = [];
    for(var i=0;i<PERFORMANCE_BADGES.length;i++){
      var b = PERFORMANCE_BADGES[i];
      if(hasPerformanceBadge(b.id)) continue;
      try{
        if(b.check(summary, stats)){
          if(awardPerformanceBadge(b)) newlyAwarded.push(b);
        }
      }catch(e){}
    }
    return newlyAwarded;
  }

  // Unlock helpers
  function ensurePerformanceUnlockRecord(songId, arrangementType, difficultyId){
    if(!S.performanceUnlocks) S.performanceUnlocks = {};
    var key = songId + ":" + arrangementType + ":" + difficultyId;
    if(!S.performanceUnlocks[key]){
      S.performanceUnlocks[key] = {
        firstClear:false,
        firstMastery:false,
        firstFiveStar:false
      };
    }
    return S.performanceUnlocks[key];
  }

  function applyPerformanceUnlocks(summary, stats){
    if(!summary) return { xp:0, events:[] };

    var rec = ensurePerformanceUnlockRecord(
      summary.songId,
      summary.arrangementType || "chords",
      summary.difficultyId || "normal"
    );

    var xp = 0;
    var events = [];

    if(!rec.firstClear && (summary.totalEvents||0) > 0){
      rec.firstClear = true;
      xp += 10;
      events.push({ type:"firstClear", label:"First Clear" });
    }

    if(!rec.firstMastery && stats && stats.mastered){
      rec.firstMastery = true;
      xp += 25;
      events.push({ type:"firstMastery", label:"First Mastery" });
    }

    if(!rec.firstFiveStar && (summary.stars||0) >= 5){
      rec.firstFiveStar = true;
      xp += 15;
      events.push({ type:"firstFiveStar", label:"First Five-Star Run" });
    }

    return { xp:xp, events:events };
  }

  window.PERFORMANCE_BADGES = PERFORMANCE_BADGES;
  window.hasPerformanceBadge = hasPerformanceBadge;
  window.awardPerformanceBadge = awardPerformanceBadge;
  window.evaluatePerformanceBadges = evaluatePerformanceBadges;
  window.ensurePerformanceUnlockRecord = ensurePerformanceUnlockRecord;
  window.applyPerformanceUnlocks = applyPerformanceUnlocks;

})();
