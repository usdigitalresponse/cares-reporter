const knex = require('./connection')
let currentReportingPeriodID = null

// setCurrentReportingPeriod()
function setCurrentReportingPeriod (id) {
  currentReportingPeriodID = id
  return knex('application_settings')
    .update('current_reporting_period_id', id)
}

// update application_settings set current_reporting_period_id=1;
async function getCurrentReportingPeriodID () {
  if (currentReportingPeriodID !== null) {
    return currentReportingPeriodID
  }
  let crpID
  try {
    crpID = await knex('application_settings')
      .select('*')
      .then(r => {
        currentReportingPeriodID = r[0].current_reporting_period_id
        return currentReportingPeriodID
      })
  } catch (err) {
    console.dir(err)
    return err
  }
  return crpID
}

/*  applicationSettings() returns
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    reporting_template: 'OBM Reporting Template.xlsx',
    duns_number: '809031776'
  }
  */
function applicationSettings () {
  return currentReportingPeriodSettings()
}

/* currentReportingPeriodSettings() returns:
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

  reporting period record in db:
    id
    name
    start_date
    end_date
    period_of_performance_end_date
    certified_at
    certified_by
    reporting_template
    validation_rule_tags
 */
async function currentReportingPeriodSettings () {
  let rv
  try {
    rv = await knex('application_settings')
      .join(
        'reporting_periods',
        'application_settings.current_reporting_period_id',
        'reporting_periods.id'
      )
      .select('*')
      .then(rv => rv[0])
  } catch (err) {
    console.dir(err)
  }
  return rv
}

module.exports = {
  applicationSettings,
  currentReportingPeriodSettings,
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
}

/*                                 *  *  *                                    */
