import Boom from '@hapi/boom'

/* eslint no-unused-vars: 0 */
export function boomJS(err, req, res, next) {
  const error = (err.isBoom) ? err : Boom.boomify(err);

  return res
    .status(error.output.statusCode)
    .json(error.output.payload);
};

export default { boomJS }