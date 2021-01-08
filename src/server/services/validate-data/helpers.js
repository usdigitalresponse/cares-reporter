const _ = require('lodash')

const subrecipientKey = subrecipient => {
  // keep duns number first or tests fail
  // console.log(`subrecipientKey()`)
  // console.dir(subrecipient)
  return subrecipient['duns number'] || subrecipient['identification number']
}

/* getSubrecipientsHash() returns a KV table where k is the subrecipient id
  and v is the subrecipient record:
  { '48262': {
      type: 'subrecipient',
      user_id: 1,
      content: {
        'identification number': '48262',
        'duns number': undefined,
        'legal name': 'HOLOGIC INC',
        'address line 1': '250 CAMPUS DR',
        'address line 2': undefined,
        'address line 3': undefined,
        'city name': 'MARLBOROUGH',
        'state code': 'MA',
        zip: '01752',
        'country name': 'United States',
        'organization type': 'County Government'
      },
      sourceRow: 3
    },
    ...
  }
  */
const getSubrecipientsHash = subrecipientDocuments => {
  return _.keyBy(subrecipientDocuments, ({ content }) => {
    return subrecipientKey(content)
  })
}

module.exports = {
  subrecipientKey,
  getSubrecipientsHash
}
