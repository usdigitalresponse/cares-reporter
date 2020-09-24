const { ValidationItem } = require("../../lib/validation-log");
const { subrecipientKey } = require("./helpers");
const { dropdownValues } = require("../get-template");

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
  const valog = [];

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
    requiredFields.forEach(([key, validator, message]) => {
      const val = content[key] || "";
      if (!validator(val, content)) {
        valog.push(
          new ValidationItem({
            message:
              (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
            tab: "subrecipient",
            row: row + 2
          })
        );
      }
    });
    if (!content["duns number"]) {
      // Address and other fields that are required if no Duns.
      noDunsRequiredFields.forEach(([key, validator, message]) => {
        const val = content[key] || "";
        if (!validator(val, content)) {
          valog.push(
            new ValidationItem({
              message:
                (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
              tab: "subrecipient",
              row: row + 2
            })
          );
        }
      });
    }
  });
  return valog;
};

module.exports = validateSubrecipients;
