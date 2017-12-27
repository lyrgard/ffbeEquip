const assert = require('power-assert');
const utils = require('../utils.js');

const shortener = require('../../../server/lib/shortener.js');

const LONG_URL = 'http://example.com/long/url';
const SHORT_URL = 'https://goo.gl/example';

describe('lib.shortener', () => {
  before(() => {
    utils.mockGoogleShortener(LONG_URL, SHORT_URL);
  });

  it('.insert', (done) => {
    shortener.insert(LONG_URL).then((shortUrl) => {
      assert.equal(shortUrl, SHORT_URL);
      done();
    });
  });

  it('.get', (done) => {
    shortener.get(SHORT_URL)
      .then((longUrl) => {
        assert.equal(longUrl, LONG_URL);
        done();
      });
  });
});
