const { ValidationItem } = require("../../lib/validation-log");
const _ = require("lodash");

// WIP
// const validateSubrecipients = require("./subrecipients");

const validateData = documents => {
  const valog = [];
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = {};

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
