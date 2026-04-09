// SparkSuite – Gameplay Payload Fix (Critical)
// Fixes: "all red notes" + "string 0" fallback issue

// ROOT ISSUE:
// normalizeToExercise() fallback was returning { raw: input }
// which breaks lane mapping + adapter usage

// ---------------------------------
// FIXED extractGameplay
// ---------------------------------

function extractGameplay(input) {
  // ✅ Already correct payload
  if (input.gameplayPayload) {
    return input.gameplayPayload;
  }

  // ✅ Already structured chart
  if (input.chartId && input.notes) {
    return {
      chartId: input.chartId,
      adapterType: input.adapterType || "ukulele",
      laneCount: input.laneCount || 4,
      laneLabels: input.laneLabels || ["G", "C", "E", "A"],
      notes: input.notes
    };
  }

  // ⚠️ LAST RESORT (SAFE DEFAULT)
  console.warn("⚠️ extractGameplay fallback used", input);

  return {
    chartId: "fallback_chart",
    adapterType: "ukulele",
    laneCount: 4,
    laneLabels: ["G", "C", "E", "A"],
    notes: []
  };
}

// ---------------------------------
// VALIDATION HELPER (TEMP DEBUG)
// ---------------------------------

export function debugGameplayPayload(exercise) {
  const g = exercise?.data?.gameplay;

  console.log("🎯 GAMEPLAY DEBUG", {
    hasChart: !!g?.chartId,
    laneCount: g?.laneCount,
    laneLabels: g?.laneLabels,
    noteSample: g?.notes?.[0]
  });
}

// ---------------------------------
// EXPECTED RESULT
// ---------------------------------

// BEFORE (BROKEN):
// - all notes on lane 0
// - all notes same color

// AFTER (FIXED):
// - notes distributed across lanes
// - proper string mapping (G C E A)
// - correct visual differentiation

// ---------------------------------
// NOTE
// ---------------------------------

// This is a PATCH FIX
// Long-term: ALL gameplayPayload must come from instrument layer
