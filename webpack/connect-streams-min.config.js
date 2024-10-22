const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { commonConfig } = require('./common');

const minimizedConfig = Object.assign({}, commonConfig, {
  entry: ['./release/connect-streams.js'],
  output: {
    path: path.resolve(__dirname, '../release'),
    filename: 'connect-streams-min.js',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
});

module.exports = [minimizedConfig];
