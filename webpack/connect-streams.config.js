const webpack = require('webpack');
const path = require('path');
const { commonConfig } = require('./common');


const config = Object.assign({}, commonConfig, {
  entry: [
    "./src/aws-client.js",
    "./src/sprintf.js",
    "./src/log.js", 
    "./src/util.js",
    "./src/event.js",
    "./src/streams.js",
    "./src/client.js",
    "./src/transitions.js",
    "./src/api.js",
    "./src/lib/amazon-connect-websocket-manager.js",
    "./src/core.js",
    "./src/ringtone.js",
    "./src/softphone.js",
    "./src/worker.js",
    "./src/mediaControllers/chat.js",
    "./src/mediaControllers/factory.js",
    "./src/mediaControllers/softphone.js",
    "./src/mediaControllers/task.js",
    "./src/agent-app/agent-app.js",
    "./src/agent-app/app-registry.js"
  ],
  output: {
    path: path.resolve(__dirname, '../release'),
    filename: 'connect-streams.js'	
  },
  optimization: {
    minimize: false
  }
});

module.exports = [
  config
]