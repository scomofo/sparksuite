(function(root) {
  var TEN_MINUTES_SEC = 600;

  var TEMPLATES = [
    {
      id: "quick_win",
      label: "Quick Win",
      description: "Start easy, touch one focus, play something recognizable, and stop cleanly.",
      durationSec: TEN_MINUTES_SEC,
      tags: ["adhd", "low_friction", "momentum"],
      blocks: [
        { id: "setup", type: "setup", label: "Settle In", durationSec: 60, intent: "make_starting_easy" },
        { id: "review", type: "review", label: "Easy Review", durationSec: 180, intent: "get_a_win" },
        { id: "focus", type: "practice", label: "One Focus Drill", durationSec: 180, intent: "single_target" },
        { id: "play", type: "song", label: "Play Loop", durationSec: 120, intent: "make_it_musical" },
        { id: "wrap", type: "reflect", label: "Tiny Wrap", durationSec: 60, intent: "stop_before_friction" }
      ]
    },
    {
      id: "low_energy",
      label: "Low Energy",
      description: "Gentle blocks with frequent exits for days when starting is the whole job.",
      durationSec: TEN_MINUTES_SEC,
      tags: ["adhd", "low_energy", "gentle"],
      blocks: [
        { id: "setup", type: "setup", label: "No-Pressure Setup", durationSec: 120, intent: "reduce_friction" },
        { id: "easy", type: "review", label: "Comfort Reps", durationSec: 120, intent: "keep_it_easy" },
        { id: "focus", type: "practice", label: "Small Focus", durationSec: 120, intent: "one_small_thing" },
        { id: "play", type: "song", label: "Favorite Bit", durationSec: 120, intent: "reward_attention" },
        { id: "wrap", type: "reflect", label: "Done Is Enough", durationSec: 120, intent: "finish_kindly" }
      ]
    },
    {
      id: "reset_focus",
      label: "Reset Focus",
      description: "A short reset when attention scattered: orient, repeat, lock one cue, close.",
      durationSec: TEN_MINUTES_SEC,
      tags: ["adhd", "focus_reset", "structured"],
      blocks: [
        { id: "orient", type: "setup", label: "Orient", durationSec: 60, intent: "name_the_target" },
        { id: "warm", type: "warmup", label: "Simple Motion", durationSec: 120, intent: "get_moving" },
        { id: "loop_one", type: "practice", label: "Repeat One", durationSec: 180, intent: "same_target" },
        { id: "loop_two", type: "practice", label: "Repeat Again", durationSec: 180, intent: "stabilize" },
        { id: "close", type: "reflect", label: "One Note", durationSec: 60, intent: "capture_next_step" }
      ]
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getAll() {
    return clone(TEMPLATES);
  }

  function getById(id) {
    var i;
    for (i = 0; i < TEMPLATES.length; i++) {
      if (TEMPLATES[i].id === id) return clone(TEMPLATES[i]);
    }
    return clone(TEMPLATES[0]);
  }

  function buildPlan(options) {
    options = options || {};
    var template = getById(options.templateId);
    var segments = [];
    var exercises = [];
    var i;
    var block;
    var segmentId;
    var exerciseId;
    var meta;

    for (i = 0; i < template.blocks.length; i++) {
      block = template.blocks[i];
      segmentId = "template_" + template.id + "_" + block.id;
      exerciseId = segmentId + "_ex";
      meta = {
        practiceTemplateId: template.id,
        practiceTemplateBlockId: block.id,
        practiceTemplateIntent: block.intent,
        instrumentType: options.instrumentType || null,
        skill: options.skill || null,
        lessonId: options.lessonId || null
      };
      segments.push({
        id: segmentId,
        type: block.type,
        label: block.label,
        desc: block.intent,
        durationSec: block.durationSec,
        completed: false,
        meta: clone(meta),
        exerciseIds: [exerciseId]
      });
      exercises.push({
        id: exerciseId,
        type: block.type,
        difficulty: options.difficulty || "easy",
        data: {
          presentation: {
            label: block.label,
            reason: block.intent
          },
          core: {
            skill: options.skill || null,
            lessonId: options.lessonId || null,
            instrument: options.instrumentType || null,
            durationSec: block.durationSec,
            mode: "practice_template"
          },
          gameplay: {
            payload: null,
            preset: null,
            chartId: null
          }
        }
      });
    }

    return {
      template: template,
      segments: segments,
      exercises: exercises
    };
  }

  var api = {
    getAll: getAll,
    getById: getById,
    buildPlan: buildPlan
  };

  root.SparkPracticeTemplates = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
