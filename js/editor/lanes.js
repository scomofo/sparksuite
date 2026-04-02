/* ===== Shared Editor Lanes ===== */
/* Handoff 9: lane definitions, event-to-lane mapping, lane order */

(function(){

  function getEditorLanes(obj){
    if(!obj) return [{ id:"default", label:"Default" }];
    var arrangement = obj.arrangementType || obj.type || "default";
    if(arrangement==="chords" || arrangement==="block_chords"){
      return [{ id:"main", label:"Main" }];
    }
    if(arrangement==="rhythm_chords"){
      return [
        { id:"down", label:"Down" },
        { id:"up", label:"Up" }
      ];
    }
    if(arrangement==="single_note"){
      return buildPitchLanes(obj);
    }
    if(arrangement==="left_hand_patterns"){
      return [
        { id:"lh_root", label:"LH Root" },
        { id:"lh_mid", label:"LH Mid" },
        { id:"lh_high", label:"LH High" }
      ];
    }
    return [{ id:"main", label:"Main" }];
  }

  function buildPitchLanes(obj){
    var lanes = [];
    var labels = ["C","D","E","F","G","A","B"];
    for(var i=0;i<labels.length;i++){
      lanes.push({ id:"pitch_" + labels[i], label:labels[i] });
    }
    return lanes;
  }

  function getLaneIdForItem(item, obj){
    var arrangement = obj && obj.arrangementType || "default";
    if(!item) return "main";
    if(arrangement==="rhythm_chords"){
      return item.rhythm && item.rhythm.dir==="U" ? "up" : "down";
    }
    if(arrangement==="single_note"){
      var note = item.target && (item.target.pitchClass || item.target.note) || "C";
      return "pitch_" + String(note).charAt(0).toUpperCase();
    }
    if(arrangement==="left_hand_patterns"){
      var midi = item.target && item.target.midi;
      if(midi == null) return "lh_root";
      if(midi < 48) return "lh_root";
      if(midi < 60) return "lh_mid";
      return "lh_high";
    }
    return "main";
  }

  function getLaneIndexForItem(item, obj){
    var lanes = getEditorLanes(obj);
    var id = getLaneIdForItem(item, obj);
    for(var i=0;i<lanes.length;i++){
      if(lanes[i].id===id) return i;
    }
    return 0;
  }

  window.getEditorLanes = getEditorLanes;
  window.getLaneIdForItem = getLaneIdForItem;
  window.getLaneIndexForItem = getLaneIndexForItem;

})();
