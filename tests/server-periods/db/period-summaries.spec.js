/*
--------------------------------------------------------------------------------
-                      tests/db/period-summaries.spec.js
--------------------------------------------------------------------------------

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
  closeReportingPeriod
} = require(`${process.cwd()}/src/server/db`);

const expect = require("chai").expect;

describe("period-summaries.spec.js - baseline success", () => {
  it(`Clears the reporting summaries from the test database`, async () => {
    await knex(`period_summaries`)
      .delete();
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
      throw new Error(`Expected 3157 period summaries, got ${summaries.periodSummaries.length}`);
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

  it("Closes period 1", async function () {
    this.timeout(5000);

    const period = 1;
    let err = await closeReportingPeriod(period);
    if (err) {
      console.dir(err);
      throw new Error(err[0]);
    }

    let summaries = await getPeriodSummaries(period);

    // console.dir(summaries);
    if (summaries.periodSummaries.length !== 3161){
      // console.log(summaries.periodSummaries.length);
      console.dir(summaries,{ depth:1 });
      throw new Error(`Expected 3157 period summaries, got ${summaries.periodSummaries.length}`);
    }
    if (!summaries.closed) {
      throw new Error(`Period ${period} should be closed`);
    }
  });
  it("Close knex", async () => {
    await knex.destroy();
  });

});
