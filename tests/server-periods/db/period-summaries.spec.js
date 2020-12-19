/*
--------------------------------------------------------------------------------
-                      tests/db/period-summaries.spec.js
--------------------------------------------------------------------------------

  IMPORTANT!!
  for this to work you need to have
  1. loaded the rptest database into postgres
  2. put a file called something like
    Ohio-Period-1-CRF-Report-to-OIG-V.2020-12-10T034416.xlsx
    into the cares-reporter/uploads/treasury directory.

  If the rptest database is not yet populated, do this:
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


  If the rptest database is not yet populated, do this:
    $ createdb --owner=postgres rptest
    $ psql rptest postgres < tests/server/fixtures/period-summaries/rptest.sql
*/

const {
  knex,
  getPeriodSummaries,
  reportingPeriods
} = require(`${process.cwd()}/src/server/db`);

const expect = require("chai").expect;
describe("wait for dropdowns to load",()=>{
  it("wait a second", function (done){
    this.timeout(5000);
    setTimeout(()=>{done();}, 10);
  });
});
describe("period-summaries.spec.js - baseline success", () => {
  it(`Resets the test database`, async function(){
    this.timeout(3000);

    await knex(`period_summaries`).delete();

    const clearFields = {
      certified_by:null,
      certified_at:null,
      final_report_file:null
    };
    await knex(`reporting_periods`).where({ id:1 }).update( clearFields );
    await knex(`reporting_periods`).where({ id:2 }).update( clearFields );

    await knex(`application_settings`)
      .update({ current_reporting_period_id:1 });

  });

  it("Returns a list of reporting period summaries", async () => {
    let summaries;
    const period = 1;

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
      `The current reporting period is not period ${period}`
    );
  });

  it("Closes period 1", async function () {
    this.timeout(5000);

    const period = 1;
    let err = null;
    try {
      await reportingPeriods.close("walter@dahlberg.com", period);

    } catch(_err) {
      err = _err;
    }

    expect(err).to.equal(null);

    let summaries = await getPeriodSummaries(period);

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
  });

  it("Close knex", async () => {
    await knex.destroy();
  });
});
