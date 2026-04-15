(function(){

  var MIDI_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  async function parseMidiFile(file){
    var buffer = await file.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("MIDI file is empty or could not be read");
    }
    if (buffer.byteLength > MIDI_MAX_SIZE) {
      throw new Error("MIDI file exceeds 10 MB size limit");
    }
    var header = new Uint8Array(buffer, 0, 4);
    if (header[0] !== 0x4D || header[1] !== 0x54 || header[2] !== 0x68 || header[3] !== 0x64) {
      throw new Error("Invalid MIDI file: missing MThd header");
    }
    try {
      var parsed = await parseMidiBufferWithLibrary(buffer);
      return parsed;
    } catch(e) {
      throw new Error("Failed to parse MIDI file: " + (e.message || e));
    }
  }

  async function parseMidiBufferWithLibrary(buffer){
    // Adapter placeholder - integrate chosen MIDI parser library here.
    // Must return raw parsed MIDI object compatible with @tonejs/midi format.
    // Example: const midi = new Midi(buffer); return midi;
    if(typeof Midi !== "undefined"){
      return new Midi(buffer);
    }
    if(typeof SparkChartIO !== "undefined" && typeof SparkChartIO.parseMidiBuffer === "function"){
      return adaptSparkChartParsedMidi(SparkChartIO.parseMidiBuffer(buffer));
    }
    throw new Error("MIDI parser library adapter not implemented");
  }

  function adaptSparkChartParsedMidi(raw){
    var ppq = raw && raw.ppq || 480;
    var tempoMap = buildTempoMap(raw && raw.tempoSegments, ppq);
    return {
      header: {
        ppq: ppq,
        tempos: (raw && raw.tempoSegments || []).map(function(segment){
          return {
            ticks: segment.tick || 0,
            bpm: segment.bpm || 120
          };
        }),
        timeSignatures: (raw && raw.timeSignatures || []).map(function(signature){
          return {
            ticks: signature.tick || 0,
            timeSignature: [signature.numerator || 4, signature.denominator || 4]
          };
        })
      },
      tracks: (raw && raw.tracks || []).map(function(track, idx){
        var notes = (track.notes || []).map(function(note){
          var startTick = note.tick || 0;
          var durationTicks = note.tickLength || 0;
          var startSec = tickToSeconds(startTick, tempoMap, ppq);
          var endSec = tickToSeconds(startTick + durationTicks, tempoMap, ppq);
          return {
            midi: note.midi,
            name: midiToNoteName(note.midi),
            ticks: startTick,
            durationTicks: durationTicks,
            time: startSec,
            duration: Math.max(0, endSec - startSec),
            velocity: Math.max(0, Math.min(1, (note.velocity || 96) / 127))
          };
        });
        return {
          name: track.name || ("Track " + (idx + 1)),
          channel: track.channels && track.channels.length === 1 ? track.channels[0] : null,
          notes: notes
        };
      })
    };
  }

  function buildTempoMap(segments, ppq){
    var source = Array.isArray(segments) && segments.length ? segments.slice() : [{ tick: 0, bpm: 120 }];
    source.sort(function(a, b){ return (a.tick || 0) - (b.tick || 0); });
    if((source[0].tick || 0) !== 0){
      source.unshift({ tick: 0, bpm: 120 });
    }
    var map = [];
    var seconds = 0;
    for(var i=0;i<source.length;i++){
      var segment = source[i];
      var tick = segment.tick || 0;
      var bpm = segment.bpm || 120;
      if(i > 0){
        var previous = map[i - 1];
        seconds = previous.seconds + ticksToSeconds(tick - previous.tick, previous.bpm, ppq);
      }
      map.push({
        tick: tick,
        bpm: bpm,
        seconds: seconds
      });
    }
    return map;
  }

  function tickToSeconds(tick, tempoMap, ppq){
    var active = tempoMap[0];
    for(var i=1;i<tempoMap.length;i++){
      if((tempoMap[i].tick || 0) > tick) break;
      active = tempoMap[i];
    }
    return active.seconds + ticksToSeconds(tick - active.tick, active.bpm, ppq);
  }

  function ticksToSeconds(deltaTicks, bpm, ppq){
    if(!deltaTicks || !ppq || !bpm) return 0;
    return (deltaTicks / ppq) * (60 / bpm);
  }

  function midiToNoteName(midi){
    var names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    var octave = Math.floor(midi / 12) - 1;
    return names[midi % 12] + octave;
  }

  window.parseMidiFile = parseMidiFile;

})();
