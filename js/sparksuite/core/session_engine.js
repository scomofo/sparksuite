(function() {
  function SessionEngine(practiceEngine, curriculumEngine) {
    this.practiceEngine = practiceEngine;
    this.curriculumEngine = curriculumEngine;
  }

  SessionEngine.prototype.buildSession = function(flow, context) {
    context = context || {};
    if (flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return this.buildGuidedSession(context);
    if (flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return this.buildPerformanceSongSession(context);
    if (flow !== SparkSessionTypes.FLOW_DAILY_PRACTICE) return this.buildEmptySession(flow, context);

    var curriculumContext = this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {});
    var practicePlan = this.practiceEngine.buildDailyPracticePlan({
      curriculum: curriculumContext,
      instrumentContext: context.instrumentContext || {}
    });

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      focus: practicePlan.focus,
      lesson: curriculumContext.nextLesson || null,
      difficulty: curriculumContext.nextLesson ? curriculumContext.nextLesson.level || null : null,
      segments: practicePlan.segments,
      exercises: practicePlan.segments,
      rewards: [],
      context: {
        curriculum: curriculumContext
      }
    });
  };

  SessionEngine.prototype.buildLegacyPracticeSession = function(context) {
    context = context || {};
    var instrumentContext = context.instrumentContext || {};
    var instrumentData = instrumentContext.instrumentData || {};
    var level = parseLevel(context.level);
    var mode = context.mode === "chord" ? "chord" : "quickStart";
    var chord = mode === "chord"
      ? findChordByName(instrumentData.ALL_CHORDS || [], context.chordName)
      : pickQuickStartChord(instrumentData, level);
    var chordName = chord && chord.name ? chord.name : (context.chordName || null);
    var segmentLabel = chordName ? ("Practice " + chordName) : "Practice";

    return new SessionPlan({
      flow: "legacy_practice_session",
      instrumentId: instrumentContext.appId || null,
      focus: segmentLabel,
      lesson: chordName ? { id: chordName, title: segmentLabel } : null,
      difficulty: level,
      segments: [SparkSessionSegment.create({
        id: "legacy_practice_" + (chordName || mode || "session"),
        type: SparkSessionSegmentTypes.TRANSITION,
        label: segmentLabel,
        durationSec: 120,
        meta: {
          mode: mode,
          chordName: chordName
        }
      })],
      exercises: [{
        type: mode,
        chordName: chordName,
        durationSec: 120
      }],
      rewards: [{ type: "xp", amount: 10 }],
      context: {
        legacyPractice: {
          mode: mode,
          chord: chord,
          chordName: chordName,
          durationSec: 120
        }
      }
    });
  };

  SessionEngine.prototype.buildLegacyPracticeDrill = function(context) {
    context = context || {};
    var instrumentContext = context.instrumentContext || {};
    var instrumentData = instrumentContext.instrumentData || {};
    var drillChords = normalizeDrillChords(instrumentData, context.chordNames, parseLevel(context.level));
    var chordNames = drillChords.map(function(chord) { return chord.name; });

    return new SessionPlan({
      flow: "legacy_practice_drill",
      instrumentId: instrumentContext.appId || null,
      focus: chordNames.length ? ("Drill " + chordNames.join(" / ")) : "Chord drill",
      lesson: chordNames.length ? { id: chordNames.join("_"), title: chordNames.join(" / ") } : null,
      difficulty: parseLevel(context.level),
      segments: [SparkSessionSegment.create({
        id: "legacy_practice_drill_" + (chordNames.join("_") || "default"),
        type: SparkSessionSegmentTypes.TRANSITION,
        label: chordNames.length ? chordNames.join(" / ") : "Chord drill",
        durationSec: 60,
        meta: {
          mode: "drill",
          chordNames: chordNames
        }
      })],
      exercises: chordNames.map(function(chordName, index) {
        return {
          id: "drill_chord_" + index,
          type: "drill",
          chordName: chordName,
          durationSec: 60
        };
      }),
      rewards: [{ type: "xp", amount: 20 }],
      context: {
        legacyPractice: {
          mode: "drill",
          chords: drillChords,
          chordNames: chordNames,
          durationSec: 60
        }
      }
    });
  };

  SessionEngine.prototype.buildGuidedSession = function(context) {
    var instrumentContext = context.instrumentContext || {};
    var sessions = Array.isArray(instrumentContext.sessions) ? instrumentContext.sessions : [];
    var sessionNum = parseInt(context.sessionNum, 10);
    if (isNaN(sessionNum) || sessionNum < 1) sessionNum = 1;

    var sessionIndex = Math.max(0, Math.min(sessions.length - 1, sessionNum - 1));
    var guidedPlan = sessions.length ? clone(sessions[sessionIndex]) : null;
    if (guidedPlan && guidedPlan.num != null) sessionNum = guidedPlan.num;

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      instrumentId: instrumentContext.appId || null,
      focus: guidedPlan ? guidedPlan.title || ("Session " + sessionNum) : "Guided session",
      lesson: guidedPlan,
      difficulty: guidedPlan ? guidedPlan.level || null : null,
      segments: guidedPlan ? [SparkSessionSegment.create({
        id: "guided_session_" + sessionNum,
        type: SparkSessionSegmentTypes.GUIDED_SESSION,
        label: guidedPlan.title || ("Session " + sessionNum),
        desc: guidedPlan.spark ? guidedPlan.spark.text || guidedPlan.spark.desc || "" : "",
        durationSec: 300,
        meta: {
          guidedSession: sessionNum
        }
      })] : [],
      exercises: guidedPlan ? [{
        type: SparkSessionSegmentTypes.GUIDED_SESSION,
        sessionNum: sessionNum,
        durationSec: 300
      }] : [],
      rewards: [{ type: "xp", amount: 30 }],
      context: {
        guidedPlan: guidedPlan,
        guidedSession: sessionNum,
        totalGuidedSessions: sessions.length
      }
    });
  };

  SessionEngine.prototype.buildPerformanceSongSession = function(context) {
    var instrumentContext = context.instrumentContext || {};
    var songs = Array.isArray(instrumentContext.songs) ? instrumentContext.songs : [];
    var selection = resolveSongSelection(songs, context);
    var song = selection.song;
    var songId = selection.songId;
    var arrangementType = context.arrangementType || "chords";
    var difficultyId = context.difficultyId || "normal";

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      instrumentId: instrumentContext.appId || null,
      focus: song ? "Perform " + (song.title || "song") : "Performance song",
      lesson: song ? { id: songId, title: song.title || "Performance song" } : null,
      difficulty: difficultyId,
      segments: song ? [SparkSessionSegment.create({
        id: "performance_song_" + songId,
        type: SparkSessionSegmentTypes.PERFORMANCE_SONG,
        label: song.title || "Performance song",
        desc: song.artist || "",
        durationSec: estimateSongDurationSec(song),
        meta: {
          songId: songId,
          arrangementType: arrangementType,
          difficultyId: difficultyId
        }
      })] : [],
      exercises: song ? [{
        type: SparkSessionSegmentTypes.PERFORMANCE_SONG,
        songId: songId,
        arrangementType: arrangementType,
        difficultyId: difficultyId
      }] : [],
      rewards: [{ type: "xp", amount: 5 }],
      context: {
        performanceSong: {
          songData: song ? clone(song) : null,
          songId: songId,
          arrangementType: arrangementType,
          difficultyId: difficultyId
        }
      }
    });
  };

  SessionEngine.prototype.buildEmptySession = function(flow, context) {
    return new SessionPlan({
      flow: flow,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      segments: []
    });
  };

  function resolveSongSelection(songs, context) {
    var songIndex = parseInt(context.songIndex, 10);
    if (!isNaN(songIndex) && songs[songIndex]) {
      return {
        song: clone(songs[songIndex]),
        songId: toSongId(songs[songIndex])
      };
    }

    var songId = String(context.songId || "").trim();
    if (songId) {
      for (var i = 0; i < songs.length; i++) {
        if (toSongId(songs[i]) === songId) {
          return {
            song: clone(songs[i]),
            songId: songId
          };
        }
      }
    }

    return {
      song: null,
      songId: songId || ""
    };
  }

  function estimateSongDurationSec(song) {
    if (!song) return 0;
    if (song.durationSec) return song.durationSec;
    if (song.duration) return song.duration;
    if (song.phrases && song.phrases.length) {
      var lastPhrase = song.phrases[song.phrases.length - 1];
      if (lastPhrase && lastPhrase.endSec) return Math.ceil(lastPhrase.endSec);
    }
    return 240;
  }

  function toSongId(song) {
    return String(song && song.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  function parseLevel(level) {
    level = parseInt(level, 10);
    return isNaN(level) || level < 1 ? 1 : level;
  }

  function pickQuickStartChord(instrumentData, level) {
    var pool = (instrumentData.CHORDS && instrumentData.CHORDS[level]) || (instrumentData.CHORDS && instrumentData.CHORDS[1]) || [];
    if (!pool.length) return null;
    return clone(pool[Math.floor(Math.random() * pool.length)]);
  }

  function findChordByName(allChords, chordName) {
    var i;
    for (i = 0; i < allChords.length; i++) {
      if (allChords[i] && allChords[i].name === chordName) return clone(allChords[i]);
    }
    return chordName ? { name: chordName } : null;
  }

  function normalizeDrillChords(instrumentData, chordNames, level) {
    var selected = [];
    var names = Array.isArray(chordNames) ? chordNames : [];
    var allChords = instrumentData.ALL_CHORDS || [];
    var pool = (instrumentData.CHORDS && instrumentData.CHORDS[level]) || (instrumentData.CHORDS && instrumentData.CHORDS[1]) || [];
    var c1;
    var c2;
    var attempts;
    var i;

    if (names.length) {
      for (i = 0; i < names.length; i++) selected.push(findChordByName(allChords, names[i]));
      return selected.filter(Boolean);
    }

    c1 = pool.length ? clone(pool[Math.floor(Math.random() * pool.length)]) : null;
    c2 = c1;
    attempts = 0;
    while (c2 && c1 && c2.name === c1.name && pool.length > 1 && attempts < 20) {
      c2 = clone(pool[Math.floor(Math.random() * pool.length)]);
      attempts++;
    }
    return [c1, c2].filter(Boolean);
  }

  window.SparkSuiteSessionEngine = SessionEngine;
})();
