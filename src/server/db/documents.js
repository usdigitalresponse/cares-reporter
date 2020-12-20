/*
  The columns in the postgres document table are:
    id
    type - the spreadsheet tab name
    content - json-coded row contents
    created_at
    upload_id
    last_updated_at
    last_updated_by
    user_id

  List them with
    $ psql ohio postgres
    ohio=# \d documents

  */
const knex = require("./connection");
const _ = require("lodash");

const {
  getPeriodUploadIDs
} = require("./uploads");

async function documentsWithProjectCode(period_id) {

  let periodUploadIDs = await getPeriodUploadIDs(period_id);
  let rv;

  try {
    rv = await knex("documents")
    .select("documents.*", "projects.code as project_code")
    .whereIn("upload_id", periodUploadIDs)
    .join("uploads", { "documents.upload_id": "uploads.id" })
    .join("projects", { "uploads.project_id": "projects.id" })
    .then( purgeDuplicateSubrecipients);

  } catch(err) {
    return err;
  }
  return rv;
}

function purgeDuplicateSubrecipients( arrRecords ) {
  let arrRecordsOut = [];
  let isDuplicate = {};

  arrRecords.forEach( record => {
    switch (record.type) {
      case "subrecipient": {
        // TODO - as of 20 12 01 we are not putting duplicate records into
        // the database, but many are already in there, so we need this
        // until we purge the database.
        let id = String(
          record.content["duns number"] ||
          record.content["identification number"] ||
          ""
        );
        if (isDuplicate[id]) {
          return;

        } else {
          record.content["zip"] = String(record.content["zip"]);
          record.content["identification number"]=id;
          isDuplicate[id] = true;
        }
        break;
      }
      default:
        break;
    }
    arrRecordsOut.push(record);
  } );

  return arrRecordsOut;
}

async function documents(period_id) {
  console.log(`documents()`);
  let periodUploadIDs = await getPeriodUploadIDs(period_id);

  return knex("documents")
  .select("*")
  .whereIn("upload_id", periodUploadIDs)
  .then(purgeDuplicateSubrecipients);
}

async function documentsOfType(type, period_id) {
  console.log(`documentsOfType()`);
  let periodUploadIDs = await getPeriodUploadIDs(period_id);

  return knex("documents")
    .select("*")
    .whereIn("upload_id", periodUploadIDs)
    .where("type", type);
}

async function documentsForAgency(agency_id, period_id) {
  console.log(`documentsForAgency()`);
  let periodUploadIDs = await getPeriodUploadIDs(period_id);

  let docs;
  try{
    docs = await knex("documents")
      .select("documents.*", "projects.code as project_code")
      .whereIn("upload_id", periodUploadIDs)
      .join("uploads", { "documents.upload_id": "uploads.id" })
      .join("projects", { "uploads.project_id": "projects.id" })
      .join("users", { "documents.user_id": "users.id" })
      .where("users.agency_id", agency_id);
  } catch(err) {
    console.dir(err);
  }
  return docs;
}

function createDocument(document) {
  return knex
    .insert(document)
    .into("documents")
    .returning("id")
    .then(id => {
      const result = {
        ...document,
        id: id[0]
      };
      return result;
    });
}

function createDocuments(documents, queryBuilder = knex) {
  return queryBuilder.insert(documents).into("documents");
}

async function deleteDocuments({ agencyCode, projectId, reportingDate }) {
  const uploads = await knex("uploads")
    .select("id")
    .where("filename", "like", `${agencyCode}-${projectId}-${reportingDate}-%`);
  const uploadIds = _.map(uploads, "id");
  const delResult = await knex("documents")
    .del()
    .whereIn("upload_id", uploadIds);
  return delResult;
}

module.exports = {
  createDocument,
  createDocuments,
  deleteDocuments,
  documents,
  documentsForAgency,
  documentsOfType,
  documentsWithProjectCode
};
