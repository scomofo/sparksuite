(function() {
  /**
   * SparkSongPicker -- search + select UI for "Play Any Song".
   * Renders a search input, results list, and recent tracks.
   */
  function SongPicker(container, options) {
    options = options || {};
    this.container = container;
    this.spotifySearch = options.spotifySearch || null;
    this.trackSelector = options.trackSelector || null;
    this.onSelect = options.onSelect || null;
    this.difficulty = options.difficulty || "easy";
    this._input = null;
    this._resultsEl = null;
    this._recentEl = null;
    this._difficultyEl = null;
  }

  SongPicker.prototype.render = function() {
    this.container.innerHTML = "";

    // Search input
    this._input = document.createElement("input");
    this._input.type = "text";
    this._input.placeholder = "Search any song...";
    this._input.className = "song-picker-input";
    this.container.appendChild(this._input);

    // Difficulty toggle
    this._difficultyEl = document.createElement("div");
    this._difficultyEl.className = "song-picker-difficulty";
    this._renderDifficultyToggle();
    this.container.appendChild(this._difficultyEl);

    // Results container
    this._resultsEl = document.createElement("div");
    this._resultsEl.className = "song-picker-results";
    this.container.appendChild(this._resultsEl);

    // Recent tracks
    this._recentEl = document.createElement("div");
    this._recentEl.className = "song-picker-recent";
    this._renderRecent();
    this.container.appendChild(this._recentEl);

    // Wire up search
    var self = this;
    this._input.oninput = function() {
      var query = self._input.value;
      if (!query || query.length < 2) {
        self._resultsEl.innerHTML = "";
        self._recentEl.style.display = "";
        return;
      }
      self._recentEl.style.display = "none";
      if (self.spotifySearch) {
        self.spotifySearch.searchDebounced(query, function(tracks) {
          self._renderResults(tracks);
        });
      }
    };
  };

  SongPicker.prototype._renderResults = function(tracks) {
    this._resultsEl.innerHTML = "";
    var self = this;
    for (var i = 0; i < tracks.length; i++) {
      var item = SparkSongListItem.create(tracks[i], function(track) {
        self._selectTrack(track);
      });
      this._resultsEl.appendChild(item);
    }
  };

  SongPicker.prototype._renderRecent = function() {
    this._recentEl.innerHTML = "";
    if (!this.trackSelector) return;
    var recent = this.trackSelector.getRecent();
    if (!recent.length) return;

    var label = document.createElement("div");
    label.className = "song-picker-label";
    label.textContent = "Recently Played";
    this._recentEl.appendChild(label);

    var self = this;
    for (var i = 0; i < recent.length; i++) {
      var item = SparkSongListItem.create(recent[i], function(track) {
        self._selectTrack(track);
      });
      this._recentEl.appendChild(item);
    }
  };

  SongPicker.prototype._renderDifficultyToggle = function() {
    this._difficultyEl.innerHTML = "";
    var levels = ["easy", "normal", "hard"];
    var self = this;
    for (var i = 0; i < levels.length; i++) {
      (function(level) {
        var btn = document.createElement("button");
        btn.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        btn.className = "difficulty-btn" + (self.difficulty === level ? " active" : "");
        btn.onclick = function() {
          self.difficulty = level;
          self._renderDifficultyToggle();
        };
        self._difficultyEl.appendChild(btn);
      })(levels[i]);
    }
  };

  SongPicker.prototype._selectTrack = function(track) {
    if (typeof this.onSelect === "function") {
      this.onSelect(track, this.difficulty);
    }
  };

  window.SparkSongPicker = SongPicker;
})();
