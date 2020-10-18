const _ = require('lodash');

function removeEmptyDocuments(documents) {
  return _.reject(documents, d => _.every(d.content, v => _.isUndefined(v) || v == '' || v == 0));
}

module.exports = {
  removeEmptyDocuments
}
