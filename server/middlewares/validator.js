import Boom from '@hapi/boom'

const capitalize = str => str[0].toUpperCase() + str.slice(1);

const buildErrorString = (err, prop) => {
  return err.details.reduce((acc, current) => {
    return `${acc} ${current.message}.`;
  }, `Error validating request ${prop}.`);
};

const validator = prop => (schema, opts) => (req, res, next) => {
  const { error, value } = schema.validate(req[prop], opts);

  if (error) {
    return next(Boom.badRequest(buildErrorString(error, prop)));
  }

  req[`validator${capitalize(prop)}`] = req[prop];
  req[prop] = value;

  return next();
};

export let query = validator('query');
export let body = validator('body');
export let headers = validator('headers');
export let params = validator('params');

