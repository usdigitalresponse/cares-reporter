const _ = require("lodash");
const validateSubrecipients = require("./subrecipients");
const validateContracts = require("./contracts");
const validateGrants = require("./grants");
const validateCover = require("./cover");
const { getSubrecipientsHash } = require("./helpers");

const validateData = (documents, fileParts) => {
  const valog = [];
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient);

  const coverValog = validateCover(groupedDocuments.cover, fileParts);
  valog.push(...coverValog.slice(0, 100));

  const subrecipientValog = validateSubrecipients(
    groupedDocuments.subrecipient
  );
  valog.push(...subrecipientValog.slice(0, 100));

  const contractsValog = validateContracts(
    groupedDocuments.contracts,
    subrecipientsHash,
    fileParts
  );
  valog.push(...contractsValog.slice(0, 100));

  const grantsValog = validateGrants(
    groupedDocuments.grants,
    subrecipientsHash,
    fileParts
  );
  //valog.push(...grantsValog.slice(0, 100));

  return valog;
};

module.exports = { validateData };
