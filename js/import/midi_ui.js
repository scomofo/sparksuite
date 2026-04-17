(function(){

  function inferMidiImportAppType() {
    if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
      var active = SparkInstruments.getActive();
      var candidate = active ? (active.instrument || active.instrumentType || active.id || active.appId || null) : null;
      if (candidate && typeof SparkInstruments.getAll === "function") {
        var entries = SparkInstruments.getAll() || [];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i] || {};
          if (entry.id === candidate || entry.appId === candidate) {
            candidate = entry.instrument || entry.instrumentType || candidate;
            break;
          }
        }
      }
      if (candidate) return candidate;
    }
    return "guitar";
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
      : S.importedMidiAssignments;
    var h = '<div class="card">';
    h += '<div><b>MIDI Import</b></div>';
    h += '<input type="file" accept=".mid,.midi" onchange="act(\'importMidiFile\', this.files[0])" />';
    h += '</div>';

    if((runtimeTracks && runtimeTracks.length) || S.importedMidi){
      h += '<div class="card">';
      h += '<div><b>Imported Tracks</b></div>';
      var tracks = runtimeTracks || (S.importedMidi.tracks || []);
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
    var raw = await parseMidiFile(file);
    var normalized = normalizeParsedMidi(raw, file.name);
    S.importedMidi = normalized;
    S.importedMidiTracks = normalized.tracks || [];
    var appType = inferMidiImportAppType();
    S.importedMidiAssignments = autoAssignMidiTracks(normalized, appType);
    if(typeof syncMidiImportStateRequest === "function"){
      syncMidiImportStateRequest({
        normalizedMidi: normalized,
        assignments: S.importedMidiAssignments,
        seedMode: null,
        seedChart: null
      });
    }
    render();
  }

  window.midiImportPage = midiImportPage;
  window.handleMidiImport = handleMidiImport;

})();
