(function(){

  function buildSeedChartFromImportedMidi(normalizedMidi, assignments, targetMode){
    if(!normalizedMidi) return null;
    if(targetMode==="piano_block_chords") return buildPianoBlockChordSeed(normalizedMidi, assignments);
    if(targetMode==="piano_left_hand") return buildPianoLeftHandSeed(normalizedMidi, assignments);
    if(targetMode==="piano_melody") return buildPianoMelodySeed(normalizedMidi, assignments);
    if(targetMode==="guitar_single_note") return buildGuitarSingleNoteSeed(normalizedMidi, assignments);
    return null;
  }

  function buildPianoMelodySeed(normalizedMidi, assignments){
    var chart = createSparkChart();
    chart.id = generateId("midi_seed");
    chart.arrangementType = "single_note";
    chart.title = normalizedMidi.sourceName || "Imported Melody";
    chart.bpm = getPrimaryMidiBpm(normalizedMidi);
    var notes = collectAssignedNotes(normalizedMidi, assignments, "melody");
    chart.events = [];
    for(var i=0;i<notes.length;i++){
      chart.events.push({
        id: generateId("evt"),
        t: notes[i].startSec,
        dur: notes[i].durSec,
        type: "single_note",
        hand: "right",
        notes: [notes[i].note],
        lane: noteToPitchLane(notes[i].note),
        velocity: notes[i].velocity
      });
    }
    chart.phrases = buildPhrasesFromDuration(chart.events, 4, chart.bpm);
    return chart;
  }

  function buildPianoBlockChordSeed(normalizedMidi, assignments){
    var chart = createSparkChart();
    chart.id = generateId("midi_seed");
    chart.arrangementType = "block_chords";
    chart.title = normalizedMidi.sourceName || "Imported Chords";
    chart.bpm = getPrimaryMidiBpm(normalizedMidi);
    var notes = collectAssignedNotes(normalizedMidi, assignments, "block_chords");
    var groups = groupNotesIntoChords(notes, 0.08);
    chart.events = [];
    for(var i=0;i<groups.length;i++){
      chart.events.push({
        id: generateId("evt"),
        t: groups[i].startSec,
        dur: groups[i].durSec,
        type: "chord",
        hand: "right",
        notes: groups[i].notes,
        chord: inferChordName(groups[i].notes),
        lane: "main",
        velocity: groups[i].velocity
      });
    }
    chart.phrases = buildPhrasesFromDuration(chart.events, 4, chart.bpm);
    return chart;
  }

  function buildPianoLeftHandSeed(normalizedMidi, assignments){
    var chart = createSparkChart();
    chart.id = generateId("midi_seed");
    chart.arrangementType = "left_hand";
    chart.title = normalizedMidi.sourceName || "Imported LH";
    chart.bpm = getPrimaryMidiBpm(normalizedMidi);
    var notes = collectAssignedNotes(normalizedMidi, assignments, "left_hand");
    chart.events = [];
    for(var i=0;i<notes.length;i++){
      chart.events.push({
        id: generateId("evt"),
        t: notes[i].startSec,
        dur: notes[i].durSec,
        type: "lh_pattern",
        hand: "left",
        notes: [notes[i].note],
        lane: inferLeftHandLane(notes[i].pitch),
        velocity: notes[i].velocity
      });
    }
    chart.phrases = buildPhrasesFromDuration(chart.events, 4, chart.bpm);
    return chart;
  }

  function buildGuitarSingleNoteSeed(normalizedMidi, assignments){
    var chart = createSparkChart();
    chart.id = generateId("midi_seed");
    chart.arrangementType = "single_note";
    chart.title = normalizedMidi.sourceName || "Imported Lead";
    chart.bpm = getPrimaryMidiBpm(normalizedMidi);
    var notes = collectAssignedNotes(normalizedMidi, assignments, "single_note");
    chart.events = [];
    for(var i=0;i<notes.length;i++){
      chart.events.push({
        id: generateId("evt"),
        t: notes[i].startSec,
        dur: notes[i].durSec,
        type: "single_note",
        hand: "right",
        notes: [notes[i].note],
        lane: noteToPitchLane(notes[i].note),
        velocity: notes[i].velocity
      });
    }
    chart.phrases = buildPhrasesFromDuration(chart.events, 4, chart.bpm);
    return chart;
  }

  function collectAssignedNotes(normalizedMidi, assignments, role){
    var out = [];
    var tracks = normalizedMidi.tracks || [];
    for(var i=0;i<tracks.length;i++){
      if(assignments[tracks[i].id] === role){
        out = out.concat(tracks[i].notes || []);
      }
    }
    out.sort(function(a,b){ return a.startSec - b.startSec; });
    return out;
  }

  function getPrimaryMidiBpm(normalizedMidi){
    if(normalizedMidi.tempoMap && normalizedMidi.tempoMap.length){
      return normalizedMidi.tempoMap[0].bpm || 120;
    }
    return 120;
  }

  function buildPhrasesFromDuration(events, barsPerPhrase, bpm){
    var phrases = [];
    if(!events || !events.length) return phrases;
    var barSec = (60 / (bpm || 120)) * 4;
    var totalEnd = 0;
    for(var i=0;i<events.length;i++){
      totalEnd = Math.max(totalEnd, (events[i].t || 0) + (events[i].dur || 0));
    }
    var phraseLen = barSec * (barsPerPhrase || 4);
    var start = 0;
    var idx = 1;
    while(start < totalEnd){
      phrases.push({
        id: "phrase_" + idx,
        startSec: start,
        endSec: Math.min(totalEnd, start + phraseLen),
        label: "Phrase " + idx
      });
      start += phraseLen;
      idx++;
    }
    return phrases;
  }

  function groupNotesIntoChords(notes, thresholdSec){
    var out = [];
    var cur = null;
    thresholdSec = thresholdSec || 0.08;
    for(var i=0;i<notes.length;i++){
      var n = notes[i];
      if(!cur){
        cur = {
          startSec:n.startSec,
          durSec:n.durSec,
          notes:[n.note],
          velocity:n.velocity
        };
      }else if(Math.abs(n.startSec - cur.startSec) <= thresholdSec){
        cur.notes.push(n.note);
        cur.durSec = Math.max(cur.durSec, n.durSec);
      }else{
        out.push(cur);
        cur = {
          startSec:n.startSec,
          durSec:n.durSec,
          notes:[n.note],
          velocity:n.velocity
        };
      }
    }
    if(cur) out.push(cur);
    return out;
  }

  function noteToPitchLane(note){
    return String(note || "C4").charAt(0).toUpperCase();
  }

  function inferLeftHandLane(pitch){
    if(pitch < 48) return "lh_root";
    if(pitch < 60) return "lh_mid";
    return "lh_high";
  }

  function inferChordName(notes){
    return "Imported Chord";
  }

  window.buildSeedChartFromImportedMidi = buildSeedChartFromImportedMidi;

})();
