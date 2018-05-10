process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);

const VALID_ISO_DATE = '2018-01-01';
const INVALID_ISO_DATE = 'x018-01-01';

describe('Express HTTP API', function() {
  describe('/api', function() {
    it('Should redirect to /api/price', async function() {
      const res = await chai.request(server).get('/api').redirects(0);
      res.should.redirectTo('/api/price');
    });
  });

  describe('/api/price', function() {
    it('Should return the current Bitcoin price', async function() {
      const res = await chai.request(server).get('/api/price');

      res.should.have.status(200);
      res.body.should.be.an('object');
      res.body.should.have.a.property('date').that.is.a('string');
      res.body.should.have.a.property('currency').that.is.a('string').that.equals('USD');
      res.body.should.have.a.property('price').that.is.a('number').above(0);
    });
  });

  describe('/api/price/:date', function() {
    it('Should return the Bitcoin price of a specified date', async function() {
      const date = VALID_ISO_DATE;
      const res = await chai.request(server).get(`/api/price/${date}`);

      res.should.have.status(200);
      res.body.should.be.an('object');
      res.body.should.have.a.property('date').that.is.a('string');
      res.body.should.have.a.property('currency').that.is.a('string').that.equals('USD');
      res.body.should.have.a.property('price').that.is.a('number').above(0);
    });

    it('Should not accept a malformed date', async function() {
      const date = INVALID_ISO_DATE;
      const res = await chai.request(server).get(`/api/price/${date}`);
      res.should.have.status(500);
    });

    it('Should not accept a date into the future', async function() {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
      const date = tomorrow.toISOString().substring(0, 10);
      const res = await chai.request(server).get(`/api/price/${date}`);
      res.should.have.status(500);
    });

    it('Should not accept a date before 2010-07-18', async function() {
      const date = "2010-07-17";
      const res = await chai.request(server).get(`/api/price/${date}`);
      res.should.have.status(500);
    });
  });
});
