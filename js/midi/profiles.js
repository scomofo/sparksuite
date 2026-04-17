(function(){

  function midiProfileRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function midiProfileRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = midiProfileRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function midiProfileWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = midiProfileRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function createMidiProfile(name, type){
    var id = generateId("midi_profile");
    var activeMidiDeviceId = midiProfileRead("activeMidiDeviceId", null);
    var inputLatencyMs = midiProfileRead("inputLatencyMs", 0);
    var profile = {
      id: id,
      name: name || "New Profile",
      type: type || "default", // guitar | piano | custom
      deviceId: activeMidiDeviceId || null,
      inputLatencyMs: inputLatencyMs || 0,
      channelMap: {},
      noteRange: {
        min: 0,
        max: 127
      },
      zones: [],
      stringMap: {},   // for guitar
      keyMap: {}       // custom remaps if needed
    };
    midiProfileWrite(["midiProfiles", id], profile);
    midiProfileWrite("activeMidiProfileId", id);
    saveState();
    return profile;
  }

  function getActiveMidiProfile(){
    var activeMidiProfileId = midiProfileRead("activeMidiProfileId", null);
    if(!activeMidiProfileId) return null;
    return midiProfileRead(["midiProfiles", activeMidiProfileId], null);
  }

  function saveMidiProfile(profile){
    if(!profile || !profile.id) return;
    midiProfileWrite(["midiProfiles", profile.id], profile);
    saveState();
  }

  function setActiveMidiProfile(id){
    if(!midiProfileRead(["midiProfiles", id], null)) return;
    midiProfileWrite("activeMidiProfileId", id);
    saveState();
  }

  function createDefaultPianoProfile(){
    var p = createMidiProfile("Default Piano", "piano");
    p.noteRange = { min: 21, max: 108 };
    p.zones = [
      { id:"left_hand", min:21, max:59 },
      { id:"right_hand", min:60, max:108 }
    ];
    saveMidiProfile(p);
    return p;
  }

  function createDefaultGuitarProfile(){
    var p = createMidiProfile("Default MIDI Guitar", "guitar");
    p.noteRange = { min: 40, max: 88 };
    p.stringMap = {
      s6: { min:40, max:52 },
      s5: { min:45, max:57 },
      s4: { min:50, max:62 },
      s3: { min:55, max:67 },
      s2: { min:59, max:71 },
      s1: { min:64, max:88 }
    };
    saveMidiProfile(p);
    return p;
  }

  window.createMidiProfile = createMidiProfile;
  window.getActiveMidiProfile = getActiveMidiProfile;
  window.saveMidiProfile = saveMidiProfile;
  window.setActiveMidiProfile = setActiveMidiProfile;
  window.createDefaultPianoProfile = createDefaultPianoProfile;
  window.createDefaultGuitarProfile = createDefaultGuitarProfile;

})();
