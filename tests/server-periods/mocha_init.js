require("dotenv").config();
const knex = require("../../src/server/db/connection");
const { initializeTemplates }=require("../../src/server/services/get-template");
// `requireSrc(__filename)` is a convenience that performs a
// `require` of the corresponding source file to the current `spec` file.
// `or
// `requireSrc(`${__dirname}/a/path`) does a require of `a/path` relative
// to the corresponding `src` dir of the tests `__dirname`,
global.requireSrc = f =>
  require(f.replace(/\/tests\//, "/src/").replace(/(\.[^.]*)*\.spec/, ""));

module.exports.mochaHooks = {
  beforeAll: async function() {
    this.timeout(5000);
    return await initializeTemplates();
  },
  afterAll: done => {
    knex.destroy(done);
  }
};