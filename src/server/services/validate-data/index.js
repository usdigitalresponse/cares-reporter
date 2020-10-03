const _ = require("lodash");
const validateSubrecipients = require("./subrecipients");
const validateCover = require("./cover");
const validateTabs = {
  contracts: require("./contracts"),
  grants: require("./grants"),
  loans: require("./loans"),
  transfers: require("./transfers")
};
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

  _.each(validateTabs, (fn, tabName) => {
    const tabValog = fn(
      groupedDocuments[tabName],
      subrecipientsHash,
      fileParts
    );
    valog.push(...tabValog.slice(0, 100));
  });

  return valog;
};

module.exports = { validateData };
