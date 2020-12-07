const {
  dateIsInPeriodOfPerformance,
  dateIsInReportingPeriod,
  dateIsOnOrBefore,
  dropdownIncludes,
  isEqual,
  isMoreThan50K,
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
    'The contract project id "{}" does not match the project id in the filename'
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  [
    "period of performance end date",
    isValidDate,
    'Period of performance end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "period of performance end date",
    dateIsInPeriodOfPerformance,
    'Period of performance end date "{}" must be in the period of performance',
    { isDateValue: true }
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
  [
    "contract amount",
    isEqual("current quarter obligation"),
    "Contract amount must equal obligation amount",
    { tags: ["v2" ] }
  ],
  [
    "contract amount",
    isMoreThan50K,
    "Contract amount must be more than $50,000",
    { tags: ["v2"] }
  ],

  [
    "contract date",
    isValidDate,
    'Contract date "{}" is not valid',
    { isDateValue: true }
  ],
  [
    "contract date",
    dateIsInReportingPeriod,
    'Contract date "{}" is not in reporting report',
    { isDateValue: true }
  ],
  [
    "contract date",
    dateIsOnOrBefore("period of performance start date"),
    'Contract date "{}" must be on or before the period of performance start date',
    { isDateValue: true }
  ],
  [
    "contract date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsOnOrBefore("expenditure start date")
    ),
    'Contract date "{}" must be on or before the expenditure start date',
    { isDateValue: true }
  ],

  [
    "period of performance start date",
    isValidDate,
    'Period of performance start date "{}" is not valid',
    { isDateValue: true }
  ],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date"),
    'Period of performance start date "{}" must be on or before the period of performance end date',
    { isDateValue: true }
  ],

  [
    "expenditure start date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
    'Expenditure state date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "expenditure start date",
    whenGreaterThanZero(
      "total expenditure amount",
      dateIsOnOrBefore("expenditure end date")
    ),
    'Expenditure start date "{}" must be before expenditure end date',
    { isDateValue: true }
  ],

  [
    "expenditure end date",
    whenGreaterThanZero("total expenditure amount", isValidDate),
    'Expenditure end date "{}" is not a valid date',
    { isDateValue: true }
  ],
  [
    "expenditure end date",
    whenGreaterThanZero("total expenditure amount", dateIsInReportingPeriod),
    'Expenditure end date "{}" must be in the reporting period',
    { isDateValue: true }
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
    whenUS("primary place of performance country name", isValidZip),
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
    "Current quarter obligation must be an amount greater than zero"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("contract amount"),
    "Current quarter obligation must be less than or equal to the contract amount"
  ],

  [
    "total expenditure amount",
    isNumberOrBlank,
    "Total expenditure amount must be a number"
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount must be the sum of all expenditure amount columns"
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

module.exports = validateDocuments("contracts", requiredFields);
