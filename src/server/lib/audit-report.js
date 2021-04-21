/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           lib/audit-report.js
--------------------------------------------------------------------------------

*/
const _ = require('lodash')
const XLSX = require('xlsx')
const { getCurrentReportingPeriodID } = require('../db/settings')
const { format } = require('date-fns')
const { fixCellFormats } = require('../services/fix-cell-formats')
const reportingPeriods = require('../db/reporting-periods')

const {
  getAggregateAwardData,
  getAggregatePaymentData,
  getProjectSummaryData,
  getAwardData
} = require('../db/audit-report')

const to$ = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format

let endDates

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}
// let dir = () => {}
// if (process.env.VERBOSE) {
//   dir = console.dir
// }

module.exports = { generate: generateReport }

/*  generateReport generates a fresh Audit Report spreadsheet
    and writes it out if successful.
    */
async function generateReport () {
  endDates = await reportingPeriods.getEndDates()
  endDates = endDates.map(ed => format(new Date(ed.end_date), 'M/d/yy'))
  endDates.unshift(null) // because the first period is period 1

  const nPeriods = await getCurrentReportingPeriodID()
  log(`generateReport() for ${nPeriods} periods`)

  const contracts = createAwardSheet('contracts', nPeriods)
  const grants = createAwardSheet('grants', nPeriods)
  const loans = createAwardSheet('loans', nPeriods)
  const transfers = createAwardSheet('transfers', nPeriods)
  const direct = createAwardSheet('direct', nPeriods)
  const aa = createAwardAggregateSheet(nPeriods)
  const ap = createAggregatePaymentSheet(nPeriods)
  const ps = createProjectSummarySheet(nPeriods)

  let sheets
  try {
    sheets = {
      contracts: await contracts,
      grants: await grants,
      loans: await loans,
      transfers: await transfers,
      direct: await direct,
      'aggregate awards < 50000': await aa,
      'aggregate payments individual': await ap,
      'project summaries': await ps
    }
  } catch (err) {
    return err
  }

  for (const key in sheets) {
    if (_.isError(sheets[key])) {
      return sheets[key]
    }
  }

  const outputWorkBook = await composeWorkbook(sheets)

  if (_.isError(outputWorkBook)) {
    return outputWorkBook
  }

  const filename = `audit report ${format(new Date(), 'yy-MM-dd')}.xlsx`
  return { filename, outputWorkBook }
}

async function createAwardSheet (type, nPeriods) {
  log(`createAwardSheet(${type}, ${nPeriods})`)
  let errorRows
  const sheet = []
  try {
    const sqlRows = await getAwardData(type)
    const rowData = consolidatePeriods(sqlRows, type)
    errorRows = addErrorChecks(rowData, type, nPeriods)
    await addAwardSheetColumnTitles(sheet, type, nPeriods)
    addDataRows(rowData)
  } catch (err) {
    return err
  }
  log(`${type} sheet completed`)

  return { errorRows: errorRows, sheet: sheet }

  function addDataRows (rowData) {
    rowData.forEach(row => {
      const aoaRow = [
        row.agency,
        row.project,
        row.legal_name,
        // force it to display as a date
        type === 'direct' ? Number(row.award_number) : row.award_number
      ]
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || { amount: null, obligation: null, expenditure: null }
        aoaRow.push(period.amount)
      }
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || { amount: null, obligation: null, expenditure: null }
        aoaRow.push(period.obligation)
      }
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || { amount: null, obligation: null, expenditure: null }
        aoaRow.push(period.expenditure)
      }
      if (row.errors) {
        aoaRow.push(row.errors)
      }
      sheet.push(aoaRow)
    })
  }
}

/*  consolidatePeriods() combines rows that have the same award number and
  subrecipient id.

  The subrecipient id check is needed for the direct tab, because it is
  possible that two different subrecipients got a direct payment on the
  same day, and the date is the only key for direct payments.

  */
function consolidatePeriods (sqlRows, type) {
  const rowsOut = []

  let awardNumber = ''
  let subrecipientID = ''
  let rowOut = { empty: null }

  for (let i = 0; i < sqlRows.length; i++) {
    const rowIn = sqlRows[i]

    if (!(rowIn.agency && rowIn.project)) {
      throw new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
    }
    // 21 04 20 added the 'trim' because somehow some contract ids had
    // gotten into the RI database with leading or trailing blanks:
    // Project: 138, Contract: 3692045
    // Project 194, Contract: 3696764
    if (awardNumber !== rowIn.award_number.trim() ||
      (subrecipientID !== String(rowIn.subrecipient_id) && type === 'direct')
    ) {
      awardNumber = rowIn.award_number.trim()
      subrecipientID = String(rowIn.subrecipient_id)

      rowsOut.push(rowOut) // save the completed previous rowOut
      rowOut = newRowOut(rowIn, type)
    }
    addPeriod(rowOut, rowIn)
  }
  rowsOut.push(rowOut) // save the final rowOut
  rowsOut.shift() // discard { empty: null } sentry
  return rowsOut

  function newRowOut (rowIn, type) {
    return {
      award_type: type,
      agency: rowIn.agency,
      project: rowIn.project,
      legal_name: rowIn.legal_name,
      award_number: rowIn.award_number,
      period: []
    }
  }

  function addPeriod (rowOut, rowIn) {
    const period = Number(rowIn.reporting_period_id)
    const i = period - 1
    if (rowOut.period[i]) {
      rowOut.period[i].expenditure += getAmount(rowIn.current_expenditure)
    } else {
      rowOut.period[i] = {
        amount: getAmount(rowIn.award_amount),
        obligation: getAmount(rowIn.current_obligation),
        expenditure: getAmount(rowIn.current_expenditure)
      }
    }
  }
}

async function addAwardSheetColumnTitles (sheet, type, nPeriods) {
  log(`addAwardSheetColumnTitles(${type}) for ${nPeriods} periods`)
  const awardNumber = {
    contracts: 'Contract Number',
    grants: 'Grant Number',
    loans: 'Loan Number',
    transfers: 'Transfer Number',
    direct: 'Payment Date'
  }[type]

  const line1 = ['Agency', 'Project', 'Sub-recipient', awardNumber]
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`${endDates[i]} Amount`)
  }
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`${endDates[i]} Obligation Amount`)
  }
  for (let i = 1; i <= nPeriods; i++) {
    line1.push(`${endDates[i]} Expenditure Amount`)
  }
  line1.push('Errors')
  sheet.push(line1)
}

async function createAwardAggregateSheet (nPeriods) {
  log(`createAwardAggregateSheet(${nPeriods} periods)`)
  let errorRows = 0
  const sheet = []
  try {
    const sqlRows = await getAggregateAwardData()
    const rowData = consolidatePeriods(sqlRows)
    errorRows = addErrorChecks(rowData, 'Aggregate Awards < 50000', nPeriods)
    addColumnTitles(sheet, nPeriods)
    addDataRows(sheet, rowData, nPeriods)
  } catch (err) {
    return err
  }
  log('Award Aggregate sheet completed')
  return { errorRows: errorRows, sheet: sheet }

  function consolidatePeriods (rowsIn) {
    const rowsOut = []
    let projectCode = ''
    let fundingType = ''
    let rowOut = { empty: null } // sentry

    for (let i = 0; i < rowsIn.length; i++) {
      const rowIn = rowsIn[i]

      if (!(rowIn.agency && rowIn.project)) {
        throw new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
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
          obligation: getAmount(rowIn.obligation),
          expenditure: getAmount(rowIn.expenditure)
        }
      }
    }
    rowsOut.push(rowOut) // save the final rowOut
    rowsOut.shift() // discard { empty: null } sentry
    return rowsOut
  }

  function addColumnTitles (sheet, nPeriods) {
    log(`createAwardAggregateSheet/addColumnTitles(${nPeriods})`)
    const line1 = ['Agency', 'Project', 'Funding Type']

    for (let i = 1; i <= nPeriods; i++) {
      line1.push(`${endDates[i]} Obligation Amount`)
    }
    for (let i = 1; i <= nPeriods; i++) {
      line1.push(`${endDates[i]} Expenditure Amount`)
    }

    line1.push('Errors')
    sheet.push(line1)
  }

  function addDataRows (sheet, aaData, nPeriods) {
    aaData.forEach(row => {
      const aoaRow = [
        row.agency,
        row.project,
        row.funding_type
      ]
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || {}
        aoaRow.push(period.obligation)
      }
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || {}
        aoaRow.push(period.expenditure)
      }
      if (row.errors) {
        aoaRow.push(row.errors)
      }

      sheet.push(aoaRow)
    })
  }
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
async function createAggregatePaymentSheet (nPeriods) {
  log(`createAggregatePaymentSheet(${nPeriods})`)
  let errorRows
  const sheet = []
  try {
    const sqlRows = await getAggregatePaymentData()
    const rowData = consolidatePeriods(sqlRows)
    errorRows = addErrorChecks(rowData, 'Aggregate Payments Individual', nPeriods)
    addColumnTitles(sheet, nPeriods)
    addDataRows(sheet, rowData, nPeriods)
  } catch (err) {
    return err
  }
  log('Aggregate Payments sheet completed')

  return { errorRows: errorRows, sheet: sheet }

  function consolidatePeriods (rowsIn) {
    const rowsOut = []
    let projectCode = ''
    let rowOut = { empty: null } // sentry

    for (let i = 0; i < rowsIn.length; i++) {
      const rowIn = rowsIn[i]

      if (!(rowIn.agency && rowIn.project)) {
        throw new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
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
          obligation: getAmount(rowIn.obligation),
          expenditure: getAmount(rowIn.expenditure)
        }
      }
    }
    rowsOut.push(rowOut) // save the final rowOut
    rowsOut.shift() // discard { empty: null } sentry
    return rowsOut
  }

  function addColumnTitles (sheet, nPeriods) {
    const line1 = ['Agency', 'Project']
    for (let i = 1; i <= nPeriods; i++) {
      line1.push(`${endDates[i]} Obligation Amount`)
    }
    for (let i = 1; i <= nPeriods; i++) {
      line1.push(`${endDates[i]} Expenditure Amount`)
    }

    line1.push('Errors')
    sheet.push(line1)
  }

  function addDataRows (sheet, rowData, nPeriods) {
    rowData.forEach(row => {
      const aoaRow = [
        row.agency,
        row.project
      ]
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || {}
        aoaRow.push(period.obligation)
      }
      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || {}
        aoaRow.push(period.expenditure)
      }
      if (row.errors) {
        aoaRow.push(row.errors)
      }

      sheet.push(aoaRow)
    })
  }
}

/* addErrorChecks() specs from RI:
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
function addErrorChecks (rowData, type, nPeriods) {
  let errorRows = 0
  for (let i = 0; i < rowData.length; i++) {
    const row = rowData[i]
    if (row.period.length < 2) {
      continue
    }
    const last = row.period.length - 1

    let sumObligation = 0
    let sumExpenditure = 0
    for (let p = 0; p <= last; p++) {
      sumObligation += (row.period[p] || {}).obligation || 0
      sumExpenditure += (row.period[p] || {}).expenditure || 0
    }

    const errors = []
    // Node:
    // > 76973.90+53470.59
    // 130444.48999999999
    sumObligation = getAmount(sumObligation)
    if (sumObligation < 0) {
      errors.push(
        `Cumulative Obligation (${to$(sumObligation)}) should not be negative.`
      )
    }
    sumExpenditure = getAmount(sumExpenditure)
    if (sumExpenditure > sumObligation) {
      errors.push(
        `Cumulative Expenditure (${to$(sumExpenditure)}) should not be greater than Cumulative Obligation (${to$(sumObligation)}).`
      )
    }
    if (sumExpenditure < 0) {
      errors.push(
        `Cumulative Expenditure (${to$(sumExpenditure)}) should not be negative.`
      )
    }
    const current = row.period[last] || { amount: 0, obligation: 0 }
    const prior = getPrior(row, last)

    switch (type) {
      case 'contracts':
      case 'grants':
      case 'transfers':
      case 'direct':
      case 'loans':
        if (((current.amount || 0) !== getAmount(prior.amount + current.obligation)) &&
            // Rhode Island zeroed out some contracts without negating the amount
            !(sumExpenditure === 0 && sumObligation === 0)
        ) {
          errors.push(
            `Current Amount (${to$(current.amount)}) should equal prior period Amount (${to$(prior.amount)}) plus Current Obligation (${to$(current.obligation)})`
          )
        }
        if ((current.amount || 0) !== sumObligation) {
          errors.push(`Current Amount (${to$(current.amount)}) should equal Cumulative Obligation (${to$(sumObligation)})`)
        }
        break

      case 'Aggregate Awards < 50000':
      case 'Aggregate Payments Individual':
        break

      default:
        break
    }
    if (errors.length) {
      errorRows += 1
      row.errors = errors.join('; ')
      console.dir(row.errors)
    }
  }
  return errorRows
}

/* createProjectSummarySheet()
  */
async function createProjectSummarySheet (nPeriods) {
  log(`createProjectSummarySheet(${nPeriods})`)

  const sheet = []
  try {
    const sqlRows = await getProjectSummaryData()
    log(`${sqlRows.length} SQL rows`)
    const rowData = consolidateProjects(sqlRows)
    log(`${rowData.length} consolidated rows`)
    await addColumnTitles(sheet, nPeriods)
    addDataRows(sheet, rowData, nPeriods)
  } catch (err) {
    return err
  }
  log('Project Summary Sheet completed.')
  return { errorRows: 0, sheet: sheet }

  function consolidateProjects (rowsIn) {
    log('consolidateProjects()')
    const rowsOut = []
    let projectCode = ''
    let rowOut = { empty: null } // sentry
    let sumExpenditure = 0

    let obligations = {}

    for (let i = 0; i < rowsIn.length; i++) {
      const rowIn = rowsIn[i]

      if (!rowIn.project) {
        throw new Error(`Bad database record: ${JSON.stringify(rowIn)}`)
      }

      if (projectCode !== rowIn.project) {
        rowOut.sumObligation = sumObligations(projectCode, obligations)
        rowOut.sumExpenditure = sumExpenditure
        rowsOut.push(rowOut) // save the completed previous rowOut
        projectCode = rowIn.project

        obligations = {}
        sumExpenditure = 0
        rowOut = {
          agency: rowIn.agency,
          project: rowIn.project,
          name: rowIn.name,
          description: rowIn.description,
          status: rowIn.status,
          period: []
        }
      }
      let awardNumber
      switch (rowIn.type) {
        case 'contracts':
          awardNumber = `C-${rowIn.contract_number}`
          break
        case 'grants':
          awardNumber = `G-${rowIn.award_number}`
          break
        case 'loans':
          awardNumber = `L-${rowIn.loan_number}`
          break
        case 'transfers':
          awardNumber = `T-${rowIn.transfer_number}`
          break
        case 'direct':
          awardNumber = `${rowIn.subrecipient_id}:${rowIn.obligation_date}`
          break
        case 'aggregate payments individual':
          awardNumber = 'ap'
          break
        case 'aggregate awards < 50000':
          awardNumber = 'aa'
          break
        default:
          console.dir(new Error(`Unrecognized record type ${rowIn.type}`))
          continue
      }

      if (!obligations[awardNumber]) {
        obligations[awardNumber] = []
      }
      const p = Number(rowIn.reporting_period_id) - 1
      if (!obligations[awardNumber][p]) {
        obligations[awardNumber][p] = []
      }
      obligations[awardNumber][p].push(getAmount(rowIn.obligation))

      const expenditure = getAmount(rowIn.expenditure ||
        rowIn.l_expenditure ||
        rowIn.aa_expenditure ||
        rowIn.ap_expenditure
      )

      if (expenditure) {
        sumExpenditure = getAmount(sumExpenditure + Number(expenditure))

        if (rowOut.period[p]) {
          rowOut.period[p].expenditure =
            getAmount(expenditure + rowOut.period[p].expenditure)
        } else {
          rowOut.period[p] = {
            expenditure: getAmount(expenditure)
          }
        }
      }
    }

    // save the final rowOut
    rowOut.sumObligation = sumObligations(projectCode, obligations)
    rowOut.sumExpenditure = sumExpenditure
    rowsOut.push(rowOut)

    rowsOut.shift() // discard { empty: null } sentry
    return rowsOut
  }

  /* sumObligations() gets the sum of all the obligations for a project.
    An obligations object contains one KV per award, plus a KV for Aggregate
    Awards < 50,000, and a KV for Aggregate Payments Individual:
    {
      '1-27': [ [ 3176458.97, 3176458.97 ], [ 4217479.35 ] ],
      '0091-VN': [ <1 empty item>, [ 60000 ] ],
      DOH0000059186: [ [ 203310.63 ] ],
      DOH0000058853: [ [ 2000000 ], [ 0 ] ],
      aa: [ [ 0, 1380487.15, 0, 1076710, 0 ], [ 0, 1940000, 0, 0, 809868.87 ] ],
      ap: [ [ 2701820 ], [ 2327329.8 ] ]
    }
    For all of them except aa records, we use only one value per period; the
    rest are duplicates from multiple expenditure rows for that award.
    For aa records, we must add all of them.
  */
  function sumObligations (projectCode, obligations) {
    let sum = 0
    Object.keys(obligations).forEach(awardNumber => {
      // sum += obligations[awardNumber].reduce((acc, val) => acc + val)
      const arrAwardPeriods = obligations[awardNumber]
      let x
      switch (awardNumber) {
        case 'aa':
          x = _.flatten(arrAwardPeriods)
            .reduce((acc, val) => acc + (val || 0), 0)
          if (isNaN(x)) {
            console.dir(new Error(
              `Bad obligation value in Aggregate Awards tab of project ${projectCode}: ${arrAwardPeriods}`
            ))
          } else {
            sum += x
          }
          break

        case 'ap':
        default:
          x = arrAwardPeriods.reduce((acc, val) => acc + (val[0] || 0), 0)
          if (isNaN(x)) {
            console.dir(new Error(
              `Bad obligation value in project ${projectCode}, award number ${awardNumber}: ${arrAwardPeriods}`
            ))
          } else {
            sum += x
          }
      }
    })
    return sum
  }

  async function addColumnTitles (sheet, nPeriods) {
    let endDates = await reportingPeriods.getEndDates()
    endDates = endDates.map(ed => format(new Date(ed.end_date), 'M/d/yy'))
    endDates.unshift(null) // because the first period is period 1
    const line1 = [
      'Agency Alpha Code',
      'Project Identification Number',
      'Project Title',
      'Project Description',
      'Project Status',
      'Approved Amount',
      'Cumulative Obligation Amount'
    ]

    for (let i = 1; i <= nPeriods; i++) {
      line1.push(`${endDates[i]} Expenditure Total`)
    }
    line1.push(`Cumulative Expenditures as of ${format(new Date(), 'M/d/yy')}`)
    sheet.push(line1)
  }

  async function addDataRows (sheet, rowData, nPeriods) {
    rowData.forEach(row => {
      const aoaRow = [
        row.agency,
        row.project,
        row.name,
        row.description,
        row.status,
        null, // Airtable Approved Amount
        row.sumObligation
      ]

      for (let i = 0; i < nPeriods; i++) {
        const period = row.period[i] || {}
        aoaRow.push(period.expenditure || null)
      }

      aoaRow.push(row.sumExpenditure)

      sheet.push(aoaRow)
    })
  }
}

async function composeWorkbook (sheets) {
  const workbook = XLSX.utils.book_new()
  const sheetSpecs = [
    ['Project Summaries', 1],
    ['Contracts', 1],
    ['Grants', 1],
    ['Loans', 1],
    ['Transfers', 1],
    ['Direct', 1],
    ['Aggregate Awards < 50000', 1],
    ['Aggregate Payments Individual', 1]
  ]

  try {
    await addErrorSheet(sheets, workbook, sheetSpecs)
  } catch (err) {
    return err
  }

  sheetSpecs.forEach(async spec => {
    const sheetName = spec[0]
    const sheetIn = sheets[sheetName.toLowerCase()].sheet || []
    const sheetOut = XLSX.utils.aoa_to_sheet(sheetIn)
    fixCellFormats(sheetOut, spec[1], '#,##0.00')

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

// getAmount returns null if the input is null, else a rounded number
function getAmount (num) {
  if (_.isNull(num)) { return null }
  return _.round((Number(num) || 0), 2)
}

/* getPrior() scans back in time to the prior reported Amount.
  This is needed because sometimes a project has no activity in a prior period,
  in which case the Amount for that period is null, but in a previous period
  there was a non-null amount, which is the amount we should report instead
  of the null.

  This correction is not needed for Obligations nor Expenditures.
  */
function getPrior (row, last) { // last is the ord of the latest period
  let lastReportedAmount = 0
  for (let i = last - 1; i >= 0; i--) {
    if (row.period[i] && row.period[i].amount) {
      lastReportedAmount = row.period[i].amount
      break
    }
  }

  return {
    amount: lastReportedAmount,
    obligation: (row.period[last - 1] || { obligation: 0 }).obligation
  }
}

/* addErrorSheet() adds an error summary tab to the output workbook
  */
async function addErrorSheet (sheets, workbook, sheetSpecs) {
  const errorSheet = [
    ['Sheet', 'Errors'] // title row of output sheet
  ]
  sheetSpecs.forEach(async spec => {
    const sheetName = spec[0]
    const errorRows = sheets[sheetName.toLowerCase()].errorRows || 0
    errorSheet.push([sheetName, errorRows])
  })
  const sheetOut = XLSX.utils.aoa_to_sheet(errorSheet)
  return XLSX.utils.book_append_sheet(
    workbook, sheetOut, 'Error Summary'
  )
}

/*                                  *  *  *                                   */
