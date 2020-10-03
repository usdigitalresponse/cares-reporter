const { ValidationItem } = require("../../lib/validation-log");
const {
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
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
  ]
];

const validateTransfers = (documents = [], subrecipientsHash, fileParts) => {
  let valog = [];
  const tabItem = "transfers";

  documents.forEach(({ content }, row) => {
    if (!subrecipientsHash[content["subrecipient id"]]) {
      valog.push(
        new ValidationItem({
          message: `Each ${tabItem} row must have a "subrecipient id" which is included in the "subrecipient" tab`,
          tab: tabItem,
          row: row + 2
        })
      );
    }
    valog = valog.concat(
      validateFields(requiredFields, content, tabItem, row + 2, fileParts)
    );
  });
  return valog;
};

module.exports = validateTransfers;
