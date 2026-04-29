(function() {
  var LANES = ["Kick", "Snare", "Hat", "Aux"];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function RuntimeAdapter() {
    this.chartIO = typeof SparkChartIO === "function" ? new SparkChartIO() : null;
  }

  RuntimeAdapter.prototype.getLaneCount = function() {
    return 4;
  };

  RuntimeAdapter.prototype.getLaneLabels = function() {
    return LANES.slice();
  };

  RuntimeAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  RuntimeAdapter.prototype.getTimingWindow = function() {
    return { perfect: 50, good: 90, late: 135 };
  };

  RuntimeAdapter.prototype.selectChartId = function(context) {
    context = context || {};
    var segmentSkill = context.segment && context.segment.meta && context.segment.meta.skill;
    if (segmentSkill) {
      var bySkill = this.findExerciseBySkill(segmentSkill);
      if (bySkill) return bySkill.chartId;
    }
    var exerciseId = context.exerciseId || (context.segment && context.segment.meta && context.segment.meta.exerciseId);
    if (exerciseId) {
      var exercise = this.findExerciseById(exerciseId);
      if (exercise) return exercise.chartId;
    }
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var lessons = window.SparkDrumsLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) {
        var ids = lessons[i].exerciseIds || [];
        if (ids.length) {
          var first = this.findExerciseById(ids[0]);
          if (first) return first.chartId;
        }
      }
    }
    return "drums_lane_tap_01";
  };

  RuntimeAdapter.prototype.findExerciseById = function(id) {
    var exercises = window.SparkDrumsExercises || [];
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i].id === id || exercises[i].chartId === id) return exercises[i];
    }
    return null;
  };

  RuntimeAdapter.prototype.findExerciseBySkill = function(skill) {
    var exercises = window.SparkDrumsExercises || [];
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i].skill === skill) return exercises[i];
    }
    return null;
  };

  RuntimeAdapter.prototype.createFallbackChart = function(definition) {
    var ppq = definition.ppq || 480;
    return {
      song: {
        id: definition.id,
        title: definition.title || definition.id,
        artist: "SparkSuite",
        durationSec: (definition.totalBeats || 16) * (60 / (definition.bpm || 72))
      },
      tempoMap: {
        ppq: ppq,
        segments: [{ tick: 0, bpm: definition.bpm || 72 }],
        tickToSeconds: function(tick) {
          return (tick / ppq) * (60 / (definition.bpm || 72));
        }
      },
      tracks: {
        guitar: {
          notes: (definition.notes || []).map(function(note, index) {
            return {
              id: note.id || ("evt_" + (index + 1)),
              tick: Math.round((note.beat || 0) * ppq),
              tickLength: Math.round((note.lengthBeats || 0) * ppq),
              laneMask: note.laneMask || 0,
              flags: note.flags || {},
              difficulty: definition.difficulty || "easy",
              instrument: "drums",
              label: note.label || "",
              skillId: note.skillId || null
            };
          }),
          phrases: (definition.phrases || []).map(function(phrase) {
            return {
              id: phrase.id,
              name: phrase.name,
              startTick: Math.round((phrase.startBeat || 0) * ppq),
              endTick: Math.round((phrase.endBeat || 0) * ppq),
              flags: phrase.flags || {}
            };
          })
        }
      },
      metadata: {
        sourceFormat: "spark_exercise_v1",
        laneCount: 4,
        chartId: definition.id,
        enginePreset: definition.enginePreset || "spark_learning"
      }
    };
  };

  RuntimeAdapter.prototype.toSongChart = function(definition) {
    if (this.chartIO && typeof this.chartIO.fromExerciseDefinition === "function") {
      return this.chartIO.fromExerciseDefinition(definition, this);
    }
    return this.createFallbackChart(definition);
  };

  RuntimeAdapter.prototype.createPayload = function(context) {
    var chartId = this.selectChartId(context);
    var definition = window.SparkDrumsChartLibrary.getChartDefinition(chartId);
    var chart = clone(definition);
    return {
      chartId: chart.id,
      adapterType: "drums",
      enginePreset: chart.enginePreset || this.getDefaultPreset(),
      laneCount: 4,
      laneLabels: this.getLaneLabels(),
      timingWindow: chart.timingWindowMs || this.getTimingWindow(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showChordNames: false,
        failDisabled: true
      },
      songChart: this.toSongChart(chart)
    };
  };

  window.SparkDrumsRuntimeAdapter = RuntimeAdapter;
})();
