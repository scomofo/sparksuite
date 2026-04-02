(function(){
  var PERFORMANCE_CONFIG = {
    attackClusterMs: 40,
    recentAttackWindowMs: 220,
    stemResyncThresholdMs: 120,
    stemResyncIntervalMs: 1000,
    defaultPhraseEventCount: 8,
    defaultLoopScoringMode: "practice",
    countInBeats: 4,
    countInAccentBeat: 1,
    highway: {
      scrollSpeed: 180,
      lookaheadSec: 3.0,
      hitLineTopPx: 340
    },
    ui: {
      hitBadgeMs: 800,
      debugDefault: false
    },
    latency: {
      defaultMidiOffsetMs: 0,
      defaultAudioOffsetMs: 0,
      maxOffsetMs: 200,
      minOffsetMs: -200,
      calibrationTaps: 8,
      calibrationBpm: 100
    }
  };

  window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
})();
