const { URL } = require('url');
const Joi = require('joi');
const express = require('express');
const validator = require('../middlewares/validator.js');
const shortener = require('../lib/shortener.js');

const route = express.Router();

/**
 * "GET /:shortId"
 */
const getSchema = Joi.object({
  shortId: Joi.string().required(),
});
route.get('/:shortId', validator.params(getSchema), async (req, res) => {
  const { shortId } = req.params;
  const shortUrl = `https://goo.gl/${shortId}`;
  const longUrl = await shortener.get(shortUrl);

  return res.redirect(longUrl);
});

/**
 * "POST /"
 */
const insertSchema = Joi.object({
  url: Joi.string().uri().required(),
});
route.post('/', validator.body(insertSchema), async (req, res) => {
  const { url: longUrl } = req.body;
  const shortUrl = await shortener.insert(longUrl);

  const parsedLongUrl = new URL(longUrl);
  const parsedShortUrl = new URL(shortUrl);

  parsedShortUrl.pathname = `/links${parsedShortUrl.pathname}`;
  parsedShortUrl.protocol = parsedLongUrl.protocol;
  parsedShortUrl.host = parsedLongUrl.host;

  return res.status(200).json({
    url: parsedShortUrl.href,
  });
});

module.exports = route;
