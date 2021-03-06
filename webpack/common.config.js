const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const appConfig = require('../config')


module.exports = {
  node: {
    __filename: true,
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.worker.js$/,
        exclude: /node_modules/,
        loaders: 'worker-loader',
      },
      {
        test: /\.(png|jpg|gif)$/,
        exclude: /node_modules/,
        use: 'file-loader',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin([path.resolve(__dirname, '../build')], { allowExternal: true }),
    new HTMLWebpackPlugin({
      title: appConfig.title,
      template: path.resolve(__dirname, '../src/index.html'),
      filename: path.resolve(__dirname, '../build/index.html'),
    }),
    new webpack.DefinePlugin({
      __REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
}
