(function(){

  function getPerformanceTotals(){
    var out={runs:0,masteredSongs:0,songsPlayed:0,avgAccuracy:0,totalStars:0};
    var accSum=0,accCount=0,songSet={};
    for(var key in(S.performanceStats||{})){
      var st=S.performanceStats[key];
      if(!st||!st.runs)continue;
      out.runs+=st.runs;
      out.totalStars+=st.bestStars||0;
      accSum+=st.bestAccuracy||0;accCount++;
      if(st.mastery==="mastered")out.masteredSongs++;
      songSet[st.songId||key]=true;
    }
    out.songsPlayed=Object.keys(songSet).length;
    out.avgAccuracy=accCount>0?Math.round(accSum/accCount):0;
    return out;
  }

  function getPerformanceRecentRuns(){
    var runs=[];
    for(var key in(S.performanceStats||{})){
      var st=S.performanceStats[key];
      if(!st||!st.lastPlayed)continue;
      runs.push({key:key,songId:st.songId||key,arrangement:st.arrangement,difficulty:st.difficulty,bestScore:st.bestScore,bestAccuracy:st.bestAccuracy,bestStars:st.bestStars,mastery:st.mastery,lastPlayed:st.lastPlayed,runs:st.runs});
    }
    runs.sort(function(a,b){return(b.lastPlayed||"").localeCompare(a.lastPlayed||"");});
    return runs.slice(0,10);
  }

  function getPerformanceTopSongs(){
    var songs=[];
    for(var key in(S.performanceStats||{})){
      var st=S.performanceStats[key];
      if(!st||!st.runs)continue;
      songs.push({key:key,songId:st.songId||key,arrangement:st.arrangement,difficulty:st.difficulty,bestScore:st.bestScore,bestAccuracy:st.bestAccuracy,bestStars:st.bestStars,mastery:st.mastery,runs:st.runs});
    }
    songs.sort(function(a,b){return(b.bestScore||0)-(a.bestScore||0);});
    return songs.slice(0,5);
  }

  function getPerformanceWeakSongs(){
    var songs=[];
    for(var key in(S.performanceStats||{})){
      var st=S.performanceStats[key];
      if(!st||!st.runs)continue;
      songs.push({key:key,songId:st.songId||key,arrangement:st.arrangement,difficulty:st.difficulty,bestAccuracy:st.bestAccuracy,bestStars:st.bestStars,mastery:st.mastery,runs:st.runs});
    }
    songs.sort(function(a,b){return(a.bestAccuracy||0)-(b.bestAccuracy||0);});
    return songs.slice(0,5);
  }

  window.getPerformanceTotals=getPerformanceTotals;
  window.getPerformanceRecentRuns=getPerformanceRecentRuns;
  window.getPerformanceTopSongs=getPerformanceTopSongs;
  window.getPerformanceWeakSongs=getPerformanceWeakSongs;
})();
