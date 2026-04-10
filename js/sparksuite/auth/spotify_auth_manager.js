(function() {
  /**
   * SparkSpotifyAuthManager -- handles OAuth flow, token refresh, and connection state.
   *
   * IMPORTANT: In production, token exchange must happen on a backend service
   * to protect CLIENT_SECRET. This client-side implementation is for development.
   *
   * Config must be set via SparkSpotifyAuthManager.configure() before use.
   */
  var _config = {
    clientId: null,
    redirectUri: null,
    scopes: "user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private"
  };

  function SpotifyAuthManager() {
    this.store = new SparkTokenStore();
  }

  /**
   * Set OAuth config. Call once at app startup.
   * @param {Object} config - { clientId, redirectUri, scopes? }
   */
  SpotifyAuthManager.configure = function(config) {
    config = config || {};
    if (config.clientId) _config.clientId = config.clientId;
    if (config.redirectUri) _config.redirectUri = config.redirectUri;
    if (config.scopes) _config.scopes = config.scopes;
  };

  /**
   * Get the Spotify authorization URL for the OAuth redirect flow.
   */
  SpotifyAuthManager.prototype.getAuthUrl = function() {
    if (!_config.clientId || !_config.redirectUri) {
      throw new Error("SpotifyAuthManager: call configure() with clientId and redirectUri first");
    }
    return "https://accounts.spotify.com/authorize" +
      "?client_id=" + encodeURIComponent(_config.clientId) +
      "&response_type=code" +
      "&redirect_uri=" + encodeURIComponent(_config.redirectUri) +
      "&scope=" + encodeURIComponent(_config.scopes) +
      "&show_dialog=false";
  };

  SpotifyAuthManager.prototype.isConnected = function() {
    return this.store.hasToken();
  };

  /**
   * Get a valid access token, refreshing if expired.
   * @returns {Promise<string|null>}
   */
  SpotifyAuthManager.prototype.getValidToken = function() {
    var data = this.store.load();
    if (!data) return Promise.resolve(null);

    var now = Date.now() / 1000;
    if (data.expires_at && now < data.expires_at) {
      return Promise.resolve(data.access_token);
    }

    // Token expired, try refresh
    if (!data.refresh_token) return Promise.resolve(null);
    return this._refreshToken(data);
  };

  /**
   * Exchange an authorization code for tokens.
   * NOTE: In production, this should happen on a backend server.
   */
  SpotifyAuthManager.prototype.exchangeCode = function(code) {
    var self = this;
    return fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=authorization_code" +
        "&code=" + encodeURIComponent(code) +
        "&redirect_uri=" + encodeURIComponent(_config.redirectUri) +
        "&client_id=" + encodeURIComponent(_config.clientId)
    }).then(function(res) { return res.json(); })
      .then(function(tokenData) {
        if (tokenData.access_token) {
          tokenData.expires_at = Date.now() / 1000 + (tokenData.expires_in || 3600);
          self.store.save(tokenData);
        }
        return tokenData;
      });
  };

  SpotifyAuthManager.prototype._refreshToken = function(data) {
    var self = this;
    return fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token" +
        "&refresh_token=" + encodeURIComponent(data.refresh_token) +
        "&client_id=" + encodeURIComponent(_config.clientId)
    }).then(function(res) { return res.json(); })
      .then(function(refreshed) {
        if (refreshed.access_token) {
          var updated = {
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || data.refresh_token,
            expires_in: refreshed.expires_in || 3600,
            expires_at: Date.now() / 1000 + (refreshed.expires_in || 3600)
          };
          self.store.save(updated);
          return updated.access_token;
        }
        return null;
      });
  };

  SpotifyAuthManager.prototype.disconnect = function() {
    this.store.clear();
  };

  window.SparkSpotifyAuthManager = SpotifyAuthManager;
})();
