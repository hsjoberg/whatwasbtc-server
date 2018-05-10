const chalk = require('chalk');

exports.info = (message) => {
  if (process.env.NODE_ENV !== 'test')
    console.log(chalk`${"[INFO]".padEnd(8)} ${timestamp()}: ${message}`);
}

exports.error = (message) => {
  if (process.env.NODE_ENV !== 'test')
    console.error(chalk`{red ${"[ERROR]".padEnd(8)} ${timestamp()}: ${message}}`);
}

function timestamp() {
  return new Date().toISOString();
}
