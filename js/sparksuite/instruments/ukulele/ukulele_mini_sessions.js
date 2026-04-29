(function(root) {
  "use strict";

  var SET_DURATION_SEC = 720;
  var DEFAULT_FAVORITES = [
    "Somewhere Over the Rainbow",
    "Riptide",
    "I'm Yours",
    "Can't Help Falling in Love",
    "Stand By Me",
    "Lava"
  ];

  var SETS = [
    {
      id: "uke_favorites_set_a",
      title: "Set A - Strum Stability",
      targetSkills: ["steady right hand", "feel the groove"],
      tempoGuide: "60-72 BPM, then up a notch",
      songTitles: ["Riptide", "I'm Yours"],
      tags: ["favorites", "adhd", "strum_stability"],
      blocks: [
        { id: "warmup", type: "warmup", label: "Warm-up Strum", durationSec: 120, pattern: "D D U U D U", progression: ["Am", "G", "C", "F"], count: "1 2 & & 4 &" },
        { id: "song_1", type: "song_loop", label: "Song Loop 1 - Riptide", durationSec: 240, songTitle: "Riptide", progression: ["Am", "G", "C", "F"], focus: "No rush on chord lifts; lightly mute strings on bar lines." },
        { id: "song_2", type: "song_loop", label: "Song Loop 2 - I'm Yours", durationSec: 240, songTitle: "I'm Yours", progression: ["C", "G", "Am", "F"], focus: "Keep identical right-hand motion during chord swaps." },
        { id: "embellish", type: "embellish", label: "Ghost Tap", durationSec: 60, focus: "Add a light soundboard ghost tap on beat 2." },
        { id: "record", type: "record", label: "Voice Memo Capture", durationSec: 60, focus: "Record 30s Riptide and 30s I'm Yours; note tempo drift, chord buzz, and right-hand evenness." }
      ]
    },
    {
      id: "uke_favorites_set_b",
      title: "Set B - Smooth Changes",
      targetSkills: ["left-hand economy", "clean transitions"],
      tempoGuide: "60-68 BPM, calm and even",
      songTitles: ["Can't Help Falling in Love", "Stand By Me"],
      tags: ["favorites", "adhd", "smooth_changes"],
      blocks: [
        { id: "change_drill", type: "transition", label: "Change Drill", durationSec: 120, progression: ["C", "G", "Am", "F"], focus: "C to G, G to Am, Am to F, four beats each; keep fingers low." },
        { id: "song_1", type: "song_loop", label: "Song Loop 1 - Can't Help Falling in Love", durationSec: 240, songTitle: "Can't Help Falling in Love", progression: ["C", "Em", "Am", "F", "C", "G", "C"], focus: "Every change lands exactly on beat 1." },
        { id: "song_2", type: "song_loop", label: "Song Loop 2 - Stand By Me", durationSec: 240, songTitle: "Stand By Me", progression: ["C", "Am", "F", "G"], focus: "Strum on beats first, then add up-strums." },
        { id: "embellish", type: "embellish", label: "One-Finger Walk-in", durationSec: 60, focus: "Add a one-finger walk-in to chords, such as F# to G on string 2." },
        { id: "record", type: "record", label: "Voice Memo Capture", durationSec: 60, focus: "Record 30s per song and note which change still feels sticky." }
      ]
    },
    {
      id: "uke_favorites_set_c",
      title: "Set C - Melody & Touch",
      targetSkills: ["melody picking", "dynamic control"],
      tempoGuide: "55-65 BPM, relaxed and singable",
      songTitles: ["Somewhere Over the Rainbow", "Lava"],
      tags: ["favorites", "adhd", "melody_touch"],
      blocks: [
        { id: "picking_warmup", type: "warmup", label: "Picking Warm-up", durationSec: 120, pattern: "T I M R | T I M R", progression: ["C", "F", "G"], focus: "Thumb on 4, index on 3, middle on 2, ring on 1." },
        { id: "song_1", type: "melody_loop", label: "Melody Loop 1 - Somewhere Over the Rainbow", durationSec: 240, songTitle: "Somewhere Over the Rainbow", progression: ["C", "Em", "Am", "F"], focus: "Play the main motif as single notes or light campanella; keep notes ringing." },
        { id: "song_2", type: "melody_loop", label: "Melody Loop 2 - Lava", durationSec: 240, songTitle: "Lava", progression: ["C", "G7", "F"], focus: "Sing or hum while picking to keep phrasing natural." },
        { id: "embellish", type: "embellish", label: "Gentle Rolls", durationSec: 60, focus: "Add I-M-R rolls before long notes and finish phrases with a soft brush." },
        { id: "record", type: "record", label: "Voice Memo Capture", durationSec: 60, focus: "Record 30s per tune and note melody volume and squeaks." }
      ]
    }
  ];

  var PRINTABLE_ONE_PAGERS = [
    {
      id: "uke_favorites_set_a",
      title: "Set A - Strum Stability",
      songs: ["Riptide", "I'm Yours"],
      focus: "right-hand consistency + groove",
      chordShapes: { Am: "2000", G: "0232", C: "0003", F: "2010" },
      corePattern: { label: "Island Strum", strum: "D D U U D U", count: "1 2 & & 4 &" },
      loops: [
        { label: "Loop 1 - Riptide", progression: ["Am", "G", "C", "F"] },
        { label: "Loop 2 - I'm Yours", progression: ["C", "G", "Am", "F"] }
      ],
      microGoals: ["Hand never stops moving", "Even volume across all strokes"],
      upgrade: { label: "Muted tap", pattern: "D (tap) U U D U" },
      tabs: []
    },
    {
      id: "uke_favorites_set_b",
      title: "Set B - Smooth Changes",
      songs: ["Can't Help Falling in Love", "Stand By Me"],
      focus: "clean chord transitions",
      chordShapes: { C: "0003", G: "0232", Am: "2000", F: "2010", Em: "0432" },
      drill: [
        ["C", "G", "C", "G"],
        ["G", "Am", "G", "Am"],
        ["Am", "F", "Am", "F"]
      ],
      loops: [
        { label: "Loop 1 - Can't Help Falling", progression: ["C", "Em", "Am", "F", "C", "G", "C", "-"] },
        { label: "Loop 2 - Stand By Me", progression: ["C", "Am", "F", "G"] }
      ],
      microGoals: ["Chord lands exactly on beat 1", "No finger lift air gaps"],
      upgrade: { label: "Walk-in note", pattern: "G: 0 -> 2 on E string before full chord" },
      tabs: []
    },
    {
      id: "uke_favorites_set_c",
      title: "Set C - Melody & Touch",
      songs: ["Somewhere Over the Rainbow", "Lava"],
      focus: "picking + phrasing",
      chordShapes: { C: "0003", F: "2010", G: "0232", G7: "0212", Am: "2000", Em: "0432" },
      pickingPattern: { fingers: "T I M R", strings: "G C E A" },
      loops: [
        { label: "Loop 1 - Over the Rainbow motif", progression: ["C", "Em", "Am", "F"] },
        { label: "Loop 2 - Lava motif", progression: ["C", "G7", "F"] }
      ],
      microGoals: ["Notes ring without choking strings", "Even volume across fingers"],
      upgrade: { label: "Roll", pattern: "I -> M -> R quickly before long note" },
      tabs: [
        {
          label: "C chord arpeggio",
          lines: [
            "A|----3----3----3----3-",
            "E|------0----0----0----",
            "C|----0----0----0------",
            "G|-0-------------------"
          ]
        },
        {
          label: "Over the Rainbow motif idea",
          lines: [
            "A|--3---5---7--",
            "E|-------------",
            "C|-------------",
            "G|-------------"
          ]
        },
        {
          label: "Lava motif idea",
          lines: [
            "A|--3---3---5---3--",
            "E|-----------------",
            "C|-----------------",
            "G|-----------------"
          ]
        }
      ]
    }
  ];

  var WEEKLY_FLOW = ["A", "B", "C", "A", "B", "C", "review recordings"];
  var CAPTURE_RULE = {
    songOneSec: 30,
    songTwoSec: 30,
    prompt: "Say one note: rushed, clean, or the sticky chord."
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function repertoire() {
    return root.SparkUkuleleRepertoire || [];
  }

  function normalizeTitle(value) {
    return String(value || "").trim().toLowerCase();
  }

  function findSong(title) {
    var songs = repertoire();
    var target = normalizeTitle(title);
    for (var i = 0; i < songs.length; i++) {
      if (normalizeTitle(songs[i].title) === target) return songs[i];
    }
    return { title: title, artist: "SparkSuite", progression: [], bpm: null, focus: "" };
  }

  function resolveFavorites(options) {
    var input = options && Array.isArray(options.favorites) ? options.favorites : [];
    var titles = input.length ? input : DEFAULT_FAVORITES;
    return titles.map(findSong);
  }

  function firstFavoriteForSet(set, favorites) {
    var wanted = {};
    var i;
    for (i = 0; i < set.songTitles.length; i++) wanted[normalizeTitle(set.songTitles[i])] = true;
    for (i = 0; i < favorites.length; i++) {
      if (favorites[i] && wanted[normalizeTitle(favorites[i].title)]) return favorites[i];
    }
    return findSong(set.songTitles[0]);
  }

  function buildSession(set, favorites) {
    var session = clone(set);
    session.instrument = "ukulele";
    session.durationSec = SET_DURATION_SEC;
    session.favoriteSource = clone(firstFavoriteForSet(set, favorites));
    session.progression = session.favoriteSource.progression && session.favoriteSource.progression.length
      ? session.favoriteSource.progression.slice()
      : (session.blocks[1] && session.blocks[1].progression ? session.blocks[1].progression.slice() : []);
    return session;
  }

  function buildFromFavorites(options) {
    var favorites = resolveFavorites(options || {});
    return SETS.map(function(set) {
      return buildSession(set, favorites);
    });
  }

  function getById(id, options) {
    var sessions = buildFromFavorites(options || {});
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].id === id) return sessions[i];
    }
    return sessions[0];
  }

  function buildPracticePlan(options) {
    options = options || {};
    var miniSession = getById(options.miniSessionId, options);
    var segments = [];
    var exercises = [];
    for (var i = 0; i < miniSession.blocks.length; i++) {
      var block = miniSession.blocks[i];
      var segmentId = miniSession.id + "_" + block.id;
      var exerciseId = segmentId + "_ex";
      var meta = {
        ukuleleMiniSessionId: miniSession.id,
        ukuleleMiniSessionBlockId: block.id,
        instrumentType: "ukulele",
        skill: block.type === "transition" ? "uke_chord_switching" : "uke_song",
        songTitle: block.songTitle || null,
        pattern: block.pattern || null,
        progression: block.progression || miniSession.progression
      };
      segments.push({
        id: segmentId,
        type: block.type,
        label: block.label,
        desc: block.focus || "",
        durationSec: block.durationSec,
        completed: false,
        meta: clone(meta),
        exerciseIds: [exerciseId]
      });
      exercises.push({
        id: exerciseId,
        type: block.type,
        difficulty: "easy",
        data: {
          presentation: { label: block.label, reason: block.focus || "" },
          core: {
            skill: meta.skill,
            instrument: "ukulele",
            durationSec: block.durationSec,
            mode: "ukulele_favorite_mini_session",
            chords: meta.progression,
            pattern: block.pattern || null,
            songTitle: block.songTitle || null
          },
          gameplay: { payload: null, preset: null, chartId: null }
        }
      });
    }
    return {
      source: "ukulele_favorite_mini_session",
      focus: miniSession.title,
      miniSession: miniSession,
      segments: segments,
      exercises: exercises,
      rewards: [{ type: "xp", amount: 45 }]
    };
  }

  function getPrintableOnePagers() {
    return clone(PRINTABLE_ONE_PAGERS);
  }

  function getWeeklyFlow() {
    return WEEKLY_FLOW.slice();
  }

  function getCaptureRule() {
    return clone(CAPTURE_RULE);
  }

  function findPrintableOnePager(id) {
    for (var i = 0; i < PRINTABLE_ONE_PAGERS.length; i++) {
      if (PRINTABLE_ONE_PAGERS[i].id === id) return PRINTABLE_ONE_PAGERS[i];
    }
    return PRINTABLE_ONE_PAGERS[0];
  }

  function renderChordShapes(chordShapes) {
    var lines = [];
    var key;
    for (key in chordShapes) {
      if (Object.prototype.hasOwnProperty.call(chordShapes, key)) lines.push(key + "  " + chordShapes[key]);
    }
    return lines.join("\n");
  }

  function renderProgression(progression) {
    return "| " + progression.join(" | ") + " |";
  }

  function renderPrintableOnePager(id) {
    var page = findPrintableOnePager(id);
    var lines = ["# " + page.title, "", "Songs: " + page.songs.join(" + "), "Focus: " + page.focus, ""];
    lines.push("## Chords", "```", renderChordShapes(page.chordShapes), "```", "");
    if (page.corePattern) {
      lines.push("## Core Pattern", "```", page.corePattern.strum, page.corePattern.count, "```", "");
    }
    if (page.pickingPattern) {
      lines.push("## Picking Pattern", "```", page.pickingPattern.fingers, page.pickingPattern.strings, "```", "");
    }
    if (page.drill) {
      lines.push("## Drill", "```");
      for (var d = 0; d < page.drill.length; d++) lines.push(renderProgression(page.drill[d]));
      lines.push("```", "");
    }
    lines.push("## Loops");
    for (var i = 0; i < page.loops.length; i++) {
      lines.push(page.loops[i].label, "```", renderProgression(page.loops[i].progression), "```");
    }
    if (page.tabs && page.tabs.length) {
      lines.push("", "## Tabs");
      for (var t = 0; t < page.tabs.length; t++) {
        lines.push(page.tabs[t].label, "```", page.tabs[t].lines.join("\n"), "```");
      }
    }
    lines.push("", "## Micro Goal");
    for (var g = 0; g < page.microGoals.length; g++) lines.push("- " + page.microGoals[g]);
    lines.push("", "## +1 Upgrade", "```", page.upgrade.pattern, "```", "");
    lines.push("## 60-Second Capture", "- 30s song 1", "- 30s song 2", "- " + CAPTURE_RULE.prompt);
    return lines.join("\n");
  }

  var api = {
    getAll: buildFromFavorites,
    getById: getById,
    getPrintableOnePagers: getPrintableOnePagers,
    getWeeklyFlow: getWeeklyFlow,
    getCaptureRule: getCaptureRule,
    renderPrintableOnePager: renderPrintableOnePager,
    buildFromFavorites: buildFromFavorites,
    buildPracticePlan: buildPracticePlan
  };

  root.SparkUkuleleMiniSessions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
