# SparkSuite – MIDI → Gameplay Chart Converter (16)

## Goal
Convert real MIDI files into musically accurate gameplay charts.

---

# 1. PIPELINE

```text
MIDI → Parse → Extract Notes → Detect Chords → Quantize → Map to Lanes → Build Chart
```

---

# 2. MIDI PARSING

Use a MIDI parser (Tone.js / midi-file / Web MIDI)

Extract:

```js
{
  time,
  duration,
  pitch,
  velocity
}
```

---

# 3. GROUP INTO CHORDS

```js
function groupChords(notes, threshold = 40) {
  const groups = [];
  let current = [];

  notes.forEach(n => {
    if (!current.length || Math.abs(n.time - current[0].time) < threshold) {
      current.push(n);
    } else {
      groups.push(current);
      current = [n];
    }
  });

  if (current.length) groups.push(current);
  return groups;
}
```

---

# 4. DETECT CHORD NAME

```js
function detectChord(group) {
  const pitches = group.map(n => n.pitch % 12);

  if (matches(pitches, [0,4,7])) return "C";
  if (matches(pitches, [9,0,4])) return "Am";

  return "unknown";
}
```

---

# 5. QUANTIZE TIMING

```js
function quantize(time, beatMs) {
  return Math.round(time / beatMs) * beatMs;
}
```

---

# 6. MAP TO LANES (UKULELE)

```js
function chordToLanes(chord) {
  const map = {
    "C": [0,1,2,3],
    "Am": [0,1,2],
    "F": [1,2,3],
    "G": [0,1,3]
  };

  return map[chord] || [0];
}
```

---

# 7. BUILD NOTES

```js
function buildNotes(chords) {
  return chords.map((group, i) => {
    const chord = detectChord(group);

    return {
      id: "evt_" + i,
      time: quantize(group[0].time, beatMs),
      lanes: chordToLanes(chord),
      primaryLane: chordToLanes(chord)[0],
      label: chord
    };
  });
}
```

---

# 8. FINAL CHART

```js
{
  chartId,
  tempo,
  lanes,
  notes
}
```

---

# DONE CRITERIA

- MIDI converts to playable chart
- chords detected correctly (basic set)
- timing is stable
- lanes match instrument

---

# NEXT EVOLUTION

- strumming patterns
- difficulty scaling
- advanced chord detection

---

# WHY THIS MATTERS

This unlocks infinite real-song content for SparkSuite.
