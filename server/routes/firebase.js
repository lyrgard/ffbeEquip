const express = require('express');
const firebase = require('../lib/firebase.js');
const Joi = require('joi');
const uuidV1 = require('uuid/v1');

const route = express.Router();

route.post('/:server/partyBuild', async (req, res) => {
  const { server } = req.params;
  const data = req.body;

  var fileName = uuidV1();
  var file = firebase.file("PartyBuilds/" + fileName); 
  await file.save(JSON.stringify(data), {"contentType":"application/json"});

  return res.status(200).json({"id" : fileName});
});

module.exports = route;
