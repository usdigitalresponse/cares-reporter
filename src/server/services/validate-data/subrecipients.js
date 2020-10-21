const {
  dropdownIncludes,
  hasSubrecipientKey,
  isNotBlank,
  isValidState,
  isValidZip,
  validateFields
} = require("./validate");

const requiredFields = [
  [
    "",
    hasSubrecipientKey,
    `Each subrecipient must have either an "identification number" or a "duns number"`
  ],
  ["legal name", isNotBlank],
  ["organization type", dropdownIncludes("organization type")]
];

const noDunsRequiredFields = [
  ["address line 1", isNotBlank],
  ["city name", isNotBlank],
  ["state code", isValidState],
  ["zip", isValidZip],
  ["country name", dropdownIncludes("country")]
];

const validateSubrecipients = (documents = []) => {
  let valog = [];

  documents.forEach(({ content }, row) => {
    valog = valog.concat(
      validateFields(requiredFields, content, "subrecipient", row + 2)
    );
    if (!content["duns number"]) {
      // Address and other fields that are required if no Duns.
      valog = valog.concat(
        validateFields(noDunsRequiredFields, content, "subrecipient", row + 2)
      );
    }
  });
  return valog;
};

module.exports = {
  tabName: "subrecipient",
  type: "custom",
  execute: validateSubrecipients
};
