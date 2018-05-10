const fetch = require('node-fetch');
const utils = require('../../utils');

const PriceProvider = require('./PriceProvider.class.js');

const COINDESK_API_CURRENTPRICE = `https://api.coindesk.com/v1/bpi/currentprice/USD.json`;
const COINDESK_API_HISTORICALPRICE = `https://api.coindesk.com/v1/bpi/historical/close.json`;

module.exports = class PriceProviderCoindesk extends PriceProvider {
  constructor() {
    super('COINDESK');
  }

  /**
    * Get the Bitcoin price of a specific date.
    * Coindesk provides two APIs;
    * One for retrieving historic price an one for retrieiving current day price.
    * Which API call to use will be tested.
    *
    * @param {String} date ISO-8601 date string
    * @throws
    * @async
    * @return {Number} Price of a specific date
    */
  async getPrice(date) {
    // Coindesk API doesn't let us get price from today and historic dates from the same request,
    // so we must check which one we want to use
    if(!date || date === utils.getCurrentDate())
      return await getCurrentPriceFromCoindeskAPI();
    else
      return await getPriceFromCoindeskHistoricAPI(date);
  }
};

/**
  * Get current Bitcoin price from Coindesk API
  * Take caution; won't check if result is a number
  *
  * @param {String} date ISO-8601 date string
  * @async
  * @throws
  * @return {Promise}
  */
async function getCurrentPriceFromCoindeskAPI() {
  const url = COINDESK_API_CURRENTPRICE;
  const result = await fetch(url);
  if (result.status === 404 || result.status === 500 || result.status === 503) {
    const body = await result.text();
    throw new Error(`Coindesk API request '${url}' failed with HTTP status ${result.status}\nBody:\n${body}`);
  }

  const json = await result.json();
  // data.bpi will look like this: { '2015-01-02': 314.5916 }
  // Object.keys will let us get the first element of the object
  const price = json.bpi.USD.rate_float;
  if (price === undefined)
    throw new Error(`Erroneous return from Coindesk API request '${url}'.\nReturned data: '${JSON.stringify(json)}'\nprice: '${price}'`);
  return price;
}

/**
  * Get historic Bitcoin price from Coindesk API
  * Take caution; won't check if result is a number
  *
  * @param {String} date ISO-8601 date string
  * @throws
  * @return {Promise}
  */
async function getPriceFromCoindeskHistoricAPI(date) {
  const url = COINDESK_API_HISTORICALPRICE + `?start=${date}&end=${date}`;
  const result = await fetch(url);
  if (result.status === 404 || result.status === 500 || result.status === 503) {
    const body = await result.text();
    throw new Error(`Coindesk API request '${url}' failed with HTTP status ${result.status}\nBody:\n${body}`);
  }

  const json = await result.json();
  // data.bpi will look like this: { '2015-01-02': 314.5916 }
  // Object.keys will let us get the first element of the object
  if (json.bpi === undefined)
    throw new Error(`Erroneous return from Coindesk API request '${url}'.\nReturned data: '${JSON.stringify(json)}'`);
  const price = json.bpi[Object.keys(json.bpi)[0]];
  if (price === undefined)
    throw new Error(`Erroneous return from Coindesk API request '${url}'.\nReturned data: '${JSON.stringify(json)}'\nprice: '${price}'`);
  return price;
}
