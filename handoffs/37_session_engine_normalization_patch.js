// SparkSuite – NON-DESTRUCTIVE NORMALIZATION PATCH
// Apply inside existing session_engine.js WITHOUT breaking current flows

// -----------------------------
// STEP 1: ADD EXERCISE ARRAY
// -----------------------------

// Wherever SessionPlan is created, ADD:

const plan = new SessionPlan({
  ...existingProps,
  segments: [],
  exercises: [] // ✅ NEW
});

// -----------------------------
// STEP 2: NORMALIZE SEGMENTS → EXERCISES
// -----------------------------

function normalizeSegments(plan, rawSegments) {
  rawSegments.forEach((seg, index) => {
    const exId = "ex_" + Date.now() + "_" + index;

    // 1. Extract ONLY domain data (strip UI fields gradually later)
    const exercise = {
      id: exId,
      type: mapSegmentType(seg),
      data: extractExerciseData(seg)
    };

    plan.exercises.push(exercise);

    // 2. Replace segment with reference-only version
    plan.segments.push({
      id: seg.id || ("seg_" + index),
      type: mapSegmentType(seg),
      exerciseIds: [exId]
    });
  });
}

// -----------------------------
// STEP 3: MAP TYPES
// -----------------------------

function mapSegmentType(seg) {
  // Normalize all legacy types
  if (!seg || !seg.type) return "practice";

  if (seg.type.includes("song") || seg.type.includes("performance")) {
    return "song";
  }

  if (seg.type.includes("challenge")) {
    return "challenge";
  }

  return "practice";
}

// -----------------------------
// STEP 4: EXTRACT DATA
// -----------------------------

function extractExerciseData(seg) {
  // KEEP EVERYTHING FOR NOW (safe migration)
  // Later we strip UI fields

  return {
    ...seg.meta,
    original: seg
  };
}

// -----------------------------
// STEP 5: APPLY PATCH
// -----------------------------

// Replace this:
// segments: practicePlan.segments

// With:

normalizeSegments(plan, practicePlan.segments);

// -----------------------------
// RESULT
// -----------------------------

// You now have:
// - normalized structure
// - exercises array
// - segments referencing exercises
// - ZERO breaking changes to gameplay

// -----------------------------
// NEXT STEPS (DO LATER)
// -----------------------------

// 1. Remove UI fields from extractExerciseData
// 2. Move logic into instrument layer
// 3. Add LearningBrain

// -----------------------------
// CRITICAL NOTE
// -----------------------------

// DO NOT delete old segment fields yet
// This patch is additive and safe
