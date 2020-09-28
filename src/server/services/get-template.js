const fs = require("fs");
const xlsx = require("xlsx");
const _ = require("lodash");
const { sheetToJson, tabAliases } = require("../lib/spreadsheet");

let template = { Sheets: {} };
console.log(`Loading REPORTING_TEMPLATE: ${process.env.REPORTING_TEMPLATE}`);
try {
  template = xlsx.read(
    fs.readFileSync(`${__dirname}/../data/${process.env.REPORTING_TEMPLATE}`),
    { type: "buffer" }
  );
} catch (e) {
  console.log("Unable to load template:", e.message);
}
console.log(template);

const templateSheets = {};
_.keys(template.Sheets).forEach(tabName => {
  if (tabName === "Dropdowns") return;
  const sheetName =
    tabAliases[tabName.toLowerCase().trim()] || tabName.toLowerCase().trim();
  const templateSheet = _.get(template, ["Sheets", tabName]);
  templateSheets[sheetName] = sheetToJson(sheetName, templateSheet);
});

const dropdownSheet = xlsx.utils.sheet_to_json(template.Sheets.Dropdowns, {
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

const getTemplate = () => {
  return templateSheets;
};

module.exports = { getTemplate, dropdownValues };
