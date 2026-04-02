(function(){

  function normalizeParsedMidi(raw, sourceName){
    var out = {
      sourceName: sourceName || "import.mid",
      ppq: raw.header && raw.header.ppq || 480,
      tempoMap: [],
      timeSignatures: [],
      tracks: []
    };

    if(raw.header && Array.isArray(raw.header.tempos)){
      for(var i=0;i<raw.header.tempos.length;i++){
        out.tempoMap.push({
          tick: raw.header.tempos[i].ticks || 0,
          bpm: raw.header.tempos[i].bpm || 120
        });
      }
    }

    if(raw.header && Array.isArray(raw.header.timeSignatures)){
      for(var j=0;j<raw.header.timeSignatures.length;j++){
        out.timeSignatures.push({
          tick: raw.header.timeSignatures[j].ticks || 0,
          numerator: raw.header.timeSignatures[j].timeSignature ? raw.header.timeSignatures[j].timeSignature[0] : 4,
          denominator: raw.header.timeSignatures[j].timeSignature ? raw.header.timeSignatures[j].timeSignature[1] : 4
        });
      }
    }

    if(Array.isArray(raw.tracks)){
      for(var t=0;t<raw.tracks.length;t++){
        out.tracks.push(normalizeMidiTrack(raw.tracks[t], t));
      }
    }

    return out;
  }

  function normalizeMidiTrack(track, idx){
    var notes = [];
    var src = track.notes || [];
    for(var i=0;i<src.length;i++){
      notes.push({
        pitch: src[i].midi,
        note: src[i].name || midiToNoteName(src[i].midi),
        startTick: src[i].ticks || 0,
        endTick: (src[i].ticks || 0) + (src[i].durationTicks || 0),
        startSec: src[i].time || 0,
        endSec: (src[i].time || 0) + (src[i].duration || 0),
        durSec: src[i].duration || 0,
        velocity: Math.round((src[i].velocity || 0.75) * 127)
      });
    }
    return {
      id: "track_" + idx,
      name: track.name || ("Track " + (idx + 1)),
      channel: track.channel != null ? track.channel : null,
      notes: notes
    };
  }

  function midiToNoteName(midi){
    var names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    var octave = Math.floor(midi / 12) - 1;
    return names[midi % 12] + octave;
  }

  window.normalizeParsedMidi = normalizeParsedMidi;

})();
