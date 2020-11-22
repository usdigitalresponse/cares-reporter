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
    var arrUploadSummaries = await getUploadSummaries()
    // console.dir(arrUploadSummaries[0])
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

  const objUploadSummaries = {}
  arrUploadSummaries.forEach( rec => objUploadSummaries[rec.id] = rec )

  try {
    // eslint-disable-next-line
    var documents = await documentsInCurrentReportingPeriod()

  } catch ( err ) {
    res.statusMessage = "Failed to load document records";
    return res.status(500).end()
  }

  console.log(`Found ${documents.length} documents`);
  let rv = deDuplicate(documents, objUploadSummaries)
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

function deDuplicate(documents, objUploadSummaries) {
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
  // let total = 0
  // let current = 0

  documents.forEach(record => {
    let content = record.content
    let agencyID = agencyCodes[record.upload_id]
    let agencyCode = content["agency code"] || agencyID

    let projectID = content["project id"] ||
      content["project identification number"]

    const objUploadSummary = objUploadSummaries[record.upload_id]

    let key
    switch (record.type) {
      case "cover":
        // cover: {
        //   type: 'cover',
        //   content: {
        //     'agency code': 'DOH',
        //     'project id': '017',
        //     status: 'Completed 50% or more',
        //     'reporting period end date': 44104,
        //     'reporting period start date': 43891,
        //     'crf end date': 44195
        //   }
        // },
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
        record.content["identification number"] =
          String(content["identification number"])
        uniqueRecords[
          `subrecipient:${content["identification number"]}`
        ] = record
        break

      case  "contracts":
        // contracts: {
        //   type: 'contracts',
        //   content: {
        //     'project id': '017',
        //     'subrecipient id': '967',
        //     'subrecipient legal name': 'MIRIAM HOSPITAL',
        //     'contract number': '3679443',
        //     'contract type': 'Blanket Purchase Agreement',
        //     'contract amount': 79650,
        //     'contract date': 43958,
        //     'period of performance start date': 43958,
        //     'period of performance end date': 44135,
        //     'primary place of performance address line 1': '167 POINT ST 1A',
        //     'primary place of performance city name': 'PROVIDENCE',
        //     'primary place of performance state code': 'RI',
        //     'primary place of performance zip': '02903-4766',
        //     'primary place of performance country name': 'United States',
        //     'contract description': 'COVID-19 Antibody Surveillance R...',
        //     'current quarter obligation': 62000,
        //     'expenditure start date': 43958,
        //     'expenditure end date': 43998,
        //     'total expenditure amount': 25554.82,
        //     'covid-19 testing and contact tracing': 25554.82,
        //     'sum of expenses': 25554.82
        //   }
        // },
        uniqueRecords[
          `${agencyCode}:contract:${content["contract number"]}`
        ] = record
        break

      case  "grants":
        uniqueRecords[
          `${agencyCode}:grant:${content["award number"]}`
        ] = record
        break

      case  "loans":
        uniqueRecords[
          `${agencyCode}:loan:${content["loan number"]}`
        ] = record
        break

      case  "transfers":
        // transfers: {
        //   type: 'transfers',
        //   content: {
        //     'project id': '049',
        //     'subrecipient id': '60635',
        //     'subrecipient legal name': 'GALILEO LEARNING LLC',
        //     'transfer number': '21_1073_091120_10_072_13',
        //     'award amount': 50000,
        //     'transfer type': 'Reimbursable',
        //     'transfer date': 44092,
        //     'purpose description': 'Summer Academy for Interactive L...',
        //     'current quarter obligation': 50000,
        //     'expenditure start date': 44092,
        //     'expenditure end date': 44104,
        //     'total expenditure amount': 6420,
        //     'other expenditure amount': 6420,
        //     'other expenditure categories': 'Supportive Services',
        //     'sum of expenses': 6420
        //   }
        // },
        uniqueRecords[
          `${agencyCode}:transfer:${content["transfer number"]}`
        ] = record
        break

      case  "direct":
        // direct: {
        //   type: 'direct',
        //   content: {
        //     'project id': '063',
        //     'subrecipient id': '57411',
        //     'subrecipient legal name': 'GUIDESOFT INC',
        //     'obligation amount': 75988.22,
        //     'obligation date': 44012,
        //     'current quarter obligation': 75988.22,
        //     'expenditure start date': 44012,
        //     'expenditure end date': 44104,
        //     'total expenditure amount': 75988.22,
        //     'covid-19 testing and contact tracing': 75988.22,
        //     'sum of expenses': 75988.22
        //   }
        // },
        // console.dir(record)
        key =`${agencyCode}:direct` +
          `:project:${content["project id"]}` +
          `:subrecipient:${content["subrecipient id"]}`
        uniqueRecords[key] = record
        break

      case  "aggregate awards < 50000":
        // record is:
        // {
        //   id: 760,
        //   type: 'aggregate awards < 50000',
        //   content: {
        //     'funding type': 'Aggregate of Grants Awarded for <$50,000',
        //     'updates this quarter?': 'No'
        //   },
        //   created_at: 2020-11-19T15:14:34.478Z,
        //   upload_id: 1,
        //   last_updated_at: null,
        //   last_updated_by: null,
        //   user_id: 1
        // }

        key = `${content["funding type"]}`
        if ( !uniqueRecords[key] ) {
          uniqueRecords[key]= record

        } else {
          let fieldName = 'current quarter expenditure/payments'
          let total = uniqueRecords[key].content[fieldName]

          total = Number(total) || 0 + (Number(record.content[fieldName]) || 0)
          uniqueRecords[key].content[fieldName] = total

          fieldName = 'current quarter obligation'
          total = uniqueRecords[key].content[fieldName]

          total = Number(total) || 0 + (Number(record.content[fieldName]) || 0)
          uniqueRecords[key].content[fieldName] = total

          if (record.content['updates this quarter?'] === "Yes" ) {
            uniqueRecords[key].content['updates this quarter?'] = 'Yes'
          }
        }
        break

      case  "aggregate payments individual":
        // {
        //   id: 5371,
        //   type: 'aggregate payments individual',
        //   content: {
        //     'updates this quarter?': 'No',
        //     'current quarter obligation': 248188.65,
        //     'current quarter expenditure': 248188.65
        //   },
        //   created_at: 2020-11-19T15:15:50.139Z,
        //   upload_id: 7,
        //   last_updated_at: null,
        //   last_updated_by: null,
        //   user_id: 1
        // }
        key = `${record.type}` +
        `:agency:${objUploadSummary.agency_id}` +
        `:project:${objUploadSummary.project_id}`

        if ( !uniqueRecords[key]) {
          record.content.agency_id = objUploadSummary.agency_id
          record.content.project_id = objUploadSummary.project_id
          uniqueRecords[key] = record

        } else {
          console.dir(new Error('Duplicate Records!'))
          console.log('Already recorded:')
          console.dir(uniqueRecords[key])
          console.log('Duplicate:')
          console.dir(record)
          // throw new Error('Duplicate Records!')
        }
        break

      case "certification":
        return

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
