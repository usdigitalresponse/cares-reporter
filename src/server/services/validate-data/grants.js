const {
  dateIsInPeriodOfPerformance,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
  isEqual,
  isAtLeast50K,
  isNotBlank,
  isNumber,
  isNumberOrBlank,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateDocuments,
  whenGreaterThanZero,
  whenNotBlank,
  whenUS
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
    isAtLeast50K,
    "Contract amount must be at least $50,000",
    { tags: ["v2"] }
  ],

  ["award date", isValidDate, "Award date must be a valid date"],
  [
    "award date",
    dateIsOnOrBefore("period of performance start date"),
    'Award date "{}" is not on or before the period of performance start date',
    { isDateValue: true }
  ],
  [
    "award date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsOnOrBefore("expenditure start date")
    ),
    'Award date "{}" is not on or before the expenditure start date',
    { isDateValue: true }
  ],
  [
    "award date",
    dateIsInReportingPeriod,
    'Award date "{}" is not in the reporting period',
    { isDateValue: true }
  ],

  [
    "period of performance start date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
    'Period of performance start date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "period of performance start date",
    dateIsInPeriodOfPerformance,
    'Period of performance start date "{}" must be in the period of performance',
    { isDateValue: true }
  ],
  [
    "period of performance end date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
    'Period of performance end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "period of performance end date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsInPeriodOfPerformance
    ),
    'Period of performance end date "{}" is not in the period or performance',
    { isDateValue: true }
  ],
  [
    "period of performance start date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsOnOrBefore("period of performance end date")
    ),
    'period of performance start date "{}" is not on or before period of performance end date',
    { isDateValue: true }
  ],

  [
    "expenditure start date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
    'Expenditure start date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsOnOrBefore("expenditure end date")
    ),
    'Expenditure start date "{}" is not on or before the expenditure end date',
    { isDateValue: true }
  ],
  [
    "expenditure end date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
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
    whenUS("primary place of performance country name", isValidZip),
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
    "Current quarter obligation must be less than or equal to award amount"
  ],
  [
    "award amount",
    isEqual("current quarter obligation"),
    "Award amount must equal obligation amount"
  ],

  [
    "total expenditure amount",
    isNumberOrBlank,
    "Total expenditure amount must be an amount"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ],
  [
    "other expenditure categories",
    whenNotBlank("other expenditure amount", isNotBlank),
    "Other Expenditure Categories cannot be blank if Other Expenditure Amount has an amount"
  ],
  [
    "other expenditure amount",
    whenNotBlank("other expenditure categories", isNumber),
    "Other Expenditure Amount must be a number"
  ]
];

module.exports = validateDocuments("grants", requiredFields);
