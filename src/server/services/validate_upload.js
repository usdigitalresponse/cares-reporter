const { ValidationItem } = require("../lib/validation_log");

const validateFilename = filename => {
  if (/\d{3,}-\d{8}-\w+-v\d+\.xlsx?/.test(filename)) return null;

  return new ValidationItem({
    message: `Uploaded file name must match pattern NNN-YYYYMMDD-short_name-vN.xlsx (ex. 013-20200523-ppe-v2.xlsx)`
  });
};

module.exports = {
  validateFilename
};
