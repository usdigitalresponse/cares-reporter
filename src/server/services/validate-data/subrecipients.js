const { ValidationItem } = require("../../lib/validation-log");
const { subrecipientKey } = require("./helpers");

const noDunsRequiredFields = [
  ["legal name", val => /\w/.test(val)],
  ["address line 1", val => /\w/.test(val)],
  ["city name", val => /\w/.test(val)],
  ["state code", val => /^\w\w$/.test(val)],
  ["zip", val => /^\d{5}(-\d{4})?$/.test(val)],
  ["country name", val => /\w/.test(val)],
  ["organization type", () => true] // compare against list of organization types
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
    if (!content["duns number"]) {
      // Address and other fields that are required if no Duns.
      noDunsRequiredFields.forEach(([key, validator, message]) => {
        const val = content[key] || "";
        if (!validator(val)) {
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
