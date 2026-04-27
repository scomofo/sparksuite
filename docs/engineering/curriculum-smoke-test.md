# Curriculum Smoke Test

Run these checks in the browser console after loading SparkSuite from a local server.

```js
function summarizeInstrument(name, moduleName) {
  var mod = window[moduleName];
  if (!mod) return { instrument: name, ok: false, error: moduleName + " missing" };
  var lessons = typeof mod.getLessons === "function" ? mod.getLessons() : [];
  var first = lessons && lessons[0] ? lessons[0] : null;
  var chartId = typeof mod.selectChartId === "function"
    ? mod.selectChartId({ curriculum: { nextLessonId: first && first.id } })
    : null;
  return {
    instrument: name,
    ok: !!(lessons.length && chartId),
    lessons: lessons.length,
    firstLesson: first ? first.id : null,
    firstSkill: first ? first.skill : null,
    chartId: chartId
  };
}

[
  summarizeInstrument("ukulele", "SparkUkuleleModule"),
  summarizeInstrument("guitar", "SparkGuitarModule"),
  summarizeInstrument("piano", "SparkPianoModule")
]
```

Expected after Guitar Step 2: guitar returns lessons and a skill-specific chart such as `gtr_down_strum_01`.
