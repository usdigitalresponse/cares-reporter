/*
--------------------------------------------------------------------------------
-                           db/reporting-periods.js
--------------------------------------------------------------------------------
  A period-summary record in postgres looks like this:

  {
    "id" - auto-increment
    "period" - a digit
    "project" - a project code
    "type" - the name of the tab - Contract, Grant, Loan, Transfer or Direct
    "cumulative_obligation" - currency
    "cumulative_expenditure"- currency
    "certified_by" - user id
    "certified_at" - timestamp
  });

*/
const knex = require("./connection");

module.exports = {
  reportingPeriods,
  periodSummaries,
  close
};


function reportingPeriods() {
  return knex("reporting_periods")
    .select("*")
    .orderBy("end_date", "desc");
}

async function periodSummaries() {
  return "Get -- OK";

  // return new Promise(
  //   () => {
  //   },
  //   err => {
  //     console.log(err.message);
  //   }
  // );
}

async function close() {
  return "Closing current reporting period -- OK";
  // return new Promise(
  //   () => {
  //   },
  //   err => {
  //     console.log(err.message);
  //   }
  // );
}

/*                                 *  *  *                                    */
