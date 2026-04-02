(function(){

  function refreshMidiDevices(){
    if(!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then(function(access){
      var out = [];
      access.inputs.forEach(function(input){
        out.push({
          id: input.id,
          name: input.name || "MIDI Input",
          manufacturer: input.manufacturer || "",
          state: input.state || "connected"
        });
      });
      S.midiDevices = out;
      if(!S.activeMidiDeviceId && out.length){
        S.activeMidiDeviceId = out[0].id;
      }
      saveState();
    });
  }

  function getActiveMidiDevice(){
    var arr = S.midiDevices || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === S.activeMidiDeviceId) return arr[i];
    }
    return null;
  }

  window.refreshMidiDevices = refreshMidiDevices;
  window.getActiveMidiDevice = getActiveMidiDevice;

})();
