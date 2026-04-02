(function(){
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
    S.editorSelectedRegion = {
      startBar:startBar,
      endBar:endBar,
      startSec:startSec,
      endSec:endSec
    };
    clearEditorSelection();
    selectItemsInTimeRange(startSec, endSec);
    return true;
  }

  function selectItemsInTimeRange(startSec, endSec){
    if(!S.editorObject) return false;
    var added = 0;
    var events = S.editorObject.events || [];
    for(var i=0;i<events.length;i++){
      var t = events[i].t || 0;
      if(t >= startSec && t < endSec){
        addEditorSelection(events[i].id);
        added++;
      }
    }
    var phrases = S.editorObject.phrases || [];
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
    if(!S.editorSelectedRegion) return false;
    markEditorCheckpoint("Delete Region");
    deleteSelectedEditorItems();
    S.editorSelectedRegion = null;
    return true;
  }

  function duplicateSelectedRegion(insertAtBar){
    if(!S.editorSelectedRegion) return false;
    markEditorCheckpoint("Duplicate Region");
    var startSec = S.editorSelectedRegion.startSec;
    var endSec = S.editorSelectedRegion.endSec;
    var insertSec = barIndexToStartSec(insertAtBar || (S.editorSelectedRegion.endBar + 1));
    var delta = insertSec - startSec;
    var sourceEvents = (S.editorObject.events || []).slice();
    var sourcePhrases = (S.editorObject.phrases || []).slice();
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
    if(!S.editorSelectedRegion || !deltaBars) return false;
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
    S.editorSelectedRegion.startBar += deltaBars;
    S.editorSelectedRegion.endBar += deltaBars;
    S.editorSelectedRegion.startSec = barIndexToStartSec(S.editorSelectedRegion.startBar);
    S.editorSelectedRegion.endSec = barIndexToStartSec(S.editorSelectedRegion.endBar + 1);
    S.editorDirty = true;
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
