(function() {
  /**
   * SparkSpotifySearch -- wraps Spotify search API with debouncing.
   * Returns normalized track objects for the song picker UI.
   */
  var DEBOUNCE_MS = 300;

  function SpotifySearch(spotifyClient) {
    this.client = spotifyClient;
    this._timer = null;
  }

  /**
   * Search Spotify tracks.
   * @param {string} query
   * @param {number} [limit=10]
   * @returns {Promise<Array>} [{id, uri, name, artist, duration, image}]
   */
  SpotifySearch.prototype.search = function(query, limit) {
    if (!query || !query.trim()) return Promise.resolve([]);
    return this.client.searchTracks(query, limit || 10).then(function(data) {
      if (!data || !data.tracks || !data.tracks.items) return [];
      return data.tracks.items.map(function(track) {
        return {
          id: track.id,
          uri: track.uri,
          name: track.name,
          artist: track.artists ? track.artists.map(function(a) { return a.name; }).join(", ") : "",
          duration: track.duration_ms || 0,
          image: (track.album && track.album.images && track.album.images.length)
            ? track.album.images[0].url : null
        };
      });
    });
  };

  /**
   * Debounced search -- call from input handler.
   * @param {string} query
   * @param {Function} callback - called with results array
   */
  SpotifySearch.prototype.searchDebounced = function(query, callback) {
    var self = this;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(function() {
      self.search(query).then(callback).catch(function() { callback([]); });
    }, DEBOUNCE_MS);
  };

  window.SparkSpotifySearch = SpotifySearch;
})();
