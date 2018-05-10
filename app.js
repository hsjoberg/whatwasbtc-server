const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const config = require('config');

const api = require('./routes/api');
const wrapAsync = require('./modules/wrapAsync');
const Log = require('./modules/log');
const generalErrorHandler = require('./modules/generalErrorHandler');

if(config.has('upgrade_to_https') && config.get('upgrade_to_https') === true) {
  app.use(require('./modules/upgradeHTTPS'));
}

app.use('/api', api);

// Serve assets (/public)
app.use(express.static('public'));
app.get('/:date', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(generalErrorHandler);

const port = config.get('port');

const httpServer = http.createServer(app).listen(port, () => {
  Log.info(`Service started at port ${port}`);
});

if (config.has('port_secure')) {
  const securePort = config.get('port_secure');

  https.createServer({
    key: fs.readFileSync(config.get('cert').key),
    cert: fs.readFileSync(config.get('cert').cert)
  }, app).listen(securePort, () => {
    Log.info(`Service started at port ${securePort}`);
  });
}

module.exports = app;
