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
  ["contract number", isNotBlank],
  ["contract type", dropdownIncludes("contract type")],
  ["contract amount", isPositiveNumber],
  ["contract date", isValidDate],
  ["period of performance start date", isValidDate],
  ["period of performance end date", isValidDate],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date"),
    "Performance end date can't be before the performance start date"
  ],
  [
    "contract date",
    dateIsOnOrBefore("period of performance start date"),
    "Contract date can't be after the performance start date"
  ],
  ["expenditure start date", isValidDate],
  ["expenditure end date", isValidDate],
  ["contract date", dateIsOnOrBefore("expenditure start date")],
  ["expenditure start date", dateIsOnOrBefore("expenditure end date")],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the contract's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ],
  ["current quarter obligation", isPositiveNumber],
  ["current quarter obligation", numberIsLessThanOrEqual("contract amount")],

  ["contract date", dateIsInReportingPeriod],
  ["expenditure end date", dateIsInReportingPeriod],
  ["period of performance end date", dateIsInReportingPeriod]
];

module.exports = {
  tabName: "contracts",
  type: "every",
  validations: requiredFields
};
