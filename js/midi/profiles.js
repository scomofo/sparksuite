(function(){

  function createMidiProfile(name, type){
    var id = generateId("midi_profile");
    var profile = {
      id: id,
      name: name || "New Profile",
      type: type || "default", // guitar | piano | custom
      deviceId: S.activeMidiDeviceId || null,
      inputLatencyMs: S.inputLatencyMs || 0,
      channelMap: {},
      noteRange: {
        min: 0,
        max: 127
      },
      zones: [],
      stringMap: {},   // for guitar
      keyMap: {}       // custom remaps if needed
    };
    S.midiProfiles[id] = profile;
    S.activeMidiProfileId = id;
    saveState();
    return profile;
  }

  function getActiveMidiProfile(){
    if(!S.activeMidiProfileId) return null;
    return S.midiProfiles[S.activeMidiProfileId] || null;
  }

  function saveMidiProfile(profile){
    if(!profile || !profile.id) return;
    S.midiProfiles[profile.id] = profile;
    saveState();
  }

  function setActiveMidiProfile(id){
    if(!S.midiProfiles[id]) return;
    S.activeMidiProfileId = id;
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
