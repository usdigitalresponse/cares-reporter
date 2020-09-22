const _ = require("lodash");

const subrecipientKey = subrecipient => {
  return subrecipient["identification number"] || subrecipient["duns number"];
};

const getSubrecipientsHash = subrecipientDocuments => {
  return _.keyBy(subrecipientDocuments, ({ content }) => {
    return subrecipientKey(content);
  });
};

module.exports = {
  subrecipientKey,
  getSubrecipientsHash
};
