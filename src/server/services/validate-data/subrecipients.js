const { ValidationItem } = require("../../lib/validation-log");
const { subrecipientKey } = require("./helpers");
const { dropdownValues } = require("../get-template");
const { validateFields } = require("./validate-fields");

const requiredFields = [
  ["legal name", val => /\w/.test(val)],
  [
    "organization type",
    val => dropdownValues["organization type"].includes(val.toLowerCase())
  ]
];

const noDunsRequiredFields = [
  ["address line 1", val => /\w/.test(val)],
  ["city name", val => /\w/.test(val)],
  [
    "state code",
    (val, content) =>
      content["country name"] !== "usa" ||
      dropdownValues["state code"].includes(val.toLowerCase())
  ],
  [
    "zip",
    (val, content) =>
      content["country name"] !== "usa" || /^\d{5}(-\d{4})?$/.test(val)
  ],
  ["country name", val => dropdownValues["country"].includes(val.toLowerCase())]
];

const validateSubrecipients = (documents = []) => {
  let valog = [];

  documents.forEach(({ content }, row) => {
    if (!subrecipientKey(content)) {
      valog.push(
        new ValidationItem({
          message: `Each subrecipient must have either an "identification number" or a "duns number"`,
          tab: "subrecipient",
          row: row + 2
        })
      );
    }
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

module.exports = validateSubrecipients;
