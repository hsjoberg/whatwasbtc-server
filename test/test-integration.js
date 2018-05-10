process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();
chai.use(chaiAsPromised);

const config = require('config');
const fs = require('fs');
const childProcess = require('child_process');

const dbModule = require('../modules/database');
const PriceModule = require('../modules/Price/Price.class');
const PriceBackend = require('../modules/Price/backend/PriceBackend.class');
const PriceBackendSqlite = require('../modules/Price/backend/PriceBackendSqlite.class');
const PriceProvider = require('../modules/Price/providers/PriceProvider.class');
const PriceProviderCoindesk = require('../modules/Price/providers/PriceProviderCoindesk.class');

const DATABASE_FILE = config.get('db');
const VALID_ISO_DATE = '2018-01-01';
const VALID_ISO_DATE2 = "2018-01-02";
const VALID_ISO_DATE_COINDESK_PRICE = 13412.44;
const INVALID_ISO_DATE = 'x018-01-01';
const TESTPROVIDER_NAME = "TESTPROVIDER";
const BACKEND_RESPONSE = 1000;
const PROVIDER_RESPONSE = 2000

// Fake provider:
const FakeProvider = class FakeProvider extends PriceProvider {
  constructor() {
    super(TESTPROVIDER_NAME);
    this.getPriceShouldSucceed = true;
    this.getPriceResponse = PROVIDER_RESPONSE;
  }

  async getPrice(date) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.getPriceShouldSucceed)
          resolve(this.getPriceResponse);
        else
          reject('Promise rejecting, getPriceShouldSucceed is false');
      }, 100);
    });
  }
};

const FakeBackend = class FakeBackend extends PriceBackend {
  constructor() {
    super();

    this.getPriceFromBackendShouldReturn = BACKEND_RESPONSE;
    this.savePriceToBackendShouldSucceed = true;
  }

  async getPriceFromBackend(provider, date) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.getPriceFromBackendShouldReturn);
      }, 100);
    });
  }

  async savePrice(provider, date, price) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.savePriceToBackendShouldSucceed)
          resolve(true);
        else
          reject('Promise rejecting, savePriceToBackendShouldSucceed is false');
      }, 100);
    });
  }
};


const setupDatabase = function() {
  if (fs.existsSync(DATABASE_FILE))
    fs.unlinkSync(DATABASE_FILE);

  childProcess.execSync('npm run create-db', { NODE_ENV: 'test' });
};

describe("Integration tests", async function() {
  describe('Module database.js', function() {
    before(setupDatabase);

    it('Should return a Sqlite::Database when given an existing database file', async function() {
      const db = await dbModule(DATABASE_FILE);
      db.should.be.an('object');
    });

    it('Should throw when given a non-existing file and/or non-Sqlite file', async function() {
      await dbModule('x').should.be.rejected;
    });
  });

  describe('Module Price.class.js (class Price)', async function() {
    describe('Price::getPrice(date)', function() {
      it('Should throw on an invalid ISO-8601 string', async function() {
        const price = new PriceModule(null, class {});
        await price.getPrice(INVALID_ISO_DATE).should.be.rejectedWith(Error, "Malformed date " + INVALID_ISO_DATE);
      });
    });

    describe('Using FakeBackend and FakeProvider', function() {
      let price;
      beforeEach(function() {
        price = new PriceModule(new FakeProvider(), new FakeBackend());
      });

      describe('Price::getPrice(date)', function() {
        it('Should return the price of a given day (from backend)', async function() {
          const result = await price.getPrice(VALID_ISO_DATE);
          result.should.be.a('number').that.equals(BACKEND_RESPONSE);
        });

        it('Should return the price of a given day (from provider)', async function() {
          price.backend.getPriceFromBackendShouldReturn = false;
          const result = await price.getPrice(VALID_ISO_DATE);
          result.should.be.a('number').that.equals(PROVIDER_RESPONSE);
        });

        it('Should throw if backend returns an invalid response (non-Number)', async function() {
          const response = "Not a number";
          price.backend.getPriceFromBackendShouldReturn = response;
          await price.getPrice(VALID_ISO_DATE).should.be.rejectedWith(Error, `Error parsing price from backend. Got "${response}"`);
        });

        it('Should throw if provider returns an invalid response (non-Number)', async function() {
          const response = "Not a number";
          price.backend.getPriceFromBackendShouldReturn = false;
          price.provider.getPriceResponse = response;
          await price.getPrice(VALID_ISO_DATE).should.be.rejectedWith(Error, `Error parsing price from provider ${TESTPROVIDER_NAME}. Got "${response}"`);
        });
      });
    });

    describe('Using FakeBackend and PriceCoindeskProvider', function() {
      let price;
      beforeEach(function() {
        price = new PriceModule(new PriceProviderCoindesk(), new FakeBackend());
        price.backend.getPriceFromBackendShouldReturn = false;
      });

      describe('Price::getPrice(date)', function() {
        it('Should return the price of a given day', async function() {
          const response = await price.getPrice(VALID_ISO_DATE);
          response.should.be.a('number').that.equals(VALID_ISO_DATE_COINDESK_PRICE);
        });

        it('Should be able to return the day price', async function() {
          const date = (new Date()).toISOString().substring(0, 10);
          const result = await price.getPrice(date);
          result.should.be.a('number');
        });
      });
    });

    describe('Using PriceBackendSqlite and FakeProvider', function() {
      let price;
      before(setupDatabase);

      before(async function() {
        const db = await dbModule(DATABASE_FILE);

        const priceBackendSqlite = new PriceBackendSqlite(db);
        price = new PriceModule(new FakeProvider(), priceBackendSqlite);
      });

      describe('Price::savePriceToBackend(date, price) and Price::getPriceFromBackend(date)', function() {
        it('Should save the price of a date to the backend', async function() {
            const VALID_ISO_DATE_TMP = "2018-02-01";
            const VALID_ISO_DATE_PRICE_TMP = 456;
            const response = await price.savePriceToBackend(VALID_ISO_DATE_TMP, VALID_ISO_DATE_PRICE_TMP);
            response.should.be.a('boolean').that.equals(true);

            const response2 = await price.getPriceFromBackend(VALID_ISO_DATE_TMP);
            response2.should.be.a('number').that.equals(VALID_ISO_DATE_PRICE_TMP);
        });
      })

      describe('Price::getPrice()', function() {
        const VALID_ISO_DATE_PRICE = 123.45;

        before(async function() {
          await price.savePriceToBackend(VALID_ISO_DATE, VALID_ISO_DATE_PRICE);
        });

        it('Should return the price of a given day (backend)', async function() {
          const response = await price.getPrice(VALID_ISO_DATE);
          response.should.be.a('number').that.equals(VALID_ISO_DATE_PRICE);
        });

        it('Should resort to provider if data for a day doesn\'t exist', async function() {
          const response = await price.getPrice(VALID_ISO_DATE2);
          response.should.be.a('number').that.equals(PROVIDER_RESPONSE);
        });
      });
    });
  });

  describe('Module PriceProviderCoindesk.class.js (class PriceProviderCoindesk)', async function() {
    let priceProviderCoindesk;
    before(function() {
      priceProviderCoindesk = new PriceProviderCoindesk();
    });

    describe('PriceProvider::getPrice(date)', function() {
      it('Should return the price of a given day', async function() {
        const result = await priceProviderCoindesk.getPrice(VALID_ISO_DATE);
        result.should.be.a('number').that.equals(VALID_ISO_DATE_COINDESK_PRICE);
      });
      it('Should be able to return the day price', async function() {
        const date = (new Date()).toISOString().substring(0, 10);
        const result = await priceProviderCoindesk.getPrice(date);
        result.should.be.a('number');
      });
    });
  });


  describe('Module PriceBackendSqlite.class.js (class PriceBackendSqlite)', async function() {
    let priceBackendSqlite;
    before(setupDatabase);

    before(async function() {
      const db = await dbModule(DATABASE_FILE);
      priceBackendSqlite = new PriceBackendSqlite(db);
    });

    describe('PriceBackend::savePrice(date, price) and PriceBackend::getPriceFromBackend(date)', function() {
      it('Should save the price of a date to the backend', async function() {
        const VALID_ISO_DATE_TMP = "2018-02-01";
        const VALID_ISO_DATE_PRICE_TMP = 456;
        const response = await priceBackendSqlite.savePrice(TESTPROVIDER_NAME, VALID_ISO_DATE_TMP, VALID_ISO_DATE_PRICE_TMP);
        response.should.be.a('boolean').that.equals(true);

        const response2 = await priceBackendSqlite.getPriceFromBackend(TESTPROVIDER_NAME, VALID_ISO_DATE_TMP);
        response2.should.be.a('number').that.equals(VALID_ISO_DATE_PRICE_TMP);
      });
    });
  });

  describe('Module utils.js', function() {
    const utils = require('../modules/utils');

    describe('validateISO8601(date)', function() {
      it('Should return true on a valid ISO-8601 string', function() {
        const date = VALID_ISO_DATE;
        const result = utils.validateISO8601(date);
        result.should.be.a("boolean").that.equals(true);
      });

      it('Should return false on an invalid ISO-8601 string', function() {
        const date = INVALID_ISO_DATE;
        const result = utils.validateISO8601(date);
        result.should.be.a('boolean').that.equals(false);
      });
    });
    describe('getCurrentDate()', function() {
      it('Should return the current date (ISO-8601)', function() {
        const currentDate = new Date().toISOString().substring(0, 10);
        const result = utils.getCurrentDate();
        result.should.equal(currentDate);
      });
    });
  });
});
