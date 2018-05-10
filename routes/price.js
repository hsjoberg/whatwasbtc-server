const express = require('express');
const router = express.Router();
const utils = require('../modules/utils');
const wrapAsync = require('../modules/wrapAsync');
const Log = require('../modules/log');
const config = require('config');

let price;
(async () => {
  let db;
  try {
    db = await require('../modules/database')(config.get('db'));
  }
  catch(e) {
    Log.error(e);
    process.exit(1);
  }

  // Price provider is Coindesk for time being
  const coindeskProvider = new (require('../modules/Price/providers/PriceProviderCoindesk.class.js'))();
  const sqliteBackend = new (require('../modules/Price/backend/PriceBackendSqlite.class'))(db);

  price = new (require('../modules/Price/Price.class.js'))(coindeskProvider, sqliteBackend);
})();

/**
  * A request without a date specified
  * Will use the current date
  */
router.get('/', wrapAsync(async (req, res, next) => {
  const date = utils.getCurrentDate();

  req.date = date;
  req.currency = 'USD';

  next();
}));

/**
  * A request with the date specified
  */
router.get('/:date', wrapAsync(async (req, res, next) => {
  const date = req.params.date;

  if (!utils.validateISO8601(date)) {
    return res.status(500).send(`Invalid date "${date}"`);
  }

  req.date = date;
  req.currency = 'USD';

  next();
}));

/**
  * End; middleware to actually the price data and returns the information to the user
  */
router.use(wrapAsync(async (req, res, next) => {
  const priceUSD = await price.getPrice(req.date);

  res.json({
    date: req.date,
    price: priceUSD,
    currency: 'USD'
  });
}));

module.exports = router;
