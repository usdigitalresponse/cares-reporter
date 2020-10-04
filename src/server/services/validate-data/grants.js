const {
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  validateDocuments
} = require("./validate-fields");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["award number", isNotBlank],
  ["award payment method", dropdownIncludes("award payment method")],
  ["award amount", isPositiveNumber],
  ["award date", isValidDate],
  ["period of performance start date", isValidDate],
  ["period of performance end date", isValidDate],
  [
    "award date",
    (val, content) =>
      new Date(content["period of performance start date"]).getTime() <=
      new Date(content["period of performance end date"]).getTime(),
    "Performance end date can't be after the performance start date"
  ],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  ["compliance", dropdownIncludes("compliance")],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure start date", isValidDate],
  ["total expenditure amount", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `grant's "project id" must match file name's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each grant row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ]
];

const validateGrants = (documents = [], subrecipientsHash, fileParts) => {
  const validateContext = {
    fileParts,
    subrecipientsHash
  };
  return validateDocuments(documents, "grants", requiredFields, validateContext);
};

module.exports = validateGrants;
