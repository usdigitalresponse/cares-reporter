/*
--------------------------------------------------------------------------------
-                      tests/db/period-summaries.spec.js
--------------------------------------------------------------------------------

  IMPORTANT!!
  for this to work you need to have unzipped the
    tests/server-periods/fixtures/rptest.sql.zip
  file.

  Invoke this test with:
    $ yarn test:server-periods

  A period-summary record in postgres looks like this:

    id                  | integer       |
    reporting_period_id | integer       |
    project_id          | integer       |
    type                | text          |
    current_obligation  | numeric(19,2) |
    current_expenditure | numeric(19,2) |


  If the rptest database is not yet populated, do this:
    $ createdb --owner=postgres rptest
    $ psql rptest postgres < tests/server/fixtures/period-summaries/rptest.sql
*/
const fs = require("fs");
const path= require("path");
const { getPeriodSummaries, readSummaries } =
  requireSrc(`${__dirname}/../../server/db`);
const { getCurrentReport } =
  requireSrc(`${__dirname}/../../server/lib/treasury`);

const reportingPeriods =
  requireSrc(`${__dirname}/../../server/db/reporting-periods`);

const expect = require("chai").expect;
const knex = requireSrc(`${__dirname}/../../server/db/connection`);
let treasuryReportFilename = null;

describe("baseline success", () => {
  it("Returns a list of reporting period summaries", async () => {
    let summaries;
    const period = 1;

    summaries = await readSummaries(period);
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`);
    }

    summaries = await getPeriodSummaries(period);

    if (summaries.errors.length) {
      console.dir(summaries.errors);
      throw new Error(summaries.errors[0]);
    }

    if (summaries.periodSummaries.length !== 3161){
      // console.log(summaries.periodSummaries.length);
      // console.dir(summaries);
      throw new Error(
        `Expected 3161 period summaries, got ${summaries.periodSummaries.length}`
      );
    }
    if (summaries.closed) {
      throw new Error(`Period ${period} should not be closed`);
    }
  });

  it("Returns an empty list of reporting period summaries", async () => {
    let summaries;
    const period = 4;

    summaries = await readSummaries(period);
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`);
    }

    summaries = await getPeriodSummaries(period);

    if (summaries.periodSummaries.length !== 0){
      console.dir(summaries);
      // { periodSummaries: [], closed: false }
      throw new Error(`Returned summaries from the wrong period`);
    }
  });

  it("Fails to close period 2 (because period 1 is open)", async () => {
    const period = 2;
    let err = null;
    try {
      await reportingPeriods.close("walter@dahlberg.com", period);

    } catch(_err) {
      err = _err;
    }

    expect(err.message).to.equal(
      `The current reporting period (1) is not period ${period}`
    );
  });
  it("Generates a Treasury Report for period 1", async () => {
    const { filename } = await getCurrentReport();
    treasuryReportFilename = filename;
    // console.log(`filename is ${filename}`);
  });
  it("Closes period 1", async function () {
    this.timeout(5000);
    const period = 1;

    let summaries = await readSummaries(period);
    if (summaries.length !== 0) {
      // console.dir(summaries);
      throw new Error(`Summaries should be stored for closed periods`);
    }

    summaries = await knex("period_summaries")
      .select("*");
    // console.dir(summaries);
    if (summaries.length !== 0){
      // console.log(summaries.periodSummaries.length);
      console.dir(summaries,{ depth:1 });
      throw new Error(
        `Expected 0 period summaries, got ${summaries.periodSummaries.length}`
      );
    }

    let err = null;
    try {
      await reportingPeriods.close("walter@dahlberg.com", period);

    } catch(_err) {
      err = _err;
    }

    expect(err).to.equal(null);

    summaries = await getPeriodSummaries(period);

    // console.dir(summaries);
    if (summaries.periodSummaries.length !== 3161){
      // console.log(summaries.periodSummaries.length);
      console.dir(summaries,{ depth:1 });
      throw new Error(
        `Expected 3161 period summaries, got ${summaries.periodSummaries.length}`
      );
    }

    if (!(await reportingPeriods.isClosed(1))) {
      throw new Error(`Period ${period} should be closed`);
    }

    summaries = await readSummaries(period);
    if (summaries.length !== 3161) {
      // console.dir(summaries);
      throw new Error(`Summaries should be stored for closed periods`);
    }
    // console.log(`dirname is ${__dirname}`);
    const treasuryReportName =
      path.resolve(
        __dirname,
        "../mocha_uploads/treasury/",
        treasuryReportFilename
      );
    // console.log(`latestReport path is ${treasuryReportName}`);
    const stats = fs.statSync(treasuryReportName);
    if ( stats.size <100000 ) {
      throw new Error (
        `Treasury output spreadsheet file size is only ${stats.size} bytes!`
      );
    }
  });

  it("Fails to close period 2 (because there is no Treasury file)", async () => {
    const period = 2;
    let err=null;

    try {
      await reportingPeriods.close("walter@dahlberg.com", period);

    } catch(_err) {
      err = _err;
    }
    expect(err.message).to.equal(
      `No Treasury report has been generated for period ${period}`
    );

    let summaries = await readSummaries(period);
    if (summaries.length) {
      throw new Error(`There should be no stored summaries for open periods`);
    }

  });
});

