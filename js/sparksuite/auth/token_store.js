(function() {
  /**
   * SparkTokenStore -- persists Spotify OAuth tokens in localStorage.
   * Never exposes raw tokens to the UI layer.
   */
  var STORAGE_KEY = "sparksuite_spotify_token";

  function TokenStore() {}

  TokenStore.prototype.save = function(tokenData) {
    if (!tokenData) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
    } catch (e) { /* storage full or disabled */ }
  };

  TokenStore.prototype.load = function() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  TokenStore.prototype.clear = function() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  };

  TokenStore.prototype.hasToken = function() {
    return !!this.load();
  };

  window.SparkTokenStore = TokenStore;
})();
