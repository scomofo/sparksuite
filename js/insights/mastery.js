(function(){

  function getInsightStateRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function getInsightSnapshots() {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(["insightSnapshots"], []);
    }
    var root = getInsightStateRoot();
    return root && Array.isArray(root.insightSnapshots) ? root.insightSnapshots : [];
  }

  function getMasterySnapshot() {
    if (window.sparkCore && typeof window.sparkCore.getLegacyProgressSnapshot === "function") {
      var progress = window.sparkCore.getLegacyProgressSnapshot();
      if (progress && progress.mastery) return progress.mastery;
    }
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(["mastery"], {});
    }
    var root = getInsightStateRoot();
    return root && root.mastery ? root.mastery : {};
  }

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
    var mastery = getMasterySnapshot();
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
    var snaps = getInsightSnapshots();
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
