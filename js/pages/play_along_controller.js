// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {

  var LANE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D", "#96CEB4"];
  var HIT_LINE_X = 100;
  var PX_PER_MS = 0.3;
  var NOTE_WIDTH = 30;
  var NOTE_HEIGHT = 50;
  var LANE_HEIGHT = 60;
  var LANE_OFFSET_Y = 10;

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    var resultsEl = document.getElementById("play-along-results");
    if (!query || query.length < 2) {
      if (resultsEl) resultsEl.innerHTML = "";
      window._playAlongResults = [];
      return;
    }
    if (!window.sparkCore || !window.sparkCore.spotifySearch) return;

    window.sparkCore.spotifySearch.searchDebounced(query, function(tracks) {
      window._playAlongResults = tracks || [];
      var html = "";
      for (var i = 0; i < window._playAlongResults.length; i++) {
        var t = window._playAlongResults[i];
        var name = escapeForAttr(t.name || "");
        var artist = escapeForAttr(t.artist || "");
        var imgTag = t.image
          ? "<img src=\"" + escapeForAttr(t.image) + "\" width=\"40\" height=\"40\" class=\"song-item-art\"/>"
          : "";
        html += "<div class=\"song-item\" onclick=\"sparkPlayAlongSelect(" + i + ")\">"
          + imgTag
          + "<div class=\"song-item-info\">"
          + "<strong class=\"song-item-name\">" + name + "</strong>"
          + "<span class=\"song-item-artist\">" + artist + "</span>"
          + "</div>"
          + "<button class=\"btn btn-sm\" onclick=\"event.stopPropagation();sparkPlayAlongSaveTrack(" + i + ")\">Save</button>"
          + "</div>";
      }
      if (resultsEl) resultsEl.innerHTML = html;
    });
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    var track = window._playAlongResults && window._playAlongResults[index];
    if (!track) return;
    var difficulty = S.spotifyDifficulty || "easy";
    if (!window.sparkCore) return;

    clearSelectedDrillState();
    launchPlayAlongSession({
      trackId: track.id,
      trackUri: track.uri || null,
      title: track.name || null,
      artist: track.artist || null,
      difficulty: difficulty,
      instrument: "guitar"
    });
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    var demos = typeof window.getSparkPlayAlongDemos === "function" ? window.getSparkPlayAlongDemos() : [];
    var demo = demos[index] || null;
    if (!demo) return false;
    clearSelectedDrillState();
    launchPlayAlongSession({
      trackId: demo.trackId,
      trackUri: demo.trackUri || null,
      title: demo.title || null,
      artist: demo.artist || null,
      audioOffsetMs: demo.audioOffsetMs || 0,
      difficulty: demo.difficulty || (S.spotifyDifficulty || "easy"),
      instrument: demo.instrument || "guitar"
    });
    return true;
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent : [];
    var item = recent[index] || null;
    if (!item || !item.params) return false;
    clearSelectedDrillState();
    launchPlayAlongSession(clonePlainObject(item.params));
    return true;
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    var track = window._playAlongResults && window._playAlongResults[index];
    if (!track) return Promise.resolve(false);

    function persistSavedTrack(saved) {
      var tracks = Array.isArray(S.spotifySavedTracks) ? S.spotifySavedTracks.slice() : [];
      var replaced = false;
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i] && tracks[i].trackId === saved.trackId) {
          tracks[i] = saved;
          replaced = true;
          break;
        }
      }
      if (!replaced) tracks.unshift(saved);
      S.spotifySavedTracks = tracks.slice(0, 20);
      if (typeof saveState === "function") saveState();
      render();
      return true;
    }

    var baseSaved = {
      trackId: track.id,
      trackUri: track.uri || null,
      title: track.name || "Spotify Track",
      artist: track.artist || "",
      image: track.image || null,
      duration: track.duration || 0,
      bpm: null,
      source: "spotify",
      savedAt: Date.now(),
      params: {
        trackId: track.id,
        trackUri: track.uri || null,
        title: track.name || null,
        artist: track.artist || null,
        difficulty: S.spotifyDifficulty || "easy",
        instrument: "guitar"
      }
    };

    if (!window.sparkCore || !window.sparkCore.spotifyClient || typeof window.sparkCore.spotifyClient.getAudioFeatures !== "function") {
      return Promise.resolve(persistSavedTrack(baseSaved));
    }

    return window.sparkCore.spotifyClient.getAudioFeatures(track.id).then(function(features) {
      if (features && typeof features.tempo === "number") {
        baseSaved.bpm = Math.round(features.tempo);
      }
      return persistSavedTrack(baseSaved);
    }).catch(function() {
      return persistSavedTrack(baseSaved);
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    var tracks = Array.isArray(S.spotifySavedTracks) ? S.spotifySavedTracks : [];
    var item = tracks[index] || null;
    if (!item || !item.params) return false;
    clearSelectedDrillState();
    launchPlayAlongSession(clonePlainObject(item.params));
    return true;
  };

  window.sparkPlayAlongRemoveSaved = function(index) {
    var tracks = Array.isArray(S.spotifySavedTracks) ? S.spotifySavedTracks.slice() : [];
    if (index < 0 || index >= tracks.length) return false;
    tracks.splice(index, 1);
    S.spotifySavedTracks = tracks;
    if (typeof saveState === "function") saveState();
    render();
    return true;
  };

  window.sparkPlayAlongClearSaved = function() {
    S.spotifySavedTracks = [];
    if (typeof saveState === "function") saveState();
    render();
    return true;
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks : [];
    var item = bookmarks[index] || null;
    if (!item || !item.params) return false;
    clearSelectedDrillState();
    S.playAlongLoop = true;
    S.playAlongLoopTarget = "section";
    S.playAlongSectionIndex = item.sectionIndex || 0;
    launchPlayAlongSession(clonePlainObject(item.params));
    return true;
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks : [];
    for (var i = 0; i < bookmarks.length; i++) {
      var item = bookmarks[i];
      if (item && item.trackId === trackId && Number(item.sectionIndex) === Number(sectionIndex)) {
        return window.sparkPlayAlongLaunchBookmark(i);
      }
    }
    return false;
  };

  window.sparkPlayAlongRemoveRecent = function(index) {
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent.slice() : [];
    if (index < 0 || index >= recent.length) return false;
    recent.splice(index, 1);
    S.playAlongRecent = recent;
    render();
    return true;
  };

  window.sparkPlayAlongClearRecent = function() {
    S.playAlongRecent = [];
    render();
    return true;
  };

  window.sparkPlayAlongRemoveBookmark = function(index) {
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks.slice() : [];
    if (index < 0 || index >= bookmarks.length) return false;
    bookmarks.splice(index, 1);
    S.playAlongBookmarks = bookmarks;
    render();
    return true;
  };

  window.sparkPlayAlongClearBookmarks = function() {
    S.playAlongBookmarks = [];
    render();
    return true;
  };

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    S.spotifyDifficulty = level;
    if (window.sparkCore) {
      window.sparkCore.updateRuntimeState({ spotifyDifficulty: level });
    }
    render();
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    if (!file) return;
    if (!window.sparkCore) return;

    clearSelectedDrillState();
    launchPlayAlongSession({
      audioFile: file,
      difficulty: S.spotifyDifficulty || "easy",
      instrument: "guitar"
    });
  };

  // ---- Game Loop ----

  window.sparkPlayAlongStartLoop = function() {
    if (window._playAlongAnimFrame) {
      cancelAnimationFrame(window._playAlongAnimFrame);
    }

    function loop() {
      if (!window.sparkCore) return;

      if (enforceLoopWindow()) {
        return;
      }
      var result = window.sparkCore.processPlayAlongFrame();

      if (result) {
        renderHighway(result);
        renderFretboard(result);
        updateSessionTelemetry(result);
        updateDebugState(result);
      }

      window._playAlongAnimFrame = requestAnimationFrame(loop);
    }

    window._playAlongAnimFrame = requestAnimationFrame(loop);
  };

  // ---- Highway Renderer ----

  function renderHighway(result) {
    var canvas = document.getElementById("play-along-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = canvas.width;
    var h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Hit line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HIT_LINE_X, 0);
    ctx.lineTo(HIT_LINE_X, h);
    ctx.stroke();

    // Draw visible notes
    var notes = result.visibleNotes || result.notes || [];
    var currentTimeMs = result.timeMs != null ? result.timeMs : (result.currentTimeMs != null ? result.currentTimeMs : (result.time || 0));

    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      var x = HIT_LINE_X + (note.time - currentTimeMs) * PX_PER_MS;
      var lane = typeof note.lane === "number" ? note.lane : 0;
      var y = lane * LANE_HEIGHT + LANE_OFFSET_Y;
      var color = LANE_COLORS[lane] || LANE_COLORS[0];

      ctx.fillStyle = color;
      ctx.fillRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    }
  }

  // ---- Fretboard Renderer ----

  function renderFretboard(result) {
    var canvas = document.getElementById("play-along-fretboard");
    if (!canvas) return;
    if (window.sparkFretboardRenderer && typeof window.sparkFretboardRenderer.draw === "function") {
      window.sparkFretboardRenderer.draw(canvas, result);
    }
  }

  // ---- Debug State ----

  function updateDebugState(result) {
    if (typeof SparkDebugState !== "undefined" && SparkDebugState.update) {
      SparkDebugState.update(result);
    }
  }

  function updateSessionTelemetry(result) {
    var range = S.playAlongLoopRange || null;
    var timeMs = result && result.timeMs != null ? result.timeMs : (window.sparkCore && typeof window.sparkCore.getPlaybackTimeMs === "function" ? window.sparkCore.getPlaybackTimeMs() : 0);
    S.playAlongNowMs = timeMs;
    S.playAlongCurrentSection = resolveCurrentSectionLabel(window.sparkCore && window.sparkCore._activeChart, timeMs);

    var timeEl = document.getElementById("play-along-session-time");
    if (timeEl) {
      timeEl.textContent = formatMs(timeMs);
    }

    var sectionEl = document.getElementById("play-along-session-section");
    if (sectionEl) {
      sectionEl.textContent = S.playAlongCurrentSection || "Section: Intro";
    }

    if (!range || range.startMs == null || range.endMs == null || range.endMs <= range.startMs) return;
    var clamped = Math.max(range.startMs, Math.min(range.endMs, timeMs));
    var pct = Math.round(((clamped - range.startMs) / (range.endMs - range.startMs)) * 100);
    S.playAlongLoopProgress = pct;

    var repsEl = document.getElementById("play-along-loop-reps");
    if (repsEl) {
      repsEl.textContent = formatRepStatus();
    }

    var progressEl = document.getElementById("play-along-loop-progress");
    if (progressEl) {
      progressEl.textContent = "Loop Progress: " + pct + "%";
    }

    var hint = updateCoachHint();
    var hintEl = document.getElementById("play-along-coach-hint");
    if (hintEl) {
      hintEl.textContent = hint;
    }
  }

  // ---- Stop ----

  window.sparkPlayAlongStop = function() {
    var outcome = null;
    if (window._playAlongAnimFrame) {
      cancelAnimationFrame(window._playAlongAnimFrame);
      window._playAlongAnimFrame = null;
    }
    if (window.sparkCore) {
      outcome = window.sparkCore.completePlayAlongSession();
      outcome = enrichOutcomeWithLoopSummary(outcome);
      window.sparkCore.lastSessionOutcome = outcome;
    }
    S.screen = SCR.PLAY_ALONG_RESULTS;
    render();

    // Draw heatmap after render
    setTimeout(function() {
      var heatmapCanvas = document.getElementById("play-along-heatmap");
      if (heatmapCanvas && window.sparkCore && window.sparkCore.drawHeatmap) {
        window.sparkCore.drawHeatmap(heatmapCanvas);
      }
    }, 0);
  };

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = function() {
    window._playAlongDebug = !window._playAlongDebug;

    if (window._playAlongDebug && typeof SparkDebugDashboard !== "undefined") {
      window._playAlongDashboard = new SparkDebugDashboard(document.body);
      window._playAlongDashboard.show();
    } else if (!window._playAlongDebug && window._playAlongDashboard) {
      window._playAlongDashboard.hide();
    }
  };

  // ---- Play Again ----

  window.sparkPlayAlongAgain = function() {
    if (window.sparkCore && window.sparkCore._activeParams) {
      launchPlayAlongSession(window.sparkCore._activeParams);
    } else {
      S.screen = SCR.PLAY_ALONG;
      render();
    }
  };

  window.sparkPlayAlongReplay = function() {
    return window.sparkPlayAlongAgain();
  };

  window.sparkPlayAlongReplayDrill = function() {
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
    if (drills.length > 0) {
      return window.sparkPlayAlongStartDrill(0);
    }
    return window.sparkPlayAlongReplay();
  };

  window.sparkPlayAlongReplayFullSong = function() {
    S.playAlongSelectedDrill = null;
    S.playAlongLoop = false;
    S.playAlongLoopRange = null;
    S.playAlongLoopTarget = "section";
    S.playAlongLoopIteration = 0;
    S.playAlongLoopProgress = 0;
    S.playAlongCoachHint = "";
    if (window.sparkCore && window.sparkCore._activeParams) {
      return launchPlayAlongSession(clonePlainObject(window.sparkCore._activeParams));
    }
    return false;
  };

  window.sparkPlayAlongTogglePause = function() {
    if (!window.sparkCore) return false;

    if (S.playAlongPaused) {
      resumePlayAlongTransport();
      S.playAlongPaused = false;
    } else {
      pausePlayAlongTransport();
      S.playAlongPaused = true;
    }
    render();
    return S.playAlongPaused;
  };

  window.sparkPlayAlongToggleLoop = function() {
    S.playAlongLoop = !S.playAlongLoop;
    if (S.playAlongLoop) {
      S.playAlongLoopRange = resolveLoopRange();
    } else {
      S.playAlongLoopRange = null;
    }
    render();
    return !!S.playAlongLoop;
  };

  window.sparkPlayAlongSetLoopTarget = function(target) {
    if (target !== "drill" && target !== "section") return false;
    S.playAlongLoopTarget = target;
    S.playAlongLoopRange = resolveLoopRange();
    render();
    return true;
  };

  window.sparkPlayAlongPrevSection = function() {
    return stepPlayAlongSection(-1);
  };

  window.sparkPlayAlongNextSection = function() {
    return stepPlayAlongSection(1);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    var bookmark = buildCurrentSectionBookmark();
    if (!bookmark) return false;
    rememberPlayAlongBookmark(bookmark);
    render();
    return true;
  };

  window.sparkPlayAlongJumpToWeakSection = function() {
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    var sectionSummary = outcome && outcome.sectionSummary ? outcome.sectionSummary : null;
    if (!sectionSummary || !window.sparkCore || !window.sparkCore._activeParams) return false;
    clearSelectedDrillState();
    S.playAlongLoop = true;
    S.playAlongLoopTarget = "section";
    S.playAlongSectionIndex = Number(sectionSummary.sectionIndex || 0);
    return launchPlayAlongSession(clonePlainObject(window.sparkCore._activeParams));
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    var params = null;
    if (window.sparkCore && window.sparkCore._activeParams && window.sparkCore._activeParams.trackId === trackId) {
      params = clonePlainObject(window.sparkCore._activeParams);
    }
    if (!params) {
      var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent : [];
      for (var i = 0; i < recent.length; i++) {
        if (recent[i] && recent[i].trackId === trackId && recent[i].params) {
          params = clonePlainObject(recent[i].params);
          break;
        }
      }
    }
    if (!params) return false;
    clearSelectedDrillState();
    S.playAlongLoop = true;
    S.playAlongLoopTarget = "section";
    S.playAlongSectionIndex = Number(sectionIndex || 0);
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongPickNew = function() {
    clearSelectedDrillState();
    S.screen = SCR.PLAY_ALONG;
    render();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
    var drill = drills[index] || null;
    if (!drill) return false;
    S.playAlongSelectedDrill = drill;
    S.playAlongLoop = true;
    S.playAlongLoopTarget = "drill";
    S.playAlongLoopRange = resolveLoopRange();
    S.playAlongPaused = false;
    if (window.sparkCore && window.sparkCore._activeParams) {
      launchPlayAlongSession(window.sparkCore._activeParams);
      return true;
    }
    S.screen = SCR.PLAY_ALONG;
    render();
    return true;
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    S.screen = SCR.PLAY_ALONG;
    render();
  };

  // ---- Utility ----

  function escapeForAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function pausePlayAlongTransport() {
    var core = window.sparkCore;
    var pausedMs = typeof core.getPlaybackTimeMs === "function" ? core.getPlaybackTimeMs() : 0;
    core._pausedPlaybackTimeMs = pausedMs;
    if (core.audioEngine && typeof core.audioEngine.pause === "function") core.audioEngine.pause();
    else if (core.audioEngine && typeof core.audioEngine.stop === "function") core.audioEngine.stop();
    if (core.stemMixer && typeof core.stemMixer.pause === "function") core.stemMixer.pause();
    else if (core.stemMixer && typeof core.stemMixer.stop === "function") core.stemMixer.stop();
    if (core.playbackEngine && typeof core.playbackEngine.pause === "function") core.playbackEngine.pause();
    else if (core.playbackEngine && typeof core.playbackEngine.stop === "function") core.playbackEngine.stop();
  }

  function resumePlayAlongTransport() {
    var core = window.sparkCore;
    var offsetMs = typeof core._pausedPlaybackTimeMs === "number" ? core._pausedPlaybackTimeMs : 0;
    var params = core._activeParams || {};

    if (core.audioEngine && core.audioEngine.buffer && typeof core.audioEngine.play === "function") {
      core.audioEngine.play(offsetMs / 1000);
    } else if (core.stemMixer && typeof core.stemMixer.seek === "function") {
      core.stemMixer.seek(offsetMs / 1000);
      if (!core.stemMixer.isPlaying || !core.stemMixer.isPlaying()) {
        core.stemMixer.play(offsetMs / 1000);
      }
    } else if (params.trackUri && core.playbackEngine && typeof core.playbackEngine.resume === "function") {
      core.playbackEngine.resume(offsetMs, {
        audioOffsetMs: params.audioOffsetMs || 0,
        deviceId: params.deviceId
      }).catch(function() {});
    } else if (params.trackUri && core.playbackEngine && typeof core.playbackEngine.start === "function") {
      core.playbackEngine.start(params.trackUri, {
        audioOffsetMs: params.audioOffsetMs || 0,
        deviceId: params.deviceId
      }).then(function() {
        if (typeof core.playbackEngine.seekTo === "function") {
          return core.playbackEngine.seekTo(offsetMs);
        }
      }).catch(function() {});
    }
    core._pausedPlaybackTimeMs = null;
  }

  function resolveLoopRange() {
    var selected = S.playAlongSelectedDrill || null;
    var target = S.playAlongLoopTarget || (selected ? "drill" : "section");
    if (target === "drill" && selected && selected.startMs != null && selected.endMs != null) {
      return { startMs: selected.startMs, endMs: selected.endMs };
    }

    var chart = window.sparkCore && window.sparkCore._activeChart;
    if (chart && Array.isArray(chart.sections) && chart.sections.length) {
      syncPlayAlongSectionIndex();
      var section = chart.sections[S.playAlongSectionIndex || 0] || {};
      var startMs = section.startMs != null ? section.startMs : section.start;
      var endMs = section.endMs != null ? section.endMs : section.end;
      if (startMs != null && endMs != null && endMs > startMs) {
        return { startMs: startMs, endMs: endMs };
      }
    }

    return null;
  }

  function clearSelectedDrillState() {
    S.playAlongSelectedDrill = null;
    S.playAlongLoop = false;
    S.playAlongLoopRange = null;
    S.playAlongLoopTarget = null;
    S.playAlongPaused = false;
    S.playAlongLoopIteration = 0;
    S.playAlongLoopProgress = 0;
    S.playAlongCoachHint = "";
    S.playAlongCurrentSection = "";
    S.playAlongNowMs = 0;
    S.playAlongSectionIndex = 0;
  }

  function launchPlayAlongSession(params) {
    if (!window.sparkCore || !params) return Promise.resolve(false);
    rememberPlayAlongLaunch(params);
    return window.sparkCore.startPlayAlongSession(params).then(function() {
      S.screen = SCR.PLAY_ALONG_SESSION;
      S.playAlongPaused = false;
      applySelectedDrillState();
      render();
      sparkPlayAlongStartLoop();
      return true;
    });
  }

  function applySelectedDrillState() {
    var selected = S.playAlongSelectedDrill || null;
    if (!selected) {
      if (!S.playAlongLoopTarget) S.playAlongLoopTarget = "section";
      syncPlayAlongSectionIndex();
      S.playAlongLoopRange = S.playAlongLoop ? resolveLoopRange() : null;
      return;
    }

    S.playAlongLoop = true;
    S.playAlongLoopTarget = "drill";
    S.playAlongLoopRange = resolveLoopRange();
    S.playAlongLoopIteration = 1;
    S.playAlongLoopProgress = 0;
    if (selected.speed != null) {
      S.playAlongSpeed = String(selected.speed);
      setPlayAlongPlaybackRate(selected.speed);
    } else {
      S.playAlongSpeed = "1.0";
    }

    if (S.playAlongLoopRange && S.playAlongLoopRange.startMs != null) {
      seekPlayAlongToMs(S.playAlongLoopRange.startMs);
    }
  }

  function setPlayAlongPlaybackRate(speed) {
    var core = window.sparkCore;
    if (!core || typeof speed !== "number" || !isFinite(speed) || speed <= 0) return;
    if (core.audioEngine && typeof core.audioEngine.setPlaybackRate === "function") {
      core.audioEngine.setPlaybackRate(speed);
    }
    if (core.stemMixer && typeof core.stemMixer.setPlaybackRate === "function") {
      core.stemMixer.setPlaybackRate(speed);
    }
  }

  function enforceLoopWindow() {
    if (!S.playAlongLoop || S.playAlongPaused || !window.sparkCore) return false;
    var range = S.playAlongLoopRange || resolveLoopRange();
    if (!range || range.startMs == null || range.endMs == null || range.endMs <= range.startMs) return false;
    S.playAlongLoopRange = range;

    var nowMs = typeof window.sparkCore.getPlaybackTimeMs === "function" ? window.sparkCore.getPlaybackTimeMs() : 0;
    if (nowMs < range.endMs) return false;

    var selected = S.playAlongSelectedDrill || null;
    var targetReps = selected && selected.repetitions != null ? Number(selected.repetitions) : null;
    var currentRep = Math.max(1, Number(S.playAlongLoopIteration || 1));
    if (targetReps != null && targetReps > 0 && currentRep >= targetReps) {
      S.playAlongLoop = false;
      S.playAlongLoopProgress = 100;
      sparkPlayAlongStop();
      return true;
    }

    S.playAlongLoopIteration = Math.max(1, Number(S.playAlongLoopIteration || 1)) + 1;
    S.playAlongLoopProgress = 0;
    seekPlayAlongToMs(range.startMs);
    return false;
  }

  function seekPlayAlongToMs(targetMs) {
    var core = window.sparkCore;
    if (!core) return false;

    core._pausedPlaybackTimeMs = targetMs;

    if (core.audioEngine && core.audioEngine.buffer && typeof core.audioEngine.play === "function") {
      core.audioEngine.play(targetMs / 1000);
      core._pausedPlaybackTimeMs = null;
      return true;
    }

    if (core.stemMixer && typeof core.stemMixer.seek === "function") {
      core.stemMixer.seek(targetMs / 1000);
      core._pausedPlaybackTimeMs = null;
      return true;
    }

    if (core.playbackEngine && typeof core.playbackEngine.seekTo === "function") {
      core.playbackEngine.seekTo(targetMs).then(function() {
        core._pausedPlaybackTimeMs = null;
      }).catch(function() {});
      return true;
    }

    return false;
  }

  function formatRepStatus() {
    var current = Math.max(1, Number(S.playAlongLoopIteration || 1));
    var selected = S.playAlongSelectedDrill || null;
    var target = selected && selected.repetitions != null ? selected.repetitions : null;
    return target != null ? ("Rep " + current + " / " + target) : ("Rep " + current);
  }

  function updateCoachHint() {
    var core = window.sparkCore;
    var accuracy = core && core.performanceTracker && typeof core.performanceTracker.getAccuracy === "function"
      ? core.performanceTracker.getAccuracy()
      : null;
    var hint = "";
    var currentRep = Math.max(1, Number(S.playAlongLoopIteration || 1));
    if (typeof accuracy === "number") {
      if (accuracy < 0.55) hint = currentRep >= 2 ? "Accuracy is still low after multiple reps. Slow the drill down and keep the loop tight." : (S.playAlongSelectedDrill ? "Stay in the loop and clean up the timing before speeding up." : "Accuracy is slipping. Try a loop or drop to 0.75x.");
      else if (accuracy < 0.75) hint = currentRep >= 3 ? "You are improving, but not enough yet. Give this section two more focused reps." : (S.playAlongLoop ? "One more clean rep will help lock this in." : "You are close. Loop this section for another pass.");
      else if (accuracy >= 0.9 && S.playAlongSelectedDrill) hint = currentRep >= 2 ? "Strong recovery. Finish the last rep, then return to the full song." : "Great control. Finish the target reps, then move back to the full song.";
    }
    S.playAlongCoachHint = hint;
    return hint;
  }

  function enrichOutcomeWithLoopSummary(outcome) {
    outcome = outcome || {};
    var selected = S.playAlongSelectedDrill || null;
    var range = S.playAlongLoopRange || null;
    var currentBookmark = buildCurrentSectionBookmark();
    if (!selected && !range) return outcome;
    outcome.drillSummary = {
      label: selected ? (selected.label || selected.focus || selected.type || "Focused Practice") : "Loop Practice",
      completedReps: Math.max(0, Number(S.playAlongLoopIteration || 0)),
      targetReps: selected && selected.repetitions != null ? selected.repetitions : null,
      metTarget: !!(selected && selected.repetitions != null && Number(S.playAlongLoopIteration || 0) >= Number(selected.repetitions || 0)),
      loopWindowLabel: range && range.startMs != null && range.endMs != null ? (formatMs(range.startMs) + " - " + formatMs(range.endMs)) : null
    };
    if (currentBookmark) {
      outcome.sectionSummary = {
        sectionIndex: currentBookmark.sectionIndex,
        sectionLabel: currentBookmark.sectionLabel,
        startMs: currentBookmark.startMs,
        endMs: currentBookmark.endMs
      };
    }
    return outcome;
  }

  function formatMs(ms) {
    ms = Math.max(0, Math.round(ms || 0));
    var totalSec = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSec / 60);
    var seconds = totalSec % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function resolveCurrentSectionLabel(chart, timeMs) {
    if (!chart || !Array.isArray(chart.sections) || !chart.sections.length) return "Section: Intro";
    for (var i = 0; i < chart.sections.length; i++) {
      var section = chart.sections[i] || {};
      var startMs = section.startMs != null ? section.startMs : section.start;
      var endMs = section.endMs != null ? section.endMs : section.end;
      if (startMs == null || endMs == null) continue;
      if (timeMs >= startMs && timeMs < endMs) {
        S.playAlongSectionIndex = i;
        return "Section: " + (section.name || ("Part " + (i + 1)));
      }
    }
    S.playAlongSectionIndex = Math.max(0, chart.sections.length - 1);
    return "Section: " + ((chart.sections[chart.sections.length - 1] && chart.sections[chart.sections.length - 1].name) || "Outro");
  }

  function rememberPlayAlongLaunch(params) {
    if (!params || params.audioFile) return;
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent.slice() : [];
    var normalizedParams = clonePlainObject(params);
    var entry = {
      trackId: normalizedParams.trackId || null,
      title: normalizedParams.title || normalizedParams.trackId || "Untitled Song",
      artist: normalizedParams.artist || null,
      difficulty: normalizedParams.difficulty || null,
      instrument: normalizedParams.instrument || null,
      transportMode: normalizedParams.trackUri ? "spotify" : (normalizedParams.stems ? "stems" : "generated"),
      params: normalizedParams
    };
    recent = recent.filter(function(item) {
      return !!item && item.trackId !== entry.trackId;
    });
    recent.unshift(entry);
    S.playAlongRecent = recent.slice(0, 5);
  }

  function clonePlainObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function buildCurrentSectionBookmark() {
    var chart = window.sparkCore && window.sparkCore._activeChart;
    var params = window.sparkCore && window.sparkCore._activeParams ? window.sparkCore._activeParams : null;
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    if (!params || !sections.length) return null;
    syncPlayAlongSectionIndex();
    var index = Number(S.playAlongSectionIndex || 0);
    var section = sections[index] || null;
    if (!section) return null;
    return {
      trackId: params.trackId || null,
      title: params.title || (chart && chart.trackId) || "Untitled Song",
      artist: params.artist || null,
      sectionIndex: index,
      sectionLabel: section.name || ("Part " + (index + 1)),
      startMs: section.startMs != null ? section.startMs : section.start,
      endMs: section.endMs != null ? section.endMs : section.end,
      params: clonePlainObject(params)
    };
  }

  function rememberPlayAlongBookmark(bookmark) {
    if (!bookmark) return;
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks.slice() : [];
    bookmarks = bookmarks.filter(function(item) {
      return !(item && item.trackId === bookmark.trackId && item.sectionIndex === bookmark.sectionIndex);
    });
    bookmarks.unshift(bookmark);
    S.playAlongBookmarks = bookmarks.slice(0, 8);
  }

  function stepPlayAlongSection(delta) {
    var chart = window.sparkCore && window.sparkCore._activeChart;
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    if (!sections.length) return false;
    var index = Number(S.playAlongSectionIndex || 0);
    if (!isFinite(index)) index = 0;
    index += delta;
    if (index < 0 || index >= sections.length) return false;
    S.playAlongSectionIndex = index;
    if (S.playAlongLoopTarget === "section") {
      S.playAlongLoopRange = resolveLoopRange();
    }
    var section = sections[index] || {};
    var startMs = section.startMs != null ? section.startMs : section.start;
    if (startMs != null) {
      seekPlayAlongToMs(startMs);
      S.playAlongNowMs = startMs;
      S.playAlongCurrentSection = "Section: " + (section.name || ("Part " + (index + 1)));
    }
    render();
    return true;
  }

  function syncPlayAlongSectionIndex() {
    var chart = window.sparkCore && window.sparkCore._activeChart;
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    if (!sections.length) {
      S.playAlongSectionIndex = 0;
      return;
    }
    var current = Number(S.playAlongSectionIndex || 0);
    if (!isFinite(current) || current < 0) current = 0;
    if (current >= sections.length) current = sections.length - 1;
    S.playAlongSectionIndex = current;
  }


  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = function() {
    // Check if auth manager exists
    if (typeof SparkSpotifyAuthManager === "undefined") {
      alert("Spotify integration not loaded.");
      return;
    }

    var authManager = new SparkSpotifyAuthManager();

    // Check if already connected
    if (authManager.isConnected()) {
      authManager.getValidToken().then(function(token) {
        if (token && window.sparkCore && typeof window.sparkCore.initSpotify === "function") {
          window.sparkCore.initSpotify(token);
          if (typeof render === "function") render();
        }
      });
      return;
    }

    // Need to configure first — check if client ID is set
    var clientId = localStorage.getItem("sparksuite_spotify_client_id");
    if (!clientId) {
      clientId = prompt("Enter your Spotify Client ID:");
      if (!clientId) return;
      localStorage.setItem("sparksuite_spotify_client_id", clientId.trim());
    }

    // Determine redirect URI based on environment
    var redirectUri = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") + "index.html";
    if (redirectUri.indexOf("file://") === 0) {
      redirectUri = "https://localhost:3456/callback";
    }

    SparkSpotifyAuthManager.configure({
      clientId: clientId.trim(),
      redirectUri: redirectUri
    });

    // Start OAuth flow
    var url = authManager.getAuthUrl();
    if (typeof window.electron !== "undefined" && window.electron.shell) {
      // Desktop: open in system browser
      window.electron.shell.openExternal(url);
    } else {
      window.location.href = url;
    }
  };

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = function() {
    window.sparkPlayAlongConnectSpotify();
  };

})();
