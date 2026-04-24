(function() {
  function getCatalog() {
    return window.SparkCurriculumV2Data || null;
  }

  function getTrack(instrument) {
    var catalog = getCatalog();
    var tracks;
    var i;
    if (!catalog || !Array.isArray(catalog.tracks)) return null;
    tracks = catalog.tracks;
    for (i = 0; i < tracks.length; i++) {
      if (tracks[i] && tracks[i].instrument === instrument) return tracks[i];
    }
    return null;
  }

  function getCompletedSessionIds(instrument) {
    var state = typeof S !== "undefined" && S ? S : {};
    var scoped = state.curriculumV2CompletedSessions && state.curriculumV2CompletedSessions[instrument];
    if (Array.isArray(scoped)) return scoped.slice();
    return [];
  }

  function getNextSession(instrument) {
    var track = getTrack(instrument);
    var completed;
    var sessions;
    var i;
    if (!track || !Array.isArray(track.sessions)) return null;
    completed = getCompletedSessionIds(instrument);
    sessions = track.sessions;
    for (i = 0; i < sessions.length; i++) {
      if (completed.indexOf(sessions[i].id) === -1) return sessions[i];
    }
    return sessions.length ? sessions[sessions.length - 1] : null;
  }

  function getTrackSummary(instrument) {
    var track = getTrack(instrument);
    var completedCount;
    var nextSession;
    if (!track) return null;
    completedCount = getCompletedSessionIds(instrument).length;
    nextSession = getNextSession(instrument);
    return {
      instrument: instrument,
      title: track.title,
      sessionCount: track.session_count || (Array.isArray(track.sessions) ? track.sessions.length : 0),
      completedCount: completedCount,
      nextSession: nextSession
    };
  }

  window.SparkCurriculumV2 = {
    getCatalog: getCatalog,
    getTrack: getTrack,
    getNextSession: getNextSession,
    getTrackSummary: getTrackSummary
  };
})();
