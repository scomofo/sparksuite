(function() {
  var _normId = 0;
  function _nid() { return "ex_" + Date.now() + "_" + (++_normId); }
  function normalizeSegment(raw) {
    var exId = raw.id || _nid();
    var segType = (typeof SparkSessionSegmentTypes !== "undefined" && SparkSessionSegmentTypes.normalize)
      ? SparkSessionSegmentTypes.normalize(raw.type) : (raw.type || "practice");
    var segment = (typeof SparkSessionSegment !== "undefined" && SparkSessionSegment.create)
      ? SparkSessionSegment.create({
        id: raw.id || ("seg_" + exId),
        type: segType,
        label: raw.label,
        desc: raw.desc || raw.description || "",
        durationSec: raw.durationSec || 60,
        completed: !!raw.completed,
        meta: raw.meta || {}
      })
      : {
        id: raw.id || ("seg_" + exId),
        type: segType,
        label: raw.label || segType,
        desc: raw.desc || raw.description || "",
        durationSec: raw.durationSec || 60,
        completed: !!raw.completed,
        meta: raw.meta || {}
      };
    segment.exerciseIds = [exId];
    return {
      segment: segment,
      exercise: { id: exId, type: segType, difficulty: raw.difficulty || "normal",
        data: { core: { skill: (raw.meta && raw.meta.skill) || null, chords: (raw.meta && raw.meta.chords) || (raw.meta && raw.meta.chordNames) || (raw.meta && raw.meta.chordName ? [raw.meta.chordName] : null), pattern: (raw.meta && raw.meta.pattern) || null, instrument: (raw.meta && raw.meta.instrument) || null, durationSec: raw.durationSec || 60, sessionNum: (raw.meta && raw.meta.guidedSession) || null, songId: (raw.meta && raw.meta.songId) || null, arrangementType: (raw.meta && raw.meta.arrangementType) || null, difficultyId: (raw.meta && raw.meta.difficultyId) || null, mode: (raw.meta && raw.meta.mode) || null },
          gameplay: { payload: (raw.meta && raw.meta.gameplayPayload) || null, preset: (raw.meta && raw.meta.enginePreset) || null, chartId: (raw.meta && raw.meta.chartId) || null } } }
    };
  }

  function SessionEngine(practiceEngine, curriculumEngine) {
    this.practiceEngine = practiceEngine;
    this.curriculumEngine = curriculumEngine;
    this.performanceMonitor = null;
  }

  SessionEngine.prototype.setPerformanceMonitor = function(performanceMonitor) {
    this.performanceMonitor = performanceMonitor || null;
    return this.performanceMonitor;
  };

  SessionEngine.shouldUseLegacySession = function(state) {
    return !!(state && state.active && state.chord && !state.sessionPlan);
  };

  SessionEngine.prototype.shouldUseLegacySession = function(state) {
    return SessionEngine.shouldUseLegacySession(state);
  };

  SessionEngine.prototype.buildSession = function(flow, context) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("session.build_plan", "sessionPlanBuildMs", function() {
        return self._buildSessionInternal(flow, context);
      });
    }
    return this._buildSessionInternal(flow, context);
  };

  SessionEngine.prototype._buildSessionInternal = function(flow, context) {
    context = context || {};
    if (flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return this.buildGuidedSession(context);
    if (flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return this.buildPerformanceSongSession(context);
    if (flow === SparkSessionTypes.FLOW_SPOTIFY_PLAY_ALONG) return this.buildSpotifyPlayAlongSession(context);
    if (flow !== SparkSessionTypes.FLOW_DAILY_PRACTICE) return this.buildEmptySession(flow, context);

    // 1. Analyze user via LearningBrain + FlowEngine
    var brainAnalysis = null;
    if (typeof SparkLearningBrain !== "undefined" && typeof S !== "undefined" && S.skillGraph) {
      var flowState = null;
      if (typeof SparkFlowEngine !== "undefined") {
        var recentEvents = (S.lastSessionEvents && S.lastSessionEvents.length) ? S.lastSessionEvents : [];
        var missCount = 0;
        for (var ei = 0; ei < recentEvents.length; ei++) { if (recentEvents[ei] && recentEvents[ei].type === "miss") missCount++; }
        flowState = SparkFlowEngine.buildFlowState({
          accuracy: S.performAccuracy || 0,
          combo: S.performCombo || 0,
          missStreak: missCount,
          timingConsistency: (S.playerProfile && S.playerProfile.consistency) || 0
        });
      }
      brainAnalysis = SparkLearningBrain.analyzeUser(S.skillGraph, flowState, S.weakSpots || null);
    }

    var curriculumContext = this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {});
    if (context.lessonId) curriculumContext.nextLessonId = context.lessonId;
    var difficulty = brainAnalysis && brainAnalysis.recommendedDifficultyId
      ? brainAnalysis.recommendedDifficultyId
      : "easy";
    if ((!brainAnalysis || !brainAnalysis.recommendedDifficultyId) && typeof S !== "undefined" && S.skillGraph) {
      var sk = S.skillGraph;
      var avg = ((sk.timing || 0) + (sk.rhythm || 0) + (sk.chordAccuracy || 0)) / 3;
      difficulty = avg > 0.8 ? "hard" : avg > 0.6 ? "normal" : "easy";
    }

    var segments = [];
    var exercises = [];

    // 2. Inject practice if brain recommends it
    if (brainAnalysis && (brainAnalysis.recommendation === "targeted_practice" || brainAnalysis.recommendation === "easy_practice" || brainAnalysis.recommendation === "practice")) {
      var brainDrill = (typeof SparkLearningBrain !== "undefined") ? SparkLearningBrain.generatePracticeFromWeakness(brainAnalysis, S.skillGraph) : null;
      if (brainDrill) {
        var pn = normalizeSegment({
          id: "brain_" + Date.now(),
          type: "practice",
          durationSec: brainDrill.duration || 30,
          meta: {
            skill: brainAnalysis.focusSkill,
            gameplayPayload: brainDrill,
            difficultyId: brainAnalysis.recommendedDifficultyId || difficulty,
            lane: brainDrill.lane,
            recommendationFocus: brainAnalysis.focusSkill,
            weakArea: brainAnalysis.primaryWeakArea || null
          }
        });
        segments.push(pn.segment);
        exercises.push(pn.exercise);
      }
    }

    // 3. Merge practice plan segments
    var practicePlan = this.practiceEngine.buildDailyPracticePlan({
      curriculum: curriculumContext,
      instrumentContext: context.instrumentContext || {},
      practiceTemplateId: context.practiceTemplateId || null,
      ukuleleMiniSessionId: context.ukuleleMiniSessionId || null,
      favoriteSongs: context.favoriteSongs || [],
      difficulty: difficulty
    });
    if (practicePlan.segments) { for (var pi = 0; pi < practicePlan.segments.length; pi++) segments.push(practicePlan.segments[pi]); }
    if (practicePlan.exercises) { for (var pe = 0; pe < practicePlan.exercises.length; pe++) exercises.push(practicePlan.exercises[pe]); }

    // 4. Inject challenge if brain recommends it
    if (brainAnalysis && brainAnalysis.recommendation === "challenge") {
      var challengePattern = brainAnalysis.drillType === "lane_drill" ? "D - U - D - U -" : "D U D U D U D U";
      var cn = normalizeSegment({
        id: "challenge_" + Date.now(),
        type: "challenge",
        durationSec: 30,
        meta: {
          skill: brainAnalysis.focusSkill,
          pattern: challengePattern,
          difficultyId: "hard",
          weakArea: brainAnalysis.primaryWeakArea || null,
          recommendationFocus: brainAnalysis.focusSkill
        }
      });
      segments.push(cn.segment);
      exercises.push(cn.exercise);
    }

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      instrumentType: context.instrumentContext ? context.instrumentContext.instrumentType : null,
      focus: brainAnalysis && brainAnalysis.focusSkill ? brainAnalysis.focusSkill : practicePlan.focus,
      lesson: curriculumContext.nextLesson || null,
      difficulty: difficulty,
      segments: segments,
      exercises: exercises,
      rewards: practicePlan.rewards || [{ type: "xp", amount: 40 }],
      context: {
        curriculum: curriculumContext,
        practiceTemplate: practicePlan.practiceTemplate || null,
        ukuleleMiniSession: practicePlan.miniSession || null,
        brainAnalysis: brainAnalysis,
        smartCoach: brainAnalysis ? {
          message: brainAnalysis.coachMessage,
          weakLane: brainAnalysis.weakLane,
          weakArea: brainAnalysis.primaryWeakArea || null,
          recommendedDifficultyId: brainAnalysis.recommendedDifficultyId || difficulty
        } : null
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

    return new SessionPlan({
      flow: "legacy_practice_session",
      instrumentId: instrumentContext.appId || null,
      instrumentType: instrumentContext.instrumentType || null,
      focus: chordName || mode,
      lesson: chordName ? { id: chordName } : null,
      difficulty: level,
      segments: [normalizeSegment({id: "legacy_practice_" + (chordName || mode || "session"), type: "practice", durationSec: 120, meta: {mode: mode, chordName: chordName}}).segment],
      exercises: [normalizeSegment({id: "legacy_practice_" + (chordName || mode || "session"), type: "practice", durationSec: 120, meta: {mode: mode, chordName: chordName}}).exercise],
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
      instrumentType: instrumentContext.instrumentType || null,
      focus: "chord_transition",
      lesson: chordNames.length ? { id: chordNames.join("_") } : null,
      difficulty: parseLevel(context.level),
      segments: [normalizeSegment({id: "legacy_practice_drill_" + (chordNames.join("_") || "default"), type: "practice", durationSec: 60, meta: {mode: "drill", chordNames: chordNames}}).segment],
      exercises: [normalizeSegment({id: "legacy_practice_drill_" + (chordNames.join("_") || "default"), type: "practice", durationSec: 60, meta: {mode: "drill", chordNames: chordNames}}).exercise],
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
    var guidedShell;
    if (isNaN(sessionNum) || sessionNum < 1) sessionNum = 1;

    var sessionIndex = Math.max(0, Math.min(sessions.length - 1, sessionNum - 1));
    var guidedPlan = sessions.length ? clone(sessions[sessionIndex]) : null;
    if (guidedPlan && !guidedPlan.instrument && instrumentContext.instrumentType) {
      guidedPlan.instrument = instrumentContext.instrumentType;
    }
    guidedPlan = normalizeGuidedPlan(guidedPlan);
    if (guidedPlan && guidedPlan.num != null) sessionNum = guidedPlan.num;
    guidedShell = buildGuidedSessionShell(guidedPlan, sessionNum, instrumentContext.instrumentType);

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      instrumentId: instrumentContext.appId || null,
      instrumentType: instrumentContext.instrumentType || null,
      focus: "guided",
      lesson: guidedPlan,
      difficulty: guidedPlan ? guidedPlan.level || null : null,
      segments: guidedShell.segments,
      exercises: guidedShell.exercises,
      rewards: [{ type: "xp", amount: 30 }],
      context: {
        guidedPlan: guidedPlan,
        guidedSession: sessionNum,
        totalGuidedSessions: sessions.length,
        guidedShellDurationSec: guidedShell.totalDurationSec
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
      instrumentType: instrumentContext.instrumentType || null,
      focus: "performance",
      lesson: song ? { id: songId } : null,
      difficulty: difficultyId,
      segments: song ? [normalizeSegment({id: "performance_song_" + songId, type: "song", durationSec: estimateSongDurationSec(song), meta: {songId: songId, arrangementType: arrangementType, difficultyId: difficultyId}}).segment] : [],
      exercises: song ? [normalizeSegment({id: "performance_song_" + songId, type: "song", durationSec: estimateSongDurationSec(song), meta: {songId: songId, arrangementType: arrangementType, difficultyId: difficultyId}}).exercise] : [],
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


  /**
   * Build a Spotify play-along session.
   * Context must include: { trackId, difficulty, instrument, instrumentContext }
   * Returns a SessionPlan with a single "song" segment backed by a SparkPlayAlongChart.
   *
   * NOTE: This returns a Promise because chart generation is async (Spotify API).
   */
  SessionEngine.prototype.buildSpotifyPlayAlongSession = function(context) {
    context = context || {};
    var trackId = context.trackId;
    var difficulty = context.difficulty || "easy";
    var instrumentContext = context.instrumentContext || {};
    var instrument = context.instrument || instrumentContext.instrumentType || "guitar";

    if (!trackId) return Promise.resolve(this.buildEmptySession("spotify_play_along", context));

    var chartService = (typeof SparkChartGenerationService !== "undefined" && window.sparkChartService)
      ? window.sparkChartService : null;
    if (!chartService) return Promise.resolve(this.buildEmptySession("spotify_play_along", context));

    return chartService.generate({
      trackId: trackId,
      difficulty: difficulty,
      instrument: instrument
    }).then(function(playAlongChart) {
      var segId = "spotify_" + trackId + "_" + difficulty;
      var exId = "ex_spotify_" + trackId + "_" + difficulty;

      return new SessionPlan({
        flow: "spotify_play_along",
        instrumentId: instrumentContext.appId || null,
        instrumentType: instrumentContext.instrumentType || null,
        focus: "play_along",
        lesson: { id: trackId, type: "song" },
        difficulty: difficulty,
        segments: [{
          id: segId,
          type: "song",
          exerciseIds: [exId]
        }],
        exercises: [{
          id: exId,
          type: "song",
          difficulty: difficulty,
          data: {
            core: {
              songId: trackId,
              instrument: instrument,
              durationSec: playAlongChart.songChart ? (playAlongChart.songChart.song.durationSec || 240) : 240,
              spotifyTrackUri: playAlongChart.trackUri
            },
            gameplay: {
              payload: null,
              chart: playAlongChart.songChart,
              preset: "spark_learning",
              playAlongChart: playAlongChart
            }
          }
        }],
        rewards: [{ type: "xp", amount: 25 }],
        context: {
          spotifyPlayAlong: {
            trackId: trackId,
            difficulty: difficulty,
            instrument: instrument,
            playAlongChart: playAlongChart
          }
        }
      });
    });
  };

  SessionEngine.prototype.buildEmptySession = function(flow, context) {
    return new SessionPlan({
      flow: flow,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      instrumentType: context.instrumentContext ? context.instrumentContext.instrumentType : null,
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
    if (typeof resolvePerformanceSongId === "function") {
      return resolvePerformanceSongId(song, song && song.title);
    }
    return String(song && song.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  function normalizeGuidedPlan(plan) {
    var instrumentType;
    var blockActivities;
    var warmActivity;
    var drillActivity;
    var songActivity;
    var cooldownActivity;
    var newElement;
    var focusSong;
    var chordName;
    var completionPrompt;
    if (!plan) return null;
    if (plan.spark || plan.review || plan.newMove || plan.songSlice || plan.victoryLap) return plan;
    if (!Array.isArray(plan.blocks) || !plan.blocks.length) return plan;

    instrumentType = plan.instrument || plan.instrumentType || null;
    blockActivities = resolveGuidedBlockActivities(instrumentType, plan);
    warmActivity = blockActivities.warm_engine;
    drillActivity = blockActivities.drill;
    songActivity = blockActivities.song;
    cooldownActivity = blockActivities.cooldown;
    newElement = Array.isArray(plan.new_elements) && plan.new_elements.length
      ? plan.new_elements[0]
      : (plan.skill || "");
    focusSong = plan.focus_song || ((Array.isArray(plan.songs) && plan.songs.length) ? plan.songs[0] : "");
    chordName = extractGuidedChordName(plan.title, newElement);
    completionPrompt = plan.completion_criteria && plan.completion_criteria.prompt
      ? String(plan.completion_criteria.prompt)
      : (plan.completion && plan.completion.prompt ? String(plan.completion.prompt) : "");

    return {
      id: plan.id,
      num: plan.day != null ? plan.day : plan.num,
      day: plan.day != null ? plan.day : plan.num,
      title: plan.title || "Guided session",
      level: plan.level || 1,
      bpm: normalizeGuidedTempo(plan.blocks),
      spark: {
        text: firstGuidedActivityText(warmActivity && warmActivity.copy && warmActivity.copy.setup,
          plan.title ? (plan.title + ". Start with a quick, playable warm-up.") : "",
          "Start with a quick, playable warm-up.")
      },
      review: plan.day > 1 ? {
        text: firstGuidedActivityText(warmActivity && warmActivity.copy && warmActivity.copy.success,
          "Take a quick review pass before the new move.")
      } : null,
      newMove: {
        text: firstGuidedActivityText(drillActivity && drillActivity.copy && drillActivity.copy.setup,
          buildNewMoveText(newElement, plan.title)),
        chord: chordName,
        strum: null
      },
      songSlice: {
        text: firstGuidedActivityText(songActivity && songActivity.copy && songActivity.copy.setup,
          focusSong ? ("Play the " + focusSong + " slice with relaxed timing.") : "",
          "Play this short song slice with steady timing."),
        song: focusSong || null
      },
      victoryLap: {
        text: completionPrompt || firstGuidedActivityText(cooldownActivity && cooldownActivity.copy && cooldownActivity.copy.setup,
          buildVictoryLapText(plan.title))
      },
      source: plan.source || null,
      blocks: clone(plan.blocks),
      blockActivities: clone(blockActivities),
      new_elements: clone(plan.new_elements || (plan.skill ? [plan.skill] : [])),
      prerequisites: clone(plan.prerequisites || []),
      completion_criteria: clone(plan.completion_criteria || plan.completion || null),
      focus_song: focusSong || null
    };
  }

  function buildGuidedSessionShell(plan, sessionNum, instrumentType) {
    var fallback = normalizeSegment({
      id: "guided_session_" + sessionNum,
      type: "practice",
      durationSec: 300,
      meta: {
        guidedSession: sessionNum,
        instrument: instrumentType || null
      }
    });
    var shell = {
      segments: plan ? [fallback.segment] : [],
      exercises: plan ? [fallback.exercise] : [],
      totalDurationSec: plan ? 300 : 0
    };
    var segments = [];
    var exercises = [];
    var totalDurationSec = 0;
    var i;
    var block;
    var blockType;
    var activity;
    var normalized;
    if (!plan || !Array.isArray(plan.blocks) || !plan.blocks.length) return shell;
    for (i = 0; i < plan.blocks.length; i++) {
      block = plan.blocks[i];
      if (!block || !block.type) continue;
      blockType = block.type;
      activity = plan.blockActivities && plan.blockActivities[blockType]
        ? plan.blockActivities[blockType]
        : null;
      normalized = normalizeSegment({
        id: String(plan.id || ("guided_session_" + sessionNum)) + "_" + blockType,
        type: normalizeGuidedBlockSegmentType(blockType),
        label: buildGuidedBlockLabel(blockType, activity),
        desc: buildGuidedBlockDescription(activity, blockType),
        durationSec: parseGuidedBlockDurationSec(block, activity),
        meta: {
          guidedSession: sessionNum,
          guidedBlockType: blockType,
          activityId: block.activity_id || (activity && activity.id) || null,
          activityKind: activity && activity.kind ? activity.kind : null,
          instrument: instrumentType || plan.instrument || null
        }
      });
      totalDurationSec += normalized.segment.durationSec || 0;
      segments.push(normalized.segment);
      exercises.push(normalized.exercise);
    }
    if (!segments.length) return shell;
    return {
      segments: segments,
      exercises: exercises,
      totalDurationSec: totalDurationSec
    };
  }

  function resolveGuidedBlockActivities(instrumentType, plan) {
    var resolved = {
      warm_engine: null,
      drill: null,
      song: null,
      cooldown: null
    };
    var activities;
    var i;
    var block;
    if (!instrumentType || typeof SparkCurriculumV2 === "undefined" || !SparkCurriculumV2) return resolved;
    activities = typeof SparkCurriculumV2.getSessionActivities === "function"
      ? SparkCurriculumV2.getSessionActivities(instrumentType, plan.id)
      : [];
    for (i = 0; i < activities.length; i++) {
      if (activities[i] && activities[i].block_type && resolved[activities[i].block_type] == null) {
        resolved[activities[i].block_type] = clone(activities[i]);
      }
    }
    if (!Array.isArray(plan.blocks)) return resolved;
    for (i = 0; i < plan.blocks.length; i++) {
      block = plan.blocks[i];
      if (block && block.type && resolved[block.type] == null && typeof SparkCurriculumV2.getActivity === "function") {
        resolved[block.type] = clone(SparkCurriculumV2.getActivity(instrumentType, block.activity_id));
      }
    }
    return resolved;
  }

  function normalizeGuidedTempo(blocks) {
    var i;
    if (!Array.isArray(blocks)) return 80;
    for (i = 0; i < blocks.length; i++) {
      if (blocks[i] && blocks[i].tempo_bpm) return parseLevel(blocks[i].tempo_bpm);
    }
    return 80;
  }

  function normalizeGuidedBlockSegmentType(blockType) {
    if (blockType === "song") return "song";
    return "practice";
  }

  function parseGuidedBlockDurationSec(block, activity) {
    var duration = parseInt(block && block.duration_sec, 10);
    if (!isNaN(duration) && duration > 0) return duration;
    duration = parseInt(activity && activity.duration_sec, 10);
    if (!isNaN(duration) && duration > 0) return duration;
    return 60;
  }

  function buildGuidedBlockLabel(blockType, activity) {
    var labels = {
      warm_engine: "Warm Engine",
      drill: "Drill",
      song: "Song Slice",
      cooldown: "Cooldown"
    };
    var focusSong = humanizeGuidedToken(activity && activity.focus_song);
    if (blockType === "song" && focusSong) return "Song Slice: " + focusSong;
    return labels[blockType] || humanizeGuidedToken(blockType) || "Guided Block";
  }

  function buildGuidedBlockDescription(activity, blockType) {
    return firstGuidedActivityText(
      activity && activity.copy && activity.copy.setup,
      activity && activity.copy && activity.copy.success,
      humanizeGuidedToken(blockType)
    );
  }

  function buildNewMoveText(newElement, title) {
    var label = humanizeGuidedToken(newElement);
    if (label) return "Focus on " + label + " for this session.";
    if (title) return "Focus on the main move from " + title + ".";
    return "Practice the new move slowly and cleanly.";
  }

  function buildVictoryLapText(title) {
    if (title) return "Finish with one confident pass through " + title + ".";
    return "Finish with one confident pass.";
  }

  function firstGuidedActivityText() {
    var i;
    var token;
    for (i = 0; i < arguments.length; i++) {
      token = humanizeGuidedToken(arguments[i]);
      if (token) return token;
    }
    return "";
  }

  function humanizeGuidedToken(value) {
    if (!value) return "";
    return String(value)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");
  }

  function extractGuidedChordName(title, newElement) {
    var sources = [title, newElement];
    var i;
    var match;
    for (i = 0; i < sources.length; i++) {
      match = /(?:^|\s)(A|Am|A7|B|Bm|C|C7|D|Dm|D7|E|Em|E7|F|F#m|G|G7)(?:\s|$)/.exec(String(sources[i] || ""));
      if (match && match[1]) return match[1];
    }
    return null;
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
  if (typeof module !== "undefined") {
    module.exports = {
      SparkSuiteSessionEngine: SessionEngine
    };
  }
})();
