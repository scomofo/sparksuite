#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, '.preview_validation.json');

function loadJS(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const code = fs.readFileSync(absolutePath, 'utf8');
  vm.runInThisContext(code, { filename: absolutePath });
}

function resetGlobals() {
  global.window = global;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function flattenSkillIds(skillTree) {
  const ids = [];
  if (Array.isArray(skillTree)) {
    for (const entry of skillTree) {
      if (entry && entry.id) ids.push(String(entry.id));
    }
    return ids;
  }
  if (skillTree && typeof skillTree === 'object') {
    Object.keys(skillTree).forEach(category => {
      ensureArray(skillTree[category]).forEach(entry => {
        if (typeof entry === 'string') ids.push(entry);
        else if (entry && entry.id) ids.push(String(entry.id));
      });
    });
  }
  return ids;
}

function makeIssue(fields) {
  return Object.assign({
    type: 'unknown',
    severity: 'error',
    instrument: null,
    skillId: null,
    lessonId: null,
    chartId: null,
    exerciseId: null,
    message: ''
  }, fields || {});
}

function validateModule(spec) {
  resetGlobals();
  spec.files.forEach(loadJS);

  const module = global[spec.moduleGlobal];
  if (!module) {
    return {
      instrument: spec.name,
      issues: [makeIssue({
        type: 'validator_crash',
        severity: 'error',
        instrument: spec.name,
        message: 'Missing module global: ' + spec.moduleGlobal
      })],
      summary: null
    };
  }

  const issues = [];
  const warnings = [];
  const skillTree = module.getSkillTree ? module.getSkillTree() : null;
  const skillIds = flattenSkillIds(skillTree);
  const skillIdSet = new Set(skillIds);

  if (skillIds.length === 0) {
    issues.push(makeIssue({
      type: 'missing_skill',
      severity: 'error',
      instrument: spec.name,
      message: 'No skills found in skill tree'
    }));
  }

  const lessons = ensureArray(module.getLessons ? module.getLessons() : []);
  if (lessons.length === 0) {
    issues.push(makeIssue({
      type: 'missing_lesson',
      severity: 'error',
      instrument: spec.name,
      message: 'No lessons found'
    }));
  }

  const lessonIds = new Set();
  const lessonSkillIds = [];

  lessons.forEach(lesson => {
    if (!lesson || !lesson.id) {
      issues.push(makeIssue({
        type: 'invalid_lesson',
        severity: 'error',
        instrument: spec.name,
        message: 'Encountered lesson without id'
      }));
      return;
    }

    if (lessonIds.has(lesson.id)) {
      issues.push(makeIssue({
        type: 'duplicate_lesson',
        severity: 'error',
        instrument: spec.name,
        lessonId: lesson.id,
        message: 'Duplicate lesson id: ' + lesson.id
      }));
    }
    lessonIds.add(lesson.id);

    if (!lesson.skill) {
      issues.push(makeIssue({
        type: 'missing_skill',
        severity: 'error',
        instrument: spec.name,
        lessonId: lesson.id,
        message: 'Lesson ' + lesson.id + ' is missing a primary skill'
      }));
    } else {
      lessonSkillIds.push(String(lesson.skill));
      if (!skillIdSet.has(String(lesson.skill))) {
        issues.push(makeIssue({
          type: 'missing_skill',
          severity: 'error',
          instrument: spec.name,
          lessonId: lesson.id,
          skillId: String(lesson.skill),
          message: 'Lesson ' + lesson.id + ' references missing skill: ' + lesson.skill
        }));
      }
    }

    ensureArray(lesson.prerequisites).forEach(prereq => {
      if (!skillIdSet.has(String(prereq))) {
        issues.push(makeIssue({
          type: 'missing_prerequisite',
          severity: 'error',
          instrument: spec.name,
          lessonId: lesson.id,
          skillId: String(prereq),
          message: 'Lesson ' + lesson.id + ' references missing prerequisite skill: ' + prereq
        }));
      }
    });
  });

  const exerciseBackedSkills = new Set();
  lessonSkillIds.forEach(skillId => {
    const exercises = ensureArray(module.getExercises ? module.getExercises(skillId) : []);
    if (!exercises.length) {
      issues.push(makeIssue({
        type: 'missing_exercise',
        severity: 'error',
        instrument: spec.name,
        skillId,
        message: 'Skill ' + skillId + ' has no exercises but is used by at least one lesson'
      }));
      return;
    }

    exerciseBackedSkills.add(skillId);
    const exerciseIds = new Set();

    exercises.forEach((exercise, index) => {
      if (!exercise || typeof exercise !== 'object') {
        issues.push(makeIssue({
          type: 'invalid_exercise',
          severity: 'error',
          instrument: spec.name,
          skillId,
          message: 'Skill ' + skillId + ' has invalid exercise at index ' + index
        }));
        return;
      }

      if (!exercise.id) {
        issues.push(makeIssue({
          type: 'invalid_exercise',
          severity: 'error',
          instrument: spec.name,
          skillId,
          message: 'Skill ' + skillId + ' has exercise without id at index ' + index
        }));
      } else if (exerciseIds.has(exercise.id)) {
        issues.push(makeIssue({
          type: 'duplicate_exercise',
          severity: 'error',
          instrument: spec.name,
          skillId,
          exerciseId: String(exercise.id),
          message: 'Skill ' + skillId + ' has duplicate exercise id: ' + exercise.id
        }));
      } else {
        exerciseIds.add(exercise.id);
      }

      if (!exercise.type) {
        issues.push(makeIssue({
          type: 'invalid_exercise',
          severity: 'error',
          instrument: spec.name,
          skillId,
          exerciseId: exercise.id ? String(exercise.id) : null,
          message: 'Skill ' + skillId + ' has exercise without type: ' + (exercise.id || ('index_' + index))
        }));
      }
    });
  });

  if (module.getRhythmChartLibrary) {
    const chartLibrary = module.getRhythmChartLibrary() || {};
    Object.keys(chartLibrary).forEach(chartId => {
      const chart = chartLibrary[chartId];
      if (!chart) {
        issues.push(makeIssue({
          type: 'chart_missing_notes',
          severity: 'error',
          instrument: spec.name,
          chartId,
          message: 'Chart library entry ' + chartId + ' is empty'
        }));
        return;
      }

      if (!Array.isArray(chart.notes) || chart.notes.length === 0) {
        issues.push(makeIssue({
          type: 'chart_missing_notes',
          severity: 'error',
          instrument: spec.name,
          chartId,
          message: 'Chart ' + chartId + ' has no notes'
        }));
      }

      ensureArray(chart.notes).forEach((note, index) => {
        if (!note || !note.skillId) {
          issues.push(makeIssue({
            type: 'chart_missing_skill',
            severity: 'error',
            instrument: spec.name,
            chartId,
            message: 'Chart ' + chartId + ' note ' + index + ' is missing skillId'
          }));
          return;
        }
        if (!skillIdSet.has(String(note.skillId))) {
          issues.push(makeIssue({
            type: 'chart_missing_skill',
            severity: 'error',
            instrument: spec.name,
            chartId,
            skillId: String(note.skillId),
            message: 'Chart ' + chartId + ' references missing skillId: ' + note.skillId
          }));
        }
      });
    });
  }

  skillIds.forEach(skillId => {
    if (lessonSkillIds.indexOf(skillId) === -1) {
      warnings.push(makeIssue({
        type: 'orphan_skill',
        severity: 'warning',
        instrument: spec.name,
        skillId,
        message: 'Skill present in tree but not used by any lesson: ' + skillId
      }));
    }
  });

  return {
    instrument: spec.name,
    issues: issues.concat(warnings),
    summary: {
      skillCount: skillIds.length,
      lessonCount: lessons.length,
      lessonSkillCount: Array.from(new Set(lessonSkillIds)).length,
      exerciseBackedSkillCount: exerciseBackedSkills.size
    }
  };
}

const moduleSpecs = [
  {
    name: 'ukulele',
    moduleGlobal: 'SparkUkuleleModule',
    files: [
      'js/sparksuite/instruments/ukulele/ukulele_skill_tree.js',
      'js/sparksuite/instruments/ukulele/ukulele_lessons.js',
      'js/sparksuite/instruments/ukulele/ukulele_chords.js',
      'js/sparksuite/instruments/ukulele/ukulele_scales.js',
      'js/sparksuite/instruments/ukulele/ukulele_tuning.js',
      'js/sparksuite/instruments/ukulele/ukulele_exercises.js',
      'js/sparksuite/instruments/ukulele/ukulele_progression.js',
      'js/sparksuite/instruments/ukulele/ukulele_module.js'
    ]
  },
  {
    name: 'bass',
    moduleGlobal: 'SparkBassModule',
    files: [
      'js/instruments/bass/data.js',
      'js/sparksuite/instruments/bass/bass_module.js'
    ]
  }
];

const moduleResults = moduleSpecs.map(validateModule);
const issues = moduleResults.flatMap(result => result.issues);
const errorCount = issues.filter(issue => issue.severity === 'error').length;
const warningCount = issues.filter(issue => issue.severity === 'warning').length;

const payload = {
  ok: errorCount === 0,
  updatedAt: Date.now(),
  summary: errorCount + ' errors, ' + warningCount + ' warnings',
  issueCount: issues.length,
  errors: errorCount,
  warnings: warningCount,
  modules: moduleResults,
  issues
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

console.log('\n=== SparkSuite Structured Curriculum Validator ===\n');
moduleResults.forEach(result => {
  console.log('Instrument: ' + result.instrument);
  if (result.summary) {
    console.log('  Skills: ' + result.summary.skillCount + ' | Lessons: ' + result.summary.lessonCount + ' | Lesson skills: ' + result.summary.lessonSkillCount + ' | Exercise-backed skills: ' + result.summary.exerciseBackedSkillCount);
  }
  const instrumentIssues = result.issues;
  if (!instrumentIssues.length) {
    console.log('  Issues: none');
  } else {
    instrumentIssues.forEach(issue => {
      console.log('  [' + issue.severity.toUpperCase() + '] ' + issue.type + ': ' + issue.message);
    });
  }
  console.log('');
});
console.log(payload.summary);
console.log('Structured output written to ' + OUTPUT_PATH);

if (!payload.ok) process.exit(1);
