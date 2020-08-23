const XLSX = require("xlsx");

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

module.exports = { loadSpreadsheet, uploadFilename };
