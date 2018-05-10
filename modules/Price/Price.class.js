const utils = require('../utils');

module.exports = class Price {
  /**
    * @param {PriceProvider} provider Service where we get our price data from
    * @param {PriceBackend} backend Database Backend where cache price data
    */
  constructor(provider, backend) {
    this.provider = provider;
    this.backend = backend;
  }

  /**
    * Get the Bitcoin price of a specific date.
    * First attempts to get the price from the cache.
    * If non-existant, resort to our provider.
    *
    * @param {String} date ISO-8601 date string
    * @throws
    * @async
    * @return {Number} Price of a specific date
    */
  async getPrice(date) {
    if (!utils.validateISO8601(date)) {
      throw new Error("Malformed date " + date);
    }

    // Sanitizes the price or throw if failure
    const testPrice = (from, price) => {
      const parsedPrice = Number.parseFloat(price);
      if (Number.isNaN(parsedPrice)) {
        throw Error(`Error parsing price from ${from}. Got "${price}"`);
      }
      return parsedPrice;
    }

    // Check with local Sqlite cache before going to our backend provider:
    let price = await this.getPriceFromBackend(date);
    // If we got data back from the backend
    if (price) {
      price = testPrice("backend", price);
    }
    // If we don't have an entry yet for this price:
    else if (!price) {
      price = await this.getPriceFromProvider(date);
      price = testPrice(`provider ${this.provider.getName()}`, price);

      await this.savePriceToBackend(date, price);
    }

    return price;
  }

  /**
    * Gets the price from our cache
    *
    * @param {String} date ISO-8601 date string
    * @throws
    * @async
    * @return {Promise<Number|Boolean>} The price of a specific date or false if non-existant
    */
  async getPriceFromBackend(date) {
    return await this.backend.getPriceFromBackend(this.provider.getName(), date)
  }

  /**
    * Gets the price from our provider
    *
    * @param {String} date ISO-8601 date string
    * @throws
    * @async
    * @return {Promise<Number>} The price of a specific date. Throws on failure
  */
  async getPriceFromProvider(date) {
    return await this.provider.getPrice(date);
  }

  /**
   * @param {String} date ISO-8601 date string
   * @param {Number} price
   * @throws
   * @async
   * @return {Promise<Bool>}
   */
  async savePriceToBackend(date, price) {
    this.backend.savePrice(this.provider.getName(), date, price)
    return true;
  }
}
