import _ from "lodash";
import numeral from "numeral";

export function titleize(s) {
  if (!s) {
    return s;
  }
  const words = s.split("_").map(w => w.slice(0, 1).toUpperCase() + w.slice(1));
  return words.join(" ");
}

export function singular(s) {
  return s ? s.replace(/s$/, "") : "";
}

export function columnTitle(column) {
  return column.label ? column.label : titleize(column.name);
}

function makeValidationMessage(column, defaultMessage) {
  if (column.validationMessage) {
    return `${columnTitle(column)} ${column.validationMessage}`;
  }
  return `${columnTitle(column)} ${defaultMessage}`;
}

export function validate(columns, record) {
  return new Promise(resolve => {
    var validationMessages = [];
    columns.forEach(column => {
      const value = record[column.name];
      if (column.required && _.isEmpty(value) && !_.isNumber(value)) {
        validationMessages.push(makeValidationMessage(column, "is required"));
      }
      if (!_.isEmpty(value)) {
        if (column.minimumLength && value.length < column.minimumLength) {
          validationMessages.push(
            makeValidationMessage(
              column,
              `must be at least ${column.minimumLength} characters long`
            )
          );
        }
        if (column.maximumLength && value.length > column.maximumLength) {
          validationMessages.push(
            makeValidationMessage(
              column,
              `must be no more than ${column.maximumLength} characters long`
            )
          );
        }
        if (column.pattern) {
          const re = new RegExp(column.pattern);
          if (!value.match(re)) {
            validationMessages.push(
              makeValidationMessage(
                column,
                `does not match the pattern "${column.pattern}"`
              )
            );
          }
        }
        if (column.numeric) {
          if (numeral(value).value() === null) {
            validationMessages.push(
              makeValidationMessage(column, "should be numeric")
            );
          }
        }
      }
    });
    return resolve(_.uniq(validationMessages));
  });
}

export function canWriteToTable(user, tableName) {
  const rules = _.get(user, "rules.tables");
  if (!rules) {
    return true;
  }
  if (rules["*"] && rules["*"].readOnly) {
    return false;
  }
  if (rules[tableName] && rules[tableName].readOnly) {
    return false;
  }
  return true;
}
