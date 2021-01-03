require('dotenv').config()
const knex = require('../../src/server/db/connection')
const { setupAgencies } = require('./fixtures/add-dummy-data')
const { initializeTemplates } = require('../../src/server/services/get-template')

// `requireSrc(__filename)` is a convenience that performs a
// `require` of the corresponding source file to the current `spec` file.
// `or
// `requireSrc(`${__dirname}/a/path`) does a require of `a/path` relative
// to the corresponding `src` dir of the tests `__dirname`,
global.requireSrc = f =>
  require(f.replace(/\/tests\//, '/src/').replace(/(\.[^.]*)*\.spec/, ''))

module.exports.mochaHooks = {
  beforeAll: async () => {
    await initializeTemplates()
    return setupAgencies(knex)
  },
  afterAll: done => {
    knex.destroy(done)
  }
}
