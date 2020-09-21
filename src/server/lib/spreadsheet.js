const XLSX = require("xlsx");
const _ = require("lodash");
const { ValidationItem } = require("./validation-log");

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

const columnAliases = {
  subrecipient: {
    "duns number (hidden)": "duns number"
  },
  contracts: {
    "subrecipient id (hidden)": "subrecipient id"
  }
};

const tabAliases = {
  subrecipients: "subrecipient"
};

function sheetToJson(sheetName, sheet) {
  const jsonSheet = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false
  });
  jsonSheet[0] = jsonSheet[0].map(colName => {
    const lowerCol = colName.toLowerCase().trim();
    return (columnAliases[sheetName] || {})[lowerCol] || lowerCol;
  });
  return jsonSheet;
}

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

    const templateColumns = templateSheet[0];
    const workbookColumns = workbookSheet[0];
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

function spreadsheetToDocuments(spreadsheet, user_id, templateSheets) {
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
  console.log("template:", template);
  const workbook = XLSX.utils.book_new();
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

module.exports = {
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  makeSpreadsheet,
  sheetToJson,
  tabAliases
};
