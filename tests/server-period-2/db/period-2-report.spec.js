/*
--------------------------------------------------------------------------------
-                      tests/db/period-2-report.spec.js
--------------------------------------------------------------------------------
  rptest2 database is from Rhode Island
  In the rptest2 database, period 1 has already been closed.
*/
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

require('dotenv').config()

const dbname = 'rptest2'
process.env.POSTGRES_URL = `postgres://localhost/${dbname}`
// __dirname is the directory this file is in
process.env.UPLOAD_DIRECTORY = path.resolve(__dirname, '../mocha_uploads')
process.env.TREASURY_DIRECTORY = path.resolve(__dirname, '../mocha_uploads/treasury')

// process.cwd() is the directory that yarn is invoked in - the project root
const treasury = require(path.resolve(process.cwd(), 'src/server/lib/treasury'))

describe('Generate a Treasury Report for Period 2', () => {
  it('Generates a Treasury Report Workbook for period 2', async () => {
    const period = 2
    const treasuryReport = await treasury.generateReport(period)
    if (_.isError(treasuryReport)) {
      throw treasuryReport
    }

    // console.log(`dirname is ${__dirname}`);
    const treasuryReportName =
      path.resolve(
        __dirname,
        '../mocha_uploads/treasury/',
        treasuryReport.filename
      )
    // console.log(`latestReport path is ${treasuryReportName}`)

    // throws if file missing
    fs.accessSync(treasuryReportName, fs.constants.R_OK)

    const stats = fs.statSync(treasuryReportName)
    if (stats.size < 100000) {
      throw new Error(
        `Treasury output spreadsheet file size is only ${stats.size} bytes!`
      )
    }
  })
})
