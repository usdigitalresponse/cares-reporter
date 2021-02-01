/*
--------------------------------------------------------------------------------
-                                 lib/subrecipients.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const _ = require('lodash')

const { clean, cleanString } = require('./spreadsheet')
const { getSubRecipients, setSubRecipient } = require('../db/subrecipients')
const { getReportedSubrecipientIds } = require('../db/period-summaries')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

/*  updateSubrecipientTable() adds new subrecipients to the database
  */
async function updateSubrecipientTable (documents) {
  // get all the subrecipients currently in the subrecipients table
  let mapSubrecipients
  try {
    mapSubrecipients = await getSubRecipients()
  } catch (err) {
    return err
  }

  documents.forEach(async record => {
    switch (record.type) {
      case 'subrecipient': {
        const subrecipientIN = cleanString(record.content['identification number'])

        // Changes to existing subrecipients must be done in the UI.
        // (decided 20 12 07  States Call)
        if (mapSubrecipients.has(subrecipientIN)) {
          break
        }

        const recSubRecipient = clean(record.content)

        // to ignore duplicates in the same upload
        mapSubrecipients.set(subrecipientIN, recSubRecipient)

        // If an upload contains a new subrecipient, add it to the db table.
        setSubRecipient(recSubRecipient) // no need to wait

        break
      }
      default:
        break
    }
  })
  return mapSubrecipients
}

async function getSubrecipientRecords (mapUploadMetadata, mapSubrecipientReferences) {
  const subrecipientRecords = []
  const mapSubrecipients = await getSubRecipients()
  if (_.isError(mapSubrecipients)) {
    return mapSubrecipients
  }
  const arrPriorPeriodSubrecipientIDs = await getReportedSubrecipientIds()
  let previouslyReported = 0
  let newThisPeriod = 0
  let orphanSubrecipients = 0
  let missingSubrecipients = 0

  mapSubrecipientReferences.forEach((record, subrecipientID) => {
    let type

    if (mapSubrecipients.has(subrecipientID)) {
      if (arrPriorPeriodSubrecipientIDs.indexOf(subrecipientID) === -1) {
        newThisPeriod += 1
        type = 'subrecipient'
      } else {
        previouslyReported += 1
        type = 'prior_subrecipient'
      }
      subrecipientRecords.push({
        type: type,
        content: mapSubrecipients.get(subrecipientID)
      })
    } else if (process.env.AUDIT) {
      missingSubrecipients += 1
      subrecipientRecords.push({
        type: 'missing_subrecipient',
        subrecipient_id: subrecipientID,
        tab: record.type,
        upload_file: mapUploadMetadata.get(record.upload_id).filename
      })
    }
  })

  if (process.env.AUDIT) {
    mapSubrecipients.forEach((record, subrecipientID) => {
      if (arrPriorPeriodSubrecipientIDs.indexOf(subrecipientID) === -1 &&
        !mapSubrecipientReferences.has(subrecipientID)) {
        orphanSubrecipients += 1

        subrecipientRecords.push({
          type: 'orphan_subrecipient',
          content: record
        })
      }
    })
  }
  log(`${subrecipientRecords.length} subrecipient records`)
  log(`Previously reported: ${previouslyReported}`)
  log(`New this period: ${newThisPeriod}`)
  log(`Missing: ${missingSubrecipients}`)
  log(`Orphan: ${orphanSubrecipients}`)

  return subrecipientRecords
}

module.exports = {
  getSubrecipientRecords,
  update: updateSubrecipientTable
}

/*                                  *  *  *                                   */
