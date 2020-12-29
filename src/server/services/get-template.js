
let log = ()=>{};
if ( process.env.VERBOSE ){
  log = console.dir;
}
let path = require("path");

const fs = require("fs");
const xlsx = require("xlsx");
const _ = require("lodash");
const { sheetToJson } = require("../lib/spreadsheet");
const { currentReportingPeriodSettings } = require("../db/settings");
let template = null;
let templateSheets= null;
let dropdownValues = null;
// Uninitialized templates cause the Record Summary section of the home page
// to be blank
initializeTemplates();

const {
  template: treasuryTemplate,
  templateSheets: treasuryTemplateSheets
} = loadTreasuryTemplate(process.env.TREASURY_TEMPLATE);

module.exports = {
  initializeTemplates,
  getTemplateSheets,
  getDropdownValues,
  treasuryTemplate
};

function getDropdownValues() {
  return dropdownValues;
}

function getTemplateSheets(t = "agency") {
  switch (t) {
    case "agency":
      // agency data input template
      return templateSheets;

    case "treasury":
      // treasury data output template
      return treasuryTemplateSheets;

    default:
      return templateSheets;
  }
}

function loadTreasuryTemplate(fileName) {
  let xlsxTemplate = { Sheets: {} };

  let filePath = path.resolve(__dirname,`../data/${fileName}`);
  // console.log(`loadTreasuryTemplate: filePath is |${filePath}|`);

  // Just let it throw on launch - we can't run without it
  xlsxTemplate = xlsx.read( fs.readFileSync(filePath), { type: "buffer" } );

  const objAoaSheets = {};
  _.keys(xlsxTemplate.Sheets).forEach(sheetName => {
    const rawSheet = xlsxTemplate["Sheets"][sheetName];
    objAoaSheets[sheetName] = sheetToJson(rawSheet, false);
  });
  return { template: xlsxTemplate, templateSheets: objAoaSheets };
}

function loadTemplate(fileName) {
  let xlsxTemplate = { Sheets: {} };
  console.log(fileName);
  console.log(`Database is ${process.env.POSTGRES_URL}`);
  let filePath = path.resolve(__dirname,`../data/${fileName}`);

  // Just let it throw on launch - we can't run without it
  xlsxTemplate = xlsx.read( fs.readFileSync(filePath), { type: "buffer" } );

  const objAoaSheets = {};

  _.keys(xlsxTemplate.Sheets).forEach(tabName => {
    if (tabName === "Dropdowns") return;
    const sheetName = tabName.toLowerCase().trim();
    const templateSheet = _.get(xlsxTemplate, ["Sheets", tabName]);
    objAoaSheets[sheetName] = sheetToJson(templateSheet);
  });
  return { template: xlsxTemplate, templateSheets: objAoaSheets };
}

function loadDropdownValues(dropdownTab) {
  const dropdownSheet = xlsx.utils.sheet_to_json(dropdownTab, {
    header: 1,
    blankrows: false
  });
  const dropdownValues = _.fromPairs(
    _.zip(
      // zip to pair each column name with array of values for each column
      _.map(dropdownSheet[1], _.toLower), // second row is the column name
      _.map(
        // zip to convert each column to an array of values for each column
        // (matrix transpose)
        _.zip(...dropdownSheet.slice(2)),
        // pipe each column array into a map that compacts each array and
        // lowercases values
        colAr => _.map(_.compact(colAr), _.toLower)
      )
    ).slice(1)
  );
  return dropdownValues;
}

async function loadAgencyTemplate() {
  let crp = await currentReportingPeriodSettings();
  // console.dir(crp);
  const templateFileName = crp.reporting_template;
  if (templateFileName === null) {
    throw  new Error(`Current reporting period has no reporting_template`);
  }
  let objTemplate = loadTemplate(templateFileName);
  return objTemplate;
}

async function initializeTemplates(){
  log(`initializeTemplates...`);
  if ( template !== null ) {
    return `dropdowns already initialized`;
  }
  let rv = await loadAgencyTemplate();
  log(`Agency template loaded...`);
  template = rv.template;
  templateSheets = rv.templateSheets;
  dropdownValues = loadDropdownValues(template.Sheets.Dropdowns);
  log(`Dropdown values loaded...`);
  return "OK";
}

/*                                 *  *  *                                    */
