const assert = require('power-assert');
const nock = require('nock');

const shortener = require('../../server/lib/shortener.js');

const LONG_URL = 'http://example.com/long/url';
const SHORT_URL = 'https://goo.gl/example';

describe('shortener', () => {
  it('.insert', (done) => {
    nock('https://www.googleapis.com')
      .post('/urlshortener/v1/url', { longUrl: LONG_URL }).query(true)
      .reply(200, { kind: 'urlshortener#url', id: SHORT_URL, longUrl: LONG_URL });

    shortener.insert(LONG_URL)
      .then((shortUrl) => {
        assert.equal(shortUrl, SHORT_URL);
        done();
      });
  });

  it('.get', (done) => {
    nock('https://www.googleapis.com')
      .get('/urlshortener/v1/url').query(true)
      .reply(200, { kind: 'urlshortener#url', id: SHORT_URL, longUrl: LONG_URL });

    shortener.get(SHORT_URL)
      .then((longUrl) => {
        assert.equal(longUrl, LONG_URL);
        done();
      });
  });
});
