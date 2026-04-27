var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.performance = { now: function() { return 0; } };
  global.AudioContext = null;
  global.webkitAudioContext = null;
  global.S = {
    performAudioOffsetMs: 0,
    mastery: { rhythm: {} },
    weakSpots: {}
  };
  global.buildPracticeCandidates = function() {
    return [
      { id: "rhythm_fix", type: "rhythm", label: "Rhythm timing practice", reason: "Recent rhythm accuracy is low", meta: { accuracy: 62, bpm: 90 } }
    ];
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "First Spark" }]; }
  };
}

resetState();

eval(loadJS("js/sparksuite/domain/types.js"));
eval(loadJS("js/sparksuite/domain/session_segment.js"));
eval(loadJS("js/sparksuite/domain/session.js"));
eval(loadJS("js/sparksuite/domain/tempo_map.js"));
eval(loadJS("js/sparksuite/domain/note_event.js"));
eval(loadJS("js/sparksuite/domain/phrase.js"));
eval(loadJS("js/sparksuite/domain/chart.js"));
eval(loadJS("js/sparksuite/domain/gameplay_result.js"));
eval(loadJS("js/sparksuite/domain/engine_preset.js"));
eval(loadJS("js/sparksuite/bridges/practice_bridge.js"));
eval(loadJS("js/sparksuite/core/calibration_engine.js"));
eval(loadJS("js/sparksuite/core/timing_engine.js"));
eval(loadJS("js/sparksuite/core/chart_io.js"));
eval(loadJS("js/sparksuite/core/replay_engine.js"));
eval(loadJS("js/sparksuite/core/input_judge.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));
eval(loadJS("js/sparksuite/core/rhythm_gameplay_engine.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_module.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js"));
eval(loadJS("js/sparksuite/core/practice_engine.js"));
global.requestAnimationFrame = function() { return 1; };
global.cancelAnimationFrame = function() {};
global.render = function() {};
global.escHTML = function(value) { return String(value); };
global.SCR = { RHYTHM_HIGHWAY: "rhythmHighway" };
eval(loadJS("js/pages/rhythm_highway.js"));

console.log("\n--- SparkSuite Rhythm Core ---");

test("chart io normalizes guitar exercise definitions", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var chart = adapter.createPayload({}).songChart;

  assert.ok(chart.song.id);
  assert.strictEqual(chart.metadata.sourceFormat, "spark_exercise_v1");
  assert.strictEqual(chart.tracks.guitar.notes.length, 8);
  assert.strictEqual(chart.tracks.guitar.phrases.length, 1);
});

test("chart io imports notes.chart text with tempo changes and song.ini metadata", function() {
  var chartIO = new SparkChartIO();
  var chartText = [
    "[Song]",
    "{",
    "  Name = \"Fallback Title\"",
    "  Artist = \"Fallback Artist\"",
    "  Resolution = 192",
    "}",
    "[SyncTrack]",
    "{",
    "  0 = B 120000",
    "  384 = B 90000",
    "}",
    "[ExpertSingle]",
    "{",
    "  0 = N 0 0",
    "  0 = N 1 0",
    "  192 = N 2 0",
    "  192 = N 5 0",
    "  384 = S 2 192",
    "  384 = N 3 0",
    "  576 = N 7 0",
    "}"
  ].join("\n");
  var iniText = [
    "[song]",
    "name = Imported Song",
    "artist = Imported Artist",
    "charter = Spark Tester"
  ].join("\n");

  var chart = chartIO.fromNotesChart(chartText, new SparkGuitarRhythmAdapter(), {
    songIni: iniText
  });

  assert.strictEqual(chart.metadata.sourceFormat, "notes_chart_v1");
  assert.strictEqual(chart.song.id, "imported_song");
  assert.strictEqual(chart.song.title, "Imported Song");
  assert.strictEqual(chart.song.artist, "Imported Artist");
  assert.strictEqual(chart.song.charter, "Spark Tester");
  assert.strictEqual(chart.tempoMap.segments.length, 2);
  assert.strictEqual(chart.tempoMap.segments[0].bpm, 120);
  assert.strictEqual(chart.tempoMap.segments[1].bpm, 90);
  assert.strictEqual(chart.tracks.guitar.notes.length, 4);
  assert.strictEqual(chart.tracks.guitar.notes[0].laneMask, 3);
  assert.strictEqual(chart.tracks.guitar.notes[1].flags.forced, true);
  assert.strictEqual(chart.tracks.guitar.notes[3].flags.open, true);
  assert.strictEqual(chart.tracks.guitar.notes[2].flags.specialPhrase, true);
  assert.strictEqual(chart.tracks.guitar.phrases.length, 1);
  assert.strictEqual(chart.tracks.guitar.phrases[0].flags.special, true);
  assert.ok(Math.abs(chart.tempoMap.tickToSeconds(576) - 1.6666666667) < 0.001);
});

test("chart io imports midi buffers with tempo changes and chord grouping", function() {
  var chartIO = new SparkChartIO();
  var midiBytes = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    0x00, 0x60,
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x32,
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,
    0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,
    0x00, 0x90, 0x3c, 0x64,
    0x60, 0x80, 0x3c, 0x40,
    0x00, 0xff, 0x51, 0x03, 0x09, 0x27, 0xc0,
    0x00, 0x90, 0x43, 0x64,
    0x00, 0x90, 0x47, 0x64,
    0x60, 0x80, 0x43, 0x40,
    0x00, 0x80, 0x47, 0x40,
    0x00, 0xff, 0x2f, 0x00
  ]);
  var chart = chartIO.fromMidiBuffer(midiBytes.buffer, new SparkGuitarRhythmAdapter(), {
    title: "Imported MIDI Test",
    songIni: [
      "[song]",
      "name = MIDI Song",
      "artist = MIDI Artist"
    ].join("\n")
  });

  assert.strictEqual(chart.metadata.sourceFormat, "notes_mid_v1");
  assert.strictEqual(chart.song.id, "midi_song");
  assert.strictEqual(chart.song.title, "MIDI Song");
  assert.strictEqual(chart.song.artist, "MIDI Artist");
  assert.strictEqual(chart.tempoMap.ppq, 96);
  assert.strictEqual(chart.tempoMap.segments.length, 2);
  assert.strictEqual(chart.tempoMap.segments[0].bpm, 120);
  assert.strictEqual(chart.tempoMap.segments[1].bpm, 100);
  assert.strictEqual(chart.metadata.timeSignatures.length, 1);
  assert.strictEqual(chart.metadata.timeSignatures[0].numerator, 4);
  assert.strictEqual(chart.metadata.timeSignatures[0].denominator, 4);
  assert.strictEqual(chart.tracks.guitar.notes.length, 2);
  assert.strictEqual(chart.tracks.guitar.notes[0].laneMask, 1);
  assert.deepStrictEqual(chart.tracks.guitar.notes[0].flags.midiNotes, [60]);
  assert.strictEqual(chart.tracks.guitar.notes[1].laneMask, 3);
  assert.deepStrictEqual(chart.tracks.guitar.notes[1].flags.midiNotes, [67, 71]);
  assert.strictEqual(chart.tracks.guitar.phrases.length, 1);
  assert.ok(Math.abs(chart.song.durationSec - 1.1) < 0.001);
});

test("chart io selects named midi tracks and builds phrases from markers", function() {
  var chartIO = new SparkChartIO();
  var midiBytes = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x01,
    0x00, 0x03,
    0x00, 0x60,

    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x0b,
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,
    0x00, 0xff, 0x2f, 0x00,

    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x35,
    0x00, 0xff, 0x03, 0x0b, 0x50, 0x41, 0x52, 0x54, 0x20, 0x47, 0x55, 0x49, 0x54, 0x41, 0x52,
    0x00, 0xff, 0x06, 0x05, 0x49, 0x6e, 0x74, 0x72, 0x6f,
    0x00, 0x90, 0x3c, 0x64,
    0x60, 0x80, 0x3c, 0x40,
    0x00, 0xff, 0x06, 0x05, 0x56, 0x65, 0x72, 0x73, 0x65,
    0x00, 0x90, 0x40, 0x64,
    0x60, 0x80, 0x40, 0x40,
    0x00, 0xff, 0x2f, 0x00,

    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x19,
    0x00, 0xff, 0x03, 0x09, 0x50, 0x41, 0x52, 0x54, 0x20, 0x42, 0x41, 0x53, 0x53,
    0x00, 0x90, 0x2d, 0x64,
    0x60, 0x80, 0x2d, 0x40,
    0x00, 0xff, 0x2f, 0x00
  ]);

  var chart = chartIO.fromMidiBuffer(midiBytes.buffer, new SparkGuitarRhythmAdapter(), {
    trackName: "PART GUITAR"
  });

  assert.strictEqual(chart.metadata.midiFormat, 1);
  assert.strictEqual(chart.metadata.sourceTrackCount, 3);
  assert.strictEqual(chart.metadata.trackName, "PART GUITAR");
  assert.strictEqual(chart.metadata.trackIndex, 1);
  assert.strictEqual(chart.tracks.guitar.notes.length, 2);
  assert.deepStrictEqual(chart.tracks.guitar.notes[0].flags.midiNotes, [60]);
  assert.deepStrictEqual(chart.tracks.guitar.notes[1].flags.midiNotes, [64]);
  assert.strictEqual(chart.tracks.guitar.phrases.length, 2);
  assert.strictEqual(chart.tracks.guitar.phrases[0].name, "Intro");
  assert.strictEqual(chart.tracks.guitar.phrases[1].name, "Verse");
  assert.strictEqual(chart.tracks.guitar.phrases[0].startTick, 0);
  assert.strictEqual(chart.tracks.guitar.phrases[0].endTick, 96);
  assert.strictEqual(chart.tracks.guitar.phrases[1].startTick, 96);
  assert.strictEqual(chart.tracks.guitar.phrases[1].endTick, 192);
});

test("chart io filters multi-channel midi tracks toward the dominant melodic channel by default", function() {
  var chartIO = new SparkChartIO();
  var midiBytes = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    0x00, 0x60,
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x2d,
    0x00, 0xff, 0x03, 0x04, 0x4c, 0x65, 0x61, 0x64,
    0x00, 0x90, 0x3c, 0x64,
    0x00, 0x91, 0x43, 0x64,
    0x60, 0x80, 0x3c, 0x40,
    0x00, 0x81, 0x43, 0x40,
    0x00, 0x90, 0x40, 0x64,
    0x60, 0x80, 0x40, 0x40,
    0x00, 0xff, 0x2f, 0x00
  ]);

  var chart = chartIO.fromMidiBuffer(midiBytes.buffer, new SparkGuitarRhythmAdapter(), {
    title: "Multi Channel"
  });

  assert.deepStrictEqual(chart.metadata.availableChannels, [0, 1]);
  assert.deepStrictEqual(chart.metadata.selectedChannels, [0]);
  assert.strictEqual(chart.tracks.guitar.notes.length, 2);
  assert.deepStrictEqual(chart.tracks.guitar.notes[0].flags.midiNotes, [60]);
  assert.deepStrictEqual(chart.tracks.guitar.notes[1].flags.midiNotes, [64]);
});

test("chart io loads notes.chart packages through a single package entry point", function() {
  var chartIO = new SparkChartIO();
  var chart = chartIO.fromPackage({
    files: {
      "notes.chart": [
        "[Song]",
        "{",
        "  Resolution = 192",
        "}",
        "[SyncTrack]",
        "{",
        "  0 = B 120000",
        "}",
        "[ExpertSingle]",
        "{",
        "  0 = N 0 0",
        "  192 = N 1 0",
        "}"
      ].join("\n"),
      "song.ini": [
        "[song]",
        "name = Package Chart Song",
        "artist = Package Artist"
      ].join("\n")
    }
  }, new SparkGuitarRhythmAdapter());

  assert.strictEqual(chart.metadata.sourceFormat, "notes_chart_v1");
  assert.strictEqual(chart.song.title, "Package Chart Song");
  assert.strictEqual(chart.song.artist, "Package Artist");
  assert.strictEqual(chart.tracks.guitar.notes.length, 2);
});

test("chart io loads notes.mid packages through a single package entry point", function() {
  var chartIO = new SparkChartIO();
  var midiBytes = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    0x00, 0x60,
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x16,
    0x00, 0xff, 0x03, 0x04, 0x4c, 0x65, 0x61, 0x64,
    0x00, 0x90, 0x3c, 0x64,
    0x60, 0x80, 0x3c, 0x40,
    0x00, 0xff, 0x2f, 0x00
  ]);
  var chart = chartIO.fromPackage({
    files: {
      notesmid: { buffer: midiBytes.buffer },
      songini: {
        text: [
          "[song]",
          "name = Package MIDI Song",
          "artist = MIDI Package Artist"
        ].join("\n")
      }
    }
  }, new SparkGuitarRhythmAdapter());

  assert.strictEqual(chart.metadata.sourceFormat, "notes_mid_v1");
  assert.strictEqual(chart.song.title, "Package MIDI Song");
  assert.strictEqual(chart.song.artist, "MIDI Package Artist");
  assert.strictEqual(chart.metadata.trackName, "Lead");
  assert.strictEqual(chart.tracks.guitar.notes.length, 1);
});

test("engine preset registry exposes selectable spark rhythm assist presets", function() {
  var presets = SparkEnginePresetRegistry.all();

  assert.ok(presets.spark_learning);
  assert.ok(presets.spark_balanced);
  assert.ok(presets.spark_challenge);
  assert.ok(presets.spark_learning.hitWindowMs.miss > presets.spark_balanced.hitWindowMs.miss);
  assert.ok(presets.spark_balanced.hitWindowMs.miss > presets.spark_challenge.hitWindowMs.miss);
  assert.strictEqual(presets.spark_challenge.extraFretTolerance, false);
});

test("rhythm gameplay engine can run with tighter challenge preset timing", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var payload = adapter.createPayload({});
  var engine = new SparkRhythmGameplayEngine({
    chart: payload.songChart,
    adapter: adapter,
    preset: SparkEnginePresetRegistry.get("spark_challenge")
  });

  var snapshot = engine.update(0);
  assert.strictEqual(engine.preset.name, "spark_challenge");
  assert.strictEqual(snapshot.gameplay.score, 0);
  assert.strictEqual(engine.preset.hitWindowMs.miss, 145);
});

test("rhythm highway loop tooling can build a normalized loop payload", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var payload = adapter.createPayload({});
  var loopSpec = _createRhythmHighwayLoopSpec(payload, { songTimeSec: 0 });
  var loopPayload = _buildRhythmHighwayLoopPayload(payload, loopSpec);

  assert.ok(loopSpec);
  assert.ok(loopPayload);
  assert.ok(loopPayload.songChart.tracks.guitar.notes.length >= 1);
  assert.strictEqual(loopPayload.songChart.tracks.guitar.notes[0].tick, 0);
  assert.strictEqual(loopPayload.songChart.tempoMap.segments[0].tick, 0);
  assert.ok(loopPayload.songChart.metadata.loopedFrom);
});

test("instrument rhythm adapters expose lane metadata for non-guitar highway layouts", function() {
  var bassPayload = new SparkBassRhythmAdapter().createPayload({});
  var ukulelePayload = new SparkUkuleleRhythmAdapter().createPayload({});

  assert.strictEqual(bassPayload.adapterType, "bass");
  assert.strictEqual(bassPayload.laneCount, 4);
  assert.deepStrictEqual(bassPayload.laneLabels, ["E", "A", "D", "G"]);
  assert.strictEqual(ukulelePayload.adapterType, "ukulele");
  assert.strictEqual(ukulelePayload.laneCount, 4);
  assert.deepStrictEqual(ukulelePayload.laneLabels, ["G", "C", "E", "A"]);
});

test("rhythm highway can launch directly from an authored bass module payload", function() {
  var payload = new SparkBassRhythmAdapter().createPayload({
    segment: {
      id: "bass_walk_lines_01",
      meta: { skill: "walking_bass" }
    },
    curriculum: {
      nextLessonId: "bass_level_4"
    }
  });

  var started = startRhythmHighwayPayload(payload, "spark_balanced", {
    source: "module_exercise",
    label: "Walk Lines 01",
    instrument: "bass",
    exerciseId: "bass_walk_lines_01",
    exerciseFocus: "walking_bass"
  });

  assert.strictEqual(started, true);
  assert.strictEqual(S.screen, SCR.RHYTHM_HIGHWAY);
  assert.strictEqual(S.activeCoreSegmentId, null);
  assert.strictEqual(S.rhythmHighwayLaunchContext.label, "Walk Lines 01");
  assert.strictEqual(S.rhythmHighwayLaunchContext.instrument, "bass");
  assert.strictEqual(S.rhythmHighwayLaunchContext.exerciseFocus, "walking_bass");
  assert.deepStrictEqual(_getRhythmHighwayLaneLabels(), ["E", "A", "D", "G"]);
});

test("rhythm highway normalizes app-id instruments for adapter, clock, and loop payloads", function() {
  global.SparkInstruments = {
    getAll: function() {
      return [
        { id: "ukespark", appId: "ukespark", instrument: "ukulele" }
      ];
    }
  };

  var capturedClockInstrument = null;
  var capturedAdapter = null;
  var OriginalTimingEngine = global.SparkTimingEngine;
  var OriginalGameplayEngine = global.SparkRhythmGameplayEngine;

  global.SparkTimingEngine = function() {};
  SparkTimingEngine.prototype.createClock = function(instrument) {
    capturedClockInstrument = instrument;
    return { getSongTime: function() { return 0; }, close: function() {} };
  };
  SparkTimingEngine.prototype.tickToSeconds = function(tempoMap, tick) {
    return tempoMap && typeof tempoMap.tickToSeconds === "function" ? tempoMap.tickToSeconds(tick) : 0;
  };

  global.SparkRhythmGameplayEngine = function(options) {
    capturedAdapter = options.adapter;
    this.update = function() {
      return { gameplay: { score: 0, maxCombo: 0, accuracy: 0 }, notes: [], songTimeSec: 0, finished: false };
    };
    this.getSnapshot = function() {
      return { gameplay: { score: 0, maxCombo: 0, accuracy: 0 }, notes: [], songTimeSec: 0, finished: false };
    };
  };

  try {
    var payload = new SparkUkuleleRhythmAdapter().createPayload({});
    payload.adapterType = "ukespark";
    payload.laneLabels = null;

    var started = startRhythmHighwayPayload(payload, "spark_balanced", {
      source: "module_exercise",
      instrument: "ukespark"
    });
    var loopSpec = _createRhythmHighwayLoopSpec(payload, { songTimeSec: 0 });
    var loopPayload = _buildRhythmHighwayLoopPayload(payload, loopSpec);

    assert.strictEqual(started, true);
    assert.strictEqual(capturedClockInstrument, "ukulele");
    assert.ok(capturedAdapter instanceof SparkUkuleleRhythmAdapter);
    assert.strictEqual(S.rhythmHighwayLaunchContext.instrument, "ukulele");
    assert.deepStrictEqual(_getRhythmHighwayLaneLabels(), ["G", "C", "E", "A"]);
    assert.strictEqual(loopPayload.adapterType, "ukulele");
  } finally {
    global.SparkTimingEngine = OriginalTimingEngine;
    global.SparkRhythmGameplayEngine = OriginalGameplayEngine;
    delete global.SparkInstruments;
  }
});

test("rhythm highway falls back to the thin active instrument when payloads omit adapter types", function() {
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "ukespark" };
    },
    getAll: function() {
      return [
        { id: "ukespark", appId: "ukespark", instrument: "ukulele" }
      ];
    }
  };

  var capturedClockInstrument = null;
  var capturedAdapter = null;
  var OriginalTimingEngine = global.SparkTimingEngine;
  var OriginalGameplayEngine = global.SparkRhythmGameplayEngine;

  global.SparkTimingEngine = function() {};
  SparkTimingEngine.prototype.createClock = function(instrument) {
    capturedClockInstrument = instrument;
    return { getSongTime: function() { return 0; }, close: function() {} };
  };
  SparkTimingEngine.prototype.tickToSeconds = function(tempoMap, tick) {
    return tempoMap && typeof tempoMap.tickToSeconds === "function" ? tempoMap.tickToSeconds(tick) : 0;
  };

  global.SparkRhythmGameplayEngine = function(options) {
    capturedAdapter = options.adapter;
    this.update = function() {
      return { gameplay: { score: 0, maxCombo: 0, accuracy: 0 }, notes: [], songTimeSec: 0, finished: false };
    };
    this.getSnapshot = function() {
      return { gameplay: { score: 0, maxCombo: 0, accuracy: 0 }, notes: [], songTimeSec: 0, finished: false };
    };
  };

  try {
    var payload = new SparkUkuleleRhythmAdapter().createPayload({});
    delete payload.adapterType;
    payload.laneLabels = null;

    var started = startRhythmHighwayPayload(payload, "spark_balanced", {
      source: "module_exercise"
    });

    assert.strictEqual(started, true);
    assert.strictEqual(capturedClockInstrument, "ukulele");
    assert.ok(capturedAdapter instanceof SparkUkuleleRhythmAdapter);
    assert.strictEqual(S.rhythmHighwayLaunchContext.instrument, "ukulele");
    assert.deepStrictEqual(_getRhythmHighwayLaneLabels(), ["G", "C", "E", "A"]);
  } finally {
    global.SparkTimingEngine = OriginalTimingEngine;
    global.SparkRhythmGameplayEngine = OriginalGameplayEngine;
    delete global.SparkInstruments;
  }
});

test("rhythm highway can resolve sparkCore from the global binding", function() {
  global.window = {};
  var completed = null;
  var payload = new SparkUkuleleRhythmAdapter().createPayload({});
  global.sparkCore = {
    getSegmentById: function(segmentId) {
      return {
        id: segmentId,
        label: "Island Groove",
        meta: { gameplayPayload: payload }
      };
    },
    completeSession: function(request) {
      completed = request;
      return { ok: true };
    }
  };

  var OriginalTimingEngine = global.SparkTimingEngine;
  var OriginalGameplayEngine = global.SparkRhythmGameplayEngine;

  global.SparkTimingEngine = function() {};
  SparkTimingEngine.prototype.createClock = function() {
    return { getSongTime: function() { return 0; }, close: function() {} };
  };

  global.SparkRhythmGameplayEngine = function() {
    this.update = function() {
      return {
        gameplay: { score: 900, maxCombo: 5, accuracy: 0.8 },
        notes: [],
        songTimeSec: 0,
        finished: true
      };
    };
    this.getSnapshot = function() {
      return {
        gameplay: { score: 0, maxCombo: 0, accuracy: 0 },
        notes: [],
        songTimeSec: 0,
        finished: false
      };
    };
    this.finalize = function() {
      return {
        gameplay: { score: 900, maxCombo: 5, accuracy: 0.8 },
        learning: { weakAreas: ["late"], skills: [] }
      };
    };
  };

  try {
    var started = startRhythmHighwaySegment("seg_uke_1", "spark_balanced");

    assert.strictEqual(started, true);
    assert.strictEqual(S.activeCoreSegmentId, "seg_uke_1");
    assert.strictEqual(S.rhythmHighwayLaunchContext.label, "Island Groove");

    assert.ok(completed);
    assert.strictEqual(completed.itemId, "seg_uke_1");
    assert.strictEqual(completed.flow, SparkSessionTypes.FLOW_DAILY_PRACTICE);
    assert.strictEqual(completed.gameplayContext.source, "core_segment");
    assert.strictEqual(completed.gameplayContext.label, "Island Groove");
  } finally {
    global.SparkTimingEngine = OriginalTimingEngine;
    global.SparkRhythmGameplayEngine = OriginalGameplayEngine;
    delete global.sparkCore;
  }
});

test("bass module can provide rhythm guidance for focused authored drills", function() {
  var guidance = SparkBassModule.getRhythmGuidance("walking_bass", {
    gameplay: { accuracy: 71 / 100 },
    learning: { weakAreas: ["late"] }
  });

  assert.strictEqual(guidance.title, "Bass Walking Checkpoint");
  assert.ok(guidance.summary.indexOf("late") >= 0);
  assert.ok(guidance.nextStep.indexOf("walking line") >= 0);
});

test("rhythm highway results render module-owned bass guidance when available", function() {
  S.rhythmHighwayResult = {
    gameplay: { score: 1200, accuracy: 0.74, maxCombo: 12 },
    learning: { weakAreas: ["wrong_fret"], skills: [] }
  };
  S.rhythmHighwayLaunchContext = {
    instrument: "bass",
    exerciseFocus: "slap",
    label: "Slap Pop 01"
  };

  var html = rhythmHighwayPage();

  assert.ok(html.indexOf("Slap Technique") >= 0);
  assert.ok(html.indexOf("thumb") >= 0 || html.indexOf("slap") >= 0);
  assert.ok(html.indexOf("Next:") >= 0);
});

test("rhythm highway ignores stale cached labels and weak-area text", function() {
  S.rhythmHighwayResult = null;
  S.rhythmHighwaySnapshot = {
    gameplay: { score: 100, maxCombo: 4, accuracy: 0.8 },
    notes: [{ laneMask: 1, timeSec: 0.5, hit: false, label: "undefined" }],
    songTimeSec: 0
  };
  S.rhythmHighwayHeldMask = 0;
  S.rhythmHighwayLoop = { label: "null" };
  S.rhythmHighwayLaunchContext = {
    instrument: "guitar",
    label: "undefined",
    exerciseFocus: "null"
  };

  var activeHtml = rhythmHighwayPage();
  assert.ok(activeHtml.indexOf("Focused Drill: current drill") >= 0);
  assert.ok(activeHtml.indexOf("Looping current window") >= 0);
  assert.ok(activeHtml.indexOf("undefined") === -1);
  assert.ok(activeHtml.indexOf("null") === -1);

  S.rhythmHighwayResult = {
    gameplay: { score: 1200, accuracy: 0.74, maxCombo: 12 },
    learning: {
      weakAreas: ["undefined", "wrong_fret", "null"],
      skills: [{ id: "undefined", delta: 2 }]
    }
  };

  var resultHtml = rhythmHighwayPage();
  assert.ok(resultHtml.indexOf("Focus: rhythm") >= 0);
  assert.ok(resultHtml.indexOf("wrong fret") >= 0);
  assert.ok(resultHtml.indexOf("undefined") === -1);
  assert.ok(resultHtml.indexOf("null") === -1);
});

test("rhythm gameplay engine produces deterministic results for the same input stream", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var payload = adapter.createPayload({});

  var run = function() {
    var engine = new SparkRhythmGameplayEngine({
      chart: payload.songChart,
      adapter: adapter,
      preset: SparkEnginePresetRegistry.get(payload.enginePreset)
    });
    var notes = payload.songChart.tracks.guitar.notes;
    var timing = new SparkTimingEngine(new SparkCalibrationEngine());
    for (var i = 0; i < notes.length; i++) {
      var atSec = timing.tickToSeconds(payload.songChart.tempoMap, notes[i].tick);
      engine.update(atSec);
      engine.handleInput({ kind: "strum", laneMask: notes[i].laneMask, atSec: atSec });
    }
    engine.update(20);
    return engine.finalize();
  };

  var first = run();
  var second = run();

  assert.deepStrictEqual(first.gameplay, second.gameplay);
  assert.deepStrictEqual(first.learning, second.learning);
  assert.ok(first.gameplay.score > 0);
  assert.ok(first.learning.skills.length > 0);
});

test("practice engine upgrades rhythm candidates into rhythm_highway segments with gameplay payload", function() {
  var practiceEngine = new SparkSuitePracticeEngine({
    getFocusLabel: function(segments) { return segments[0].type; }
  });
  var segments = practiceEngine.buildDailyPracticePlan({
    instrumentContext: {
      rhythmAdapter: new SparkGuitarRhythmAdapter()
    },
    curriculum: {}
  }).segments;

  assert.strictEqual(segments.length, 1);
  assert.strictEqual(segments[0].type, "rhythm_highway");
  assert.ok(segments[0].meta.gameplayPayload);
  assert.strictEqual(segments[0].meta.gameplayPayload.chartId, "gtr_open_strums_01");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
