const { matchesFilePart } = require("./validate");
const { validateSingleDocument } = require("./validate");

const requiredFields = [
  [
    "agency code",
    matchesFilePart("agencyCode"),
    `The agency code "{}" in the file name does not match the cover's agency code`
  ],
  [
    "project id",
    matchesFilePart("projectId"),
    'The project id "{}" does not match the project id in the filename'
  ]
];

module.exports = validateSingleDocument(
  "cover",
  requiredFields,
  `cover requires a row with "agency code" and "project id"`
);
