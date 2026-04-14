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

  SparkPlayAlongActionService.prototype.getSearchLaunchParams = function(index, overrides) {
    var track = this.getSearchResult(index);
    if (!track) return null;
    return this.buildLaunchParams(track, overrides);
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

  SparkPlayAlongActionService.prototype.buildSearchResultsMarkup = function(tracks) {
    var html = "";
    var i;
    var track;
    var name;
    var artist;
    var imgTag;
    tracks = Array.isArray(tracks) ? tracks : [];
    for (i = 0; i < tracks.length; i++) {
      track = tracks[i] || {};
      name = escapeHtml(track.name || "");
      artist = escapeHtml(track.artist || "");
      imgTag = track.image
        ? "<img src=\"" + escapeHtml(track.image) + "\" width=\"40\" height=\"40\" class=\"song-item-art\"/>"
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
    return html;
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

  SparkPlayAlongActionService.prototype.bindUploadPromptHandlers = function(index, onSelectWithFile, onSkip) {
    var track = this.getSearchResult(index);
    var fileInput = document.getElementById("play-along-audio-input");
    var skipBtn = document.getElementById("play-along-skip-btn");
    if (!track) return false;

    if (fileInput) {
      fileInput.addEventListener("change", function() {
        var file = fileInput.files && fileInput.files[0];
        if (file && typeof onSelectWithFile === "function") {
          onSelectWithFile(index, file);
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", function() {
        if (typeof onSkip === "function") onSkip(index, track);
      });
    }

    return !!(fileInput || skipBtn);
  };

  SparkPlayAlongActionService.prototype.getSpotifyClientId = function() {
    if (typeof localStorage === "undefined" || !localStorage) return "";
    return localStorage.getItem("sparksuite_spotify_client_id") || "";
  };

  SparkPlayAlongActionService.prototype.saveSpotifyClientId = function(value) {
    var clientId = value && String(value).trim();
    if (!clientId || typeof localStorage === "undefined" || !localStorage) return false;
    localStorage.setItem("sparksuite_spotify_client_id", clientId);
    return true;
  };

  SparkPlayAlongActionService.prototype.buildSpotifyClientIdPromptMarkup = function() {
    return "<div class=card style=padding:20px;text-align:center>"
      + "<div style=font-size:14px;font-weight:700;margin-bottom:8px>Spotify Client ID</div>"
      + "<div style=font-size:12px;color:var(--text-dim);margin-bottom:12px>Get yours at developer.spotify.com/dashboard</div>"
      + "<input id=spotify-client-id-input class=input type=text placeholder=Paste client ID here style=width:100%;margin-bottom:8px>"
      + "<button class=btn onclick=sparkPlayAlongSaveClientId() style=background:var(--accent);color:#fff>Save and Connect</button>"
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

  SparkPlayAlongActionService.prototype.saveSearchResult = function(index) {
    var self = this;
    var track = this.getSearchResult(index);
    if (!track || !this.stateService || typeof this.stateService.saveTrack !== "function") {
      return Promise.resolve(false);
    }
    return this.enrichSavedTrack(track).then(function(saved) {
      return !!self.stateService.saveTrack(saved);
    });
  };

  SparkPlayAlongActionService.prototype.getDemo = function(index) {
    var demos = getPlayAlongDemos();
    return demos[index] || null;
  };

  SparkPlayAlongActionService.prototype.getDemoLaunchParams = function(index) {
    var demo = this.getDemo(index);
    if (!demo) return null;
    return this.buildLaunchParams(demo, {
      trackId: demo.trackId,
      trackUri: demo.trackUri || null,
      title: demo.title || null,
      audioOffsetMs: demo.audioOffsetMs || 0,
      difficulty: demo.difficulty || this.getDifficulty(),
      instrument: demo.instrument || "guitar"
    });
  };

  window.SparkPlayAlongActionService = SparkPlayAlongActionService;
})();
