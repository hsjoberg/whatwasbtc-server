const PriceBackend = require('./PriceBackend.class.js');

module.exports = class PriceBackendSqlite extends PriceBackend {
  /**
    * @param {Sqlite::Database} db Database resource
    * @throws
    */
  constructor(db) {
    super();

    if (typeof db === 'undefined')
      throw new Error("Cannot call PriceBackendSqlite constructor without db argument");

    this.db = db;
  }

  /**
    * Get the price of a given date from the backend
    *
    * @param {String} provider Price provider codename
    * @param {String} date ISO-8601 date string
    * @async
    * @throws
    * @return {Promise<Number|Boolean>}
    */
  async getPriceFromBackend(provider, date) {
    const sql = `
      SELECT price
      FROM price
      WHERE date = ? AND source = ?
    `;
    const dbResult = await this.db.get(sql, [date, provider]);

    if (!dbResult)
      return false;

    return dbResult.price;
  }

  /**
    * Saves the price of a date from a provider to the database
    * @param {String} provider Price provider codename
    * @param {String} date ISO-8601 date string
    * @async
    * @throws
    * @return {Promise<Boolean>}
    */
  async savePrice(provider, date, price) {
    const sql = `
      INSERT INTO price
      (date, price, source)
      VALUES
      (?, ?, ?)
    `;
    await this.db.run(sql, [date, price, provider]);

    return true;
  }
}
