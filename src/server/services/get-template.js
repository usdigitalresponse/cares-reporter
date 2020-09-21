const fs = require("fs");
const xlsx = require("xlsx");
const _ = require("lodash");
const { sheetToJson, tabAliases } = require("../lib/spreadsheet");

const template = xlsx.read(
  fs.readFileSync(`${__dirname}/../data/${process.env.REPORTING_TEMPLATE}`)
);

const templateSheets = {};
_.keys(template.Sheets).forEach(tabName => {
  const sheetName =
    tabAliases[tabName.toLowerCase().trim()] || tabName.toLowerCase().trim();
  const templateSheet = _.get(template, ["Sheets", tabName]);
  templateSheets[sheetName] = sheetToJson(sheetName, templateSheet);
});

const getTemplate = () => {
  return templateSheets;
};

module.exports = { getTemplate };
