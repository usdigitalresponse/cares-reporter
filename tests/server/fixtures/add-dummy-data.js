const path = require('path')
const fs = require('fs')

const setupAgencies = knex => {
  return knex('agencies').insert([
    { name: 'Generic Government', code: 'GOV' },
    { name: 'Office of Management and Budget', code: 'OMB' },
    { name: 'Department of Health', code: 'DOH' },
    { name: 'Executive Office of Health and Human Services', code: 'EOHHS' }
  ]).then(() => {
    return `Agency data added OK`
  })
}

function deleteTreasuryReports () {
  const directory = process.env.TREASURY_DIRECTORY

  const files = fs.readdirSync(directory)
  for (const file of files) {
    fs.unlink(path.join(directory, file), err => {
      if (err) throw err
    })
  }
}

module.exports = {
  setupAgencies,
  deleteTreasuryReports
}

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
  require('dotenv').config()
  const knex = require('../../../src/server/db/connection')
  return setupAgencies(knex).then(() => {
    knex.destroy()
  })
}
