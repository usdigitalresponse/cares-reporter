/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           lib/summary-report.js
--------------------------------------------------------------------------------
  Summary Report spec

  Contracts Tab
    1.  Agency Code (alpha code from Cover tab column A)
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Contract Number[SLE(1]
    Columns 5, 6, 7 should repeat for each period
      5.  Contract Amount (column F), each period[SLE(2]
        a.  Formula: current period Contract Amount – prior period Contract
            Amount = Current Quarter Obligation.  If not equal, need error
            message.
      6.  Current Quarter Obligation (column R), each period –
        a.  Formula: Cumulative Obligation Amount = sum of the quarterly
            obligation amounts
        b.  Formula: Cumulative Obligation Amount = current period Contract
            Amount.  If not equal, need error message.
      7.  Total Expenditure Amount (column U), each period
        a.  Formula: Cumulative Expenditure [SLE(3] Amount = sum of the
            quarterly expenditure amounts
        b.  Formula: Cumulative Expenditure Amount ≤ Cumulative Obligation
            Amount.  If not, need error message.

  Grants Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Award Number
    5.  Award Amount (column F), each period
      a.  Same as contracts
    6.  Current Quarter Obligation (column T), each period
      a. Same as contracts
    7.  Total Expenditure Amount (column W), each period
      a.  Same as contracts

  Loans Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Loan Number
    5.  Loan Amount (column E), each period
      a.  Formula: current period Loan Amount – prior period Loan Amount =
          Current Quarter Obligation.  If not equal, need error message.
    6.  Current Quarter Obligation (column P), each period
      a.  Formula: Cumulative Obligation Amount
      b.  Formula: Cumulative Obligation Amount = current period Loan
          Amount.  If not equal, need error message.

  Transfers Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Transfer Number
    5.  Transfer Amount (column E), each period
      a.  Same as grants
    6.  Current Quarter Obligation (column I), each period
      a.  Same as grants
    7.  Total Expenditure Amount (column L), each period
      a.  Same as grants

  Direct Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Award date
    5.  Obligation Amount (column B), each period
      a.  Same as grants.
    6.  Current Quarter Obligation (column E), each period
      a.  Same as grants
    7.  Total Expenditure Amount (column I), each period
      a.  Same as grants

  Aggregate Awards < 50000
    1.  Agency Code
    2.  Project ID
    3.  Funding Type[SLE(4]  (one row per funding type, per project)
    4.  Current Quarter Obligation (column C), each period
    a.  Formula: Cumulative Obligation Amount
    5.  Current Quarter Expenditure/Payments (column D), each period
      a.  Formula: Cumulative Expenditure Amount
      b.  Formula: Cumulative Expenditure Amount ≤ Cumulative Obligation
          Amount.  If not, need error message.

  Aggregate Payments Individual
    1.  Agency Code
    2.  Project ID[SLE(5]
    3.  Current Quarter Obligation (column B), each period
      a.  Formula: Cumulative Obligation Amount
    4.  Current Quarter Expenditure (column C), each period
      a.  Formula: Cumulative Expenditure Amount

*/
const knex = require('../db/connection')
const _ = require('lodash')
const XLSX = require('xlsx')

const { getCurrentReportingPeriodID } = require('../db/settings')
const { fixCellFormats } = require('../services/fix-cell-formats')
const periodSummaries = require('../db/period-summaries')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}
let dir = () => {}
if (process.env.VERBOSE) {
  dir = console.dir
}

module.exports = { generate: generateReport }

/*  generateReport generates a fresh Summary Report spreadsheet
    and writes it out if successful.
    */
async function generateReport () {
  const currentPeriodID = await getCurrentReportingPeriodID()
  log(`generateReport() for period ${currentPeriodID}`)

  await periodSummaries.regenerate(currentPeriodID)

  const lineData = await getLineData()
  if (_.isError(lineData)) {
    return lineData
  }
  log(`lineData.length = ${lineData.length}`)

  const sheetData = await convertToSheets(lineData, currentPeriodID)
  // dir(sheetData, { depth: 4 })
  if (_.isError(sheetData)) {
    return sheetData
  }

  const aggregateAwardData = await getAggregateAwardData(currentPeriodID)
  if (_.isError(aggregateAwardData)) {
    return aggregateAwardData
  }

  log(`aggregateAwardData.length = ${aggregateAwardData.length}`)
  sheetData['aggregate awards < 50000'] = await convertToAASheet(aggregateAwardData, currentPeriodID)
  // const s = await convertToAASheet(aggregateAwardData)
  // console.dir(s)

  log('composing outputWorkbook')
  const outputWorkBook = await composeWorkbook(sheetData)
  if (_.isError(outputWorkBook)) {
    return outputWorkBook
  }

  const filename = 'summary-report.xlsx'
  return { filename, outputWorkBook }
}

/* getLineData() reads records from the period_summaries database and
  converts them into an array of lineData records and an array of
  errors.

  A lineData record looks like this:

    {
      award_type: row.award_type,
      agency: row.agency,
      project: row.project,
      legal_name: row.legal_name,
      award_number: row.award_number,
      period: [
        { amount: row.award_amount,
          obligation: row.current_obligation,
          expenditure: row.current_expenditure
        },
        ...
      ]
    }
  */
async function getLineData () {
  const lineData = []
  //
  const query = `select
      s.reporting_period_id,
      s.award_type,
      a.code as Agency,
      s.project_code as Project,
      s.subrecipient_identification_number,
      r.legal_name,
      s.award_number,
      s.award_amount,
      s.current_obligation,
      s.current_expenditure
    from period_summaries as s
    left join projects as p on p.code = s.project_code
    left join agencies as a on a.id = p.agency_id
    left join subrecipients as r on
      r.identification_number = s.subrecipient_identification_number
    order by
      s.award_type,
      a.code,
      s.project_code,
      s.subrecipient_identification_number,
      s.award_number,
      s.reporting_period_id
    ;`

  let rawData
  try {
    rawData = await knex.raw(query)
  } catch (err) {
    return err
  }
  log(`${rawData.rows.length} rows:`)

  let awardNumber = ''
  let subrecipientID = ''
  let line = { empty: null }
  rawData.rows.forEach(row => {
    if (!(row.award_number === awardNumber &&
      row.subrecipient_identification_number === subrecipientID
    )) {
      lineData.push(line) // save the completed previous line
      line = newLine(row)
      awardNumber = row.award_number
      subrecipientID = row.subrecipient_identification_number
    }
    line = addPeriod(line, row)
  })
  lineData.shift() // discard empty first line
  return lineData

  function newLine (row) {
    return {
      award_type: row.award_type,
      agency: row.agency,
      project: row.project,
      legal_name: row.legal_name,
      award_number: row.award_number,
      period: []
    }
  }

  function addPeriod (line, row) {
    const period = Number(row.reporting_period_id)
    line.period[period - 1] = {
      amount: row.award_amount,
      obligation: row.current_obligation,
      expenditure: row.current_expenditure
    }
    return line
  }
}

/*  convertToSheets() converts an array of line records to spreadsheet format
*/
async function convertToSheets (lineData, nPeriods) {
  /* lineData is an array of row objects:
    {
      award_type: 'contracts',
      agency: 'DOH01',
      project: '440674',
      legal_name: 'MERCURY SERVICE',
      award_number: 'DOH0000060517',
      period: [
        { amount: '50000',
          obligation: '50000.00',
          expenditure: '50000.00'
        } (or it can be null),
        ...
      ]
    }
  */

  const sheetData = {
    contracts: [],
    grants: [],
    loans: [],
    transfers: [],
    direct: []
  }
  await addColumnTitles(sheetData, nPeriods)

  lineData.forEach(row => {
    let awardNumber = row.award_number
    if (row.award_type === 'direct') { // get the date
      awardNumber = Number(awardNumber.split(':').pop())
    }
    const aoaRow = [
      row.agency,
      row.project,
      row.legal_name,
      awardNumber
    ]
    for (let i = 0; i < nPeriods; i++) {
      const period = row.period[i] || {}
      aoaRow.push(Number(period.amount) || null)
      aoaRow.push(Number(period.obligation) || null)
      aoaRow.push(Number(period.expenditure) || null)
    }
    sheetData[row.award_type].push(aoaRow)
  })
  return sheetData
}

/*  convertToAASheet() converts an array of line records to spreadsheet format
*/
async function convertToAASheet (lineData, nPeriods) {
  /* lineData is an array of row objects:
    {
      agency: row.agency,
      project: row.project,
      funding_type: row['funding type'],
      period: [
        { obligation: '50000.00',
          expenditure: '50000.00'
        } (or it can be null),
        ...
      ]
    }
  */

  const sheetData = []
  await addAaColumnTitles(sheetData, nPeriods)

  lineData.forEach(row => {
    const aoaRow = [
      row.agency,
      row.project,
      row.funding_type
    ]
    for (let i = 0; i < nPeriods; i++) {
      const period = row.period[i] || {}
      aoaRow.push(Number(period.obligation) || null)
      aoaRow.push(Number(period.expenditure) || null)
    }
    sheetData.push(aoaRow)
  })
  return sheetData
}

async function composeWorkbook (sheetData) {
  const workbook = XLSX.utils.book_new()
  const sheetNames = [
    'Contracts',
    'Grants',
    'Loans',
    'Transfers',
    'Direct',
    'Aggregate Awards < 50000',
    'Aggregate Payments Individual'
  ]

  sheetNames.forEach(async sheetName => {
    const sheetIn = sheetData[sheetName.toLowerCase()] || []

    const sheetOut = XLSX.utils.aoa_to_sheet(sheetIn)
    fixCellFormats(sheetOut, 2, '#,##0.00')

    try {
      await XLSX.utils.book_append_sheet(
        workbook, sheetOut, sheetName
      )
    } catch (err) {
      console.dir(err)
      return err
    }
  })
  const outputWorkbook =
    XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

  return outputWorkbook
}

async function addColumnTitles (sheetData, nPeriods) {
  const numbers = {
    contracts: 'Contract Number',
    grants: 'Grant Number',
    loans: 'Loan Number',
    transfers: 'Transfer Number',
    direct: 'Payment Date'
  }

  const line1 = [null, null, null, null]
  const line2 = ['Agency', 'Project', 'Sub-recipient', 'numbers']
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`Period ${i}`)
    line1.push(null)
    line1.push(null)

    line2.push('Amount')
    line2.push('Obligation Amount')
    line2.push('Expenditure Amount')
  }
  Object.keys(sheetData).forEach(sheetName => {
    const l2 = line2.slice(0)
    l2[3] = numbers[sheetName]
    // log(`sheetName: ${sheetName}, numbers[sheetName]: ${numbers[sheetName]}`)
    sheetData[sheetName].push(line1)
    sheetData[sheetName].push(l2)
  })
}

async function addAaColumnTitles (sheetData, nPeriods) {
  const line1 = [null, null, null]
  const line2 = ['Agency', 'Project', 'Funding Type']
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`Period ${i}`)
    line1.push(null)

    line2.push('Obligation Amount')
    line2.push('Expenditure Amount')
  }
  sheetData.push(line1)
  sheetData.push(line2)
}

async function getAggregateAwardData (currentPeriodID) {
  const lineData = []
  const query = `select
      a.code as Agency,
      p.code as Project,
      u.reporting_period_id,
      d.content
    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    where d.type='aggregate awards < 50000'
    order by
      a.code,
      p.code,
      d.content->>'funding type'
    ;`
  let rawData
  try {
    rawData = await knex.raw(query)
  } catch (err) {
    console.dir(err)
    return err
  }

  let projectCode = ''
  let fundingType = ''
  let line = { empty: null }

  rawData.rows.forEach(rRow => {
    if (!rRow.project) {
      console.log('Empty row!')
      console.dir(rRow)
      return
    }
    const row = rRow.content
    row.agency = rRow.agency
    row.project = rRow.project
    row.reporting_period_id = rRow.reporting_period_id

    if (!(row.project === projectCode &&
      row['funding type'] === fundingType
    )) {
      lineData.push(line) // save the completed previous line
      line = newLine(row)
      projectCode = row.project
      fundingType = row['funding type']
    }
    addPeriod(line, row)
  })
  lineData.shift() // discard empty first line
  return lineData

  function newLine (row) {
    if (!row.agency) {
      console.dir(row)
    }
    console.log(`adding line: ${row.agency}:${row.project}:${row['funding type']}`)
    return {
      agency: row.agency,
      project: row.project,
      funding_type: row['funding type'],
      period: []
    }
  }

  function addPeriod (line, row) {
    const period = Number(row.reporting_period_id)
    // if (!row['updates this quarter?']) {
    //   console.log('updates this quarter? is blank')
    //   return
    // }
    // if (String(row['updates this quarter?']).toLowerCase() === 'yes') {
    if (row['current quarter obligation'] ||
      row['current quarter expenditure/payments']
    ) {
      line.period[period - 1] = {
        obligation: Number(row['current quarter obligation']) || 0,
        expenditure: Number(row['current quarter expenditure/payments']) || 0
      }
    }
  }
}

/*                                  *  *  *                                   */
