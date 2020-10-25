const {
  isNotBlank,
  isValidDate
} = require("./validate");
const { validateSingleDocument } = require("./validate");

const requiredFields = [
  [ "agency financial reviewer name", isNotBlank ],
  [ "date", isValidDate ]
];

module.exports = validateSingleDocument(
  "certification",
  requiredFields,
  `certification requires a row with "agency financial reviewer name" and "date"`
);

