const fs = require("fs");
const xlsx = require("xlsx");
const _ = require("lodash");
const { sheetToJson } = require("../lib/spreadsheet");

const { template, templateSheets } = loadTemplate(
  process.env.REPORTING_TEMPLATE
);
// console.dir(templateSheets)

const dropdownValues = loadDropdownValues(template.Sheets.Dropdowns);

const { template: treasuryTemplate, templateSheets: treasuryTemplateSheets } = loadTreasuryTemplate(
  process.env.TREASURY_TEMPLATE
);
// console.dir(treasuryTemplateSheets)

module.exports = { getTemplate, dropdownValues, treasuryTemplate };

function getTemplate(t = "agency") {
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
  let template = { Sheets: {} };

  console.log(`Loading : ${fileName}`);
  try {
    template = xlsx.read(   // eslint-disable-line prettier/prettier
      fs.readFileSync(`${__dirname}/../data/${fileName}`),
      {type: "buffer"}      // eslint-disable-line prettier/prettier
    );
    console.log("Template loaded");
  } catch (e) {
    console.log("Unable to load template:", e.message);
  }

  const templateSheets = {};
  _.keys(template.Sheets).forEach(tabName => {
    const sheetName = tabName;
    const templateSheet = _.get(template, ["Sheets", tabName]);
    templateSheets[sheetName] = sheetToJson(sheetName, templateSheet, false);
  });
  return { template, templateSheets };
}

function loadTemplate(fileName) {
  let template = { Sheets: {} };

  console.log(`Loading : ${fileName}`);
  try {
    template = xlsx.read(   // eslint-disable-line prettier/prettier
      fs.readFileSync(`${__dirname}/../data/${fileName}`),
      {type: "buffer"}      // eslint-disable-line prettier/prettier
    );
    console.log("Template loaded");
  } catch (e) {
    console.log("Unable to load template:", e.message);
  }

  const templateSheets = {};
  _.keys(template.Sheets).forEach(tabName => {
    if (tabName === "Dropdowns") return;
    const sheetName = tabName.toLowerCase().trim();
    const templateSheet = _.get(template, ["Sheets", tabName]);
    templateSheets[sheetName] = sheetToJson(sheetName, templateSheet);
  });
  return { template, templateSheets };
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
        // zip to convert each column to an array of values for each column (matrix transpose)
        _.zip(...dropdownSheet.slice(2)),
        // pipe each column array into a map that compacts each array and lowercases values
        colAr => _.map(_.compact(colAr), _.toLower)
      )
    ).slice(1)
  );
  return dropdownValues;
}
