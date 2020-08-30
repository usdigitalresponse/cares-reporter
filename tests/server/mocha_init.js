require("dotenv").config();
const knex = require("../../src/server/db/connection");

// `requireSrc(__filename)` is a convenience that performs a
// `require` of the corresponding source file to the current `spec` file.
global.requireSrc = f =>
  require(f.replace(/\/tests\//, "/src/").replace(/\.spec/, ""));

module.exports.mochaHooks = {
  afterAll(done) {
    knex.destroy(done);
  }
};
