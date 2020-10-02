const { ValidationItem } = require("../../lib/validation-log");

function validateRequiredFields(requiredFields, content, row) {
  const valog = [];
  requiredFields.forEach(([key, validator, message]) => {
    const val = content[key] || "";
    if (!validator(val, content)) {
      valog.push(
        new ValidationItem({
          message:
            (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
          tab: "contracts",
          row
        })
      );
    }
  });
  return valog;
}

module.exports = {
  validateRequiredFields
}
