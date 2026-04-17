(function(){

  function midiDeviceRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function midiDeviceRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = midiDeviceRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function midiDeviceWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = midiDeviceRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function refreshMidiDevices(){
    if(typeof navigator === "undefined" || !navigator || !navigator.requestMIDIAccess) return;
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
      midiDeviceWrite("midiDevices", out);
      if(!midiDeviceRead("activeMidiDeviceId", null) && out.length){
        midiDeviceWrite("activeMidiDeviceId", out[0].id);
      }
      if(typeof syncMidiSettingsStateRequest === "function"){
        syncMidiSettingsStateRequest();
      }
      saveState();
    });
  }

  function getActiveMidiDevice(){
    var arr = midiDeviceRead("midiDevices", []) || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === midiDeviceRead("activeMidiDeviceId", null)) return arr[i];
    }
    return null;
  }

  window.refreshMidiDevices = refreshMidiDevices;
  window.getActiveMidiDevice = getActiveMidiDevice;

})();
