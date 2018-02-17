const { URL } = require('url');
const assert = require('power-assert');
const request = require('supertest');
const express = require('express');
const utils = require('../utils.js');

const oauth = require('../../../server/routes/oauth.js');

describe('routes.oauth', () => {
  const app = express();
  app.use('/', oauth);

  it('.oauth url', (done) => {
    request(app)
      .get('/googleOAuthUrl')
      .expect(200)
      .expect((res) => {
        const authUrl = new URL(res.body.url);
        assert.equal(authUrl.searchParams.get('client_id'), utils.config.googleOAuthCredential.web.client_id);
        assert.equal(authUrl.searchParams.get('prompt'), 'select_account');
      })
      .end(done);
  });
});
