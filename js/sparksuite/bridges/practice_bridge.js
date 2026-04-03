(function() {
  function buildDailyPracticeSegments(context) {
    context = context || {};

    if (typeof buildPracticeCandidates !== "function") {
      return [SparkSessionSegment.create({
        id: "warmup_default",
        type: SparkSessionSegmentTypes.WARMUP,
        label: "Quick warmup",
        desc: "Start with a short warmup",
        durationSec: 120
      })];
    }

    var candidates = buildPracticeCandidates();
    var segments = [];
    for (var i = 0; i < candidates.length; i++) {
      segments.push(mapCandidateToSegment(candidates[i], context));
    }

    if (!segments.length) {
      segments.push(SparkSessionSegment.create({
        id: "warmup_default",
        type: SparkSessionSegmentTypes.WARMUP,
        label: "Quick warmup",
        desc: "Start with a short warmup",
        durationSec: 120
      }));
    }

    return segments.slice(0, 5);
  }

  function mapCandidateToSegment(candidate, context) {
    candidate = candidate || {};
    var meta = clone(candidate.meta || {});
    if (context.curriculum && context.curriculum.nextLessonId) {
      meta.curriculumLessonId = context.curriculum.nextLessonId;
    }

    var segmentType = candidate.type === "rhythm" ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : candidate.type;

    return SparkSessionSegment.create({
      id: candidate.id,
      type: segmentType,
      label: candidate.label,
      desc: candidate.reason || "",
      durationSec: inferDuration(candidate),
      meta: meta
    });
  }

  function inferDuration(candidate) {
    if (candidate.meta && candidate.meta.durationSec) return candidate.meta.durationSec;
    switch (candidate.type) {
      case SparkSessionSegmentTypes.WARMUP: return 120;
      case SparkSessionSegmentTypes.TRANSITION: return 180;
      case SparkSessionSegmentTypes.PERFORMANCE_SONG: return 240;
      case SparkSessionSegmentTypes.PERFORMANCE_PHRASE: return 180;
      case SparkSessionSegmentTypes.RHYTHM: return 120;
      case SparkSessionSegmentTypes.RHYTHM_HIGHWAY: return 120;
      case SparkSessionSegmentTypes.FINGER: return 120;
      case SparkSessionSegmentTypes.GUIDED_SESSION: return 300;
      default: return 120;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  window.SparkPracticeBridge = {
    buildDailyPracticeSegments: buildDailyPracticeSegments
  };
})();
