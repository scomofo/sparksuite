(function() {
  /**
   * SparkSpotifyCallbackHandler -- processes OAuth callback on page load.
   * Extracts authorization code from URL, exchanges for token, cleans URL.
   *
   * Call SparkSpotifyCallbackHandler.handle() early in app initialization.
   */
  function CallbackHandler() {}

  /**
   * Check if current URL contains a Spotify callback code and handle it.
   * @returns {Promise<boolean>} true if a callback was processed
   */
  CallbackHandler.handle = function() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get("code");
    if (!code) return Promise.resolve(false);

    var authManager = new SparkSpotifyAuthManager();
    return authManager.exchangeCode(code).then(function(tokenData) {
      // Clean URL to remove code parameter
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Auto-initialize SparkCore Spotify if available
      if (tokenData.access_token && typeof window.sparkCore !== "undefined" && window.sparkCore.initSpotify) {
        window.sparkCore.initSpotify(tokenData.access_token);
      }

      return true;
    }).catch(function() {
      return false;
    });
  };

  window.SparkSpotifyCallbackHandler = CallbackHandler;
})();
