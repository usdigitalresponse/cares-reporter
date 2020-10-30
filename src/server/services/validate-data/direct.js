const {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  isNumber,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateDocuments
} = require("./validate");

const expenditureCategories = require("./expenditure-categories");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  [
    "project id",
    matchesFilePart("projectId"),
    'The direct project id "{}" does not match the project id in the filename'
  ],

  [
    "subrecipient id",
    isValidSubrecipient,
    'Each direct row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],

  [
    "obligation amount",
    isPositiveNumber,
    "Obligation amount must be an amount greater than zero"
  ],

  ["obligation date", isValidDate, 'Obligation date "{}" is not valid'],
  [
    "obligation date",
    dateIsInReportingPeriod,
    'Obligation date "{}" is not in the reporting period'
  ],

  [
    "current quarter obligation",
    isNumber,
    "Current quarter obligation must be an amount"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("obligation amount"),
    "Current quarter obligation must be less than or equal to obligation amount"
  ],

  [
    "expenditure start date",
    isValidDate,
    'Expenditure start date "{}" is not valid'
  ],
  [
    "expenditure start date",
    isValidDate,
    'Expenditure start date "{}" is not valid'
  ],
  [
    "expenditure start date",
    dateIsOnOrBefore("expenditure end date"),
    'Expenditure start date "{}" is not on or before the expenditure end date'
  ],
  [
    "expenditure start date",
    dateIsInReportingPeriod,
    'Expenditure start date "{}" is not in the reporting period'
  ],

  [
    "total expenditure amount",
    isNumber,
    "Total expenditure amount must be a number"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ]
];

module.exports = validateDocuments("direct", requiredFields);
