(function() {
  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};

    var rawSegments = SparkPracticeBridge.buildDailyPracticeSegments(context);

    var exercises = [];
    var segments = [];

    for (var i = 0; i < rawSegments.length; i++) {
      var seg = rawSegments[i];
      var exId = "ex_" + i;

      var exercise = {
        id: exId,
        type: seg.type,
        data: seg.meta || {},
        difficulty: context.difficulty || "normal"
      };

      exercises.push(exercise);

      segments.push({
        id: "seg_" + i,
        type: mapSegmentType(seg.type),
        exerciseIds: [exId]
      });
    }

    return {
      segments: segments,
      exercises: exercises,
      focus: this.psychologyEngine.getFocusLabel(rawSegments)
    };
  };

  function mapSegmentType(type) {
    if (type === SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return "practice";
    if (type === SparkSessionSegmentTypes.PERFORMANCE_SONG) return "song";
    return "practice";
  }

  window.SparkSuitePracticeEngine = PracticeEngine;
})();
