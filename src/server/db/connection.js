const db = process.env.POSTGRES_URL;

console.log("\nConnecting to database:", db);
const knex = require("knex")({
  client: "pg",
  connection: db
});

module.exports = knex;
