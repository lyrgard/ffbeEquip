const path = require('path');
const fs = require('fs');
const cssnano = require('cssnano');
const glob = require('glob');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const StringReplacePlugin = require("string-replace-webpack-plugin");
const md5File = require('md5-file');

var existingHashes = {};
const addFileHash = function (match, p1, p2, offset, string) {
  // Get current base path 
  var current_base_path = path.dirname(this.resource.split('?')[0]);
  // Get targeted file
  var target_file_path = path.normalize(path.join(current_base_path, p2));
  if (fs.existsSync(target_file_path)) {
    // Check if we already have its hash
    if (!existingHashes[target_file_path]) {
      // Compute md5 on file and keep only the first 8 chars
      existingHashes[target_file_path] = md5File.sync(target_file_path).slice(0, 8);
    }
    // Replace by its hash
    return match + '?' + existingHashes[target_file_path];
  }
  console.warn(`File not found for hashing: ${target_file_path}`);
  return match;
};

const addTimeStamp = function (match, p1, p2, offset, string) {
  // Get current base path 
  var current_base_path = path.dirname(this.resource.split('?')[0]);
  // Get targeted file
  var target_file_path = path.normalize(path.join(current_base_path, p2));
  if (fs.existsSync(target_file_path)) {
    // Add timestamp
    return match + '?' + Date.now();
  }
  console.warn(`File not found for hashing: ${target_file_path}`);
  return match;
};


module.exports = {
  entry: {
    // Check all html files
    app: glob.sync('./static/*.html'),
    // Force to check web worker (because not loaded by HTML file)
    worker: './static/builder/optimizerWebWorker.js',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          { loader: 'file-loader', options: { name: '[path][name].[ext]', context: './static/' } },
          { loader: 'extract-loader', options: {} },
          { loader: 'html-loader', options: { attrs: ['link:href', 'script:src'], minimize: true } },
        ],
      },
      {
        test: /\.(png|jpg)$/,
        use: [
          { loader: 'file-loader', options: { name: '[path][name].[ext]', context: './static/', emitFile: false } },
        ],
      },
      {
        test: /\.(css)$/,
        use: [
          { loader: 'file-loader', options: { name: '[path][name].[ext]?[hash:8]', context: './static/' } },
          { loader: 'postcss-loader', options: { plugins: [cssnano()] } },
        ],
      },
      {
        test: /\.js$/,
        use: [
          { loader: 'file-loader', options: { name: '[path][name].[ext]?[hash:8]', context: './static/' } },
        ],
      },
      {
        test: /\.js$/,
        exclude: /\.min.js$/,
        use: [
          { loader: 'babel-loader', options: { presets: ['minify'] } },
          {
            loader: StringReplacePlugin.replace({
              replacements: [
                { pattern: /importScripts *\(('|")([^'|"|?]+)/ig, replacement: addFileHash },
                { pattern: /new +Worker *\(('|")([^'|"|?]+)/ig, replacement: addTimeStamp }
              ]}),
          }
        ],
      },
    ],
  },
  output: {
    path: `${__dirname}/dist`,
    publicPath: '',
    filename: '_[name].js',
  },
  plugins: [
    new CleanWebpackPlugin('dist'),
    new StringReplacePlugin(),
  ],
};
