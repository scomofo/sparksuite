// tests/test_performance_core.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

global.window = global;
global.performance = { now: function() { return Date.now(); } };
global.SparkEvents = { emit: function() {}, clear: function() {}, getPending: function() { return []; }, on: function() {}, off: function() {} };
global.S = {
  performWindowPerfectMs: 70,
  performWindowGoodMs: 140,
  performWindowMissMs: 220,
  performanceStats: {},
  performanceUnlocks: {},
  earnedBadges: [],
  performanceBadges: [],
  performanceDailyHistory: [],
  xp: 0,
  performMode: 'midi',
  performDifficulty: 'normal',
  performSpeed: 1,
  performPracticePreset: 'full_mix'
};
global.SCR = { PERFORM: 'perform', PERFORM_DONE: 'performDone', HOME: 'home' };
global.BADGES = [
  { id: 'perf_first', label: 'First Performance', icon: 'A' },
  { id: 'perf_3star', label: 'Rising Star', icon: 'B' },
  { id: 'perf_daily', label: 'Daily Performer', icon: 'C' }
];
global.saveState = function() {};

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

eval(loadJS('js/performance-core/chart-contract.js'));
eval(loadJS('js/performance-core/transport-contract.js'));
eval(loadJS('js/performance-core/performance-events.js'));
eval(loadJS('js/sparksuite/domain/tempo_map.js'));
eval(loadJS('js/sparksuite/domain/note_event.js'));
eval(loadJS('js/sparksuite/domain/phrase.js'));
eval(loadJS('js/sparksuite/domain/chart.js'));
eval(loadJS('js/sparksuite/core/chart_io.js'));
eval(loadJS('js/sparksuite/bridges/performance_bridge.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_skill_tree.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_lessons.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_chords.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_scales.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_tuning.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_exercises.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_progression.js'));
eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_module.js'));
eval(loadJS('js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js'));
eval(loadJS('js/performance/chart_manifest.js'));
eval(loadJS('js/performance/chart.js'));
eval(loadJS('js/performance/arrangements.js'));
eval(loadJS('js/performance/scoring.js'));
eval(loadJS('js/performance/highway.js'));
eval(loadJS('js/performance/progression.js'));
eval(loadJS('js/performance/badges.js'));
eval(loadJS('js/performance/recommendations.js'));
eval(loadJS('js/sparksuite/ui/note_mapper.js'));

console.log('\n--- PerformanceCore: Chart Contract ---');

test('normalizeChartEvents adds missing _scored flags', function() {
  var events = [{ t: 0, dur: 1, type: 'chord', notes: ['E','G','B'], laneLabel: 'Em' }];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0]._scored, false);
  assert.strictEqual(result[0]._hit, false);
});

test('normalizeChartEvents sorts by time', function() {
  var events = [
    { t: 2, dur: 1, type: 'chord', notes: ['G'], laneLabel: 'G' },
    { t: 0, dur: 1, type: 'chord', notes: ['E'], laneLabel: 'E' }
  ];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0].t, 0);
  assert.strictEqual(result[1].t, 2);
});

test('validateEvent rejects missing notes', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord' });
  assert.strictEqual(result.valid, false);
});

test('validateEvent accepts valid chord event', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord', notes: ['C','E','G'], laneLabel: 'C' });
  assert.strictEqual(result.valid, true);
});

console.log('\n--- PerformanceCore: Transport Contract ---');

test('wall-clock mode returns elapsed time', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'wall-clock');
  PerfTransportContract.start(state, 0);
  // Immediately after start, now() should be near 0
  var t = PerfTransportContract.now(state);
  assert.ok(t >= 0 && t < 0.5, 'should be near 0, got ' + t);
});

test('audio-clock mode returns audioEl currentTime', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'audio-clock');
  var fakeAudio = { currentTime: 5.5, paused: false, ended: false };
  PerfTransportContract.setAudioSource(state, fakeAudio);
  PerfTransportContract.start(state, 0);
  assert.strictEqual(PerfTransportContract.now(state), 5.5);
});

test('mode defaults to wall-clock', function() {
  var state = PerfTransportContract.createState();
  assert.strictEqual(state.mode, 'wall-clock');
});

console.log('\n--- PerformanceCore: Performance Events ---');

test('emitPerformanceEvent calls SparkEvents.emit', function() {
  var captured = [];
  var orig = SparkEvents.emit;
  SparkEvents.emit = function(type, payload) { captured.push({ type: type, payload: payload }); };
  PerfEvents.emit('performance_started', { chartId: 'test' });
  SparkEvents.emit = orig;
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].type, 'performance_started');
});

console.log('\n--- PerformanceCore: Imported Chart Bridge ---');

test('convertSparkSongChartToPerformanceChart adapts imported spark charts for performance mode', function() {
  var chartIO = new SparkChartIO();
  var sparkChart = chartIO.fromPackage({
    files: {
      'notes.mid': {
        bytes: [
          77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96,
          77, 84, 114, 107, 0, 0, 0, 22,
          0, 255, 3, 4, 76, 101, 97, 100,
          0, 144, 60, 100,
          96, 128, 60, 64,
          0, 255, 47, 0
        ]
      },
      'song.ini': '[song]\nname = Imported Bridge Song\nartist = Bridge Artist'
    }
  }, new SparkGuitarRhythmAdapter());

  var performanceChart = convertSparkSongChartToPerformanceChart(sparkChart, {
    arrangementType: 'imported_chart'
  });

  assert.strictEqual(performanceChart.title, 'Imported Bridge Song');
  assert.strictEqual(performanceChart.artist, 'Bridge Artist');
  assert.strictEqual(performanceChart.arrangementType, 'imported_chart');
  assert.strictEqual(performanceChart.events.length, 1);
  assert.deepStrictEqual(performanceChart.events[0].notes, ['C']);
  assert.strictEqual(performanceChart.events[0]._scored, false);
});

test('normalizePerformanceChartDefinition imports package-backed performance charts', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'demo_import',
    title: 'Imported Package Demo',
    packageFormat: 'sparksuite_import_v1',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 120000',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 0 0',
          '  192 = N 1 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Imported Package Demo\nartist = Performance Loader'
      }
    }
  });

  assert.strictEqual(performanceChart.id, 'demo_import');
  assert.strictEqual(performanceChart.title, 'Imported Package Demo');
  assert.strictEqual(performanceChart.artist, 'Performance Loader');
  assert.strictEqual(performanceChart.events.length, 2);
  assert.strictEqual(performanceChart.events[0]._scored, false);
});

test('normalizePerformanceChart derives lane from laneMask and preserves open notes', function() {
  var chart = normalizePerformanceChart({
    id: 'lane_chart',
    title: 'Lane Chart',
    bpm: 120,
    phrases: [{ id: 0, name: 'Full Song', startSec: 0, endSec: 2 }],
    events: [
      { id: 'masked', t: 0, dur: 0.2, type: 'note', laneMask: 8, laneLabel: 'B', notes: ['B'] },
      { id: 'open', t: 1, dur: 0.2, type: 'open', laneMask: 0, laneLabel: 'Open', notes: [] }
    ]
  });

  assert.strictEqual(chart.events[0].lane, 3);
  assert.strictEqual(chart.events[1].lane, null);
});

test('normalizePerformanceChart assigns lanes for legacy direct chart events with only lane labels', function() {
  var chart = normalizePerformanceChart({
    id: 'legacy_direct_chart',
    title: 'Legacy Direct Chart',
    bpm: 120,
    phrases: [{ id: 0, name: 'Full Song', startSec: 0, endSec: 8 }],
    events: [
      { id: 1, t: 0, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', notes: ['E', 'G', 'B'] },
      { id: 2, t: 2, dur: 2, type: 'chord', chord: 'G', laneLabel: 'G', notes: ['G', 'B', 'D'] },
      { id: 3, t: 4, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', notes: ['E', 'G', 'B'] }
    ]
  });

  assert.strictEqual(chart.events[0].lane, 0);
  assert.strictEqual(chart.events[0].laneMask, 1);
  assert.strictEqual(chart.events[1].lane, 1);
  assert.strictEqual(chart.events[1].laneMask, 2);
  assert.strictEqual(chart.events[2].lane, 0);
  assert.strictEqual(chart.events[2].laneMask, 1);
});

test('normalizePerformanceChart repairs charts whose non-open events were pre-collapsed to lane 0', function() {
  var chart = normalizePerformanceChart({
    id: 'collapsed_direct_chart',
    title: 'Collapsed Direct Chart',
    bpm: 120,
    phrases: [{ id: 0, name: 'Full Song', startSec: 0, endSec: 8 }],
    events: [
      { id: 1, t: 0, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', lane: 0, laneMask: 1, notes: ['E', 'G', 'B'] },
      { id: 2, t: 2, dur: 2, type: 'chord', chord: 'G', laneLabel: 'G', lane: 0, laneMask: 1, notes: ['G', 'B', 'D'] },
      { id: 3, t: 4, dur: 2, type: 'chord', chord: 'D', laneLabel: 'D', lane: 0, laneMask: 1, notes: ['D', 'F#', 'A'] }
    ]
  });

  assert.strictEqual(chart.events[0].lane, 0);
  assert.strictEqual(chart.events[0].laneMask, 1);
  assert.strictEqual(chart.events[1].lane, 1);
  assert.strictEqual(chart.events[1].laneMask, 2);
  assert.strictEqual(chart.events[2].lane, 2);
  assert.strictEqual(chart.events[2].laneMask, 4);
});

test('ensurePerformanceHighwayLaneData repairs missing lane metadata before rendering', function() {
  var chart = {
    metadata: { laneCount: 5 },
    events: [
      { id: 1, t: 0, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', notes: ['E', 'G', 'B'] },
      { id: 2, t: 2, dur: 2, type: 'chord', chord: 'G', laneLabel: 'G', notes: ['G', 'B', 'D'] },
      { id: 3, t: 4, dur: 2, type: 'open', laneLabel: 'Open', notes: [] }
    ]
  };

  ensurePerformanceHighwayLaneData(chart);

  assert.strictEqual(chart.events[0].lane, 0);
  assert.strictEqual(chart.events[0].laneMask, 1);
  assert.strictEqual(chart.events[1].lane, 1);
  assert.strictEqual(chart.events[1].laneMask, 2);
  assert.strictEqual(chart.events[2].lane, null);
  assert.strictEqual(chart.events[2].laneMask, 0);
});

test('ensurePerformanceHighwayLaneData repairs renderer-bound charts whose lanes collapsed to zero', function() {
  var chart = {
    metadata: { laneCount: 5 },
    events: [
      { id: 1, t: 0, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', lane: 0, laneMask: 1, notes: ['E', 'G', 'B'] },
      { id: 2, t: 2, dur: 2, type: 'chord', chord: 'G', laneLabel: 'G', lane: 0, laneMask: 1, notes: ['G', 'B', 'D'] },
      { id: 3, t: 4, dur: 2, type: 'chord', chord: 'D', laneLabel: 'D', lane: 0, laneMask: 1, notes: ['D', 'F#', 'A'] }
    ]
  };

  ensurePerformanceHighwayLaneData(chart);

  assert.strictEqual(chart.events[0].lane, 0);
  assert.strictEqual(chart.events[0].laneMask, 1);
  assert.strictEqual(chart.events[1].lane, 1);
  assert.strictEqual(chart.events[1].laneMask, 2);
  assert.strictEqual(chart.events[2].lane, 2);
  assert.strictEqual(chart.events[2].laneMask, 4);
});

test('repairPerformanceHighwayEventLanes can fix direct SparkHighway setChart event arrays', function() {
  var events = [
    { id: 1, t: 0, dur: 2, type: 'chord', chord: 'Em', laneLabel: 'Em', lane: 0, laneMask: 1, notes: ['E', 'G', 'B'] },
    { id: 2, t: 2, dur: 2, type: 'chord', chord: 'G', laneLabel: 'G', lane: 0, laneMask: 1, notes: ['G', 'B', 'D'] },
    { id: 3, t: 4, dur: 2, type: 'chord', chord: 'D', laneLabel: 'D', lane: 0, laneMask: 1, notes: ['D', 'F#', 'A'] }
  ];

  repairPerformanceHighwayEventLanes(events, 5);

  assert.strictEqual(events[0].lane, 0);
  assert.strictEqual(events[0].laneMask, 1);
  assert.strictEqual(events[1].lane, 1);
  assert.strictEqual(events[1].laneMask, 2);
  assert.strictEqual(events[2].lane, 2);
  assert.strictEqual(events[2].laneMask, 4);
});

test('buildRhythmChordArrangement stamps lane metadata onto generated events', function() {
  var arrangement = buildRhythmChordArrangement({
    id: 'arr_song',
    bpm: 120,
    progression: ['C', 'Am'],
    pattern: ['D', 'U']
  });

  assert.ok(arrangement.events.length > 0);
  assert.strictEqual(typeof arrangement.events[0].lane, 'number');
  assert.strictEqual(typeof arrangement.events[0].laneMask, 'number');
  assert.notStrictEqual(arrangement.events[0].laneMask, 0);
});

test('getPerformanceChartLibrary includes package-backed entries for the perform browser', function() {
  var library = getPerformanceChartLibrary();
  assert.ok(Array.isArray(library));
  assert.ok(library.length >= 3);
  assert.strictEqual(getPerformanceChartMeta('demo_imported_package').sourceType, 'imported_package');
  assert.strictEqual(getPerformanceChartMeta('demo_progression').sourceType, 'built_in');
});

test('getPerformanceChartLibrary can filter the manifest by instrument', function() {
  var library = getPerformanceChartLibrary({ instrument: 'ukulele' });
  assert.strictEqual(library.length, 3);
  assert.strictEqual(library[0].instrument, 'ukulele');
  assert.strictEqual(library[1].instrument, 'ukulele');
  assert.strictEqual(library[2].instrument, 'ukulele');
});

test('getPerformanceChartLibrary can filter the manifest by bass instrument', function() {
  var library = getPerformanceChartLibrary({ instrument: 'bass' });
  assert.strictEqual(library.length, 4);
  assert.strictEqual(library[0].instrument, 'bass');
  assert.strictEqual(library[0].id, 'bass_midnight_lock_package');
  assert.strictEqual(library[1].id, 'bass_afterglow_walk_package');
});

test('normalizePerformanceChartDefinition supports ukulele package charts through manifest adapter metadata', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'ukulele_island_package',
    title: 'Island Loop',
    artist: 'SparkSuite Ukulele',
    packageFormat: 'sparksuite_import_v1',
    adapterType: 'ukulele',
    instrument: 'ukulele',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 76923',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 3 0',
          '  192 = N 0 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Island Loop\nartist = SparkSuite Ukulele'
      }
    }
  });

  assert.strictEqual(performanceChart.title, 'Island Loop');
  assert.strictEqual(performanceChart.events.length, 2);
  assert.strictEqual(performanceChart.arrangementType, 'imported_chart');
});

test('normalizePerformanceChartDefinition supports the second ukulele package chart', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'ukulele_switch_flow_package',
    title: 'Sunset Switches',
    artist: 'SparkSuite Ukulele',
    packageFormat: 'sparksuite_import_v1',
    adapterType: 'ukulele',
    instrument: 'ukulele',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 81081',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 3 0',
          '  192 = N 0 0',
          '  384 = N 2 0',
          '  576 = N 1 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Sunset Switches\nartist = SparkSuite Ukulele'
      }
    }
  });

  assert.strictEqual(performanceChart.title, 'Sunset Switches');
  assert.strictEqual(performanceChart.events.length, 4);
});

test('normalizePerformanceChartDefinition supports the third ukulele picking package chart', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'ukulele_moonlit_picking_package',
    title: 'Moonlit Picking',
    artist: 'SparkSuite Ukulele',
    packageFormat: 'sparksuite_import_v1',
    adapterType: 'ukulele',
    instrument: 'ukulele',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 83333',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 3 0',
          '  96 = N 2 0',
          '  192 = N 1 0',
          '  288 = N 0 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Moonlit Picking\nartist = SparkSuite Ukulele'
      }
    }
  });

  assert.strictEqual(performanceChart.title, 'Moonlit Picking');
  assert.strictEqual(performanceChart.events.length, 4);
});

test('normalizePerformanceChartDefinition supports bass package charts through manifest adapter metadata', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'bass_midnight_lock_package',
    title: 'Midnight Lock',
    artist: 'SparkSuite Bass',
    packageFormat: 'sparksuite_import_v1',
    arrangementType: 'bass_groove',
    adapterType: 'bass',
    instrument: 'bass',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 80000',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 0 0',
          '  192 = N 1 0',
          '  384 = N 0 0',
          '  576 = N 2 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Midnight Lock\nartist = SparkSuite Bass'
      }
    },
    importOptions: {
      trackName: 'ExpertSingle'
    }
  });

  assert.strictEqual(performanceChart.id, 'bass_midnight_lock_package');
  assert.strictEqual(performanceChart.title, 'Midnight Lock');
  assert.strictEqual(performanceChart.events.length, 4);
});

test('normalizePerformanceChartDefinition supports the second bass walking package chart', function() {
  var performanceChart = normalizePerformanceChartDefinition({
    id: 'bass_afterglow_walk_package',
    title: 'Afterglow Walk',
    artist: 'SparkSuite Bass',
    packageFormat: 'sparksuite_import_v1',
    arrangementType: 'bass_walk',
    adapterType: 'bass',
    instrument: 'bass',
    chartImport: {
      files: {
        'notes.chart': [
          '[Song]',
          '{',
          '  Resolution = 192',
          '}',
          '[SyncTrack]',
          '{',
          '  0 = B 84507',
          '}',
          '[ExpertSingle]',
          '{',
          '  0 = N 1 0',
          '  96 = N 2 0',
          '  192 = N 3 0',
          '  288 = N 2 0',
          '}'
        ].join('\n'),
        'song.ini': '[song]\nname = Afterglow Walk\nartist = SparkSuite Bass'
      }
    },
    importOptions: {
      trackName: 'ExpertSingle'
    }
  });

  assert.strictEqual(performanceChart.id, 'bass_afterglow_walk_package');
  assert.strictEqual(performanceChart.title, 'Afterglow Walk');
  assert.strictEqual(performanceChart.events.length, 4);
});

test('getPerformancePhraseIndicesForTechnique finds only phrases containing the focused imported technique', function() {
  var chart = normalizePerformanceChart({
    id: 'focus_test',
    title: 'Focus Test',
    bpm: 100,
    phrases: [
      { id: 0, name: 'Intro', startSec: 0, endSec: 2 },
      { id: 1, name: 'Verse', startSec: 2, endSec: 4 },
      { id: 2, name: 'Chorus', startSec: 4, endSec: 6 }
    ],
    events: [
      { id: 'a', t: 0.5, dur: 0.2, type: 'tap', laneLabel: 'Tap', notes: ['C'], sourceFlags: { tap: true } },
      { id: 'b', t: 2.5, dur: 0.2, type: 'open', laneLabel: 'Open', notes: [], sourceFlags: { open: true } },
      { id: 'c', t: 4.5, dur: 0.2, type: 'tap', laneLabel: 'Tap', notes: ['D'], sourceFlags: { tap: true } }
    ]
  });

  assert.deepStrictEqual(getPerformancePhraseIndicesForTechnique(chart, 'tap'), [0, 2]);
  assert.deepStrictEqual(getPerformancePhraseIndicesForTechnique(chart, 'open'), [1]);
  assert.deepStrictEqual(getPerformancePhraseIndicesForTechnique(chart, 'forced'), []);
});

test('buildPerformanceFeedbackLabel adds focused imported technique labels for matching events', function() {
  assert.strictEqual(
    buildPerformanceFeedbackLabel({ sourceFlags: { tap: true } }, { grade: 'perfect' }, 'tap'),
    'PERFECT TAP!'
  );
  assert.strictEqual(
    buildPerformanceFeedbackLabel({ sourceFlags: { open: true } }, { grade: 'miss' }, 'tap'),
    'MISS!'
  );
  assert.strictEqual(
    buildPerformanceFeedbackLabel({ sourceFlags: { forced: true } }, { grade: 'good' }, 'forced'),
    'GOOD FORCED!'
  );
});

test('convertSparkSongChartToPerformanceChart preserves imported technique flags and lane metadata', function() {
  var performanceChart = convertSparkSongChartToPerformanceChart({
    song: { id: 'flag_chart', title: 'Flag Chart', artist: 'Tester', offsetSec: 0, durationSec: 2 },
    tempoMap: new SparkTempoMap({ ppq: 96, bpm: 120 }),
    tracks: {
      guitar: {
        notes: [
          new SparkNoteEvent({ id: 'open_evt', tick: 0, tickLength: 96, laneMask: 0, flags: { open: true }, label: '' }),
          new SparkNoteEvent({ id: 'tap_evt', tick: 96, tickLength: 96, laneMask: 1, flags: { tap: true, forced: true }, label: 'Tap Lead' })
        ],
        phrases: [new SparkPhrase({ id: 0, name: 'Phrase 1', startTick: 0, endTick: 192, flags: {} })]
      }
    },
    metadata: { sourceFormat: 'notes_chart_v1' }
  }, { arrangementType: 'imported_chart' });

  assert.strictEqual(performanceChart.events[0].type, 'open');
  assert.strictEqual(performanceChart.events[0].laneLabel, 'Open');
  assert.strictEqual(performanceChart.events[0].sourceFlags.open, true);
  assert.strictEqual(performanceChart.events[0].laneMask, 0);
  assert.strictEqual(performanceChart.events[1].type, 'tap');
  assert.strictEqual(performanceChart.events[1].strum, 'tap');
  assert.strictEqual(performanceChart.events[1].sourceFlags.tap, true);
  assert.strictEqual(performanceChart.events[1].sourceFlags.forced, true);
});

test('SparkNoteMapper preserves open notes and derives strings from laneMask', function() {
  var mapper = new SparkNoteMapper();
  var openMapped = mapper.mapToFretboard({
    id: 'open_evt',
    type: 'open',
    laneMask: 0,
    sourceFlags: { open: true }
  });
  var maskedMapped = mapper.mapToFretboard({
    id: 'masked_evt',
    type: 'note',
    laneMask: 4
  });

  assert.strictEqual(openMapped.positions[0].string, null);
  assert.strictEqual(maskedMapped.positions[0].string, 2);
});

test('scorePerformanceEvent allows imported open events to score from attack timing activity', function() {
  var result = scorePerformanceEvent(
    { t: 1, type: 'open', notes: [], sourceFlags: { open: true } },
    {
      pitchClasses: [],
      attackClusters: [{ tSec: 1.01, notes: [40], pitchClasses: ['E'] }]
    },
    10,
    'normal',
    'midi'
  );

  assert.strictEqual(result.grade, 'perfect');
  assert.strictEqual(result.noteScore, 1);
});

test('scorePerformanceEvent requires a real attack cluster for imported tap events', function() {
  var miss = scorePerformanceEvent(
    { t: 2, type: 'tap', notes: ['E'], sourceFlags: { tap: true } },
    {
      pitchClasses: ['E'],
      attackClusters: []
    },
    5,
    'normal',
    'midi'
  );
  var hit = scorePerformanceEvent(
    { t: 2, type: 'tap', notes: ['E'], sourceFlags: { tap: true } },
    {
      pitchClasses: ['E'],
      attackClusters: [{ tSec: 2.01, notes: [64], pitchClasses: ['E'] }]
    },
    5,
    'normal',
    'midi'
  );

  assert.strictEqual(miss.grade, 'miss');
  assert.notStrictEqual(hit.grade, 'miss');
});

test('getImportedTechniquePreview surfaces upcoming imported technique badges', function() {
  var preview = getImportedTechniquePreview({
    events: [
      { id: 'a', t: 1.0, sourceFlags: { open: true } },
      { id: 'b', t: 1.2, sourceFlags: { tap: true } },
      { id: 'c', t: 1.4, sourceFlags: { forced: true } },
      { id: 'd', t: 4.5, sourceFlags: { specialPhrase: true } }
    ]
  }, 0.8, 1.0);

  assert.deepStrictEqual(preview.map(function(item) { return item.label; }), ['Open', 'Tap', 'Forced']);
  assert.strictEqual(preview[0].color, '#38bdf8');
  assert.strictEqual(preview[1].color, '#f59e0b');
});

test('getPerformanceEventHitColor maps imported flags to distinct hit colors', function() {
  assert.deepStrictEqual(getPerformanceEventHitColor({ sourceFlags: { open: true } }), [110, 220, 255]);
  assert.deepStrictEqual(getPerformanceEventHitColor({ sourceFlags: { tap: true } }), [255, 210, 90]);
  assert.deepStrictEqual(getPerformanceEventHitColor({ sourceFlags: { forced: true } }), [255, 140, 200]);
});

test('renderImportedTechniqueOverlay produces time-positioned tokens for upcoming imported events', function() {
  var html = renderImportedTechniqueOverlay({
    events: [
      { id: 'open_1', t: 1.0, laneMask: 0, laneLabel: 'Open', sourceFlags: { open: true } },
      { id: 'tap_1', t: 1.5, laneMask: 2, laneLabel: 'Tap Lead', sourceFlags: { tap: true } },
      { id: 'plain', t: 1.7, laneMask: 1, laneLabel: 'Plain', sourceFlags: {} }
    ]
  }, 0.5, 2.0);

  assert.ok(html.indexOf('data-imported-token="open_1"') >= 0);
  assert.ok(html.indexOf('data-imported-token="tap_1"') >= 0);
  assert.ok(html.indexOf('Open') >= 0);
  assert.ok(html.indexOf('Tap') >= 0);
  assert.ok(html.indexOf('plain') === -1);
});

test('finalizePerformanceResults includes imported technique summaries', function() {
  var results = finalizePerformanceResults({
    title: 'Imported Flags',
    artist: 'Tester',
    events: [
      { _hit: true, _miss: false, sourceFlags: { open: true } },
      { _hit: false, _miss: true, sourceFlags: { tap: true } },
      { _hit: true, _miss: false, sourceFlags: { tap: true, forced: true } }
    ]
  }, []);

  assert.strictEqual(results.importedTechniqueSummary.open.total, 1);
  assert.strictEqual(results.importedTechniqueSummary.open.accuracy, 100);
  assert.strictEqual(results.importedTechniqueSummary.tap.total, 2);
  assert.strictEqual(results.importedTechniqueSummary.tap.hits, 1);
  assert.strictEqual(results.importedTechniqueSummary.forced.total, 1);
});

test('updatePerformanceStats accumulates imported technique totals', function() {
  var stats = updatePerformanceStats('song_a', 'imported_chart', 'normal', {
    score: 500,
    accuracy: 80,
    stars: 3,
    focusedTechnique: 'open',
    importedTechniqueSummary: {
      open: { total: 2, hits: 1, misses: 1 },
      tap: { total: 1, hits: 1, misses: 0 }
    }
  });

  assert.strictEqual(stats.importedTechniqueTotals.open.total, 2);
  assert.strictEqual(stats.importedTechniqueTotals.open.hits, 1);
  assert.strictEqual(stats.importedTechniqueTotals.tap.total, 1);
  assert.strictEqual(stats.lastTechniqueSummary.tap.hits, 1);
  assert.strictEqual(stats.lastFocusedTechnique, 'open');
  assert.strictEqual(stats.focusedTechniqueRuns.open, 1);
});

test('buildPerformanceRecommendationsForSong prioritizes imported technique weak spots', function() {
  S.performanceStats = {};
  updatePerformanceStats('import_song', 'imported_chart', 'normal', {
    score: 650,
    accuracy: 88,
    stars: 3,
    importedTechniqueSummary: {
      open: { total: 6, hits: 2, misses: 4 },
      tap: { total: 3, hits: 3, misses: 0 }
    }
  });

  var recs = buildPerformanceRecommendationsForSong('import_song');

  assert.strictEqual(recs[0].type, 'imported_technique_focus');
  assert.strictEqual(recs[0].techniqueKey, 'open');
  assert.ok(recs[0].reason.indexOf('33%') >= 0);
});

test('buildPerformanceRecommendationsForSong continues the current focused technique block when still weak', function() {
  S.performanceStats = {};
  updatePerformanceStats('focus_song', 'imported_chart', 'normal', {
    score: 700,
    accuracy: 84,
    stars: 3,
    focusedTechnique: 'tap',
    importedTechniqueSummary: {
      open: { total: 6, hits: 1, misses: 5 },
      tap: { total: 4, hits: 3, misses: 1 }
    }
  });

  var recs = buildPerformanceRecommendationsForSong('focus_song');

  assert.strictEqual(recs[0].type, 'imported_technique_focus');
  assert.strictEqual(recs[0].techniqueKey, 'tap');
  assert.ok(recs[0].label.indexOf('Stay on') >= 0);
});

test('buildPerformanceRecommendationsForSong skips imported technique focus when accuracy is strong', function() {
  S.performanceStats = {};
  updatePerformanceStats('clean_song', 'imported_chart', 'normal', {
    score: 900,
    accuracy: 92,
    stars: 4,
    importedTechniqueSummary: {
      open: { total: 4, hits: 4, misses: 0 },
      tap: { total: 5, hits: 5, misses: 0 }
    }
  });

  var recs = buildPerformanceRecommendationsForSong('clean_song');
  var hasTechniqueFocus = recs.some(function(rec) {
    return rec.type === 'imported_technique_focus';
  });

  assert.strictEqual(hasTechniqueFocus, false);
  assert.strictEqual(recs[0].type, 'promote_difficulty');
});

test('choosePerformanceDailyChallenge carries focused imported-technique targets into the challenge payload', function() {
  S.performanceStats = {};
  S.performanceDailyChallenge = null;
  S.performanceDailyComplete = false;
  var syncedState = null;
  window.sparkCore = {
    syncPerformanceDailyChallengeState: function(challenge, isComplete) {
      syncedState = { challenge: challenge, isComplete: isComplete };
    }
  };
  SONGS = [
    { title: 'Daily Focus', progression: ['C', 'G'] }
  ];
  updatePerformanceStats('daily_focus', 'imported_chart', 'normal', {
    score: 720,
    accuracy: 84,
    stars: 3,
    focusedTechnique: 'tap',
    importedTechniqueSummary: {
      tap: { total: 5, hits: 3, misses: 2 }
    }
  });

  var challenge = choosePerformanceDailyChallenge();

  assert.strictEqual(challenge.type, 'imported_technique_focus');
  assert.strictEqual(challenge.techniqueKey, 'tap');
  assert.strictEqual(challenge.target.accuracy, 90);
  assert.strictEqual(syncedState.challenge.techniqueKey, 'tap');
  assert.strictEqual(syncedState.isComplete, false);
  window.sparkCore = null;
});

test('applyPerformanceRunOutcome centralizes song stat and progression bookkeeping', function() {
  S.performSongStats = {};
  S.performanceStats = {};
  S.performanceUnlocks = {};
  S.xp = 0;

  var outcome = SparkPerformanceBridge.applyPerformanceRunOutcome({
    chartId: 'bridge_song',
    chart: { arrangementType: 'imported_chart' },
    difficulty: 'normal',
    results: {
      score: 720,
      accuracy: 84,
      stars: 3,
      phraseStats: [
        { phraseId: 1, total: 2, scoreSum: 1.4 }
      ],
      importedTechniqueSummary: {
        open: { total: 3, hits: 2, misses: 1 }
      }
    }
  });

  assert.strictEqual(outcome.songStats.runs, 1);
  assert.strictEqual(outcome.songStats.bestScore, 720);
  assert.strictEqual(outcome.songStats.phrases['1'].attempts, 1);
  assert.strictEqual(outcome.progressionStats.bestAccuracy, 84);
  assert.strictEqual(outcome.progressionStats.importedTechniqueTotals.open.total, 3);
  assert.strictEqual(S.performanceStats['bridge_song_imported_chart_normal'].runs, 1);
});

test('applyPerformanceRunFollowOns centralizes daily challenge, badge, and unlock aftermath', function() {
  S.performanceStats = {};
  S.performanceUnlocks = {};
  S.earnedBadges = [];
  S.performanceBadges = [];
  S.performanceDailyHistory = [];
  S.performanceDailyComplete = false;
  S.performanceDailyChallenge = {
    id: 'perf_today',
    date: '2026-04-02',
    type: 'full_run',
    xp: 25
  };
  S.xp = 0;

  updatePerformanceStats('follow_song', 'rhythm_chords', 'pro', {
    score: 980,
    accuracy: 96,
    stars: 5,
    totalEvents: 12
  });

  var outcome = SparkPerformanceBridge.applyPerformanceRunFollowOns({
    chartId: 'follow_song',
    chart: { arrangementType: 'rhythm_chords' },
    difficulty: 'pro',
    results: {
      totalEvents: 12,
      accuracy: 96,
      stars: 5
    },
    progressionStats: S.performanceStats['follow_song_rhythm_chords_pro'],
    songStats: { bestScore: 980, runs: 1, mastered: true, phrases: {} }
  });

  assert.strictEqual(outcome.dailyXp, 25);
  assert.strictEqual(S.performanceDailyComplete, true);
  assert.strictEqual(S.performanceDailyHistory.length, 1);
  assert.ok(outcome.builtInBadges.indexOf('perf_first') >= 0);
  assert.ok(outcome.builtInBadges.indexOf('perf_3star') >= 0);
  assert.ok(outcome.builtInBadges.indexOf('perf_daily') >= 0);
  assert.ok(outcome.standaloneBadges.length >= 1);
  assert.ok(outcome.unlockResult.xp >= 10);
  assert.ok(S.xp >= 35);
});

test('applyPerformanceRunFollowOns completes imported-technique daily challenges from focused accuracy', function() {
  S.performanceStats = {};
  S.performanceUnlocks = {};
  S.earnedBadges = [];
  S.performanceBadges = [];
  S.performanceDailyHistory = [];
  S.performanceDailyComplete = false;
  S.performanceDailyChallenge = {
    id: 'perf_focus_today',
    date: '2026-04-02',
    type: 'imported_technique_focus',
    techniqueKey: 'tap',
    xp: 35,
    target: { accuracy: 90 }
  };
  S.xp = 0;

  var outcome = SparkPerformanceBridge.applyPerformanceRunFollowOns({
    chartId: 'focus_song',
    chart: { arrangementType: 'imported_chart' },
    difficulty: 'normal',
    results: {
      totalEvents: 10,
      accuracy: 82,
      stars: 3,
      importedTechniqueSummary: {
        tap: { total: 4, hits: 4, misses: 0 }
      }
    },
    progressionStats: { mastery: 'developing' },
    songStats: { bestScore: 800, runs: 2, mastered: false, phrases: {} }
  });

  assert.strictEqual(outcome.dailyXp, 35);
  assert.strictEqual(S.performanceDailyComplete, true);
  assert.strictEqual(S.performanceDailyHistory.length, 1);
});

test('markPerformanceDailyComplete syncs focused challenge completion into sparkCore runtime state', function() {
  var syncedState = null;
  window.sparkCore = {
    syncPerformanceDailyChallengeState: function(challenge, isComplete) {
      syncedState = { challenge: challenge, isComplete: isComplete };
    }
  };
  S.performanceDailyHistory = [];
  S.performanceDailyComplete = false;
  S.performanceDailyChallenge = {
    id: 'perf_focus_today',
    date: '2026-04-03',
    type: 'imported_technique_focus',
    techniqueKey: 'open',
    xp: 35,
    target: { accuracy: 90 }
  };

  var xp = markPerformanceDailyComplete();

  assert.strictEqual(xp, 35);
  assert.strictEqual(syncedState.challenge.techniqueKey, 'open');
  assert.strictEqual(syncedState.isComplete, true);
  window.sparkCore = null;
});

test('syncPerformanceRuntimeState centralizes performance runtime flags and screen transitions', function() {
  SparkPerformanceBridge.syncPerformanceRuntimeState('start', {
    chart: { id: 'chart_a' },
    chartId: 'chart_a',
    phraseStats: [{ phraseId: 1 }],
    mode: 'audio',
    difficulty: 'pro',
    speed: 0.9,
    preset: 'guitar_solo',
    screen: SCR.PERFORM
  });

  assert.strictEqual(S.performChartId, 'chart_a');
  assert.strictEqual(S.performPlaying, true);
  assert.strictEqual(S.performPaused, false);
  assert.strictEqual(S.performMode, 'audio');
  assert.strictEqual(S.performDifficulty, 'pro');
  assert.strictEqual(S.screen, 'perform');

  SparkPerformanceBridge.syncPerformanceRuntimeState('pause');
  assert.strictEqual(S.performPlaying, false);
  assert.strictEqual(S.performPaused, true);

  SparkPerformanceBridge.syncPerformanceRuntimeState('resume');
  assert.strictEqual(S.performPlaying, true);
  assert.strictEqual(S.performPaused, false);

  SparkPerformanceBridge.syncPerformanceRuntimeState('seek', { sec: 12.5 });
  assert.strictEqual(S.performCurrentSec, 12.5);

  SparkPerformanceBridge.syncPerformanceRuntimeState('set_loop', { loop: { startSec: 2, endSec: 4 } });
  assert.deepStrictEqual(S.performLoop, { startSec: 2, endSec: 4 });

  SparkPerformanceBridge.syncPerformanceRuntimeState('finish', {
    results: { accuracy: 91, stars: 4 },
    screen: SCR.PERFORM_DONE
  });
  assert.strictEqual(S.performResults.accuracy, 91);
  assert.strictEqual(S.performStarRating, 4);
  assert.strictEqual(S.screen, 'performDone');
  assert.strictEqual(S.performPlaying, false);
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
