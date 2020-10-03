const { ValidationItem } = require("../../lib/validation-log");
const { dropdownValues } = require("../get-template");
const {
  dateIsBefore,
  dropdownIncludes,
  isNotBlank,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidZip,
  validateFields
} = require("./validate-fields");
const _ = require("lodash-checkit");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["contract number", isNotBlank ],
  ["contract type", dropdownIncludes("contract type")],
  ["contract amount", isPositiveNumber],
  ["contract date", isValidDate ],
  ["period of performance start date",isValidDate],
  ["period of performance end date", isValidDate],
  [
    "contract date",
    (val, content) =>
      new Date(content["period of performance start date"]).getTime() <=
      new Date(content["period of performance end date"]).getTime(),
    "Performance end date can't be after the performance start date"
  ],
  [
    "contract date",
    dateIsBefore("period of performance start date"),
    "Contract date can't be after the performance start date"
  ],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")]
];

const validateContracts = (documents = [], subrecipientsHash, fileParts) => {
  let valog = [];
  const tabItem = "contract";

  documents.forEach(({ content }, row) => {
    if (!subrecipientsHash[content["subrecipient id"]]) {
      valog.push(
        new ValidationItem({
          message: `Each ${tabItem} row must have a "subrecipient id" which is included in the "subrecipient" tab`,
          tab: "contracts",
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
          tab: "contracts",
          row: row + 2
        })
      );
    }
    valog = valog.concat(
      validateFields(requiredFields, content, "contracts", row + 2)
    );
  });
  return valog;
};

module.exports = validateContracts;
