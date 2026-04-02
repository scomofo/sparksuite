(function(){

  function midiImportPage(){
    var h = '<div class="card">';
    h += '<div><b>MIDI Import</b></div>';
    h += '<input type="file" accept=".mid,.midi" onchange="act(\'importMidiFile\', this.files[0])" />';
    h += '</div>';

    if(S.importedMidi){
      h += '<div class="card">';
      h += '<div><b>Imported Tracks</b></div>';
      var tracks = S.importedMidi.tracks || [];
      for(var i=0;i<tracks.length;i++){
        var assignment = (S.importedMidiAssignments && S.importedMidiAssignments[tracks[i].id]) || "unassigned";
        h += '<div style="margin-bottom:8px">';
        h += '<div>' + escHTML(tracks[i].name) + ' (' + (tracks[i].notes || []).length + ' notes) [' + assignment + ']</div>';
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
    }

    return h;
  }

  async function handleMidiImport(file){
    if(!file) return;
    var raw = await parseMidiFile(file);
    var normalized = normalizeParsedMidi(raw, file.name);
    S.importedMidi = normalized;
    S.importedMidiTracks = normalized.tracks || [];
    var appType = "guitar"; // ChordSpark default
    S.importedMidiAssignments = autoAssignMidiTracks(normalized, appType);
    render();
  }

  window.midiImportPage = midiImportPage;
  window.handleMidiImport = handleMidiImport;

})();
