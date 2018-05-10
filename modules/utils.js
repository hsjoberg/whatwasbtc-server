const moment = require('moment');

/**
  * @param {String} ISO8601 Date string
  * @return {Boolean}
  */
module.exports.validateISO8601 = (date) => {
  return moment(date, 'YYYY-MM-DD', true).isValid();
}

/**
  * @return {String} ISO8601 Date string
  */
module.exports.getCurrentDate = () => {
  const date = new Date();
  const iso8601 = date.toISOString().substring(0, 10);
  return iso8601;
}
