/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/period-summaries.js
--------------------------------------------------------------------------------
  A period-summary record in postgres looks like this:

   id                                 | integer       |
   reporting_period_id                | integer       |
   project_code                       | text          |
   award_type                         | text          |
   award_number                       | text          |
   award_amount                       | numeric(19,2) |
   current_obligation                 | numeric(19,2) |
   current_expenditure                | numeric(19,2) |
   subrecipient_identification_number | text          |

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

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

module.exports = {
  getPeriodSummaries: getSummaries,
  getPriorPeriodSummaries,
  getReportedSubrecipientIds,
  readSummaries, // used by tests
  regenerate: regenerateSummaries,
  writeSummaries
}

async function readSummaries (reporting_period_id = 1) {
  const periodSummaries = await knex('period_summaries')
    .select('*')
    .where('reporting_period_id', reporting_period_id)
  return periodSummaries
}

/* getReportedSubrecipientIds() gets all the subrecipient IDs present in
  prior period summary records.
  The subrecipient ids have already been stripped of double quotes.
  */
async function getReportedSubrecipientIds () {
  const subrecipientIDs = await knex('period_summaries')
    .select('subrecipient_identification_number')
    .distinct()

  return subrecipientIDs.map(r => r.subrecipient_identification_number)
}

async function regenerateSummaries (reporting_period_id) {
  console.log('regenerateSummaries')
  console.dir(await knex('period_summaries').count('*'))
  log(`deleting summaries for period ${reporting_period_id}`)
  await knex('period_summaries')
    .where('reporting_period_id', reporting_period_id)
    .del()
  console.dir(await knex('period_summaries').count('*'))
  await writeSummaries(reporting_period_id)
  console.dir(await knex('period_summaries').count('*'))
  return null
}

async function writeSummaries (reporting_period_id) {
  log('writeSummaries()')
  const summaryData = await generateSummaries(reporting_period_id)

  if (summaryData.errors.length) {
    // console.dir(summaryData.errors)
    return summaryData.errors
  }
  log(
    `writing ${summaryData.periodSummaries.length} summaries for period ${reporting_period_id}`
  )
  return saveSummaries(summaryData.periodSummaries)
}

/*  getSummaries() returns the summaries for a reporting period. If no
  reporting period is specified, it returns summaries for the current
  reporting period.
  */
async function getSummaries (reporting_period_id) {
  if (!reporting_period_id) {
    log('getSummaries()')
    reporting_period_id = await getCurrentReportingPeriodID()
    if (_.isError(reporting_period_id)) {
      throw new Error('Failed to get current reporting period ID')
    }
  }
  const periodSummaries = await readSummaries(reporting_period_id)

  if (periodSummaries.length) {
    return { periodSummaries, errors: [] }
  }

  const summaryData = await generateSummaries(reporting_period_id)

  return summaryData
}

async function saveSummaries (periodSummaries) {
  const errLog = []
  let count = 0
  log(`saving ${periodSummaries.length} records`)

  for (let i = 0; i < periodSummaries.length; i++) {
    try {
      const { rowCount } = await knex('period_summaries').insert(periodSummaries[i])
      count += rowCount
    } catch (err) {
      // the ID might be a DUNS number
      const subrecipientID = periodSummaries[i].subrecipient_identification_number
      periodSummaries[i].subrecipient_identification_number = `DUNS${subrecipientID}`
      try {
        const { rowCount: rc } = await knex('period_summaries').insert(periodSummaries[i])
        count += rc
      } catch (err1) {
        // it wasn't a DUNS number - must be another error
        periodSummaries[i].subrecipient_identification_number = subrecipientID
        console.dir(periodSummaries[i])
        errLog.push(err.message)
      }
    }
  }
  log(`${count} records saved`)
  if (count !== periodSummaries.length) {
    console.log('Error log from saveSummaries():')
    console.dir(errLog)
  }
  return errLog
}

async function generateSummaries (reporting_period_id) {
  log(`Generating summaries for period ${reporting_period_id}`)
  const periodSummaries = []
  const errLog = []

  const mapPeriodSummaries = new Map()
  const documents = await documentsWithProjectCode(reporting_period_id)
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
    const jsonRow = document.content
    let awardNumber
    let awardAmount
    let currentExpenditure = jsonRow['total expenditure amount'] || 0
    const currentObligation = jsonRow['current quarter obligation']

    switch (document.type) {
      case 'contracts':
        awardNumber = jsonRow['contract number']
        awardAmount = jsonRow['contract amount']
        break
      case 'grants':
        awardNumber = jsonRow['award number']
        awardAmount = jsonRow['award amount']
        break
      case 'loans':
        awardNumber = jsonRow['loan number']
        awardAmount = jsonRow['loan amount'] || 0
        currentExpenditure = jsonRow['loan amount'] || 0
        break
      case 'transfers':
        awardNumber = jsonRow['transfer number']
        awardAmount = jsonRow['transfer amount']
        break
      case 'direct':
        // date needed in key for Airtable issue #92
        awardNumber = `${jsonRow['subrecipient id']}:${jsonRow['obligation date']}`
        awardAmount = jsonRow['obligation amount']
        break
    }

    switch (document.type) {
      case 'contracts':
      case 'grants':
      case 'loans':
      case 'transfers':
      case 'direct': {
        const key = `${document.project_code}:${document.type}:${awardNumber}`
        const rec = mapPeriodSummaries.get(key)
        if (rec) {
          if (currentObligation !== rec.current_obligation) {
            errLog.push(
              `Multiple current quarter obligations for ${key} - ${currentObligation}`
            )
          }
          rec.current_expenditure += currentExpenditure
        } else {
          mapPeriodSummaries.set(key, {
            reporting_period_id: reporting_period_id,
            project_code: document.project_code,
            award_type: document.type,
            subrecipient_identification_number: String(jsonRow['subrecipient id']).trim(),
            award_number: awardNumber,
            award_amount: awardAmount || 0,
            current_obligation: currentObligation || 0,
            current_expenditure: currentExpenditure || 0
          })
        }
        break
      }
      default:
        // ignore the other sheets
        break
    }
  })
  log(`Generated ${mapPeriodSummaries.size} summaries`)

  mapPeriodSummaries.forEach(
    periodSummary => periodSummaries.push(periodSummary)
  )
  // console.dir(periodSummaries);
  log(`Returning ${periodSummaries.length} summaries`)
  return { periodSummaries, errors: errLog }
}

/* getPriorPeriodSummaries() finds all the summaries for periods before
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

/*                                 *  *  *                                    */
