(function() {
  'use strict';

  class SparkSessionClient {
    constructor() {
      this.ws = null;
      this._onReceive = null;
    }

    connect(url) {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.ws = new WebSocket(url);

        self.ws.onopen = function() {
          resolve();
        };

        self.ws.onerror = function(err) {
          reject(err);
        };

        self.ws.onmessage = function(event) {
          if (self._onReceive) {
            try {
              var data = JSON.parse(event.data);
              self._onReceive(data);
            } catch (e) {
              self._onReceive(event.data);
            }
          }
        };
      });
    }

    send(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
    }

    onReceive(callback) {
      this._onReceive = callback;
    }

    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }

  window.SparkSessionClient = SparkSessionClient;
})();
