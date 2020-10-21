const {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  isNumber,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  numberIsLessThanOrEqual
} = require("./validate");

const expenditureCategories = require("./expenditure-categories");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["obligation amount", isPositiveNumber],
  ["obligation date", isValidDate],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure start date", isValidDate],
  //["obligation date", dateIsOnOrBefore("expenditure start date")], FIXME need updated spreadsheet
  ["expenditure start date", dateIsOnOrBefore("expenditure end date")],
  ["total expenditure amount", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" is the file name does not match the direct's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each direct row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ],
  ["current quarter obligation", numberIsLessThanOrEqual("obligation amount")],

  [ "obligation date", dateIsInReportingPeriod ],
  [ "expenditure start date", dateIsInReportingPeriod ]
];

module.exports = requiredFields;
