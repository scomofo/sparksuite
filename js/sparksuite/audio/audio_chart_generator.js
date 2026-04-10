(function() {
  function AudioChartGenerator() { this.beatDetector = new SparkBeatDetector(); }

  AudioChartGenerator.prototype.generate = function(audioBuffer, options) {
    options = options || {};
    var difficulty = options.difficulty || "easy";
    var trackId = options.trackId || "local_" + Date.now();
    var detection = this.beatDetector.detect(audioBuffer);
    var bpm = detection.bpm, beats = detection.beats, onsets = detection.onsets;
    var notes = this._buildNotes(beats, onsets, difficulty);
    var chords = this._inferChords(beats, difficulty);
    var ppq = 480;
    var tempoMap = new SparkTempoMap({ ppq: ppq, bpm: bpm });
    var noteEvents = [];
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      noteEvents.push(new SparkNoteEvent({
        id: "bd_" + i, tick: Math.round(n.timeSec * (ppq * bpm / 60)),
        tickLength: Math.round((n.durationSec || 0) * (ppq * bpm / 60)),
        lane: n.lane, laneMask: 1 << n.lane, flags: n.flags || {},
        difficulty: difficulty, label: "", skillId: null
      }));
    }
    var songChart = new SparkSongChart({
      song: { id: trackId, title: options.title || "Detected Track", artist: options.artist || "", durationSec: audioBuffer.duration },
      tempoMap: tempoMap,
      tracks: { rhythm: { notes: noteEvents, phrases: [] } },
      metadata: { defaultTrackId: "rhythm", source: "audio_beat_detection", difficulty: difficulty,
        laneCount: difficulty === "hard" ? 5 : 4, detectedBpm: bpm, beatConfidence: detection.confidence }
    });
    return new SparkPlayAlongChart({
      trackId: trackId, trackUri: null, difficulty: difficulty, instrument: options.instrument || "guitar",
      audio: { bpm: bpm, detectedBpm: bpm, confidence: detection.confidence },
      songChart: songChart, chords: chords, sections: this._detectSections(beats, audioBuffer.duration)
    });
  };

  AudioChartGenerator.prototype._buildNotes = function(beats, onsets, difficulty) {
    var notes = [], laneCount = difficulty === "hard" ? 5 : 4;
    var beatSkip = difficulty === "easy" ? 2 : 1, useOnsets = difficulty === "hard";
    var rng = seededRandom(beats.length);
    for (var i = 0; i < beats.length; i++) {
      if (i % beatSkip !== 0) continue;
      notes.push({ timeSec: beats[i].timeSec, lane: Math.floor(rng() * laneCount), durationSec: 0,
        flags: beats[i].strength > 0.7 ? { accent: true } : {} });
    }
    if (useOnsets) {
      var beatSet = {};
      for (var b = 0; b < beats.length; b++) beatSet[Math.round(beats[b].timeSec * 100)] = true;
      for (var j = 0; j < onsets.length; j++) {
        if (beatSet[Math.round(onsets[j].timeSec * 100)] || onsets[j].strength < 0.3) continue;
        notes.push({ timeSec: onsets[j].timeSec, lane: Math.floor(rng() * laneCount), durationSec: 0, flags: { syncopation: true } });
      }
      notes.sort(function(a, b) { return a.timeSec - b.timeSec; });
    }
    return notes;
  };

  AudioChartGenerator.prototype._inferChords = function(beats, difficulty) {
    if (!beats.length) return [];
    var chords = [], prog = typeof SparkChordLibrary !== "undefined" ? SparkChordLibrary.getProgression(0, 1, difficulty) : ["C", "Am", "F", "G"];
    var idx = 0;
    for (var i = 0; i < beats.length; i += 4) {
      var nextI = Math.min(i + 4, beats.length - 1);
      chords.push({ time: Math.round(beats[i].timeSec * 1000), chord: prog[idx % prog.length], duration: Math.round((beats[nextI].timeSec - beats[i].timeSec) * 1000) || 2000 });
      idx++;
    }
    return chords;
  };

  AudioChartGenerator.prototype._detectSections = function(beats, durSec) {
    if (beats.length < 16) return [];
    var sections = [], prevE = 0;
    for (var i = 0; i < beats.length; i += 16) {
      var e = 0, c = 0;
      for (var j = i; j < i + 16 && j < beats.length; j++) { e += beats[j].strength; c++; }
      e /= c || 1;
      if (Math.abs(e - prevE) > 0.15 || i === 0) {
        sections.push({ name: i === 0 ? "intro" : (e > prevE ? "chorus" : "verse"),
          startMs: Math.round(beats[i].timeSec * 1000),
          endMs: Math.round(beats[Math.min(i + 16, beats.length) - 1].timeSec * 1000) });
      }
      prevE = e;
    }
    return sections;
  };

  function seededRandom(seed) {
    var s = seed | 0;
    return function() { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  window.SparkAudioChartGenerator = AudioChartGenerator;
})();
