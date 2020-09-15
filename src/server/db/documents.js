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

module.exports = {
  createDocument,
  createDocuments,
  documents,
  documentsForAgency
};
