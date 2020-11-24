const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { documentsInCurrentReportingPeriod } = require("../db");
const { getTemplateSheets } = require("../services/get-template");
const { makeConfig } = require("../lib/config");
const { createTreasuryOutputWorkbook } = require("../lib/spreadsheet");
const { getUploadSummaries } = require("../db/uploads");
const _ = require("lodash");

router.get("/", requireUser, function(req, res) {

  const treasuryTemplateSheets = getTemplateSheets(`treasury`);

  const config = makeConfig(treasuryTemplateSheets, "Treasury Template", []);

  if (!config) {
    res.sendStatus(500);

  } else {
    processDocuments(res, config )
  }
});

async function processDocuments( res, config ) {
  try {
    // eslint-disable-next-line
    var arrUploadMetaData = await getUploadSummaries()
    // console.dir(arrUploadMetaData[0])
    // {
    //   id: 1,
    //   filename: 'DOA-076-093020-v1.xlsx',
    //   created_at: 2020-11-19T15:14:34.481Z,
    //   created_by: 'michael+admin@stanford.cc',
    //   reporting_period_id: 1,
    //   user_id: 1,
    //   agency_id: 3,
    //   project_id: 48
    // }

  } catch ( err ) {
    res.statusMessage = "Failed to load upload summaries";
    return res.status(500).end()
  }

  const objUploadMetadata = {}
  arrUploadMetaData.forEach( rec => objUploadMetadata[rec.id] = rec )

  try {
    // eslint-disable-next-line
    var documents = await documentsInCurrentReportingPeriod()

  } catch ( err ) {
    res.statusMessage = "Failed to load document records";
    return res.status(500).end()
  }

  console.log(`Found ${documents.length} documents`);
  let rv = deDuplicate(documents, objUploadMetadata)
  console.log(`Found ${rv.length} unique documents`);

  const groups = _.groupBy(rv, "type");
  console.log(`Found ${_.keys(groups).length} groups:`);

  createTreasuryOutputWorkbook(config, groups).then(attachmentData => {
    const filename = `${config.name}.xlsx`;
    res.header(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.header("Content-Type", "application/octet-stream");
    res.send(Buffer.from(attachmentData, "binary"));
  });
}

function deDuplicate(documents, objUploadMetadata) {
  let agencyCodes = {} // KV table of { upload_id: agency code }
  let objProjectStatus ={} // KV table of { project id: project status }

  documents.forEach(record => {
    switch (record.type) {
      case "cover":
        agencyCodes[record.upload_id] = record.content["agency code"]
        objProjectStatus[record.content['project id']] = record.content.status
        break
      default:
        break
    }
  })

  let uniqueRecords = {} // keyed by concatenated id
  let uniqueID = 0 // this is for records we don't deduplicate
  documents.forEach(record => {
    uniqueID += 1
    let content = record.content
    let agencyID = agencyCodes[record.upload_id]
    let agencyCode = content["agency code"] || agencyID

    let projectID = content["project id"] ||
      content["project identification number"]

    switch (record.type) {
      case "cover":
        // ignore cover records
        break

      case "certification":
        // ignore certification records
        break

      case "projects":
        // projects: {
        //   type: 'projects',
        //   content: {
        //     'agency code': 'JUD',
        //     'project name': 'Providence Grand Jury Proceedings Under...',
        //     'project identification number': 202,
        //     description: 'This Rhode Island Superior Court project...'
        //     'naming convention': 'JUD-202-093020-v1.xlsx'
        //   }
        // },
        // console.dir(record)
        // force ID to String - some of them may come in as Number
        record.content["project identification number"] = String(projectID)
        record.content["status"] = objProjectStatus[projectID]
        uniqueRecords[`${agencyCode}:project:${projectID}`] = record
        break

      case "subrecipient":
        // subrecipient: {
        //   type: 'subrecipient',
        //   content: {
        //     'identification number': '57292',
        //     'legal name': 'ZOOM VIDEO COMMUNICATIONS INC',
        //     'address line 1': '55 ALMADEN BLVD STE 600',
        //     'city name': 'SAN JOSE',
        //     'state code': 'CA',
        //     zip: '95113',
        //     'country name': 'United States',
        //     'organization type': 'For-Profit Organization...)'
        //   }
        // },
        // force ID to String - some of them come in as Number
        record.content["identification number"] =
          String(content["identification number"])
        uniqueRecords[
          `subrecipient:${record.content["identification number"]}`
        ] = record
        break

      case  "contracts":
      case  "grants":
      case  "loans":
      case  "transfers":
      case  "direct":
      case  "aggregate awards < 50000":
      case  "aggregate payments individual":
        uniqueRecords[uniqueID] = record
        break

      default:
        console.log("Unrecognized record:")
        console.dir(record)
        // certification: {
        //   type: 'certification',
        //   content: {
        //     certification: 'By signing this report, I certify ...',
        //     'agency financial reviewer name': 'Amanda M. Rivers',
        //     date: 44153
        //   }
        // },

      return
    }
  })

  let rv = []
  Object.keys(uniqueRecords).forEach(key => rv.push(uniqueRecords[key]))

  return rv
}

module.exports = router;

/*                                  *  *  *                                   */
