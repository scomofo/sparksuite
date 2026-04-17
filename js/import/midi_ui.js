(function(){

  function midiImportRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function midiImportRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = midiImportRoot();
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

  function midiImportWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = midiImportRoot();
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

  function inferMidiImportAppType(){
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function"
      ? SparkInstruments.getActive()
      : null;
    var hints = [
      active ? active.instrument : null,
      active ? active.id : null,
      active ? active.appId : null,
      midiImportRead("activeInstrument", null)
    ];
    var i;
    for(i = 0; i < hints.length; i++){
      if(/piano/i.test(String(hints[i] || ""))) return "piano";
      if(hints[i]) return "guitar";
    }
    return /piano/i.test(typeof APP_NAME !== "undefined" ? APP_NAME : "") ? "piano" : "guitar";
  }

  function midiImportPage(){
    var runtimeState = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
      ? window.sparkCore.getRuntimeState()
      : null;
    var importSummary = runtimeState && runtimeState.midiImportSummary
      ? runtimeState.midiImportSummary
      : null;
    var runtimeTracks = importSummary && Array.isArray(importSummary.tracks)
      ? importSummary.tracks
      : null;
    var assignments = runtimeState && runtimeState.midiImportAssignments
      ? runtimeState.midiImportAssignments
      : midiImportRead("importedMidiAssignments", {});
    var importError = midiImportRead("midiImportError", "");
    var h = '<div class="card">';
    h += '<div><b>MIDI Import</b></div>';
    h += '<input type="file" accept=".mid,.midi" onchange="act(\'importMidiFile\', this.files[0])" />';
    if(importError){
      h += '<div style="margin-top:8px;color:#FF6B6B"><b>Import error:</b> ' + escHTML(importError) + '</div>';
    }
    h += '</div>';

    if((runtimeTracks && runtimeTracks.length) || midiImportRead("importedMidi", null)){
      h += '<div class="card">';
      h += '<div><b>Imported Tracks</b></div>';
      var importedMidi = midiImportRead("importedMidi", null) || {};
      var tracks = runtimeTracks || (importedMidi.tracks || []);
      for(var i=0;i<tracks.length;i++){
        var assignment = (assignments && assignments[tracks[i].id]) || "unassigned";
        h += '<div style="margin-bottom:8px">';
        h += '<div>' + escHTML(tracks[i].name) + ' (' + (tracks[i].noteCount != null ? tracks[i].noteCount : ((tracks[i].notes || []).length)) + ' notes) [' + assignment + ']</div>';
        h += '<button onclick="act(\'assignMidiTrack\', \''+tracks[i].id+'|block_chords\')">Block Chords</button> ';
        h += '<button onclick="act(\'assignMidiTrack\', \''+tracks[i].id+'|left_hand\')">Left Hand</button> ';
        h += '<button onclick="act(\'assignMidiTrack\', \''+tracks[i].id+'|melody\')">Melody</button> ';
        h += '<button onclick="act(\'assignMidiTrack\', \''+tracks[i].id+'|single_note\')">Single Note</button>';
        h += '</div>';
      }

      h += '<div style="margin-top:12px">';
      h += '<button onclick="act(\'buildMidiSeedChart\', \'piano_block_chords\')">Build Piano Chord Seed</button> ';
      h += '<button onclick="act(\'buildMidiSeedChart\', \'piano_left_hand\')">Build Piano LH Seed</button> ';
      h += '<button onclick="act(\'buildMidiSeedChart\', \'piano_melody\')">Build Piano Melody Seed</button> ';
      h += '<button onclick="act(\'buildMidiSeedChart\', \'guitar_single_note\')">Build Guitar Lead Seed</button>';
      h += '</div>';

      h += '</div>';

      if(runtimeState && runtimeState.midiImportSeedMode){
        h += '<div class="card">';
        h += '<div><b>Latest Seed</b></div>';
        h += '<div>Mode: ' + escHTML(runtimeState.midiImportSeedMode) + '</div>';
        if(runtimeState.midiImportSeedTitle){
          h += '<div>Title: ' + escHTML(runtimeState.midiImportSeedTitle) + '</div>';
        }
        h += '</div>';
      }
    }

    return h;
  }

  async function handleMidiImport(file){
    if(!file) return;
    try {
      var raw = await parseMidiFile(file);
      var normalized = normalizeParsedMidi(raw, file.name);
      midiImportWrite("midiImportError", "");
      midiImportWrite("importedMidi", normalized);
      midiImportWrite("importedMidiTracks", normalized.tracks || []);
      var appType = inferMidiImportAppType();
      var assignments = autoAssignMidiTracks(normalized, appType);
      midiImportWrite("importedMidiAssignments", assignments);
      if(typeof syncMidiImportStateRequest === "function"){
        syncMidiImportStateRequest({
          normalizedMidi: normalized,
          assignments: assignments,
          seedMode: null,
          seedChart: null
        });
      }
    } catch (e) {
      midiImportWrite("midiImportError", String((e && e.message) || e || "Unable to import MIDI file"));
    }
    render();
  }

  window.midiImportPage = midiImportPage;
  window.handleMidiImport = handleMidiImport;

})();
