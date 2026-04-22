# SparkSuite – Playable Runtime (04b)

## Goal
Provide a plug-and-play runtime for:
- rendering note highway
- handling input
- scoring

---

# 1. SETUP

```js
const exercise = getExercise(segment, session);
const chart = exercise.data.gameplay;

const state = {
  startTime: performance.now(),
  judgedNotes: new Set(),
  score: []
};
```

---

# 2. LANE INPUT MAP

```js
const keyToLane = {};
chart.lanes.forEach(l => keyToLane[l.input] = l.lane);
```

---

# 3. NOTE HIGHWAY RENDER

```js
const HIT_LINE_Y = 400;

function getNoteY(noteTime, currentTime, speed = 0.3) {
  return (noteTime - currentTime) * speed;
}

function renderFrame() {
  const now = performance.now() - state.startTime;

  clearCanvas();

  chart.notes.forEach(note => {
    const y = HIT_LINE_Y - getNoteY(note.time, now);

    if (y < -50 || y > canvas.height + 50) return;

    drawNote(note.lane, y);
  });

  requestAnimationFrame(renderFrame);
}
```

---

# 4. DRAW HELPERS

```js
function getLaneX(lane) {
  const laneWidth = 80;
  return lane * laneWidth + 100;
}

function drawNote(lane, y) {
  const x = getLaneX(lane);
  ctx.fillRect(x, y, 60, 20);
}
```

---

# 5. INPUT + HIT DETECTION

```js
window.addEventListener("keydown", (e) => {
  const lane = keyToLane[e.key];
  if (lane === undefined) return;

  const now = performance.now() - state.startTime;

  const note = chart.notes.find(n => {
    if (state.judgedNotes.has(n.id)) return false;

    const delta = Math.abs(n.time - now);
    return n.lane === lane && delta < 120;
  });

  if (!note) return;

  const delta = Math.abs(now - note.time);

  let result = "miss";
  if (delta < 50) result = "perfect";
  else if (delta < 100) result = "good";

  state.judgedNotes.add(note.id);
  state.score.push(result);
});
```

---

# 6. RESULTS

```js
function getResults() {
  const hits = state.score.filter(s => s !== "miss").length;

  return {
    accuracy: hits / chart.notes.length,
    breakdown: state.score
  };
}
```

---

# 7. OPTIONAL — CHORD SUPPORT

```js
function matchesChord(note, activeInputs) {
  if (!note.lanes) return false;
  return note.lanes.every(l => activeInputs.has(l));
}
```

---

# DONE CRITERIA

- Notes scroll correctly
- Input matches notes
- Scoring works
- Results returned

---

# NEXT STEP

Once this works:
- add visual feedback
- tune timing windows
- add multi-lane chords
