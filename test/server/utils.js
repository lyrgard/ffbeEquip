const nock = require('nock');
const mock = require('mock-require');

const testConfig = {
  port: 3000,
  env: 'test',
  secret: 'secret',
  googleApiKey: 'test',
  googleOAuthCredential: {
    web: {
      client_id: 'test',
      client_secret: 'test',
      redirect_uris: ['http://localhost/test'],
    },
  },
  isDev: false,
  isProd: false,
};

mock('../../config.js', testConfig);
module.exports.config = testConfig;

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
