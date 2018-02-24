const Joi = require('joi');
const Boom = require('boom');
const express = require('express');
const validator = require('../middlewares/validator.js');
const OAuth = require('../lib/oauth.js');

const route = express.Router();

/**
 * "GET /googleOAuthUrl"
 */
route.get('/googleOAuthUrl', (req, res) => {
  return res.json({ url: OAuth.authUrlSelectAccount });
});

/**
 * "GET /googleOAuthSuccess"
 */
const callbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().uri().required(),
});
route.get('/googleOAuthSuccess', validator.query(callbackSchema), (req, res, next) => {
  const { state, code } = req.query;

  OAuth.client.getToken(code, (err, tokens) => {
    if (err) {
      return next(Boom.boomify(err, {
        statusCode: err.code,
      }));
    }
    req.OAuthSession.tokens = tokens;
    return res.redirect(state);
  });
});

/**
 * "GET /googleOAuthLogout"
 */
route.get('/googleOAuthLogout', (req, res) => {
  req.OAuthSession.reset();
  return res.redirect('back');
});

module.exports = route;
