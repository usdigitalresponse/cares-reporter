
const XLSX = require("xlsx");
const _ = require("lodash");
const { ValidationItem } = require("./validation-log");
const { applicationSettings, currentReportingPeriod } = require("../db");
const fixCellFormats = require("../services/fix-cell-formats");

/*  sheetNameMap keys are the sheet names in the Treasury Output Spreadsheet,
  values are the sheet names in the Agency Input Spreadsheet, forced
  to lower case by getTemplateSheets().
  The values go in the 'type' field in the 'documents' table of the database,
  which are used to group the records into output sheets
  */
// prettier-ignore
const sheetNameMap = {
  "Cover Page": "cover",
  "Projects": "projects",
  "Sub Recipient": "subrecipient",
  "Contracts": "contracts",
  "Grants": "grants",
  "Loans": "loans",
  "Transfers": "transfers",
  "Direct": "direct",
  "Aggregate Awards < 50000": "aggregate awards < 50000",
  "Aggregate Payments Individual": "aggregate payments individual",
};

/*  sheetNameAliases are needed by the test fixtures, which have old versions of
  the sheet names.
  Keys are the sheet names in the input spreadsheets, values are what
  they are called in the document records of the database.
  */
// prettier-ignore
const sheetNameAliases = {
  subrecipients: "subrecipient",
};

/*  columnNameMap keys are column names in the Treasury Output Workbook,
  values are the column names in the Agency Input Workbooks, forced
  to lower case by getTemplateSheets()
*/
// prettier-ignore
const columnNameMap = {
  "Address Line 1": "address line 1",
  "Address Line 2": "address line 2",
  "Address Line 3": "address line 3",
  "Award Amount": "award amount",
  "Award Date": "award date",
  "Award Description": "award description",
  "Award Number": "award number",
  "Award Payment Method": "award payment method",
  "Category Description": "category description",
  "City Name": "city name",
  "Contract Amount": "contract amount",
  "Contract Date": "contract date",
  "Contract Description": "contract description",
  "Contract Number": "contract number",
  "Contract Type": "contract type",
  "Cost or Expenditure Amount": "cost or expenditure amount",
  "Cost or Expenditure Category": "cost or expenditure category",
  "Country Name": "country name",
  "Current Quarter Expenditure": "current quarter expenditure",
  "Current Quarter Expenditure/Payments":
    "current quarter expenditure/payments",
  "Current Quarter Obligation": "current quarter obligation",
  "Description": "description",
  "DUNS Number": "duns number",
  "Expenditure End Date": "expenditure end date",
  "Expenditure Project": "project id",
  "Expenditure Start Date": "expenditure start date",
  "Funding Type": "funding type",
  "Identification Number": "identification number",
  "Is awardee complying with terms and conditions of the grant?": "compliance",
  "Legal Name": "legal name",
  "Loan Amount": "loan amount",
  "Loan Category": "loan category",
  "Loan Date": "loan date",
  "Loan Description": "loan description",
  "Loan Expiration Date": "loan expiration date",
  "Loan Number": "loan number",
  "Non-Compliance Explanation": "compliance explanation",
  "Obligation Amount": "obligation amount",
  "Obligation Date": "obligation date",
  "Obligation Project": "project id",
  "Organization Type": "organization type",
  "Payment Amount": "payment amount",
  "Payment Date": "payment date",
  "Payment Project": "project id",
  "Period of Performance End Date": "period of performance end date",
  "Period of Performance Start Date": "period of performance start date",
  "Primary Place of Performance Address Line 1":
    "primary place of performance address line 1",
  "Primary Place of Performance Address Line 2":
    "primary place of performance address line 2",
  "Primary Place of Performance Address Line 3":
    "primary place of performance address line 3",
  "Primary Place of Performance City Name":
    "primary place of performance city name",
  "Primary Place of Performance Country Name":
    "primary place of performance country name",
  "Primary Place of Performance State Code":
    "primary place of performance state code",
  "Primary Place of Performance Zip+4": "primary place of performance zip",
  "Prime Recipient DUNS #": "prime recipient duns #",
  "Program": "program",
  "Project Identification Number": "project identification number",
  "Project Name": "project name",
  "Purpose Description": "purpose description",
  "Report Name": "report name",
  "Reporting Period End Date": "reporting period end date",
  "Reporting Period Start Date": "reporting period start date",
  "State Code": "state code",
  "Status": "status",
  "Sub-Recipient Organization (Contractor)": "subrecipient legal name",
  "Sub-Recipient Organization (Payee)": "subrecipient legal name",
  "Sub-Recipient Organization (Awardee)": "subrecipient legal name",
  "Sub-Recipient Organization (Borrower)": "subrecipient legal name",
  "Sub-Recipient Organization (Transferee/Government Unit)":
    "subrecipient legal name",
  "Transfer Amount": "transfer amount",
  "Transfer Date": "transfer date",
  "Transfer Number": "transfer number",
  "Transfer Type": "transfer type",
  "Will these payments be repurposed for Future Use?":
    "will these payments be repurposed for future use?",
  "Zip+4": "zip",
  // "Primary Place of Performance Zip+4": "primary place of performance zip+4",
  // "Expenditure Project":"total expenditure amount",
};
// prettier-ignore
const columnTypeMap = {
  "Address Line 1": "string",
  "Address Line 2": "string",
  "Address Line 3": "string",
  "Award Amount": "number",
  "Award Date": "date",
  "Award Description": "string",
  "Award Number": "string",
  "Award Payment Method": "string",
  "Category Description": "string",
  "City Name": "string",
  "Contract Amount": "number",
  "Contract Date": "date",
  "Contract Description": "string",
  "Contract Number": "string",
  "Contract Type": "string",
  "Cost or Expenditure Amount": "number",
  "Cost or Expenditure Category": "string",
  "Country Name": "string",
  "Current Quarter Expenditure": "number",
  "Current Quarter Expenditure/Payments": "number",
  "Current Quarter Obligation": "number",
  "Description": "string",
  "DUNS Number": "string",
  "Expenditure End Date": "date",
  "Expenditure Project": "string",
  "Expenditure Start Date": "date",
  "Funding Type": "string",
  "Identification Number": "string",
  "Is awardee complying with terms and conditions of the grant?": "string",
  "Legal Name": "string",
  "Loan Amount": "number",
  "Loan Category": "string",
  "Loan Date": "date",
  "Loan Description": "string",
  "Loan Expiration Date": "date",
  "Loan Number": "string",
  "Non-Compliance Explanation": "string",
  "Obligation Amount": "number",
  "Obligation Date": "date",
  "Obligation Project": "string",
  "Organization Type": "string",
  "Payment Amount": "number",
  "Payment Date": "date",
  "Payment Project": "string",
  "Period of Performance End Date": "date",
  "Period of Performance Start Date": "date",
  "Primary Place of Performance Address Line 1":"string",
  "Primary Place of Performance Address Line 2":"string",
  "Primary Place of Performance Address Line 3":"string",
  "Primary Place of Performance City Name":"string",
  "Primary Place of Performance Country Name":"string",
  "Primary Place of Performance State Code":"string",
  "Primary Place of Performance Zip+4": "string",
  "Prime Recipient DUNS #": "string",
  "Program": "string",
  "Project Identification Number": "string",
  "Project Name": "string",
  "Purpose Description": "string",
  "Report Name": "string",
  "Reporting Period End Date": "date",
  "Reporting Period Start Date": "date",
  "State Code": "string",
  "Status": "string",
  "Sub-Recipient Organization (Contractor)": "string",
  "Sub-Recipient Organization (Payee)": "string",
  "Sub-Recipient Organization (Awardee)": "string",
  "Sub-Recipient Organization (Borrower)": "string",
  "Sub-Recipient Organization (Transferee/Government Unit)":"string",
  "Transfer Amount": "number",
  "Transfer Date": "date",
  "Transfer Number": "number",
  "Transfer Type": "string",
  "Will these payments be repurposed for Future Use?":"string",
  "Zip+4": "string",
  // "Primary Place of Performance Zip+4": "string",
  // "Expenditure Project":"string",
};

// columnAliases are needed by the test fixtures, which have old versions of
// the column names.
// Keys are the column names in the input spreadsheets, values are what
// they are called in the document records of the database.
const columnAliases = {
  "duns number (hidden)": "duns number",
  "subrecipient id (hidden)": "subrecipient id",
  "subrecipient organization": "subrecipient legal name",
  "subrecipient organization name": "subrecipient legal name",
  "subrecipient organization (borrower)": "subrecipient legal name",
  "subrecipient organization (transferee/government unit)":
    "subrecipient legal name",
  "transfer amount": "award amount",
  "is awardee complying with terms and conditions of the grant?": "compliance",
  "awardee primary place of performance address line 1":
    "primary place of performance address line 1",
  "awardee primary place of performance address line 2":
    "primary place of performance address line 2",
  "awardee primary place of performance address line 3":
    "primary place of performance address line 3"
};

// categoryMap keys are column names in the Agency Data Input Spreadsheet
// forced to lower case by getTemplateSheets(). Values go in in the category
// column of the Treasury Data Output Spreadsheet.
// Each row in the agency data input spreadsheet has a column for each of
// these categories, which contains a dollar amount or is left blank. So a
// single row of the input spreadsheet can contain multiple dollar amounts.
// In the Treasury data output spreadsheet each of these dollar amounts is
// given a row of its own, and a category. The category is found in this
// categoryMap, keyed by the input spreadsheet column name.
//
// List from Treasury Data Dictionary
//   Administrative Expenses
//   Budgeted Personnel and Services Diverted to a Substantially Different Use
//   COVID-19 Testing and Contact Tracing
//   Economic Support (Other than Small Business, Housing, and Food Assistance)
//   Expenses Associated with the Issuance of Tax Anticipation Notes
//   Facilitating Distance Learning
//   Food Programs
//   Housing Support
//   Improve Telework Capabilities of Public Employees
//   Medical Expenses
//   Nursing Home Assistance
//   Payroll for Public Health and Safety Employees
//   Personal Protective Equipment
//   Public Health Expenses
//   Small Business Assistance
//   Unemployment Benefits
//   Workers' Compensation
//   Items Not Listed Above

// prettier-ignore
const categoryMap = {
  "administrative expenses" : "Administrative Expenses",
  "budgeted personnel and services diverted to a substantially different use" :"Budgeted Personnel and Services Diverted to a Substantially Different Use",
  "covid-19 testing and contact tracing" :"COVID-19 Testing and Contact Tracing",
  "economic support (other than small business, housing, and food assistance)" :"Economic Support (Other than Small Business, Housing, and Food Assistance)",
  "expenses associated with the issuance of tax anticipation notes" :"Expenses Associated with the Issuance of Tax Anticipation Notes",
  "facilitating distance learning" :"Facilitating Distance Learning",
  "food programs" :"Food Programs",
  "housing support" :"Housing Support",
  "improve telework capabilities of public employees" :"Improve Telework Capabilities of Public Employees",
  "medical expenses" :"Medical Expenses",
  "nursing home assistance" :"Nursing Home Assistance",
  "payroll for public health and safety employees" :"Payroll for Public Health and Safety Employees",
  "personal protective equipment" :"Personal Protective Equipment",
  "public health expenses" :"Public Health Expenses",
  "small business assistance" :"Small Business Assistance",
  "unemployment benefits" :"Unemployment Benefits",
  "workers’ compensation" :"Workers' Compensation",
  "other expenditure amount" :"Items Not Listed Above",
  "other expenditure categories" :"Category Description",
};

const categoryDescriptionSourceColumn = "other expenditure categories";

/* loadSpreadsheet() returns an object containing:
  {
    sheetName: <the name of this sheet (aka tab aka table),
    data: an AOA of cell values.
  }
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

  const normalizedSheets = _.mapKeys(workbook.Sheets, (sheet, sheetName) => {
    return (
      sheetNameAliases[sheetName.toLowerCase().trim()]
      || sheetName.toLowerCase().trim()
    );
  });

  const parsedWorkbook = _.mapValues(
    normalizedSheets || {},
    (sheet) => {
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
          message: `Missing columns "${missingColumns.join('", "')}"`,
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
      }
    }
  */
function spreadsheetToDocuments(
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
    // These two are never needed for uploads.
    if (["Summary", "Dropdowns"].includes(type)) return;
    // These are mostly ignored, but may have some specific validations.
    if (type === "Cover") return;
    if (type === "Projects") return;
    if (type === "Agencies") return;
    // Mark any columns not in the template to be ignored
    const cols = sheet[0].map(col => {
      return templateSheet[0].includes(col) ? col : "ignore";
    });
    sheet.slice(1).forEach(row => {
      if (row.length === 0) return;
      documents.push({
        type,
        user_id,
        content: _.omit(_.zipObject(cols, row), ["ignore"])
      });
    });
  });
  return { documents, valog };
}

function uploadFilename(filename) {
  return `${process.env.UPLOAD_DIRECTORY}/${filename}`;
}

/*  createTreasuryOutputWorkbook() takes input records in the form of
      { <type (this is the source sheet name)>: [
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
    console.dir(err)
    return {}
  }

  try {
    var reportingPeriod = await currentReportingPeriod() // eslint-disable-line

  } catch (err) {
    console.dir(err)
    return {}
  }

  const workbook = XLSX.utils.book_new();

  // console.log(`wbSpec.settings is:`)
  // console.dir(wbSpec.settings);
  wbSpec.settings.forEach(outputSheetSpec => {
    let outputSheetName = outputSheetSpec.sheetName
    // console.log(`Composing outputSheet ${outputSheetName}`)
    let outputColumnNames = outputSheetSpec.columns
    // console.log(`Column names are ${outputColumnNames}`)
    // sometimes tabs are empty!
    let sheetRecords = recordGroups[sheetNameMap[outputSheetName]] || []
    console.dir(`Processing ${sheetRecords.length} ${outputSheetName} records`)

    let rows = [];
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
        rows = getCategorySheet(outputSheetName, sheetRecords, outputColumnNames);
        break;

      case "Aggregate Payments Individual":
        rows = getAggregatePaymentsIndividualSheet(sheetRecords, outputColumnNames)
        break

      case "Sub Recipient":
        rows = getSubRecipientSheet(sheetRecords, outputColumnNames)
        break

      case "Aggregate Awards < 50000":
        rows = getAggregateAwardsSheet(sheetRecords, outputColumnNames)
        break

      default:
        throw new Error(`Unhandled sheet type: ${outputSheetName}`)
    }

    rows.unshift(outputColumnNames);

    let sheetOut = XLSX.utils.aoa_to_sheet(rows);
    sheetOut = fixCellFormats(sheetOut);

    XLSX.utils.book_append_sheet(workbook, sheetOut, outputSheetName);

  });
  try {
    // eslint-disable-next-line
    var treasuryOutputWorkbook =
      await XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  } catch (err) {
    console.dir(err)
  }
  return treasuryOutputWorkbook
}

function getCoverPage(appSettings = {}, reportingPeriod = {}) {
  console.dir(`typeof reportingPeriod.start_date is ${typeof reportingPeriod.start_date}`)
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

function getProjectsSheet(sheetRecords, columns) {
  let projectIDColumnName = columnNameMap["Project Identification Number"]
  let rows =[]
  sheetRecords.forEach(jsRecord => {
    let jsRow = jsRecord.content
    let projectID = jsRow[projectIDColumnName]
    if( !projectID || projectID === "undefined" ) {
      console.log("Bad project record:",jsRecord)
      return
    }
    let arrRow = columns.map(column => {
      const value = jsRow[columnNameMap[column]];
      return value ? value : null;
    });
    rows.push( arrRow );
  })
  return rows;
}

function getCategorySheet(
  sheetName,
  sheetRecords,  // an array of document records
  arrColumnNames // an array of output column names
) {

  let columnOrds = {}
  for ( let i = 0; i<arrColumnNames.length; i++ ) {
    columnOrds[arrColumnNames[i]] = i
  }

  let rowsOut = [];

  let amountColumnOrd = columnOrds["Cost or Expenditure Amount"]
  let categoryColumnOrd = columnOrds["Cost or Expenditure Category"]
  let descriptionColumnOrd = columnOrds["Category Description"]

  if (sheetName === "Loans" ) {
    amountColumnOrd = columnOrds["Payment Amount"]
    categoryColumnOrd = columnOrds["Loan Category"]
  }

  sheetRecords.forEach(jsonRecord => {
    let jsonRow = jsonRecord.content; // see exports.js/deduplicate()
    let arrRow =[]

    // populate the common fields
    arrColumnNames.forEach(columnName => {
      let cellValue = jsonRow[columnNameMap[columnName]]
      if ( cellValue ) {
        switch (columnTypeMap[columnName] ) {
          case "string":
            arrRow[columnOrds[columnName]] = String(cellValue)
            break
          default:
            arrRow[columnOrds[columnName]] = cellValue
            break
        }
      }
    } )


    Object.keys(jsonRow).forEach(key => {
      let category = categoryMap[key] || null ;
      let destRow = arrRow.slice()

      switch (category) {
        case null:
        break

        case "Category Description":
          // ignore for now, we will populate it when we get to
          // "Other Expenditure Amount"
          break

        case "Items Not Listed Above":
          // If the column "other expenditure amount" is occupied in the
          // input row, put that amount in the Cost or Expenditure Amount
          // column, put "Items Not Listed Above" in the "Cost or
          // Expenditure Category" (or "Loan Category") column, and put the
          // contents of the "other expenditure categories" column in the
          // the "Category Description" column.
          destRow[amountColumnOrd] = jsonRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          destRow[descriptionColumnOrd] = jsonRow[categoryDescriptionSourceColumn]
          rowsOut.push(destRow);
          break

        default: {
          destRow[amountColumnOrd] = jsonRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          rowsOut.push(destRow);

          break
        }
      }
    });
  });
  return rowsOut;
}

function getAggregateAwardsSheet (sheetRecords) {


  let aggregate = {
    contracts:{updates:null,obligation:0,expenditure:0},
    grants:{updates:null,obligation:0,expenditure:0},
    loans:{updates:null,obligation:0,expenditure:0},
    transfers:{updates:null,obligation:0,expenditure:0},
    direct:{updates:null,obligation:0,expenditure:0},
  }

  sheetRecords.forEach( sourceRec => {
    let sourceRow = sourceRec.content
    let category = /Aggregate of (\w+)/.exec(sourceRow['funding type'])
    if (category) {
      category = category[1].toLowerCase()
    } else {
      console.log("Aggregate Awards record without a category!", sourceRow)
      return
    }
    console.log(`${category}:${sourceRow}`)
    console.dir(sourceRow)
    Object.keys(sourceRow).forEach(columnName => {

      switch (true) {
        case Boolean(/funding/.exec(columnName)):
          break

        case Boolean(/updates/.exec(columnName)):
          aggregate[category]["updates"] = sourceRow[columnName]
          break

        case Boolean(/obligation/.exec(columnName)):
          aggregate[category]["obligation"] += (Number(sourceRow[columnName]) || 0)
          break

        case Boolean(/expenditure/.exec(columnName)):
          aggregate[category]["expenditure"] += (Number(sourceRow[columnName]) || 0)
          break

        default:
          console.log(`column ${columnName} not recognized`)
          break
      }
    } )
  } )

  return [
    [ "Aggregate of Contracts Awarded for <$50,000",
      aggregate.contracts.obligation,
      aggregate.contracts.expenditure
    ],
    [ "Aggregate of Grants Awarded for <$50,000",
      aggregate.grants.obligation,
      aggregate.grants.expenditure
    ],
    [ "Aggregate of Loans Awarded for <$50,000",
      aggregate.loans.obligation,
      aggregate.loans.expenditure
    ],
    [ "Aggregate of Transfers Awarded for <$50,000",
      aggregate.transfers.obligation,
      aggregate.transfers.expenditure
    ],
    [ "Aggregate of Direct Payments Awarded for <$50,000",
      aggregate.direct.obligation,
      aggregate.direct.expenditure
    ],
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
  } )

  let arrDestRow =[];
  arrDestRow[outputColumnNames.indexOf("Current Quarter Obligation")] = cqoTotal;
  arrDestRow[outputColumnNames.indexOf("Current Quarter Expenditure")] = cqeTotal;

  return [arrDestRow];
}

function getSubRecipientSheet (sheetRecords, outputColumnNames) {
  let dunsSourceName = columnNameMap["DUNS Number"];
  let idSourceName = columnNameMap["Identification Number"];

  // translate the JSON records in this sheet into AOA rows
  return _.map(sheetRecords, jsonRecord => {
    let jsonRow = jsonRecord.content

    // Treasury Data Dictionary says that if there is a DUNS number the ID
    // field should be empty. But we have some records where the DUNS number
    // field is occupied by junk, so we should ignore that.
    if ( jsonRow[dunsSourceName] ) {
      if (/^\d{9}$/.exec(jsonRow[dunsSourceName])){ // check for correct format
        delete jsonRow[idSourceName]

      } else if (jsonRow[idSourceName]) {
        delete jsonRow[dunsSourceName]
      }
    }
    // return an AOA row
    return outputColumnNames.map(columnName => {
      return jsonRow[columnNameMap[columnName]] || null
    });
  })
}


module.exports = {
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  createTreasuryOutputWorkbook,
  sheetToJson
};

/*                                  *  *  *                                   */
