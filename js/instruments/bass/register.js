// js/instruments/bass/register.js
(function() {
  function resolveBassRegisterChordShape(chordObj) {
    var pool;
    var chordName;
    var i;
    if (!chordObj) return null;
    if (Array.isArray(chordObj.fingers) && chordObj.fingers.length) return chordObj;
    if (Array.isArray(chordObj.frets) && chordObj.frets.length) return chordObj;
    chordName = chordObj.name || chordObj.short || null;
    if (!chordName) return chordObj;
    pool = typeof BASS_ALL_CHORDS !== "undefined" && Array.isArray(BASS_ALL_CHORDS) ? BASS_ALL_CHORDS : [];
    for (i = 0; i < pool.length; i++) {
      if (!pool[i]) continue;
      if (pool[i].name === chordName || pool[i].short === chordName) return pool[i];
    }
    return chordObj;
  }

  function bassRegisterRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function bassRegisterRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = bassRegisterRoot();
    if (!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function bassRegisterWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = bassRegisterRoot();
    if (root) root[path] = value;
    return value;
  }

  function bassRegisterEnsureArray(path) {
    var current = bassRegisterRead(path, null);
    if (Array.isArray(current)) return current;
    current = [];
    bassRegisterWrite(path, current);
    return current;
  }

  function bassRegisterEnsureObject(path) {
    var current = bassRegisterRead(path, null);
    if (current && typeof current === "object" && !Array.isArray(current)) return current;
    current = {};
    bassRegisterWrite(path, current);
    return current;
  }

  function renderBassSongsTab() {
    var songs = (window.SparkBassModule && window.SparkBassModule.getSongs()) || (typeof BASS_SONGS !== "undefined" ? BASS_SONGS : []);
    var charts = typeof getPerformanceChartLibrary === "function"
      ? getPerformanceChartLibrary({ instrument: "bass" })
      : [];
    var h = '<div class="card mb12"><div style="font-size:18px;font-weight:900;color:var(--text-primary)">Bass Songs & Performance</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Lock into pocket-driven bass charts and song studies that feel like real low-end parts.</div></div>';
    if (charts.length) {
      h += '<div class="card mb12"><div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Bass Performance Charts</div>';
      for (var c = 0; c < charts.length; c++) {
        h += '<div style="padding:8px 0;border-top:' + (c ? '1px solid var(--border)' : '0') + ';display:flex;justify-content:space-between;align-items:center;gap:10px">';
        h += '<div><div style="font-size:13px;font-weight:800;color:var(--text-primary)">' + escHTML(charts[c].title) + '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted)">' + escHTML(charts[c].artist || "") + ' | ' + escHTML(String(charts[c].bpm || "--")) + ' BPM</div></div>';
        h += '<button class="btn btn-sm" onclick="act(\'openPerform\',\'' + escHTML(charts[c].id) + '\')" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff">Perform</button>';
        h += '</div>';
      }
      h += '</div>';
    }
    for (var i = 0; i < songs.length; i++) {
      h += '<div class="card mb12"><div style="font-size:15px;font-weight:800;color:var(--text-primary)">' + escHTML(songs[i].title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(songs[i].artist || "") + ' | ' + escHTML((songs[i].chords || []).join(" - ")) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-dim);margin-top:4px">' + escHTML(String(songs[i].bpm || "--")) + ' BPM | Difficulty ' + escHTML(String(songs[i].difficulty || songs[i].level || 1)) + '</div></div>';
    }
    return h;
  }

  SparkInstruments.register({
    id: "bassspark",
    instrument: "bass",
    name: "Bass",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,
    capabilities: {
      stringCount: 4,
      noteLaneType: "string",
      chordShapeSupport: true,
      midiInput: false,
      capoSupport: false,
      performanceModes: ["rhythm", "song"]
    },

    getData: function() {
      return {
        CHORDS: typeof BASS_CHORDS !== "undefined" ? BASS_CHORDS : {},
        ALL_CHORDS: typeof BASS_ALL_CHORDS !== "undefined" ? BASS_ALL_CHORDS : [],
        SESSIONS: typeof BASS_SESSIONS !== "undefined" ? BASS_SESSIONS : [],
        SONGS: typeof BASS_SONGS !== "undefined" ? BASS_SONGS : [],
        LC: typeof BASS_LC !== "undefined" ? BASS_LC : {},
        LN: typeof BASS_LN !== "undefined" ? BASS_LN : {},
        CHORD_NOTES: {},
        STRINGS: typeof BASS_STRINGS !== "undefined" ? BASS_STRINGS : [],
        STRUM_PATTERNS: [],
        FINGER_EXERCISES: typeof BASS_EXERCISES !== "undefined" ? BASS_EXERCISES : [],
        CURRICULUM: typeof BASS_CURRICULUM !== "undefined" ? BASS_CURRICULUM : [],
        SKILL_TREE: typeof BASS_SKILL_TREE !== "undefined" ? BASS_SKILL_TREE : {}
      };
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
        var renderChord = resolveBassRegisterChordShape(chordObj);
        if (typeof stringedChordSVG === "function" && renderChord) {
          var chart = {
            name: renderChord.name || label || "chord",
            instrument: "bass",
            stringCount: 4,
            stringLabels: ["E", "A", "D", "G"],
            fretCountVisible: 5,
            startFret: 0,
            open: [false, false, false, false],
            muted: [],
            fingers: renderChord.fingers || [],
            barre: null
          };
          // Build open array from frets if available
          if (renderChord.frets) {
            for (var i = 0; i < 4 && i < renderChord.frets.length; i++) {
              chart.open[i] = renderChord.frets[i] === 0;
              if (renderChord.frets[i] < 0) chart.muted.push(i);
            }
          }
          return stringedChordSVG(chart, { width: size, label: label, animate: animate });
        }
        return typeof bassSVG === "function" ? bassSVG(renderChord, size, label, animate) : "";
      },
      header: function() {
        return typeof headerHTML === "function" ? headerHTML() : "";
      },
      tabNav: function() {
        return typeof tabNavHTML === "function" ? tabNavHTML() : "";
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
      }
    },

    act: function(a, v) {
      return bassAct(a, v);
    },

    tabRenderers: {
      songs: renderBassSongsTab
    },

    pages: {},

    tabs: [
      { id: "practice", label: "Practice", icon: "\uD83C\uDFB5" },
      { id: "drill",    label: "Drill",    icon: "\u26A1" },
      { id: "songs",    label: "Songs",    icon: "\uD83C\uDFB6" },
      { id: "stats",    label: "Stats",    icon: "\uD83D\uDCCA" },
      { id: "guide",    label: "Guide",    icon: "\uD83D\uDCD6" }
    ],

    stemMutePreset: {
      bass: false, vocals: true, drums: true,
      guitar: true, piano: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "bassspark", "bass");
        SparkStorage.save(profile);
      }
      bassRegisterEnsureArray("completedGuidedSessions");
      bassRegisterEnsureObject("chordProgress");
      bassRegisterEnsureObject("transitionStats");
      if (bassRegisterRead("drillAdaptiveBpm", null) === null) bassRegisterWrite("drillAdaptiveBpm", 60);
      if (bassRegisterRead("drillConsecutiveFast", null) === null) bassRegisterWrite("drillConsecutiveFast", 0);
      if (bassRegisterRead("drillConsecutiveSlow", null) === null) bassRegisterWrite("drillConsecutiveSlow", 0);
      if (bassRegisterRead("drillLastSwitchTime", null) === null) bassRegisterWrite("drillLastSwitchTime", 0);
      if (bassRegisterRead("guidedSession", null) === null) bassRegisterWrite("guidedSession", 1);
      if (bassRegisterRead("guidedPlan", undefined) === undefined) bassRegisterWrite("guidedPlan", null);
      if (bassRegisterRead("guidedStep", undefined) === undefined) bassRegisterWrite("guidedStep", null);
      if (bassRegisterRead("newMovePhase", undefined) === undefined) bassRegisterWrite("newMovePhase", null);
      if (bassRegisterRead("guidedPaused", undefined) === undefined) bassRegisterWrite("guidedPaused", false);
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var D = this.getData();
      var curriculum = D.CURRICULUM || [];
      var branches = [];
      for (var i = 0; i < curriculum.length; i++) {
        var lvl = curriculum[i];
        var level = bassRegisterRead("level", 1) || 1;
        branches.push({
          id: "level_" + lvl.num,
          label: lvl.title,
          level: lvl.num,
          status: level >= lvl.num ? "available" : "locked",
          progress: level > lvl.num ? 100 : (level === lvl.num ? 50 : 0)
        });
      }
      return { branches: branches };
    },

    getCurriculumMap: function() {
      return this.getData().CURRICULUM || [];
    },

    getExercises: function() {
      return this.getData().FINGER_EXERCISES || [];
    },

    getSongs: function() {
      return this.getData().SONGS || [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      var chords = D.CHORDS[level] || D.CHORDS[1] || [];
      return chords.slice(0, 2);
    },

    getExercisesForLesson: function(lessonId) {
      var D = this.getData();
      if (lessonId && D.CURRICULUM) {
        for (var i = 0; i < D.CURRICULUM.length; i++) {
          if (D.CURRICULUM[i].id === lessonId && D.CURRICULUM[i].exercises) {
            return D.CURRICULUM[i].exercises;
          }
        }
      }
      return D.FINGER_EXERCISES || [];
    },

    getPerformanceConfig: function() {
      return {
        laneCount: 4,
        laneLabels: ["E", "A", "D", "G"],
        defaultBpm: 70,
        supportedModes: ["rhythm", "song"],
        inputType: "pluck"
      };
    }
  });
})();
