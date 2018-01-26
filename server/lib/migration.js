const fs = require('fs');
const path = require('path');

/* eslint import/no-dynamic-require: 0, global-require: 0 */
const load = (schema) => {
  const dir = path.join(__dirname, `../migrations/${schema}`);
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    files = [];
  }
  return files.sort().map(file => require(path.join(dir, file)));
};

const migrations = {};

const up = (table, data) => {
  if (!migrations[table]) {
    migrations[table] = load(table);
  }

  return migrations[table].reduce((acc, migration) => {
    return migration.up(acc);
  }, data);
};

module.exports = {
  up,
};
