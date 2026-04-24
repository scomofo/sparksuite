(function() {
  var SparkCoreCtor = null;
  if (typeof SparkCoreRuntime === "function") SparkCoreCtor = SparkCoreRuntime;
  else if (typeof SparkCore === "function") SparkCoreCtor = SparkCore;
  if (!SparkCoreCtor) return;

  SparkCoreCtor.prototype.initSpotifyPlaylistSync = function(options) {
    options = options || {};
    this.spotifyPlaylistClient = options.client || new SparkSpotifyPlaylistClient(options);
    return this.spotifyPlaylistClient;
  };

  SparkCoreCtor.prototype.getSpotifyPlaylistClient = function() {
    if (!this.spotifyPlaylistClient && typeof SparkSpotifyPlaylistClient !== "undefined") {
      this.spotifyPlaylistClient = new SparkSpotifyPlaylistClient();
    }
    return this.spotifyPlaylistClient || null;
  };

  SparkCoreCtor.prototype.syncSpotifyPlaylistStatus = function() {
    var self = this;
    var client = this.getSpotifyPlaylistClient();
    if (!client || typeof client.getStatus !== "function") return Promise.resolve(null);
    return client.getStatus().then(function(status) {
      self.updateRuntimeState({
        spotifyPlaylistConnected: !!status.connected,
        spotifyPlaylistPlaylists: self.cloneValue(status.playlists || []),
        spotifyPlaylistLastSyncAt: status.lastSyncAt || null,
        spotifyPlaylistSyncStatus: "idle",
        spotifyPlaylistError: null
      });
      return status;
    }).catch(function(err) {
      self.updateRuntimeState({
        spotifyPlaylistSyncStatus: "error",
        spotifyPlaylistError: err.message || String(err)
      });
      throw err;
    });
  };

  SparkCoreCtor.prototype.connectSpotifyPlaylist = function(options) {
    var client = this.getSpotifyPlaylistClient();
    if (!client || typeof client.getConnectUrl !== "function") return Promise.resolve(false);
    options = options || {};
    return client.getConnectUrl(options.returnTo || window.location.href).then(function(url) {
      if (options.openInPlace === false) return url;
      window.location.href = url;
      return true;
    });
  };

  SparkCoreCtor.prototype.disconnectSpotifyPlaylist = function() {
    var self = this;
    var client = this.getSpotifyPlaylistClient();
    if (!client || typeof client.disconnect !== "function") return Promise.resolve(false);
    return client.disconnect().then(function(result) {
      self.updateRuntimeState({
        spotifyPlaylistConnected: false,
        spotifyPlaylistPlaylists: [],
        spotifyPlaylistLastSyncAt: null,
        spotifyPlaylistLastResult: null,
        spotifyPlaylistUnresolvedTracks: [],
        spotifyPlaylistSyncStatus: "idle",
        spotifyPlaylistError: null
      });
      return result;
    });
  };

  SparkCoreCtor.prototype.createSpotifyCurriculumPlaylist = function(input) {
    var self = this;
    var client = this.getSpotifyPlaylistClient();
    if (!client || typeof client.createCurriculumPlaylist !== "function") return Promise.resolve(null);
    return client.createCurriculumPlaylist(input).then(function(result) {
      return self.syncSpotifyPlaylistStatus().then(function() {
        return result;
      });
    });
  };

  SparkCoreCtor.prototype.syncSpotifyCurriculumPlaylist = function(input) {
    var self = this;
    var client = this.getSpotifyPlaylistClient();
    if (!client || typeof client.syncCurriculumPlaylist !== "function") return Promise.resolve(null);
    self.updateRuntimeState({
      spotifyPlaylistSyncStatus: "syncing",
      spotifyPlaylistError: null
    });
    return client.syncCurriculumPlaylist(input).then(function(result) {
      self.updateRuntimeState({
        spotifyPlaylistSyncStatus: "ok",
        spotifyPlaylistLastSyncAt: new Date().toISOString(),
        spotifyPlaylistLastResult: self.cloneValue(result),
        spotifyPlaylistUnresolvedTracks: self.cloneValue(result && result.unresolvedTracks ? result.unresolvedTracks : []),
        spotifyPlaylistError: null
      });
      return self.syncSpotifyPlaylistStatus().then(function() {
        return result;
      });
    }).catch(function(err) {
      self.updateRuntimeState({
        spotifyPlaylistSyncStatus: "error",
        spotifyPlaylistError: err.message || String(err)
      });
      throw err;
    });
  };
})();
