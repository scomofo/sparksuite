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

function getDefaultTrack(chart) {
  var trackId = chart && chart.metadata ? chart.metadata.defaultTrackId : null;
  if (trackId && chart.tracks && chart.tracks[trackId]) return chart.tracks[trackId];
  var keys = chart && chart.tracks ? Object.keys(chart.tracks) : [];
  return keys.length ? chart.tracks[keys[0]] : { notes: [], phrases: [] };
}

function resetState() {
  global.window = global;
  global.performance = { now: function() { return 0; } };
  global.AudioContext = null;
  global.webkitAudioContext = null;
  global.__saveStateCalls = 0;
  global.saveState = function() { global.__saveStateCalls++; };
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
eval(loadJS("js/import/midi_seed.js"));
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 16);
  assert.strictEqual(getDefaultTrack(chart).phrases.length, 2);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 4);
  assert.strictEqual(getDefaultTrack(chart).notes[0].laneMask, 3);
  assert.strictEqual(getDefaultTrack(chart).notes[1].flags.forced, true);
  assert.strictEqual(getDefaultTrack(chart).notes[3].flags.open, true);
  assert.strictEqual(getDefaultTrack(chart).notes[2].flags.specialPhrase, true);
  assert.strictEqual(getDefaultTrack(chart).phrases.length, 1);
  assert.strictEqual(getDefaultTrack(chart).phrases[0].flags.special, true);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 2);
  assert.strictEqual(getDefaultTrack(chart).notes[0].laneMask, 1);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[0].flags.midiNotes, [60]);
  assert.strictEqual(getDefaultTrack(chart).notes[1].laneMask, 3);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[1].flags.midiNotes, [67, 71]);
  assert.strictEqual(getDefaultTrack(chart).phrases.length, 1);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 2);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[0].flags.midiNotes, [60]);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[1].flags.midiNotes, [64]);
  assert.strictEqual(getDefaultTrack(chart).phrases.length, 2);
  assert.strictEqual(getDefaultTrack(chart).phrases[0].name, "Intro");
  assert.strictEqual(getDefaultTrack(chart).phrases[1].name, "Verse");
  assert.strictEqual(getDefaultTrack(chart).phrases[0].startTick, 0);
  assert.strictEqual(getDefaultTrack(chart).phrases[0].endTick, 96);
  assert.strictEqual(getDefaultTrack(chart).phrases[1].startTick, 96);
  assert.strictEqual(getDefaultTrack(chart).phrases[1].endTick, 192);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 2);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[0].flags.midiNotes, [60]);
  assert.deepStrictEqual(getDefaultTrack(chart).notes[1].flags.midiNotes, [64]);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 2);
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
  assert.strictEqual(getDefaultTrack(chart).notes.length, 1);
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

test("performance engine exposes reusable note mapping and timing window helpers", function() {
  var adapter = new SparkUkuleleRhythmAdapter();
  var payload = adapter.createPayload({});
  var notes = SparkPerformanceNoteMapper.fromChart(payload.songChart);
  var note = notes[0];

  assert.ok(window.SparkPerformanceEngine);
  assert.ok(window.SparkPerformanceInputHandler);
  assert.ok(window.SparkPerformanceScoringSystem);
  assert.ok(Array.isArray(notes));
  assert.strictEqual(note.type, "chord");
  assert.strictEqual(typeof note.time, "number");
  assert.strictEqual(SparkPerformanceTimingWindow.score({ timestamp: note.time + 20 }, note), "perfect");
  assert.strictEqual(SparkPerformanceTimingWindow.score({ timestamp: note.time + 80 }, note), "good");
  assert.strictEqual(SparkPerformanceTimingWindow.score({ timestamp: note.time + 140 }, note), "miss");
});

test("rhythm highway loop tooling can build a normalized loop payload", function() {
  var adapter = new SparkGuitarRhythmAdapter();
  var payload = adapter.createPayload({});
  var loopSpec = _createRhythmHighwayLoopSpec(payload, { songTimeSec: 0 });
  var loopPayload = _buildRhythmHighwayLoopPayload(payload, loopSpec);

  assert.ok(loopSpec);
  assert.ok(loopPayload);
  assert.ok(getDefaultTrack(loopPayload.songChart).notes.length >= 1);
  assert.strictEqual(getDefaultTrack(loopPayload.songChart).notes[0].tick, 0);
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
  assert.ok(ukulelePayload.chart);
  assert.strictEqual(ukulelePayload.chart.lanes.length, 4);
  assert.strictEqual(typeof ukulelePayload.chart.notes[0].lane, "number");
  assert.strictEqual(ukulelePayload.chart.notes[0].time, 0);
  assert.ok(ukulelePayload.songChart.tracks.ukulele);
  assert.strictEqual(ukulelePayload.songChart.tracks.guitar, undefined);
});

test("rhythm highway exposes a canonical lane chart and key-to-lane mapping", function() {
  var payload = new SparkUkuleleRhythmAdapter().createPayload({});
  startRhythmHighwayPayload(payload, "spark_learning", {
    source: "module_exercise",
    instrument: "ukulele",
    label: "Island Pattern 01"
  });

  var laneChart = _getRhythmHighwayLaneChart(payload);

  assert.ok(laneChart);
  assert.strictEqual(laneChart.lanes.length, 4);
  assert.strictEqual(laneChart.lanes[0].label, "G");
  assert.strictEqual(laneChart.lanes[0].input, "1");
  assert.strictEqual(typeof laneChart.notes[0].lane, "number");
  assert.strictEqual(_mapRhythmHighwayKeyToLane("1"), 0);
  assert.strictEqual(_mapRhythmHighwayKeyToLane("4"), 3);
  assert.strictEqual(_mapRhythmHighwayKeyToLane("9"), -1);
});

test("playable runtime can score a simple lane-chart loop in isolation", function() {
  var now = 0;
  global.performance = {
    now: function() { return now; }
  };
  var chart = {
    chartId: "playable_test",
    tempo: 80,
    lanes: [
      { lane: 0, label: "G", input: "1" },
      { lane: 1, label: "C", input: "2" }
    ],
    notes: [
      { id: "n1", time: 0, lane: 0, duration: 0, velocity: 1 },
      { id: "n2", time: 500, lane: 1, duration: 0, velocity: 1 }
    ]
  };
  var runtime = _createPlayableRhythmRuntime(chart, { speed: 0.3, hitWindowMs: 150 });

  assert.ok(runtime);
  assert.strictEqual(_getPlayableNoteY(500, 0, 0.3), 150);
  assert.strictEqual(_getPlayableLaneX(1), 180);

  now = 10;
  assert.strictEqual(runtime.handleLaneInput(0), "Perfect");
  assert.strictEqual(runtime.getSnapshot().gameplay.combo, 1);
  now = 540;
  assert.strictEqual(runtime.handleLaneInput(1), "Perfect");

  var results = runtime.getResults();
  assert.strictEqual(results.hits, 2);
  assert.strictEqual(results.total, 2);
  assert.strictEqual(results.accuracy, 1);
  assert.strictEqual(results.score, 200);
  assert.strictEqual(results.maxCombo, 2);
  assert.strictEqual(results.xpEarned, 54);
  assert.strictEqual(results.suggestedDifficulty, "hard");
});

test("playable runtime tracks feedback, combo breaks, and practice assist controls", function() {
  var now = 0;
  global.performance = {
    now: function() { return now; }
  };
  var chart = {
    chartId: "playable_assist",
    tempo: 80,
    lanes: [
      { lane: 0, label: "G", input: "1" },
      { lane: 1, label: "C", input: "2" }
    ],
    notes: [
      { id: "n1", time: 0, lane: 0, duration: 0, velocity: 1 },
      { id: "n2", time: 500, lane: 1, duration: 0, velocity: 1 }
    ]
  };
  var runtime = _createPlayableRhythmRuntime(chart, { speedMultiplier: 1 });
  assert.strictEqual(runtime.getAssistState().inputOffsetMs, -20);
  assert.strictEqual(runtime.getAssistState().scrollSpeed, 0.28);
  assert.strictEqual(runtime.getAssistState().windows.perfect, 45);
  assert.strictEqual(runtime.getAssistState().windows.good, 90);
  assert.strictEqual(runtime.getAssistState().windows.hit, 140);

  now = 30;
  assert.strictEqual(runtime.handleLaneInput(0), "Perfect");
  assert.strictEqual(runtime.getSnapshot().feedback.type, "perfect");

  now = 700;
  runtime.getSnapshot();
  assert.strictEqual(runtime.getResults().combo, 0);
  assert.strictEqual(runtime.getResults().maxCombo, 1);

  runtime.setSlowMode(true);
  assert.strictEqual(runtime.getAssistState().slowMode, true);

  var loopRuntime = _createPlayableRhythmRuntime(chart, { speedMultiplier: 1 });
  loopRuntime.setLoop(0, 600);
  assert.deepStrictEqual(loopRuntime.getAssistState().loop, { start: 0, end: 600 });
  now = 710;
  assert.notStrictEqual(loopRuntime.handleLaneInput(0), "Miss.");
  now = 1350;
  assert.ok(loopRuntime.getSnapshot().songTimeSec < 0.61);
  now = 1360;
  assert.notStrictEqual(loopRuntime.handleLaneInput(0), "Miss.");

  loopRuntime.clearLoop();
  assert.strictEqual(loopRuntime.getAssistState().loop, null);
});

test("playable rhythm retention helper updates the daily streak once per day", function() {
  S.streak = 2;
  S.lastSessionDate = "2026-04-08";

  var update = _updatePlayableRhythmHighwayRetention({ xpEarned: 40 });

  assert.strictEqual(update.streak, 3);
  assert.strictEqual(S.streak, 3);
  assert.strictEqual(S.lastSessionDate, "2026-04-09");
  assert.strictEqual(S.xpToast.amount, 40);

  var second = _updatePlayableRhythmHighwayRetention({ xpEarned: 10 });
  assert.strictEqual(second.streak, 3);
  assert.strictEqual(S.streak, 3);
});

test("playable rhythm runtime can launch as an isolated runtime path", function() {
  var now = 0;
  global.performance = {
    now: function() { return now; }
  };
  var payload = new SparkUkuleleRhythmAdapter().createPayload({});

  var started = startPlayableRhythmHighwayPayload(payload, {
    source: "playable_test",
    instrument: "ukulele",
    label: "Playable Isolation"
  });

  assert.strictEqual(started, true);
  assert.strictEqual(S.screen, SCR.RHYTHM_HIGHWAY);
  assert.strictEqual(S.rhythmHighwayLaunchContext.instrument, "ukulele");
  assert.ok(S.rhythmHighwaySnapshot);
  assert.ok(Array.isArray(S.rhythmHighwaySnapshot.notes));

  now = 10;
  S.rhythmHighwayHeldMask = 1 << 3;
  _sparkRhythmHighwayStrum();
  assert.ok(S.rhythmHighwayFeedback === "Perfect" || S.rhythmHighwayFeedback === "Good");
});

test("playable song sessions respect unlocks and persist per-song progress", function() {
  var now = 0;
  global.performance = {
    now: function() { return now; }
  };
  S.level = 2;
  S.xp = 0;
  S.performSongStats = {};
  S.songProgression = null;
  var payload = {
    chartId: "song_chart_01",
    adapterType: "ukulele",
    chart: {
      chartId: "song_chart_01",
      tempo: 80,
      lanes: [
        { lane: 0, label: "G", input: "1" },
        { lane: 1, label: "C", input: "2" }
      ],
      notes: [
        { id: "n1", time: 0, lane: 0, duration: 0, velocity: 1 }
      ]
    }
  };
  var lockedSong = {
    id: "song_002",
    title: "Volcano Run",
    unlockLevel: 3,
    chartId: "song_chart_02",
    requirements: { minAccuracy: 0.8, previous: ["song_001"] }
  };
  var song = {
    id: "song_001",
    title: "Island Groove",
    unlockLevel: 1,
    chartId: "song_chart_01",
    xpReward: 40
  };
  var playlist = [song, lockedSong];

  assert.strictEqual(_isPlayableSongUnlocked(lockedSong, { level: 2 }), false);

  var started = startPlayableSongSession(song, payload, {
    instrument: "ukulele",
    playlist: playlist
  });

  assert.strictEqual(started, true);
  assert.strictEqual(S.rhythmHighwayLaunchContext.song.id, "song_001");
  assert.strictEqual(S.rhythmHighwayLaunchContext.playlist.length, 2);

  now = 30;
  S.rhythmHighwayHeldMask = 1;
  _sparkRhythmHighwayStrum();
  now = 1500;
  _finalizePlayableRhythmHighwayForTest();

  var stats = _getPlayableSongStats("song_001");
  var progression = _getSongProgressionState();
  assert.strictEqual(stats.runs, 1);
  assert.ok(stats.bestAccuracy >= 100 || stats.bestAccuracy >= 80);
  assert.strictEqual(stats.lastPlayed, "2026-04-09");
  assert.ok(progression.completedSongs.song_001);
  assert.ok(progression.unlockedSongs.indexOf("song_001") >= 0);
  assert.ok(progression.unlockedSongs.indexOf("song_002") >= 0);
  assert.ok(progression.level >= 1);
  assert.ok(S.xp > 0);
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

test("rhythm highway can run a ukulele payload and complete back through SparkCore", function() {
  var payload = new SparkUkuleleRhythmAdapter().createPayload({
    segment: {
      id: "uke_island_pattern_01",
      meta: { skill: "strumming_patterns" }
    },
    curriculum: {
      nextLessonId: "uke_04"
    }
  });
  var completed = [];
  var originalCreateClock = SparkTimingEngine.prototype.createClock;
  var requestedInstrument = null;

  SparkTimingEngine.prototype.createClock = function(instrumentType) {
    requestedInstrument = instrumentType;
    return {
      getSongTime: function() { return 0; },
      close: function() {}
    };
  };
  window.sparkCore = {
    completeSession: function(result) {
      completed.push(result);
      return result;
    }
  };

  try {
    var started = startRhythmHighwayPayload(payload, "spark_learning", {
      source: "module_exercise",
      segmentId: "uke_segment_1",
      label: "Island Pattern 01",
      instrument: "ukulele",
      exerciseId: "uke_island_pattern_01",
      exerciseFocus: "strumming_patterns"
    });

    assert.strictEqual(started, true);
    assert.strictEqual(requestedInstrument, "ukulele");
    assert.strictEqual(S.screen, SCR.RHYTHM_HIGHWAY);
    assert.strictEqual(S.rhythmHighwayLaunchContext.instrument, "ukulele");
    assert.strictEqual(S.rhythmHighwayLaunchContext.exerciseFocus, "strumming_patterns");
    assert.deepStrictEqual(_getRhythmHighwayLaneLabels(), ["G", "C", "E", "A"]);

    _finalizeRhythmHighwayForTest();

    assert.strictEqual(completed.length, 1);
    assert.strictEqual(completed[0].flow, SparkSessionTypes.FLOW_DAILY_PRACTICE);
    assert.strictEqual(completed[0].itemId, "uke_segment_1");
    assert.strictEqual(completed[0].gameplayContext.instrument, "ukulele");
    assert.strictEqual(completed[0].gameplayContext.exerciseFocus, "strumming_patterns");
    assert.ok(completed[0].gameplayResult);
    assert.ok(Array.isArray(completed[0].gameplayResult.learning.skills));
  } finally {
    SparkTimingEngine.prototype.createClock = originalCreateClock;
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

test("rhythm highway results render an actionable spark coach card", function() {
  S.rhythmHighwayResult = {
    gameplay: { score: 900, accuracy: 0.58, maxCombo: 4 },
    learning: { weakAreas: ["timing"], skills: [] }
  };
  S.rhythmHighwayLaunchContext = {
    instrument: "ukulele",
    exerciseFocus: "strumming_patterns",
    label: "Island Pattern 01"
  };

  var html = rhythmHighwayPage();
  var coach = _buildRhythmHighwayCoach(S.rhythmHighwayResult);

  assert.strictEqual(coach.focus, "consistency");
  assert.ok(coach.suggestion.indexOf("Slow Mode") >= 0);
  assert.ok(html.indexOf("Spark Coach") >= 0);
  assert.ok(html.indexOf("Suggestion:") >= 0);
});

test("rhythm highway renders juice and song progress for playable songs", function() {
  S.songProgression = {
    unlockedSongs: ["song_001", "song_002"],
    completedSongs: {
      song_001: { bestAccuracy: 0.92, maxCombo: 18, stars: 3 }
    },
    level: 2,
    xp: 140
  };
  S.performSongStats = {
    song_001: {
      bestScore: 1600,
      bestAccuracy: 92,
      bestStars: 0,
      runs: 3,
      maxCombo: 18,
      lastPlayed: "2026-04-09",
      phrases: {}
    }
    };
  S.rhythmHighwayResult = {
      gameplay: { score: 1200, accuracy: 0.82, maxCombo: 12 },
      breakdown: { hits: 18, misses: 4, total: 22 },
      learning: { weakAreas: [], skills: [] }
    };
    S.rhythmHighwayLaunchContext = {
      instrument: "ukulele",
      exerciseFocus: "strumming_patterns",
    label: "Island Groove",
    song: { id: "song_001", title: "Island Groove", unlockLevel: 1 },
      playlist: [
        { id: "song_001", title: "Island Groove", unlockLevel: 1, tier: 1 },
        { id: "song_002", title: "Coral Night", unlockLevel: 1, tier: 2 }
      ]
    };
    S.rhythmHighwayResult.songFlowOutcome = _completePlayableSongFlow(
      S.rhythmHighwayLaunchContext.song,
      {
        score: 1200,
        accuracy: 0.82,
        maxCombo: 12,
        xpEarned: 36,
        breakdown: { hits: 18, misses: 4, total: 22 }
      },
      S.rhythmHighwayLaunchContext.playlist
    );

    var html = rhythmHighwayPage();

    assert.ok(html.indexOf("Great") >= 0);
    assert.ok(html.indexOf("82%") >= 0);
    assert.ok(html.indexOf("Hits") >= 0);
    assert.ok(html.indexOf("Misses") >= 0);
    assert.ok(html.indexOf("Retry") >= 0);
    assert.ok(html.indexOf("act('songFlowContinue')") >= 0);
    assert.ok(html.indexOf("Song Progress") >= 0);
    assert.ok(html.indexOf("Progress") >= 0);
    assert.ok(html.indexOf("Ukulele Path") >= 0);
    assert.ok(html.indexOf("Next Practice") >= 0);
    assert.ok(html.indexOf("Drill:") >= 0);
    assert.ok(html.indexOf(">Continue<") >= 0);
    assert.ok(html.indexOf("Songs") >= 0);
  assert.ok(html.indexOf("Search songs") >= 0);
  assert.ok(html.indexOf("Coral Night") >= 0);
  assert.ok(html.indexOf("Island Groove") >= 0);
  assert.ok(html.indexOf("&#9733;") >= 0);
  assert.ok(html.indexOf("NEXT") >= 0);
  assert.ok(html.indexOf("onclick=\"act('progressionMapSong','song_002')\"") >= 0);
});

test("song progression selector returns next unlockable song or weakest completed song", function() {
  var playlist = [
    { id: "song_001", title: "Island Groove", requirements: { previous: [] } },
    { id: "song_002", title: "Coral Night", requirements: { minAccuracy: 0.8, previous: ["song_001"] } },
    { id: "song_003", title: "Lagoon Echo", requirements: { minAccuracy: 0.99, previous: ["song_002"] } }
  ];
  var progression = {
    unlockedSongs: ["song_001"],
    completedSongs: {
      song_001: { bestAccuracy: 0.84, maxCombo: 12, stars: 2 }
    },
    level: 1,
    xp: 90
  };

  var next = _selectNextSongFromProgression(playlist, progression);
  assert.strictEqual(next.id, "song_002");

  progression._songTree = playlist.slice();
  progression.unlockedSongs.push("song_002");
  progression.completedSongs.song_002 = { bestAccuracy: 0.95, maxCombo: 20, stars: 3 };
  var fallback = _selectNextSongFromProgression(playlist, progression);
  assert.strictEqual(fallback.id, "song_001");

  var ui = _buildPlayableSongUiModel(playlist[1], progression);
  assert.strictEqual(ui.recommended, false);

  progression.completedSongs.song_001 = { bestAccuracy: 0.93, maxCombo: 18, stars: 3 };
  progression.completedSongs.song_002 = { bestAccuracy: 0.76, maxCombo: 14, stars: 2 };
  progression._songTree = playlist.slice();
  var reinforce = _selectNextSongFromProgression(playlist, progression);
  assert.strictEqual(reinforce.id, "song_002");

  var recommendedUi = _buildPlayableSongUiModel(playlist[1], progression);
  assert.strictEqual(recommendedUi.recommended, true);
});

test("progression map groups songs by tier and can launch unlocked songs", function() {
  var payload = {
    chartId: "song_chart_map_01",
    adapterType: "ukulele",
    chart: {
      chartId: "song_chart_map_01",
      tempo: 80,
      lanes: [
        { lane: 0, label: "G", input: "1" }
      ],
      notes: [
        { id: "n1", time: 0, lane: 0, duration: 0, velocity: 1 }
      ]
    }
  };
  var playlist = [
    { id: "song_001", title: "Island Groove", tier: 1, unlockLevel: 1, payload: payload },
    { id: "song_002", title: "Coral Night", tier: 2, unlockLevel: 1, payload: payload },
    { id: "song_003", title: "Lagoon Echo", tier: 2, unlockLevel: 4 }
  ];
  var progression = {
    unlockedSongs: ["song_001", "song_002"],
    completedSongs: {
      song_001: { bestAccuracy: 0.91, maxCombo: 16, stars: 3 }
    },
    level: 2,
    xp: 120
  };

  var rows = _buildProgressionMapLayout(playlist, progression);
  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows[0].nodes.map(function(node) { return node.id; }), ["song_001"]);
  assert.deepStrictEqual(rows[1].nodes.map(function(node) { return node.id; }), ["song_002", "song_003"]);

  var html = _renderProgressionMap(playlist, progression);
  assert.ok(html.indexOf("Progress") >= 0);
  assert.ok(html.indexOf("Continue") >= 0);
  assert.ok(html.indexOf("LOCKED") >= 0);
  assert.ok(html.indexOf("NEXT") >= 0);
  assert.ok(html.indexOf("Level 2") >= 0);
  assert.ok(html.indexOf("120 XP") >= 0);

  S.songProgression = progression;
  S.rhythmHighwayLaunchContext = {
    instrument: "ukulele",
    song: playlist[0],
    playlist: playlist
  };
  var started = _openProgressionMapSong("song_002");
  assert.strictEqual(started, true);
  assert.strictEqual(S.rhythmHighwayLaunchContext.song.id, "song_002");
});

test("master song flow orchestrator returns a single completion outcome", function() {
  S.level = 2;
  S.xp = 0;
  S.performSongStats = {};
  S.songProgression = {
    unlockedSongs: ["song_001"],
    completedSongs: {},
    level: 2,
    xp: 0
  };
  var playlist = [
    { id: "song_001", title: "Island Groove", tier: 1, unlockLevel: 1 },
    { id: "song_002", title: "Coral Night", tier: 2, unlockLevel: 1, requirements: { minAccuracy: 0.75, previous: ["song_001"] } }
  ];
  var outcome = _completePlayableSongFlow(playlist[0], {
    score: 1400,
    accuracy: 0.82,
    maxCombo: 14,
    xpEarned: 48,
    breakdown: { hits: 18, misses: 4, total: 22 }
  }, playlist);

  assert.strictEqual(outcome.song.id, "song_001");
  assert.strictEqual(outcome.nextSong.id, "song_002");
  assert.strictEqual(outcome.resultsScreen.label, "Great");
  assert.strictEqual(outcome.resultsScreen.stars, 2);
  assert.strictEqual(outcome.resultsScreen.primaryAction.action, "songFlowContinue");
  assert.strictEqual(outcome.resultsScreen.primaryAction.songId, "song_002");
  assert.strictEqual(outcome.resultsScreen.secondaryAction.action, "restartRhythmHighway");
  assert.ok(outcome.progression.unlockedSongs.indexOf("song_002") >= 0);
  assert.ok(outcome.practiceRecommendation);
  assert.strictEqual(typeof outcome.practiceRecommendation.drill, "string");
  assert.strictEqual(S.lastPracticeRecommendation.mode, outcome.practiceRecommendation.mode);
  assert.ok(global.__saveStateCalls > 0);
});

test("recommended song launcher starts the adaptive next song", function() {
  S.level = 2;
  S.xp = 120;
  S.songProgression = {
    unlockedSongs: ["song_001", "song_002"],
    completedSongs: {
      song_001: { bestAccuracy: 0.94, maxCombo: 18, stars: 3 }
    },
    level: 2,
    xp: 120
  };
  var playlist = [
    {
      id: "song_001",
      title: "Island Groove",
      tier: 1,
      unlockLevel: 1,
      payload: buildPlayablePayloadFromImportedMidi({
        sourceName: "song1.mid",
        tempoMap: [{ bpm: 120 }],
        tracks: [{ id: "t1", notes: [{ note: "C4", pitch: 60, startSec: 0, durSec: 0.2, velocity: 1 }] }]
      }, { adapterType: "ukulele" })
    },
    {
      id: "song_002",
      title: "Coral Night",
      tier: 2,
      unlockLevel: 1,
      requirements: { minAccuracy: 0.75, previous: ["song_001"] },
      payload: buildPlayablePayloadFromImportedMidi({
        sourceName: "song2.mid",
        tempoMap: [{ bpm: 120 }],
        tracks: [{ id: "t1", notes: [{ note: "E4", pitch: 64, startSec: 0, durSec: 0.2, velocity: 1 }] }]
      }, { adapterType: "ukulele" })
    }
  ];

  var started = _startRecommendedPlayableSongFlow(playlist, S.songProgression, {
    instrument: "ukulele"
  });

  assert.strictEqual(started, true);
  assert.strictEqual(S.rhythmHighwayLaunchContext.song.id, "song_002");
  assert.strictEqual(S.rhythmHighwayLaunchContext.source, "recommended_launch");
});

test("song library browser supports recommended ordering, filters, and search", function() {
  var playlist = [
    { id: "song_001", title: "Island Groove", tier: 1, unlockLevel: 1, difficulty: "easy" },
    { id: "song_002", title: "Coral Night", tier: 2, unlockLevel: 1, difficulty: "medium" },
    { id: "song_003", title: "Lagoon Echo", tier: 3, unlockLevel: 4, difficulty: "hard" }
  ];
  var progression = {
    unlockedSongs: ["song_001", "song_002"],
    completedSongs: {
      song_001: { bestAccuracy: 0.91, maxCombo: 16, stars: 3 }
    },
    level: 2,
    xp: 120
  };

  var items = _buildSongLibraryItems(playlist, progression);
  assert.strictEqual(items[0].id, "song_002");
  assert.strictEqual(items[0].recommended, true);
  assert.strictEqual(items[2].locked, true);

  var completedOnly = _filterSongLibraryItems(items, { query: "", filter: "completed" });
  assert.deepStrictEqual(completedOnly.map(function(item) { return item.id; }), ["song_001"]);

  var hardOnly = _filterSongLibraryItems(items, { query: "", filter: "hard" });
  assert.deepStrictEqual(hardOnly.map(function(item) { return item.id; }), ["song_003"]);

  var searchOnly = _filterSongLibraryItems(items, { query: "coral", filter: "all" });
  assert.deepStrictEqual(searchOnly.map(function(item) { return item.id; }), ["song_002"]);

  S.songLibraryBrowser = { query: "lag", filter: "all" };
  var html = _renderSongLibraryBrowser(playlist, progression);
  assert.ok(html.indexOf("Songs") >= 0);
  assert.ok(html.indexOf("Search songs") >= 0);
  assert.ok(html.indexOf("Lagoon Echo") >= 0);
  assert.ok(html.indexOf("Recommended") < 0);

  S.songLibraryBrowser = { query: "", filter: "all" };
  var resetHtml = _renderSongLibraryBrowser(playlist, progression);
  assert.ok(resetHtml.indexOf("Recommended") >= 0);
  assert.ok(resetHtml.indexOf("&#128274;") >= 0);
});

test("midi import can build a normalized playable highway chart", function() {
  var chart = buildPlayableChartFromImportedMidi({
    sourceName: "lesson.mid",
    tempoMap: [{ bpm: 120 }],
    tracks: [
      {
        id: "t1",
        notes: [
          { note: "C4", pitch: 60, startSec: 0.02, durSec: 0.24, velocity: 0.9 },
          { note: "E4", pitch: 64, startSec: 0.51, durSec: 0.22, velocity: 0.8 }
        ]
      }
    ]
  }, {
    laneCount: 4,
    laneLabels: ["G", "C", "E", "A"]
  });

  assert.strictEqual(chart.tempo, 120);
  assert.deepStrictEqual(chart.lanes.map(function(lane) { return lane.label; }), ["G", "C", "E", "A"]);
  assert.strictEqual(chart.notes.length, 2);
  assert.strictEqual(chart.notes[0].time, 0);
  assert.strictEqual(chart.notes[1].time, 500);
  assert.strictEqual(chart.notes[0].lane, 0);
});

test("midi import groups near-simultaneous notes into chord-labeled playable events", function() {
  var chart = buildPlayableChartFromImportedMidi({
    sourceName: "uke_chords.mid",
    tempoMap: [{ bpm: 120 }],
    tracks: [
      {
        id: "t1",
        notes: [
          { note: "C4", pitch: 60, startSec: 0.01, durSec: 0.28, velocity: 0.9 },
          { note: "E4", pitch: 64, startSec: 0.03, durSec: 0.26, velocity: 0.8 },
          { note: "G4", pitch: 67, startSec: 0.04, durSec: 0.25, velocity: 0.85 },
          { note: "A3", pitch: 57, startSec: 0.52, durSec: 0.22, velocity: 0.75 },
          { note: "C4", pitch: 60, startSec: 0.54, durSec: 0.22, velocity: 0.7 },
          { note: "E4", pitch: 64, startSec: 0.55, durSec: 0.21, velocity: 0.72 }
        ]
      }
    ]
  }, {
    adapterType: "ukulele"
  });

  assert.deepStrictEqual(chart.lanes.map(function(lane) { return lane.label; }), ["G", "C", "E", "A"]);
  assert.strictEqual(chart.notes.length, 2);
  assert.strictEqual(chart.notes[0].label, "C");
  assert.strictEqual(chart.notes[0].primaryLane, 0);
  assert.strictEqual(chart.notes[0].laneMask, 15);
  assert.strictEqual(chart.notes[1].label, "Am");
  assert.strictEqual(chart.notes[1].laneMask, 7);
});

test("midi import detects sevenths and slash chords with interval-based matching", function() {
  var chart = buildPlayableChartFromImportedMidi({
    sourceName: "advanced_chords.mid",
    tempoMap: [{ bpm: 100 }],
    tracks: [
      {
        id: "t1",
        notes: [
          { note: "E3", pitch: 52, startSec: 0.0, durSec: 0.3, velocity: 0.9 },
          { note: "G3", pitch: 55, startSec: 0.01, durSec: 0.3, velocity: 0.85 },
          { note: "C4", pitch: 60, startSec: 0.02, durSec: 0.3, velocity: 0.8 },
          { note: "B4", pitch: 71, startSec: 0.03, durSec: 0.3, velocity: 0.75 },
          { note: "A3", pitch: 57, startSec: 0.7, durSec: 0.25, velocity: 0.8 },
          { note: "C4", pitch: 60, startSec: 0.71, durSec: 0.25, velocity: 0.76 },
          { note: "E4", pitch: 64, startSec: 0.72, durSec: 0.25, velocity: 0.78 },
          { note: "G4", pitch: 67, startSec: 0.73, durSec: 0.25, velocity: 0.82 }
        ]
      }
    ]
  }, {
    adapterType: "ukulele"
  });

  assert.strictEqual(chart.notes.length, 2);
  assert.strictEqual(chart.notes[0].label, "Cmaj7/E");
  assert.strictEqual(chart.notes[1].label, "Am7");
});

test("playable runtime can follow an audio clock with an offset", function() {
  var chart = {
    chartId: "audio_sync_test",
    tempo: 100,
    lanes: [
      { lane: 0, label: "G", input: "1" }
    ],
    notes: [
      { id: "n1", time: 470, lane: 0, duration: 0, velocity: 1 }
    ]
  };
  var fakeAudio = {
    currentTime: 0.5,
    paused: true,
    ended: false,
    playCalls: 0,
    pauseCalls: 0,
    play: function() { this.paused = false; this.playCalls++; },
    pause: function() { this.paused = true; this.pauseCalls++; }
  };
  var runtime = _createPlayableRhythmRuntime(chart, {
    audioSource: fakeAudio,
    audioOffsetMs: 30,
    inputOffsetMs: 0
  });

  assert.ok(runtime);
  assert.strictEqual(fakeAudio.playCalls, 1);
  assert.strictEqual(runtime.getAssistState().useAudioClock, true);
  assert.strictEqual(runtime.getAssistState().audioOffsetMs, 30);
  fakeAudio.currentTime = 0.48;
  assert.ok(Math.abs(runtime.getSnapshot().songTimeSec - 0.45) < 0.001);

  runtime.setAudioOffset(50);
  assert.strictEqual(runtime.getAssistState().audioOffsetMs, 50);
  fakeAudio.currentTime = 0.48;
  assert.ok(Math.abs(runtime.getSnapshot().songTimeSec - 0.43) < 0.001);

  runtime.stop();
  assert.strictEqual(fakeAudio.pauseCalls, 1);
});

test("playable song sessions can create backing audio from song metadata and retune offset", function() {
  var audioCreated = 0;
  var fakeAudio = {
    currentTime: 0,
    paused: true,
    ended: false,
    play: function() { this.paused = false; },
    pause: function() { this.paused = true; }
  };
  global.createPlayableBackingAudioSource = function(spec) {
    audioCreated++;
    assert.strictEqual(spec.uri, "https://example.com/demo.mp3");
    assert.strictEqual(spec.offsetMs, 25);
    return fakeAudio;
  };
  var payload = {
    chartId: "audio_song_chart",
    adapterType: "ukulele",
    chart: {
      chartId: "audio_song_chart",
      tempo: 90,
      lanes: [
        { lane: 0, label: "G", input: "1" }
      ],
      notes: [
        { id: "n1", time: 0, lane: 0, duration: 0, velocity: 1 }
      ],
      metadata: {
        audioURI: "https://example.com/demo.mp3",
        audioOffsetMs: 25
      }
    }
  };
  var song = {
    id: "song_audio_001",
    title: "Audio Song",
    unlockLevel: 1,
    audio: {
      uri: "https://example.com/demo.mp3",
      offsetMs: 25
    }
  };

  var started = startPlayableSongSession(song, payload, {
    instrument: "ukulele",
    playlist: [song]
  });

  assert.strictEqual(started, true);
  assert.strictEqual(audioCreated, 1);
  assert.strictEqual(S.rhythmHighwayPracticeAssist.useAudioClock, true);
  assert.strictEqual(S.rhythmHighwayPracticeAssist.audioOffsetMs, 25);

  _adjustPlayableRhythmHighwayAudioOffset(10);
  assert.strictEqual(S.rhythmHighwayPracticeAssist.audioOffsetMs, 35);
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
    var notes = getDefaultTrack(payload.songChart).notes;
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
  assert.strictEqual(first.accuracy, first.gameplay.accuracy);
  assert.strictEqual(first.timing, first.gameplay.timing);
  assert.strictEqual(first.mistakes, first.gameplay.mistakes);
  assert.ok(typeof first.gameplay.timing === "number");
  assert.ok(typeof first.gameplay.mistakes === "number");
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
