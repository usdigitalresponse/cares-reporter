const xlsx = require("xlsx");
const {
  agencyByCode,
  currentReportingPeriod,
  user,
  createUpload,
  createDocuments,
  deleteDocuments,
  projectByCode,
  transact
} = require("../db");
const { getTemplate } = require("./get-template");
const { parseFilename } = require("./parse-filename");
const FileInterface = require("../lib/server-disk-interface");
const { ValidationLog } = require("../lib/validation-log");
const { validateData } = require("./validate-data");
const {
  parseSpreadsheet,
  spreadsheetToDocuments
} = require("../lib/spreadsheet");
const fileInterface = new FileInterface();
const { deduplicate } = require("../services/deduplicate");
const { removeEmptyDocuments } = require("../lib/remove-empty-documents");

const processUpload = async ({ filename, user_id, agency_id, data }) => {
  let valog = new ValidationLog();
  const { valog: filenameValog, ...fileParts } = await parseFilename(filename);
  valog.append(filenameValog);
  const templateSheets = await getTemplate();
  if (!valog.success()) {
    return { valog, upload: {} };
  }
  let workbookXlsx;
  try {
    workbookXlsx = xlsx.read(data, { type: "buffer" });
  } catch (e) {
    console.log("error", e);
    valog.append(`Can't parse xlsx file ${filename}`);
    return { valog, upload: {} };
  }

  const { spreadsheet, valog: parseValog } = parseSpreadsheet(
    workbookXlsx,
    templateSheets
  );
  valog.append(parseValog);

  const {
    documents: spreadsheetDocuments,
    valog: docValog
  } = spreadsheetToDocuments(spreadsheet, user_id, templateSheets);
  valog.append(docValog);

  let documents = removeEmptyDocuments(spreadsheetDocuments);

  const reportingPeriod = await currentReportingPeriod();
  const dataValog = await validateData(documents, fileParts, reportingPeriod);
  valog.append(dataValog);

  if (!valog.success()) {
    return { valog, upload: {} };
  }

  documents = await deduplicate(documents);

  try {
    await fileInterface.writeFileCarefully(filename, data);
  } catch (e) {
    valog.append(
      e.code === "EEXIST"
        ? `The file ${filename} is already in the database. Change the version number to upload again.`
        : e.message
    );
  }

  if (!valog.success()) {
    return { valog, upload: {} };
  }

  let upload;
  let result;
  try {
    const project = await projectByCode(fileParts.projectId);
    const agency = await agencyByCode(fileParts.agencyCode);
    if (agency[0]) {
      agency_id = agency[0].id;
    }
    result = await transact(async trx => {
      const current_user = await user(user_id);
      // write an upload record for saved file
      upload = await createUpload(
        {
          filename,
          created_by: current_user.email,
          user_id,
          agency_id,
          project_id: project[0].id,
          reporting_period_id: reportingPeriod.id
        },
        trx
      );
      // delete existing records for this agencyCode-projectID-reportingDate
      await deleteDocuments(fileParts);

      // Enhance the documents with the resulting upload.id. Note this needs
      // to be done here to get the upload and document insert operations into
      // the same transaction.
      documents.forEach(doc => (doc.upload_id = upload.id));
      const createResult = createDocuments(documents, trx);
      return createResult;
    });
    console.log(`Inserted ${(result || {}).rowCount} documents.`);
  } catch (e) {
    try {
      fileInterface.rmFile(filename);
    } catch (rmErr) {
      // This should never happen.
      console.error("rmFile error:", rmErr.message);
    }
    valog.append("Upload and import failed. " + e.message);
  }

  return { valog, upload, spreadsheet };
};

module.exports = { processUpload };
