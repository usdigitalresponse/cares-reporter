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
  ["award number", isNotBlank],
  ["award payment method", dropdownIncludes("award payment method")],
  ["award amount", isPositiveNumber],
  ["award date", isValidDate],
  ["period of performance start date", isValidDate],
  ["period of performance end date", isValidDate],
  ["award date", dateIsOnOrBefore("period of performance start date")],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date")
  ],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  [
    "compliance",
    dropdownIncludes(
      "is awardee complying with terms and conditions of the grant?"
    )
  ],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure end date", isValidDate],
  ["award date", dateIsOnOrBefore("expenditure start date")],
  ["expenditure start date", dateIsOnOrBefore("expenditure end date")],
  ["total expenditure amount", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the grant's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each grant row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ],
  ["current quarter obligation", numberIsLessThanOrEqual("award amount")],

  [ "award date", dateIsInReportingPeriod ],
  [ "period of performance end date", dateIsInReportingPeriod ]

];

module.exports = {
  tabName: "grants",
  type: "every",
  validations: requiredFields
};
