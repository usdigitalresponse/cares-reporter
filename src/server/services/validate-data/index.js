const { ValidationItem } = require("../../lib/validation-log");
const _ = require("lodash");
const validateSubrecipients = require("./subrecipients");
const validateContracts = require("./contracts");

const getSubrecipientsHash = subrecipientDocuments => {
  return _.keyBy(
    subrecipientDocuments,
    ({ content }) => content["identification number"]
  );
};

const validateData = (documents, fileParts) => {
  const valog = [];
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient);

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

  (groupedDocuments.subrecipient || []).forEach(({ content }, row) => {
    const key = content["identification number"] || content["duns number"];
    if (!key) {
      valog.push(
        new ValidationItem({
          message: `Each subrecipient must have either an "identification number" or a "duns number"`,
          tab: "subrecipient",
          row: row + 2
        })
      );
    }
    subrecipientsHash[key] = content;
  });

  return valog;
};

module.exports = { validateData };
