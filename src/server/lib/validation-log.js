const _ = require("lodash");

class ValidationItem {
  constructor({ message, severity = 1, tab = null, row = null, col = null }) {
    this.info = { message, severity, tab, row, col };
  }
}

class ValidationLog {
  constructor() {
    this.log = [];
  }

  append(infoListOrNull) {
    if (infoListOrNull) {
      if (_.isString(infoListOrNull)) {
        this.log.push(new ValidationItem({ message: infoListOrNull }));
      } else if (_.isArrayLike(infoListOrNull)) {
        // assuming this is a list of validationItems
        this.log.push(...infoListOrNull);
      } else {
        // assuming this is a single validationItem
        this.log.push(infoListOrNull);
      }
    }
    return this;
  }

  getLog() {
    return this.log.map(item => item.info);
  }

  success() {
    return this.log.length === 0;
  }
}

module.exports = { ValidationLog, ValidationItem };
