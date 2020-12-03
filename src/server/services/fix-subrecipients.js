const xlsx = require("xlsx");
const { getTemplateSheets } = require("./get-template");
const { upload: getUpload } = require("../db");
const { 
  parseSpreadsheet,
  removeSourceRowField,
  spreadsheetToDocuments
} = require("../lib/spreadsheet");
const { removeEmptyDocuments } = require("../lib/remove-empty-documents");
const { ValidationLog } = require("../lib/validation-log");
const fs = require("fs");
const knex = require("../db/connection");
const _ = require("lodash");

async function fixSubrecipients(id) {
  let valog = new ValidationLog();
  const upload = await getUpload(id);
  console.log('upload:', upload);
  const user_id = upload.user_id;
  const templateSheets = await getTemplateSheets();

  const workbookXlsx = xlsx.read(
      fs.readFileSync(`${process.env.UPLOAD_DIRECTORY}/${upload.filename}`),
      { type: "buffer" }
  );
  console.log('tabs:', _.keys(workbookXlsx.Sheets));
  
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

  const documents = removeSourceRowField(removeEmptyDocuments(spreadsheetDocuments));
  const subrecipients = _.chain(documents)
      .filter({ type: "subrecipient" })
      .map(d => {
        return {
          ...d,
          upload_id: upload.id
        }
      })
      .value();
  
  console.log(subrecipients);
  const result = await knex.insert(subrecipients).into("documents");
  console.log(`Inserted ${(result || {}).rowCount} documents.`);
  return subrecipients;
}

module.exports = { fixSubrecipients }
