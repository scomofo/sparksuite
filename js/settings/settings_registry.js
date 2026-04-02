(function(){

  window.SparkSettingsRegistry = {
    categories: [
      { id: "general", title: "General" },
      { id: "audio", title: "Audio / MIDI" },
      { id: "practice", title: "Practice" },
      { id: "difficulty", title: "Difficulty" },
      { id: "notifications", title: "Notifications" },
      { id: "display", title: "Display / Theme" },
      { id: "cloud", title: "Cloud Sync" },
      { id: "about", title: "About" },
      { id: "developer", title: "Developer" }
    ]
  };

  function getSettingsCategories(){
    return SparkSettingsRegistry.categories;
  }

  window.getSettingsCategories = getSettingsCategories;

})();
