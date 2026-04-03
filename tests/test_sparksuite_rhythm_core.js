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
eval(loadJS("js/sparksuite/core/practice_engine.js"));

console.log("\n--- SparkSuite Rhythm Core ---");

test("chart io normalizes guitar exercise definitions", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var chart = adapter.createPayload({}).songChart;

  assert.ok(chart.song.id);
  assert.strictEqual(chart.metadata.sourceFormat, "spark_exercise_v1");
  assert.strictEqual(chart.tracks.guitar.notes.length, 16);
  assert.strictEqual(chart.tracks.guitar.phrases.length, 2);
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
  assert.strictEqual(segments[0].meta.gameplayPayload.chartId, "power_chords_01");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
