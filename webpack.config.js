const cssnano = require('cssnano');
const glob = require('glob');

module.exports = {
  entry: glob.sync('./static/*.html'),
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
        test: /\.(js)$/,
        use: [
          { loader: 'file-loader', options: { name: '[path][name].[ext]?[hash:8]', context: './static/' } },
        ],
      },
      {
        test: /\.(js)$/,
        exclude: /\.min.js$/,
        use: [
          { loader: 'babel-loader', options: { presets: ['minify'] } },
        ],
      },
    ],
  },
  output: {
    path: `${__dirname}/dist`,
    publicPath: '',
    filename: 'app.js',
  },
};
