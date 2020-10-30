const {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
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
    'The grant project id "{}" does not match the project id in the filename'
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each grant row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  ["award number", isNotBlank, "Award number must not be blank"],
  [
    "award payment method",
    dropdownIncludes("award payment method"),
    'Award payment method "{}" is not valid'
  ],
  [
    "award amount",
    isPositiveNumber,
    "Award amount must be an amount greater than zero"
  ],

  ["award date", isValidDate, "Award date must be a valid date"],
  [
    "award date",
    dateIsOnOrBefore("period of performance start date"),
    'Award date "{}" is not on or before the period of performance start date'
  ],
  [
    "award date",
    dateIsOnOrBefore("expenditure start date"),
    'Award date "{}" is not on or before the expenditure start date'
  ],
  [
    "award date",
    dateIsInReportingPeriod,
    'Award date "{}" is not in the reporting period'
  ],

  [
    "period of performance start date",
    isValidDate,
    'Period of performance start date "{}" is not a valid date'
  ],
  [
    "period of performance end date",
    isValidDate,
    'Period of performance end date "{}" is not a valid date'
  ],
  [
    "period of performance end date",
    dateIsInReportingPeriod,
    'Period of performance end date "{}" is not in the reporting period'
  ],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date"),
    'period of performance start date "{}" is not on or before period of performance end date'
  ],

  [
    "expenditure start date",
    isValidDate,
    'Expenditure start date "{}" is not a valid date'
  ],
  [
    "expenditure start date",
    dateIsOnOrBefore("expenditure end date"),
    'Expenditure start date "{}" is not on or before the expenditure end date'
  ],
  [
    "expenditure end date",
    isValidDate,
    'Expenditure end date "{}" is not a valid date'
  ],

  [
    "primary place of performance address line 1",
    isNotBlank,
    "primary place of performance address line 1 must not be blank"
  ],
  [
    "primary place of performance city name",
    isNotBlank,
    "primary place of performance city must not be blank"
  ],
  [
    "primary place of performance state code",
    isValidState,
    "primary place of performance state is not valid"
  ],
  [
    "primary place of performance zip",
    isValidZip,
    "primary place of performance zip must not be blank"
  ],
  [
    "primary place of performance country name",
    dropdownIncludes("country"),
    'primary place of performance country name "{}" is not valid'
  ],

  [
    "compliance",
    dropdownIncludes(
      "is awardee complying with terms and conditions of the grant?"
    ),
    'Compliance "{}" is not valid'
  ],

  [
    "current quarter obligation",
    isNumber,
    "Current quarter obligation must be an amount"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("award amount"),
    "Current quarter obligation mest be less than or equal to award amount"
  ],

  [
    "total expenditure amount",
    isNumber,
    "Total expenditure amount must be an amount"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ]
];

module.exports = validateDocuments("grants", requiredFields);
