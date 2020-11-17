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
// to lower case by getTemplate()
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
// the column names
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
// to lower case by getTemplate()
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

// columnMap keys are column names in the Agency Input Spreadsheet forced
// to lower case by getTemplate()
// values are the column names in the Treasury Output Spreadsheet
// prettier-ignore
const categoryMap = {
  "budgeted personnel and services diverted to a substantially different use":
    "Budgeted Personnel and Services Diverted to a Substantially Different Use",
  "covid-19 testing and contact tracing":
    "COVID-19 Testing and Contact Tracing",
  "economic support (other than small business, housing, and food assistance)":
    "Economic Support (Other than Small Business, Housing, and Food Assistance)",
  "facilitating distance learning": "Facilitating Distance Learning",
  "food programs": "Food Programs",
  "housing support": "Housing Support",
  "improve telework capabilities of public employees":
    "Improve Telework Capabilities of Public Employees",
  "medical expenses": "Medical Expenses",
  "nursing home assistance": "Nursing Home Assistance",
  "payroll for public health and safety employees":
    "Payroll for Public Health and Safety Employees",
  "personal protective equipment": "Personal Protective Equipment",
  "public health expenses": "Public Health Expenses",
  "small business assistance": "Small Business Assistance",
  "unemployment benefits": "Unemployment Benefits",
  "workers’ compensation": "Workers’ Compensation",
  "expenses associated with the issuance of tax anticipation notes":
    "Expenses Associated with the Issuance of Tax Anticipation Notes",
  "administrative expenses": "Administrative Expenses",
  "other expenditure categories": "Other Expenditure Categories",
  "other expenditure amount": "Other Expenditure Amount",
};

/* sheetToJson() converts an XLSX sheet to a two dimensional JS array,
  (not really JSON). So the first element in the array will be an array
  of column names
  */
function sheetToJson(sheetName, sheet, toLower = true) {
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
    (sheet, sheetName) => {
      return sheetToJson(sheetName, sheet);
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

function makeSpreadsheet(template, groups) {
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
    template.settings.forEach(s => {
      // console.log(s.tableName);
      let input;
      let rows = [];
      switch (s.tableName) {
        case "Cover Page":
          rows = getCoverPage(groups, settings);
          break;

        case "Projects":
          rows = getProjectsTab(groups[tabMap[s.tableName]], s.columns);
          break;

        case "Contracts":
        case "Grants":
        case "Transfers":
        case "Direct":
          rows = getCategoryTab(groups[tabMap[s.tableName]], s.columns);
          break;

        case "Loans":
          rows = getLoanTab(groups[tabMap[s.tableName]], s.columns);
          break;

        case "Sub Recipient":
        case "Aggregate Awards < 50000":
        case "Aggregate Payments Individual":
        default:
          input = groups[tabMap[s.tableName]];
          rows = _.map(input, row => {
            return s.columns.map(column => {
              if (column === "ignore") {
                return "";
              }
              const value = row.content[columnMap[column]];
              return value ? value : "";
            });
          });
      }

      rows.unshift(s.columns);

      let sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet = fixCellFormats(sheet);

      XLSX.utils.book_append_sheet(workbook, sheet, s.sheetName);
    });
    return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  });
}

function getCoverPage(groups, settings = {}) {
  let rows = [
    [
      "Financial Progress Reporting",
      "Coronavirus Relief Fund",
      groups.cover[0].content["reporting period start date"],
      groups.cover[0].content["reporting period end date"],
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

function getCategoryTab(group, columns) {
  return spread(group, columns, {
    amountLabel: "Cost or Expenditure Amount",
    categoryLabel: "Cost or Expenditure Category"
  });
}

function getLoanTab(group, columns) {
  return spread(group, columns, {
    amountLabel: "Payment Amount",
    categoryLabel: "Loan Category"
  });
}

function spread(group, columns, labels) {
  const { amountLabel, categoryLabel } = labels;
  let rows = [];
  group.forEach(sourceRow => {
    let rowContent = sourceRow.content;
    Object.keys(rowContent).forEach(key => {
      let category = categoryMap[key];
      if (category) {
        // add a row
        let row = columns.map(column => {
          const value = rowContent[columnMap[column]];
          return value ? value : "";
        });
        let amount = rowContent[key];
        row[columns.indexOf(amountLabel)] = amount;
        row[columns.indexOf(categoryLabel)] = category;
        rows.push(row);
      }
    });
  });
  return rows;
}

module.exports = {
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  makeSpreadsheet,
  sheetToJson
};
