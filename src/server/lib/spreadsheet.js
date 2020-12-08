
const XLSX = require("xlsx");
const _ = require("lodash");
const { ValidationItem } = require("./validation-log");
const { applicationSettings,
  currentReportingPeriod
} = require("../db");

const fixCellFormats = require("../services/fix-cell-formats");
const {
  categoryDescriptionSourceColumn,
  categoryMap,
  expenditureColumnNames,
  columnAliases,
  columnNameMap,
  columnTypeMap,
  organizationTypeMap,
  sheetNameAliases,
  sheetNameMap
} = require("./field-name-mapping");

/* loadSpreadsheet() returns an array containing:
  [
    { sheetName: <the name of this sheet (aka tab aka table)>,
      data: an array of JSON arrays, one for each row in the sheet [
        [col0value, col1value, col2value, ...],
        ...
      ]
    },
    ...
  ]
  */
function loadSpreadsheet(filename) {
  const workbook = XLSX.readFile(filename);
  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    return {
      sheetName,
      data: XLSX.utils.sheet_to_json(sheet, { header: 1 })
    };
  });
}

/* sheetToJson() converts an XLSX sheet to a two dimensional JS array,
  (not really JSON). So the first element in the array will be an array
  of column names
  */
function sheetToJson(sheet, toLower = true) {
  const jsonSheet = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false
  });

  if (_.isEmpty(jsonSheet)) {
    return jsonSheet;
  }
  // jsonSheet[0] is an array of the column names (the first row in the sheet)
  if (toLower) {
    jsonSheet[0] = _.map(jsonSheet[0], colName => {
      const lowerCol = `${colName}`.toLowerCase().trim();
      // 20 11 24 currently this causes a bug by mis-mapping Transfer Amount
      // to award amount
      return columnAliases[lowerCol] || lowerCol;
    });
  }
  return jsonSheet;
}

/*  parseSpreadsheet() verifies that the sheet and column names of the uploaded
  workbook match those of the reference template, and returns the contents
  of the uploaded workbook in a {<sheetName>: <two dimensional array>, ...}.
  */
function parseSpreadsheet(workbook, templateSheets) {
  const valog = [];

  // fix the sheet names
  const normalizedSheets = _.mapKeys(workbook.Sheets, (sheet, sheetName) => {
    return (
      sheetNameAliases[sheetName.toLowerCase().trim()]
      || sheetName.toLowerCase().trim()
    );
  });

  // convert the sheets from xlsx format to AOA format
  const parsedWorkbook = _.mapValues(
    normalizedSheets || {},
    sheet => {
      return sheetToJson( sheet);
    }
  );

  _.forIn(templateSheets, (templateSheet, sheetName) => {
    const workbookSheet = parsedWorkbook[sheetName];
    if (!workbookSheet) {
      return valog.push(
        new ValidationItem({
          message: `Missing tab "${sheetName}"`
        })
      );
    }

    const workbookColumns = workbookSheet[0];
    const templateColumns = templateSheet[0];
    const missingColumns = _.difference(templateColumns, workbookColumns);

    if (missingColumns.length === 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing column "${missingColumns[0]}"`,
          tab: sheetName
        })
      );
    } else if (missingColumns.length > 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing columns "${missingColumns.join("\", \"")}"`,
          tab: sheetName
        })
      );
    }
  });
  return { spreadsheet: parsedWorkbook, valog };
}

/*  spreadsheetToDocuments() returns an array of row objects consisting of:
   {  type:<sheet name>,
      user_id:<user ID>,
      content: {
        <column A title>:<cell contents>,
        <column B title>:<cell contents>,
        ...
      },
      sourceRow: this is a temporary field for error logging that is not
                  not written to the database
    }
  */
async function spreadsheetToDocuments(
  spreadsheet, // { <sheet name>:<two dimensional array>, ... }
  user_id,
  templateSheets
) {
  const valog = [];
  const documents = [];

  _.forIn(templateSheets, (templateSheet, type) => {
    const sheet = spreadsheet[type];
    // This case noted as a validation error in `parseSpreadsheet`
    // but allow for checking of additional errors.
    if (!sheet) return;

    let sheetName = type.trim().toLowerCase();

    switch (sheetName) {
    case "subrecipient":
    case "certification":
    case "cover":
    case "projects":
    case "contracts":
    case "grants":
    case "loans":
    case "transfers":
    case "direct":
    case "aggregate awards < 50000":
    case "aggregate payments individual": {

      // Mark any columns not in the template to be ignored
      const cols = sheet[0].map(col => {
        return templateSheet[0].includes(col) ? col : "ignore";
      });

      sheet.slice(1).forEach((row, i) => {
        if (row.length === 0) return;
        let jsonRow = _.omit(_.zipObject(cols, row), ["ignore"]);
        if (sheetName === "subrecipient" && jsonRow["duns number"]) {
          // populate the identification number field for easier deduplication
          jsonRow["identification number"] = `DUNS${jsonRow["duns number"]}`;
        }
        if (sheetName === "cover") {
          // note in the database this field is called "code", and "id" is
          // not this, but the numeric record id.
          let projectCode = String(jsonRow["project id"]);
          if (projectCode.length < 3) {
            projectCode = ("000" + projectCode).substr(-3);
          }
          jsonRow["project id"] = projectCode;
        }
        documents.push({
          type,
          user_id,
          content: jsonRow,
          // content: clean(jsonRow),
          sourceRow:i+2 // one-based, not zero-based, and title row was omitted
        });
      });
    }
    break;

    default:
      return;
    }
  });
  return { documents, valog };
}

/*  removeSourceRowField() removes the sourceRow field we put into the document
  record to preserve the source row for validation reporting. We need to
  get rid of it before attempting to write the document to the db
  */
function removeSourceRowField(documents){
  return documents.map(document=>{
    delete document.sourceRow;
    return document;
  });
}

function uploadFilename(filename) {
  return `${process.env.UPLOAD_DIRECTORY}/${filename}`;
}

function audit() {
  return process.env.AUDIT || false;
}

/*  createTreasuryOutputWorkbook() takes input records in the form of
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
async function createTreasuryOutputWorkbook(
  wbSpec, // a config object - see config.js/makeConfig()
  recordGroups  // a KV object where keys are sheet names, values are arrays
          // of document records of this type (aka spreadsheet rows from
          // these sheets)
) {
  try {
    var appSettings = await applicationSettings() // eslint-disable-line
    // console.log("createTreasuryOutputWorkbook - appSettings are:");
    // console.dir(appSettings);
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
  let unreferencedSubrecipientsSheet = null;

  console.log(`Sheets are:`);
  Object.keys(recordGroups).forEach(rg=>{
    console.log(`\t${rg}: ${recordGroups[rg].length} records`);
  });

  wbSpec.settings.forEach(outputSheetSpec => {
    let outputSheetName = outputSheetSpec.sheetName;
    console.log(`Composing outputSheet ${outputSheetName}`);
    let outputColumnNames = outputSheetSpec.columns;
    // console.log(`Column names are ${outputColumnNames}`)

    // sometimes tabs are empty!
    let sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || [];

    let rows = [];
    let objSR = null;

    switch (outputSheetName) {
      case "Cover Page":
        rows = getCoverPage(appSettings, reportingPeriod);
        break;

      case "Projects":
        rows = getProjectsSheet(sheetRecords, outputColumnNames);
        break;

      case "Contracts":
      case "Grants":
      case "Loans":
      case "Transfers":
      case "Direct":
        console.log(`${outputSheetName} has ${sheetRecords.length} records`);
        rows = getCategorySheet(outputSheetName, sheetRecords, outputColumnNames);
        console.log(`resulting in ${rows.length} rows`);
        break;

      case "Aggregate Payments Individual":
        rows = getAggregatePaymentsIndividualSheet(sheetRecords, outputColumnNames);
        break;

      case "Sub Recipient":
        objSR = getSubRecipientSheet(sheetRecords, outputColumnNames);
        break;

      case "Aggregate Awards < 50000":
        rows = getAggregateAwardsSheet(sheetRecords, outputColumnNames);
        break;

      default:
        throw new Error(`Unhandled sheet type: ${outputSheetName}`);
    }
    if ( objSR ) {
      rows = objSR.orphans;
      rows.unshift(outputColumnNames);
      unreferencedSubrecipientsSheet = XLSX.utils.aoa_to_sheet(rows);
      unreferencedSubrecipientsSheet =
        fixCellFormats(unreferencedSubrecipientsSheet);
      rows = objSR.subRecipients;
    }

    rows.unshift(outputColumnNames);
    let sheetOut = XLSX.utils.aoa_to_sheet(rows);
    sheetOut = fixCellFormats(sheetOut);

    try {
      XLSX.utils.book_append_sheet(workbook, sheetOut, outputSheetName);

    } catch (err) {
      console.dir(err);
      throw err;
    }

  });  if (audit()){
    addAuditSheets(workbook, unreferencedSubrecipientsSheet, recordGroups);
  }
  try {
    // eslint-disable-next-line
    var treasuryOutputWorkbook =
      await XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  } catch (err) {
    console.dir(err);
  }
  return treasuryOutputWorkbook;
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

function addAuditSheets (workbook, unreferencedSubrecipientsSheet, recordGroups ) {
  let missingSubrecipientsSheet = getMissingSubrecipientsSheet(recordGroups);
  try {
    XLSX.utils.book_append_sheet(
      workbook, unreferencedSubrecipientsSheet, `Unreferenced Sub Recipients`
    );
    XLSX.utils.book_append_sheet(
      workbook, missingSubrecipientsSheet, "Missing Sub-Recipients"
    );
  } catch (err) {
    console.dir(err);
    throw err;
  }
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

function getProjectsSheet(sheetRecords, columns) {
  let projectIDColumnName = columnNameMap["Project Identification Number"];
  let rows =[];
  sheetRecords.forEach(jsRecord => {
    let jsRow = jsRecord.content;
    let projectID = jsRow[projectIDColumnName];
    if( !projectID || projectID === "undefined" ) {
      // console.log("Bad project record:",jsRecord)
      return;
    }
    let aoaRow = columns.map(column => {
      const value = jsRow[columnNameMap[column]];
      return value ? value : null;
    });
    rows.push( aoaRow );
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
    // console.log(`${category}:${sourceRow}`)
    // console.dir(sourceRow)
    Object.keys(sourceRow).forEach(columnName => {

      switch (true) {
        case Boolean(/funding/.exec(columnName)):
          break;

        case Boolean(/updates/.exec(columnName)):
          aggregate[category]["updates"] = sourceRow[columnName];
          break;

        case Boolean(/obligation/.exec(columnName)):
          aggregate[category]["obligation"] += (Number(sourceRow[columnName]) || 0);
          break;

        case Boolean(/expenditure/.exec(columnName)):
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

/* clean() trims strings and rounds amounts
  */
function clean(objRecord) {
  let objCleaned ={};
  Object.keys(objRecord).forEach( key => {
    let val = objRecord[key];
    switch( columnTypeMap[key] ){
      case "amount":
        objCleaned[key]=_.round((Number(val) || 0), 2) || null;
        break;

      case "string":
        objCleaned[key]=String(val).trim() || null;
        break;

      case "date":
        objCleaned[key]=Number(val) || null;
        break;

      default:
        if ( !val ) {
          objCleaned[key]=null;

        } else {
          objCleaned[key]=val;
        }
        break;
    }
  });
  // if (dirty){
  //   console.log(`\n-------------`);
  //   console.log(`\nobjRecord`);
  //   console.dir(objRecord);
  //   console.log(`\objCleaned`);
  //   console.dir(objCleaned);
  // }
  return objCleaned;
}

module.exports = {
  clean,
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  createTreasuryOutputWorkbook,
  sheetToJson,
  removeSourceRowField
};

/*                                  *  *  *                                   */
