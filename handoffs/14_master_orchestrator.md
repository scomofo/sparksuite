# SparkSuite – Master Orchestrator (14)

## Goal
Wire all systems into a single runtime loop:
- song selection
- gameplay
- results
- progression
- UI routing

---

# 1. CORE LOOP

```js
function runGameLoop(songId) {
  const song = getSong(songId);

  const results = playSong(song);

  const outcome = completeSong(songId, results);

  renderResults(outcome);
}
```

---

# 2. COMPLETE SONG (CORE HUB)

```js
function completeSong(songId, results) {
  updateProgress(songId, results, user);

  const nextSong = selectNextSong(user, songTree);

  return {
    results,
    nextSong,
    user
  };
}
```

---

# 3. UI ROUTING

```js
function startSong(songId) {
  navigate("gameplay", { songId });
}

function finishSong(songId, results) {
  const outcome = completeSong(songId, results);
  navigate("results", outcome);
}

function continueFlow(nextSong) {
  navigate("gameplay", { songId: nextSong.id });
}
```

---

# 4. SCREEN FLOW

```text
Map → Gameplay → Results → Map
        ↓
     Continue → Gameplay
```

---

# 5. DATA FLOW

```text
Gameplay → Results → Progress Update → Unlock → Adaptive Select → UI
```

---

# 6. MINIMAL IMPLEMENTATION

```js
// ENTRY
const song = selectNextSong(user, songTree);
startSong(song.id);
```

---

# DONE CRITERIA

- full loop runs without manual steps
- progression updates after each play
- next song is automatically selected
- UI transitions correctly

---

# WHY THIS MATTERS

This is the layer that turns all systems into a working product.
