(function(){

  function cloudStorageRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function cloudRead(path, fallback){
    var root = cloudStorageRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function cloudWrite(path, value){
    var root = cloudStorageRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function buildCloudSnapshot(){
    return {
      version: 1,
      profile: {
        playerXP: cloudRead("playerXP", 0),
        playerLevel: cloudRead("playerLevel", 1),
        playerAchievements: cloudRead("playerAchievements", {}),
        playerStats: cloudRead("playerStats", {})
      },
      progression: {
        mastery: cloudRead("mastery", {}),
        unlocks: cloudRead("unlocks", {}),
        metaProgress: cloudRead("metaProgress", {})
      },
      practice: {
        practiceHistory: cloudRead("practiceHistory", []),
        practiceStreak: cloudRead("practiceStreak", 0),
        lastPracticeDate: cloudRead("lastPracticeDate", null),
        totalPracticeMinutes: cloudRead("totalPracticeMinutes", 0)
      },
      planning: {
        weeklyPracticePlan: cloudRead("weeklyPracticePlan", null),
        dailyChallenges: cloudRead("dailyChallenges", []),
        weeklyGoals: cloudRead("weeklyGoals", [])
      },
      editor: {
        editorLibrary: cloudRead("performEditorLibrary", []),
        contentLibrary: cloudRead("contentLibrary", {})
      },
      devices: {
        midiProfiles: cloudRead("midiProfiles", {}),
        activeMidiProfileId: cloudRead("activeMidiProfileId", null),
        inputLatencyMs: cloudRead("inputLatencyMs", 0),
        audioLatencyMs: cloudRead("audioLatencyMs", 0)
      },
      settings: {
        midiRoutingMode: cloudRead("midiRoutingMode", "default")
      }
    };
  }

  function applyCloudSnapshot(snapshot){
    if(!snapshot || typeof snapshot !== "object") return false;
    if(snapshot.version !== 1){ console.warn("Cloud snapshot: unknown version", snapshot.version); return false; }
    if(snapshot.profile){
      cloudWrite("playerXP", snapshot.profile.playerXP || 0);
      cloudWrite("playerLevel", snapshot.profile.playerLevel || 1);
      cloudWrite("playerAchievements", snapshot.profile.playerAchievements || {});
      cloudWrite("playerStats", snapshot.profile.playerStats || {});
    }
    if(snapshot.progression){
      cloudWrite("mastery", snapshot.progression.mastery || {});
      cloudWrite("unlocks", snapshot.progression.unlocks || {});
      cloudWrite("metaProgress", snapshot.progression.metaProgress || {});
    }
    if(snapshot.practice){
      cloudWrite("practiceHistory", snapshot.practice.practiceHistory || []);
      cloudWrite("practiceStreak", snapshot.practice.practiceStreak || 0);
      cloudWrite("lastPracticeDate", snapshot.practice.lastPracticeDate || null);
      cloudWrite("totalPracticeMinutes", snapshot.practice.totalPracticeMinutes || 0);
    }
    if(snapshot.planning){
      cloudWrite("weeklyPracticePlan", snapshot.planning.weeklyPracticePlan || null);
      cloudWrite("dailyChallenges", snapshot.planning.dailyChallenges || []);
      cloudWrite("weeklyGoals", snapshot.planning.weeklyGoals || []);
    }
    if(snapshot.editor){
      cloudWrite("performEditorLibrary", snapshot.editor.editorLibrary || []);
      cloudWrite("contentLibrary", snapshot.editor.contentLibrary || {});
    }
    if(snapshot.devices){
      cloudWrite("midiProfiles", snapshot.devices.midiProfiles || {});
      cloudWrite("activeMidiProfileId", snapshot.devices.activeMidiProfileId || null);
      cloudWrite("inputLatencyMs", snapshot.devices.inputLatencyMs || 0);
      cloudWrite("audioLatencyMs", snapshot.devices.audioLatencyMs || 0);
    }
    if(snapshot.settings){
      cloudWrite("midiRoutingMode", snapshot.settings.midiRoutingMode || "default");
    }
    saveState();
    return true;
  }

  function markCloudDirty(key){
    var dirtyKeys = cloudRead(["cloudSync","dirtyKeys"], null);
    if(!dirtyKeys) return;
    if(dirtyKeys.indexOf(key) < 0){
      dirtyKeys.push(key);
    }
    saveState();
  }

  window.buildCloudSnapshot = buildCloudSnapshot;
  window.applyCloudSnapshot = applyCloudSnapshot;
  window.markCloudDirty = markCloudDirty;

})();
