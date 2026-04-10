# SparkSuite – Song Progression System (Levels + Unlock Tree) (09)

## Goal
Create a structured progression system that:
- guides users through songs
- unlocks content based on performance
- ties into sessions and XP

---

# 1. CORE MODEL

## Song Node

```js
{
  id: "song_001",
  title: "Island Groove",
  difficulty: "easy",
  chartId: "uke_island_pattern_01",
  xpReward: 40,

  requirements: {
    minAccuracy: 0.7,
    previous: ["song_000"]
  }
}
```

---

## Song Tree

```js
{
  instrument: "ukulele",
  nodes: [
    { id: "song_001", tier: 1 },
    { id: "song_002", tier: 2 },
    { id: "song_003", tier: 2 }
  ]
}
```

---

# 2. USER PROGRESSION STATE

```js
{
  unlockedSongs: ["song_001"],
  completedSongs: {
    "song_001": {
      bestAccuracy: 0.85,
      maxCombo: 30
    }
  },
  level: 1,
  xp: 120
}
```

---

# 3. UNLOCK LOGIC

```js
function canUnlock(song, user) {
  if (song.requirements.previous) {
    const done = song.requirements.previous.every(id => user.completedSongs[id]);
    if (!done) return false;
  }

  const prev = song.requirements.previous?.[0];

  if (prev && user.completedSongs[prev]) {
    const acc = user.completedSongs[prev].bestAccuracy;
    if (acc < song.requirements.minAccuracy) return false;
  }

  return true;
}
```

---

# 4. PROGRESSION FLOW

```text
Play Song → Get Score → Update Progress → Check Unlocks → Unlock Next Songs
```

---

## Update After Play

```js
function updateProgress(songId, results, user) {
  const existing = user.completedSongs[songId] || {};

  user.completedSongs[songId] = {
    bestAccuracy: Math.max(existing.bestAccuracy || 0, results.accuracy),
    maxCombo: Math.max(existing.maxCombo || 0, results.maxCombo)
  };

  user.xp += computeXP(results.accuracy, results.maxCombo);
}
```

---

# 5. LEVEL SYSTEM

```js
function computeLevel(xp) {
  return Math.floor(xp / 100);
}
```

---

# 6. SESSION INTEGRATION

CurriculumEngine should select:
- next locked song OR
- weakest completed song

---

# 7. UI MODEL

```js
{
  songId,
  locked: true/false,
  completed: true/false,
  stars: 1-3
}
```

---

# DONE CRITERIA

- songs unlock based on performance
- XP increases level
- progression tree works
- sessions can pick next song

---

# WHY THIS MATTERS

This creates:
- clear goals
- structured learning path
- retention through progression
