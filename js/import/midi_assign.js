(function(){

  function autoAssignMidiTracks(normalizedMidi, appType){
    var assignments = {};
    var tracks = normalizedMidi.tracks || [];
    for(var i=0;i<tracks.length;i++){
      var name = (tracks[i].name || "").toLowerCase();
      if(appType==="piano"){
        if(name.indexOf("left") >= 0 || name.indexOf("lh") >= 0 || name.indexOf("bass") >= 0){
          assignments[tracks[i].id] = "left_hand";
        }else if(name.indexOf("melody") >= 0 || name.indexOf("lead") >= 0 || name.indexOf("right") >= 0 || name.indexOf("rh") >= 0){
          assignments[tracks[i].id] = "melody";
        }else{
          assignments[tracks[i].id] = "block_chords";
        }
      }else{
        if(name.indexOf("lead") >= 0 || name.indexOf("melody") >= 0 || name.indexOf("solo") >= 0){
          assignments[tracks[i].id] = "single_note";
        }else{
          assignments[tracks[i].id] = "chord_seed";
        }
      }
    }
    return assignments;
  }

  function setMidiTrackAssignment(trackId, role){
    S.importedMidiAssignments[trackId] = role;
  }

  window.autoAssignMidiTracks = autoAssignMidiTracks;
  window.setMidiTrackAssignment = setMidiTrackAssignment;

})();
