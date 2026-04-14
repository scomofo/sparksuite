(function() {
  function getPlayAlongCore() {
    return typeof window !== "undefined" ? window.sparkCore || null : null;
  }

  function getPlayAlongState() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      return SparkState.getRoot();
    }
    if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
      return globalThis.__sparkState;
    }
    return null;
  }

  function getPlayAlongDemos() {
    return typeof window !== "undefined" && typeof window.getSparkPlayAlongDemos === "function"
      ? window.getSparkPlayAlongDemos()
      : [];
  }

  function getPlayAlongInstrumentId() {
    var core = getPlayAlongCore();
    var runtime = core && typeof core.getRuntimeState === "function"
      ? core.getRuntimeState()
      : null;
    if (runtime && runtime.activeInstrumentId) return runtime.activeInstrumentId;
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive ? SparkInstruments.getActive() : null;
    if (active && active.appId) return active.appId;
    return "guitar";
  }

  function escapeHtml(value) {
    if (!value) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function SparkPlayAlongActionService(stateService) {
    this.stateService = stateService || null;
    this.searchResults = [];
  }

  SparkPlayAlongActionService.prototype.getInstrumentId = function() {
    return getPlayAlongInstrumentId();
  };

  SparkPlayAlongActionService.prototype.cloneValue = function(value) {
    if (this.stateService && typeof this.stateService.cloneValue === "function") {
      return this.stateService.cloneValue(value);
    }
    return JSON.parse(JSON.stringify(value || {}));
  };

  SparkPlayAlongActionService.prototype.getDifficulty = function() {
    if (this.stateService && typeof this.stateService.getDifficulty === "function") {
      return this.stateService.getDifficulty();
    }
    var state = getPlayAlongState();
    return state && state.spotifyDifficulty ? state.spotifyDifficulty : "easy";
  };

  SparkPlayAlongActionService.prototype.setDifficulty = function(level) {
    if (this.stateService && typeof this.stateService.setDifficulty === "function") {
      return this.stateService.setDifficulty(level);
    }
    var state = getPlayAlongState();
    var core = getPlayAlongCore();
    if (state) state.spotifyDifficulty = level;
    if (core && typeof core.updateRuntimeState === "function") {
      core.updateRuntimeState({ spotifyDifficulty: level });
    }
    return level;
  };

  SparkPlayAlongActionService.prototype.setSearchResults = function(results) {
    this.searchResults = Array.isArray(results) ? results.slice() : [];
    return this.searchResults;
  };

  SparkPlayAlongActionService.prototype.clearSearchResults = function() {
    this.searchResults = [];
    return this.searchResults;
  };

  SparkPlayAlongActionService.prototype.getSearchResult = function(index) {
    return this.searchResults[index] || null;
  };

  SparkPlayAlongActionService.prototype.searchTracks = function(query, onResults) {
    var core = getPlayAlongCore();
    var self = this;
    if (!query || query.length < 2) {
      if (typeof onResults === "function") onResults(this.clearSearchResults());
      return false;
    }
    if (!core || !core.spotifySearch || typeof core.spotifySearch.searchDebounced !== "function") return false;

    core.spotifySearch.searchDebounced(query, function(tracks) {
      var results = self.setSearchResults(tracks || []);
      if (typeof onResults === "function") onResults(results);
    });
    return true;
  };

  SparkPlayAlongActionService.prototype.hasCachedChart = function(trackId) {
    var core = getPlayAlongCore();
    return !!(core && core.chartService &&
      typeof core.chartService.hasCachedChart === "function" &&
      core.chartService.hasCachedChart(trackId));
  };

  SparkPlayAlongActionService.prototype.buildLaunchParams = function(track, overrides) {
    var params;
    overrides = overrides || {};
    if (!track) return null;
    params = {
      trackId: overrides.trackId != null ? overrides.trackId : (track.id || track.trackId || null),
      trackUri: overrides.trackUri != null ? overrides.trackUri : (track.uri || track.trackUri || null),
      title: overrides.title != null ? overrides.title : (track.name || track.title || null),
      artist: overrides.artist != null ? overrides.artist : (track.artist || null),
      audioOffsetMs: overrides.audioOffsetMs != null ? overrides.audioOffsetMs : (track.audioOffsetMs || 0),
      difficulty: overrides.difficulty || track.difficulty || this.getDifficulty(),
      instrument: overrides.instrument || track.instrument || this.getInstrumentId()
    };
    if (Object.prototype.hasOwnProperty.call(overrides, "audioFile")) {
      params.audioFile = overrides.audioFile;
    }
    return params;
  };

  SparkPlayAlongActionService.prototype.buildUploadPromptMarkup = function(track) {
    var songLabel = (track.name || "this track") + (track.artist ? " by " + track.artist : "");
    return "<div class=\"play-along-upload-prompt\">"
      + "<p>Drop an audio file to build an accurate chart for <strong>" + escapeHtml(songLabel) + "</strong></p>"
      + "<input type=\"file\" id=\"play-along-audio-input\" accept=\"audio/*\" />"
      + "<button class=\"btn btn-sm\" id=\"play-along-skip-btn\">Skip (use default)</button>"
      + "</div>";
  };

  SparkPlayAlongActionService.prototype.createSavedTrack = function(track) {
    if (!track) return null;
    return {
      trackId: track.id,
      trackUri: track.uri || null,
      title: track.name || "Spotify Track",
      artist: track.artist || "",
      image: track.image || null,
      duration: track.duration || 0,
      bpm: null,
      source: "spotify",
      savedAt: Date.now(),
      params: this.buildLaunchParams(track)
    };
  };

  SparkPlayAlongActionService.prototype.enrichSavedTrack = function(track) {
    var core = getPlayAlongCore();
    var saved = this.createSavedTrack(track);
    if (!saved) return Promise.resolve(null);
    if (!core || !core.spotifyClient || typeof core.spotifyClient.getAudioFeatures !== "function") {
      return Promise.resolve(saved);
    }
    return core.spotifyClient.getAudioFeatures(track.id).then(function(features) {
      if (features && typeof features.tempo === "number") {
        saved.bpm = Math.round(features.tempo);
      }
      return saved;
    }).catch(function() {
      return saved;
    });
  };

  SparkPlayAlongActionService.prototype.getDemo = function(index) {
    var demos = getPlayAlongDemos();
    return demos[index] || null;
  };

  SparkPlayAlongActionService.prototype.getRecentLaunchParams = function(index) {
    var item = this.stateService && typeof this.stateService.getRecent === "function"
      ? this.stateService.getRecent()[index] || null
      : null;
    return item && item.params ? this.cloneValue(item.params) : null;
  };

  SparkPlayAlongActionService.prototype.getSavedLaunchParams = function(index) {
    var item = this.stateService && typeof this.stateService.getSavedTracks === "function"
      ? this.stateService.getSavedTracks()[index] || null
      : null;
    return item && item.params ? this.cloneValue(item.params) : null;
  };

  SparkPlayAlongActionService.prototype.getBookmark = function(index) {
    return this.stateService && typeof this.stateService.getBookmarks === "function"
      ? this.stateService.getBookmarks()[index] || null
      : null;
  };

  SparkPlayAlongActionService.prototype.findBookmarkIndex = function(trackId, sectionIndex) {
    var bookmarks = this.stateService && typeof this.stateService.getBookmarks === "function"
      ? this.stateService.getBookmarks()
      : [];
    var i;
    for (i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i] && bookmarks[i].trackId === trackId && Number(bookmarks[i].sectionIndex) === Number(sectionIndex)) {
        return i;
      }
    }
    return -1;
  };

  window.SparkPlayAlongActionService = SparkPlayAlongActionService;
})();
