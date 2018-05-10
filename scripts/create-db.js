const Sqlite = require('sqlite');
const fs = require('fs');
const path = require('path');
const config = require('config');

(async () => {
  const dbFile = path.join(__dirname, "..", config.get('db'));
  if (fs.existsSync(dbFile)) {
    console.log(`"${dbFile}" already exists.`);
    return;
  }

  const sqlite = await Sqlite.open(dbFile);

  try {
    const res = await sqlite.run(`
    CREATE TABLE "price" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      "date" TEXT NOT NULL,
      "price" REAL NOT NULL,
      "source" TEXT NOT NULL
    );`);

    const res2 = await sqlite.run(`CREATE INDEX "idx_date" ON "price" (date ASC);`);
    const res3 = await sqlite.run(`CREATE INDEX "idx_price" ON "price" (price ASC);`);
    const res4 = await sqlite.run(`CREATE INDEX "idx_source" ON "price" (source ASC);`);
  }
  catch(e) {
    console.log(e);
    process.exitCode = 1;
  }
})();
