const {
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart
} = require("./validate");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["transfer number", isNotBlank],
  ["award amount", isPositiveNumber],
  ["transfer date", isValidDate],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure start date", isValidDate],
  ["total expenditure amount", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the transfer's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each transfer row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ]
];

module.exports = requiredFields;
