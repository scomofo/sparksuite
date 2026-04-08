#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');

function loadJS(relativePath) {
  var absolutePath = path.join(ROOT, relativePath);
  var code = fs.readFileSync(absolutePath, 'utf8');
  vm.runInThisContext(code, { filename: absolutePath });
}

function resetGlobals() {
  global.window = global;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function flattenSkillIds(skillTree) {
  var ids = [];
  if (Array.isArray(skillTree)) {
    for (var i = 0; i < skillTree.length; i++) {
      if (skillTree[i] && skillTree[i].id) ids.push(String(skillTree[i].id));
    }
    return ids;
  }
  if (skillTree && typeof skillTree === 'object') {
    Object.keys(skillTree).forEach(function(category) {
      var entries = skillTree[category];
      if (Array.isArray(entries)) {
        entries.forEach(function(entry) {
          if (typeof entry === 'string') ids.push(entry);
          else if (entry && entry.id) ids.push(String(entry.id));
        });
      }
    });
  }
  return ids;
}

function listExerciseSkillIds(module, lessonSkillIds) {
  var ids = [];
  lessonSkillIds.forEach(function(skillId) {
    var exercises = ensureArray(module.getExercises(skillId));
    if (exercises.length > 0) ids.push(skillId);
  });
  return ids;
}

function validateModule(spec) {
  resetGlobals();
  spec.files.forEach(loadJS);

  var module = global[spec.moduleGlobal];
  if (!module) {
    throw new Error('Missing module global: ' + spec.moduleGlobal);
  }

  var issues = [];
  var warnings = [];

  var skillTree = module.getSkillTree ? module.getSkillTree() : null;
  var skillIds = flattenSkillIds(skillTree);
  var skillIdSet = new Set(skillIds);
  if (skillIds.length === 0) {
    issues.push('No skills found in skill tree');
  }

  var lessons = ensureArray(module.getLessons ? module.getLessons() : []);
  if (lessons.length === 0) {
    issues.push('No lessons found');
  }

  var lessonIds = new Set();
  var lessonSkillIds = [];
  lessons.forEach(function(lesson) {
    if (!lesson || !lesson.id) {
      issues.push('Encountered lesson without id');
      return;
    }
    if (lessonIds.has(lesson.id)) {
      issues.push('Duplicate lesson id: ' + lesson.id);
    }
    lessonIds.add(lesson.id);

    if (!lesson.skill) {
      issues.push('Lesson ' + lesson.id + ' is missing a primary skill');
    } else {
      lessonSkillIds.push(String(lesson.skill));
      if (!skillIdSet.has(String(lesson.skill))) {
        issues.push('Lesson ' + lesson.id + ' references missing skill: ' + lesson.skill);
      }
    }

    ensureArray(lesson.prerequisites).forEach(function(prereq) {
      if (!skillIdSet.has(String(prereq))) {
        issues.push('Lesson ' + lesson.id + ' references missing prerequisite skill: ' + prereq);
      }
    });
  });

  var exerciseBackedSkills = new Set();
  lessonSkillIds.forEach(function(skillId) {
    var exercises = ensureArray(module.getExercises ? module.getExercises(skillId) : []);
    if (!exercises.length) {
      issues.push('Skill ' + skillId + ' has no exercises but is used by at least one lesson');
      return;
    }
    exerciseBackedSkills.add(skillId);

    var exerciseIds = new Set();
    exercises.forEach(function(exercise, index) {
      if (!exercise || typeof exercise !== 'object') {
        issues.push('Skill ' + skillId + ' has invalid exercise at index ' + index);
        return;
      }
      if (!exercise.id) {
        issues.push('Skill ' + skillId + ' has exercise without id at index ' + index);
      } else if (exerciseIds.has(exercise.id)) {
        issues.push('Skill ' + skillId + ' has duplicate exercise id: ' + exercise.id);
      } else {
        exerciseIds.add(exercise.id);
      }
      if (!exercise.type) {
        issues.push('Skill ' + skillId + ' has exercise without type: ' + (exercise.id || ('index_' + index)));
      }
    });
  });

  if (module.getRhythmChartLibrary) {
    var chartLibrary = module.getRhythmChartLibrary() || {};
    Object.keys(chartLibrary).forEach(function(chartId) {
      var chart = chartLibrary[chartId];
      if (!chart) {
        issues.push('Chart library entry ' + chartId + ' is empty');
        return;
      }
      if (!Array.isArray(chart.notes) || chart.notes.length === 0) {
        issues.push('Chart ' + chartId + ' has no notes');
      }
      ensureArray(chart.notes).forEach(function(note, index) {
        if (!note || !note.skillId) {
          issues.push('Chart ' + chartId + ' note ' + index + ' is missing skillId');
          return;
        }
        if (!skillIdSet.has(String(note.skillId))) {
          issues.push('Chart ' + chartId + ' references missing skillId: ' + note.skillId);
        }
      });
    });
  }

  skillIds.forEach(function(skillId) {
    if (lessonSkillIds.indexOf(skillId) === -1) {
      warnings.push('Skill present in tree but not used by any lesson: ' + skillId);
    }
  });

  var uniqueLessonSkills = Array.from(new Set(lessonSkillIds));

  return {
    name: spec.name,
    issueCount: issues.length,
    warningCount: warnings.length,
    issues: issues,
    warnings: warnings,
    summary: {
      skillCount: skillIds.length,
      lessonCount: lessons.length,
      lessonSkillCount: uniqueLessonSkills.length,
      exerciseBackedSkillCount: exerciseBackedSkills.size
    }
  };
}

var moduleSpecs = [
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

var results = [];
var totalIssues = 0;
var totalWarnings = 0;

moduleSpecs.forEach(function(spec) {
  try {
    var result = validateModule(spec);
    results.push(result);
    totalIssues += result.issueCount;
    totalWarnings += result.warningCount;
  } catch (err) {
    results.push({
      name: spec.name,
      issueCount: 1,
      warningCount: 0,
      issues: ['Validator crashed: ' + err.message],
      warnings: [],
      summary: null
    });
    totalIssues += 1;
  }
});

console.log('\n=== SparkSuite Curriculum Validator ===\n');
results.forEach(function(result) {
  console.log('Instrument: ' + result.name);
  if (result.summary) {
    console.log('  Skills: ' + result.summary.skillCount +
      ' | Lessons: ' + result.summary.lessonCount +
      ' | Lesson skills: ' + result.summary.lessonSkillCount +
      ' | Exercise-backed skills: ' + result.summary.exerciseBackedSkillCount);
  }
  if (result.issues.length === 0) {
    console.log('  Issues: none');
  } else {
    console.log('  Issues:');
    result.issues.forEach(function(issue) {
      console.log('    - ' + issue);
    });
  }
  if (result.warnings.length === 0) {
    console.log('  Warnings: none');
  } else {
    console.log('  Warnings:');
    result.warnings.forEach(function(warning) {
      console.log('    - ' + warning);
    });
  }
  console.log('');
});

console.log('Total issues: ' + totalIssues);
console.log('Total warnings: ' + totalWarnings);

if (totalIssues > 0) {
  process.exit(1);
}
