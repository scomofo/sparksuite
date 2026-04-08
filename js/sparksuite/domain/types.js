(function() {
  var SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice",
    FLOW_GUIDED_SESSION: "guided_session",
    FLOW_PERFORMANCE_SONG: "performance_song"
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

  window.SparkSessionTypes = SparkSessionTypes;
  window.SparkSessionSegmentTypes = SparkSessionSegmentTypes;
})();
