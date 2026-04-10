(function() {
  /**
   * SparkSongListItem -- renders a single track row in the song picker.
   * Shows album art, track name, artist, and duration.
   */
  var SparkSongListItem = {
    create: function(track, onClick) {
      var div = document.createElement("div");
      div.className = "song-item";

      var img = "";
      if (track.image) {
        img = '<img src="' + escapeHtml(track.image) + '" width="40" height="40" class="song-item-art"/>';
      }

      var duration = track.duration ? formatDuration(track.duration) : "";

      div.innerHTML = img +
        '<div class="song-item-info">' +
          '<strong class="song-item-name">' + escapeHtml(track.name || "") + '</strong>' +
          '<span class="song-item-artist">' + escapeHtml(track.artist || "") + '</span>' +
        '</div>' +
        (duration ? '<span class="song-item-duration">' + duration + '</span>' : '');

      div.onclick = function() {
        if (typeof onClick === "function") onClick(track);
      };

      return div;
    }
  };

  function formatDuration(ms) {
    var sec = Math.floor(ms / 1000);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  window.SparkSongListItem = SparkSongListItem;
})();
