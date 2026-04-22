# SparkSuite – Strumming Engine + Difficulty Scaling + MIDI Ingestion (17)

## Goal
Upgrade converter from V1 → production-quality music system:
1. Strumming pattern generation
2. Difficulty scaling system
3. Robust MIDI ingestion pipeline

---

# 1. STRUMMING ENGINE

## Input

```js
{
  chord: "C",
  tempo: 76,
  duration: 2000
}
```

---

## Pattern Library

```js
const patterns = {
  easy: ["D D D D"],
  medium: ["D DU UDU"],
  hard: ["D DU UDU DU"]
};
```

---

## Generate Events

```js
function applyStrumPattern(chord, startTime, pattern, beatMs) {
  const steps = pattern.split(" ");

  return steps.map((step, i) => {
    return {
      time: startTime + i * (beatMs / 2),
      direction: step,
      lanes: chordToLanes(chord)
    };
  });
}
```

---

# 2. DIFFICULTY SCALING

## Levels

```js
const difficulty = {
  easy: {
    reduceChords: true,
    simplifyPatterns: true,
    noteDensity: 0.5
  },
  medium: {
    noteDensity: 0.75
  },
  hard: {
    noteDensity: 1.0
  }
};
```

---

## Apply Scaling

```js
function scaleNotes(notes, difficulty) {
  return notes.filter((n, i) => i % Math.round(1 / difficulty.noteDensity) === 0);
}
```

---

# 3. MIDI INGESTION (ROBUST)

## Steps

```text
Load MIDI → Normalize tempo → Select track → Clean notes → Sort → Deduplicate
```

---

## Clean Notes

```js
function cleanNotes(notes) {
  return notes
    .filter(n => n.velocity > 0)
    .sort((a,b) => a.time - b.time);
}
```

---

## Track Selection

```js
function selectTrack(midi) {
  return midi.tracks.find(t => t.notes.length > 0);
}
```

---

# 4. FINAL PIPELINE

```text
MIDI → Clean → Chords → Strum Pattern → Scale Difficulty → Chart → Gameplay
```

---

# DONE CRITERIA

- strumming feels musical
- difficulty levels feel distinct
- MIDI files import reliably

---

# WHY THIS MATTERS

This transforms SparkSuite from:
- basic converter
→ real music gameplay system
