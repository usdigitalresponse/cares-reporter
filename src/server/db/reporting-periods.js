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
   final_report_file              | text                     |
*/
const knex = require("./connection");
const treasury = require("../lib/treasury");

const {
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
} = require("./settings");

module.exports = {
  close: closeReportingPeriod,
  get: getReportingPeriod,
  getPeriodID,
  isCurrent,
  isClosed,
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
  if (!period_id) {
    return reportingPeriods();
  }

  return knex("reporting_periods")
    .select("*")
    .where("id", period_id)
    .then( r=>r[0] );
}

function isClosed(period_id) {
  return getReportingPeriod(period_id)
  .then(period => {
    // console.dir(period);
    return Boolean(period.certified_at);
  });
}

/*  getPeriodID() returns the argument unchanged unless it is falsy, in which
  case it returns the current reporting period ID.
  */
async function getPeriodID(periodID) {
  return Number(periodID) || await getCurrentReportingPeriodID();
}

/*  isCurrent() returns the current reporting period ID if the argument is
    falsy, or if it matches the current reporting period ID
  */
async function isCurrent(periodID) {
    console.log(`isCurrent()`);
  const currentID = await getCurrentReportingPeriodID();

  if ( !periodID || (Number(periodID) === Number(currentID)) ) {
    return currentID;
  }
  return false;
}

/* closeReportingPeriod()
  */
async function closeReportingPeriod(user, period) {
  let reporting_period_id = await getCurrentReportingPeriodID();

  if (period && period !== reporting_period_id) {
    throw new Error(
      `The current reporting period (${reporting_period_id}) is not period ${period}`
    );
  }

  if ( await isClosed(reporting_period_id) ) {
    throw new Error(
      `Reporting period ${reporting_period_id} is already closed`
    );

  } else if (reporting_period_id > 1) {
    if ( !(await isClosed(reporting_period_id-1)) ) {
      throw new Error(
        `Prior reporting period ${reporting_period_id-1} is not closed`
      );
    }
  }

  // throws if there is no report in the period
  let latestTreasuryReport = await treasury.latestReport(period);

  await knex("reporting_periods")
    .where({ id: reporting_period_id })
    .update({
      certified_at: new Date().toISOString(),
      certified_by: user,
      final_report_file: latestTreasuryReport
    });

  await setCurrentReportingPeriod(reporting_period_id+1);

  return null;
}

/*                                 *  *  *                                    */
