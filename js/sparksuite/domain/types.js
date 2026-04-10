(function() {
  var SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice",
    FLOW_GUIDED_SESSION: "guided_session",
    FLOW_PERFORMANCE_SONG: "performance_song",
    FLOW_SPOTIFY_PLAY_ALONG: "spotify_play_along"
  };

  var SparkSessionSegmentTypes = {
    WARMUP: "warmup",
    TRANSITION: "transition",
    RHYTHM_HIGHWAY: "rhythm_highway",
    PERFORMANCE_SONG: "performance_song",
    PERFORMANCE_PHRASE: "performance_phrase",
    RHYTHM: "rhythm",
    FINGER: "finger",
    GUIDED_SESSION: "guided_session"
  };

  // Canonical segment types (V2)
  SparkSessionSegmentTypes.PRACTICE = "practice";
  SparkSessionSegmentTypes.SONG = "song";
  SparkSessionSegmentTypes.CHALLENGE = "challenge";
  SparkSessionSegmentTypes.SPOTIFY_PLAY_ALONG = "spotify_play_along";

  // Normalize legacy types to canonical
  SparkSessionSegmentTypes.normalize = function(type) {
    if (!type) return "practice";
    if (type === "rhythm_highway" || type === "rhythm" || type === "finger" || type === "warmup" || type === "transition" || type === "guided_session") return "practice";
    if (type === "performance_song" || type === "performance_phrase" || type === "song") return "song";
    if (type === "challenge") return "challenge";
    if (type === "spotify_play_along") return "song";
    return "practice";
  };

  window.SparkSessionTypes = SparkSessionTypes;
  window.SparkSessionSegmentTypes = SparkSessionSegmentTypes;
})();
