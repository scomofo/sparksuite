# SparkSuite – Adaptive Progression + Star Rating System (10)

## Goal
Make progression intelligent and rewarding:
1. Adaptive song selection (what to play next)
2. Star rating system (1–3 stars per song)

---

# 1. STAR RATING SYSTEM

## Criteria

```js
function computeStars(results) {
  if (results.accuracy >= 0.9) return 3;
  if (results.accuracy >= 0.75) return 2;
  if (results.accuracy >= 0.6) return 1;
  return 0;
}
```

---

## Store Per Song

```js
user.completedSongs[songId] = {
  bestAccuracy,
  maxCombo,
  stars
};
```

---

# 2. ADAPTIVE SONG SELECTION

## Strategy

Priority:
1. Unlockable songs
2. Weak songs (low stars)
3. Strong songs (for mastery)

---

## Selection Logic

```js
function selectNextSong(user, songTree) {
  // 1. Unlockable
  const unlockable = songTree.filter(song => canUnlock(song, user));
  if (unlockable.length) return unlockable[0];

  // 2. Weakest song
  const weak = Object.entries(user.completedSongs)
    .sort((a, b) => a[1].stars - b[1].stars);

  if (weak.length) return weak[0][0];

  // 3. Default fallback
  return songTree[0];
}
```

---

# 3. SESSION INTEGRATION

CurriculumEngine:

```js
const nextSong = selectNextSong(user, songTree);

return {
  type: "song",
  data: nextSong
};
```

---

# 4. UI MODEL

```js
{
  songId,
  stars: 0-3,
  locked: boolean,
  recommended: boolean
}
```

---

# DONE CRITERIA

- songs have star ratings
- weakest songs get resurfaced
- new songs unlock progressively
- sessions recommend next song

---

# WHY THIS MATTERS

This creates:
- guided progression
- mastery loop
- personalized experience
