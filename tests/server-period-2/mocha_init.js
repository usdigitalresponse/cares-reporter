// this is invoked by mocha_wrapper.sh
require('dotenv').config()
const knex = require('../../src/server/db/connection')

module.exports.mochaHooks = {

  beforeAll: async function () {
    //
  },
  afterAll: done => {
    knex.destroy(done)
  }
}
