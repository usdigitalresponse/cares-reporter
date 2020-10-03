const { ValidationItem } = require("../../lib/validation-log");
const {
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidZip,
  validateFields
} = require("./validate-fields");

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
  [
    "award date",
    (val, content) =>
      new Date(content["period of performance start date"]).getTime() <=
      new Date(content["period of performance end date"]).getTime(),
    "Performance end date can't be after the performance start date"
  ],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  ["compliance", dropdownIncludes("compliance")],
  ["current quarter obligation", isNumber],
  ["expenditure start date", isValidDate],
  ["expenditure start date", isValidDate],
  ["total expenditure amount", isNumber]
];

const validateGrants = (documents = [], subrecipientsHash, fileParts) => {
  let valog = [];
  const tabItem = "grants";

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
    const fileProjectId = fileParts.projectId.replace(/^0*/, "");
    const tabProjectId = (content["project id"] || "")
      .toString()
      .replace(/^0*/, "");
    if (tabProjectId !== fileProjectId) {
      valog.push(
        new ValidationItem({
          message: `${tabItem}'s "project id" (${tabProjectId}) must match file name's "project id" (${fileProjectId})`,
          tab: tabItem,
          row: row + 2
        })
      );
    }
    valog = valog.concat(
      validateFields(requiredFields, content, tabItem, row + 2)
    );
  });
  return valog;
};

module.exports = validateGrants;
