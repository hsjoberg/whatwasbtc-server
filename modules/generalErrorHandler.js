const Log = require('./log');

module.exports = (err, req, res, next) => {
  Log.error(err.message);
  res.status(500).end('API request failed.');
};
