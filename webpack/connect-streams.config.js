const webpack = require('webpack');
const path = require('path');
const { commonConfig } = require('./common');

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
    './src/worker.js',
    './src/mediaControllers/chat.js',
    './src/mediaControllers/factory.js',
    './src/mediaControllers/softphone.js',
    './src/mediaControllers/task.js',
    './src/agent-app/agent-app.js',
    './src/agent-app/app-registry.js',
    './src/global-resiliency.js',
  ],
  output: {
    path: path.resolve(__dirname, '../release'),
    filename: 'connect-streams.js',
    clean: true,
  },
  optimization: {
    minimize: false,
  },
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
          },
        },
      },
    ],
  },
});

module.exports = [config];
