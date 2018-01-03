const Boom = require('boom');

/* eslint no-unused-vars: 0 */
module.exports = (err, req, res, next) => {
  const error = (err.isBoom) ? err : Boom.boomify(err);

  return res
    .status(error.output.statusCode)
    .json(error.output.payload);
};
