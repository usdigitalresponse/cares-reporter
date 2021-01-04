/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/period-summaries.js
--------------------------------------------------------------------------------
  A period-summary record in postgres looks like this:

    id                  | integer       |
    reporting_period_id | integer       |
    project_code        | text          |
    award_type          | text          |
    award_number        | text          |
    current_obligation  | numeric(19,2) |
    current_expenditure | numeric(19,2) |

  There is one summary for each line of each input spreadsheet (i.e. each
  record in the documents db table), and all it does is to pull some
  information out of the content column and make it more easily searchable
  by SQL.

  The project_code and reporting_period_id fields identify the source
  upload spreadsheet.

  The award_type field identifies the tab in the source spreadsheet.

  The award_number field aggregates multiple (if any) rows in the source
  spreadsheet for that award.

*/
const knex = require('./connection')
const { documentsWithProjectCode } = require('./documents')
const { getCurrentReportingPeriodID } = require('./settings')

const _ = require('lodash')

module.exports = {
  closeReportingPeriod,
  getPeriodSummaries: getSummaries,
  getPriorPeriodSummaries,
  getReportedSubrecipientIds,
  readSummaries, // used by tests
  updateSummaries, // use once to fix dabase on period 1
  writeSummaries
}

async function readSummaries (reporting_period_id = 1) {
  let periodSummaries = await knex('period_summaries')
    .select('*')
    .where('reporting_period_id', reporting_period_id)
  return periodSummaries
}

async function getReportedSubrecipientIds () {
  let subrecipientIDs = await knex('period_summaries')
    .select('subrecipient_identification_number')
    .distinct()

  return subrecipientIDs
}

async function writeSummaries (reporting_period_id) {
  let summaryData = await generateSummaries(reporting_period_id)

  if (summaryData.errors.length) {
    return summaryData.errors
  }

  return saveSummaries(summaryData.periodSummaries)
}

/*  getSummaries() returns the summaries for a reporting period. If no
  reporting period is specified, it returns summaries for the current
  reporting period.
  */
async function getSummaries (reporting_period_id) {
  if (!reporting_period_id) {
    console.log(`getSummaries()`)
    reporting_period_id = await getCurrentReportingPeriodID()
    if (_.isError(reporting_period_id)) {
      throw new Error('Failed to get current reporting period ID')
    }
  }
  let periodSummaries = await readSummaries(reporting_period_id)

  if (periodSummaries.length) {
    return { periodSummaries, errors: [] }
  }

  let summaryData = await generateSummaries(reporting_period_id)

  return summaryData
}

async function saveSummaries (periodSummaries) {
  let errLog = []

  for (let i = 0; i < periodSummaries.length; i++) {
    try {
      await knex('period_summaries').insert(periodSummaries[i])
    } catch (err) {
      errLog.push(err.detail)
    }
  }

  return errLog
}

async function generateSummaries (reporting_period_id) {
  let periodSummaries = []
  let errLog = []

  let mapPeriodSummaries = new Map()
  let documents = await documentsWithProjectCode(reporting_period_id)
  if (_.isError(documents)) {
    return {
      errors: [documents.message]
    }
  }
  if (documents.length === 0) {
    return {
      periodSummaries,
      errors: [`No records in period ${reporting_period_id}`]
    }
  }

  documents.forEach(document => {
    let awardNumber
    let jsonRow = document.content
    let obligation = jsonRow['current quarter obligation']
    let amount = jsonRow['total expenditure amount'] || 0

    switch (document.type) {
      case 'contracts':
        awardNumber = jsonRow['contract number']
        break
      case 'grants':
        awardNumber = jsonRow['award number']
        break
      case 'loans':
        awardNumber = jsonRow['loan number']
        amount = jsonRow['loan amount'] || 0
        break
      case 'transfers':
        awardNumber = jsonRow['transfer number']
        break
      case 'direct':
        // date needed in key for Airtable issue #92
        awardNumber = `${jsonRow['subrecipient id']}:${jsonRow['obligation date']}`
        break
    }

    switch (document.type) {
      case 'contracts':
      case 'grants':
      case 'loans':
      case 'transfers':
      case 'direct': {
        let key = `${document.project_code}:${document.type}:${awardNumber}`
        let rec = mapPeriodSummaries.get(key)
        if (rec) {
          if (obligation !== rec.current_obligation) {
            errLog.push(
              `Multiple current quarter obligations for ${key} - ${obligation}`
            )
          }
          rec.current_expenditure += amount
        } else {
          mapPeriodSummaries.set(key, {
            reporting_period_id: reporting_period_id,
            project_code: document.project_code,
            award_type: document.type,
            subrecipient_identification_number: jsonRow['subrecipient id'],
            award_number: awardNumber,
            current_obligation: obligation,
            current_expenditure: amount
          })
        }
        break
      }
      default:
        // ignore the other sheets
        break
    }
  })

  mapPeriodSummaries.forEach(
    periodSummary => periodSummaries.push(periodSummary)
  )
  // console.dir(periodSummaries);
  return { periodSummaries, errors: errLog }
}

/* getPriorPeriodSummares() finds all the summaries for periods before
  the report_period_id argument.
  */
async function getPriorPeriodSummaries (reporting_period_id) {
  const query = `select p.id, p.start_date, p.end_date
    from reporting_periods p, reporting_periods r
    where p.end_date < r.start_date and r.id = ${reporting_period_id}
    order by p.end_date, p.id desc
    limit 1`
  const result = await knex.raw(query).then(r => r.rows ? r.rows[0] : null)
  if (!result) {
    return { periodSummaries: [] }
  }
  return getSummaries(result.id)
}

/* closeReportingPeriod() closes a reporting period by writing the period
  summaries to the database.
  */
async function closeReportingPeriod (reporting_period_id) {
  let errLog = []

  let { periodSummaries, closed } = await getSummaries(reporting_period_id)

  if (closed) {
    return [`Reporting period ${reporting_period_id} is already closed`]
  }

  periodSummaries.forEach(async periodSummary => {
    try {
      await knex('period_summaries').insert(periodSummary)
    } catch (err) {
      errLog.push(err.detail)
    }
  })
  if (errLog.length) {
    return errLog
  }

  closed = (await getSummaries(reporting_period_id)).closed
  if (!closed) {
    return [`Failed to close reporting period ${reporting_period_id}`]
  }

  return null
}

async function updateSummaries (reporting_period_id) {
  let documents = await documentsWithProjectCode(reporting_period_id)
  if (_.isError(documents)) {
    return {
      errors: [documents.message]
    }
  }
  for (let i = 0; i < documents.length; i++) {
    let document = documents[i]
    let jsonRow = document.content

    let awardNumber

    switch (document.type) {
      case 'contracts':
        awardNumber = jsonRow['contract number']
        break
      case 'grants':
        awardNumber = jsonRow['award number']
        break
      case 'loans':
        awardNumber = jsonRow['loan number']
        break
      case 'transfers':
        awardNumber = jsonRow['transfer number']
        break
      case 'direct':
        // date needed in key for Airtable issue #92
        awardNumber = `${jsonRow['subrecipient id']}:${jsonRow['obligation date']}`
        break
    }
    switch (document.type) {
      case 'contracts':
      case 'grants':
      case 'loans':
      case 'transfers':
      case 'direct': {
        await knex('period_summaries')
          .where({
            reporting_period_id: reporting_period_id,
            project_code: document.project_code,
            award_type: document.type,
            award_number: awardNumber
          })
          .update({
            subrecipient_identification_number: jsonRow['subrecipient id']
          })
        break
      }
      default:
        // ignore the other sheets
        break
    }
  }
}

/*                                 *  *  *                                    */
