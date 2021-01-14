const _ = require('lodash')

function removeEmptyDocuments (documents) {
  let rowsOut = []
  documents.forEach(d => {
    let empty = _.every(d.content, v => _.isUndefined(v) || v === '' || v === 0 || v === null)
    if (!empty) {
      rowsOut.push(d)
    }
  })
  return rowsOut
  // return _.reject(documents, d =>
  //   _.every(d.content, v => _.isUndefined(v) || v == "" || v == 0)
  // );
}

module.exports = {
  removeEmptyDocuments
}
