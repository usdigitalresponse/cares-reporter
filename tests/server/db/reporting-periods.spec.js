/*
--------------------------------------------------------------------------------
-                     tests/db/reporting-periods.spec.js
--------------------------------------------------------------------------------
  A reporting_periods record in postgres looks like this:

               Column             |           Type           |
  --------------------------------+--------------------------+
   id                             | integer                  |
   name                           | text                     |
   start_date                     | date                     |
   end_date                       | date                     |
   period_of_performance_end_date | date                     |
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
   validation_rule_tags           | text[]                   |
   open_date                      | date                     |
   close_date                     | date                     |
   review_period_start_date       | date                     |
   review_period_end_date         | date                     |

*/
const {
  close,
  periodSummaries,
  reportingPeriods
} = requireSrc(__filename);

const expect = require("chai").expect;

describe("reporting-periods.spec.js - baseline success", () => {
  it("Returns a list of reporting periods", async () => {

    const result = await reportingPeriods();
    // console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });
  it("Returns the period summaries", async () => {

    const result = await periodSummaries();
    // console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });
  it("Closes the current reporting period", async () => {

    const result = await close();
    console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });

});

/*                                 *  *  *                                    */
