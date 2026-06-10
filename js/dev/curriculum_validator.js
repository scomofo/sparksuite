// js/dev/curriculum_validator.js
// Shared structured curriculum validation for browser dev tools and Node checks.
(function(root) {
  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getInstrumentId(instrument) {
    return instrument && (instrument.id || instrument.appId || instrument.instrument || instrument.name) || "unknown";
  }

  function getInstrumentType(instrument) {
    return instrument && (instrument.instrument || instrument.type || instrument.id) || "unknown";
  }

  function collectSkillIds(tree) {
    var ids = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (node.id) ids.push(node.id);
      asArray(node.nodes).forEach(visit);
      asArray(node.children).forEach(visit);
      asArray(node.skills).forEach(visit);
      asArray(node.branches).forEach(visit);
    }
    if (Array.isArray(tree)) tree.forEach(visit);
    else visit(tree);
    return ids;
  }

  function chordNamesFromData(data) {
    var chords = data && data.ALL_CHORDS ? data.ALL_CHORDS : null;
    var emptyDataChords = Array.isArray(chords) ? chords.length === 0 : chords && Object.keys(chords).length === 0;
    if (!chords || emptyDataChords) chords = root.ALL_CHORDS;
    if (!chords && typeof ALL_CHORDS !== "undefined") chords = ALL_CHORDS;
    if (!chords) return null;
    if (Array.isArray(chords)) {
      var names = [];
      chords.forEach(function(chord) {
        if (chord && typeof chord === "object") {
          if (chord.name) names.push(chord.name);
          if (chord.short) names.push(chord.short);
          if (chord.id) names.push(chord.id);
        } else if (chord) {
          names.push(chord);
        }
      });
      return names;
    }
    return Object.keys(chords);
  }

  function issue(fields) {
    return {
      code: fields.code,
      severity: fields.severity || "warning",
      category: fields.category || "lesson",
      instrument: fields.instrument || "unknown",
      target: fields.target || "unknown",
      message: fields.message || fields.code,
      fix: fields.fix || null,
      nav: fields.nav || null
    };
  }

  function lessonId(lesson, index) {
    if (!lesson) return "lesson_" + (index + 1);
    return lesson.id || (lesson.num != null ? "level_" + lesson.num : "lesson_" + (index + 1));
  }

  function validateCurriculum(instrument) {
    var issues = [];
    if (!instrument) return issues;

    var instrumentId = getInstrumentId(instrument);
    var instrumentType = getInstrumentType(instrument);
    var map = typeof instrument.getCurriculumMap === "function" ? asArray(instrument.getCurriculumMap()) : [];
    var data = typeof instrument.getData === "function" ? (instrument.getData() || {}) : {};
    var exercises = typeof instrument.getExercises === "function" ? asArray(instrument.getExercises()) : [];
    var tree = typeof instrument.getSkillTree === "function" ? instrument.getSkillTree() : null;
    var skillIds = collectSkillIds(tree);
    var skillSet = {};
    skillIds.forEach(function(id) { skillSet[id] = true; });

    var exerciseSkills = {};
    exercises.forEach(function(exercise) {
      var skill = exercise && (exercise.skill || exercise.skillId);
      if (skill) exerciseSkills[skill] = true;
    });

    if (!map.length) {
      issues.push(issue({
        code: "CURRICULUM_EMPTY",
        severity: "error",
        category: "lesson",
        instrument: instrumentId,
        target: instrumentType,
        message: "getCurriculumMap() returned no lessons",
        fix: "Add lesson records or adapt curriculum v2 sessions for " + instrumentType,
        nav: { screen: "home", tab: "practice" }
      }));
    }

    if (typeof instrument.getSkillTree === "function" && !skillIds.length) {
      issues.push(issue({
        code: "SKILL_TREE_EMPTY",
        severity: "warning",
        category: "skill",
        instrument: instrumentId,
        target: instrumentType,
        message: "getSkillTree() returned no skill IDs",
        fix: "Add skill IDs to the instrument skill tree",
        nav: { screen: "skillTree", focus: "overview" }
      }));
    }

    var seenLessons = {};
    var lessonIdSet = {};
    map.forEach(function(lesson, index) {
      var lid = lessonId(lesson, index);
      if (lid) lessonIdSet[lid] = true;
    });
    var lc = data.LC || {};
    var ln = data.LN || {};
    var hasLevelLabels = Object.keys(lc).length > 0 || Object.keys(ln).length > 0;
    var chordNames = chordNamesFromData(data);

    map.forEach(function(lesson, index) {
      var id = lessonId(lesson, index);
      var nav = lesson && lesson.num != null
        ? { screen: "home", tab: "practice", level: lesson.num }
        : { screen: "home", tab: "practice" };

      if (!lesson || (!lesson.id && lesson.num == null)) {
        issues.push(issue({
          code: "LESSON_MISSING_ID",
          severity: "error",
          category: "lesson",
          instrument: instrumentId,
          target: id,
          message: "Lesson is missing both id and num",
          fix: "Add a stable id or numeric level to this lesson",
          nav: nav
        }));
      }

      if (seenLessons[id]) {
        issues.push(issue({
          code: "DUPLICATE_LESSON_ID",
          severity: "error",
          category: "lesson",
          instrument: instrumentId,
          target: id,
          message: "Duplicate lesson id: " + id,
          fix: "Rename one duplicate lesson id",
          nav: nav
        }));
      }
      seenLessons[id] = true;

      if (lesson && lesson.skill && skillIds.length && !skillSet[lesson.skill]) {
        issues.push(issue({
          code: "SKILL_NOT_IN_TREE",
          severity: "error",
          category: "skill",
          instrument: instrumentId,
          target: lesson.skill,
          message: "Lesson " + id + " references skill " + lesson.skill + " not in the skill tree",
          fix: "Add skill " + lesson.skill + " to the skill tree or update lesson " + id,
          nav: { screen: "skillTree", focus: "overview" }
        }));
      }

      if (lesson && lesson.skill && exercises.length && !exerciseSkills[lesson.skill]) {
        issues.push(issue({
          code: "NO_EXERCISES_FOR_SKILL",
          severity: "warning",
          category: "exercise",
          instrument: instrumentId,
          target: lesson.skill,
          message: "Skill " + lesson.skill + " has no mapped exercises",
          fix: "Add an exercise with skill or skillId " + lesson.skill,
          nav: nav
        }));
      }

      asArray(lesson && lesson.prerequisites).forEach(function(prereq) {
        // Lesson prerequisites can be either lesson IDs (handoff schema)
        // or skill IDs (legacy schema). Only flag when neither matches.
        if (lessonIdSet[prereq]) return;
        if (skillIds.length && !skillSet[prereq]) {
          issues.push(issue({
            code: "PREREQ_NOT_IN_TREE",
            severity: "error",
            category: "skill",
            instrument: instrumentId,
            target: prereq,
            message: "Lesson " + id + " prerequisite " + prereq + " is not a known lesson or skill",
            fix: "Add lesson/skill " + prereq + " or update lesson " + id,
            nav: { screen: "skillTree", focus: "overview" }
          }));
        }
      });

      asArray(lesson && lesson.chords).forEach(function(chord) {
        var canonicalChord = String(chord).split("/")[0];
        if (chordNames && chordNames.indexOf(chord) < 0 && chordNames.indexOf(canonicalChord) < 0) {
          issues.push(issue({
            code: "CHORD_NOT_IN_DATA",
            severity: "error",
            category: "chord",
            instrument: instrumentId,
            target: chord,
            message: "Lesson " + id + " references chord " + chord + " not in ALL_CHORDS",
            fix: "Add chord " + chord + " to ALL_CHORDS or remove it from lesson " + id,
            nav: nav
          }));
        }
      });

      if (lesson && lesson.num != null && hasLevelLabels) {
        if (!lc[lesson.num]) {
          issues.push(issue({
            code: "LC_MISSING",
            severity: "warning",
            category: "level",
            instrument: instrumentId,
            target: String(lesson.num),
            message: "Level " + lesson.num + " has no LC color",
            fix: "Add LC[" + lesson.num + "]",
            nav: nav
          }));
        }
        if (!ln[lesson.num]) {
          issues.push(issue({
            code: "LN_MISSING",
            severity: "warning",
            category: "level",
            instrument: instrumentId,
            target: String(lesson.num),
            message: "Level " + lesson.num + " has no LN name",
            fix: "Add LN[" + lesson.num + "]",
            nav: nav
          }));
        }
      }

      if (lesson && lesson.masteryRequired != null && (lesson.masteryRequired < 0 || lesson.masteryRequired > 1)) {
        issues.push(issue({
          code: "MASTERY_OUT_OF_RANGE",
          severity: "warning",
          category: "lesson",
          instrument: instrumentId,
          target: id,
          message: "masteryRequired must be between 0 and 1",
          fix: "Clamp masteryRequired for " + id + " to the 0-1 range",
          nav: nav
        }));
      }
    });

    if (!exercises.length && typeof instrument.getExercises === "function") {
      issues.push(issue({
        code: "EXERCISES_EMPTY",
        severity: "info",
        category: "exercise",
        instrument: instrumentId,
        target: instrumentType,
        message: "getExercises() returned no exercises",
        fix: "Add exercises when this instrument is ready for practice generation",
        nav: { screen: "home", tab: "practice" }
      }));
    }

    return issues;
  }

  function groupIssues(issues) {
    var grouped = { skills: {}, lessons: {}, levels: {}, chords: {}, exercises: {} };
    asArray(issues).forEach(function(item) {
      var bucket = item.category === "skill" ? "skills"
        : item.category === "level" ? "levels"
        : item.category === "chord" ? "chords"
        : item.category === "exercise" ? "exercises"
        : "lessons";
      if (!grouped[bucket][item.target]) grouped[bucket][item.target] = [];
      grouped[bucket][item.target].push(item);
    });
    return grouped;
  }

  var api = {
    validateCurriculum: validateCurriculum,
    groupIssues: groupIssues
  };

  root.SparkCurriculumValidator = api;
  root.validateCurriculum = validateCurriculum;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
