const XLSX = require("xlsx");
const _ = require("lodash");
const { ValidationItem } = require("./validation-log");
const { applicationSettings } = require("../db");
const fixCellFormats = require("../services/fix-cell-formats");

function loadSpreadsheet(filename) {
  const workbook = XLSX.readFile(filename);
  return workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name];
    return {
      name,
      data: XLSX.utils.sheet_to_json(sheet, { header: 1 })
    };
  });
}

// tabMap keys are the tab names in the Treasury Output Spreadsheet,
// values are the tab names in the Agency Input Spreadsheet, forced
// to lower case by getTemplateSheets().
// The values go in the 'type' field in the 'documents' table of the database
// prettier-ignore
const tabMap = {
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

// prettier-ignore
const tabAliases = {
  subrecipients: "subrecipient",
};

// columnMap keys are column names in the Treasury Output Spreadsheet,
// values are the column names in the Agency Input Spreadsheet, forced
// to lower case by getTemplateSheets()
// prettier-ignore
const columnMap = {
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

const categoryDescriptionSourceColumn = "other expenditure categories"

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
    jsonSheet[0] = jsonSheet[0].map(colName => {
      const lowerCol = colName.toLowerCase().trim();
      return columnAliases[lowerCol] || lowerCol;
    });
  }
  return jsonSheet;
}

/*  parseSpreadsheet() verifies that the tabs and columns of the uploaded
  workbook match those of the reference template, and returns the contents
  of the uploaded workbook in a {<tabName>: <two dimensional array>, ...}.
  */
function parseSpreadsheet(workbook, templateSheets) {
  const valog = [];
  const normalizedSheets = _.mapKeys(workbook.Sheets, (tab, tabName) => {
    return (
      tabAliases[tabName.toLowerCase().trim()] || tabName.toLowerCase().trim()
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
   {  type:<tab name>,
      user_id:<user ID>,
      content: {
        <column A title>:<cell contents>,
        <column B title>:<cell contents>,
        ...
      }
    }
  */
function spreadsheetToDocuments(
  spreadsheet, // { <tab name>:<two dimensional array>, ... }
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

/*  makeSpreadsheet()
  */
function makeSpreadsheet(
  config, // a config object - see config.js/makeConfig()
  groups  // a KV object where keys are sheet names, values are arrays of
          // document records of this type (aka spreadsheet rows from these
          // sheets)
) {
  return applicationSettings().then(settings => {
    // console.log("makeSpreadsheet - settings are:");
    // console.dir(settings);
    /*  {
          title: 'Rhode Island',
          current_reporting_period_id: 1,
          reporting_template: null,
          duns_number: null
        }
    */
    const workbook = XLSX.utils.book_new();
    config.settings.forEach(sheet => {
      let sheetName = sheet.sheetName
      let columnNames = sheet.columns
      // sometimes tabs are empty!
      let arrGroup = groups[tabMap[sheetName]] || []

      let rows = [];
      switch (sheetName) {
        case "Cover Page":
          rows = getCoverPage(groups, settings);
          break;

        case "Projects":
          rows = getProjectsTab(arrGroup, columnNames);
          break;

        case "Contracts":
        case "Grants":
        case "Loans":
        case "Transfers":
        case "Direct":
          rows = getCategoryTab(sheetName, arrGroup, columnNames);
          break;

        case "Sub Recipient":
        case "Aggregate Awards < 50000":
        case "Aggregate Payments Individual":
        default:
          rows = _.map(arrGroup, row => {
            return columnNames.map(columnName => {
              const value = row.content[columnMap[columnName]];
              return value ? value : null;
            });
          });
      }

      rows.unshift(columnNames);

      let sheetOut = XLSX.utils.aoa_to_sheet(rows);
      sheetOut = fixCellFormats(sheetOut);

      XLSX.utils.book_append_sheet(workbook, sheetOut, sheetName);
    });
    return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  });
}

function getCoverPage(groups, settings = {}) {
  let rows = [
    [
      "Financial Progress Reporting",
      "Coronavirus Relief Fund",

      settings.current_reporting_period_id,
      settings.current_reporting_period_id,
      settings.duns_number || "000-00-DUNS"
    ]
  ];

  return rows;
}

function getProjectsTab(input, columns) {
  let rows = _.map(input, row => {
    return columns.map(column => {
      const value = row.content[columnMap[column]];
      return value ? value : "";
    });
  });

  return rows;
}

function getCategoryTab(
  sheetName,
  group,  // an array of document records
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

  group.forEach(sourceRow => {
    sourceRow = sourceRow.content; // see exports.js/deduplicate()
    let arrRow =[]

    // populate the common fields
    arrColumnNames.forEach(columnName => {
      if ( sourceRow[columnMap[columnName]] ) {
        arrRow[columnOrds[columnName]] = sourceRow[columnMap[columnName]]
      }
    } )
    Object.keys(sourceRow).forEach(key => {
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
          destRow[amountColumnOrd] = sourceRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          destRow[descriptionColumnOrd] = sourceRow[categoryDescriptionSourceColumn]
          rowsOut.push(destRow);
          break

        default: {
          destRow[amountColumnOrd] = sourceRow[key]
          destRow[categoryColumnOrd] = categoryMap[key]
          rowsOut.push(destRow);

          break
        }
      }
    });
  });
  return rowsOut;
}

module.exports = {
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  makeSpreadsheet,
  sheetToJson
};

/*                                  *  *  *                                   */
