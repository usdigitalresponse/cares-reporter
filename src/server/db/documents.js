const knex = require("./connection");
const _ = require("lodash");

function documents() {
  return knex("documents").select("*");
}

function documentsOfType(type) {
  return knex("documents")
    .select("*")
    .where("type", type);
}
function documentsForAgency(agency_id) {
  return knex("documents")
    .select("*")
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
  documentsForAgency,
  documentsOfType
};
