(function() {
  /**
   * SparkConnectionStatus -- renders Spotify connection state indicator.
   */
  function ConnectionStatus(container) {
    this.container = container;
    this._el = null;
  }

  ConnectionStatus.prototype.render = function(isConnected) {
    if (!this._el) {
      this._el = document.createElement("span");
      this._el.className = "spotify-status";
      this.container.appendChild(this._el);
    }

    if (isConnected) {
      this._el.textContent = "Spotify Connected";
      this._el.className = "spotify-status connected";
    } else {
      this._el.textContent = "Not Connected";
      this._el.className = "spotify-status disconnected";
    }
  };

  window.SparkConnectionStatus = ConnectionStatus;
})();
