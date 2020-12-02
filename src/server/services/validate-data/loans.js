const {
  dateIsInReportingPeriod,
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  numberIsLessThanOrEqual,
  validateDocuments,
  whenUS
} = require("./validate");

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
    'The loan project id "{}" does not match the project id in the filename'
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each loan row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ],

  ["loan number", isNotBlank, "Load number must not be blank"],
  [
    "loan amount",
    isPositiveNumber,
    "Loan amount must be a number greater than zero"
  ],
  ["loan date", isValidDate, "Loan date must be a valid date"],
  [
    "loan date",
    dateIsInReportingPeriod,
    'Loan date "{}" is not in the reporting period',
    { isDateValue: true }
  ],

  [
    "primary place of performance address line 1",
    isNotBlank,
    "primary place of business address line 1 must not be blank "
  ],
  [
    "primary place of performance city name",
    isNotBlank,
    "primary place of business city name must not be blank "
  ],
  [
    "primary place of performance state code",
    isValidState,
    "primary place of business state code must not be blank "
  ],
  [
    "primary place of performance zip",
    whenUS("primary place of performance country name", isValidZip),
    "primary place of business zip is not valid"
  ],
  [
    "primary place of performance country name",
    dropdownIncludes("country"),
    'primary place of business country name "{}" is not valid'
  ],

  [
    "current quarter obligation",
    isNumber,
    "Current quarter obligation must be an amount"
  ],
  [
    "current quarter obligation",
    numberIsLessThanOrEqual("loan amount"),
    "Current quarter obligation must be less than or equal to loan amount"
  ]
];

module.exports = validateDocuments("loans", requiredFields);
