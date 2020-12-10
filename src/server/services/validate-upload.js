const xlsx = require("xlsx");
const {
  currentReportingPeriod,
  applicationSettings: getApplicationSettings
} = require("../db");
const { getTemplateSheets } = require("./get-template");
const { parseFilename } = require("./parse-filename");
const { ValidationLog } = require("../lib/validation-log");
const { validateData } = require("./validate-data");
const {
  parseSpreadsheet,
  removeSourceRowField,
  spreadsheetToDocuments
} = require("../lib/spreadsheet");

const { removeEmptyDocuments } = require("../lib/remove-empty-documents");

const validateUpload = async ({ filename, user_id, agency_id, data }) => {
  let valog = new ValidationLog();
  const { valog: filenameValog, ...fileParts } = await parseFilename(filename);
  valog.append(filenameValog);
  if (!valog.success()) {
    return { valog, documents: {} };
  }
  let workbookXlsx;
  try {
    workbookXlsx = xlsx.read(data, { type: "buffer" });
  } catch (e) {
    console.log("error", e);
    valog.append(`Can't parse xlsx file ${filename}`);
    return { valog, documents: {} };
  }

  const templateSheets = await getTemplateSheets();
  const { spreadsheet, valog: parseValog } = parseSpreadsheet(
    workbookXlsx,
    templateSheets
  );
  valog.append(parseValog);

  const {
    documents: spreadsheetDocuments,
    valog: docValog
  } = await spreadsheetToDocuments(spreadsheet, user_id, templateSheets);
  valog.append(docValog);

  let documents = removeEmptyDocuments(spreadsheetDocuments);

  const reportingPeriod = await currentReportingPeriod();
  const applicationSettings = await getApplicationSettings();
  const dataValog = await validateData(
    documents,
    fileParts,
    reportingPeriod,
    applicationSettings
  );
  valog.append(dataValog);

  if (!valog.success()) {
    return { valog, documents: {} };
  }

  documents = removeSourceRowField(documents);

  return { valog, documents, spreadsheet, fileParts, reportingPeriod };

};

module.exports = { validateUpload };
