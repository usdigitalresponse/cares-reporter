const {
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  validateFields
} = require("./validate-fields");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["transfer number", isNotBlank],
  ["award amount", isPositiveNumber], // VERIFY there is an alias that converts "transfer amount" to "award amount" - is that what we want?
  ["transfer date", isValidDate],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure start date", isValidDate],
  ["total expenditure amount", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `loan's "project id" must match file name's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each transfer row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ]
];

const validateTransfers = (documents = [], subrecipientsHash, fileParts) => {
  let valog = [];
  const tabItem = "transfers";
  const validateContext = {
    fileParts,
    subrecipientsHash
  };
  documents.forEach(({ content }, row) => {
    valog = valog.concat(
      validateFields(requiredFields, content, tabItem, row, validateContext)
    );
  });
  return valog;
};

module.exports = validateTransfers;
