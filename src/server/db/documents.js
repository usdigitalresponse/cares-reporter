const knex = require("./connection");

function documents() {
  return knex("documents")
    .select("*")
    .limit(1000);
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
  // WIP
  // const uploads = await knex("uploads").where(
  //   "filename",
  //   "like",
  //   `${agencyCode}-${projectId}-${reportingDate}-%`
  // );
  // console.log("uploads to delete", uploads);
  // return uploads;
}

module.exports = {
  createDocument,
  createDocuments,
  deleteDocuments,
  documents,
  documentsForAgency
};
