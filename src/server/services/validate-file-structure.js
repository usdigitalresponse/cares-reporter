const _ = require("lodash");
const xlsx = require("xlsx");
const { ValidationItem } = require("../lib/validation_log");
const { getTemplate } = require("./get-template");

const validateFileStructure = async parsedXlsx => {
  const valog = [];
  const template = await getTemplate();
  const templateSheets = _.keys(template.Sheets);
  templateSheets.forEach(sheetName => {
    const sheet = _.get(parsedXlsx, ["Sheets", sheetName]);
    if (!sheet) {
      return valog.push(
        new ValidationItem({
          message: `Missing tab "${sheetName}"`
        })
      );
    }
    const templateSheet = _.get(template, ["Sheets", sheetName]);
    const templateColumns = xlsx.utils
      .sheet_to_json(templateSheet, {
        header: 1
      })[0]
      .map(s => s.trim());
    const parsedColumns = xlsx.utils
      .sheet_to_json(sheet, { header: 1 })[0]
      .map(s => s.trim());
    const missingColumns = _.difference(templateColumns, parsedColumns);
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
  return valog;
};

module.exports = { validateFileStructure };
