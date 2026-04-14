(function() {
  function getPlayAlongState() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      return SparkState.getRoot();
    }
    if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
      return globalThis.__sparkState;
    }
    return null;
  }

  function readPlayAlongPath(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = getPlayAlongState();
    if (!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function writePlayAlongPath(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = getPlayAlongState();
    if (!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if (parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function getPlayAlongCore() {
    return typeof window !== "undefined" ? window.sparkCore || null : null;
  }

  function getActiveChart(core) {
    return core && typeof core.getActivePlayAlongChart === "function"
      ? core.getActivePlayAlongChart()
      : null;
  }

  function getActiveParams(core) {
    return core && typeof core.getActivePlayAlongParams === "function"
      ? core.getActivePlayAlongParams()
      : null;
  }

  function clonePlainObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function formatMs(ms) {
    ms = Math.max(0, Math.round(ms || 0));
    var totalSec = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSec / 60);
    var seconds = totalSec % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function asPercent(value) {
    if (typeof value !== "number") return 0;
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  function SparkPlayAlongStateService() {}

  SparkPlayAlongStateService.prototype.cloneValue = function(value) {
    return clonePlainObject(value);
  };

  SparkPlayAlongStateService.prototype.readValue = function(path, fallback) {
    return readPlayAlongPath(path, fallback);
  };

  SparkPlayAlongStateService.prototype.writeValue = function(path, value) {
    return writePlayAlongPath(path, value);
  };

  SparkPlayAlongStateService.prototype.persistState = function() {
    if (typeof saveState === "function") saveState();
  };

  SparkPlayAlongStateService.prototype.getRecent = function() {
    var state = getPlayAlongState();
    return state && Array.isArray(state.playAlongRecent) ? state.playAlongRecent : [];
  };

  SparkPlayAlongStateService.prototype.getBookmarks = function() {
    var state = getPlayAlongState();
    return state && Array.isArray(state.playAlongBookmarks) ? state.playAlongBookmarks : [];
  };

  SparkPlayAlongStateService.prototype.getSavedTracks = function() {
    var state = getPlayAlongState();
    return state && Array.isArray(state.spotifySavedTracks) ? state.spotifySavedTracks : [];
  };

  SparkPlayAlongStateService.prototype.getDifficulty = function() {
    return this.readValue("spotifyDifficulty", "easy") || "easy";
  };

  SparkPlayAlongStateService.prototype.setDifficulty = function(level) {
    var core = getPlayAlongCore();
    this.writeValue("spotifyDifficulty", level);
    if (core && typeof core.updateRuntimeState === "function") {
      core.updateRuntimeState({ spotifyDifficulty: level });
    }
    return level;
  };

  SparkPlayAlongStateService.prototype.getCore = function() {
    return getPlayAlongCore();
  };

  SparkPlayAlongStateService.prototype.startSession = function(params) {
    var core = getPlayAlongCore();
    if (!core || typeof core.startPlayAlongSession !== "function") return Promise.resolve(false);
    return core.startPlayAlongSession(params);
  };

  SparkPlayAlongStateService.prototype.startRenderLoop = function(options) {
    var core = getPlayAlongCore();
    if (!core || typeof core.startPlayAlongRenderLoop !== "function") return false;
    return core.startPlayAlongRenderLoop(options || {});
  };

  SparkPlayAlongStateService.prototype.stopRenderLoop = function() {
    var core = getPlayAlongCore();
    if (!core || typeof core.stopPlayAlongRenderLoop !== "function") return false;
    core.stopPlayAlongRenderLoop();
    return true;
  };

  SparkPlayAlongStateService.prototype.completeSession = function() {
    var core = getPlayAlongCore();
    if (!core || typeof core.completePlayAlongSession !== "function") return null;
    return core.completePlayAlongSession();
  };

  SparkPlayAlongStateService.prototype.drawHeatmap = function(canvas) {
    var core = getPlayAlongCore();
    if (!core || !canvas || typeof core.drawHeatmap !== "function") return false;
    core.drawHeatmap(canvas);
    return true;
  };

  SparkPlayAlongStateService.prototype.pauseTransport = function() {
    var core = getPlayAlongCore();
    if (!core || typeof core.pausePlayAlongTransport !== "function") return false;
    core.pausePlayAlongTransport();
    return true;
  };

  SparkPlayAlongStateService.prototype.resumeTransport = function() {
    var core = getPlayAlongCore();
    if (!core || typeof core.resumePlayAlongTransport !== "function") return false;
    core.resumePlayAlongTransport();
    return true;
  };

  SparkPlayAlongStateService.prototype.seekToMs = function(targetMs) {
    var core = getPlayAlongCore();
    if (!core || typeof core.seekPlayAlongToMs !== "function") return false;
    return core.seekPlayAlongToMs(targetMs);
  };

  SparkPlayAlongStateService.prototype.setPlaybackRate = function(speed) {
    var core = getPlayAlongCore();
    if (!core || typeof core.setPlayAlongPlaybackRate !== "function") return false;
    core.setPlayAlongPlaybackRate(speed);
    return true;
  };

  SparkPlayAlongStateService.prototype.setLastOutcome = function(outcome) {
    var core = getPlayAlongCore();
    if (!core || typeof core.setLastSessionOutcome !== "function") return false;
    core.setLastSessionOutcome(outcome);
    return true;
  };

  SparkPlayAlongStateService.prototype.initSpotify = function(token) {
    var core = getPlayAlongCore();
    if (!core || typeof core.initSpotify !== "function") return false;
    core.initSpotify(token);
    return true;
  };

  SparkPlayAlongStateService.prototype.getRuntimeState = function() {
    var core = getPlayAlongCore();
    return core && typeof core.getRuntimeState === "function"
      ? core.getRuntimeState()
      : (core ? core.runtimeState || null : null);
  };

  SparkPlayAlongStateService.prototype.getPlaybackTimeMs = function() {
    var core = getPlayAlongCore();
    return core && typeof core.getPlaybackTimeMs === "function"
      ? core.getPlaybackTimeMs()
      : 0;
  };

  SparkPlayAlongStateService.prototype.isSpotifyConnected = function() {
    var runtimeState = this.getRuntimeState();
    return !!(runtimeState && runtimeState.spotifyConnected);
  };

  SparkPlayAlongStateService.prototype.getActiveChart = function() {
    return getActiveChart(getPlayAlongCore());
  };

  SparkPlayAlongStateService.prototype.getActiveParams = function() {
    return getActiveParams(getPlayAlongCore());
  };

  SparkPlayAlongStateService.prototype.getLastOutcome = function() {
    var core = getPlayAlongCore();
    return core && typeof core.getLastSessionOutcome === "function"
      ? core.getLastSessionOutcome()
      : null;
  };

  SparkPlayAlongStateService.prototype.getOutcomeDrills = function() {
    var outcome = this.getLastOutcome();
    return outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
  };

  SparkPlayAlongStateService.prototype.getSectionSummary = function() {
    var outcome = this.getLastOutcome();
    return outcome && outcome.sectionSummary ? outcome.sectionSummary : null;
  };

  SparkPlayAlongStateService.prototype.getReplayParams = function() {
    var params = this.getActiveParams();
    return params ? this.cloneValue(params) : null;
  };

  SparkPlayAlongStateService.prototype.getSectionRecommendationLaunchParams = function(trackId) {
    var activeParams = this.getActiveParams();
    if (activeParams && activeParams.trackId === trackId) {
      return this.cloneValue(activeParams);
    }
    return this.getRecentLaunchParamsByTrackId(trackId);
  };

  SparkPlayAlongStateService.prototype.getAccuracy = function() {
    var core = getPlayAlongCore();
    return core && core.performanceTracker && typeof core.performanceTracker.getAccuracy === "function"
      ? core.performanceTracker.getAccuracy()
      : null;
  };

  SparkPlayAlongStateService.prototype.getTrackTitle = function(chart) {
    chart = chart || this.getActiveChart();
    if (!chart) return "Unknown Track";
    if (chart.songChart && chart.songChart.song && chart.songChart.song.title) return chart.songChart.song.title;
    if (chart.title) return chart.title;
    if (chart.trackId) return chart.trackId;
    return "Unknown Track";
  };

  SparkPlayAlongStateService.prototype.getBpm = function(chart) {
    chart = chart || this.getActiveChart();
    if (!chart) return "--";
    if (typeof chart.getBpm === "function") return Math.round(chart.getBpm());
    if (chart.bpm) return chart.bpm;
    return "--";
  };

  SparkPlayAlongStateService.prototype.hasPlayableSections = function(chart) {
    chart = chart || this.getActiveChart();
    return !!(chart && Array.isArray(chart.sections) && chart.sections.length);
  };

  SparkPlayAlongStateService.prototype.getStateValue = function(key, fallback) {
    var state = getPlayAlongState();
    if (!state || !Object.prototype.hasOwnProperty.call(state, key)) return fallback;
    return state[key];
  };

  SparkPlayAlongStateService.prototype.getError = function() {
    var errorState = this.getStateValue("playAlongError", null);
    if (!errorState) return null;
    if (typeof errorState === "string") {
      return {
        message: errorState,
        source: "play_along_session",
        retryable: true
      };
    }
    return {
      message: errorState.message || "",
      source: errorState.source || "play_along_session",
      retryable: errorState.retryable !== false
    };
  };

  SparkPlayAlongStateService.prototype.getSelectedDrill = function() {
    return this.getStateValue("playAlongSelectedDrill", null);
  };

  SparkPlayAlongStateService.prototype.isPaused = function() {
    return !!this.getStateValue("playAlongPaused", false);
  };

  SparkPlayAlongStateService.prototype.isLoopEnabled = function() {
    return !!this.getStateValue("playAlongLoop", false);
  };

  SparkPlayAlongStateService.prototype.getLoopRange = function() {
    return this.getStateValue("playAlongLoopRange", null);
  };

  SparkPlayAlongStateService.prototype.getLoopTarget = function() {
    var drill = this.getSelectedDrill();
    return this.getStateValue("playAlongLoopTarget", null) || (drill ? "drill" : "section");
  };

  SparkPlayAlongStateService.prototype.getCoachHint = function() {
    return this.getStateValue("playAlongCoachHint", "") || "";
  };

  SparkPlayAlongStateService.prototype.getCurrentSectionLabel = function() {
    return this.getStateValue("playAlongCurrentSection", "Section: Intro") || "Section: Intro";
  };

  SparkPlayAlongStateService.prototype.getCurrentTimeLabel = function() {
    return formatMs(this.getStateValue("playAlongNowMs", 0));
  };

  SparkPlayAlongStateService.prototype.getSpeedLabel = function() {
    return this.getStateValue("playAlongSpeed", "1.0") || "1.0";
  };

  SparkPlayAlongStateService.prototype.togglePauseTransport = function() {
    if (this.isPaused()) {
      this.resumeTransport();
      this.togglePaused();
    } else {
      this.pauseTransport();
      this.togglePaused();
    }
    return this.isPaused();
  };

  SparkPlayAlongStateService.prototype.getOutcomeFeedback = function() {
    var outcome = this.getLastOutcome();
    return outcome && Array.isArray(outcome.feedback) ? outcome.feedback : [];
  };

  SparkPlayAlongStateService.prototype.getOutcomePercent = function(key) {
    var outcome = this.getLastOutcome();
    return asPercent(outcome && outcome[key]);
  };

  SparkPlayAlongStateService.prototype.getSuggestedDifficulty = function() {
    var outcome = this.getLastOutcome();
    return outcome && outcome.suggestedDifficulty ? outcome.suggestedDifficulty : "";
  };

  SparkPlayAlongStateService.prototype.getSuggestedMode = function() {
    var outcome = this.getLastOutcome();
    return outcome && outcome.suggestedMode ? outcome.suggestedMode : "";
  };

  SparkPlayAlongStateService.prototype.getRecentMeta = function(item) {
    var bits = [];
    if (!item) return "";
    if (item.artist) bits.push(item.artist);
    if (item.transportMode) bits.push(item.transportMode);
    if (item.difficulty) bits.push(item.difficulty);
    return bits.join(" | ");
  };

  SparkPlayAlongStateService.prototype.getNextAction = function() {
    var outcome = this.getLastOutcome();
    var drillSummary;
    if (!outcome) return null;
    drillSummary = outcome.drillSummary || null;
    if (drillSummary) {
      if (drillSummary.metTarget) {
        return {
          primaryAction: "full_song",
          message: "The drill target is complete. Take the same section back into the full-song run while the timing is fresh."
        };
      }
      return {
        primaryAction: "drill",
        message: "Stay on the focused loop until the target reps are clean and consistent."
      };
    }
    if (typeof outcome.accuracy === "number" && outcome.accuracy < 0.75) {
      return {
        primaryAction: "drill",
        message: "Accuracy is still a bit low. Use a focused drill next instead of another full-song attempt."
      };
    }
    return {
      primaryAction: "full_song",
      message: "You are in a good spot to run the song again at full length."
    };
  };

  SparkPlayAlongStateService.prototype.getWeakAreas = function() {
    var outcome = this.getLastOutcome();
    var performance = outcome && outcome.performance ? outcome.performance : null;
    var weakAreas = performance && Array.isArray(performance.weakAreas) ? performance.weakAreas : [];
    var labels = [];
    var i;
    var value;
    for (i = 0; i < weakAreas.length; i++) {
      value = weakAreas[i];
      if (!value) continue;
      if (String(value).indexOf("lane_") === 0) {
        labels.push("Lane " + (Number(String(value).split("_")[1]) + 1));
      } else {
        labels.push(String(value).replace(/_/g, " "));
      }
    }
    return labels;
  };

  SparkPlayAlongStateService.prototype.clearError = function() {
    this.writeValue("playAlongError", null);
    return null;
  };

  SparkPlayAlongStateService.prototype.setError = function(err) {
    var message = err && err.message ? err.message : err;
    return this.writeValue("playAlongError", {
      message: message ? String(message) : "Unable to start play-along session.",
      source: "play_along_session",
      retryable: true
    });
  };

  SparkPlayAlongStateService.prototype.rememberLaunch = function(params) {
    var state = getPlayAlongState();
    if (!state || !params || params.audioFile) return;
    var recent = this.getRecent().slice();
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
    state.playAlongRecent = recent.slice(0, 5);
    this.persistState();
  };

  SparkPlayAlongStateService.prototype.removeRecent = function(index) {
    var state = getPlayAlongState();
    var recent = this.getRecent().slice();
    if (!state || index < 0 || index >= recent.length) return false;
    recent.splice(index, 1);
    state.playAlongRecent = recent;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.getRecentLaunchParamsByTrackId = function(trackId) {
    var recent = this.getRecent();
    var i;
    for (i = 0; i < recent.length; i++) {
      if (recent[i] && recent[i].trackId === trackId && recent[i].params) {
        return this.cloneValue(recent[i].params);
      }
    }
    return null;
  };

  SparkPlayAlongStateService.prototype.getRecentLaunchParams = function(index) {
    var item = this.getRecent()[index] || null;
    return item && item.params ? this.cloneValue(item.params) : null;
  };

  SparkPlayAlongStateService.prototype.prepareRecentLaunch = function(index) {
    var params = this.getRecentLaunchParams(index);
    if (!params) return null;
    this.resetSelectedDrillState();
    return params;
  };

  SparkPlayAlongStateService.prototype.clearRecent = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongRecent = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.rememberBookmark = function(bookmark) {
    var state = getPlayAlongState();
    if (!state || !bookmark) return;
    var bookmarks = this.getBookmarks().slice();
    bookmarks = bookmarks.filter(function(item) {
      return !(item && item.trackId === bookmark.trackId && item.sectionIndex === bookmark.sectionIndex);
    });
    bookmarks.unshift(bookmark);
    state.playAlongBookmarks = bookmarks.slice(0, 8);
    this.persistState();
  };

  SparkPlayAlongStateService.prototype.removeBookmark = function(index) {
    var state = getPlayAlongState();
    var bookmarks = this.getBookmarks().slice();
    if (!state || index < 0 || index >= bookmarks.length) return false;
    bookmarks.splice(index, 1);
    state.playAlongBookmarks = bookmarks;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.clearBookmarks = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongBookmarks = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.getBookmark = function(index) {
    return this.getBookmarks()[index] || null;
  };

  SparkPlayAlongStateService.prototype.getBookmarkLaunchParams = function(index) {
    var item = this.getBookmark(index);
    return item && item.params ? this.cloneValue(item.params) : null;
  };

  SparkPlayAlongStateService.prototype.findBookmarkIndex = function(trackId, sectionIndex) {
    var bookmarks = this.getBookmarks();
    var i;
    for (i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i] && bookmarks[i].trackId === trackId && Number(bookmarks[i].sectionIndex) === Number(sectionIndex)) {
        return i;
      }
    }
    return -1;
  };

  SparkPlayAlongStateService.prototype.saveTrack = function(saved) {
    var state = getPlayAlongState();
    var tracks;
    var replaced = false;
    var i;
    if (!state || !saved) return false;
    tracks = this.getSavedTracks().slice();
    for (i = 0; i < tracks.length; i++) {
      if (tracks[i] && tracks[i].trackId === saved.trackId) {
        tracks[i] = saved;
        replaced = true;
        break;
      }
    }
    if (!replaced) tracks.unshift(saved);
    state.spotifySavedTracks = tracks.slice(0, 20);
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.removeSavedTrack = function(index) {
    var state = getPlayAlongState();
    var tracks = this.getSavedTracks().slice();
    if (!state || index < 0 || index >= tracks.length) return false;
    tracks.splice(index, 1);
    state.spotifySavedTracks = tracks;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.clearSavedTracks = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.spotifySavedTracks = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.getSavedLaunchParams = function(index) {
    var item = this.getSavedTracks()[index] || null;
    return item && item.params ? this.cloneValue(item.params) : null;
  };

  SparkPlayAlongStateService.prototype.prepareSavedLaunch = function(index) {
    var params = this.getSavedLaunchParams(index);
    if (!params) return null;
    this.resetSelectedDrillState();
    return params;
  };

  SparkPlayAlongStateService.prototype.syncSectionIndex = function(chart) {
    var state = getPlayAlongState();
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    if (!state) return 0;
    if (!sections.length) {
      state.playAlongSectionIndex = 0;
      return 0;
    }
    var current = Number(state.playAlongSectionIndex || 0);
    if (!isFinite(current) || current < 0) current = 0;
    if (current >= sections.length) current = sections.length - 1;
    state.playAlongSectionIndex = current;
    return current;
  };

  SparkPlayAlongStateService.prototype.resolveLoopRange = function() {
    var state = getPlayAlongState();
    var core = getPlayAlongCore();
    var selected = state && state.playAlongSelectedDrill ? state.playAlongSelectedDrill : null;
    var target = state ? (state.playAlongLoopTarget || (selected ? "drill" : "section")) : "section";
    if (target === "drill" && selected && selected.startMs != null && selected.endMs != null) {
      return { startMs: selected.startMs, endMs: selected.endMs };
    }

    var chart = getActiveChart(core);
    if (chart && Array.isArray(chart.sections) && chart.sections.length) {
      var index = this.syncSectionIndex(chart);
      var section = chart.sections[index] || {};
      var startMs = section.startMs != null ? section.startMs : section.start;
      var endMs = section.endMs != null ? section.endMs : section.end;
      if (startMs != null && endMs != null && endMs > startMs) {
        return { startMs: startMs, endMs: endMs };
      }
    }

    return null;
  };

  SparkPlayAlongStateService.prototype.clearSelectedDrillState = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongSelectedDrill = null;
    state.playAlongLoop = false;
    state.playAlongLoopRange = null;
    state.playAlongLoopTarget = null;
    state.playAlongPaused = false;
    state.playAlongLoopIteration = 0;
    state.playAlongLoopProgress = 0;
    state.playAlongCoachHint = "";
    state.playAlongCurrentSection = "";
    state.playAlongNowMs = 0;
    state.playAlongSectionIndex = 0;
    return true;
  };

  SparkPlayAlongStateService.prototype.resetSelectedDrillState = function() {
    this.clearError();
    return this.clearSelectedDrillState();
  };

  SparkPlayAlongStateService.prototype.activateSectionLoop = function(sectionIndex) {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongSelectedDrill = null;
    state.playAlongLoop = true;
    state.playAlongLoopTarget = "section";
    state.playAlongSectionIndex = Number(sectionIndex || 0);
    state.playAlongLoopIteration = 0;
    state.playAlongLoopProgress = 0;
    state.playAlongCoachHint = "";
    state.playAlongPaused = false;
    state.playAlongLoopRange = this.resolveLoopRange();
    return true;
  };

  SparkPlayAlongStateService.prototype.prepareBookmarkLaunch = function(bookmark) {
    var state = getPlayAlongState();
    if (!state || !bookmark) return false;
    this.clearSelectedDrillState();
    state.playAlongLoop = true;
    state.playAlongLoopTarget = "section";
    state.playAlongSectionIndex = Number(bookmark.sectionIndex || 0);
    state.playAlongLoopRange = this.resolveLoopRange();
    return true;
  };

  SparkPlayAlongStateService.prototype.prepareBookmarkLaunchByIndex = function(index) {
    var item = this.getBookmark(index);
    if (!item || !item.params) return null;
    this.clearError();
    if (!this.prepareBookmarkLaunch(item)) return null;
    return this.cloneValue(item.params);
  };

  SparkPlayAlongStateService.prototype.prepareFullSongReplay = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongSelectedDrill = null;
    state.playAlongLoop = false;
    state.playAlongLoopRange = null;
    state.playAlongLoopTarget = "section";
    state.playAlongLoopIteration = 0;
    state.playAlongLoopProgress = 0;
    state.playAlongCoachHint = "";
    state.playAlongPaused = false;
    return true;
  };

  SparkPlayAlongStateService.prototype.prepareWeakSectionLaunch = function() {
    var sectionSummary = this.getSectionSummary();
    var params = this.getReplayParams();
    if (!sectionSummary || !params) return null;
    this.resetSelectedDrillState();
    this.activateSectionLoop(sectionSummary.sectionIndex || 0);
    return params;
  };

  SparkPlayAlongStateService.prototype.prepareSectionRecommendationLaunch = function(trackId, sectionIndex) {
    var params = this.getSectionRecommendationLaunchParams(trackId);
    if (!params) return null;
    this.resetSelectedDrillState();
    this.activateSectionLoop(sectionIndex || 0);
    return params;
  };

  SparkPlayAlongStateService.prototype.selectDrill = function(drill) {
    var state = getPlayAlongState();
    if (!state || !drill) return false;
    state.playAlongSelectedDrill = drill;
    state.playAlongLoop = true;
    state.playAlongLoopTarget = "drill";
    state.playAlongLoopRange = this.resolveLoopRange();
    state.playAlongPaused = false;
    return true;
  };

  SparkPlayAlongStateService.prototype.togglePaused = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongPaused = !state.playAlongPaused;
    return state.playAlongPaused;
  };

  SparkPlayAlongStateService.prototype.toggleLoop = function() {
    var state = getPlayAlongState();
    if (!state) return false;
    state.playAlongLoop = !state.playAlongLoop;
    state.playAlongLoopRange = state.playAlongLoop ? this.resolveLoopRange() : null;
    return !!state.playAlongLoop;
  };

  SparkPlayAlongStateService.prototype.setLoopTarget = function(target) {
    var state = getPlayAlongState();
    if (!state || (target !== "drill" && target !== "section")) return false;
    state.playAlongLoopTarget = target;
    state.playAlongLoopRange = this.resolveLoopRange();
    return true;
  };

  SparkPlayAlongStateService.prototype.getLoopProgress = function() {
    return Math.max(0, Math.min(100, Number(this.getStateValue("playAlongLoopProgress", 0) || 0)));
  };

  SparkPlayAlongStateService.prototype.getRepStatus = function(drill) {
    if (!drill) drill = this.getStateValue("playAlongSelectedDrill", null);
    var current = Math.max(1, Number(this.getStateValue("playAlongLoopIteration", drill ? 1 : 0) || 1));
    var target = drill && drill.repetitions != null ? drill.repetitions : null;
    return target != null ? ("Rep " + current + " / " + target) : ("Rep " + current);
  };

  SparkPlayAlongStateService.prototype.getTransportMode = function() {
    var runtimeState = this.getRuntimeState();
    return runtimeState && runtimeState.playAlongTransportMode ? runtimeState.playAlongTransportMode : "generated";
  };

  SparkPlayAlongStateService.prototype.getSectionNavigation = function(chart) {
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    var index = Number(this.getStateValue("playAlongSectionIndex", 0) || 0);
    var current;
    if (!sections.length) {
      return { total: 0, label: "", hasPrev: false, hasNext: false };
    }
    if (!isFinite(index) || index < 0) index = 0;
    if (index >= sections.length) index = sections.length - 1;
    current = sections[index] || {};
    return {
      total: sections.length,
      label: "Section " + (index + 1) + " of " + sections.length + ": " + (current.name || ("Part " + (index + 1))),
      hasPrev: index > 0,
      hasNext: index < sections.length - 1
    };
  };

  SparkPlayAlongStateService.prototype.resolveCurrentSectionLabel = function(chart, timeMs) {
    var state = getPlayAlongState();
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    var label;
    var i;
    var section;
    var startMs;
    var endMs;

    if (!state || !sections.length) {
      if (state) state.playAlongCurrentSection = "Section: Intro";
      return "Section: Intro";
    }

    for (i = 0; i < sections.length; i++) {
      section = sections[i] || {};
      startMs = section.startMs != null ? section.startMs : section.start;
      endMs = section.endMs != null ? section.endMs : section.end;
      if (startMs == null || endMs == null) continue;
      if (timeMs >= startMs && timeMs < endMs) {
        state.playAlongSectionIndex = i;
        label = "Section: " + (section.name || ("Part " + (i + 1)));
        state.playAlongCurrentSection = label;
        return label;
      }
    }

    state.playAlongSectionIndex = Math.max(0, sections.length - 1);
    label = "Section: " + ((sections[sections.length - 1] && sections[sections.length - 1].name) || "Outro");
    state.playAlongCurrentSection = label;
    return label;
  };

  SparkPlayAlongStateService.prototype.updateCoachHint = function(accuracy) {
    var state = getPlayAlongState();
    var hint = "";
    var currentRep;
    if (!state) return "";

    currentRep = Math.max(1, Number(state.playAlongLoopIteration || 1));
    if (typeof accuracy === "number") {
      if (accuracy < 0.55) hint = currentRep >= 2 ? "Accuracy is still low after multiple reps. Slow the drill down and keep the loop tight." : (state.playAlongSelectedDrill ? "Stay in the loop and clean up the timing before speeding up." : "Accuracy is slipping. Try a loop or drop to 0.75x.");
      else if (accuracy < 0.75) hint = currentRep >= 3 ? "You are improving, but not enough yet. Give this section two more focused reps." : (state.playAlongLoop ? "One more clean rep will help lock this in." : "You are close. Loop this section for another pass.");
      else if (accuracy >= 0.9 && state.playAlongSelectedDrill) hint = currentRep >= 2 ? "Strong recovery. Finish the last rep, then return to the full song." : "Great control. Finish the target reps, then move back to the full song.";
    }
    state.playAlongCoachHint = hint;
    return hint;
  };

  SparkPlayAlongStateService.prototype.updateSessionTelemetry = function(chart, timeMs, accuracy) {
    var state = getPlayAlongState();
    var range;
    var clamped;
    var pct = 0;
    if (!state) {
      return {
        timeLabel: formatMs(timeMs),
        sectionLabel: "Section: Intro",
        repStatus: "Rep 1",
        loopProgress: 0,
        loopProgressLabel: "Loop Progress: 0%",
        coachHint: ""
      };
    }

    state.playAlongNowMs = timeMs;
    range = state.playAlongLoopRange || null;

    if (range && range.startMs != null && range.endMs != null && range.endMs > range.startMs) {
      clamped = Math.max(range.startMs, Math.min(range.endMs, timeMs));
      pct = Math.round(((clamped - range.startMs) / (range.endMs - range.startMs)) * 100);
    }

    state.playAlongLoopProgress = pct;

    return {
      timeLabel: formatMs(timeMs),
      sectionLabel: this.resolveCurrentSectionLabel(chart, timeMs),
      repStatus: this.getRepStatus(),
      loopProgress: pct,
      loopProgressLabel: "Loop Progress: " + pct + "%",
      coachHint: this.updateCoachHint(accuracy)
    };
  };

  SparkPlayAlongStateService.prototype.enrichOutcomeWithLoopSummary = function(outcome, currentBookmark) {
    var state = getPlayAlongState();
    var selected;
    var range;
    var completedReps;
    outcome = outcome || {};
    if (!state) return outcome;

    selected = state.playAlongSelectedDrill || null;
    range = state.playAlongLoopRange || null;
    if (!selected && !range) return outcome;

    completedReps = Math.max(0, Number(state.playAlongLoopIteration || 0));
    outcome.drillSummary = {
      label: selected ? (selected.label || selected.focus || selected.type || "Focused Practice") : "Loop Practice",
      completedReps: completedReps,
      targetReps: selected && selected.repetitions != null ? selected.repetitions : null,
      metTarget: !!(selected && selected.repetitions != null && completedReps >= Number(selected.repetitions || 0)),
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
  };

  SparkPlayAlongStateService.prototype.applySelectedDrillState = function() {
    var state = getPlayAlongState();
    var selected;
    if (!state) return null;
    selected = state.playAlongSelectedDrill || null;
    if (!selected) {
      if (!state.playAlongLoopTarget) state.playAlongLoopTarget = "section";
      this.syncSectionIndex(getActiveChart(getPlayAlongCore()));
      state.playAlongLoopRange = state.playAlongLoop ? this.resolveLoopRange() : null;
      return state.playAlongLoopRange;
    }

    state.playAlongLoop = true;
    state.playAlongLoopTarget = "drill";
    state.playAlongLoopRange = this.resolveLoopRange();
    state.playAlongLoopIteration = 1;
    state.playAlongLoopProgress = 0;
    if (selected.speed != null) {
      state.playAlongSpeed = String(selected.speed);
      this.setPlaybackRate(selected.speed);
    } else {
      state.playAlongSpeed = "1.0";
    }

    if (state.playAlongLoopRange && state.playAlongLoopRange.startMs != null) {
      this.seekToMs(state.playAlongLoopRange.startMs);
    }
    return state.playAlongLoopRange;
  };

  SparkPlayAlongStateService.prototype.enforceLoopWindow = function(stopLoop) {
    var state = getPlayAlongState();
    var range;
    var selected;
    var targetReps;
    var currentRep;
    var nowMs;
    if (!state || !state.playAlongLoop || state.playAlongPaused) return false;
    range = state.playAlongLoopRange || this.resolveLoopRange();
    if (!range || range.startMs == null || range.endMs == null || range.endMs <= range.startMs) return false;
    state.playAlongLoopRange = range;

    nowMs = this.getPlaybackTimeMs();
    if (nowMs < range.endMs) return false;

    selected = state.playAlongSelectedDrill || null;
    targetReps = selected && selected.repetitions != null ? Number(selected.repetitions) : null;
    currentRep = Math.max(1, Number(state.playAlongLoopIteration || 1));
    if (targetReps != null && targetReps > 0 && currentRep >= targetReps) {
      state.playAlongLoop = false;
      state.playAlongLoopProgress = 100;
      if (typeof stopLoop === "function") stopLoop();
      return true;
    }

    state.playAlongLoopIteration = currentRep + 1;
    state.playAlongLoopProgress = 0;
    this.seekToMs(range.startMs);
    return false;
  };

  SparkPlayAlongStateService.prototype.buildCurrentSectionBookmark = function() {
    var core = getPlayAlongCore();
    var state = getPlayAlongState();
    var chart = getActiveChart(core);
    var params = getActiveParams(core);
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    if (!state || !params || !sections.length) return null;
    var index = this.syncSectionIndex(chart);
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
  };

  SparkPlayAlongStateService.prototype.stepSection = function(delta, onAfterStep) {
    var state = getPlayAlongState();
    var core = getPlayAlongCore();
    var chart = getActiveChart(core);
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    var index;
    var section;
    var startMs;
    if (!state || !sections.length) return false;
    index = Number(state.playAlongSectionIndex || 0);
    if (!isFinite(index)) index = 0;
    index += delta;
    if (index < 0 || index >= sections.length) return false;
    state.playAlongSectionIndex = index;
    if (state.playAlongLoopTarget === "section") {
      state.playAlongLoopRange = this.resolveLoopRange();
    }
    section = sections[index] || {};
    startMs = section.startMs != null ? section.startMs : section.start;
    if (startMs != null) {
      this.seekToMs(startMs);
      state.playAlongNowMs = startMs;
      state.playAlongCurrentSection = "Section: " + (section.name || ("Part " + (index + 1)));
    }
    if (typeof onAfterStep === "function") onAfterStep();
    return true;
  };

  window.SparkPlayAlongStateService = SparkPlayAlongStateService;
})();
