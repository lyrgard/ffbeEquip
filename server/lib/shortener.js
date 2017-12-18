const Promise = require('bluebird');
const google = require('googleapis');
const config = require('../config.js');

const urlshortener = google.urlshortener('v1');
const key = config.googleApiKey;

/**
 * @summary Shorten a long url
 * @param {String} longUrl - url
 * @returns {Promise<String>}
 */
const insert = (longUrl) => {
  return Promise
    .fromCallback(cb => urlshortener.url.insert({ key, resource: { longUrl } }, cb))
    .then(res => res.id);
}

/**
 * @summary Return matching long url
 * @param {String} shortUrl - goo.gl short url
 * @returns {Promise<String>}
 */
const get = (shortUrl) => {
  return Promise
    .fromCallback(cb => urlshortener.url.get({ key, shortUrl }, cb))
    .then(res => res.longUrl);
}

module.exports = {
  insert,
  get,
};
