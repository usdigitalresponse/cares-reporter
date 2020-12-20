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

module.exports = {
  // close: closeReportingPeriod, // moved to period-summaries.js
  getFirstReportingPeriodStartDate,
  get: getReportingPeriod
  // reportingPeriods
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
  if (!period_id) {
    return reportingPeriods();
  }

  return knex("reporting_periods")
    .select("*")
    .where("id", period_id)
    .then( r=>r[0] );
}

/* getFirstReportingPeriodStartDate() returns earliest start date
  */
function getFirstReportingPeriodStartDate() {
  return knex("reporting_periods")
    .min("start_date")
    .then( r=>r[0].min );
}

/*                                 *  *  *                                    */
