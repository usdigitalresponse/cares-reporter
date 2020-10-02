const { ValidationItem } = require("../../lib/validation-log");

function validateFields(requiredFields, content, tab, row) {
  const valog = [];
  requiredFields.forEach(([key, validator, message]) => {
    const val = content[key] || "";
    if (!validator(val, content)) {
      valog.push(
        new ValidationItem({
          message:
            (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
          tab,
          row
        })
      );
    }
  });
  return valog;
}

module.exports = {
  validateFields
};
