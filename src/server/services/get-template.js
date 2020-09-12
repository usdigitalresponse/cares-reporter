const fs = require("fs");
const xlsx = require("xlsx");
const _ = require("lodash");

const template = xlsx.read(
  fs.readFileSync(`${__dirname}/../data/${process.env.REPORTING_TEMPLATE}`)
);

const templateSheets = {};
_.keys(template.Sheets).forEach(sheetName => {
  const templateSheet = _.get(template, ["Sheets", sheetName]);
  templateSheets[sheetName] = xlsx.utils.sheet_to_json(templateSheet, {
    header: 1
  });
});

const getTemplate = () => {
  return templateSheets;
};

module.exports = { getTemplate };
