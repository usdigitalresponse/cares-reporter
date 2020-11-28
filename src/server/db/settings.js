const knex = require("./connection");

function reportingPeriods() {
  return knex("reporting_periods")
    .select("*")
    .orderBy("end_date", "desc");
}

/*  applicationSettings() returns
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    reporting_template: 'OBM Reporting Template.xlsx',
    duns_number: '809031776'
  }
  */
function applicationSettings() {
  return knex("application_settings")
    .select("*")
    .then(r => r[0]);
}

/* currentReportingPeriod() returns:
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    reporting_template: 'OBM Reporting Template.xlsx',
    duns_number: '809031776',
    id: 1,
    name: 'September 2020',
    start_date: 2020-03-01T06:00:00.000Z,
    end_date: 2020-09-30T05:00:00.000Z,
    period_of_performance_end_date: 2020-12-30T06:00:00.000Z
  }
 */
async function currentReportingPeriod() {
  const result = await knex("application_settings")
    .join(
      "reporting_periods",
      "application_settings.current_reporting_period_id",
      "reporting_periods.id"
    )
    .select("*");
  return result[0];
}

module.exports = {
  applicationSettings,
  currentReportingPeriod,
  reportingPeriods
};
