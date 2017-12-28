const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const utils = require('../utils.js');
const links = require('../../../server/routes/links.js');
const boom = require('../../../server/middlewares/boom.js');

const LONG_URL = 'http://ffbeequip.lyrgard.fr/builder.html#eyJnb2FsIjoicGh5';
const SHORT_URL = 'https://goo.gl/example';

describe('routes.links', () => {
  const app = express();
  app.use(bodyParser.json());
  app.use('/links', links);
  app.use(boom);

  before(() => {
    utils.mockGoogleShortener(LONG_URL, SHORT_URL);
  });

  it('.insert', (done) => {
    request(app)
      .post('/links')
      .send({ url: LONG_URL })
      .expect(200, {
        url: 'http://ffbeequip.lyrgard.fr/links/example',
      }, done);
  });

  it('.insert missing param', (done) => {
    request(app)
      .post('/links')
      .send({ missing: 'property' })
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Error validating request body. "url" is required.',
      }, done);
  });

  it('.insert param validation', (done) => {
    request(app)
      .post('/links')
      .send({ url: 'not an url' })
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Error validating request body. "url" must be a valid uri.',
      }, done);
  });

  it('.get', (done) => {
    request(app)
      .get('/links/example')
      .expect('location', LONG_URL)
      .expect(302, done);
  });
});
