# SparkSuite – Progression UI + Map System (11)

## Goal
Visualize progression in a way that is:
- clear
- motivating
- scalable

---

# 1. PROGRESSION MAP MODEL

## Node (Song)

```js
{
  id: "song_001",
  title: "Island Groove",
  tier: 1,

  state: {
    locked: false,
    stars: 2,
    recommended: true
  }
}
```

---

## Layout

```js
[
  ["song_001"],
  ["song_002", "song_003"],
  ["song_004"]
]
```

Each row = tier

---

# 2. RENDER STRATEGY

## Grid Layout

```text
   ●
 ●   ●
   ●
```

---

## Node Rendering

```js
function renderNode(node, x, y) {
  if (node.state.locked) ctx.fillStyle = "#333";
  else ctx.fillStyle = "#fff";

  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();

  renderStars(node.state.stars, x, y + 30);
}
```

---

## Star Rendering

```js
function renderStars(stars, x, y) {
  const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
  ctx.fillText(starText, x - 20, y);
}
```

---

## Connection Lines

```js
function drawConnection(x1, y1, x2, y2) {
  ctx.strokeStyle = "#555";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
```

---

# 3. RECOMMENDED HIGHLIGHT

```js
if (node.state.recommended) {
  ctx.strokeStyle = "#00ff88";
  ctx.stroke();
}
```

---

# 4. INTERACTION

```js
canvas.addEventListener("click", (e) => {
  const node = getNodeAtPosition(e.x, e.y);

  if (!node.state.locked) {
    startSong(node.id);
  }
});
```

---

# 5. UX RULES

- locked nodes are visible but dimmed
- recommended node is highlighted
- completed nodes show stars
- next tier unlocks gradually

---

# DONE CRITERIA

- user can see full progression path
- stars visible per song
- recommended path is obvious
- interaction works

---

# WHY THIS MATTERS

This is the first time users SEE:
- their progress
- what’s next
- what they’ve mastered

This dramatically increases retention.
