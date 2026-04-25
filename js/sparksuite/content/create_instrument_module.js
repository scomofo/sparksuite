(function() {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createInstrumentModule(content) {
    content = content || {};
    var instrument = content.instrument || {};
    var skills = Array.isArray(content.skills) ? content.skills.slice() : [];
    var lessons = Array.isArray(content.lessons) ? content.lessons.slice() : [];
    var chords = Array.isArray(content.chords) ? content.chords.slice() : [];
    var exercises = Array.isArray(content.exercises) ? content.exercises.slice() : [];
    var songs = Array.isArray(content.songs) ? content.songs.slice() : [];

    return {
      id: instrument.id,
      name: instrument.name,
      getId: function() {
        return instrument.id;
      },
      getType: function() {
        return instrument.id;
      },
      getSkillTree: function() {
        return skills.map(function(skill) { return clone(skill); });
      },
      getCurriculumMap: function() {
        return lessons.map(function(lesson) { return clone(lesson); });
      },
      getLessons: function() {
        return lessons.map(function(lesson) { return clone(lesson); });
      },
      getExercises: function(skillId) {
        return exercises.filter(function(exercise) {
          return !skillId || exercise.skillId === skillId;
        }).map(function(exercise) {
          return clone(exercise);
        });
      },
      getSongs: function() {
        return songs.map(function(song) { return clone(song); });
      },
      getChords: function() {
        return chords.map(function(chord) { return clone(chord); });
      },
      getTuning: function() {
        return clone(instrument.tuning || {});
      },
      getCapabilities: function() {
        return clone(instrument.capabilities || {});
      }
    };
  }

  if (typeof window !== "undefined") {
    window.createInstrumentModule = createInstrumentModule;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      createInstrumentModule: createInstrumentModule
    };
  }
})();
