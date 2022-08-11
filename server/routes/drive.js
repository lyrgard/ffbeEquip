import express from 'express'
import * as drive from '../lib/drive.js';
import * as migration from '../lib/migration.js';

const DB_VERSION = 3;

export const route = express.Router();

const userDataFiles = ["units", "itemInventory", "espers", "settings"];

route.get('/:server/userData', async (req, res) => {
  const { server } = req.params;
  const auth = req.OAuth2Client;

  let result = {};
  const promises = userDataFiles.map(f => drive.readJson(auth, `${f}_${server}.json`, {}));
  await Promise.all(promises).then(results => results.forEach((data, i) => {
      if (data.version < DB_VERSION) {
        data = migration.up(userDataFiles[i], data);
      }
      console.log(userDataFiles[i]);
      result[userDataFiles[i]] = data;
  }));
  
  return res.status(200).json(result);
});

route.get('/:server/:table', async (req, res) => {
  const { server, table } = req.params;
  const auth = req.OAuth2Client;

  let db = await drive.readJson(auth, `${table}_${server}.json`, {});
  if (db.version < DB_VERSION) {
    db = migration.up(table, db);
  }

  return res.status(200).json(db);
});


route.put('/:server/:table', async (req, res) => {
  const { server, table } = req.params;
  const auth = req.OAuth2Client;

  const data = req.body;

  await drive.writeJson(auth, `${table}_${server}.json`, data);

  return res.status(200).json(data);
});



export default route
