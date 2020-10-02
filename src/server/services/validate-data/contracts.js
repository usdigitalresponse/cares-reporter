const { ValidationItem } = require("../../lib/validation-log");
const { dropdownValues } = require("../get-template");
const { validateRequiredFields } = require("./validate-fields");
const _ = require("lodash-checkit");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["contract number", val => /\w/.test(val)],
  [
    "contract type",
    val => dropdownValues["contract type"].includes(val.toLowerCase())
  ],
  ["contract amount", val => _.isNumber(val) && val > 0],
  ["contract date", val => !_.isNaN(new Date(val).getTime())],
  [
    "period of performance start date",
    val => !_.isNaN(new Date(val).getTime())
  ],
  ["period of performance end date", val => !_.isNaN(new Date(val).getTime())],
  [
    "contract date",
    (val, content) =>
      new Date(content["period of performance start date"]).getTime() <=
      new Date(content["period of performance end date"]).getTime(),
    "Performance end date can't be after the performance start date"
  ],
  [
    "contract date",
    (val, content) =>
      new Date(val).getTime() <=
      new Date(content["period of performance start date"]).getTime(),
    "Contract date can't be after the performance start date"
  ],
  ["primary place of performance address line 1", val => /\w/.test(val)],
  ["primary place of performance city name", val => /\w/.test(val)],
  [
    "primary place of performance state code",
    (val, content) =>
      content["primary place of performance country name"] !== "usa" ||
      dropdownValues["state code"].includes(val.toLowerCase())
  ],
  [
    "primary place of performance zip",
    (val, content) =>
      content["primary place of performance country name"] !== "usa" ||
      /^\d{5}(-\d{4})?$/.test(val)
  ],
  [
    "primary place of performance country name",
    val => dropdownValues["country"].includes(val.toLowerCase())
  ]
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
    valog = valog.concat(validateRequiredFields(requiredFields, content, row + 2));
  });
  return valog;
};

module.exports = validateContracts;
