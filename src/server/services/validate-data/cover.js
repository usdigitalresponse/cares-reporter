const { ValidationItem } = require("../../lib/validation-log");
const { matchesFilePart, validateFields } = require("./validate");

const requiredFields = [
  [
    "agency code",
    matchesFilePart("agencyCode"),
    `The "agency code" in the file name does not match the cover's "agency code"`
  ],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the cover's "project id"`
  ]
];

function validateCover(documents, validateContext) {
  let valog = [];
  const tabItem = "cover";

  if (documents && documents.length > 0) {
    const { content } = documents[0];
    const row = 2;
    valog = valog.concat(
      validateFields(requiredFields, content, tabItem, row, validateContext)
    );
  } else {
    valog.push(
      new ValidationItem({
        message: `${tabItem} requires a row with "agency code" and "project id"`,
        tab: tabItem
      })
    );
  }
  return valog;
}

module.exports = {
  tabName: "cover",
  type: "custom",
  execute: validateCover
};
