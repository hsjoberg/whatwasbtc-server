const fs = require('fs');
const Sqlite = require('sqlite');

/**
 * @param {String} file string path to db file
 * @throws
 * @return {Promise<Sqlite::Database>}
 */
module.exports = async (file) => {
  // Check if db file exists:
  if (!fs.existsSync(file)) { // Async?
    throw new Error(`Database file not found!\nIf the database hasn't been created yet, run \`npm run create-db\`.`)
  }

  return await Sqlite.open(file);
}
