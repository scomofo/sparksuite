# Patch – Chart Adapter Normalization (Instrument-Agnostic Tracks)

## Problem
Gameplay payload charts still contain legacy instrument identifiers (e.g. "guitar") inside:
- songChart.tracks
- note metadata

This creates a hidden coupling between chart data and instrument type.

---

## Goal
Make chart data **instrument-agnostic** and rely on:
- adapterType
- laneCount
- laneLabels

instead of hardcoded instrument names.

---

## PATCH 1 — Normalize track instrument field

### BEFORE
```js
track.instrument = "guitar";
```

### AFTER
```js
track.instrument = payload.adapterType; // "ukulele", "guitar", etc.
```

---

## PATCH 2 — Remove instrument assumptions in notes

### BEFORE
```js
note.instrument = "guitar";
note.stringIndex = ... // implicitly guitar (6 strings)
```

### AFTER
```js
note.instrument = payload.adapterType;
note.lane = resolveLane(note, payload);
```

---

## PATCH 3 — Introduce lane resolver

```js
function resolveLane(note, payload) {
  if (note.lane != null) return note.lane;

  // fallback: map string index → lane
  if (note.stringIndex != null) {
    return Math.min(note.stringIndex, payload.laneCount - 1);
  }

  return 0;
}
```

---

## PATCH 4 — Remove hardcoded string assumptions

Anywhere you see:
```js
if (instrument === "guitar")
```

Replace with:
```js
if (payload.laneCount === 6)
```

---

## PATCH 5 — Adapter owns mapping

Ensure each adapter defines:

```js
{
  adapterType: "ukulele",
  laneCount: 4,
  laneLabels: ["G","C","E","A"]
}
```

---

## DONE CRITERIA

- No "guitar" hardcoded in charts
- Charts render correctly for ukulele (4 lanes)
- Same chart system works across instruments
- Performance engine reads only lane-based data

---

## WHY THIS MATTERS

If not fixed:
- hidden bugs in multi-instrument support
- incorrect lane mapping
- future instruments break silently

If fixed:
- charts become reusable
- performance engine becomes truly generic
