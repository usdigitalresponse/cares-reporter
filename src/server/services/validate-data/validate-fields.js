const { ValidationItem } = require("../../lib/validation-log");
const { dropdownValues } = require("../get-template");
const _ = require("lodash");

function dateIsOnOrBefore(key) {
  return (val, content) => {
    return new Date(val).getTime() <= new Date(content[key]).getTime();
  };
}

function isNotBlank(val) {
  return /\w/.test(val);
}

function isNumber(val) {
  return _.isNumber(val);
}

function isPositiveNumber(val) {
  return _.isNumber(val) && val > 0;
}

function isValidDate(val) {
  return !_.isNaN(new Date(val).getTime());
}

function isValidSubrecipient(val, content, context) {
  const { subrecipientsHash } = context;
  return _.has(subrecipientsHash, val);
}

function isValidState(val, content) {
  return (
    content["primary place of performance country name"] !== "usa" ||
    dropdownIncludes("state code")(val)
  );
}

function isValidZip(val, content) {
  return (
    content["primary place of performance country name"] !== "usa" ||
    /^\d{5}(-\d{4})?$/.test(val)
  );
}

function matchesFilePart(key) {
  return function(val, content, { fileParts }) {
    const fileValue = fileParts[key].replace(/^0*/, "");
    const documentValue = (val || "").toString().replace(/^0*/, "");
    return documentValue === fileValue;
  };
}

function dropdownIncludes(key) {
  return val => _.get(dropdownValues, key, []).includes(val.toLowerCase());
}

function validateFields(requiredFields, content, tab, row, context = {}) {
  const valog = [];
  requiredFields.forEach(([key, validator, message]) => {
    const val = content[key] || "";
    if (!validator(val, content, context)) {
      valog.push(
        new ValidationItem({
          message:
            (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
          tab,
          row
        })
      );
    }
  });
  return valog;
}

module.exports = {
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  validateFields
};
