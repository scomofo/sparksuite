(function() {
  var API_BASE = "https://api.spotify.com/v1";

  function SpotifyClient(token) {
    this.token = token || null;
  }

  SpotifyClient.prototype.setToken = function(token) {
    this.token = token;
  };

  SpotifyClient.prototype._headers = function() {
    return { Authorization: "Bearer " + this.token };
  };

  SpotifyClient.prototype._get = function(path) {
    if (!this.token) return Promise.reject(new Error("SpotifyClient: no token set"));
    return fetch(API_BASE + path, { headers: this._headers() })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(body) {
          var msg = body && body.error && body.error.message ? body.error.message : res.statusText;
          throw new Error("Spotify API " + res.status + ": " + msg);
        });
        return res.json();
      });
  };

  SpotifyClient.prototype._put = function(path, body) {
    if (!this.token) return Promise.reject(new Error("SpotifyClient: no token set"));
    var opts = { method: "PUT", headers: this._headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(API_BASE + path, opts)
      .then(function(res) {
        if (!res.ok && res.status !== 204) {
          return res.json().then(function(b) {
            var msg = b && b.error && b.error.message ? b.error.message : res.statusText;
            throw new Error("Spotify API " + res.status + ": " + msg);
          });
        }
        return res.status === 204 ? null : res.json();
      });
  };

  SpotifyClient.prototype.getTrack = function(trackId) {
    return this._get("/tracks/" + encodeURIComponent(trackId));
  };

  SpotifyClient.prototype.getAudioFeatures = function(trackId) {
    return this._get("/audio-features/" + encodeURIComponent(trackId));
  };

  SpotifyClient.prototype.play = function(trackUri, deviceId) {
    var path = "/me/player/play";
    if (deviceId) path += "?device_id=" + encodeURIComponent(deviceId);
    return this._put(path, { uris: [trackUri] });
  };

  SpotifyClient.prototype.pause = function() {
    return this._put("/me/player/pause");
  };

  SpotifyClient.prototype.seek = function(positionMs) {
    return this._put("/me/player/seek?position_ms=" + Math.round(positionMs));
  };

  SpotifyClient.prototype.getPlaybackState = function() {
    return this._get("/me/player");
  };

  SpotifyClient.prototype.searchTracks = function(query, limit) {
    limit = limit || 10;
    return this._get("/search?type=track&limit=" + limit + "&q=" + encodeURIComponent(query));
  };

  window.SparkSpotifyClient = SpotifyClient;
})();
