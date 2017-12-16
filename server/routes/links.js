const { URL } = require('url');
const shortener = require('../lib/shortener.js');

const insert = async (req, res) => {
  const longUrl = req.body.url;
  const shortUrl = await shortener.insert(longUrl);
  const parsedUrl = new URL(shortUrl);

  parsedUrl.protocol = 'http';
  parsedUrl.host = 'ffbeEquip.lyrgard.fr';

  return res.status(200).json({
    url: parsedUrl.href,
  });
};

const get = async (req, res) => {
  const shortId = req.params.shortId;
  const shortUrl = `https://goo.gl/${shortId}`;
  const longUrl = await shortener.get(shortUrl);

  return res.redirect(longUrl);
};

module.exports = {
  insert,
  get,
};
