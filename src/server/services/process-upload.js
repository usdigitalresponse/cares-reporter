const xlsx = require("xlsx");
const { user, createUpload, createDocuments, transact } = require("../db");
const { getTemplate } = require("./get-template");
const { validateFilename } = require("./validate-upload");
const FileInterface = require("../lib/server-disk-interface");
const { ValidationLog } = require("../lib/validation-log");
const {
  parseSpreadsheet,
  spreadsheetToDocuments
} = require("../lib/spreadsheet");
const fileInterface = new FileInterface();

const processUpload = async ({
  filename,
  configuration_id,
  user_id,
  agency_id,
  data
}) => {
  let valog = new ValidationLog();
  valog.append(await validateFilename(filename));
  const templateSheets = await getTemplate();
  if (!valog.success()) {
    return { valog, upload: {} };
  }
  let workbookXlsx;
  try {
    workbookXlsx = xlsx.read(data);
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

  const { documents, valog: docValog } = spreadsheetToDocuments(
    spreadsheet,
    user_id,
    templateSheets
  );
  valog.append(docValog);

  if (!valog.success()) {
    return { valog, upload: {} };
  }

  try {
    await fileInterface.writeFileCarefully(filename, data);
  } catch (e) {
    valog.append(
      e.code === "EEXIST"
        ? `The file ${filename} is already in the database. Should this be a new version?`
        : e.message
    );
  }

  if (!valog.success()) {
    return { valog, upload: {} };
  }

  let upload;
  let result;
  try {
    result = await transact(async trx => {
      const current_user = await user(user_id);
      upload = await createUpload(
        {
          filename,
          configuration_id,
          created_by: current_user.email,
          user_id,
          agency_id
        },
        trx
      );
      // Enhance the documents with the resulting upload.id. Note this needs
      // to be done here to get the upload and document insert operations into
      // the same transaction.
      documents.forEach(doc => (doc.upload_id = upload.id));
      const createResult = createDocuments(documents, trx);
      return createResult;
    });
    console.log(`Inserted ${(result || {}).rowCount} documents.`);
  } catch (e) {
    fileInterface.rmFile(filename);
    valog.append("Upload and import failed. " + e.message);
  }
  return { valog, upload, spreadsheet };
};

module.exports = { processUpload };
