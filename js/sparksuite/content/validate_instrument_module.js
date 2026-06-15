(function() {
  function normalizeSkillTree(skillTree) {
    var normalized = [];

    function pushSkill(skill) {
      var i;
      if (typeof skill === "string" && skill) {
        for (i = 0; i < normalized.length; i++) {
          if (normalized[i] && normalized[i].id === skill) return;
        }
        normalized.push({ id: skill, __generatedLeaf: true });
        return;
      }
      if (skill && typeof skill === "object") normalized.push(skill);
    }

    function walkBranch(branch) {
      var i;
      if (!branch) return;
      if (Array.isArray(branch)) {
        for (i = 0; i < branch.length; i++) walkBranch(branch[i]);
        return;
      }
      pushSkill(branch);
      if (Array.isArray(branch.children)) walkBranch(branch.children);
      if (Array.isArray(branch.skills)) walkBranch(branch.skills);
      if (Array.isArray(branch.nodes)) walkBranch(branch.nodes);
    }

    if (Array.isArray(skillTree)) {
      walkBranch(skillTree);
    } else if (skillTree && Array.isArray(skillTree.branches)) {
      walkBranch(skillTree.branches);
    } else if (skillTree && typeof skillTree === "object") {
      Object.keys(skillTree).forEach(function(key) {
        walkBranch(skillTree[key]);
      });
    }

    return normalized;
  }

  function validateSkillTree(moduleId, skillTree) {
    var skills = normalizeSkillTree(skillTree);
    var ids = {};
    var i;
    var skill;

    if (!skills.length) {
      throw new Error(moduleId + ': skill tree must expose at least one skill');
    }

    for (i = 0; i < skills.length; i++) {
      skill = skills[i] || {};
      if (!skill.id) {
        throw new Error(moduleId + ": skill tree entry missing id");
      }
      if (ids[skill.id] && !skill.__generatedLeaf) {
        throw new Error(moduleId + ': duplicate skill id "' + skill.id + '"');
      }
      ids[skill.id] = true;
    }

    return skills;
  }

  function validateLessons(moduleId, lessons, skillTree) {
    var skillIds = {};
    var lessonIds = {};
    var seenIds = {};
    var i;
    var j;
    var lesson;
    var prereqs;
    var lessonId;
    var lessonSkill;
    var skills = normalizeSkillTree(skillTree);

    if (!Array.isArray(lessons) || !lessons.length) {
      throw new Error(moduleId + ": lessons must be a non-empty array");
    }

    for (i = 0; i < skills.length; i++) {
      skillIds[skills[i].id] = true;
    }

    // First pass: build complete lesson ID map so forward-reference prerequisites validate correctly
    for (i = 0; i < lessons.length; i++) {
      lesson = lessons[i] || {};
      lessonId = lesson.id || (lesson.num != null ? String(lesson.num) : null);
      if (lessonId) lessonIds[lessonId] = true;
    }

    // Second pass: validate skills, duplicates, and prerequisites
    for (i = 0; i < lessons.length; i++) {
      lesson = lessons[i] || {};
      lessonId = lesson.id || (lesson.num != null ? String(lesson.num) : null);
      if (!lessonId) {
        throw new Error(moduleId + ": lesson missing id");
      }
      if (seenIds[lessonId]) {
        throw new Error(moduleId + ': duplicate lesson id "' + lessonId + '"');
      }
      seenIds[lessonId] = true;

      lessonSkill = lesson.skill || (Array.isArray(lesson.skills) && lesson.skills.length ? lesson.skills[0] : null);
      if (!lessonSkill) {
        throw new Error(moduleId + ': lesson "' + lessonId + '" missing skill');
      }
      if (!skillIds[lessonSkill]) {
        throw new Error(moduleId + ': lesson "' + lessonId + '" references missing skill "' + lessonSkill + '"');
      }

      prereqs = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
      for (j = 0; j < prereqs.length; j++) {
        if (!skillIds[prereqs[j]] && !lessonIds[prereqs[j]]) {
          throw new Error(moduleId + ': lesson "' + lessonId + '" references missing prerequisite "' + prereqs[j] + '"');
        }
      }
    }

    return true;
  }

  function validateCapabilities(moduleId, capabilities) {
    if (!capabilities || typeof capabilities !== "object") {
      throw new Error(moduleId + ": getCapabilities() must return an object");
    }
    if (!capabilities.preferredRenderer) {
      throw new Error(moduleId + ": capabilities missing preferredRenderer");
    }
    if (!Array.isArray(capabilities.inputModes)) {
      throw new Error(moduleId + ": capabilities.inputModes must be an array");
    }
    return true;
  }

  function validateExercises(moduleId, moduleApi, lessons) {
    var lesson = Array.isArray(lessons) && lessons.length ? lessons[0] : null;
    var lessonSkill = lesson ? (lesson.skill || (Array.isArray(lesson.skills) && lesson.skills.length ? lesson.skills[0] : undefined)) : undefined;
    var exercises;
    if (typeof moduleApi.getExercises !== "function") {
      throw new Error(moduleId + ": missing getExercises");
    }
    exercises = moduleApi.getExercises(lessonSkill);
    if (!Array.isArray(exercises)) {
      throw new Error(moduleId + ": getExercises() must return an array");
    }
    return true;
  }

  function validateInstrumentModule(moduleApi, expectedId) {
    var moduleId;
    var requiredMethods = ["getId", "getType", "getCurriculumMap", "getSkillTree", "getLessons", "getExercises", "getTuning", "getCapabilities"];
    var i;
    var skillTree;
    var lessons;

    if (!moduleApi || typeof moduleApi !== "object") {
      throw new Error("Instrument module must be an object");
    }

    for (i = 0; i < requiredMethods.length; i++) {
      if (typeof moduleApi[requiredMethods[i]] !== "function") {
        throw new Error('Instrument module missing method: ' + requiredMethods[i]);
      }
    }

    moduleId = moduleApi.getType();
    if (!moduleId) {
      throw new Error("Instrument module getType() must return an instrument id");
    }
    if (expectedId && moduleId !== expectedId) {
      throw new Error('Instrument registration mismatch: key "' + expectedId + '", module type "' + moduleId + '"');
    }

    skillTree = moduleApi.getSkillTree();
    lessons = moduleApi.getLessons();

    validateSkillTree(moduleId, skillTree);
    validateLessons(moduleId, lessons, skillTree);
    validateExercises(moduleId, moduleApi, lessons);
    validateCapabilities(moduleId, moduleApi.getCapabilities());

    return true;
  }

  if (typeof window !== "undefined") {
    window.SparkValidateInstrumentModule = validateInstrumentModule;
    window.SparkValidateSkillTree = validateSkillTree;
    window.SparkValidateLessons = validateLessons;
    window.SparkValidateCapabilities = validateCapabilities;
    window.SparkValidateExercises = validateExercises;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      validateInstrumentModule: validateInstrumentModule,
      validateSkillTree: validateSkillTree,
      validateLessons: validateLessons,
      validateCapabilities: validateCapabilities,
      validateExercises: validateExercises
    };
  }
})();
