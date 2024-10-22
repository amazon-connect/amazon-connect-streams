const webpack = require('webpack');
const path = require('path');
const ReplacePlugin = require('webpack-plugin-replace');
const fs = require('fs');
const { commonConfig } = require('./common');

const disasterRecoveryConfig = Object.assign({}, commonConfig, {
  entry: [
    './src/sprintf.js',
    './src/md5.js',
    './src/util.js',
    './src/drCoordinator/container',
    './src/drCoordinator/core',
  ],
  plugins: [
    new ReplacePlugin({
      values: {
        INSERT_LATEST_STREAMJS_BASE64_CODE: fs.readFileSync(
          path.resolve(__dirname, '../release/connect-streams-min.js'),
          'base64'
        ),
      },
    }),
    new webpack.ProvidePlugin({
      _cloneDeep: 'lodash.clonedeep',
    }),
  ],
  output: {
    path: path.resolve(__dirname, '../release'),
    filename: 'connect-streams-dr.js',
  },
  optimization: {
    minimize: false,
  },
});

module.exports = [disasterRecoveryConfig];
