(function(){

  function getWeakestMasterySkills(limit){
    var rows = flattenMasteryBuckets();
    rows.sort(function(a,b){ return a.value - b.value; });
    return rows.slice(0, limit || 5);
  }

  function getStrongestMasterySkills(limit){
    var rows = flattenMasteryBuckets();
    rows.sort(function(a,b){ return b.value - a.value; });
    return rows.slice(0, limit || 5);
  }

  function flattenMasteryBuckets(){
    var out = [];
    var mastery = S.mastery || {};
    for(var bucket in mastery){
      var items = mastery[bucket] || {};
      for(var id in items){
        out.push({
          bucket: bucket,
          id: id,
          value: items[id]
        });
      }
    }
    return out;
  }

  function buildMasteryTrend(){
    var snaps = S.insightSnapshots || [];
    return {
      chords: extractSeries(snaps, "mastery", "chords"),
      transitions: extractSeries(snaps, "mastery", "transitions"),
      rhythm: extractSeries(snaps, "mastery", "rhythm"),
      songs: extractSeries(snaps, "mastery", "songs")
    };
  }

  function extractSeries(snaps, group, field){
    var out = [];
    for(var i=0;i<snaps.length;i++){
      out.push({
        ts: snaps[i].ts,
        value: snaps[i][group] ? (snaps[i][group][field] || 0) : 0
      });
    }
    return out;
  }

  window.getWeakestMasterySkills = getWeakestMasterySkills;
  window.getStrongestMasterySkills = getStrongestMasterySkills;
  window.buildMasteryTrend = buildMasteryTrend;

})();
