(function() {
  function createSessionSegment(input) {
    input = input || {};
    return {
      id: input.id || ("segment_" + Math.random().toString(36).slice(2, 10)),
      type: input.type || "generic",
      label: input.label || input.type || "Segment",
      desc: input.desc || input.description || "",
      durationSec: input.durationSec || 0,
      completed: !!input.completed,
      meta: input.meta || {}
    };
  }

  window.SparkSessionSegment = {
    create: createSessionSegment
  };
})();
