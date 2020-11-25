
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
  "Sub-Recipient Organization (Contractor)": "subrecipient id",
  "Sub-Recipient Organization (Payee)": "subrecipient id",
  "Sub-Recipient Organization (Awardee)": "subrecipient id",
  "Sub-Recipient Organization (Borrower)": "subrecipient id",
  "Sub-Recipient Organization (Transferee/Government Unit)": "subrecipient id",
  "Transfer Amount": "award amount", // bug fix kluge - see columnAliases/"transfer amount"
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

module.exports = {
  categoryDescriptionSourceColumn,
  categoryMap,
  columnAliases,
  columnNameMap,
  columnTypeMap,
  sheetNameAliases,
  sheetNameMap,
}

