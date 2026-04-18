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
