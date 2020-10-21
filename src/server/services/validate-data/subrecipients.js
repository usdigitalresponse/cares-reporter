const {
  dropdownIncludes,
  hasSubrecipientKey,
  isNotBlank,
  isValidState,
  isValidZip,
  validateFields,
  whenBlank
} = require("./validate");

const requiredFields = [
  [
    "",
    hasSubrecipientKey,
    `Each subrecipient must have either an "identification number" or a "duns number"`
  ],
  ["legal name", isNotBlank],
  ["organization type", dropdownIncludes("organization type")],

  ["address line 1", whenBlank("duns number", isNotBlank)],
  ["city name", whenBlank("duns number", isNotBlank)],
  ["state code", whenBlank("duns number", isValidState)],
  ["zip", whenBlank("duns number", isValidZip)],
  ["country name", whenBlank("duns number", dropdownIncludes("country"))]
];

module.exports = {
  tabName: "subrecipient",
  type: "every",
  validations: requiredFields
};
