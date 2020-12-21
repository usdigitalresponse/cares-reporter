const knex = require("./connection");

/*  applicationSettings() returns
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    reporting_template: 'OBM Reporting Template.xlsx',
    duns_number: '809031776'
  }
  */
function applicationSettings() {
  return currentReportingPeriod();
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
function currentReportingPeriod() {
  return knex("application_settings")
    .join(
      "reporting_periods",
      "application_settings.current_reporting_period_id",
      "reporting_periods.id"
    )
    .select("*")
    .then(rv=> rv[0]);
}

module.exports = {
  applicationSettings,
  currentReportingPeriod
};
