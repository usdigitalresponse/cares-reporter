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
const reportingPeriods = requireSrc(__filename);

const expect = require("chai").expect;

describe("reporting-periods.spec.js - baseline success", () => {
  it("Returns a list of reporting periods", async () => {

    const result = await reportingPeriods.get();
    if (result.length !== 5) {
      // console.dir(result);
      throw new Error(`Expected 5 periods, got ${result.length}`);
    }
    return result;
  });
  it("Returns one reporting period", async () => {

    const result = await reportingPeriods.get(2);
    if (Array.isArray(result)) {
      // console.dir(result);
      throw new Error(`Expected 1 period, got ${result.length}`);
    }
    if (result.id !== 2) {
      // console.dir(result);
      throw new Error(`Expected period 2, got period ${result.id}`);
    }
    return result;
  });
  it.skip("Closes a reporting period", async () => {
    // skipped because the reporting period close test is in
    // period-summaries.spec.js
  });
});

/*                                 *  *  *                                    */
