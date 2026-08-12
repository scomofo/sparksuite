(function(){

  var MIDI_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  async function parseMidiFile(file){
    var source = await resolveMidiImportSource(file);
    var buffer = source.buffer;
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

  async function resolveMidiImportSource(file) {
    if (!file) {
      throw new Error("No MIDI file provided");
    }
    if (typeof file.arrayBuffer === "function") {
      return {
        buffer: await file.arrayBuffer(),
        name: file.name || "import.mid"
      };
    }
    if (typeof file.base64 === "string" && file.base64) {
      return {
        buffer: sliceArrayBuffer(decodeBase64Bytes(file.base64)),
        name: file.name || file.path || "import.mid"
      };
    }
    if (file.buffer != null) {
      return {
        buffer: sliceArrayBuffer(toUint8Array(file.buffer)),
        name: file.name || file.path || "import.mid"
      };
    }
    if (file.bytes != null) {
      return {
        buffer: sliceArrayBuffer(toUint8Array(file.bytes)),
        name: file.name || file.path || "import.mid"
      };
    }
    if (file.data != null && typeof file.data !== "string") {
      return {
        buffer: sliceArrayBuffer(toUint8Array(file.data)),
        name: file.name || file.path || "import.mid"
      };
    }
    throw new Error("Unsupported MIDI import source");
  }

  function decodeBase64Bytes(base64) {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(base64, "base64"));
    }
    if (typeof atob === "function") {
      var binary = atob(base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    throw new Error("Base64 decoding is not available in this environment");
  }

  function toUint8Array(buffer) {
    if (buffer instanceof Uint8Array) return buffer;
    if (Array.isArray(buffer)) return new Uint8Array(buffer);
    if (typeof Buffer !== "undefined" && buffer instanceof Buffer) {
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
    if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
    if (buffer && buffer.buffer instanceof ArrayBuffer) {
      return new Uint8Array(buffer.buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length || 0);
    }
    throw new Error("Unsupported MIDI byte source");
  }

  function sliceArrayBuffer(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  async function parseMidiBufferWithLibrary(buffer){
    // Prefer a bundled @tonejs/midi-compatible library when one is loaded.
    if(typeof Midi !== "undefined"){
      return new Midi(buffer);
    }
    if(typeof SparkChartIO !== "undefined" && typeof SparkTempoMap !== "undefined"){
      return adaptCoreMidiParse(new SparkChartIO().parseMidiRaw(buffer));
    }
    throw new Error("MIDI parser library adapter not implemented");
  }

  // Adapts the core SparkChartIO raw MIDI parse to the @tonejs/midi shape
  // that normalizeParsedMidi consumes.
  function adaptCoreMidiParse(raw){
    var ppq = raw.ppq || 480;
    var segments = raw.tempoSegments && raw.tempoSegments.length ? raw.tempoSegments : [{ tick: 0, bpm: 120 }];
    var tempoMap = new SparkTempoMap({ ppq: ppq, segments: segments });
    var tempos = [];
    for(var s=0;s<segments.length;s++){
      tempos.push({ ticks: segments[s].tick || 0, bpm: segments[s].bpm || 120 });
    }
    var timeSignatures = [];
    var srcSignatures = Array.isArray(raw.timeSignatures) ? raw.timeSignatures : [];
    for(var g=0;g<srcSignatures.length;g++){
      timeSignatures.push({
        ticks: srcSignatures[g].tick || 0,
        timeSignature: [srcSignatures[g].numerator || 4, srcSignatures[g].denominator || 4]
      });
    }
    var tracks = [];
    var srcTracks = Array.isArray(raw.tracks) ? raw.tracks : [];
    for(var t=0;t<srcTracks.length;t++){
      tracks.push(adaptCoreMidiTrack(srcTracks[t], tempoMap));
    }
    return {
      header: { ppq: ppq, tempos: tempos, timeSignatures: timeSignatures },
      tracks: tracks
    };
  }

  function adaptCoreMidiTrack(track, tempoMap){
    var notes = [];
    var src = Array.isArray(track.notes) ? track.notes : [];
    for(var i=0;i<src.length;i++){
      var startTick = src[i].tick || 0;
      var durationTicks = src[i].tickLength || 0;
      var startSec = tempoMap.tickToSeconds(startTick);
      var endSec = tempoMap.tickToSeconds(startTick + durationTicks);
      notes.push({
        midi: src[i].midi != null ? src[i].midi : null,
        ticks: startTick,
        durationTicks: durationTicks,
        time: startSec,
        duration: Math.max(0, endSec - startSec),
        velocity: (src[i].velocity != null ? src[i].velocity : 96) / 127
      });
    }
    var channels = Array.isArray(track.channels) ? track.channels : [];
    return {
      name: track.name || "",
      channel: channels.length === 1 ? channels[0] : (src.length && src[0].channel != null ? src[0].channel : null),
      notes: notes
    };
  }

  window.parseMidiFile = parseMidiFile;

})();
