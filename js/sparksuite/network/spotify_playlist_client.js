(function() {
  function SpotifyPlaylistClient(options) {
    options = options || {};
    this.baseUrl = options.baseUrl || "http://localhost:3456/api/spotify";
  }

  SpotifyPlaylistClient.prototype._request = function(path, options) {
    options = options || {};
    return fetch(this.baseUrl + path, options).then(function(res) {
      return res.text().then(function(text) {
        var body = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(body && body.error ? body.error : ("Request failed: " + res.status));
        }
        return body;
      });
    });
  };

  SpotifyPlaylistClient.prototype.getConnectUrl = function(returnTo) {
    var query = returnTo ? ("?returnTo=" + encodeURIComponent(returnTo)) : "";
    return this._request("/connect-url" + query).then(function(body) {
      return body.authUrl;
    });
  };

  SpotifyPlaylistClient.prototype.getStatus = function() {
    return this._request("/status");
  };

  SpotifyPlaylistClient.prototype.disconnect = function() {
    return this._request("/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
  };

  SpotifyPlaylistClient.prototype.createCurriculumPlaylist = function(input) {
    input = input || {};
    return this._request("/playlists/" + encodeURIComponent(input.curriculumKey) + "/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        public: !!input.public,
        syncMode: input.syncMode || "append_missing"
      })
    });
  };

  SpotifyPlaylistClient.prototype.syncCurriculumPlaylist = function(input) {
    input = input || {};
    return this._request("/playlists/" + encodeURIComponent(input.curriculumKey) + "/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        public: !!input.public,
        syncMode: input.syncMode || "append_missing",
        createIfMissing: input.createIfMissing !== false,
        tracks: Array.isArray(input.tracks) ? input.tracks : []
      })
    });
  };

  window.SparkSpotifyPlaylistClient = SpotifyPlaylistClient;
})();
