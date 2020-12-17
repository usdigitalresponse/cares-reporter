/*
--------------------------------------------------------------------------------
-                           db/reporting-periods.js
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
const knex = require("./connection");
const { getPeriodSummaries } = require("./period-summaries");

module.exports = {
  closeReportingPeriod,
  getReportingPeriod,
  reportingPeriods
};

/*  reportingPeriods() returns all the records from the reporting_periods table
  */
function reportingPeriods() {
  return knex("reporting_periods")
    .select("*")
    .orderBy("end_date", "desc");
}

/* getReportingPeriod() returns a record from the reporting_periods table.
  */
function getReportingPeriod( period_id ) {
  return knex("reporting_periods")
    .select("*")
    .where("id", period_id)
    .then( r=>r[0] );
}

/* closeReportingPeriod() closes a reporting period by writing the period
  summaries to the database.
  */
async function closeReportingPeriod(reporting_period_id) {
  let { periodSummaries, closed } = getPeriodSummaries(reporting_period_id);
  if (closed) {
    throw new Error(`Reporting period ${reporting_period_id} is already closed`);
  }

  return knex("period_summaries")
    .insert(periodSummaries);
}

/*                                 *  *  *                                    */
