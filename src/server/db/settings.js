const knex = require("./connection");

function reportingPeriods() {
  return knex("reporting_periods")
    .select("*")
    .orderBy("end_date", "desc");
}

function applicationSettings() {
  return knex("application_settings")
    .select("*")
    .then(r => r[0]);
}

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
