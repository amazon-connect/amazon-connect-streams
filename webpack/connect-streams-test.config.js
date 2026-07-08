const webpack = require('webpack');
const path = require('path');
const { commonConfig } = require('./common');

// Test build config with istanbul instrumentation for coverage
const config = Object.assign({}, commonConfig, {
  entry: [
    './src/aws-client.js',
    './src/md5.js',
    './src/sprintf.js',
    './src/log.js',
    './src/util.js',
    './src/event.js',
    './src/streams.js',
    './src/client.js',
    './src/transitions.js',
    './src/request-storage-access.js',
    './src/api.js',
    './src/lib/amazon-connect-websocket-manager.js',
    './src/core.js',
    './src/ringtone.js',
    './src/softphone.js',
    './src/voiceEnhancementProvider.js',
    './src/mediaControllers/chat.js',
    './src/mediaControllers/factory.js',
    './src/mediaControllers/softphone.js',
    './src/mediaControllers/task.js',
    './src/worker.js',
    './src/agent-app/agent-app.js',
    './src/agent-app/app-registry.js',
    './src/global-resiliency.js',
  ],
  output: {
    path: path.resolve(__dirname, '../release'),
    filename: 'connect-streams-test.js',
  },
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
  mode: 'development',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version ?? 'live'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        include: path.resolve(__dirname, '../src'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-typescript', '@babel/preset-env'],
            plugins: ['istanbul'],
          },
        },
      },
    ],
  },
});

module.exports = [config];
