(function(){

  function buildSeedChartFromImportedMidi(normalizedMidi, assignments, targetMode){
    if(!normalizedMidi) return null;
    if(targetMode==="piano_block_chords") return buildPianoBlockChordSeed(normalizedMidi, assignments);
    if(targetMode==="piano_left_hand") return buildPianoLeftHandSeed(normalizedMidi, assignments);
    if(targetMode==="piano_melody") return buildPianoMelodySeed(normalizedMidi, assignments);
    if(targetMode==="guitar_single_note") return buildGuitarSingleNoteSeed(normalizedMidi, assignments);
    return null;
  }

  function buildPlayableChartFromImportedMidi(normalizedMidi, options){
    if(!normalizedMidi) return null;
    options = options || {};
    var bpm = getPrimaryMidiBpm(normalizedMidi) || 120;
    var adapterType = options.adapterType || "guitar";
    var laneCount = options.laneCount || getPlayableLaneCount(adapterType);
    var laneLabels = Array.isArray(options.laneLabels) && options.laneLabels.length
      ? options.laneLabels.slice(0, laneCount)
      : buildPlayableLaneLabels(laneCount, adapterType);
    var notes = collectPlayableImportNotes(normalizedMidi, options.assignments || {});
    var beatMs = 60000 / bpm;
    var quantizeDivisor = options.quantizeDivisor || 2;
    var quantizeMs = beatMs / quantizeDivisor;
    var chordThresholdMs = options.chordThresholdMs || 40;
    var groups = groupPlayableImportNotes(notes, chordThresholdMs / 1000);
    var playableNotes = [];
    for(var i=0;i<groups.length;i++){
      var event = buildPlayableEventFromGroup(groups[i], {
        index: i,
        laneCount: laneCount,
        quantizeMs: quantizeMs,
        adapterType: adapterType,
        pitchToLane: options.pitchToLane
      });
      if(event) playableNotes.push(event);
    }
    return {
      chartId: normalizeImportedChartId(normalizedMidi.sourceName || "imported_midi"),
      title: normalizedMidi.sourceName || "Imported Playable Chart",
      tempo: bpm,
      lanes: laneLabels.map(function(label, index){
        return {
          lane: index,
          label: label,
          input: String(index + 1)
        };
      }),
      notes: playableNotes,
      metadata: {
        sourceName: normalizedMidi.sourceName || null,
        noteCount: playableNotes.length,
        quantizeMs: quantizeMs,
        chordThresholdMs: chordThresholdMs,
        adapterType: adapterType
      }
    };
  }

  function buildPlayablePayloadFromImportedMidi(normalizedMidi, options){
    options = options || {};
    var chart = buildPlayableChartFromImportedMidi(normalizedMidi, options);
    if(!chart) return null;
    return {
      chartId: chart.chartId,
      adapterType: options.adapterType || "guitar",
      laneCount: chart.lanes.length,
      laneLabels: chart.lanes.map(function(lane){ return lane.label; }),
      chart: chart
    };
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

  function collectPlayableImportNotes(normalizedMidi, assignments){
    var out = [];
    var tracks = normalizedMidi.tracks || [];
    var assigned = false;
    var i;
    for(i=0;i<tracks.length;i++){
      if(assignments && assignments[tracks[i].id] && assignments[tracks[i].id] !== "unassigned"){
        assigned = true;
        out = out.concat(tracks[i].notes || []);
      }
    }
    if(!assigned){
      for(i=0;i<tracks.length;i++) out = out.concat(tracks[i].notes || []);
    }
    out.sort(function(a,b){ return (a.startSec || 0) - (b.startSec || 0); });
    return out;
  }

  function groupPlayableImportNotes(notes, thresholdSec){
    var out = [];
    var current = null;
    thresholdSec = thresholdSec || 0.04;
    for(var i=0;i<notes.length;i++){
      var note = notes[i];
      if(!current || Math.abs((note.startSec || 0) - current.startSec) > thresholdSec){
        if(current) out.push(current);
        current = {
          startSec: note.startSec || 0,
          notes: []
        };
      }
      current.notes.push(note);
    }
    if(current) out.push(current);
    return out;
  }

  function buildPlayableEventFromGroup(group, options){
    if(!group || !group.notes || !group.notes.length) return null;
    options = options || {};
    var quantizeMs = options.quantizeMs || 250;
    var laneCount = options.laneCount || 5;
    var chord = detectPlayableChord(group.notes);
    var durationMs = 0;
    var velocity = 0;
    var i;
    for(i=0;i<group.notes.length;i++){
      durationMs = Math.max(durationMs, Math.round((group.notes[i].durSec || 0) * 1000));
      velocity = Math.max(velocity, group.notes[i].velocity != null ? group.notes[i].velocity : 1);
    }

    if(chord){
      var chordLanes = chordToPlayableLanes(chord, options.adapterType, laneCount);
      return {
        id: "midi_chord_" + options.index,
        time: quantizeToGrid(Math.round((group.startSec || 0) * 1000), quantizeMs),
        laneMask: lanesToMask(chordLanes),
        primaryLane: chordLanes[0],
        duration: Math.max(0, quantizeToGrid(durationMs, quantizeMs)),
        velocity: velocity,
        label: chord,
        chord: chord,
        sourceNotes: group.notes.map(function(note){ return note.note; })
      };
    }

    var leadNote = group.notes[0];
    var lane = typeof options.pitchToLane === "function"
      ? options.pitchToLane(leadNote.pitch, laneCount)
      : pitchToLane(leadNote.pitch, laneCount);
    return {
      id: "midi_note_" + options.index,
      time: quantizeToGrid(Math.round((leadNote.startSec || 0) * 1000), quantizeMs),
      lane: lane,
      primaryLane: lane,
      duration: Math.max(0, quantizeToGrid(durationMs, quantizeMs)),
      velocity: velocity,
      label: leadNote.note || ("Lane " + (lane + 1))
    };
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

  function detectPlayableChord(notes){
    if(!notes || notes.length < 2) return null;
    var pitchClasses = uniquePitchClasses(notes);
    var matches = [];
    var patterns = [
      { suffix: "maj7", intervals: [0, 4, 7, 11], priority: 5 },
      { suffix: "m7", intervals: [0, 3, 7, 10], priority: 4 },
      { suffix: "7", intervals: [0, 4, 7, 10], priority: 3 },
      { suffix: "dim", intervals: [0, 3, 6], priority: 2 },
      { suffix: "m", intervals: [0, 3, 7], priority: 1 },
      { suffix: "", intervals: [0, 4, 7], priority: 0 }
    ];
    var i;
    var j;
    for(i=0;i<12;i++){
      for(j=0;j<patterns.length;j++){
        if(hasIntervals(pitchClasses, i, patterns[j].intervals)){
          matches.push({
            root: i,
            suffix: patterns[j].suffix,
            priority: patterns[j].priority
          });
        }
      }
    }
    if(!matches.length) return null;
    matches.sort(function(a, b){
      if (a.priority !== b.priority) return b.priority - a.priority;
      var aBass = chordRootDistance(a.root, notes[0].pitch);
      var bBass = chordRootDistance(b.root, notes[0].pitch);
      return aBass - bBass;
    });
    return formatDetectedChord(matches[0], notes);
  }

  function uniquePitchClasses(notes){
    var seen = {};
    var out = [];
    for(var i=0;i<notes.length;i++){
      var pitchClass = ((notes[i].pitch || 0) % 12 + 12) % 12;
      if(seen[pitchClass]) continue;
      seen[pitchClass] = true;
      out.push(pitchClass);
    }
    return out;
  }

  function hasIntervals(pitchClasses, root, intervals){
    for(var i=0;i<intervals.length;i++){
      if(pitchClasses.indexOf((root + intervals[i]) % 12) < 0) return false;
    }
    return true;
  }

  function chordRootDistance(root, bassPitch){
    var bassClass = ((bassPitch || 0) % 12 + 12) % 12;
    return (root - bassClass + 12) % 12;
  }

  function formatDetectedChord(match, notes){
    var label = pitchClassToName(match.root) + (match.suffix || "");
    var bass = ((notes[0].pitch || 0) % 12 + 12) % 12;
    if(bass !== match.root) {
      label += "/" + pitchClassToName(bass);
    }
    return label;
  }

  function pitchClassToName(pitchClass){
    var names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return names[pitchClass % 12] || "C";
  }

  function chordToPlayableLanes(chord, adapterType, laneCount){
    var maps = getPlayableChordLaneMaps(adapterType, laneCount);
    if(maps[chord]) return maps[chord].slice();
    var baseChord = normalizeChordForLaneLookup(chord);
    if(maps[baseChord]) return maps[baseChord].slice();
    var root = chordRootToPitchClass(chord);
    return [Math.abs(root) % Math.max(1, laneCount)];
  }

  function getPlayableChordLaneMaps(adapterType, laneCount){
    if(adapterType === "ukulele" || laneCount === 4){
      return {
        "C": [0, 1, 2, 3],
        "Am": [0, 1, 2],
        "F": [1, 2, 3],
        "G": [0, 1, 3],
        "Dm": [1, 2],
        "Em": [0, 2, 3],
        "A": [0, 2, 3],
        "D": [0, 1, 2]
      };
    }
    return {
      "C": [0, 1, 2],
      "Dm": [1, 2, 3],
      "D": [1, 2, 3],
      "Em": [2, 3, 4],
      "E": [2, 3, 4],
      "F": [0, 2, 4],
      "G": [0, 1, 3],
      "Am": [0, 1, 2],
      "A": [1, 2, 4]
    };
  }

  function chordRootToPitchClass(chord){
    var name = normalizeChordForLaneLookup(chord).replace(/(maj7|m7|7|dim|m)$/, "");
    var map = {
      "C": 0,
      "C#": 1,
      "D": 2,
      "D#": 3,
      "E": 4,
      "F": 5,
      "F#": 6,
      "G": 7,
      "G#": 8,
      "A": 9,
      "A#": 10,
      "B": 11
    };
    return map[name] != null ? map[name] : 0;
  }

  function normalizeChordForLaneLookup(chord){
    return String(chord || "").split("/")[0];
  }

  function noteToPitchLane(note){
    return String(note || "C4").charAt(0).toUpperCase();
  }

  function pitchToLane(pitch, laneCount){
    laneCount = laneCount || 5;
    return Math.abs(Number(pitch) || 0) % laneCount;
  }

  function lanesToMask(lanes){
    var mask = 0;
    for(var i=0;i<lanes.length;i++){
      mask = mask | (1 << lanes[i]);
    }
    return mask;
  }

  function quantizeToGrid(timeMs, beatMs){
    if(!beatMs || beatMs <= 0) return timeMs;
    return Math.round(timeMs / beatMs) * beatMs;
  }

  function getPlayableLaneCount(adapterType){
    if(adapterType === "ukulele" || adapterType === "bass") return 4;
    return 5;
  }

  function buildPlayableLaneLabels(laneCount, adapterType){
    if(adapterType === "bass") return ["E","A","D","G"];
    if(adapterType === "ukulele" || laneCount === 4) return ["G","C","E","A"];
    if(laneCount === 5) return ["E","A","D","G","B"];
    var labels = [];
    for(var i=0;i<laneCount;i++) labels.push("Lane " + (i + 1));
    return labels;
  }

  function normalizeImportedChartId(name){
    return String(name || "imported_midi").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
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
  window.buildPlayableChartFromImportedMidi = buildPlayableChartFromImportedMidi;
  window.buildPlayablePayloadFromImportedMidi = buildPlayablePayloadFromImportedMidi;

})();
