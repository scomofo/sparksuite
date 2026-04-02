// js/spark-core/content-schema.js
(function() {

  var SparkContent = {
    validate: function(content) {
      var errors = [];
      if (!content) return { valid: false, errors: ["Content is null"] };
      if (!content.appId) errors.push("Missing appId");
      if (!content.schemaVersion) errors.push("Missing schemaVersion");
      if (!Array.isArray(content.units)) errors.push("Missing units array");
      if (content.units) {
        for (var i = 0; i < content.units.length; i++) {
          var unit = content.units[i];
          if (!unit.id) errors.push("Unit " + i + ": missing id");
          if (!Array.isArray(unit.lessons)) errors.push("Unit " + i + ": missing lessons array");
        }
      }
      return { valid: errors.length === 0, errors: errors };
    }
  };

  window.SparkContent = SparkContent;
})();
