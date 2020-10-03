const { ValidationItem } = require("../../lib/validation-log");
const {
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidZip,
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
  ["loan number", isNotBlank],
  ["loan amount", isPositiveNumber],
  ["loan date", isValidDate],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  ["current quarter obligation", isNumber],
  [
    "project id",
    matchesFilePart("projectId"),
    `loan's "project id" must match file name's "project id"`
  ]
];

const validateLoans = (documents = [], subrecipientsHash, fileParts) => {
  let valog = [];
  const tabItem = "loans";

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

module.exports = validateLoans;
