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
    skillTree.forEach(function(entry) {
      if (entry && entry.id) ids.push(String(entry.id));
    });
    return ids;
  }
  if (skillTree && typeof skillTree === 'object') {
    Object.keys(skillTree).forEach(function(category) {
      ensureArray(skillTree[category]).forEach(function(entry) {
        if (typeof entry === 'string') ids.push(entry);
        else if (entry && entry.id) ids.push(String(entry.id));
      });
    });
  }
  return ids;
}

function classifySkill(skillId) {
  var id = String(skillId || '').toLowerCase();
  if (id.indexOf('strum') >= 0 || id.indexOf('syncop') >= 0 || id.indexOf('rhythm') >= 0) return { type: 'strum_pattern', extra: 'pattern: "D DU UDU", tempo: 76, durationSec: 120' };
  if (id.indexOf('chord') >= 0 || id.indexOf('barre') >= 0) return { type: 'chord', extra: 'chord: "C", durationSec: 90' };
  if (id.indexOf('finger') >= 0 || id.indexOf('pick') >= 0) return { type: 'fingerpick', extra: 'pattern: "GCEA", tempo: 72, durationSec: 120' };
  if (id.indexOf('melody') >= 0 || id.indexOf('scale') >= 0 || id.indexOf('lead') >= 0) return { type: 'melody_line', extra: 'notes: ["C5", "E5", "G5", "A5"], tempo: 72, durationSec: 90' };
  if (id.indexOf('song') >= 0 || id.indexOf('performance') >= 0) return { type: 'performance_run', extra: 'progression: ["C", "G", "Am", "F"], tempo: 78, durationSec: 210' };
  return { type: 'exercise', extra: 'durationSec: 90' };
}

function buildExerciseStub(skillId, instrumentName) {
  var template = classifySkill(skillId);
  var idPrefix = String(instrumentName || 'instrument').toLowerCase();
  return [
    '  ' + JSON.stringify(skillId) + ': [',
    '    { id: ' + JSON.stringify(idPrefix + '_' + skillId + '_01') + ', type: ' + JSON.stringify(template.type) + ', ' + template.extra + ' }',
    '  ]'
  ].join('\n');
}

function buildSkillTreeStub(skillId) {
  var classification = classifySkill(skillId);
  var category = classification.type === 'chord' ? 'chords' :
    classification.type === 'fingerpick' ? 'picking' :
    classification.type === 'melody_line' ? 'lead' :
    classification.type === 'performance_run' ? 'performance' : 'rhythm';
  var label = String(skillId).split('_').map(function(part) {
    return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
  }).join(' ');
  return '{ id: ' + JSON.stringify(skillId) + ', category: ' + JSON.stringify(category) + ', label: ' + JSON.stringify(label) + ' }';
}

function buildChartMapSuggestion(skillId, fallbackChartId) {
  return JSON.stringify(skillId) + ': ' + JSON.stringify(fallbackChartId || 'replace_with_chart_id');
}

function analyzeModule(spec) {
  resetGlobals();
  spec.files.forEach(loadJS);

  var module = global[spec.moduleGlobal];
  if (!module) {
    return {
      name: spec.name,
      errors: ['Missing module global: ' + spec.moduleGlobal],
      suggestions: []
    };
  }

  var skillIds = flattenSkillIds(module.getSkillTree ? module.getSkillTree() : null);
  var skillSet = new Set(skillIds);
  var lessons = ensureArray(module.getLessons ? module.getLessons() : []);
  var suggestions = [];
  var fallbackChartId = spec.fallbackChartId || null;

  lessons.forEach(function(lesson) {
    if (!lesson || !lesson.id) return;

    if (lesson.skill && !skillSet.has(String(lesson.skill))) {
      suggestions.push({
        type: 'missing_skill_tree_entry',
        lessonId: lesson.id,
        skillId: lesson.skill,
        targetFile: spec.skillTreePath,
        snippet: buildSkillTreeStub(lesson.skill)
      });
    }

    ensureArray(lesson.prerequisites).forEach(function(prereq) {
      if (!skillSet.has(String(prereq))) {
        suggestions.push({
          type: 'missing_prerequisite_skill_tree_entry',
          lessonId: lesson.id,
          skillId: prereq,
          targetFile: spec.skillTreePath,
          snippet: buildSkillTreeStub(prereq)
        });
      }
    });

    if (lesson.skill) {
      var exercises = ensureArray(module.getExercises ? module.getExercises(lesson.skill) : []);
      if (!exercises.length) {
        suggestions.push({
          type: 'missing_exercise_block',
          lessonId: lesson.id,
          skillId: lesson.skill,
          targetFile: spec.exercisePath,
          snippet: buildExerciseStub(lesson.skill, spec.name)
        });

        if (spec.chartMapPath) {
          suggestions.push({
            type: 'missing_chart_map_entry',
            lessonId: lesson.id,
            skillId: lesson.skill,
            targetFile: spec.chartMapPath,
            snippet: buildChartMapSuggestion(lesson.skill, fallbackChartId)
          });
        }
      }
    }
  });

  return {
    name: spec.name,
    errors: [],
    suggestions: suggestions
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
    ],
    skillTreePath: 'js/sparksuite/instruments/ukulele/ukulele_skill_tree.js',
    exercisePath: 'js/sparksuite/instruments/ukulele/ukulele_exercises.js',
    chartMapPath: 'js/sparksuite/instruments/ukulele/ukulele_module.js',
    fallbackChartId: 'uke_stage_flow_01'
  },
  {
    name: 'bass',
    moduleGlobal: 'SparkBassModule',
    files: [
      'js/instruments/bass/data.js',
      'js/sparksuite/instruments/bass/bass_module.js'
    ],
    skillTreePath: 'js/instruments/bass/data.js',
    exercisePath: 'js/sparksuite/instruments/bass/bass_module.js',
    chartMapPath: 'js/sparksuite/instruments/bass/bass_module.js',
    fallbackChartId: 'bass_funk_push_01'
  }
];

var results = moduleSpecs.map(analyzeModule);
var totalSuggestions = 0;

console.log('\n=== SparkSuite Curriculum Fix Suggestions ===\n');
results.forEach(function(result) {
  console.log('Instrument: ' + result.name);
  if (result.errors.length) {
    result.errors.forEach(function(error) {
      console.log('  Error: ' + error);
    });
    console.log('');
    return;
  }
  if (!result.suggestions.length) {
    console.log('  No fix suggestions needed.');
    console.log('');
    return;
  }
  result.suggestions.forEach(function(suggestion, index) {
    totalSuggestions += 1;
    console.log('  [' + (index + 1) + '] ' + suggestion.type);
    console.log('      lesson: ' + suggestion.lessonId);
    console.log('      skill: ' + suggestion.skillId);
    console.log('      target: ' + suggestion.targetFile);
    console.log('      snippet:');
    suggestion.snippet.split('\n').forEach(function(line) {
      console.log('        ' + line);
    });
    console.log('');
  });
});

console.log('Total suggestions: ' + totalSuggestions);
