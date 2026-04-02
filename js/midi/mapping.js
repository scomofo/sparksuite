(function(){

  function applyMidiProfileToNote(note, channel, velocity){
    var profile = getActiveMidiProfile();
    if(!profile){
      return {
        accepted:true,
        mappedNote:note,
        channel:channel,
        velocity:velocity
      };
    }
    if(note < profile.noteRange.min || note > profile.noteRange.max){
      return { accepted:false };
    }
    if(profile.channelMap && Object.keys(profile.channelMap).length){
      if(profile.channelMap[channel] === false){
        return { accepted:false };
      }
    }
    var mappedNote = profile.keyMap && profile.keyMap[note] != null
      ? profile.keyMap[note]
      : note;
    return {
      accepted:true,
      mappedNote:mappedNote,
      channel:channel,
      velocity:velocity,
      zone:getZoneForNote(mappedNote, profile),
      stringInfo:getStringInfoForNote(mappedNote, profile)
    };
  }

  function getZoneForNote(note, profile){
    var zones = profile.zones || [];
    for(var i=0;i<zones.length;i++){
      if(note >= zones[i].min && note <= zones[i].max){
        return zones[i].id;
      }
    }
    return null;
  }

  function getStringInfoForNote(note, profile){
    if(!profile.stringMap) return null;
    for(var stringId in profile.stringMap){
      var def = profile.stringMap[stringId];
      if(note >= def.min && note <= def.max){
        return {
          stringId:stringId,
          min:def.min,
          max:def.max
        };
      }
    }
    return null;
  }

  window.applyMidiProfileToNote = applyMidiProfileToNote;

})();
