/* eslint camelcase: 0 */

const XLSX = require('xlsx')
const _ = require('lodash')

const {
  applicationSettings,
  getCurrentReportingPeriodID,
  currentReportingPeriodSettings
} = require('../db/settings')
const { documentsWithProjectCode } = require('../db/documents')
const { getProjects } = require('../db/projects')
const { getSubRecipients, setSubRecipient } = require('../db/subrecipients')
const { getUploadSummaries } = require('../db/uploads')
const { getReportedSubrecipientIds } = require('../db/period-summaries')

const { getTreasuryTemplateSheets } = require('../services/get-template')

const { makeConfig } = require('../lib/config')
const { clean, cleanString } = require('../lib/spreadsheet')
const FileInterface = require('../lib/server-disk-interface')
const fileInterface = new FileInterface(process.env.TREASURY_DIRECTORY)

const fixCellFormats = require('../services/fix-cell-formats')

const {
  categoryDescriptionSourceColumn,
  categoryMap,
  expenditureColumnNames,
  columnNameMap,
  columnTypeMap,
  organizationTypeMap,
  sheetNameMap
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

  log(`Sheets are:`)
  Object.keys(recordGroups).forEach(rg => {
    log(`\t${rg}: ${recordGroups[rg].length} records`)
  })

  let sheetsOut = {}
  let subrecpientColumnNames

  for (let i = 0; i < wbSpec.settings.length; i++) {
    let outputSheetSpec = wbSpec.settings[i]
    let outputSheetName = outputSheetSpec.sheetName
    let outputColumnNames = outputSheetSpec.columns

    log(`\nComposing output Sheet ${outputSheetName}`)

    // sometimes tabs are empty!
    let sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || []

    log(`${outputSheetName} has ${sheetRecords.length} records`)

    let rows = []

    switch (outputSheetName) {
      case 'Cover Page':
        let appSettings = await applicationSettings()
        let reportingPeriod = await currentReportingPeriodSettings()
        rows = getCoverPage(appSettings, reportingPeriod)
        break

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

  let treasuryOutputWorkbook =
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
  let rows = [
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
  let objSR = getSubRecipientAuditSheets(recordGroups, outputColumnNames)

  let sheetsOut = {
    'Unreferenced Sub Recipients': convertSheet(objSR.arrOrphans, outputColumnNames),
    'Prior Sub Recipients': convertSheet(objSR.arrPrior, outputColumnNames),
    'Missing Sub Recipients': getMissingSubrecipientsSheet(objSR.arrMissing)
  }

  return addOutputSheets(
    workbook,
    sheetsOut,
    [ 'Unreferenced Sub Recipients',
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
  let outputColumnNames = [
    'Sub-Recipient',
    'Upload Tab',
    'Upload File'
  ]
  let rows = []
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
  let mapProjects = await getProjects()

  let rows = []
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
  let kvNameCol = getColumnOrds(outputColumnNames)
  let kvExpenseNameCol = getExpenditureColumnOrds(sheetName, kvNameCol)
  let rowsOut = []

  sheetRecords.forEach(jsonRecord => {
    let jsonRow = jsonRecord.content // see getGroups()
    let aoaRow = populateCommonFields(outputColumnNames, kvNameCol, jsonRow)

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
  let aggregate = {
    contracts: { updates: null, obligation: 0, expenditure: 0 },
    grants: { updates: null, obligation: 0, expenditure: 0 },
    loans: { updates: null, obligation: 0, expenditure: 0 },
    transfers: { updates: null, obligation: 0, expenditure: 0 },
    direct: { updates: null, obligation: 0, expenditure: 0 }
  }

  sheetRecords.forEach(sourceRec => {
    let sourceRow = sourceRec.content
    let category = /Aggregate of (\w+)/.exec(sourceRow['funding type'])
    if (category) {
      category = category[1].toLowerCase()
    } else {
      console.log('Aggregate Awards record without a category!', sourceRow)
      return
    }
    Object.keys(sourceRow).forEach(columnName => {
      switch (true) {
        case Boolean(columnName.match('funding')):
          break

        case Boolean(columnName.match('updates')):
          aggregate[category]['updates'] = sourceRow[columnName]
          break

        case Boolean(columnName.match('obligation')):
          aggregate[category]['obligation'] += (Number(sourceRow[columnName]) || 0)
          break

        case Boolean(columnName.match('expenditure')):
          aggregate[category]['expenditure'] += (Number(sourceRow[columnName]) || 0)
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
  let cqoSourceName = columnNameMap['Current Quarter Obligation']
  let cqeSourceName = columnNameMap['Current Quarter Expenditure']

  let cqoTotal = 0
  let cqeTotal = 0

  sheetRecords.forEach(sourceRec => {
    cqoTotal += Number(sourceRec.content[cqoSourceName]) || 0
    cqeTotal += Number(sourceRec.content[cqeSourceName]) || 0
  })

  let arrDestRow = []
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
  let arrRows = []
  ddRecords.forEach(ddRecord => {
    let jsonRow = ddRecord.content

    // fix issue #81
    let organizationType = jsonRow['organization type']
    jsonRow['organization type'] = organizationTypeMap[organizationType]

    jsonRow = fixDuns(jsonRow)

    // return an AOA row
    let aoaRow = outputColumnNames.map(columnName => {
      return jsonRow[columnNameMap[columnName]] || null
    })

    arrRows.push(aoaRow)
  })
  return arrRows
}

/*  getSubRecipientSheets() converts the subrecipient records from postgres
  into a hash of output arrays of AOA rows
  the recordGroups were generated by getGroups()
  */
function getSubRecipientAuditSheets (recordGroups, outputColumnNames) {
  // translate the subrecipient table records into AOA rows
  let arrMissing = recordGroups.missing_subrecipient || []

  let arrOrphans = (recordGroups.orphan_subrecipient || [])
    .map(mapToAoa)

  let arrPrior = (recordGroups.prior_subrecipient || [])
    .map(mapToAoa)

  return {
    arrMissing,
    arrOrphans,
    arrPrior
  }

  function mapToAoa (jsonRow) {
    let aoaRow = outputColumnNames.map(columnName => {
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
  let dunsSourceName = columnNameMap['DUNS Number']
  let idSourceName = columnNameMap['Identification Number']
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
  let columnOrds = {}
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
  let kvExpenseNameCol = {}
  Object.keys(expenditureColumnNames[sheetName]).forEach(key => {
    let columnName = expenditureColumnNames[sheetName][key]
    kvExpenseNameCol[key] = columnOrds[columnName]
  })
  return kvExpenseNameCol
}

/* populateCommonFields() returns an AOA row array populated with the fields
  common to all the detail rows.
  */
function populateCommonFields (outputColumnNames, kvNameCol, jsonRow) {
  let aoaRow = []
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
    let amount = Number(jsonRow[key])

    // ignore categories with zero expenditures
    if (!amount) {
      return
    }

    let category = categoryMap[key] || null
    let destRow = aoaRow.slice() // make a new copy

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

async function getNewFilename () {
  const timeStamp = new Date().toISOString().split('.')[0].split(':').join('')
  let {
    title: state,
    current_reporting_period_id: period
  } = await applicationSettings()
  state = state.replace(/ /g, '-')
  let filename = `${state}-Period-${period}-CRF-Report-to-OIG-V.${timeStamp}`
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
  let allFiles = await fileInterface.listFiles()
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

  let fileNames = allFiles.sort() // ascending
  fileNames.push('sentry')

  let filename
  let filePeriod

  do {
    filename = fileNames.shift()
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

  const filename = await getNewFilename()
  await writeOutputWorkbook(filename, outputWorkBook)

  return { filename, outputWorkBook }
}

async function getPriorReport (period_id) {
  let filename = await latestReport(period_id)
  if (_.isError(filename)) {
    return filename
  }

  try {
    let outputWorkBook = await fileInterface.readFile(filename)
    return ({ filename, outputWorkBook })
  } catch (err) {
    return err
  }
}

async function getGroups (period_id) {
  let groups = null

  const mapUploadMetadata = new Map()
  try {
    let arrUploadMetaData = await getUploadSummaries(period_id)
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

  // we need the subrecipients db table to be current before we get the
  // award records. Should really be done on file upload, not here.
  let mapSubrecipients = await updateSubrecipientTable(documents)

  if (_.isError(mapSubrecipients)) {
    return mapSubrecipients
  }

  const {
    awardRecords,
    mapSubrecipientReferences,
    errorLog
  } = getAwardRecords(documents, mapUploadMetadata)

  if (errorLog.length > 0) {
    console.dir(errorLog)
    return new Error(`Errors in document award records`)
  }

  let rv = []

  Object.keys(awardRecords).forEach(key => rv.push(awardRecords[key]))

  const subrecipientRecords =
    await getSubrecipientRecords(mapUploadMetadata, mapSubrecipients, mapSubrecipientReferences)
  rv.splice(rv.length, 0, ...subrecipientRecords)

  groups = _.groupBy(rv, 'type')
  log(`Found ${_.keys(groups).length} groups:`)

  return groups
}

async function getSubrecipientRecords (mapUploadMetadata, mapSubrecipients, mapSubrecipientReferences) {
  let subrecipientRecords = []
  let arrPriorPeriodSubrecipientIDs = await getReportedSubrecipientIds()
  let reported = 0
  let notreported = 0
  mapSubrecipients.forEach((v, k) => {
    let type

    if (arrPriorPeriodSubrecipientIDs.indexOf(k) !== -1) {
      type = 'prior_subrecipient'
      reported += 1
    } else if (mapSubrecipientReferences.has(k)) {
      type = 'subrecipient'
      notreported += 1
    } else {
      type = 'orphan_subrecipient'
      notreported += 1
    }

    subrecipientRecords.push({
      type: type,
      content: v
    })
  })

  log(`Reported: ${reported}. Not reported: ${notreported}`)

  if (process.env.AUDIT) {
    mapSubrecipientReferences.forEach((record, subrecipientID) => {
      if (!mapSubrecipients.has(subrecipientID)) {
        subrecipientRecords.push({
          type: 'missing_subrecipient',
          subrecipient_id: record.content['subrecipient id'],
          tab: record.type,
          upload_file: mapUploadMetadata.get(record.upload_id).filename
        })
      }
    })
  }

  return subrecipientRecords
}

/*  updateSubrecipientTable() adds new subrecipients to the database
  */
async function updateSubrecipientTable (documents) {
  // get all the subrecipients currently in the subrecipients table
  let crpID = await getCurrentReportingPeriodID()
  let mapSubrecipients
  try {
    mapSubrecipients = await getSubRecipients()
  } catch (err) {
    return err
  }

  documents.forEach(async record => {
    switch (record.type) {
      case 'subrecipient': {
        let subrecipientIN = String(record.content['identification number']).trim()

        // If an upload contains a new subrecipient, add it to the db table.
        // Changes to existing subrecipients must be done by email request.
        // (decided 20 12 07  States Call)
        if (mapSubrecipients.has(subrecipientIN)) {
          break
        }

        let recSubRecipient = clean(record.content)

        // Not needed any more! It doesn't matter what period the record
        // was created in. But we do need to know if this subrecipient has
        // been reported in a previous reporting period.
        recSubRecipient['created in period'] = crpID

        mapSubrecipients.set(subrecipientIN, recSubRecipient)
        setSubRecipient(recSubRecipient) // no need to wait

        break
      }
      default:
        break
    }
  })
  return mapSubrecipients
}

/* getAwardRecords() cleans and deduplicates records, and combines them as
  needed for the output tabs
  */
function getAwardRecords (documents, mapUploadMetadata) {
  let awardRecords = {} // keyed by concatenated id
  let uniqueID = 0 // this is for records we don't deduplicate
  let mapSubrecipientReferences = new Map()
  let errorLog = []

  documents.forEach(record => {
    uniqueID += 1
    record.content = clean(record.content) // not needed after database is cleaned
    let filename = mapUploadMetadata.get(record.upload_id).filename

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
        // from the subrecipients db table by treasury.js/createOutputWorkbook
        break
      }

      case 'projects': {
        // Ignore projects records.
        // The Projects tab in the Treasury output spreadsheet is populated from
        // the projects db table by treasury.js/createOutputWorkbook
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
        let srID = record.content['subrecipient id']
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
  latestReport,
  writeOutputWorkbook
}

/*                                  *  *  *                                   */
