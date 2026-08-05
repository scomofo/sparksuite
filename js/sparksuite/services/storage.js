// js/sparksuite/services/storage.js
(function() {

  var STORAGE_KEY = "spark_suite_profile";

  var SparkStorage = {
    save: function(profile) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.error("SparkStorage: save failed", e);
      }
    },

    load: function() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return SparkProfile.createEmpty();
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return SparkProfile.createEmpty();
        SparkProfile.migrate(parsed);
        return parsed;
      } catch (e) {
        console.error("SparkStorage: load failed", e);
        return SparkProfile.createEmpty();
      }
    },

    clear: function() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  };

  window.SparkStorage = SparkStorage;
})();
