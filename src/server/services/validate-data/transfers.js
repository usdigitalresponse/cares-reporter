const {
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
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
  ],
  [
    "total expenditure amount",
    isSum(expenditureCategories),
    "Total expenditure amount is not the sum of all expenditure amount columns"
  ],
  ["current quarter obligation", numberIsLessThanOrEqual("award amount")],
  //["expenditure start date", dateIsOnOrBefore("transfer date")], // FIXME need spreadsheet fix
  ["expenditure start date", dateIsOnOrBefore("expenditure end date")],
  //["transfer type", dropdownIncludes("award payment method")], FIXME need spreadsheet fix
  // TODO
  // transfer date <= reporting period end date
  // transfer date >= reporting period start date
  // expenditure start date" <= reporting period end date
];

module.exports = requiredFields;
