const _ = require("lodash");
const validateSubrecipients = require("./subrecipients");
const validateCover = require("./cover");
const validateTabs = {
  contracts: require("./contracts"),
  grants: require("./grants"),
  loans: require("./loans"),
  transfers: require("./transfers"),
  direct: require("./direct")
};
const { getSubrecipientsHash } = require("./helpers");
const { validateDocuments } = require("./validate");

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

  const validateContext = {
    fileParts,
    subrecipientsHash
  };

  _.each(validateTabs, (validations, tabName) => {
    const tabValog = validateDocuments(
      groupedDocuments[tabName],
      tabName,
      validations,
      validateContext
    );
    valog.push(...tabValog.slice(0, 100));
  });

  return valog;
};

module.exports = { validateData };
