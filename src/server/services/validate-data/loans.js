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
  numberIsLessThanOrEqual
} = require("./validate");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["loan number", isNotBlank],
  ["loan amount", isPositiveNumber],
  ["loan date", isValidDate],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  ["current quarter obligation", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the loan's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each loan row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  ["current quarter obligation", numberIsLessThanOrEqual("loan amount")]
  // TODO
  // loan date <= reporting period end date
  // loan date >= reporting period start date
  // payment date >= loan date - need spreadsheet fix
];

module.exports = requiredFields;
