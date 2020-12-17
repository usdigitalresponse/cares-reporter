/*
--------------------------------------------------------------------------------
-                      tests/db/period-summaries.spec.js
--------------------------------------------------------------------------------
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
global.requireSrc = f =>
  require(f.replace(/\/tests\//, "/src/").replace(/(\.[^.]*)*\.spec/, ""));
console.log(process.cwd());
const knex = require(`${process.cwd()}/src/server/db/connection`);

const { getPeriodSummaries } = requireSrc(__filename);

const expect = require("chai").expect;

describe("period-summaries.spec.js - baseline success", () => {
  it("Returns a list of reporting periods", async () => {
    let periodSummaries;
    try {
      periodSummaries = await getPeriodSummaries(1);

    } catch(err) {
      console.dir(err);
    }
  });
  it("Close knex", async () => {
    await knex.destroy();
  });

});
