// Abstract
module.exports = class PriceProvider {
  constructor(codename) {
    this.CODENAME = codename;
  }

  async getPrice() {
    throw new Error('WARNING: virtual function getPrice called from abstract class PriceProvider.');
  }

  /**
    * Gets the provider codename
    *
    * @return {String} Provider codename
    */
  getName() {
    return this.CODENAME;
  }
}
