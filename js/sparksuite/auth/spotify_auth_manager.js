(function() {
  /**
   * SparkSpotifyAuthManager -- handles Spotify PKCE OAuth flow,
   * token refresh, and connection state.
   *
   * Uses Authorization Code with PKCE (no client_secret required).
   * Config must be set via SparkSpotifyAuthManager.configure() before use.
   */

  var VERIFIER_STORAGE_KEY = "sparksuite_spotify_code_verifier";

  var _config = {
    clientId: null,
    redirectUri: null,
    scopes: "user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private"
  };

  // --- PKCE helpers ---

  function generateRandomString(length) {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    var values = crypto.getRandomValues(new Uint8Array(length));
    var result = "";
    for (var i = 0; i < length; i++) {
      result += possible[values[i] % possible.length];
    }
    return result;
  }

  function sha256(plain) {
    var encoder = new TextEncoder();
    var data = encoder.encode(plain);
    return crypto.subtle.digest("SHA-256", data);
  }

  function base64urlencode(buffer) {
    var bytes = new Uint8Array(buffer);
    var str = "";
    for (var i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // --- Auth Manager ---

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
   * Get the Spotify authorization URL for the PKCE OAuth flow.
   * Returns a Promise that resolves to the URL string.
   * Generates and stores a code_verifier in localStorage.
   */
  SpotifyAuthManager.prototype.getAuthUrl = function() {
    if (!_config.clientId || !_config.redirectUri) {
      throw new Error("SpotifyAuthManager: call configure() with clientId and redirectUri first");
    }

    var verifier = generateRandomString(128);
    localStorage.setItem(VERIFIER_STORAGE_KEY, verifier);

    return sha256(verifier).then(function(hashed) {
      var challenge = base64urlencode(hashed);
      return "https://accounts.spotify.com/authorize" +
        "?client_id=" + encodeURIComponent(_config.clientId) +
        "&response_type=code" +
        "&redirect_uri=" + encodeURIComponent(_config.redirectUri) +
        "&scope=" + encodeURIComponent(_config.scopes) +
        "&code_challenge_method=S256" +
        "&code_challenge=" + encodeURIComponent(challenge) +
        "&show_dialog=false";
    });
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
   * Exchange an authorization code for tokens using PKCE.
   * Reads the code_verifier from localStorage (stored during getAuthUrl).
   */
  SpotifyAuthManager.prototype.exchangeCode = function(code) {
    var self = this;
    var codeVerifier = localStorage.getItem(VERIFIER_STORAGE_KEY);

    return fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=authorization_code" +
        "&code=" + encodeURIComponent(code) +
        "&redirect_uri=" + encodeURIComponent(_config.redirectUri) +
        "&client_id=" + encodeURIComponent(_config.clientId) +
        "&code_verifier=" + encodeURIComponent(codeVerifier)
    }).then(function(res) { return res.json(); })
      .then(function(tokenData) {
        if (tokenData.access_token) {
          tokenData.expires_at = Date.now() / 1000 + (tokenData.expires_in || 3600);
          self.store.save(tokenData);
          localStorage.removeItem(VERIFIER_STORAGE_KEY);
        }
        return tokenData;
      });
  };

  /**
   * Refresh an expired access token. Uses client_id only (no secret).
   */
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
    localStorage.removeItem(VERIFIER_STORAGE_KEY);
  };

  window.SparkSpotifyAuthManager = SpotifyAuthManager;
})();
