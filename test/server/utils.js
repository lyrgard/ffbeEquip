const nock = require('nock');
const mock = require('mock-require');

const testConfig = {
  port: 3000,
  env: 'test',
  secret: 'test_secret',
  google: {
      oAuthConfiguration: {
          web: {
              client_id: 'test_client_id',
              client_secret: 'test_client_secret',
              redirect_uris: ['http://localhost/test-redirect-uri'],
          },
      },
  },
  isDev: false,
  isProd: false,
};

mock('../../config.js', testConfig);
module.exports.config = testConfig;
