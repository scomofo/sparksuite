# SparkSuite – Event Pipeline Audit (40)

## Goal
Ensure gameplay → events → learning loop is fully wired and reliable.

---

# 🔴 CRITICAL REQUIREMENTS

## 1. Event Shape (STRICT)

Every gameplay event MUST follow:

```js
{
  type: "note" | "input" | "result",
  timestamp: number,
  deltaMs: number,
  result: "perfect" | "good" | "miss",
  lane: number,
  meta: {
    exerciseId,
    segmentId
  }
}
```

---

## 2. Collection

```js
state.events = []

function onHit(event) {
  state.events.push(event)
}
```

---

## 3. Session Completion Hook

```js
user.lastEvents = state.events
```

MUST happen before next session build.

---

## 4. SessionEngine Input

```js
SessionEngineV2.buildSession({
  user,
  recentEvents: user.lastEvents
})
```

---

# ⚠️ COMMON FAILURES

## ❌ Missing deltaMs
→ LearningBrain cannot assess timing

## ❌ Missing result
→ no accuracy signal

## ❌ Missing exerciseId
→ cannot map weaknesses

## ❌ Events overwritten instead of accumulated
→ loss of learning signal

---

# 🧠 LEARNING BRAIN EXPECTATIONS

Consumes:

```js
{
  accuracy,
  timingBias,
  missStreak,
  consistency
}
```

Derived from events.

---

# 🔍 VALIDATION TEST

After one session:

- events.length > 0
- contains mix of perfect/good/miss
- deltaMs distribution reasonable

---

# 🔥 FINAL CHECK

If events are not flowing:

👉 system is NOT adaptive

---

# 🚀 NEXT

Once validated:

- enable dynamic difficulty
- enable skill graph updates
- enable session adaptation

---

This completes runtime intelligence loop.
