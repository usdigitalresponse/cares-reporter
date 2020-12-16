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
  currentReportingPeriod,
  getCurrentReportingPeriodID
} = require("./settings");
const { getReportingPeriod } = require("./reporting-periods");

async function documentsWithProjectCode(period_id) {
  if ( !period_id ) {
    period_id = await getCurrentReportingPeriodID();
  }
  let periodUploads = await knex("uploads")
    .select("id")
    .where({ "reporting_period_id": period_id })
    .then( recs => recs.map( rec => rec.id));
  // periodUploads = periodUploads.map( rec => rec.id);

  return knex("documents")
    .select("documents.*", "projects.code as project_code")
    .whereIn("upload_id", periodUploads)
    .join("uploads", { "documents.upload_id": "uploads.id" })
    .join("projects", { "uploads.project_id": "projects.id" })
    .then( purgeDuplicateSubrecipients);
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

function documents() {
  return knex("documents").select("*").then(purgeDuplicateSubrecipients);
}

function documentsInPeriod( period_id ) {
  let period;
  if ( period_id ) {
    period = getReportingPeriod( period_id );

  } else {
    period = currentReportingPeriod();
  }

  return period.then(reportingPeriod => {
    console.log(
      `reporting period is ${reportingPeriod.start_date} `+
      `to ${reportingPeriod.end_date}`
    );
    return documents();
  });
}

function documentsOfType(type) {
  return knex("documents")
    .select("*")
    .where("type", type);
}

function documentsForAgency(agency_id) {
  return knex("documents")
    .select("documents.*", "projects.code as project_code")
    .join("uploads", { "documents.upload_id": "uploads.id" })
    .join("projects", { "uploads.project_id": "projects.id" })
    .join("users", { "documents.user_id": "users.id" })
    .where("users.agency_id", agency_id);
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
  documentsInPeriod,
  documentsForAgency,
  documentsOfType,
  documentsWithProjectCode
};
