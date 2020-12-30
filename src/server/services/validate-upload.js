
let log = ()=>{};
if ( process.env.VERBOSE ){
  log = console.dir;
}

const xlsx = require("xlsx");
const {
  currentReportingPeriodSettings,
  getPriorPeriodSummaries
} = require("../db");

const reportingPeriods = require("../db/reporting-periods");

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

const validateUpload = async ({
  filename,
  user_id,
  agency_id, // eslint-disable-line
  data,
  reporting_period_id
}) => {

  if (!reporting_period_id) {
    const period = await currentReportingPeriodSettings();
    reporting_period_id = period.id;
  }
  const reportingPeriod = await reportingPeriods.get(reporting_period_id);

  let valog = new ValidationLog();
  const { valog: filenameValog, ...fileParts } =
    await parseFilename(filename, reportingPeriod);

  valog.append(filenameValog);
  if (!valog.success()) {
    log(`failed to validate file name`);
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
  if (parseValog.length){
    log(`parseValog failed`);
  }
  valog.append(parseValog);

  const {
    documents: spreadsheetDocuments,
    valog: docValog
  } = await spreadsheetToDocuments(spreadsheet, user_id, templateSheets);
  if (docValog.length){
    log(`docValog failed`);
  }
  valog.append(docValog);

  let documents = removeEmptyDocuments(spreadsheetDocuments);

  const priorPeriodSummaries = await getPriorPeriodSummaries(reportingPeriod.id);
  const firstReportingPeriodStartDate = await reportingPeriods.getFirstStartDate();
  const dataValog = await validateData(
    documents,
    fileParts,
    reportingPeriod,
    priorPeriodSummaries,
    firstReportingPeriodStartDate
  );
  if (dataValog.length){
    log(`dataValog failed`);
    // console.dir(dataValog);
  }
  valog.append(dataValog);

  if (!valog.success()) {
    return { valog, documents: {} };
  }

  documents = removeSourceRowField(documents);

  return { valog, documents, spreadsheet, fileParts, reportingPeriod };

};

module.exports = { validateUpload };
