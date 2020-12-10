const XLSX = require("xlsx");
const _ = require("lodash");

const { applicationSettings,
  currentReportingPeriod
} = require("../db");
const FileInterface = require("../lib/server-disk-interface");
const fileInterface = new FileInterface(process.env.TREASURY_DIRECTORY);
const fixCellFormats = require("../services/fix-cell-formats");
const {
  categoryDescriptionSourceColumn,
  categoryMap,
  expenditureColumnNames,
  columnNameMap,
  columnTypeMap,
  organizationTypeMap,
  sheetNameMap
} = require("./field-name-mapping");

const { getProjects } = require("../db/projects");

let log = ()=>{};
if ( process.env.VERBOSE ){
  log = console.log;
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
async function createOutputWorkbook(
  wbSpec, // a config object - see ./config.js/makeConfig()
  recordGroups  // a KV object where keys are sheet names, values are arrays
          // of document records of this type (aka spreadsheet rows from
          // these sheets)
) {
  try {
    var appSettings = await applicationSettings() // eslint-disable-line
    /*  {
          title: 'Rhode Island',
          current_reporting_period_id: 1,
          reporting_template: null,
          duns_number: null
        }
    */

  } catch (err) {
    console.dir(err);
    return {};
  }

  try {
    var reportingPeriod = await currentReportingPeriod() // eslint-disable-line

  } catch (err) {
    console.dir(err);
    return {};
  }

  const workbook = XLSX.utils.book_new();

  log(`Sheets are:`);
  Object.keys(recordGroups).forEach(rg=>{
    log(`\t${rg}: ${recordGroups[rg].length} records`);
  });

  let sheetsOut = {};
  for ( let i = 0; i < wbSpec.settings.length; i++ ) {
    let outputSheetSpec = wbSpec.settings[i];
    let outputSheetName = outputSheetSpec.sheetName;
    let outputColumnNames = outputSheetSpec.columns;

    log(`\nComposing output Sheet ${outputSheetName}`);

    // sometimes tabs are empty!
    let sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || [];

    log(`${outputSheetName} has ${sheetRecords.length} records`);

    let rows = [];
    let objSR = null;

    switch (outputSheetName) {
      case "Cover Page":
        rows = getCoverPage(appSettings, reportingPeriod);
        break;

      case "Projects":{
        // doesn't work - doesn't wait!!
        rows = await getProjectsSheet();
        // console.dir(rows);
        break;
      }
      case "Contracts":
      case "Grants":
      case "Loans":
      case "Transfers":
      case "Direct":
        rows = getCategorySheet(outputSheetName, sheetRecords, outputColumnNames);
        break;

      case "Aggregate Payments Individual":
        rows = getAggregatePaymentsIndividualSheet(sheetRecords, outputColumnNames);
        break;

      case "Sub Recipient":
        objSR = getSubRecipientSheet(sheetRecords, outputColumnNames);

        sheetsOut["Unreferenced Sub Recipients"] =
          convertSheet( objSR.orphans, outputColumnNames);

        rows = objSR.subRecipients;
        break;

      case "Aggregate Awards < 50000":
        rows = getAggregateAwardsSheet(sheetRecords, outputColumnNames);
        break;

      default:
        throw new Error(`Unhandled sheet type: ${outputSheetName}`);
    }
    log(`adding sheet ${outputSheetName}`);
    log(`with ${rows.length} rows`);

    sheetsOut[outputSheetName] = convertSheet( rows, outputColumnNames);
  }

  addOutputSheets (
    workbook,
    sheetsOut,
    wbSpec.settings.map( outputSheetSpec => outputSheetSpec.sheetName )
  );

  if (audit()){
    addAuditSheets(workbook, sheetsOut, recordGroups);
  }

  try {
    // eslint-disable-next-line
    var treasuryOutputWorkbook =
      XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  } catch (err) {
    console.dir(err);
  }

  return treasuryOutputWorkbook;
}

function convertSheet( rows, outputColumnNames) {
  rows.unshift(outputColumnNames);
  let sheetOut = XLSX.utils.aoa_to_sheet(rows);
  sheetOut = fixCellFormats(sheetOut);
  return sheetOut;
}

function getCoverPage(appSettings = {}, reportingPeriod = {}) {
  let rows = [
    [
      "Financial Progress Reporting",
      "Coronavirus Relief Fund",

      reportingPeriod.start_date || "Needs a date",
      reportingPeriod.end_date || "Needs a date",
      appSettings.duns_number || "Needs a DUNS number"
    ]
  ];

  return rows;
}

function addAuditSheets (workbook, sheetsOut, recordGroups) {
  sheetsOut[ "Missing Sub Recipients" ] =
    getMissingSubrecipientsSheet(recordGroups);

  return addOutputSheets (
    workbook,
    sheetsOut,
    ["Unreferenced Sub Recipients",
      "Missing Sub Recipients"
    ]
  );
}

function addOutputSheets (workbook, sheetsOut, sheetNames ) {
  sheetNames.forEach( async sheetName => {
    try {
      await XLSX.utils.book_append_sheet(
        workbook, sheetsOut[sheetName], sheetName
      );
    } catch (err) {
      console.dir(err);
      throw err;
    }
  });
}

function  getMissingSubrecipientsSheet(recordGroups){
  let outputColumnNames = [
    "Sub-Recipient",
    "Upload File",
    "Upload Tab"
  ];
  let rows =[];
  rows.push( outputColumnNames );
  let sheetRecords;
  try {
    sheetRecords = recordGroups["missing_subrecipient"] || [];

  } catch(err) {
    console.dir(err);
    throw err;
  }
  sheetRecords.forEach( record => {
      rows.push( [
      record.subrecipient_id,
      record.upload_file,
      record.tab
    ] );
  });
  return XLSX.utils.aoa_to_sheet(rows);
}

async function getProjectsSheet() {
  /* Treasury output sheet columns are:
      Project Name
      Project Identification Number
      Description
      Status
      */
  let projects = await getProjects();
  let rows =[];
  projects.forEach( project => {
    rows.push([
      project.name,
      project.code,
      project.description,
      project.status
    ]);
  });

  return rows;
}

/*  getCategorySheet() handles sheets whose source rows have to be broken
  down into multiple detail rows by expense category.
  */
function getCategorySheet(
  sheetName,
  sheetRecords,  // an array of document records
  outputColumnNames // an array of output column names
) {
  let kvNameCol = getColumnOrds(outputColumnNames);
  let kvExpenseNameCol = getExpenditureColumnOrds(sheetName, kvNameCol);
  let rowsOut = [];

  sheetRecords.forEach(jsonRecord => {
    let jsonRow = jsonRecord.content; // see exports.js/deduplicate()
    let aoaRow = populateCommonFields(outputColumnNames, kvNameCol, jsonRow);

    let written = false;

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
    if (sheetName !== "Loans" || jsonRow["total payment amount"]) {
      written = addDetailRows(jsonRow, aoaRow, kvExpenseNameCol, rowsOut );
    }

    if (!written){
      // write a row even if there has been no activity in this period
      // delete junk fields from empty records
      delete aoaRow[kvExpenseNameCol.project];
      delete aoaRow[kvExpenseNameCol.start];
      delete aoaRow[kvExpenseNameCol.end];
      rowsOut.push(aoaRow);
    }
  });
  return rowsOut;
}

function getAggregateAwardsSheet (sheetRecords) {


  let aggregate = {
    contracts:{ updates:null,obligation:0,expenditure:0 },
    grants:{ updates:null,obligation:0,expenditure:0 },
    loans:{ updates:null,obligation:0,expenditure:0 },
    transfers:{ updates:null,obligation:0,expenditure:0 },
    direct:{ updates:null,obligation:0,expenditure:0 }
  };

  sheetRecords.forEach( sourceRec => {
    let sourceRow = sourceRec.content;
    let category = /Aggregate of (\w+)/.exec(sourceRow["funding type"]);
    if (category) {
      category = category[1].toLowerCase();

    } else {
      console.log("Aggregate Awards record without a category!", sourceRow);
      return;
    }
    Object.keys(sourceRow).forEach(columnName => {

      switch (true) {
      case Boolean(columnName.match("funding")):
        break;

      case Boolean(columnName.match("updates")):
        aggregate[category]["updates"] = sourceRow[columnName];
        break;

      case Boolean(columnName.match("obligation")):
        aggregate[category]["obligation"] += (Number(sourceRow[columnName]) || 0);
        break;

      case Boolean(columnName.match("expenditure")):
        aggregate[category]["expenditure"] += (Number(sourceRow[columnName]) || 0);
        break;

      default:
        console.log(`column ${columnName} not recognized`);
        break;
      }
    } );
  } );

  return [
    ["Aggregate of Contracts Awarded for <$50,000",
      aggregate.contracts.obligation,
      aggregate.contracts.expenditure
    ],
    ["Aggregate of Grants Awarded for <$50,000",
      aggregate.grants.obligation,
      aggregate.grants.expenditure
    ],
    ["Aggregate of Loans Awarded for <$50,000",
      aggregate.loans.obligation,
      aggregate.loans.expenditure
    ],
    ["Aggregate of Transfers Awarded for <$50,000",
      aggregate.transfers.obligation,
      aggregate.transfers.expenditure
    ],
    ["Aggregate of Direct Payments Awarded for <$50,000",
      aggregate.direct.obligation,
      aggregate.direct.expenditure
    ]
  ];
}

function getAggregatePaymentsIndividualSheet (sheetRecords, outputColumnNames) {
  let cqoSourceName = columnNameMap["Current Quarter Obligation"];
  let cqeSourceName = columnNameMap["Current Quarter Expenditure"];

  let cqoTotal = 0;
  let cqeTotal = 0;

  sheetRecords.forEach( sourceRec => {
    cqoTotal += Number(sourceRec.content[cqoSourceName]) || 0;
    cqeTotal += Number(sourceRec.content[cqeSourceName]) || 0;
  } );

  let arrDestRow =[];
  arrDestRow[outputColumnNames.indexOf("Current Quarter Obligation")] = cqoTotal;
  arrDestRow[outputColumnNames.indexOf("Current Quarter Expenditure")] = cqeTotal;

  return [arrDestRow];
}

function getSubRecipientSheet (sheetRecords, outputColumnNames) {
  let dunsSourceName = columnNameMap["DUNS Number"];
  let idSourceName = columnNameMap["Identification Number"];

  // translate the JSON records in this sheet into AOA rows
  let arrRows = [];
  let arrOrphans = [];
  sheetRecords.forEach( jsonRecord => {
    let jsonRow = jsonRecord.content;

    // fix issue #81
    let organizationType = jsonRow["organization type"];
    jsonRow["organization type"] = organizationTypeMap[organizationType];

    // According to the Treasury Data Dictionary: "If DUNS number is
    // filled in, then the rest of the Sub-Recipient fields should not be
    // filled in. The upload process will look up the rest of the fields
    // on SAM.gov."
    if ( jsonRow[dunsSourceName] ) {

      // But we have some records where the DUNS number field is occupied
      // by junk, so we should ignore that.
      if (/^\d{9}$/.exec(jsonRow[dunsSourceName])){ // check for correct format

        delete jsonRow[idSourceName];
        delete jsonRow[columnNameMap["Legal Name"]];
        delete jsonRow[columnNameMap["Address Line 1"]];
        delete jsonRow[columnNameMap["Address Line 2"]];
        delete jsonRow[columnNameMap["Address Line 3"]];
        delete jsonRow[columnNameMap["City Name"]];
        delete jsonRow[columnNameMap["State Code"]];
        delete jsonRow[columnNameMap["Zip+4"]];
        delete jsonRow[columnNameMap["Country Name"]];
        delete jsonRow[columnNameMap["Organization Type"]];

      } else if (jsonRow[idSourceName]) {
        delete jsonRow[dunsSourceName];
      }
    }
    // return an AOA row
    let aoaRow = outputColumnNames.map(columnName => {
      return jsonRow[columnNameMap[columnName]] || null;
    });
    if (!jsonRecord.referenced) {
      arrOrphans.push(aoaRow);

    } else {
      arrRows.push(aoaRow);
    }
  });
  return {
    orphans: arrOrphans,
    subRecipients: arrRows
  };
}

/* getColumnOrds returns a kv where
  K = the destination column name,
  V = the ord of the column in the output sheet
  */
function getColumnOrds( arrColumnNames ){
  let columnOrds = {};
  for ( let i = 0; i<arrColumnNames.length; i++ ) {
    columnOrds[arrColumnNames[i]] = i;
  }
  return columnOrds;
}

/* getExpenditureColumnOrds() returns a kv where
  K = the generic name of an expenditure column (e.g. "amount")
  V = the actual name of that column for a particular sheet (e.g. "Payment Amount")
  see field-name-mappings.js
  */
function getExpenditureColumnOrds(sheetName, columnOrds) {
  let kvExpenseNameCol ={};
  Object.keys(expenditureColumnNames[sheetName]).forEach( key => {
    let columnName = expenditureColumnNames[sheetName][key];
    kvExpenseNameCol[key] = columnOrds[columnName];
  });
  return kvExpenseNameCol;
}

/* populateCommonFields() returns an AOA row array populated with the fields
  common to all the detail rows.
  */
function populateCommonFields(outputColumnNames, kvNameCol, jsonRow){
  let aoaRow =[];
  outputColumnNames.forEach(columnName => {
    let cellValue = jsonRow[columnNameMap[columnName]];
    if ( cellValue ) {

      switch (columnTypeMap[columnName] ) {
        case "string":
          aoaRow[kvNameCol[columnName]] = String(cellValue);
          break;

        case "amount":
          cellValue = Number(cellValue) || 0;
          aoaRow[kvNameCol[columnName]] = _.round(cellValue, 2);
          break;

        default:
          aoaRow[kvNameCol[columnName]] = cellValue;
          break;
      }
    }
  } );
  return aoaRow;
}

/*  addDetailRows() adds one row to the rowsOut array for each occupied
  category field in the jsonRow
  */
function addDetailRows(jsonRow, aoaRow, kvExpenseNameCol, rowsOut ) {
  let written = false;
  Object.keys(jsonRow).forEach(key => {
    // keys are the detail category field names in the source jsonRow
    let amount = Number(jsonRow[key]);

    // ignore categories with zero expenditures
    if ( !amount ) {
      return;
    }

    let category = categoryMap[key] || null ;
    let destRow = aoaRow.slice(); // make a new copy

    switch (category) {
      case null:
      break;

      case "Category Description":
        // ignore for now, we will populate it when we get to
        // "Other Expenditure Amount"
        break;

      case "Items Not Listed Above":
        // If the column "other expenditure amount" is occupied in the
        // input row, put that amount in the Cost or Expenditure Amount
        // column, put "Items Not Listed Above" in the "Cost or
        // Expenditure Category" (or "Loan Category") column, and put the
        // contents of the "other expenditure categories" column in the
        // the "Category Description" column.
        destRow[kvExpenseNameCol.amount] = amount;
        destRow[kvExpenseNameCol.category] = categoryMap[key];
        destRow[kvExpenseNameCol.description] =
          jsonRow[categoryDescriptionSourceColumn];
        rowsOut.push(destRow);
        written = true;
        break;

      default: {
        destRow[kvExpenseNameCol.amount] = amount;
        destRow[kvExpenseNameCol.category] = categoryMap[key];
        rowsOut.push(destRow);
        written = true;
        break;
      }
    }
  });
  return written;
}

function audit() {
  return process.env.AUDIT || false;
}

async function writeOutputWorkbook( filename, workbook ) {
  return fileInterface.writeFileCarefully(filename, workbook);
}

module.exports = {
  createOutputWorkbook,
  writeOutputWorkbook
};

/*                                  *  *  *                                   */
