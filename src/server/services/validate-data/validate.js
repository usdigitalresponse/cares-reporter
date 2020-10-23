const { ValidationItem } = require("../../lib/validation-log");
const { dropdownValues } = require("../get-template");
const { subrecipientKey } = require("./helpers");
const ssf = require("ssf");
const _ = require("lodash");

function dateIsInReportingPeriod(val, content, { reportingPeriod }) {
  const dt = ssf.format("yyyy-MM-dd", val);
  return dt >= reportingPeriod.startDate && dt <= reportingPeriod.endDate;
}

function dateIsOnOrBefore(key) {
  return (val, content) => {
    return new Date(val).getTime() <= new Date(content[key]).getTime();
  };
}

function dateIsOnOrAfter(key) {
  return (val, content) => {
    return new Date(val).getTime() >= new Date(content[key]).getTime();
  };
}

function hasSubrecipientKey(val, content) {
  return !!subrecipientKey(content);
}

function isNotBlank(val) {
  return _.isNumber(val) || !_.isEmpty(val);
}

function isNumber(val) {
  return _.isNumber(val);
}

function isPositiveNumber(val) {
  return _.isNumber(val) && val > 0;
}

function isSum(columns) {
  return (val, content) => {
    const sum = _.reduce(
      columns,
      (acc, c) => {
        if (!c) {
          return acc;
        }
        const f = parseFloat(content[c]) || 0.0;
        return acc + f;
      },
      0.0
    );
    return val == sum;
  };
}

function isValidDate(val) {
  return !_.isNaN(new Date(val).getTime());
}

function isValidSubrecipient(val, content, { subrecipientsHash }) {
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

function numberIsLessThanOrEqual(key) {
  return (val, content) => {
    const other = content[key];
    return _.isNumber(val) && _.isNumber(other) && val <= other;
  };
}

function numberIsGreaterThanOrEqual(key) {
  return (val, content) => {
    const other = content[key];
    return _.isNumber(val) && _.isNumber(other) && val >= other;
  };
}

function dropdownIncludes(key) {
  return val => _.get(dropdownValues, key, []).includes(val.toLowerCase());
}

function whenBlank(key, validator) {
  return (val, content, context) => {
    return !!content[key] || validator(val, content, context);
  };
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

function validateDocuments(tab, validations) {
  return function(groupedDocuments, validateContext) {
    const documents = groupedDocuments[tab];
    return _.flatMap(documents, ({ content }, row) => {
      return validateFields(
        validations,
        content,
        tab,
        row + 2,
        validateContext
      );
    });
  };
}

function validateSingleDocument(tab, validations, message) {
  return function(groupedDocuments, validateContext) {
    const documents = groupedDocuments[tab];
    let valog = [];

    if (documents && documents.length == 1) {
      const { content } = documents[0];
      const row = 2;
      valog = valog.concat(
        validateFields(validations, content, tab, row, validateContext)
      );
    } else {
      valog.push(new ValidationItem({ message, tab }));
    }
    return valog;
  };
}

module.exports = {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dateIsOnOrAfter,
  dropdownIncludes,
  hasSubrecipientKey,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  numberIsLessThanOrEqual,
  numberIsGreaterThanOrEqual,
  validateDocuments,
  validateFields,
  validateSingleDocument,
  whenBlank
};
