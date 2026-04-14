(function(){
  function editorRegionRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorRegionRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = editorRegionRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorRegionWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = editorRegionRoot();
    if(root) root[path] = value;
    return value;
  }

  function getBarDurationSec(){
    return getGridStepSec("1/1", getEditorBpm());
  }

  function timeToBarIndex(sec){
    var barSec = getBarDurationSec();
    return Math.floor((sec || 0) / barSec) + 1;
  }

  function barIndexToStartSec(bar){
    var barSec = getBarDurationSec();
    return Math.max(0, (bar - 1) * barSec);
  }

  function selectBarRange(startBar, endBar){
    startBar = Math.max(1, startBar || 1);
    endBar = Math.max(startBar, endBar || startBar);
    var startSec = barIndexToStartSec(startBar);
    var endSec = barIndexToStartSec(endBar + 1);
    editorRegionWrite("editorSelectedRegion", {
      startBar:startBar,
      endBar:endBar,
      startSec:startSec,
      endSec:endSec
    });
    clearEditorSelection();
    selectItemsInTimeRange(startSec, endSec);
    return true;
  }

  function selectItemsInTimeRange(startSec, endSec){
    var editorObject = editorRegionRead("editorObject", null);
    if(!editorObject) return false;
    var added = 0;
    var events = editorObject.events || [];
    for(var i=0;i<events.length;i++){
      var t = events[i].t || 0;
      if(t >= startSec && t < endSec){
        addEditorSelection(events[i].id);
        added++;
      }
    }
    var phrases = editorObject.phrases || [];
    for(var p=0;p<phrases.length;p++){
      var ps = phrases[p].startSec || 0;
      var pe = phrases[p].endSec || 0;
      if(!(pe <= startSec || ps >= endSec)){
        addEditorSelection(phrases[p].id);
        added++;
      }
    }
    return added > 0;
  }

  function deleteSelectedRegion(){
    if(!editorRegionRead("editorSelectedRegion", null)) return false;
    markEditorCheckpoint("Delete Region");
    deleteSelectedEditorItems();
    editorRegionWrite("editorSelectedRegion", null);
    return true;
  }

  function duplicateSelectedRegion(insertAtBar){
    var selectedRegion = editorRegionRead("editorSelectedRegion", null);
    var editorObject = editorRegionRead("editorObject", {}) || {};
    if(!selectedRegion) return false;
    markEditorCheckpoint("Duplicate Region");
    var startSec = selectedRegion.startSec;
    var endSec = selectedRegion.endSec;
    var insertSec = barIndexToStartSec(insertAtBar || (selectedRegion.endBar + 1));
    var delta = insertSec - startSec;
    var sourceEvents = (editorObject.events || []).slice();
    var sourcePhrases = (editorObject.phrases || []).slice();
    for(var i=0;i<sourceEvents.length;i++){
      var e = sourceEvents[i];
      if((e.t || 0) >= startSec && (e.t || 0) < endSec){
        var c = JSON.parse(JSON.stringify(e));
        c.id = (c.id || "evt") + "_regdup_" + Date.now() + "_" + i;
        c.t = snapTimeSec((e.t || 0) + delta);
        addEditorItem("event", c);
      }
    }
    for(var p=0;p<sourcePhrases.length;p++){
      var ph = sourcePhrases[p];
      var ps = ph.startSec || 0;
      var pe = ph.endSec || 0;
      if(!(pe <= startSec || ps >= endSec)){
        var cp = JSON.parse(JSON.stringify(ph));
        cp.id = (cp.id || "phrase") + "_regdup_" + Date.now() + "_" + p;
        cp.startSec = snapTimeSec(ps + delta);
        cp.endSec = snapTimeSec(pe + delta);
        addEditorItem("phrase", cp);
      }
    }
    return true;
  }

  function shiftSelectedRegionBars(deltaBars){
    var selectedRegion = editorRegionRead("editorSelectedRegion", null);
    if(!selectedRegion || !deltaBars) return false;
    markEditorCheckpoint("Shift Region");
    var deltaSec = getBarDurationSec() * deltaBars;
    var items = getSelectedEditorItems ? getSelectedEditorItems() : [];
    for(var i=0;i<items.length;i++){
      var kind = getEditorItemKindById(items[i].id);
      if(kind==="event"){
        items[i].t = snapTimeSec(Math.max(0, (items[i].t || 0) + deltaSec));
      }else if(kind==="phrase"){
        items[i].startSec = snapTimeSec(Math.max(0, (items[i].startSec || 0) + deltaSec));
        items[i].endSec = snapTimeSec(Math.max(items[i].startSec || 0, (items[i].endSec || 0) + deltaSec));
      }
    }
    selectedRegion.startBar += deltaBars;
    selectedRegion.endBar += deltaBars;
    selectedRegion.startSec = barIndexToStartSec(selectedRegion.startBar);
    selectedRegion.endSec = barIndexToStartSec(selectedRegion.endBar + 1);
    editorRegionWrite("editorSelectedRegion", selectedRegion);
    editorRegionWrite("editorDirty", true);
    return true;
  }

  window.getBarDurationSec = getBarDurationSec;
  window.timeToBarIndex = timeToBarIndex;
  window.barIndexToStartSec = barIndexToStartSec;
  window.selectBarRange = selectBarRange;
  window.selectItemsInTimeRange = selectItemsInTimeRange;
  window.deleteSelectedRegion = deleteSelectedRegion;
  window.duplicateSelectedRegion = duplicateSelectedRegion;
  window.shiftSelectedRegionBars = shiftSelectedRegionBars;
})();
