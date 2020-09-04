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
      if (_.isArrayLike(infoListOrNull)) {
        this.log.push(...infoListOrNull);
      } else if (_.isString(infoListOrNull)) {
        this.log.push(new ValidationItem({ infoListOrNull }));
      } else {
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
