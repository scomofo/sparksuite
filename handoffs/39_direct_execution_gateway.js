// SparkSuite – Direct Execution Gateway (Last-Mile Fix)
// This file standardizes ALL remaining direct UI launch paths

// ---------------------------------
// PUBLIC ENTRY (ONLY ALLOWED DIRECT PATH)
// ---------------------------------
export function runDirectExercise(input, options = {}) {
  const exercise = normalizeToExercise(input);

  const session = {
    id: "adhoc_" + Date.now(),
    flow: "adhoc",
    instrumentId: options.instrumentId || "unknown",
    segments: [
      {
        id: "seg_adhoc",
        type: exercise.type,
        exerciseIds: [exercise.id]
      }
    ],
    exercises: [exercise],
    rewards: [],
    meta: {
      adhoc: true,
      source: options.source || "direct"
    }
  };

  console.log("⚡ DIRECT EXECUTION WRAPPED", session);

  runSession(session);
}

// ---------------------------------
// NORMALIZATION
// ---------------------------------
function normalizeToExercise(input) {
  // Already normalized
  if (input && input.id && input.data) return input;

  return {
    id: "ex_" + Date.now(),
    type: detectType(input),
    data: {
      core: extractCore(input),
      gameplay: extractGameplay(input)
    }
  };
}

function detectType(input) {
  if (!input) return "practice";

  if (input.chartId || input.notes) return "song";
  if (input.pattern || input.chords) return "practice";
  if (input.challenge) return "challenge";

  return "practice";
}

// ---------------------------------
// EXTRACTION (SAFE DEFAULTS)
// ---------------------------------
function extractCore(input) {
  return {
    ...input,
    _source: "direct"
  };
}

function extractGameplay(input) {
  // Pass through known gameplay payloads
  if (input.gameplayPayload) return input.gameplayPayload;

  return {
    raw: input
  };
}

// ---------------------------------
// USAGE GUIDE
// ---------------------------------

// Replace ALL direct calls like:
// startSong(song)
// startPractice(pattern)
// previewMidi(midi)

// WITH:
// runDirectExercise(song, { source: "retry_song" })
// runDirectExercise(pattern, { source: "retry_phrase" })
// runDirectExercise(midi, { source: "editor_preview" })

// ---------------------------------
// GUARANTEES
// ---------------------------------

// - All direct flows become normalized exercises
// - All execution goes through runSession
// - No architecture violations
// - No UI bypass
