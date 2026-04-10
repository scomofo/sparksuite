// SparkSuite – Reference Implementation (V2 Clean)
// SessionEngine + PracticeEngine (no UI leakage)

// -----------------------------
// TYPES (for clarity)
// -----------------------------
/**
 * Segment: { id, type, exerciseIds }
 * Exercise: { id, type, data }
 * SessionPlan: {
 *   id, flow, instrumentId, lesson, difficulty,
 *   segments: Segment[],
 *   exercises: Exercise[],
 *   rewards: [{ type, amount }]
 * }
 */

// -----------------------------
// PRACTICE ENGINE (PURE)
// -----------------------------
export const PracticeEngine = {
  build({ instrument, lesson, focus }) {
    const exercises = [];
    const segments = [];

    // Example: rhythm exercise
    if (focus === "timing" || lesson.skill === "strumming_patterns") {
      const exId = "ex_rhythm_" + Date.now();

      const exercise = {
        id: exId,
        type: "rhythm",
        data: instrument.buildRhythmExercise({ lesson })
      };

      exercises.push(exercise);

      segments.push({
        id: "seg_rhythm",
        type: "practice",
        exerciseIds: [exId]
      });
    }

    // Example: chord transition
    if (lesson.skill === "chord_transition") {
      const exId = "ex_transition_" + Date.now();

      const exercise = {
        id: exId,
        type: "chord_transition",
        data: instrument.buildTransitionExercise({ lesson })
      };

      exercises.push(exercise);

      segments.push({
        id: "seg_transition",
        type: "practice",
        exerciseIds: [exId]
      });
    }

    return { segments, exercises };
  }
};

// -----------------------------
// SESSION ENGINE (ORCHESTRATOR)
// -----------------------------
export const SessionEngine = {
  buildSession({ user, instrument, lesson }) {
    const plan = {
      id: "plan_" + Date.now(),
      flow: "daily_practice",
      instrumentId: instrument.id,
      lesson,
      difficulty: deriveDifficulty(user, lesson),
      segments: [],
      exercises: [],
      rewards: [{ type: "xp", amount: 40 }]
    };

    // 1. Learning Brain
    const focus = findWeakestSkill(user.skills);

    // 2. Practice block
    const practice = PracticeEngine.build({
      instrument,
      lesson,
      focus
    });

    merge(plan, practice);

    // 3. Song block
    const songExId = "ex_song_" + Date.now();

    const songExercise = {
      id: songExId,
      type: "song",
      data: instrument.buildSongExercise({ lesson, difficulty: plan.difficulty })
    };

    plan.exercises.push(songExercise);

    plan.segments.push({
      id: "seg_song",
      type: "song",
      exerciseIds: [songExId]
    });

    return plan;
  }
};

// -----------------------------
// HELPERS
// -----------------------------
function merge(plan, block) {
  plan.segments.push(...block.segments);
  plan.exercises.push(...block.exercises);
}

function deriveDifficulty(user, lesson) {
  if (!user || !user.skills) return "easy";

  const avg = Object.values(user.skills).reduce((a, b) => a + b, 0) / Object.values(user.skills).length;

  if (avg > 0.8) return "hard";
  if (avg > 0.6) return "medium";
  return "easy";
}

function findWeakestSkill(skills = {}) {
  let weakest = null;
  let min = Infinity;

  for (const [k, v] of Object.entries(skills)) {
    if (typeof v === "number" && v < min) {
      min = v;
      weakest = k;
    }
  }

  return weakest || "timing";
}
