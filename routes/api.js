const express = require('express');
const router = express.Router();

const price = require('./price');

router.get('/', (req, res) => {
  res.redirect('/api/price');
});

router.use('/price', price);

router.use((req, res, next) => {
  res.end("No API endpoint.");
})

module.exports = router;
