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
    throw new Error("MIDI parser library adapter not implemented");
  }

  window.parseMidiFile = parseMidiFile;

})();
