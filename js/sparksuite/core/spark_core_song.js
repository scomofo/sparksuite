/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Song sessions and the song browser
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.buildSongSessionRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    var songData = Object.prototype.hasOwnProperty.call(options, "songData")
      ? this.cloneValue(options.songData)
      : this.cloneValue(runtimeState.songSessionData);
    return {
      songData: songData,
      source: Object.prototype.hasOwnProperty.call(options, "source")
        ? options.source
        : (runtimeState.songSessionSource || "builtin"),
      songPlaying: Object.prototype.hasOwnProperty.call(options, "songPlaying")
        ? !!options.songPlaying
        : false,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat")
        ? Math.max(0, Math.round(options.songBeat || 0))
        : 0,
      targetScreen: Object.prototype.hasOwnProperty.call(options, "targetScreen")
        ? options.targetScreen
        : "song"
    };
  };

  SparkCore.prototype.openSongSession = function(options) {
    var request = this.buildSongSessionRequest(options);
    this.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: request.targetScreen,
      activeTab: "songs",
      songSessionData: request.songData,
      songSessionSource: request.source,
      songPlaying: !!request.songPlaying,
      songBeat: request.songBeat,
      transport: {
        status: request.songPlaying ? "running" : "ready",
        positionMs: 0
      }
    });
    return request;
  };

  SparkCore.prototype.syncSongRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "song_session",
      activeScreen: runtimeState.activeScreen || "song",
      activeTab: runtimeState.activeTab || "songs",
      songSessionData: this.cloneValue(runtimeState.songSessionData),
      songSessionSource: runtimeState.songSessionSource || "builtin",
      songPlaying: !!runtimeState.songPlaying,
      songBeat: runtimeState.songBeat || 0,
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "songData")) {
      next.songSessionData = this.cloneValue(options.songData);
    }
    if (Object.prototype.hasOwnProperty.call(options, "source")) {
      next.songSessionSource = options.source || next.songSessionSource;
    }
    if (Object.prototype.hasOwnProperty.call(options, "songPlaying")) {
      next.songPlaying = !!options.songPlaying;
    }
    if (Object.prototype.hasOwnProperty.call(options, "songBeat")) {
      next.songBeat = Math.max(0, Math.round(options.songBeat || 0));
    }
    if (Object.prototype.hasOwnProperty.call(options, "targetScreen")) {
      next.activeScreen = options.targetScreen || next.activeScreen;
    }

    if (action === "play") {
      next.songPlaying = true;
      next.songBeat = Object.prototype.hasOwnProperty.call(options, "songBeat") ? next.songBeat : 0;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.songPlaying = false;
      next.transport = { status: "ready", positionMs: 0 };
    } else if (action === "tick") {
      if (typeof options.progressionLength === "number" && options.progressionLength > 0) {
        next.songBeat = (Math.round(runtimeState.songBeat || 0) + 1) % Math.round(options.progressionLength);
      }
      next.transport = { status: next.songPlaying ? "running" : "ready", positionMs: 0 };
    } else if (action === "complete") {
      next.songPlaying = false;
      next.activeScreen = "song_done";
      next.transport = { status: "completed", positionMs: 0 };
    } else if (action === "open_song") {
      next.songPlaying = false;
      next.songBeat = Object.prototype.hasOwnProperty.call(options, "songBeat") ? next.songBeat : 0;
      next.activeScreen = options.targetScreen || "song";
      next.transport = { status: "ready", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.buildSongNavigationRequest = function(target, options) {
    var runtimeState = this.getRuntimeState();
    var request = {
      target: target || "songs_home",
      activeFlow: runtimeState.activeFlow || "song_session",
      activeScreen: runtimeState.activeScreen || "song",
      activeTab: "songs",
      songPlaying: false,
      songBeat: runtimeState.songBeat || 0,
      transport: { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (request.target === "songs_home") {
      request.activeScreen = "home";
    } else if (request.target === "song_detail") {
      request.activeScreen = "song";
      request.transport.status = runtimeState.songPlaying ? "running" : "ready";
      request.songPlaying = !!runtimeState.songPlaying;
    } else if (request.target === "song_done") {
      request.activeScreen = "song_done";
      request.transport.status = "completed";
    }

    if (Object.prototype.hasOwnProperty.call(options, "songBeat")) {
      request.songBeat = Math.max(0, Math.round(options.songBeat || 0));
    }

    return request;
  };

  SparkCore.prototype.applySongNavigationRequest = function(target, options) {
    var request = this.buildSongNavigationRequest(target, options);
    return this.updateRuntimeState({
      activeFlow: request.activeFlow,
      activeScreen: request.activeScreen,
      activeTab: request.activeTab,
      songPlaying: request.songPlaying,
      songBeat: request.songBeat,
      transport: request.transport
    });
  };

  SparkCore.prototype.completeSongSession = function(options) {
    options = options || {};
    this.syncSongRuntimeState("complete", {
      songData: Object.prototype.hasOwnProperty.call(options, "songData") ? options.songData : this.runtimeState.songSessionData,
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : this.runtimeState.songSessionSource,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : this.runtimeState.songBeat
    });
    return this.buildSongNavigationRequest("song_done", options);
  };

  SparkCore.prototype.buildSongBrowserRequest = function(action, options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      action: action || "songs_subtab",
      songsSubTab: Object.prototype.hasOwnProperty.call(options, "songsSubTab")
        ? options.songsSubTab
        : runtimeState.songsSubTab,
      songFilter: Object.prototype.hasOwnProperty.call(options, "songFilter")
        ? options.songFilter
        : runtimeState.songFilter,
      songSort: Object.prototype.hasOwnProperty.call(options, "songSort")
        ? options.songSort
        : runtimeState.songSort,
      songSortAsc: Object.prototype.hasOwnProperty.call(options, "songSortAsc")
        ? !!options.songSortAsc
        : runtimeState.songSortAsc,
      communityTab: Object.prototype.hasOwnProperty.call(options, "communityTab")
        ? options.communityTab
        : runtimeState.communityTab,
      communitySearch: Object.prototype.hasOwnProperty.call(options, "communitySearch")
        ? options.communitySearch
        : runtimeState.communitySearch,
      communitySort: Object.prototype.hasOwnProperty.call(options, "communitySort")
        ? options.communitySort
        : runtimeState.communitySort
    };
  };

  SparkCore.prototype.applySongBrowserRequest = function(action, options) {
    var request = this.buildSongBrowserRequest(action, options);
    return this.updateRuntimeState({
      activeTab: "songs",
      songsSubTab: request.songsSubTab,
      songFilter: request.songFilter,
      songSort: request.songSort,
      songSortAsc: request.songSortAsc,
      communityTab: request.communityTab,
      communitySearch: request.communitySearch,
      communitySort: request.communitySort
    });
  };
})();
