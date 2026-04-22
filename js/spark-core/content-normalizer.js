// js/spark-core/content-normalizer.js
(function() {

  function resolveNormalizedContentInstrument(appId, fallbackInstrument) {
    var resolvedAppId = appId || null;
    var instrument = fallbackInstrument || "guitar";
    if (resolvedAppId === "pianospark") instrument = "piano";
    else if (resolvedAppId === "ukespark") instrument = "ukulele";
    else if (resolvedAppId === "bassspark") instrument = "bass";
    else if (resolvedAppId === "drumspark") instrument = "drums";
    else if (resolvedAppId === "chordspark") instrument = "guitar";
    return {
      appId: resolvedAppId || (instrument === "piano" ? "pianospark" : "chordspark"),
      instrument: instrument
    };
  }

  function buildLegacySessionInstrumentData(instrument, session) {
    var payload = {
      chords: session.newMove ? [session.newMove.chord] : [],
      diagrams: [],
      audioKeys: []
    };
    var data = {};
    if (instrument === "piano") {
      data.piano = {
        voicings: session.newMove ? [session.newMove.voicing || session.newMove.chord] : [],
        keys: [],
        audioKeys: []
      };
      return data;
    }
    data[instrument] = payload;
    return data;
  }

  var SparkContentNormalizer = {
    fromChordSparkSessions: function(sessions, appId) {
      var normalized = resolveNormalizedContentInstrument(appId, "guitar");
      var units = [];
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        var lessonId = "guided_session_" + s.num;
        units.push({
          id: "unit_session_" + s.num,
          title: s.title || ("Session " + s.num),
          lessons: [{
            id: lessonId,
            type: "guided",
            title: s.title,
            objectives: [s.spark ? s.spark.desc : "", s.newMove ? s.newMove.desc : ""],
            skills: ["recognition", "switching"],
            difficulty: s.level || 1,
            instrumentData: buildLegacySessionInstrumentData(normalized.instrument, s),
            rewards: { xp: 30, unlockIds: [] }
          }]
        });
      }
      return {
        schemaVersion: 1,
        appId: normalized.appId,
        instrument: normalized.instrument,
        title: normalized.instrument === "piano" ? "PianoSpark Guided Sessions" : "ChordSpark Guided Sessions",
        units: units
      };
    },

    fromPianoSparkSessions: function(sessions, appId) {
      var normalized = resolveNormalizedContentInstrument(appId, "piano");
      var units = [];
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        var lessonId = "guided_session_" + s.num;
        units.push({
          id: "unit_session_" + s.num,
          title: s.title || ("Session " + s.num),
          lessons: [{
            id: lessonId,
            type: "guided",
            title: s.title,
            objectives: [s.spark ? s.spark.desc : "", s.newMove ? s.newMove.desc : ""],
            skills: ["recognition", "switching"],
            difficulty: s.level || 1,
            instrumentData: buildLegacySessionInstrumentData(normalized.instrument, s),
            rewards: { xp: 30, unlockIds: [] }
          }]
        });
      }
      return {
        schemaVersion: 1,
        appId: normalized.appId,
        instrument: normalized.instrument,
        title: normalized.instrument === "piano" ? "PianoSpark Guided Sessions" : "ChordSpark Guided Sessions",
        units: units
      };
    },

    getLessonById: function(content, lessonId) {
      if (!content || !content.units) return null;
      for (var i = 0; i < content.units.length; i++) {
        var lessons = content.units[i].lessons || [];
        for (var j = 0; j < lessons.length; j++) {
          if (lessons[j].id === lessonId) return lessons[j];
        }
      }
      return null;
    }
  };

  window.SparkContentNormalizer = SparkContentNormalizer;
})();
