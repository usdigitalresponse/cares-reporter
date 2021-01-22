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

  const sheetData = await getAwardSheets(currentPeriodID)
  if (_.isError(sheetData)) {
    return sheetData
  }

  const aggregateAwardData = await getAggregateAwardData(currentPeriodID)
  if (_.isError(aggregateAwardData)) {
    return aggregateAwardData
  }

  sheetData['aggregate awards < 50000'] =
    await convertToAASheet(aggregateAwardData, currentPeriodID)

  const aggregatePaymentData = await getAggregatePaymentData()
  if (_.isError(aggregatePaymentData)) {
    return aggregatePaymentData
  }

  sheetData['aggregate payments individual'] =
    await convertToAPSheet(aggregatePaymentData, currentPeriodID)

  log('composing outputWorkbook')
  const outputWorkBook = await composeWorkbook(sheetData)
  if (_.isError(outputWorkBook)) {
    return outputWorkBook
  }

  const filename = 'summary-report.xlsx'
  return { filename, outputWorkBook }
}

async function getAwardSheets (currentPeriodID) {
  const awardData = await getAwardData()
  if (_.isError(awardData)) {
    return awardData
  }
  log(`awardData.length = ${awardData.length}`)

  return convertToSheets(awardData, currentPeriodID)
}

/* getAwardData() reads records from the period_summaries database and
  converts them into an array of awardData records and an array of
  errors.

  A awardData record looks like this:

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
async function getAwardData () {
  const rowsOut = []
  //

  const rawData = await getRawData()
  if (_.isError(rawData)) {
    return rawData
  }

  log(`${rawData.rows.length} rows:`)

  let awardNumber = ''
  let subrecipientID = ''
  let rowOut = { empty: null }

  for (let i = 0; i < rawData.rows.length; i++) {
    const rowIn = rawData.rows[i]

    if (!(rowIn.agency && rowIn.project)) {
      return new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
    }

    if (awardNumber !== rowIn.award_number ||
      subrecipientID !== rowIn.subrecipient_identification_number
    ) {
      awardNumber = rowIn.award_number
      subrecipientID = rowIn.subrecipient_identification_number

      rowsOut.push(rowOut) // save the completed previous rowOut
      rowOut = newRowOut(rowIn)
    }
    rowOut = addPeriod(rowOut, rowIn)
  }

  rowsOut.shift() // discard { empty: null } sentry
  return rowsOut

  function newRowOut (rowIn) {
    return {
      award_type: rowIn.award_type,
      agency: rowIn.agency,
      project: rowIn.project,
      legal_name: rowIn.legal_name,
      award_number: rowIn.award_number,
      period: []
    }
  }

  function addPeriod (rowOut, rowIn) {
    const period = Number(rowIn.reporting_period_id)
    rowOut.period[period - 1] = {
      amount: _.round((Number(rowIn.award_amount) || 0), 2) || null,
      obligation: _.round((Number(rowIn.current_obligation) || 0), 2) || null,
      expenditure: _.round((Number(rowIn.current_expenditure) || 0), 2) || null
    }
    return rowOut
  }

  async function getRawData () {
    try {
      return knex.raw(`
        select
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
      )
    } catch (err) {
      return err
    }
  }
}

/*  convertToSheets() converts an array of rowOut records to spreadsheet format
  awardData is an array of row objects:
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
async function convertToSheets (awardData, nPeriods) {
  const sheetData = {
    contracts: [],
    grants: [],
    loans: [],
    transfers: [],
    direct: []
  }
  await addColumnTitles(sheetData, nPeriods)

  awardData.forEach(row => {
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

async function getAggregateAwardData (currentPeriodID) {
  const rowsOut = []

  const rawData = await getRawData()
  if (_.isError(rawData)) {
    return rawData
  }

  let projectCode = ''
  let fundingType = ''
  let rowOut = { empty: null } // sentry

  for (let i = 0; i < rawData.rows.length; i++) {
    const rowIn = rawData.rows[i]

    if (!(rowIn.agency && rowIn.project)) {
      return new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
    }

    if (projectCode !== rowIn.project || fundingType !== rowIn.funding_type) {
      projectCode = rowIn.project
      fundingType = rowIn.funding_type

      rowsOut.push(rowOut) // save the completed previous rowOut
      rowOut = {
        agency: rowIn.agency,
        project: rowIn.project,
        funding_type: rowIn.funding_type,
        period: []
      }
    }

    if (rowIn.obligation || rowIn.expenditure) {
      rowOut.period[Number(rowIn.reporting_period_id) - 1] = {
        obligation: _.round((Number(rowIn.obligation) || 0), 2) || null,
        expenditure: _.round((Number(rowIn.expenditure) || 0), 2) || null
      }
    }
  }

  rowsOut.shift() // discard { empty: null } sentry
  return rowsOut

  async function getRawData () {
    try {
      return knex.raw(`
        select
          a.code as Agency,
          p.code as Project,
          u.reporting_period_id,
          d.content->>'funding type' as funding_type,
          d.content->>'current quarter obligation' as obligation,
          d.content->>'current quarter expenditure/payments' as expenditure
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
      )
    } catch (err) {
      return err
    }
  }
}

/*  convertToAASheet() converts an array of rowOut records to spreadsheet format
  aaData is an array of row objects:
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
async function convertToAASheet (aaData, nPeriods) {
  const sheetData = []
  await addAAColumnTitles(sheetData, nPeriods)

  aaData.forEach(row => {
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

async function addAAColumnTitles (sheetData, nPeriods) {
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

/*
  Aggregate Payments Individual
    1.  Agency Code
    2.  Project ID[SLE(5]
    3.  Current Quarter Obligation (column B), each period
      a.  Formula: Cumulative Obligation Amount
    4.  Current Quarter Expenditure (column C), each period
      a.  Formula: Cumulative Expenditure Amount

  */
async function getAggregatePaymentData () {
  const rowsOut = []

  const rawData = await getRawData()
  if (_.isError(rawData)) {
    return rawData
  }

  let projectCode = ''
  let rowOut = { empty: null } // sentry

  for (let i = 0; i < rawData.rows.length; i++) {
    const rowIn = rawData.rows[i]

    if (!(rowIn.agency && rowIn.project)) {
      return new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
    }

    if (projectCode !== rowIn.project) {
      projectCode = rowIn.project

      rowsOut.push(rowOut) // save the completed previous rowOut
      rowOut = {
        agency: rowIn.agency,
        project: rowIn.project,
        period: []
      }
    }

    if (rowIn.obligation || rowIn.expenditure) {
      rowOut.period[Number(rowIn.reporting_period_id) - 1] = {
        obligation: _.round((Number(rowIn.obligation) || 0), 2) || null,
        expenditure: _.round((Number(rowIn.expenditure) || 0), 2) || null
      }
    }
  }

  rowsOut.shift() // discard { empty: null } sentry
  return rowsOut

  async function getRawData () {
    try {
      return knex.raw(`
        select
          a.code as Agency,
          p.code as Project,
          u.reporting_period_id,
          d.content->>'current quarter obligation' as obligation,
          d.content->>'current quarter expenditure' as expenditure
        from documents as d
        left join uploads as u on d.upload_id = u.id
        left join projects as p on p.id = u.project_id
        left join agencies as a on a.id = u.agency_id
        where d.type='aggregate payments individual'
        order by
          p.code
        ;`
      )
    } catch (err) {
      return err
    }
  }
}

async function convertToAPSheet (apData, nPeriods) {
  const sheetData = []
  await addAPColumnTitles(sheetData, nPeriods)

  apData.forEach(row => {
    const aoaRow = [
      row.agency,
      row.project
    ]
    for (let i = 0; i < nPeriods; i++) {
      const period = row.period[i] || {}
      aoaRow.push(period.obligation || null)
      aoaRow.push(period.expenditure || null)
    }
    sheetData.push(aoaRow)
  })
  return sheetData
}

async function addAPColumnTitles (sheetData, nPeriods) {
  const line1 = [null, null]
  const line2 = ['Agency', 'Project']
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`Period ${i}`)
    line1.push(null)

    line2.push('Obligation Amount')
    line2.push('Expenditure Amount')
  }
  sheetData.push(line1)
  sheetData.push(line2)
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

/*                                  *  *  *                                   */
