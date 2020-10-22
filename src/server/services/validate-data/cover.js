const { matchesFilePart } = require("./validate");
const { validateSingleDocument } = require("./validate");

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

module.exports = validateSingleDocument(
  "cover",
  requiredFields,
  `cover requires a row with "agency code" and "project id"`
);
