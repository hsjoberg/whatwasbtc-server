module.exports = class PriceBackend {
  async getPriceFromBackend(provider, date) {
    throw new Error('WARNING: virtual function getPriceFromBackend called from abstract class PriceBackend.');
  }

  async savePrice(provider, date, price) {
    throw new Error('WARNING: virtual function savePrice called from abstract class PriceBackend.');
  }
}
