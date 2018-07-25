const config = require('../../config.js');
const express = require('express');

const route = express.Router();

/**
 * "GET /"
 * Exposes parts of the server config to the client that the client needs
 */
route.get('/', (req, res) => {
  return res.send("window.clientConfig = {firebaseBucketUri:'" + config.firebaseBucketUri + "', firebaseDatabaseId:'" + config.firebaseDatabaseId + "'}");
});

module.exports = route;
