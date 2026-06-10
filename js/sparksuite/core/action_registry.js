(function() {
  var SparkActions = Object.freeze({
    PRACTICE_START: "practice.start",
    PRACTICE_COMPLETE: "practice.complete",
    PRACTICE_RESTART: "practice.restart",
    PRACTICE_OPEN_STATS: "practice.openStats",
    SESSION_START: "session.start",
    SESSION_COMPLETE: "session.complete",
    SESSION_CANCEL: "session.cancel",
    INSTRUMENT_SELECT: "instrument.select",
    LESSON_OPEN: "lesson.open",
    SEGMENT_START: "segment.start",
    EXERCISE_START: "exercise.start",
    EXERCISE_COMPLETE: "exercise.complete",
    SONG_START: "song.start",
    CHALLENGE_START: "challenge.start",
    SESSION_SEGMENT_START: "session.segment.start",
    SESSION_SEGMENT_PRACTICE: "session.segment.practice",
    SESSION_SEGMENT_SONG: "session.segment.song",
    SESSION_SEGMENT_CHALLENGE: "session.segment.challenge",
    SESSION_SEGMENT_WARM_ENGINE: "session.segment.warm_engine",
    SESSION_SEGMENT_DRILL: "session.segment.drill",
    SESSION_SEGMENT_COOLDOWN: "session.segment.cooldown",
    SESSION_SEGMENT_REVIEW: "session.segment.review",
    SESSION_SEGMENT_NEW_MOVE: "session.segment.newMove",
    SESSION_SEGMENT_SONG_SLICE: "session.segment.songSlice",
    SESSION_SEGMENT_VICTORY_LAP: "session.segment.victoryLap"
  });

  var knownActionNames = Object.freeze(Object.keys(SparkActions).map(function(key) {
    return SparkActions[key];
  }));

  function isKnownSparkAction(actionName) {
    return knownActionNames.indexOf(actionName) >= 0;
  }

  function listKnownSparkActions() {
    return knownActionNames.slice();
  }

  if (typeof window !== "undefined") {
    window.SparkActions = SparkActions;
    window.isKnownSparkAction = isKnownSparkAction;
    window.listKnownSparkActions = listKnownSparkActions;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkActions: SparkActions,
      isKnownSparkAction: isKnownSparkAction,
      listKnownSparkActions: listKnownSparkActions
    };
  }
})();
