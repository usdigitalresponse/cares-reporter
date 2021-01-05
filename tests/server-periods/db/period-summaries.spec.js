/*
--------------------------------------------------------------------------------
-                      tests/db/period-summaries.spec.js
--------------------------------------------------------------------------------

  IMPORTANT!!
  for this to work you need to have unzipped the
    tests/server-periods/fixtures/rptest.sql.zip
  file. Do this:

    $ createdb --owner=postgres rptest
    $ psql rptest postgres < tests/server/fixtures/period-summaries/rptest.sql

  Invoke this test with:
    $ yarn test:server-periods

  A period-summary record in postgres looks like this:

    id                  | integer       |
    reporting_period_id | integer       |
    project_id          | integer       |
    type                | text          |
    current_obligation  | numeric(19,2) |
    current_expenditure | numeric(19,2) |
*/
const fs = require('fs')
const path = require('path')
const { getPeriodSummaries, readSummaries } =
  requireSrc(`${__dirname}/../../server/db`)
const treasury = requireSrc(`${__dirname}/../../server/lib/treasury`)
const _ = require('lodash')

const reportingPeriods =
  requireSrc(`${__dirname}/../../server/db/reporting-periods`)

const expect = require('chai').expect
const knex = requireSrc(`${__dirname}/../../server/db/connection`)

describe('baseline success', () => {
  it('Returns a list of reporting period summaries', async () => {
    let summaries
    const period = 1

    summaries = await readSummaries(period)
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`)
    }

    summaries = await getPeriodSummaries(period)

    if (summaries.errors.length) {
      console.dir(summaries.errors)
      throw new Error(summaries.errors[0])
    }

    if (summaries.periodSummaries.length !== 3161) {
      // console.log(summaries.periodSummaries.length);
      // console.dir(summaries);
      throw new Error(
        `Expected 3161 period summaries, got ${summaries.periodSummaries.length}`
      )
    }
    if (summaries.closed) {
      throw new Error(`Period ${period} should not be closed`)
    }
  })

  it('Returns an empty list of reporting period summaries', async () => {
    let summaries
    const period = 4

    summaries = await readSummaries(period)
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`)
    }

    summaries = await getPeriodSummaries(period)

    if (summaries.periodSummaries.length !== 0) {
      console.dir(summaries)
      // { periodSummaries: [], closed: false }
      throw new Error(`Returned summaries from the wrong period`)
    }
  })

  it('Fails to close period 2 (because period 1 is open)', async () => {
    const period = 2
    let err = null
    try {
      await reportingPeriods.close('walter@dahlberg.com', period)
    } catch (_err) {
      err = _err
    }

    expect(err.message).to.equal(
      `The current reporting period (1) is not period ${period}`
    )
  })

  it('Fails to close period 1 (because there is no Treasury file)', async () => {
    const period = 1
    let err = null

    try {
      await reportingPeriods.close('walter@dahlberg.com', period)
    } catch (_err) {
      err = _err
    }
    expect(err.message).to.equal(
      `No Treasury report has been generated for period ${period}`
    )

    let summaries = await readSummaries(period)
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`)
    }
  })
  it('Generates a Treasury Report Workbook for period 1', async () => {
    const period = 1
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
    // console.log(`latestReport path is ${treasuryReportName}`);

    // throws if file missing
    fs.accessSync(treasuryReportName, fs.constants.R_OK)

    const stats = fs.statSync(treasuryReportName)
    if (stats.size < 100000) {
      throw new Error(
        `Treasury output spreadsheet file size is only ${stats.size} bytes!`
      )
    }
  })

  it('Check there are no summaries yet', async function () {
    const period = 1

    let summaries = await readSummaries(period)
    if (summaries.length !== 0) {
      // console.dir(summaries);
      throw new Error(`Summaries should not be stored for open periods`)
    }

    summaries = await knex('period_summaries').select('*')
    // console.dir(summaries);
    if (summaries.length !== 0) {
      // console.log(summaries.periodSummaries.length);
      console.dir(summaries, { depth: 1 })
      throw new Error(
        `Expected 0 period summaries, got ${summaries.periodSummaries.length}`
      )
    }
  })
  it('Close period 1', async function () {
    this.timeout(3000)
    const period = 1

    // throws if error
    await reportingPeriods.close('walter@dahlberg.com', period)

    if (!(await reportingPeriods.isClosed(1))) {
      throw new Error(`Period ${period} should be closed`)
    }
  })

  it('Check that the summaries have been written', async function () {
    const period = 1

    let summaries = await readSummaries(period)
    if (summaries.length !== 3161) {
      // console.dir(summaries);
      throw new Error(`Summaries should be stored for closed periods`)
    }

    summaries = await knex('period_summaries').select('*')
    // console.dir(summaries);
    if (summaries.length !== 3161) {
      // console.log(summaries.periodSummaries.length);
      console.dir(summaries, { depth: 1 })
      throw new Error(
        `Expected 3161 period summaries, got ${summaries.periodSummaries.length}`
      )
    }
  })
})
