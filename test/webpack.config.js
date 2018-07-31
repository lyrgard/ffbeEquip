const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  target: 'node', // webpack should compile node compatible code
  externals: [
    nodeExternals(), // in order to ignore all modules in node_modules folder
  ],
};
