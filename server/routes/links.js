const { URL } = require('url');
const shortener = require('../lib/shortener.js');

const insert = async (req, res) => {
  const longUrl = req.body.url;
  const shortUrl = await shortener.insert(longUrl);

  const parsedLongUrl = new URL(longUrl);
  const parsedShortUrl = new URL(shortUrl);

  parsedShortUrl.protocol = parsedLongUrl.protocol;
  parsedShortUrl.host = parsedLongUrl.host;

  return res.status(200).json({
    url: parsedShortUrl.href,
  });
};

const get = async (req, res) => {
  const { shortId } = req.params;
  const shortUrl = `https://goo.gl/${shortId}`;
  const longUrl = await shortener.get(shortUrl);

  return res.redirect(longUrl);
};

module.exports = {
  insert,
  get,
};
