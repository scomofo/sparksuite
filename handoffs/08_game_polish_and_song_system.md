# SparkSuite – Game Polish + Song System (08)

## Goal
Turn SparkSuite into a cohesive product experience:
1. Game polish (visual + feedback juice)
2. Song system (playlists, progression, unlocks)

---

# PART 1 — GAME POLISH (JUICE LAYER)

## 1. Hit Effects

```js
function renderHitEffect(lane, type) {
  const x = getLaneX(lane);

  if (type === "perfect") ctx.fillStyle = "#00ff88";
  else if (type === "good") ctx.fillStyle = "#ffee55";
  else ctx.fillStyle = "#ff4444";

  ctx.globalAlpha = 0.8;
  ctx.fillRect(x, HIT_LINE_Y - 10, 60, 20);
  ctx.globalAlpha = 1;
}
```

---

## 2. Lane Glow (active input)

```js
function renderLaneGlow(activeInputs) {
  activeInputs.forEach(lane => {
    const x = getLaneX(lane);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x, 0, 60, canvas.height);
  });
}
```

---

## 3. Combo Display

```js
function renderCombo(combo) {
  ctx.fillStyle = "#fff";
  ctx.font = "24px sans-serif";
  ctx.fillText("Combo: " + combo, 20, 40);
}
```

---

## 4. Miss Feedback (screen pulse)

```js
function renderMissFlash() {
  ctx.fillStyle = "rgba(255,0,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

---

# PART 2 — SONG SYSTEM

## Song Model

```js
{
  id: "song_001",
  title: "Island Groove",
  difficulty: "easy",
  chartId: "uke_island_pattern_01",
  duration: 60,
  unlockLevel: 1
}
```

---

## Playlist

```js
[
  { id: "song_001" },
  { id: "song_002" }
]
```

---

## Progress Tracking

```js
{
  songId: "song_001",
  bestScore: 0.92,
  maxCombo: 34,
  lastPlayed: "2026-04-09"
}
```

---

## Unlock Logic

```js
function isUnlocked(song, user) {
  return user.level >= song.unlockLevel;
}
```

---

## Session Integration

Replace exercise with:

```js
{
  type: "song",
  data: {
    songId,
    chart
  }
}
```

---

# DONE CRITERIA

- gameplay has visual feedback and polish
- combo is visible and motivating
- songs can be selected and played
- progress persists per song

---

# WHY THIS MATTERS

This turns SparkSuite into:
- a game (not just drills)
- a system with progression
- something users return to
