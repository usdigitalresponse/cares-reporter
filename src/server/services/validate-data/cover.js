const { matchesFilePart } = require("./validate");

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

module.exports = {
  tabName: "cover",
  type: "exactlyOne",
  message: `cover requires a row with "agency code" and "project id"`,
  validations: requiredFields
};
