(function() {
  'use strict';

  var WebSocketServer = (typeof require !== 'undefined') ? require('ws').Server : null;

  class SparkSessionServer {
    constructor(options) {
      options = options || {};
      this.port = options.port || 8765;
      this.wss = null;
      this.clients = new Set();
    }

    start() {
      if (!WebSocketServer) {
        throw new Error('SparkSessionServer requires ws module (Node.js/Electron only)');
      }

      this.wss = new WebSocketServer({ port: this.port });
      var self = this;

      this.wss.on('connection', function(ws) {
        self.clients.add(ws);

        ws.on('message', function(message) {
          self.clients.forEach(function(client) {
            if (client !== ws && client.readyState === 1) {
              client.send(message);
            }
          });
        });

        ws.on('close', function() {
          self.clients.delete(ws);
        });
      });
    }

    stop() {
      if (this.wss) {
        this.clients.forEach(function(client) {
          client.close();
        });
        this.clients.clear();
        this.wss.close();
        this.wss = null;
      }
    }
  }

  window.SparkSessionServer = SparkSessionServer;
})();
