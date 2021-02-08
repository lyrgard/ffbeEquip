const Promise = require('bluebird');
const { google } = require('googleapis');
const config = require('../../config.js');

const urlshortener = google.urlshortener({
  version: 'v1',
  auth: config.google.apiKey,
});

/**
 * @summary Shorten a long url
 * @param {String} longUrl - url
 * @returns {Promise<String>}
 */
const insert = (longUrl) => {
  return Promise
    .fromCallback(cb => urlshortener.url.insert({ resource: { longUrl } }, cb))
    .then(res => res.data.id);
};

/**
 * @summary Return matching long url
 * @param {String} shortUrl - goo.gl short url
 * @returns {Promise<String>}
 */
const get = (shortUrl) => {
  return Promise
    .fromCallback(cb => urlshortener.url.get({ shortUrl }, cb))
    .then(res => res.data.longUrl);
};

module.exports = {
  insert,
  get,
};
