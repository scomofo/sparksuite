// SparkSuite – Learning Brain + Flow Integration (FINAL WIRING)

// This file shows EXACTLY how to wire:
// - LearningBrain
// - Flow system
// - SessionEngine
// into ONE cohesive runtime

// -----------------------------
// LEARNING BRAIN
// -----------------------------
export const LearningBrain = {
  analyze(user, recentEvents = []) {
    const weakest = findWeakestSkill(user.skills);
    const emotion = detectEmotion(recentEvents);

    return {
      focusSkill: weakest,
      emotion,
      recommendation: decideRecommendation(weakest, emotion)
    };
  }
};

// -----------------------------
// FLOW + EMOTION
// -----------------------------
function detectEmotion(events = []) {
  const misses = events.filter(e => e.result === "miss").length;
  const accuracy = 1 - misses / (events.length || 1);

  if (accuracy < 0.6) return "frustrated";
  if (accuracy > 0.95) return "bored";
  return "engaged";
}

function decideRecommendation(skill, emotion) {
  if (emotion === "frustrated") return "practice";
  if (emotion === "bored") return "challenge";
  return "balanced";
}

// -----------------------------
// SESSION ENGINE (FINAL FORM)
// -----------------------------
export const SessionEngineV2 = {
  buildSession({ user, instrument, lesson, recentEvents }) {
    const plan = {
      id: "plan_" + Date.now(),
      flow: "adaptive_session",
      instrumentId: instrument.id,
      lesson,
      difficulty: deriveDifficulty(user, lesson),
      segments: [],
      exercises: [],
      rewards: [{ type: "xp", amount: 40 }]
    };

    // 1. Analyze user
    const brain = LearningBrain.analyze(user, recentEvents);

    // 2. Inject practice if needed
    if (brain.recommendation === "practice") {
      const practice = PracticeEngine.build({
        instrument,
        lesson,
        focus: brain.focusSkill
      });

      merge(plan, practice);
    }

    // 3. Always include song
    const songExId = "ex_song_" + Date.now();

    const songExercise = {
      id: songExId,
      type: "song",
      data: instrument.buildSongExercise({
        lesson,
        difficulty: plan.difficulty,
        adaptation: brain.recommendation
      })
    };

    plan.exercises.push(songExercise);

    plan.segments.push({
      id: "seg_song",
      type: "song",
      exerciseIds: [songExId]
    });

    // 4. Challenge injection
    if (brain.recommendation === "challenge") {
      const challengeExId = "ex_challenge_" + Date.now();

      const challengeExercise = {
        id: challengeExId,
        type: "challenge",
        data: instrument.buildChallengeExercise({ lesson })
      };

      plan.exercises.push(challengeExercise);

      plan.segments.push({
        id: "seg_challenge",
        type: "challenge",
        exerciseIds: [challengeExId]
      });
    }

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
  const avg = Object.values(user.skills || {}).reduce((a, b) => a + b, 0) / (Object.values(user.skills || {}).length || 1);

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
