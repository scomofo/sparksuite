(function() {
  function uniqueIds(items, label) {
    var seen = {};
    var errors = [];
    var i;
    var id;
    for (i = 0; i < items.length; i++) {
      id = items[i] && items[i].id;
      if (!id) {
        errors.push(label + " missing id at index " + i);
        continue;
      }
      if (seen[id]) errors.push(label + ' duplicate id "' + id + '"');
      seen[id] = true;
    }
    return errors;
  }

  function validateInstrumentContent(content) {
    content = content || {};
    var instrument = content.instrument || {};
    var skills = Array.isArray(content.skills) ? content.skills : [];
    var lessons = Array.isArray(content.lessons) ? content.lessons : [];
    var chords = Array.isArray(content.chords) ? content.chords : [];
    var exercises = Array.isArray(content.exercises) ? content.exercises : [];
    var songs = Array.isArray(content.songs) ? content.songs : [];
    var errors = [];
    var skillIds = {};
    var chordIds = {};
    var i;
    var j;

    if (!instrument.id) errors.push("instrument.id is required");
    if (!instrument.name) errors.push("instrument.name is required");
    if (!instrument.tuning || !Array.isArray(instrument.tuning.strings)) errors.push("instrument.tuning.strings must be an array");
    if (!instrument.capabilities || typeof instrument.capabilities !== "object") errors.push("instrument.capabilities is required");

    errors = errors.concat(uniqueIds(skills, "skill"));
    errors = errors.concat(uniqueIds(lessons, "lesson"));
    errors = errors.concat(uniqueIds(chords, "chord"));
    errors = errors.concat(uniqueIds(exercises, "exercise"));
    errors = errors.concat(uniqueIds(songs, "song"));

    for (i = 0; i < skills.length; i++) {
      if (skills[i] && skills[i].id) skillIds[skills[i].id] = true;
    }
    for (i = 0; i < chords.length; i++) {
      if (chords[i] && chords[i].id) chordIds[chords[i].id] = true;
    }

    for (i = 0; i < lessons.length; i++) {
      if (!skillIds[lessons[i].skill]) {
        errors.push('lesson "' + lessons[i].id + '" references missing skill "' + lessons[i].skill + '"');
      }
      for (j = 0; j < (lessons[i].prerequisites || []).length; j++) {
        if (!skillIds[lessons[i].prerequisites[j]]) {
          errors.push('lesson "' + lessons[i].id + '" references missing prerequisite "' + lessons[i].prerequisites[j] + '"');
        }
      }
    }

    for (i = 0; i < exercises.length; i++) {
      if (!skillIds[exercises[i].skillId]) {
        errors.push('exercise "' + exercises[i].id + '" references missing skill "' + exercises[i].skillId + '"');
      }
      if (Array.isArray(exercises[i].chordIds)) {
        for (j = 0; j < exercises[i].chordIds.length; j++) {
          if (!chordIds[exercises[i].chordIds[j]]) {
            errors.push('exercise "' + exercises[i].id + '" references missing chord "' + exercises[i].chordIds[j] + '"');
          }
        }
      }
      if (Array.isArray(exercises[i].lanes)) {
        for (j = 0; j < exercises[i].lanes.length; j++) {
          if (typeof exercises[i].lanes[j] !== "number" || exercises[i].lanes[j] < 0) {
            errors.push('exercise "' + exercises[i].id + '" has invalid lane "' + exercises[i].lanes[j] + '"');
          }
        }
      }
    }

    for (i = 0; i < songs.length; i++) {
      if (songs[i].skillId && !skillIds[songs[i].skillId]) {
        errors.push('song "' + songs[i].id + '" references missing skill "' + songs[i].skillId + '"');
      }
      if (Array.isArray(songs[i].chordIds)) {
        for (j = 0; j < songs[i].chordIds.length; j++) {
          if (!chordIds[songs[i].chordIds[j]]) {
            errors.push('song "' + songs[i].id + '" references missing chord "' + songs[i].chordIds[j] + '"');
          }
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors: errors,
      counts: {
        skills: skills.length,
        lessons: lessons.length,
        chords: chords.length,
        exercises: exercises.length,
        songs: songs.length
      }
    };
  }

  if (typeof window !== "undefined") {
    window.validateInstrumentContent = validateInstrumentContent;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      validateInstrumentContent: validateInstrumentContent
    };
  }
})();
