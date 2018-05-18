const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals')

const debug = process.env.NODE_ENV !== 'production';

module.exports = {
  context: __dirname,
  entry: [ './src/index.js' ],
  output: {
    path: path.join(__dirname, 'dist', 'src'),
    filename: 'index.js',
    libraryTarget: 'commonjs'
  },
  devtool: debug ? 'source-map' : false,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
            compact: !debug
          }
        }
      }
    ],
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: [nodeExternals({
    whitelist: ['browserless', '@browserless/aws-lambda-chrome']
  })]
};
