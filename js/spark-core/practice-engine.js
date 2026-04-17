// js/spark-core/practice-engine.js
// Generates drills, builds exercise sets, and analyzes practice results.
// Delegates to instrument modules via SparkInstrumentAdapter.
(function() {

  function getActivePracticeEngineInstrument() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    active = SparkInstruments.getActive();
    if (!active) return null;
    if (typeof active.getData === "function") return active;
    candidate = active.id || active.appId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return active;
  }

  function getPracticeEngineLevelFallback() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getLevel === "function") {
      return SparkState.getLevel();
    }
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(["level"], 1);
    }
    return 1;
  }

  var SparkPracticeEngine = {

    /**
     * generateDrill(opts) — builds a drill exercise set
     * opts: { level, skill, count }
     */
    generateDrill: function(opts) {
      opts = opts || {};
      var skill = opts.skill || null;
      var level = opts.level || getPracticeEngineLevelFallback();
      var count = opts.count || 2;

      // Use InstrumentAdapter if available
      if (typeof SparkInstrumentAdapter !== "undefined") {
        var drills = SparkInstrumentAdapter.generateDrills(skill, level);
        if (drills && drills.length > 0) {
          return drills.slice(0, count);
        }
      }

      // Fallback: pull from active instrument's chord pool
      var activeInstrument = getActivePracticeEngineInstrument();
      if (activeInstrument && typeof activeInstrument.getData === "function") {
        var D = activeInstrument.getData();
        var pool = (D.CHORDS && D.CHORDS[level]) || (D.CHORDS && D.CHORDS[1]) || [];
        if (pool.length >= count) {
          var selected = [];
          var used = {};
          while (selected.length < count && selected.length < pool.length) {
            var idx = Math.floor(Math.random() * pool.length);
            if (!used[idx]) {
              used[idx] = true;
              selected.push(pool[idx]);
            }
          }
          return selected;
        }
        return pool.slice(0, count);
      }

      return [];
    },

    /**
     * buildExerciseSet(opts) — returns exercises for a lesson or skill
     * opts: { lessonId, skill, maxExercises }
     */
    buildExerciseSet: function(opts) {
      opts = opts || {};

      if (opts.lessonId && typeof SparkInstrumentAdapter !== "undefined") {
        return SparkInstrumentAdapter.getExercisesForLesson(opts.lessonId);
      }

      if (typeof SparkInstrumentAdapter !== "undefined") {
        return SparkInstrumentAdapter.getExercises();
      }

      return [];
    },

    /**
     * analyzeResults(rawResults) — normalizes raw practice data into a summary
     * rawResults: { correct, total, duration, chordName, type }
     */
    analyzeResults: function(rawResults) {
      rawResults = rawResults || {};
      var total = rawResults.total || 0;
      var correct = rawResults.correct || 0;
      var accuracy = total > 0 ? correct / total : 0;

      // Delegate to instrument-specific analysis if available
      if (typeof SparkInstrumentAdapter !== "undefined" && rawResults.type === "performance") {
        var instAnalysis = SparkInstrumentAdapter.analyzePerformance(rawResults);
        if (instAnalysis && typeof instAnalysis.accuracy === "number") {
          return instAnalysis;
        }
      }

      return {
        accuracy: Math.round(accuracy * 100),
        correct: correct,
        total: total,
        duration: rawResults.duration || 0,
        rating: accuracy >= 0.9 ? "excellent" : accuracy >= 0.7 ? "good" : accuracy >= 0.5 ? "fair" : "needs_practice"
      };
    },

    /**
     * getPerformanceConfig() — returns active instrument's performance setup
     */
    getPerformanceConfig: function() {
      if (typeof SparkInstrumentAdapter !== "undefined") {
        return SparkInstrumentAdapter.getPerformanceConfig();
      }
      return {};
    }
  };

  window.SparkPracticeEngine = SparkPracticeEngine;
})();
