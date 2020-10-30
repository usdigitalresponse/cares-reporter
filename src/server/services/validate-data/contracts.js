const {
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
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
    'The contract project id "{}" does not match the project id in the filename'
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  ["contract number", isNotBlank, "Contract number cannot be blank"],
  [
    "contract type",
    dropdownIncludes("contract type"),
    "Contract type is not valid"
  ],
  [
    "contract amount",
    isPositiveNumber,
    "Contract amount must be an amount greater than zero"
  ],

  ["contract date", isValidDate, 'Contract date "{}" is not valid'],
  [
    "contract date",
    dateIsInReportingPeriod,
    'Contract date "{}" is not in reporting report'
  ],
  [
    "contract date",
    dateIsOnOrBefore("period of performance start date"),
    `Contract date "{}" can't be after the period of performance start date`
  ],
  [
    "contract date",
    dateIsOnOrBefore("expenditure start date"),
    'Contract date "{}" cannot be after the expenditure start date'
  ],

  [
    "period of performance start date",
    isValidDate,
    'Period of performance start date "{}" is not valid'
  ],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date"),
    `Performance end date "{}" can't be before the period of performance start date`
  ],

  [
    "period of performance end date",
    isValidDate,
    'Period of performance end date "{}" is not valid'
  ],
  [
    "period of performance end date",
    dateIsInReportingPeriod,
    'Period of performance end date "{}" must be in the reporting period'
  ],

  [
    "expenditure start date",
    isValidDate,
    'Expenditure state date "{}" is not a valid date'
  ],
  [
    "expenditure start date",
    dateIsOnOrBefore("expenditure end date"),
    'Expenditure start date "{}" must be before expenditure end date'
  ],

  [
    "expenditure end date",
    isValidDate,
    'Expenditure end date "{}" is not a valid date'
  ],
  [
    "expenditure end date",
    dateIsInReportingPeriod,
    'Expenditure end date "{}" must be in the reporting period'
  ],

  [
    "primary place of performance address line 1",
    isNotBlank,
    "Primary place of performance address line 1 cannot be blank"
  ],
  [
    "primary place of performance city name",
    isNotBlank,
    "Primary place of performance city name cannot be blank"
  ],
  [
    "primary place of performance state code",
    isValidState,
    'Primary place of performance state code "{}" is not valid'
  ],
  [
    "primary place of performance zip",
    isValidZip,
    'Primary place of performance zip "{}" is not valid'
  ],
  [
    "primary place of performance country name",
    dropdownIncludes("country"),
    'Primary place of performance country name "{}" is not valid'
  ],
  [
    "current quarter obligation",
    isPositiveNumber,
    "Current quarter obligation is not an amount greater than zero"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("contract amount"),
    "Current quarter obligation must be less than the contract amount"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ]
];

module.exports = validateDocuments("contracts", requiredFields);
