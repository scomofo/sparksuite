# SparkSuite – Feel Tuning + Retention System (07)

## Goal
Make gameplay feel excellent and create long-term engagement:
1. Feel tuning (timing, latency, scroll)
2. Hit window calibration
3. Retention loop (streaks, progression)

---

# 1. TIMING FEEL TUNING

## Latency Compensation

```js
const INPUT_OFFSET_MS = -20; // adjust per device

const now = (performance.now() - state.startTime) + INPUT_OFFSET_MS;
```

---

## Scroll Speed

```js
const SCROLL_SPEED = 0.28; // tune 0.25–0.35
```

---

# 2. HIT WINDOWS

```js
const WINDOWS = {
  perfect: 45,
  good: 90,
  miss: 140
};

function judge(delta) {
  if (delta < WINDOWS.perfect) return "perfect";
  if (delta < WINDOWS.good) return "good";
  return "miss";
}
```

---

# 3. DYNAMIC DIFFICULTY (HOOK)

```js
if (accuracy > 0.9) difficulty = "hard";
if (accuracy < 0.6) difficulty = "easy";
```

---

# 4. STREAK SYSTEM

```js
state.streak = 0;
state.bestStreak = 0;

function updateStreak(result) {
  if (result === "miss") {
    state.streak = 0;
  } else {
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  }
}
```

---

# 5. DAILY LOOP (RETENTION)

## Model

```js
{
  streakDays: 3,
  lastPlayed: "2026-04-09"
}
```

---

## Update

```js
function updateDailyStreak(user) {
  const today = getToday();

  if (user.lastPlayed === yesterday(today)) {
    user.streakDays++;
  } else if (user.lastPlayed !== today) {
    user.streakDays = 1;
  }

  user.lastPlayed = today;
}
```

---

# 6. REWARD HOOK

```js
function computeXP(accuracy, combo) {
  return Math.floor(accuracy * 50 + combo * 2);
}
```

---

# DONE CRITERIA

- gameplay feels responsive
- timing windows feel fair
- streak system works
- XP reflects performance

---

# WHY THIS MATTERS

This layer determines:
- whether users stay
- whether gameplay feels satisfying
- whether progression works
