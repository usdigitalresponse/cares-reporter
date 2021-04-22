/*
--------------------------------------------------------------------------------
-                                 lib/treasury.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const XLSX = require('xlsx')
const _ = require('lodash')

const {
  applicationSettings,
  currentReportingPeriodSettings
} = require('../db/settings')
const { documentsWithProjectCode } = require('../db/documents')
const { getProjects } = require('../db/projects')
const { getUploadSummaries } = require('../db/uploads')

const { getTreasuryTemplateSheets } = require('../services/get-template')

const { getSubrecipientRecords } = require('./subrecipients')
const { makeConfig } = require('./config')
const { clean, cleanString } = require('./spreadsheet')
const FileInterface = require('./server-disk-interface')
const fileInterface = new FileInterface(process.env.TREASURY_DIRECTORY)
const { fixCellFormats } = require('../services/fix-cell-formats')

const {
  categoryDescriptionSourceColumn,
  categoryMap,
  expenditureColumnNames,
  columnNameMap,
  columnTypeMap,
  organizationTypeMap,
  sheetNameMap,
  zeroWhenEmpty
} = require('./field-name-mapping')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

/*  createOutputWorkbook() takes input records in the form of
      { <type (i.e. source sheet name)>: [
          { content: {
              <sourceColumnName>:<sourceColumnValue>,
              ...
            }
          },
          ...
        ]
        ...
      }
    and composes these records into an output xlsx-formatted workbook.
  */
async function createOutputWorkbook (
  wbSpec, // a config object - see ./config.js/makeConfig()
  recordGroups, // a KV object where keys are sheet names, values are arrays
  // of document records of this type (aka spreadsheet rows from
  // these sheets)
  period_id
) {
  const workbook = XLSX.utils.book_new()

  log('Sheets are:')
  Object.keys(recordGroups).forEach(rg => {
    log(`\t${rg}: ${recordGroups[rg].length} records`)
  })

  const sheetsOut = {}
  let subrecpientColumnNames

  for (let i = 0; i < wbSpec.settings.length; i++) {
    const outputSheetSpec = wbSpec.settings[i]
    const outputSheetName = outputSheetSpec.sheetName
    const outputColumnNames = outputSheetSpec.columns

    log(`\nComposing output Sheet ${outputSheetName}`)

    // sometimes tabs are empty!
    const sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || []

    log(`${outputSheetName} has ${sheetRecords.length} records`)

    let rows = []

    switch (outputSheetName) {
      case 'Cover Page': {
        const appSettings = await applicationSettings()
        const reportingPeriod = await currentReportingPeriodSettings()
        rows = getCoverPage(appSettings, reportingPeriod)
        break
      }
      case 'Projects': {
        rows = await getProjectsSheet()
        // console.dir(rows);
        break
      }

      case 'Sub Recipient': {
        subrecpientColumnNames = outputColumnNames
        rows = getSubRecipientSheet(sheetRecords, outputColumnNames)
        break
      }
      case 'Contracts':
      case 'Grants':
      case 'Loans':
      case 'Transfers':
      case 'Direct':
        rows = getCategorySheet(outputSheetName, sheetRecords, outputColumnNames)
        break

      case 'Aggregate Payments Individual':
        rows = getAggregatePaymentsIndividualSheet(sheetRecords, outputColumnNames)
        break

      case 'Aggregate Awards < 50000':
        rows = getAggregateAwardsSheet(sheetRecords, outputColumnNames)
        break

      default:
        throw new Error(`Unhandled sheet type: ${outputSheetName}`)
    }
    log(`adding sheet ${outputSheetName}`)
    log(`with ${rows.length} rows`)

    sheetsOut[outputSheetName] = convertSheet(rows, outputColumnNames)
  }

  addOutputSheets(
    workbook,
    sheetsOut,
    wbSpec.settings.map(outputSheetSpec => outputSheetSpec.sheetName)
  )

  if (audit()) {
    addAuditSheets(workbook, recordGroups, subrecpientColumnNames)
  }

  const treasuryOutputWorkbook =
    XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

  return treasuryOutputWorkbook
}

function convertSheet (rows, outputColumnNames) {
  rows.unshift(outputColumnNames)
  let sheetOut = XLSX.utils.aoa_to_sheet(rows)
  sheetOut = fixCellFormats(sheetOut)
  return sheetOut
}

function getCoverPage (appSettings = {}, reportingPeriod = {}) {
  const rows = [
    [
      'Financial Progress Reporting',
      'Coronavirus Relief Fund',

      reportingPeriod.start_date || 'Needs a date',
      reportingPeriod.end_date || 'Needs a date',
      appSettings.duns_number || 'Needs a DUNS number'
    ]
  ]

  return rows
}

function addAuditSheets (workbook, recordGroups, outputColumnNames) {
  const objSR = getSubRecipientAuditSheets(recordGroups, outputColumnNames)

  const sheetsOut = {
    'Unreferenced Sub Recipients': convertSheet(objSR.arrOrphans, outputColumnNames),
    'Prior Sub Recipients': convertSheet(objSR.arrPrior, outputColumnNames),
    'Missing Sub Recipients': getMissingSubrecipientsSheet(objSR.arrMissing)
  }

  return addOutputSheets(
    workbook,
    sheetsOut,
    ['Unreferenced Sub Recipients',
      'Prior Sub Recipients',
      'Missing Sub Recipients'
    ]
  )
}

function addOutputSheets (workbook, sheetsOut, sheetNames) {
  sheetNames.forEach(async sheetName => {
    try {
      await XLSX.utils.book_append_sheet(
        workbook, sheetsOut[sheetName], sheetName
      )
    } catch (err) {
      console.dir(err)
      throw err
    }
  })
}

function getMissingSubrecipientsSheet (arrMissing) {
  const outputColumnNames = [
    'Sub-Recipient',
    'Upload Tab',
    'Upload File'
  ]
  const rows = []
  rows.push(outputColumnNames)

  arrMissing.forEach(record => {
    rows.push([
      record.subrecipient_id,
      record.tab,
      record.upload_file
    ])
  })
  return XLSX.utils.aoa_to_sheet(rows)
}

/*  getProjectsSheet () - all Projects must be listed each reporting period.
  */
async function getProjectsSheet () {
  const mapProjects = await getProjects()

  const rows = []
  mapProjects.forEach(project => {
    rows.push([
      cleanString(project.name),
      project.code,
      project.description,
      project.status
    ])
  })

  return rows
}

/*  getCategorySheet() handles sheets whose source rows have to be broken
  down into multiple detail rows by expense category.
  */
function getCategorySheet (
  sheetName,
  sheetRecords, // an array of document records
  outputColumnNames // an array of output column names
) {
  const kvNameCol = getColumnOrds(outputColumnNames)
  const kvExpenseNameCol = getExpenditureColumnOrds(sheetName, kvNameCol)
  const rowsOut = []

  sheetRecords.forEach(jsonRecord => {
    const jsonRow = jsonRecord.content // see getGroups()
    const aoaRow = populateCommonFields(outputColumnNames, kvNameCol, jsonRow)

    let written = false

    /* this conditional is to address issue #22
      Michael here is some additional background regarding the Loans tab
      from our internal perspective this note below summarizes our
      discussion from this morning among the RI team:

      Treasury is treating loans differently than all other categories,
      with expenditures referring to repayments by the borrower, with those
      repayment values put in expenditure categories.  Since the RI loan
      program is forgivable, with no true repayments (just return of funds
      not used for the intended purpose), the Total Payment Amount and
      Expenditure Categories should be blank.  As these loans are forgiven,
      they will show up on the grants tab with expenditure
      amounts/categories.  Convoluted, but not totally irrational…

      Your proposed solution solves the issue and we will also refine our
      guidance for future reporting cycles to our agencies.
    */
    if (sheetName !== 'Loans' || jsonRow['total payment amount']) {
      written = addDetailRows(jsonRow, aoaRow, kvExpenseNameCol, rowsOut)
    }

    if (!written) {
      // write a row even if there has been no activity in this period
      // delete junk fields from empty records
      delete aoaRow[kvExpenseNameCol.project]
      delete aoaRow[kvExpenseNameCol.start]
      delete aoaRow[kvExpenseNameCol.end]
      rowsOut.push(aoaRow)
    }
  })
  return rowsOut
}

function getAggregateAwardsSheet (sheetRecords) {
  const aggregate = {
    contracts: { updates: null, obligation: 0, expenditure: 0 },
    grants: { updates: null, obligation: 0, expenditure: 0 },
    loans: { updates: null, obligation: 0, expenditure: 0 },
    transfers: { updates: null, obligation: 0, expenditure: 0 },
    direct: { updates: null, obligation: 0, expenditure: 0 }
  }

  sheetRecords.forEach(sourceRec => {
    let category
    const sourceRow = sourceRec.content
    const fundingType = (sourceRow['funding type'] || '').toLowerCase()
    switch (true) {
      case Boolean(fundingType.match('grants')):
        category = 'grants'
        break
      case Boolean(fundingType.match('contracts')):
        category = 'contracts'
        break
      case Boolean(fundingType.match('loans')):
        category = 'loans'
        break
      case Boolean(fundingType.match('transfers')):
        category = 'transfers'
        break
      case Boolean(fundingType.match('direct')):
        category = 'direct'
        break
      default:
        console.log('Aggregate Awards record without a category!', sourceRow)
        return
    }
    Object.keys(sourceRow).forEach(columnName => {
      switch (true) {
        case Boolean(columnName.match('funding')):
          break

        case Boolean(columnName.match('updates')):
          aggregate[category].updates = sourceRow[columnName]
          break

        case Boolean(columnName.match('obligation')):
          aggregate[category].obligation += (Number(sourceRow[columnName]) || 0)
          break

        case Boolean(columnName.match('expenditure')):
          aggregate[category].expenditure += (Number(sourceRow[columnName]) || 0)
          break

        default:
          console.log(`column ${columnName} not recognized`)
          break
      }
    })
  })

  return [
    ['Aggregate of Contracts Awarded for <$50,000',
      aggregate.contracts.obligation,
      aggregate.contracts.expenditure
    ],
    ['Aggregate of Grants Awarded for <$50,000',
      aggregate.grants.obligation,
      aggregate.grants.expenditure
    ],
    ['Aggregate of Loans Awarded for <$50,000',
      aggregate.loans.obligation,
      aggregate.loans.expenditure
    ],
    ['Aggregate of Transfers Awarded for <$50,000',
      aggregate.transfers.obligation,
      aggregate.transfers.expenditure
    ],
    ['Aggregate of Direct Payments Awarded for <$50,000',
      aggregate.direct.obligation,
      aggregate.direct.expenditure
    ]
  ]
}

function getAggregatePaymentsIndividualSheet (sheetRecords, outputColumnNames) {
  const cqoSourceName = columnNameMap['Current Quarter Obligation']
  const cqeSourceName = columnNameMap['Current Quarter Expenditure']

  let cqoTotal = 0
  let cqeTotal = 0

  sheetRecords.forEach(sourceRec => {
    cqoTotal += Number(sourceRec.content[cqoSourceName]) || 0
    cqeTotal += Number(sourceRec.content[cqeSourceName]) || 0
  })

  const arrDestRow = []
  arrDestRow[outputColumnNames.indexOf('Current Quarter Obligation')] = cqoTotal
  arrDestRow[outputColumnNames.indexOf('Current Quarter Expenditure')] = cqeTotal

  return [arrDestRow]
}

/*  getSubRecipientSheet() converts the subrecipient records from postgres
  into an output array
  the ddRecords were generated by getGroups() from the subrecipients table
  in postgres, and look like this:
    {
      type: 'subrecipient',
      content: the db record with the underscores in the column names replaced
        by spaces.
    }
  */
function getSubRecipientSheet (ddRecords, outputColumnNames) {
  // translate the subrecipient table records into AOA rows
  const arrRows = ddRecords.map(ddRecord => {
    let jsonRow = ddRecord.content

    // fix issue #81
    const organizationType = jsonRow['organization type']
    jsonRow['organization type'] = organizationTypeMap[organizationType]

    jsonRow = fixDuns(jsonRow)
    // return an AOA row
    const aoaRow = outputColumnNames.map(columnName => {
      return jsonRow[columnNameMap[columnName]] || null
    })

    return aoaRow
  })
  log(`there are ${arrRows.length} subrecipients`)
  return arrRows
}

/*  getSubRecipientAuditSheets()
  */
function getSubRecipientAuditSheets (recordGroups, outputColumnNames) {
  // translate the subrecipient table records into AOA rows
  const arrMissing = recordGroups.missing_subrecipient || []
  log('\nComposing output sheet Missing Sub Recipients')
  log(`with ${arrMissing.length} rows`)

  const arrOrphans = (recordGroups.orphan_subrecipient || [])
    .map(mapToAoa)
  log('\nComposing output sheet Unreferenced Sub Recipients')
  log(`with ${arrOrphans.length} rows`)

  const arrPrior = (recordGroups.prior_subrecipient || [])
    .map(mapToAoa)
  log('\nComposing output sheet Prior Sub Recipients')
  log(`with ${arrPrior.length} rows`)

  return {
    arrMissing,
    arrOrphans,
    arrPrior
  }

  function mapToAoa (jsonRow) {
    const aoaRow = outputColumnNames.map(columnName => {
      return jsonRow.content[columnNameMap[columnName]] || null
    })
    return aoaRow
  }
}

/*  fixDuns() According to the Treasury Data Dictionary: "If DUNS number is
  filled in, then the rest of the Sub-Recipient fields should not be
  filled in. The upload process will look up the rest of the fields
  on SAM.gov."
  */
function fixDuns (jsonRow) {
  const dunsSourceName = columnNameMap['DUNS Number']
  const idSourceName = columnNameMap['Identification Number']
  if (jsonRow[dunsSourceName]) {
    // But we have some records where the DUNS number field is occupied
    // by junk, so we should ignore that.
    if (/^\d{9}$/.exec(jsonRow[dunsSourceName])) { // check for correct format
      delete jsonRow[idSourceName]
      delete jsonRow[columnNameMap['Legal Name']]
      delete jsonRow[columnNameMap['Address Line 1']]
      delete jsonRow[columnNameMap['Address Line 2']]
      delete jsonRow[columnNameMap['Address Line 3']]
      delete jsonRow[columnNameMap['City Name']]
      delete jsonRow[columnNameMap['State Code']]
      delete jsonRow[columnNameMap['Zip+4']]
      delete jsonRow[columnNameMap['Country Name']]
      delete jsonRow[columnNameMap['Organization Type']]
    } else if (jsonRow[idSourceName]) {
      delete jsonRow[dunsSourceName]
    }
  }
  return jsonRow
}

/* getColumnOrds returns a kv where
  K = the destination column name,
  V = the ord of the column in the output sheet
  */
function getColumnOrds (arrColumnNames) {
  const columnOrds = {}
  for (let i = 0; i < arrColumnNames.length; i++) {
    columnOrds[arrColumnNames[i]] = i
  }
  return columnOrds
}

/* getExpenditureColumnOrds() returns a kv where
  K = the generic name of an expenditure column (e.g. "amount")
  V = the actual name of that column for a particular sheet (e.g. "Payment Amount")
  see field-name-mappings.js
  */
function getExpenditureColumnOrds (sheetName, columnOrds) {
  const kvExpenseNameCol = {}
  Object.keys(expenditureColumnNames[sheetName]).forEach(key => {
    const columnName = expenditureColumnNames[sheetName][key]
    kvExpenseNameCol[key] = columnOrds[columnName]
  })
  return kvExpenseNameCol
}

/* populateCommonFields() returns an AOA row array populated with the fields
  common to all the detail rows.
  */
function populateCommonFields (outputColumnNames, kvNameCol, jsonRow) {
  const aoaRow = []
  outputColumnNames.forEach(columnName => {
    let cellValue = jsonRow[columnNameMap[columnName]]
    if (cellValue) {
      switch (columnTypeMap[columnName]) {
        case 'string':
          aoaRow[kvNameCol[columnName]] = String(cellValue)
          break

        case 'amount':
          cellValue = Number(cellValue) || 0
          aoaRow[kvNameCol[columnName]] = _.round(cellValue, 2)
          break

        default:
          aoaRow[kvNameCol[columnName]] = cellValue
          break
      }
    } else if (zeroWhenEmpty[columnName]) {
      aoaRow[kvNameCol[columnName]] = 0
    }
  })
  return aoaRow
}

/*  addDetailRows() adds one row to the rowsOut array for each occupied
  category field in the jsonRow
  */
function addDetailRows (jsonRow, aoaRow, kvExpenseNameCol, rowsOut) {
  let written = false
  Object.keys(jsonRow).forEach(key => {
    // keys are the detail category field names in the source jsonRow
    const amount = Number(jsonRow[key])

    // ignore categories with zero expenditures
    if (!amount) {
      return
    }

    const category = categoryMap[key] || null
    const destRow = aoaRow.slice() // make a new copy

    switch (category) {
      case null:
        break

      case 'Category Description':
        // ignore for now, we will populate it when we get to
        // "Other Expenditure Amount"
        break

      case 'Items Not Listed Above':
        // If the column "other expenditure amount" is occupied in the
        // input row, put that amount in the Cost or Expenditure Amount
        // column, put "Items Not Listed Above" in the "Cost or
        // Expenditure Category" (or "Loan Category") column, and put the
        // contents of the "other expenditure categories" column in the
        // the "Category Description" column.
        destRow[kvExpenseNameCol.amount] = amount
        destRow[kvExpenseNameCol.category] = categoryMap[key]
        destRow[kvExpenseNameCol.description] =
          jsonRow[categoryDescriptionSourceColumn]
        rowsOut.push(destRow)
        written = true
        break

      default: {
        destRow[kvExpenseNameCol.amount] = amount
        destRow[kvExpenseNameCol.category] = categoryMap[key]
        rowsOut.push(destRow)
        written = true
        break
      }
    }
  })
  return written
}

function audit () {
  return process.env.AUDIT || false
}

async function writeOutputWorkbook (filename, workbook) {
  return fileInterface.writeFileCarefully(filename, workbook)
}

async function getNewFilename (period_id) {
  const timeStamp = new Date().toISOString().split('.')[0].split(':').join('')
  let {
    title: state,
    current_reporting_period_id
  } = await applicationSettings()
  period_id = period_id || current_reporting_period_id
  state = state.replace(/ /g, '-')
  const filename = `${state}-Period-${period_id}-CRF-Report-to-OIG-V.${timeStamp}`
  log(`Filename is ${filename}`)

  if (process.env.AUDIT) {
    return filename + '.audit.xlsx'
  } else {
    return filename + '.xlsx'
  }
}

/*  latestReport() returns the file name of the latest Treasury Report
  generated for a period.
  If no period is specified, it returns the latest report from the current
  period.
  */
async function latestReport (period_id) {
  const allFiles = await fileInterface.listFiles()
  /* [
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-10T052459.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-14T161922.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-11T120351.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-10T165454.xlsx"
    ]
  */
  if (!period_id) {
    period_id = await applicationSettings().current_reporting_period_id
  }

  const fileNames = allFiles.sort() // ascending
  fileNames.unshift('sentry')

  let filename
  let filePeriod

  do {
    filename = fileNames.pop()
    filePeriod = (filename.match(/-Period-(\d+)-/) || [])[1]
  } while (fileNames.length && Number(filePeriod) !== Number(period_id))

  if (!fileNames.length) {
    throw new Error(
      `No Treasury report has been generated for period ${period_id}`
    )
  }
  return filename
}

/*  generateReport generates a fresh Treasury Report spreadsheet
    and writes it out if successful.
    */
async function generateReport (period_id) {
  const treasuryTemplateSheets = getTreasuryTemplateSheets()
  const config = makeConfig(treasuryTemplateSheets, 'Treasury Template', [])

  const groups = await getGroups(period_id)
  if (_.isError(groups)) {
    console.dir(groups)
    return groups
  }

  try {
    // eslint-disable-next-line no-var
    var outputWorkBook = await createOutputWorkbook(config, groups, period_id)
  } catch (err) {
    return err
  }

  if (_.isError(outputWorkBook)) {
    return outputWorkBook
  }

  const filename = await getNewFilename(period_id)
  await writeOutputWorkbook(filename, outputWorkBook)

  return { filename, outputWorkBook }
}

async function getPriorReport (period_id) {
  const filename = await latestReport(period_id)
  if (_.isError(filename)) {
    return filename
  }

  try {
    const outputWorkBook = await fileInterface.readFile(filename)
    return ({ filename, outputWorkBook })
  } catch (err) {
    return err
  }
}

async function getGroups (period_id) {
  let groups = null

  const mapUploadMetadata = new Map()
  try {
    const arrUploadMetaData = await getUploadSummaries(period_id)
    arrUploadMetaData.forEach(rec => mapUploadMetadata.set(rec.id, rec))
  } catch (_err) {
    console.dir(_err)
    return new Error('Failed to load upload summaries')
  }

  let documents
  try {
    documents = await documentsWithProjectCode(period_id)
  } catch (_err) {
    return new Error('Failed to load document records')
  }

  log(`Found ${documents.length} documents`)

  const {
    awardRecords,
    mapSubrecipientReferences,
    errorLog
  } = getAwardRecords(documents, mapUploadMetadata)
  if (errorLog.length > 0) {
    console.dir(errorLog)
    return new Error('Errors in document award records')
  }

  const records = []

  Object.keys(awardRecords).forEach(key => records.push(awardRecords[key]))

  const subrecipientRecords = await getSubrecipientRecords(
    mapUploadMetadata,
    mapSubrecipientReferences
  )
  if (_.isError(subrecipientRecords)) {
    return subrecipientRecords
  }
  records.splice(records.length, 0, ...subrecipientRecords)

  groups = _.groupBy(records, 'type')
  log(`Found ${_.keys(groups).length} groups:`)

  return groups
}

/* getAwardRecords() cleans and deduplicates records, and combines them as
  needed for the output tabs
  */
function getAwardRecords (documents, mapUploadMetadata) {
  const awardRecords = {} // keyed by concatenated id
  let uniqueID = 0 // this is for records we don't deduplicate
  const mapSubrecipientReferences = new Map()
  const errorLog = []

  documents.forEach(record => {
    uniqueID += 1
    record.content = clean(record.content) // not needed after database is cleaned
    const filename = mapUploadMetadata.get(record.upload_id).filename

    switch (record.type) {
      case 'cover':
        // ignore cover records
        break

      case 'certification':
        // ignore certification records
        break

      case 'prior_subrecipient':
      case 'missing_subrecipient':
      case 'orphan_subrecipient':
      case 'subrecipient': {
        // Ignore subrecipient records.
        // The Sub Recipient tab in the Treasury output spreadsheet is populated
        // from the subrecipients db table by createOutputWorkbook()
        break
      }

      case 'projects': {
        // Ignore projects records.
        // The Projects tab in the Treasury output spreadsheet is populated from
        // the projects db table by createOutputWorkbook()
        break
      }

      // we have to assume none of these are duplicates, because two identical
      // records could both be valid, since we don't have anything like an
      // invoice number and there could be two expenditures in the same period
      case 'contracts':
      case 'grants':
      case 'loans':
      case 'transfers':
      case 'direct': {
        const srID = cleanString(record.content['subrecipient id'])
        if (srID) {
          mapSubrecipientReferences.set(srID, record)
        } else {
          errorLog.push(
            `${record.type} record is missing subrecipient ID in ${filename}`
          )
        }
        awardRecords[uniqueID] = record
        break
      }

      case 'aggregate awards < 50000':
      case 'aggregate payments individual': {
        awardRecords[uniqueID] = record
        break
      }

      default:
        errorLog.push(`Unrecognized record type: ${record.type} in ${filename}`)
        break
    }
  })

  return {
    awardRecords,
    mapSubrecipientReferences,
    errorLog
  }
}

module.exports = {
  generateReport,
  getPriorReport,
  latestReport
}

/*                                  *  *  *                                   */
