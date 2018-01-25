const nock = require('nock');
const mock = require('mock-require');

const testConfig = {
  port: 3000,
  env: 'test',
  secret: 'test_secret',
  googleApiKey: 'test_api_key',
  googleOAuthCredential: {
    web: {
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
      redirect_uris: ['http://localhost/test-redirect-uri'],
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
    .post('/urlshortener/v1/url', { longUrl }).query({ key: testConfig.googleApiKey })
    .reply(201, res);
  nock('https://www.googleapis.com')
    .get('/urlshortener/v1/url').query({ shortUrl: id, key: testConfig.googleApiKey })
    .reply(200, res);
};
