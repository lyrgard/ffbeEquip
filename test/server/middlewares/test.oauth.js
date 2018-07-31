const assert = require('assert');
const request = require('supertest');
const express = require('express');
const sessions = require('client-sessions');
const authRequired = require('../../../server/middlewares/oauth.js');

describe('middlewares.oauth', () => {
  const app = express();
  const agent = request.agent(app);
  const fixtureToken = {
    access_token: 'TEST_TOKEN',
    token_type: 'Bearer',
  };

  // Middleware
  app.use(sessions({
    cookieName: 'OAuthSession',
    secret: 'yo',
  }));

  // Routes
  app.get('/secure', authRequired, (req, res) => {
    const { tokens } = req.OAuthSession;
    return res.status(200).send(tokens);
  });
  app.get('/authenticate', (req, res) => {
    req.OAuthSession.tokens = fixtureToken;
    return res.status(200).send();
  });

  it('.unauthorized', (done) => {
    request(app)
      .get('/secure')
      .expect(401, done);
  });

  it('.authenticate', (done) => {
    agent
      .get('/authenticate')
      .expect((res) => {
        assert.equal(res.headers['set-cookie'].length, 1);
      })
      .end(done);
  });

  it('.authorized', (done) => {
    agent
      .get('/secure')
      .expect(200, JSON.stringify(fixtureToken), done);
  });
});
