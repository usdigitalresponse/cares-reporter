const { documentsOfType } = require("../db/documents");
const _ = require("lodash");

const verbose = process.env.VERBOSE;

function log() {
  if (verbose) {
    console.log.apply(null, arguments);
  }
}

function indexDocuments(documents, key) {
  return _.reduce(
    documents,
    (acc, document) => {
      acc[document.content[key]] = document;
      return acc;
    },
    {}
  );
}

async function removeDuplicates(getFn, type, keyAttribute) {
  // this does an eager load of all documents of a certain type
  // need to test this with realistic datasets
  // it may better to do a lazy query for each record, or perhaps batche them
  // but this is a good first pass
  const existingDocuments = indexDocuments(await getFn(type), keyAttribute);
  return function(documents) {
    log(
      `Scanning ${documents.length} documents for duplicate ${type} by ${keyAttribute}`
    );
    return _.chain(documents)
      .map(document => {
        if (document.type !== type) {
          return document;
        }
        if (_.isEmpty(document.content)) {
          return null;
        }
        const key = document.content[keyAttribute];
        if (existingDocuments[key]) {
          log("Duplicate:", type, keyAttribute, key);
          return null;
        }
        log("New document:", type, keyAttribute, key);
        return document;
      })
      .compact()
      .value();
  };
}

async function deduplicate(documents) {
  const fn = await removeDuplicates(
    documentsOfType,
    "Subrecipient",
    "Identification Number"
  );
  return await fn(documents);
}

module.exports = {
  deduplicate,
  removeDuplicates
};
