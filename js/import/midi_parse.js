(function(){

  async function parseMidiFile(file){
    var buffer = await file.arrayBuffer();
    var parsed = await parseMidiBufferWithLibrary(buffer);
    return parsed;
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
