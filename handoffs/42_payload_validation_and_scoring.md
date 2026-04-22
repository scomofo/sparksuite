# SparkSuite – Payload Validation + Lane Validation + Scoring Foundations (42)

## PURPOSE
Lock down gameplay data integrity and begin intelligent scoring.

---

# 🔒 1. GAMEPLAY PAYLOAD SCHEMA ENFORCEMENT

## REQUIRED SHAPE (NO FALLBACKS)

```js
{
  chartId: string,
  adapterType: string,
  laneCount: number,
  laneLabels: string[],
  notes: Array<{ lane: number, time: number }>
}
```

## VALIDATION FUNCTION

```js
export function validateGameplayPayload(payload) {
  if (!payload) throw new Error("Missing gameplay payload");

  if (!payload.chartId) throw new Error("Missing chartId");
  if (!payload.adapterType) throw new Error("Missing adapterType");
  if (!payload.laneCount) throw new Error("Missing laneCount");
  if (!Array.isArray(payload.laneLabels)) throw new Error("Invalid laneLabels");
  if (!Array.isArray(payload.notes)) throw new Error("Missing notes array");

  payload.notes.forEach((n, i) => {
    if (typeof n.lane !== "number") {
      throw new Error(`Note ${i} missing lane`);
    }
  });

  return true;
}
```

## ENFORCE AT RUNTIME

```js
validateGameplayPayload(exercise.data.gameplay);
```

---

# 🎯 2. LANE DISTRIBUTION VALIDATION

## PROBLEM
Silent bugs collapse all notes to lane 0.

## CHECK

```js
export function validateLaneDistribution(notes) {
  const lanes = new Set(notes.map(n => n.lane));

  if (lanes.size <= 1) {
    console.warn("⚠️ Lane distribution collapsed", [...lanes]);
    return false;
  }

  return true;
}
```

## OPTIONAL STRICT MODE

```js
if (!validateLaneDistribution(payload.notes)) {
  throw new Error("Invalid lane distribution");
}
```

---

# 🧠 3. SCORING FOUNDATION

## HIT JUDGEMENT

```js
function judgeHit(deltaMs) {
  const abs = Math.abs(deltaMs);

  if (abs <= 50) return "perfect";
  if (abs <= 120) return "good";
  return "miss";
}
```

---

## EVENT STRUCTURE

```js
{
  type: "note",
  deltaMs,
  result,
  lane,
  timestamp,
  meta: { exerciseId }
}
```

---

## SESSION METRICS

```js
function summarizeEvents(events) {
  const total = events.length;

  const perfect = events.filter(e => e.result === "perfect").length;
  const good = events.filter(e => e.result === "good").length;
  const miss = events.filter(e => e.result === "miss").length;

  return {
    accuracy: (perfect + good) / total,
    precision: perfect / total,
    missRate: miss / total
  };
}
```

---

# 🚀 NEXT (NOT IN THIS HANDOFF)

- skill graph updates
- adaptive difficulty tuning
- mistake-driven exercise generation

---

## FINAL RULE

If payload is invalid → FAIL FAST
If lanes collapse → LOG or THROW
If scoring missing → learning is fake

---

System integrity > silent fallback
