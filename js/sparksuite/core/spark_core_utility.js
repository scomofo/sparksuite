/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Utility screens: settings, MIDI, cloud, curriculum, skill tree, stem player
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.openUtilityScreen = function(target) {
    var activeScreen = "home";
    if (target === "settings") activeScreen = "settings";
    else if (target === "curriculum") activeScreen = "curriculum";
    else if (target === "cloud_settings") activeScreen = "cloud_settings";
    else if (target === "midi_settings") activeScreen = "midi_settings";
    else if (target === "midi_import") activeScreen = "midi_import";
    return this.updateRuntimeState({
      activeScreen: activeScreen,
      activeTab: this.runtimeState.activeTab || null
    });
  };

  SparkCore.prototype.syncSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      settingsTheme: Object.prototype.hasOwnProperty.call(options, "theme")
        ? options.theme
        : this.runtimeState.settingsTheme
    });
  };

  SparkCore.prototype.syncMidiSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      midiEnabled: Object.prototype.hasOwnProperty.call(options, "midiEnabled")
        ? !!options.midiEnabled
        : this.runtimeState.midiEnabled,
      midiActiveDeviceId: Object.prototype.hasOwnProperty.call(options, "activeDeviceId")
        ? options.activeDeviceId
        : this.runtimeState.midiActiveDeviceId,
      midiActiveDeviceName: Object.prototype.hasOwnProperty.call(options, "activeDeviceName")
        ? options.activeDeviceName
        : this.runtimeState.midiActiveDeviceName,
      midiActiveProfileId: Object.prototype.hasOwnProperty.call(options, "activeProfileId")
        ? options.activeProfileId
        : this.runtimeState.midiActiveProfileId,
      midiActiveProfileName: Object.prototype.hasOwnProperty.call(options, "activeProfileName")
        ? options.activeProfileName
        : this.runtimeState.midiActiveProfileName,
      midiDeviceOptions: Object.prototype.hasOwnProperty.call(options, "deviceOptions")
        ? this.cloneValue(options.deviceOptions || [])
        : this.cloneValue(this.runtimeState.midiDeviceOptions || []),
      midiProfileOptions: Object.prototype.hasOwnProperty.call(options, "profileOptions")
        ? this.cloneValue(options.profileOptions || [])
        : this.cloneValue(this.runtimeState.midiProfileOptions || [])
    });
  };

  SparkCore.prototype.syncMidiImportState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      midiImportSummary: Object.prototype.hasOwnProperty.call(options, "summary")
        ? this.cloneValue(options.summary || null)
        : this.cloneValue(this.runtimeState.midiImportSummary),
      midiImportAssignments: Object.prototype.hasOwnProperty.call(options, "assignments")
        ? this.cloneValue(options.assignments || {})
        : this.cloneValue(this.runtimeState.midiImportAssignments || {}),
      midiImportSeedMode: Object.prototype.hasOwnProperty.call(options, "seedMode")
        ? options.seedMode
        : this.runtimeState.midiImportSeedMode,
      midiImportSeedTitle: Object.prototype.hasOwnProperty.call(options, "seedTitle")
        ? options.seedTitle
        : this.runtimeState.midiImportSeedTitle
    });
  };

  SparkCore.prototype.syncCloudSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      cloudLoggedIn: Object.prototype.hasOwnProperty.call(options, "loggedIn")
        ? !!options.loggedIn
        : this.runtimeState.cloudLoggedIn,
      cloudEmail: Object.prototype.hasOwnProperty.call(options, "email")
        ? options.email
        : this.runtimeState.cloudEmail,
      cloudLastSyncStatus: Object.prototype.hasOwnProperty.call(options, "lastSyncStatus")
        ? options.lastSyncStatus
        : this.runtimeState.cloudLastSyncStatus,
      cloudLastSyncAt: Object.prototype.hasOwnProperty.call(options, "lastSyncAt")
        ? options.lastSyncAt
        : this.runtimeState.cloudLastSyncAt
    });
  };

  SparkCore.prototype.openCloudSettings = function(options) {
    options = options || {};
    this.openUtilityScreen("cloud_settings");
    return this.syncCloudSettingsState(options);
  };

  SparkCore.prototype.applyCloudWorkflowRequest = function(action, options) {
    options = options || {};
    if (action === "open") {
      return this.openCloudSettings(options);
    }
    if (action === "login" || action === "logout") {
      return this.syncCloudSettingsState(options);
    }
    if (action === "sync_start" || action === "pull_start") {
      return this.syncCloudSettingsState({
        loggedIn: Object.prototype.hasOwnProperty.call(options, "loggedIn") ? options.loggedIn : this.runtimeState.cloudLoggedIn,
        email: Object.prototype.hasOwnProperty.call(options, "email") ? options.email : this.runtimeState.cloudEmail,
        lastSyncStatus: options.lastSyncStatus || "syncing",
        lastSyncAt: Object.prototype.hasOwnProperty.call(options, "lastSyncAt") ? options.lastSyncAt : this.runtimeState.cloudLastSyncAt
      });
    }
    if (action === "sync_done" || action === "pull_done" || action === "sync_error" || action === "pull_error") {
      return this.syncCloudSettingsState(options);
    }
    return this.syncCloudSettingsState(options);
  };

  SparkCore.prototype.syncCurriculumState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      curriculumSummaries: Object.prototype.hasOwnProperty.call(options, "curriculums")
        ? this.cloneValue(options.curriculums || [])
        : this.cloneValue(this.runtimeState.curriculumSummaries || []),
      curriculumPackSummaries: Object.prototype.hasOwnProperty.call(options, "packs")
        ? this.cloneValue(options.packs || [])
        : this.cloneValue(this.runtimeState.curriculumPackSummaries || [])
    });
  };

  SparkCore.prototype.applyCurriculumWorkflowRequest = function(action, options) {
    options = options || {};
    if (action === "curriculum_load_start") {
      return this.updateRuntimeState({
        curriculumLoading: true,
        curriculumLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.curriculumLastManifestPath,
        curriculumLastLoadStatus: "loading"
      });
    }
    if (action === "curriculum_load_done" || action === "curriculum_load_error") {
      return this.updateRuntimeState({
        curriculumLoading: false,
        curriculumLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.curriculumLastManifestPath,
        curriculumLastLoadStatus: options.status || (action === "curriculum_load_done" ? "ok" : "error")
      });
    }
    if (action === "content_load_start") {
      return this.updateRuntimeState({
        contentLoading: true,
        contentLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.contentLastManifestPath,
        contentLastLoadStatus: "loading"
      });
    }
    if (action === "content_load_done" || action === "content_load_error") {
      return this.updateRuntimeState({
        contentLoading: false,
        contentLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.contentLastManifestPath,
        contentLastLoadStatus: options.status || (action === "content_load_done" ? "ok" : "error")
      });
    }
    return this.updateRuntimeState({});
  };

  SparkCore.prototype.openSkillTree = function() {
    return this.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: this.runtimeState.activeTab || null,
      skillTreeFocus: this.runtimeState.skillTreeFocus || "overview"
    });
  };

  SparkCore.prototype.setSkillTreeFocus = function(focus) {
    return this.updateRuntimeState({
      activeScreen: this.runtimeState.activeScreen || "skill_tree",
      activeTab: this.runtimeState.activeTab || null,
      skillTreeFocus: focus || "overview"
    });
  };

  SparkCore.prototype.openStemPlayer = function() {
    return this.updateRuntimeState({
      activeScreen: "stems",
      activeTab: "songs",
      songsSubTab: "stems"
    });
  };

  SparkCore.prototype.closeStemPlayer = function() {
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      songsSubTab: "stems",
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromUtilityFamily = function(options) {
    options = options || {};
    var currentScreen = options.currentScreen || this.runtimeState.activeScreen || "home";
    var isUtilityFamily = currentScreen === "settings"
      || currentScreen === "curriculum"
      || currentScreen === "cloud_settings"
      || currentScreen === "midi_settings"
      || currentScreen === "midi_import";
    if (isUtilityFamily) {
      return this.updateRuntimeState({
        activeScreen: "home",
        activeTab: this.runtimeState.activeTab || null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    return this.getRuntimeState();
  };
})();
