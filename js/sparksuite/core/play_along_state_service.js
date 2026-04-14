(function() {
  function defaultGetState() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      return SparkState.getRoot();
    }
    if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
      return globalThis.__sparkState;
    }
    return null;
  }

  function defaultGetCore() {
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

  function SparkPlayAlongStateService(options) {
    options = options || {};
    this.getState = options.getState || defaultGetState;
    this.getCore = options.getCore || defaultGetCore;
  }

  SparkPlayAlongStateService.prototype.cloneValue = function(value) {
    return clonePlainObject(value);
  };

  SparkPlayAlongStateService.prototype.persistState = function() {
    if (typeof saveState === "function") saveState();
  };

  SparkPlayAlongStateService.prototype.getRecent = function() {
    var state = this.getState();
    return state && Array.isArray(state.playAlongRecent) ? state.playAlongRecent : [];
  };

  SparkPlayAlongStateService.prototype.getBookmarks = function() {
    var state = this.getState();
    return state && Array.isArray(state.playAlongBookmarks) ? state.playAlongBookmarks : [];
  };

  SparkPlayAlongStateService.prototype.getSavedTracks = function() {
    var state = this.getState();
    return state && Array.isArray(state.spotifySavedTracks) ? state.spotifySavedTracks : [];
  };

  SparkPlayAlongStateService.prototype.getStateValue = function(key, fallback) {
    var state = this.getState();
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

  SparkPlayAlongStateService.prototype.rememberLaunch = function(params) {
    var state = this.getState();
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
    var state = this.getState();
    var recent = this.getRecent().slice();
    if (!state || index < 0 || index >= recent.length) return false;
    recent.splice(index, 1);
    state.playAlongRecent = recent;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.clearRecent = function() {
    var state = this.getState();
    if (!state) return false;
    state.playAlongRecent = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.rememberBookmark = function(bookmark) {
    var state = this.getState();
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
    var state = this.getState();
    var bookmarks = this.getBookmarks().slice();
    if (!state || index < 0 || index >= bookmarks.length) return false;
    bookmarks.splice(index, 1);
    state.playAlongBookmarks = bookmarks;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.clearBookmarks = function() {
    var state = this.getState();
    if (!state) return false;
    state.playAlongBookmarks = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.saveTrack = function(saved) {
    var state = this.getState();
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
    var state = this.getState();
    var tracks = this.getSavedTracks().slice();
    if (!state || index < 0 || index >= tracks.length) return false;
    tracks.splice(index, 1);
    state.spotifySavedTracks = tracks;
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.clearSavedTracks = function() {
    var state = this.getState();
    if (!state) return false;
    state.spotifySavedTracks = [];
    this.persistState();
    return true;
  };

  SparkPlayAlongStateService.prototype.syncSectionIndex = function(chart) {
    var state = this.getState();
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
    var state = this.getState();
    var core = this.getCore();
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
    var state = this.getState();
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

  SparkPlayAlongStateService.prototype.activateSectionLoop = function(sectionIndex) {
    var state = this.getState();
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
    var state = this.getState();
    if (!state || !bookmark) return false;
    this.clearSelectedDrillState();
    state.playAlongLoop = true;
    state.playAlongLoopTarget = "section";
    state.playAlongSectionIndex = Number(bookmark.sectionIndex || 0);
    state.playAlongLoopRange = this.resolveLoopRange();
    return true;
  };

  SparkPlayAlongStateService.prototype.prepareFullSongReplay = function() {
    var state = this.getState();
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

  SparkPlayAlongStateService.prototype.selectDrill = function(drill) {
    var state = this.getState();
    if (!state || !drill) return false;
    state.playAlongSelectedDrill = drill;
    state.playAlongLoop = true;
    state.playAlongLoopTarget = "drill";
    state.playAlongLoopRange = this.resolveLoopRange();
    state.playAlongPaused = false;
    return true;
  };

  SparkPlayAlongStateService.prototype.togglePaused = function() {
    var state = this.getState();
    if (!state) return false;
    state.playAlongPaused = !state.playAlongPaused;
    return state.playAlongPaused;
  };

  SparkPlayAlongStateService.prototype.toggleLoop = function() {
    var state = this.getState();
    if (!state) return false;
    state.playAlongLoop = !state.playAlongLoop;
    state.playAlongLoopRange = state.playAlongLoop ? this.resolveLoopRange() : null;
    return !!state.playAlongLoop;
  };

  SparkPlayAlongStateService.prototype.setLoopTarget = function(target) {
    var state = this.getState();
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
    var core = this.getCore();
    var runtimeState = core && typeof core.getRuntimeState === "function"
      ? core.getRuntimeState()
      : (core ? core.runtimeState || null : null);
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
    var state = this.getState();
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
    var state = this.getState();
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
    var state = this.getState();
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
    var state = this.getState();
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

  SparkPlayAlongStateService.prototype.applySelectedDrillState = function(options) {
    var state = this.getState();
    var selected;
    options = options || {};
    if (!state) return null;
    selected = state.playAlongSelectedDrill || null;
    if (!selected) {
      if (!state.playAlongLoopTarget) state.playAlongLoopTarget = "section";
      this.syncSectionIndex(getActiveChart(this.getCore()));
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
      if (typeof options.setPlaybackRate === "function") {
        options.setPlaybackRate(selected.speed);
      }
    } else {
      state.playAlongSpeed = "1.0";
    }

    if (state.playAlongLoopRange && state.playAlongLoopRange.startMs != null && typeof options.seekToMs === "function") {
      options.seekToMs(state.playAlongLoopRange.startMs);
    }
    return state.playAlongLoopRange;
  };

  SparkPlayAlongStateService.prototype.enforceLoopWindow = function(options) {
    var state = this.getState();
    var range;
    var selected;
    var targetReps;
    var currentRep;
    var nowMs;
    options = options || {};
    if (!state || !state.playAlongLoop || state.playAlongPaused) return false;
    range = state.playAlongLoopRange || this.resolveLoopRange();
    if (!range || range.startMs == null || range.endMs == null || range.endMs <= range.startMs) return false;
    state.playAlongLoopRange = range;

    nowMs = typeof options.getPlaybackTimeMs === "function" ? options.getPlaybackTimeMs() : 0;
    if (nowMs < range.endMs) return false;

    selected = state.playAlongSelectedDrill || null;
    targetReps = selected && selected.repetitions != null ? Number(selected.repetitions) : null;
    currentRep = Math.max(1, Number(state.playAlongLoopIteration || 1));
    if (targetReps != null && targetReps > 0 && currentRep >= targetReps) {
      state.playAlongLoop = false;
      state.playAlongLoopProgress = 100;
      if (typeof options.stopLoop === "function") options.stopLoop();
      return true;
    }

    state.playAlongLoopIteration = currentRep + 1;
    state.playAlongLoopProgress = 0;
    if (typeof options.seekToMs === "function") options.seekToMs(range.startMs);
    return false;
  };

  SparkPlayAlongStateService.prototype.buildCurrentSectionBookmark = function() {
    var core = this.getCore();
    var state = this.getState();
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

  SparkPlayAlongStateService.prototype.stepSection = function(delta, options) {
    var state = this.getState();
    var core = this.getCore();
    var chart = getActiveChart(core);
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    var index;
    var section;
    var startMs;
    options = options || {};
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
      if (typeof options.seekToMs === "function") options.seekToMs(startMs);
      state.playAlongNowMs = startMs;
      state.playAlongCurrentSection = "Section: " + (section.name || ("Part " + (index + 1)));
    }
    if (typeof options.onAfterStep === "function") options.onAfterStep();
    return true;
  };

  window.SparkPlayAlongStateService = SparkPlayAlongStateService;
})();
