const nock = require('nock');

module.exports.mockGoogleShortener = (longUrl, id) => {
  const res = () => ({
    kind: 'urlshortener#url',
    id,
    longUrl,
  });
  nock('https://www.googleapis.com')
    .post('/urlshortener/v1/url', () => true).query(true)
    .reply(201, res);
  nock('https://www.googleapis.com')
    .get('/urlshortener/v1/url').query(true)
    .reply(200, res);
};
