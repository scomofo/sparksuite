(function() {
  function lessonSkill(lessonId) {
    var lessons = window.SparkBassModule && typeof window.SparkBassModule.getLessons === "function"
      ? window.SparkBassModule.getLessons()
      : [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i].skill || (lessons[i].focusSkills && lessons[i].focusSkills[0]) || "root_notes";
    }
    return "root_notes";
  }

  function selectChartId(context) {
    context = context || {};
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var skill = lessonSkill(lessonId);
    if (/slap|pop|funk/.test(skill)) return "bass_funk_push_01";
    if (/ghost|accent|mute|dynamic/.test(skill)) return "bass_ghost_grid_01";
    if (/walk|passing|arpeggio|improvisation/.test(skill)) return "bass_walk_intro_01";
    if (/fifth|octave|eighth|scale|shift/.test(skill)) return "bass_fifth_drive_01";
    return "bass_root_pulse_01";
  }

  function patchBassModule() {
    var mod = window.SparkBassModule;
    if (!mod || mod.__curriculumIntegrationPatched) return;
    mod.__curriculumIntegrationPatched = true;
    mod.getCurriculum = function() {
      return {
        id: "bass_core",
        title: "Bass Core Curriculum",
        tracks: (window.BASS_CURRICULUM || []).map(function(row) {
          return {
            id: "bass_level_" + row.num,
            title: row.title,
            lessons: ["bass_level_" + row.num]
          };
        })
      };
    };
    mod.selectChartId = selectChartId;

    var originalGetRhythmAdapter = mod.getRhythmAdapter;
    mod.getRhythmAdapter = function() {
      var adapter = typeof originalGetRhythmAdapter === "function" ? originalGetRhythmAdapter.call(mod) : null;
      if (!adapter || typeof adapter.createPayload !== "function") return adapter;
      var originalCreatePayload = adapter.createPayload;
      adapter.createPayload = function(context) {
        context = context || {};
        var lessonId = context.curriculum && context.curriculum.nextLessonId;
        var skill = lessonSkill(lessonId);
        context.segment = context.segment || { meta: {} };
        context.segment.meta = context.segment.meta || {};
        if (!context.segment.meta.skill) context.segment.meta.skill = skill;
        return originalCreatePayload.call(adapter, context);
      };
      return adapter;
    };
  }

  patchBassModule();
  window.SparkBassCurriculumIntegration = { patch: patchBassModule, selectChartId: selectChartId };
})();
