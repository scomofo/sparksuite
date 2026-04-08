// js/spark-core/content-normalizer.js
(function() {

  var SparkContentNormalizer = {
    fromChordSparkSessions: function(sessions, appId) {
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
            instrumentData: {
              guitar: {
                chords: s.newMove ? [s.newMove.chord] : [],
                diagrams: [],
                audioKeys: []
              }
            },
            rewards: { xp: 30, unlockIds: [] }
          }]
        });
      }
      return {
        schemaVersion: 1,
        appId: appId || "chordspark",
        instrument: "guitar",
        title: "ChordSpark Guided Sessions",
        units: units
      };
    },

    fromPianoSparkSessions: function(sessions, appId) {
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
            instrumentData: {
              piano: {
                voicings: s.newMove ? [s.newMove.voicing || s.newMove.chord] : [],
                keys: [],
                audioKeys: []
              }
            },
            rewards: { xp: 30, unlockIds: [] }
          }]
        });
      }
      return {
        schemaVersion: 1,
        appId: appId || "pianospark",
        instrument: "piano",
        title: "PianoSpark Guided Sessions",
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
