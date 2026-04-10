(function() {
  /**
   * SparkConnectSpotifyButton -- renders the "Connect Spotify" / "Disconnect" button.
   * Handles all button states: default, loading, connected, error.
   */
  function ConnectSpotifyButton(container, options) {
    options = options || {};
    this.container = container;
    this.authManager = options.authManager || new SparkSpotifyAuthManager();
    this.onConnect = options.onConnect || null;
    this.onDisconnect = options.onDisconnect || null;
    this._btn = null;
    this.render();
  }

  ConnectSpotifyButton.prototype.render = function() {
    if (this._btn) this.container.removeChild(this._btn);

    this._btn = document.createElement("button");
    this._btn.className = "spotify-connect";

    var self = this;
    if (this.authManager.isConnected()) {
      this._btn.textContent = "Disconnect Spotify";
      this._btn.classList.add("connected");
      this._btn.onclick = function() { self._disconnect(); };
    } else {
      this._btn.textContent = "Connect Spotify";
      this._btn.onclick = function() { self._connect(); };
    }

    this.container.appendChild(this._btn);
  };

  ConnectSpotifyButton.prototype._connect = function() {
    this._btn.textContent = "Connecting...";
    this._btn.disabled = true;
    window.location.href = this.authManager.getAuthUrl();
  };

  ConnectSpotifyButton.prototype._disconnect = function() {
    this.authManager.disconnect();
    if (typeof this.onDisconnect === "function") this.onDisconnect();
    this.render();
  };

  ConnectSpotifyButton.prototype.setConnected = function() {
    this._btn.textContent = "Connected";
    this._btn.classList.add("connected");
    this._btn.disabled = false;
    if (typeof this.onConnect === "function") this.onConnect();
    var self = this;
    setTimeout(function() { self.render(); }, 1500);
  };

  window.SparkConnectSpotifyButton = ConnectSpotifyButton;
})();
