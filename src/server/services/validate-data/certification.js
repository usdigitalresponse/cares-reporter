const { isNotBlank, isValidDate } = require("./validate");
const { validateSingleDocument } = require("./validate");

const requiredFields = [
  [
    "agency financial reviewer name",
    isNotBlank,
    "Agency financial reviewer name must not be blank"
  ],
  ["date", isValidDate, "Date must be a valid date"]
];

module.exports = validateSingleDocument(
  "certification",
  requiredFields,
  `certification requires a row with "agency financial reviewer name" and "date"`
);
