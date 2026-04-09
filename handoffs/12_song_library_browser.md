# SparkSuite – Song Library Browser (12)

## Goal
Create a clean, Apple-level song browsing experience that complements the progression map.

---

# 1. PRODUCT ROLE

The Song Library is:
- exploratory (browse all songs)
- complementary to progression (not replacing it)
- searchable + filterable

---

# 2. LAYOUT STRUCTURE

Top:
- Title: "Songs"
- Search bar

Middle:
- Filter chips (Difficulty, Skill, Completed)
- Song grid/list

Bottom:
- Persistent "Continue" CTA (recommended song)

---

# 3. SONG CARD DESIGN

## Card

- Height: 80px
- Padding: 16px
- Radius: 12px
- Background: #1C1C1E

## Content

Left:
- Song title (16px semibold)
- Subtitle (skill / pattern)

Right:
- Stars (★ ★ ☆)
- Lock icon (if locked)

---

# 4. STATES

## Locked
- Dimmed (opacity 0.4)
- Lock icon

## Completed
- Stars visible

## Recommended
- Subtle green accent bar on left

---

# 5. FILTERS

## Chips

```js
[
  "All",
  "Easy",
  "Medium",
  "Hard",
  "Completed",
  "Incomplete"
]
```

---

# 6. SEARCH

```js
function filterSongs(query, songs) {
  return songs.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase())
  );
}
```

---

# 7. INTERACTION

- Tap → start song
- Locked → no action
- Long press → preview (future)

---

# 8. DATA MODEL

```js
{
  id,
  title,
  difficulty,
  stars,
  locked,
  recommended
}
```

---

# 9. UX RULES

- Always show recommended song at top
- Keep list scannable (no clutter)
- Avoid dense metadata

---

# DONE CRITERIA

- songs are browsable
- filters work
- search works
- recommended is visible

---

# WHY THIS MATTERS

This provides:
- freedom of choice
- content discoverability
- depth beyond linear progression
