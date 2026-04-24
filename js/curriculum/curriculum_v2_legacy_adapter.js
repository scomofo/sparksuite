(function() {
  function toLegacyLessons(instrument) {
    var service = window.SparkCurriculumV2;
    var track;
    var sessions;
    var lessons = [];
    var i;
    var session;
    if (!service || typeof service.getTrack !== "function") return lessons;
    track = service.getTrack(instrument);
    if (!track || !Array.isArray(track.sessions)) return lessons;
    sessions = track.sessions;
    for (i = 0; i < sessions.length; i++) {
      session = sessions[i];
      lessons.push({
        id: session.id,
        num: session.day,
        title: session.title,
        skill: Array.isArray(session.new_elements) && session.new_elements.length ? session.new_elements[0] : "review",
        prerequisites: Array.isArray(session.prerequisites) ? session.prerequisites.slice() : [],
        masteryRequired: 0,
        sessions: String(session.day),
        desc: session.focus_song ? ("Song focus: " + session.focus_song) : "",
        songs: session.focus_song ? [session.focus_song] : [],
        blocks: Array.isArray(session.blocks) ? session.blocks.slice() : [],
        completion: session.completion_criteria || null,
        source: "curriculum-v2"
      });
    }
    return lessons;
  }

  window.SparkCurriculumV2LegacyAdapter = {
    toLegacyLessons: toLegacyLessons
  };
})();
