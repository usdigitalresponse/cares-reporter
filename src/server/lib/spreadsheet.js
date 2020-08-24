const XLSX = require("xlsx");
const _ = require("lodash");

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

function uploadFilename(filename) {
  return `${process.env.UPLOAD_DIRECTORY}/${filename}`;
}

function makeSpreadsheet(template, groups) {
  console.log("template:", template);
  var workbook = XLSX.utils.book_new();
  template.settings.forEach(s => {
    const input = groups[s.tableName];
    const rows = _.map(input, row => {
      return s.columns.map(column => {
        if (column === "ignore") {
          return "";
        }
        const value = row.content[column];
        return value ? value : "";
      });
    });
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, s.sheetName);
  });
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

module.exports = { loadSpreadsheet, uploadFilename, makeSpreadsheet };
