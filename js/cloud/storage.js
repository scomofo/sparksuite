(function(){

  function buildCloudSnapshot(){
    return {
      version: 1,
      profile: {
        playerXP: S.playerXP || 0,
        playerLevel: S.playerLevel || 1,
        playerAchievements: S.playerAchievements || {},
        playerStats: S.playerStats || {}
      },
      progression: {
        mastery: S.mastery || {},
        unlocks: S.unlocks || {},
        metaProgress: S.metaProgress || {}
      },
      practice: {
        practiceHistory: S.practiceHistory || [],
        practiceStreak: S.practiceStreak || 0,
        lastPracticeDate: S.lastPracticeDate || null,
        totalPracticeMinutes: S.totalPracticeMinutes || 0
      },
      planning: {
        weeklyPracticePlan: S.weeklyPracticePlan || null,
        dailyChallenges: S.dailyChallenges || [],
        weeklyGoals: S.weeklyGoals || []
      },
      editor: {
        editorLibrary: S.performEditorLibrary || [],
        contentLibrary: S.contentLibrary || {}
      },
      devices: {
        midiProfiles: S.midiProfiles || {},
        activeMidiProfileId: S.activeMidiProfileId || null,
        inputLatencyMs: S.inputLatencyMs || 0,
        audioLatencyMs: S.audioLatencyMs || 0
      },
      settings: {
        midiRoutingMode: S.midiRoutingMode || "default"
      }
    };
  }

  function applyCloudSnapshot(snapshot){
    if(!snapshot) return false;
    if(snapshot.profile){
      S.playerXP = snapshot.profile.playerXP || 0;
      S.playerLevel = snapshot.profile.playerLevel || 1;
      S.playerAchievements = snapshot.profile.playerAchievements || {};
      S.playerStats = snapshot.profile.playerStats || {};
    }
    if(snapshot.progression){
      S.mastery = snapshot.progression.mastery || {};
      S.unlocks = snapshot.progression.unlocks || {};
      S.metaProgress = snapshot.progression.metaProgress || {};
    }
    if(snapshot.practice){
      S.practiceHistory = snapshot.practice.practiceHistory || [];
      S.practiceStreak = snapshot.practice.practiceStreak || 0;
      S.lastPracticeDate = snapshot.practice.lastPracticeDate || null;
      S.totalPracticeMinutes = snapshot.practice.totalPracticeMinutes || 0;
    }
    if(snapshot.planning){
      S.weeklyPracticePlan = snapshot.planning.weeklyPracticePlan || null;
      S.dailyChallenges = snapshot.planning.dailyChallenges || [];
      S.weeklyGoals = snapshot.planning.weeklyGoals || [];
    }
    if(snapshot.editor){
      S.performEditorLibrary = snapshot.editor.editorLibrary || [];
      S.contentLibrary = snapshot.editor.contentLibrary || {};
    }
    if(snapshot.devices){
      S.midiProfiles = snapshot.devices.midiProfiles || {};
      S.activeMidiProfileId = snapshot.devices.activeMidiProfileId || null;
      S.inputLatencyMs = snapshot.devices.inputLatencyMs || 0;
      S.audioLatencyMs = snapshot.devices.audioLatencyMs || 0;
    }
    if(snapshot.settings){
      S.midiRoutingMode = snapshot.settings.midiRoutingMode || "default";
    }
    saveState();
    return true;
  }

  function markCloudDirty(key){
    if(!S.cloudSync || !S.cloudSync.dirtyKeys) return;
    if(S.cloudSync.dirtyKeys.indexOf(key) < 0){
      S.cloudSync.dirtyKeys.push(key);
    }
    saveState();
  }

  window.buildCloudSnapshot = buildCloudSnapshot;
  window.applyCloudSnapshot = applyCloudSnapshot;
  window.markCloudDirty = markCloudDirty;

})();
