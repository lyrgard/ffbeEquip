const express = require('express');
const drive = require('../lib/drive.js');
const migration = require('../lib/migration.js');

const DB_VERSION = 3;

const route = express.Router();

route.get('/:server/:table', async (req, res) => {
  const { server, table } = req.params;
  const auth = req.OAuth2Client;

  let db = await drive.readJson(auth, `${table}_${server}.json`, {});
  if (db.version !== DB_VERSION) {
    db = migration.up(table, db);
  }

  return res.status(200).json(db);
});

route.put('/:server/:table', async (req, res) => {
  const { server, table } = req.params;
  const auth = req.OAuth2Client;

  const data = req.body;
  data.version = DB_VERSION;

  await drive.writeJson(auth, `${table}_${server}.json`, data);

  return res.status(200).json(data);
});

module.exports = route;
