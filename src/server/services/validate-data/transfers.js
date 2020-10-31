const {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
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
    'The transfer project id "{}" does not match the project id in the filename'
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each transfer row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  ["transfer number", isNotBlank, "Transfer number cannot be blank"],
  [
    "award amount",
    isPositiveNumber,
    "Award amount must be an amount greater than zero"
  ],
  [
    "transfer type",
    dropdownIncludes("award payment method"),
    'Transfer type "{}" is not valid'
  ],

  ["transfer date", isValidDate, "Transfer date is not a valid date"],
  [
    "transfer date",
    dateIsInReportingPeriod,
    'Transfer date "{}" is not in reporting period',
    { isDateValue: true }
  ],

  [
    "current quarter obligation",
    isNumber,
    "Current quarter obligation must be an amount"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("award amount"),
    "Current quarter obligation must be less than or equal to award amount"
  ],

  [
    "expenditure start date",
    isValidDate,
    'Expenditure start date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    isValidDate,
    'Expenditure end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    dateIsOnOrBefore("transfer date"),
    'Expenditure start date "{}" must be on or before transfer date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    dateIsOnOrBefore("expenditure end date"),
    'Expenditure start date "{}" must be on or before expenditure end date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    dateIsInReportingPeriod,
    'Expenditure start date "{}" must be in reporting period',
    { isDateValue: true }
  ],

  [
    "total expenditure amount",
    isNumber,
    "Total expenditure amount must an amount"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ]
];

module.exports = validateDocuments("transfers", requiredFields);
