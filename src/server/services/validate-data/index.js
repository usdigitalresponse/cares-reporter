const _ = require("lodash");
const validateSubrecipients = require("./subrecipients");
const validateContracts = require("./contracts");
const validateCover = require("./cover");
const { getSubrecipientsHash } = require("./helpers");

const validateData = (documents, fileParts) => {
  const valog = [];
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient);

  const coverValog = validateCover(groupedDocuments.cover, fileParts);
  valog.push(...coverValog);

  const subrecipientValog = validateSubrecipients(
    groupedDocuments.subrecipient
  );
  valog.push(...subrecipientValog);

  const contractsValog = validateContracts(
    groupedDocuments.contracts,
    subrecipientsHash,
    fileParts
  );
  valog.push(...contractsValog);

  return valog;
};

module.exports = { validateData };
