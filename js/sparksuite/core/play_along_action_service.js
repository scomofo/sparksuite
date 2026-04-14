(function() {
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

  SparkPlayAlongActionService.bootstrapController = function() {
    var target = typeof window !== "undefined" ? window : null;
    if (!target) return null;
    var stateService = new SparkPlayAlongStateService();
    var actionService = new SparkPlayAlongActionService(stateService);
    var renderer = new SparkPlayAlongRenderer(stateService);
    var onRender = function() {
      if (typeof render === "function") render();
    };
    var stop = renderer.finishSessionResults.bind(renderer, onRender);
    var startLoop = renderer.startSessionLoop.bind(renderer, stop);
    var controllerBindings = actionService.createControllerBindings(onRender, startLoop);
    var globals = {
      sparkPlayAlongStop: stop,
      sparkPlayAlongStartLoop: startLoop,
      sparkPlayAlongSelectWithFile: controllerBindings.searchSelectWithFile,
      sparkPlayAlongSelect: controllerBindings.searchSelect,
      sparkPlayAlongSearch: controllerBindings.search,
      sparkPlayAlongLaunchDemo: controllerBindings.launchDemo,
      sparkPlayAlongLaunchRecent: controllerBindings.launchRecent,
      sparkPlayAlongSaveTrack: controllerBindings.saveTrack,
      sparkPlayAlongLaunchSaved: controllerBindings.launchSaved,
      sparkPlayAlongRemoveSaved: controllerBindings.removeSaved,
      sparkPlayAlongClearSaved: controllerBindings.clearSaved,
      sparkPlayAlongLaunchBookmark: controllerBindings.launchBookmark,
      sparkPlayAlongLaunchBookmarkByKey: controllerBindings.launchBookmarkByKey,
      sparkPlayAlongRemoveRecent: controllerBindings.removeRecent,
      sparkPlayAlongClearRecent: controllerBindings.clearRecent,
      sparkPlayAlongRemoveBookmark: controllerBindings.removeBookmark,
      sparkPlayAlongClearBookmarks: controllerBindings.clearBookmarks,
      sparkPlayAlongSetDifficulty: controllerBindings.setDifficulty,
      sparkPlayAlongLoadFile: controllerBindings.loadFile,
      sparkPlayAlongToggleDebug: controllerBindings.toggleDebug,
      sparkPlayAlongAgain: controllerBindings.again,
      sparkPlayAlongReplayDrill: controllerBindings.replayDrill,
      sparkPlayAlongReplayFullSong: controllerBindings.replayFullSong,
      sparkPlayAlongTogglePause: controllerBindings.togglePause,
      sparkPlayAlongToggleLoop: controllerBindings.toggleLoop,
      sparkPlayAlongSetLoopTarget: controllerBindings.setLoopTarget,
      sparkPlayAlongPrevSection: controllerBindings.prevSection,
      sparkPlayAlongNextSection: controllerBindings.nextSection,
      sparkPlayAlongBookmarkCurrentSection: controllerBindings.bookmarkCurrentSection,
      sparkPlayAlongJumpToWeakSection: controllerBindings.jumpToWeakSection,
      sparkPlayAlongJumpToSectionRecommendation: controllerBindings.jumpToSectionRecommendation,
      sparkPlayAlongPickNew: controllerBindings.pickNew,
      sparkPlayAlongStartDrill: controllerBindings.startDrill,
      openPlayAlong: controllerBindings.openHome,
      sparkPlayAlongConnectSpotify: controllerBindings.connectSpotify,
      sparkPlayAlongSaveClientId: controllerBindings.saveSpotifyClientId,
      sparkPlayAlongReplay: controllerBindings.replay,
      handleSpotifyConnectAction: controllerBindings.spotifyConnectAction
    };
    Object.assign(target, globals);
    return globals;
  };

  SparkPlayAlongActionService.prototype.createControllerBindings = function(onRender, onStartLoop) {
    var self = this;
    onRender = typeof onRender === "function" ? onRender : function() {
      if (typeof render === "function") render();
    };
    var launchPreparedSession = this.stateService && typeof this.stateService.launchPreparedSession === "function"
      ? function(params) {
        return self.stateService.launchPreparedSession(params, onRender, onStartLoop);
      }
      : function() { return false; };
    return {
      search: this.searchAndRenderTracks.bind(this),
      toggleDebug: this.toggleDebugDashboard.bind(this),
      again: this.stateService && typeof this.stateService.replayOrShowHome === "function"
        ? this.stateService.replayOrShowHome.bind(this.stateService, launchPreparedSession, onRender)
        : function() { return false; },
      replayDrill: this.stateService && typeof this.stateService.replayDrill === "function"
        ? this.stateService.replayDrill.bind(this.stateService, launchPreparedSession)
        : function() { return false; },
      replayFullSong: this.stateService && typeof this.stateService.replayFullSong === "function"
        ? this.stateService.replayFullSong.bind(this.stateService, launchPreparedSession)
        : function() { return false; },
      launchDemo: function(value) {
        return self.handleDemoLaunch(value, launchPreparedSession);
      },
      launchRecent: function(value) {
        return self.stateService.launchRecent(value, launchPreparedSession);
      },
      saveTrack: function(value) {
        return self.saveSearchResultAndRender(value, onRender);
      },
      launchSaved: function(value) {
        return self.stateService.launchSaved(value, launchPreparedSession);
      },
      removeSaved: function(value) {
        return self.stateService.removeSavedTrackWithRender(value, onRender);
      },
      clearSaved: function() {
        return self.stateService.clearSavedTracksWithRender(onRender);
      },
      launchBookmark: function(value) {
        return self.stateService.launchBookmark(value, launchPreparedSession);
      },
      launchBookmarkByKey: function(first, second) {
        return self.stateService.launchBookmarkByKey(first, second, launchPreparedSession);
      },
      removeRecent: function(value) {
        return self.stateService.removeRecentWithRender(value, onRender);
      },
      clearRecent: function() {
        return self.stateService.clearRecentWithRender(onRender);
      },
      removeBookmark: function(value) {
        return self.stateService.removeBookmarkWithRender(value, onRender);
      },
      clearBookmarks: function() {
        return self.stateService.clearBookmarksWithRender(onRender);
      },
      setDifficulty: function(value) {
        return self.setDifficultyAndRender(value, onRender);
      },
      loadFile: function(value) {
        return self.handleLocalFileLaunch(value, launchPreparedSession);
      },
      togglePause: function() {
        return self.stateService.togglePause(onRender);
      },
      toggleLoop: function() {
        return self.stateService.toggleLoopWithRender(onRender);
      },
      setLoopTarget: function(value) {
        return self.stateService.setLoopTargetWithRender(value, onRender);
      },
      prevSection: function() {
        return self.stateService.prevSection(onRender);
      },
      nextSection: function() {
        return self.stateService.nextSection(onRender);
      },
      bookmarkCurrentSection: function() {
        return self.stateService.saveCurrentSectionBookmarkWithRender(onRender);
      },
      pickNew: function() {
        return self.stateService.resetToHome(onRender);
      },
      startDrill: function(value) {
        return self.stateService.startDrill(value, launchPreparedSession, onRender);
      },
      openHome: function() {
        return self.stateService && typeof self.stateService.showHome === "function"
          ? self.stateService.showHome(onRender)
          : false;
      },
      connectSpotify: function() {
        return self.connectSpotifyAndRender(onRender);
      },
      saveSpotifyClientId: function() {
        return self.saveSpotifyClientIdAndConnectAndRender(onRender);
      },
      replay: this.stateService && typeof this.stateService.replayOrShowHome === "function"
        ? this.stateService.replayOrShowHome.bind(this.stateService, launchPreparedSession, onRender)
        : function() { return false; },
      spotifyConnectAction: function() {
        return self.connectSpotifyAndRender(onRender);
      },
      jumpToWeakSection: this.stateService && typeof this.stateService.launchWeakSection === "function"
        ? this.stateService.launchWeakSection.bind(this.stateService, launchPreparedSession)
        : function() { return false; },
      jumpToSectionRecommendation: this.stateService && typeof this.stateService.launchSectionRecommendation === "function"
        ? function(first, second) {
          return self.stateService.launchSectionRecommendation(first, second, launchPreparedSession);
        }
        : function() { return false; },
      searchSelectWithFile: function(index, file) {
        return self.handleSearchSelectionWithFile(index, file, launchPreparedSession);
      },
      searchSelect: function(index) {
        return self.handleSearchSelection(index, launchPreparedSession, function(fileIndex, file) {
          return self.handleSearchSelectionWithFile(fileIndex, file, launchPreparedSession);
        });
      }
    };
  };

  SparkPlayAlongActionService.prototype.cloneValue = function(value) {
    if (this.stateService && typeof this.stateService.cloneValue === "function") {
      return this.stateService.cloneValue(value);
    }
    return JSON.parse(JSON.stringify(value || {}));
  };

  SparkPlayAlongActionService.prototype.getDifficulty = function() {
    var state;
    if (this.stateService && typeof this.stateService.getDifficulty === "function") {
      return this.stateService.getDifficulty();
    }
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      state = SparkState.getRoot();
    } else if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
      state = globalThis.__sparkState;
    } else {
      state = null;
    }
    return state && state.spotifyDifficulty ? state.spotifyDifficulty : "easy";
  };

  SparkPlayAlongActionService.prototype.setDifficulty = function(level) {
    var state;
    if (this.stateService && typeof this.stateService.setDifficulty === "function") {
      return this.stateService.setDifficulty(level);
    }
    var core = this.stateService && typeof this.stateService.getCore === "function"
      ? this.stateService.getCore()
      : null;
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      state = SparkState.getRoot();
    } else if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
      state = globalThis.__sparkState;
    } else {
      state = null;
    }
    if (state) state.spotifyDifficulty = level;
    if (core && typeof core.updateRuntimeState === "function") {
      core.updateRuntimeState({ spotifyDifficulty: level });
    }
    return level;
  };

  SparkPlayAlongActionService.prototype.setDifficultyAndRender = function(level, onRender) {
    var result = this.setDifficulty(level);
    if (typeof onRender === "function") onRender();
    return result;
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

  SparkPlayAlongActionService.prototype.prepareSearchLaunch = function(index, overrides) {
    var params = this.getSearchLaunchParams(index, overrides);
    if (!params) return null;
    if (this.stateService && typeof this.stateService.prepareFreshLaunch === "function") {
      return this.stateService.prepareFreshLaunch(params);
    }
    return this.cloneValue(params);
  };

  SparkPlayAlongActionService.prototype.shouldUseCachedSearchChart = function(index) {
    var track = this.getSearchResult(index);
    return !!(track && this.hasCachedChart(track.id));
  };

  SparkPlayAlongActionService.prototype.searchTracks = function(query, onResults) {
    var core = this.stateService && typeof this.stateService.getCore === "function"
      ? this.stateService.getCore()
      : null;
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

  SparkPlayAlongActionService.prototype.searchAndRenderTracks = function(query) {
    var resultsEl = this.getSearchResultsContainer();
    if (!this.searchTracks(query, function(tracks) {
      this.renderSearchResults(resultsEl, tracks);
    }.bind(this))) {
      this.clearSearchResultsMarkup(resultsEl);
      return false;
    }
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

  SparkPlayAlongActionService.prototype.getSearchResultsContainer = function() {
    return document.getElementById("play-along-results");
  };

  SparkPlayAlongActionService.prototype.getSpotifyPromptContainer = function() {
    return this.getSearchResultsContainer() || document.getElementById("app");
  };

  SparkPlayAlongActionService.prototype.renderSearchResults = function(container, tracks) {
    if (!container) return false;
    container.innerHTML = this.buildSearchResultsMarkup(tracks);
    return true;
  };

  SparkPlayAlongActionService.prototype.clearSearchResultsMarkup = function(container) {
    if (!container) return false;
    container.innerHTML = "";
    return true;
  };

  SparkPlayAlongActionService.prototype.hasCachedChart = function(trackId) {
    var core = this.stateService && typeof this.stateService.getCore === "function"
      ? this.stateService.getCore()
      : null;
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
      instrument: overrides.instrument || track.instrument || (
        this.stateService && typeof this.stateService.getInstrumentId === "function"
          ? this.stateService.getInstrumentId()
          : "guitar"
      )
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

  SparkPlayAlongActionService.prototype.showUploadPrompt = function(container, index, onSelectWithFile, onSkip) {
    var track = this.getSearchResult(index);
    if (!container || !track) return false;
    container.innerHTML = this.buildUploadPromptMarkup(track);
    this.bindUploadPromptHandlers(index, onSelectWithFile, onSkip);
    return true;
  };

  SparkPlayAlongActionService.prototype.showSearchUploadPrompt = function(container, index, onSelectWithFile, onSkipLaunch) {
    return this.showUploadPrompt(container, index, onSelectWithFile, function(selectedIndex) {
      if (typeof onSkipLaunch === "function") {
        onSkipLaunch(this.prepareSearchLaunch(selectedIndex));
      }
    }.bind(this));
  };

  SparkPlayAlongActionService.prototype.showSearchUploadPromptForIndex = function(index, onSelectWithFile, onSkipLaunch) {
    var container = this.getSearchResultsContainer();
    if (!container) return false;
    return this.showSearchUploadPrompt(container, index, onSelectWithFile, onSkipLaunch);
  };

  SparkPlayAlongActionService.prototype.handleSearchSelection = function(index, onLaunchPrepared, onSelectWithFile) {
    if (this.shouldUseCachedSearchChart(index)) {
      if (typeof onLaunchPrepared === "function") {
        onLaunchPrepared(this.prepareSearchLaunch(index));
      }
      return true;
    }
    return this.showSearchUploadPromptForIndex(index, onSelectWithFile, onLaunchPrepared);
  };

  SparkPlayAlongActionService.prototype.handleSearchSelectionWithFile = function(index, file, onLaunchPrepared) {
    if (!file) return false;
    if (typeof onLaunchPrepared === "function") {
      onLaunchPrepared(this.prepareSearchLaunch(index, { audioFile: file }));
    }
    return true;
  };

  SparkPlayAlongActionService.prototype.handleLocalFileLaunch = function(file, onLaunchPrepared) {
    var params;
    if (!file) return false;
    params = this.stateService && typeof this.stateService.prepareLocalFileLaunch === "function"
      ? this.stateService.prepareLocalFileLaunch(
        file,
        this.stateService && typeof this.stateService.getInstrumentId === "function"
          ? this.stateService.getInstrumentId()
          : "guitar"
      )
      : null;
    if (typeof onLaunchPrepared === "function") {
      onLaunchPrepared(params);
    }
    return !!params;
  };

  SparkPlayAlongActionService.prototype.handleDemoLaunch = function(index, onLaunchPrepared) {
    var params = this.stateService && typeof this.stateService.prepareFreshLaunch === "function"
      ? this.stateService.prepareFreshLaunch(this.getDemoLaunchParams(index))
      : null;
    if (typeof onLaunchPrepared === "function") {
      onLaunchPrepared(params);
    }
    return !!params;
  };

  SparkPlayAlongActionService.prototype.saveSearchResultAndRender = function(index, onRender) {
    return this.saveSearchResult(index).then(function(saved) {
      if (saved && typeof onRender === "function") onRender();
      return saved;
    });
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

  SparkPlayAlongActionService.prototype.saveSpotifyClientIdFromPrompt = function() {
    var input = document.getElementById("spotify-client-id-input");
    return !!(input && this.saveSpotifyClientId(input.value));
  };

  SparkPlayAlongActionService.prototype.createSpotifyAuthManager = function() {
    if (typeof SparkSpotifyAuthManager === "undefined") return null;
    return new SparkSpotifyAuthManager();
  };

  SparkPlayAlongActionService.prototype.buildSpotifyClientIdPromptMarkup = function() {
    return "<div class=card style=padding:20px;text-align:center>"
      + "<div style=font-size:14px;font-weight:700;margin-bottom:8px>Spotify Client ID</div>"
      + "<div style=font-size:12px;color:var(--text-dim);margin-bottom:12px>Get yours at developer.spotify.com/dashboard</div>"
      + "<input id=spotify-client-id-input class=input type=text placeholder=Paste client ID here style=width:100%;margin-bottom:8px>"
      + "<button class=btn onclick=sparkPlayAlongSaveClientId() style=background:var(--accent);color:#fff>Save and Connect</button>"
      + "</div>";
  };

  SparkPlayAlongActionService.prototype.showSpotifyClientIdPrompt = function(container) {
    if (!container) return false;
    container.innerHTML = this.buildSpotifyClientIdPromptMarkup();
    return true;
  };

  SparkPlayAlongActionService.prototype.getSpotifyRedirectUri = function() {
    var redirectUri = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") + "index.html";
    if (redirectUri.indexOf("file://") === 0) {
      redirectUri = "http://127.0.0.1:3456/callback";
    }
    return redirectUri;
  };

  SparkPlayAlongActionService.prototype.configureSpotifyAuth = function(clientId) {
    if (typeof SparkSpotifyAuthManager === "undefined" || !clientId) return false;
    SparkSpotifyAuthManager.configure({
      clientId: String(clientId).trim(),
      redirectUri: this.getSpotifyRedirectUri()
    });
    return true;
  };

  SparkPlayAlongActionService.prototype.openSpotifyAuthUrl = function(url) {
    if (!url) return false;
    if (typeof window.electron !== "undefined" && window.electron.shell) {
      window.electron.shell.openExternal(url);
    } else {
      window.location.href = url;
    }
    return true;
  };

  SparkPlayAlongActionService.prototype.bindSpotifyCallback = function(authManager, onTokenData) {
    if (!authManager || !window.electron || !window.electron.spotify || !window.electron.spotify.onCallback) {
      return false;
    }
    window.electron.spotify.onCallback(function(code) {
      authManager.exchangeCode(code).then(function(tokenData) {
        if (typeof onTokenData === "function") onTokenData(tokenData);
      });
    });
    return true;
  };

  SparkPlayAlongActionService.prototype.resumeSpotifyConnection = function(authManager, onToken) {
    if (!authManager || typeof authManager.isConnected !== "function" || !authManager.isConnected()) {
      return Promise.resolve(false);
    }
    return authManager.getValidToken().then(function(token) {
      if (typeof onToken === "function") onToken(token);
      return !!token;
    });
  };

  SparkPlayAlongActionService.prototype.requestSpotifyAuthUrl = function(authManager) {
    if (!authManager || typeof authManager.getAuthUrl !== "function") {
      return Promise.reject(new Error("Spotify auth manager unavailable"));
    }
    return authManager.getAuthUrl();
  };

  SparkPlayAlongActionService.prototype.connectSpotify = function(onConnected) {
    var authManager = this.createSpotifyAuthManager();
    var self = this;
    if (!authManager) {
      alert("Spotify integration not loaded.");
      return Promise.resolve(false);
    }

    return this.resumeSpotifyConnection(authManager, function(token) {
      if (
        token &&
        self.stateService &&
        typeof self.stateService.initSpotify === "function" &&
        self.stateService.initSpotify(token)
      ) {
        if (typeof onConnected === "function") onConnected();
      }
    }).then(function(reused) {
      var clientId;
      if (reused) return true;

      clientId = self.getSpotifyClientId();
      if (!clientId) {
        self.showSpotifyClientIdPrompt(self.getSpotifyPromptContainer());
        return false;
      }

      if (!self.configureSpotifyAuth(clientId)) return false;

      self.requestSpotifyAuthUrl(authManager).then(function(url) {
        self.openSpotifyAuthUrl(url);
      }).catch(function(err) {
        console.error("Spotify auth URL generation failed:", err);
      });

      self.bindSpotifyCallback(authManager, function(tokenData) {
        if (
          tokenData &&
          tokenData.access_token &&
          self.stateService &&
          typeof self.stateService.initSpotify === "function" &&
          self.stateService.initSpotify(tokenData.access_token)
        ) {
          if (typeof onConnected === "function") onConnected();
        }
      });

      return true;
    });
  };

  SparkPlayAlongActionService.prototype.connectSpotifyAndRender = function(onRender) {
    return this.connectSpotify(function() {
      if (typeof onRender === "function") onRender();
    });
  };

  SparkPlayAlongActionService.prototype.saveSpotifyClientIdAndConnect = function(onConnected) {
    if (!this.saveSpotifyClientIdFromPrompt()) return false;
    this.connectSpotify(onConnected);
    return true;
  };

  SparkPlayAlongActionService.prototype.saveSpotifyClientIdAndConnectAndRender = function(onRender) {
    if (!this.saveSpotifyClientIdFromPrompt()) return false;
    this.connectSpotifyAndRender(onRender);
    return true;
  };

  SparkPlayAlongActionService.prototype.toggleDebugDashboard = function() {
    window._playAlongDebug = !window._playAlongDebug;

    if (window._playAlongDebug && typeof SparkDebugDashboard !== "undefined") {
      window._playAlongDashboard = new SparkDebugDashboard(document.body);
      window._playAlongDashboard.show();
    } else if (!window._playAlongDebug && window._playAlongDashboard) {
      window._playAlongDashboard.hide();
    }

    return !!window._playAlongDebug;
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
    var core = this.stateService && typeof this.stateService.getCore === "function"
      ? this.stateService.getCore()
      : null;
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
    var demos = typeof window !== "undefined" && typeof window.getSparkPlayAlongDemos === "function"
      ? window.getSparkPlayAlongDemos()
      : [];
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
