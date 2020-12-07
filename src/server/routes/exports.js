const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { documentsInCurrentReportingPeriod } = require("../db");
const { getTemplateSheets } = require("../services/get-template");
const { makeConfig } = require("../lib/config");
const { createTreasuryOutputWorkbook, clean } = require("../lib/spreadsheet");
const { getUploadSummaries } = require("../db/uploads");
const { applicationSettings } = require("../db/settings");
const { getSubRecipients, setSubRecipient } = require("../db/subrecipients");

const _ = require("lodash");

router.get("/", requireUser, async function(req, res) {

  const treasuryTemplateSheets = getTemplateSheets("treasury");
  // console.dir(treasuryTemplateSheets);
  const config = makeConfig(treasuryTemplateSheets, "Treasury Template", []);
  // console.dir(config);

  if (!config) {
    res.statusMessage = "Failed to make config";
    return res.status(500).end();
  }

  let outputWorkBook;
  try{
    outputWorkBook = await processDocuments(res, config);

  } catch (err) {
    res.statusMessage = "Failed to create output workbook";
    return res.status(500).end();
  }

  const filename = await getFilename();
  console.log(`Filename is ${filename}`);

  res.header(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  res.header("Content-Type", "application/octet-stream");
  res.send(Buffer.from(outputWorkBook, "binary"));
});

async function getFilename() {
  const timeStamp = new Date().toISOString().split(".")[0].split(":").join("");
  let {
    title:state,
    current_reporting_period_id:period
  } = await applicationSettings();
  let fileName = `${state}-Period-${period}-CRF-Report-to-OIG-V.${timeStamp}`;

  if ( process.env.AUDIT ) {
    return fileName+".audit.xlsx";

  } else {
    return fileName+".xlsx";
  }
}

async function processDocuments( res, config ) {

  const mapUploadMetadata = new Map();
  try {
    let arrUploadMetaData = await getUploadSummaries();
    arrUploadMetaData.forEach( rec => mapUploadMetadata.set(rec.id, rec));

  } catch ( err ) {
    res.statusMessage = "Failed to load upload summaries";
    return res.status(500).end();
  }

  let documents;
  try {
    documents = await documentsInCurrentReportingPeriod();

  } catch ( err ) {
    res.statusMessage = "Failed to load document records";
    return res.status(500).end();
  }

  console.log(`Found ${documents.length} documents`);
  let rv = await deDuplicate(documents, mapUploadMetadata);
  console.log(`Found ${rv.length} unique documents`);

  const groups = _.groupBy(rv, "type");
  console.log(`Found ${_.keys(groups).length} groups:`);

  return createTreasuryOutputWorkbook(config, groups);
}

async function deDuplicate(documents, mapUploadMetadata) {

  // get all the subrecipients currently in the subrecipients table
  let arrSubRecipients = await getSubRecipients();
  let mapSubrecipients = new Map(); // subrecipient id : <subrecipient record>
  arrSubRecipients.forEach(subrecipientRecord => {
    mapSubrecipients.set(
      subrecipientRecord["identification number"],
      subrecipientRecord
    );
  });

  console.log(`${mapSubrecipients.size} subrecipients in the database`);

  const {
    mapUploadAgency,
    mapProjectStatus
  } = await pass1(documents, mapSubrecipients);

  const {
    uniqueRecords,
    mapSubrecipientReferences
  } = pass2(documents, mapUploadAgency, mapProjectStatus);
  let rv = [];

  Object.keys(uniqueRecords).forEach(key => rv.push(uniqueRecords[key]));

  let missing = [];

  console.log(
    `\nThere are ${mapSubrecipients.size} Subrecipients`
  );

  mapSubrecipientReferences.forEach( ( record, subrecipientID) => {
    if ( !mapSubrecipients.has(subrecipientID) ) {
      missing.push(record);
    }
  });

  mapSubrecipients.forEach((v,k) => {
    rv.push({
      type: "subrecipient",
      referenced: mapSubrecipientReferences.has(k),
      content: v
    });
  });

  console.log(`\n${mapSubrecipients.size} subrecipient records`);
  console.log(`${mapSubrecipientReferences.size} are referenced`);
  console.log(`${missing.length} missing references\n`);

  if ( process.env.AUDIT ) {
    missing.forEach(record => {
      rv.push({
        id: 0,
        type: "missing_subrecipient",
        upload_file: mapUploadMetadata.get(record.upload_id).filename,
        tab: record.type,
        subrecipient_id: record.content["subrecipient id"]
      });
    });
  }

  return rv;
}

/*  pass1() returns metadata maps and adds new subrecipients to the database
  */
async function pass1(documents, mapSubrecipients){
  let mapUploadAgency = new Map(); // KV table of { upload_id: agency code }
  let mapProjectStatus = new Map(); // KV table of { project id: project status }
  // console.dir(mapSubrecipients);
  documents.forEach(async record => {
    switch (record.type) {
      case "cover":
        mapUploadAgency.set(
          record.upload_id,
          record.content["agency code"].trim()
        );
        mapProjectStatus.set(
          record.content["project id"],
          (record.content.status || "").trim() || null // BUG in upload validations
        );
        break;

      case "subrecipient":{
        let subrecipientID = record.content["identification number"].trim();

        // If an upload contains a new subrecipient, add it to the table.
        // Changes to existing subrecipients must be done by email request.
        // (decided 20 12 07  States Call)
        if ( !mapSubrecipients.has(subrecipientID) ) {
          let recSubRecipient = clean(record.content);
          mapSubrecipients.set(subrecipientID, recSubRecipient);
          setSubRecipient(recSubRecipient); // no need to wait
        }
        break;
      }
      default:
        break;
    }
  });
  return { mapUploadAgency, mapProjectStatus };
}

/* pass2() cleans and deduplicates records, and combines them as needed for
  the output tabs
  */
function pass2(documents, mapUploadAgency, mapProjectStatus) {
  let uniqueRecords = {}; // keyed by concatenated id
  let uniqueID = 0; // this is for records we don't deduplicate
  let mapSubrecipientReferences = new Map();

  documents.forEach(record => {
    uniqueID += 1;
    record.content = clean(record.content); // not needed after database is cleaned

    let agencyID = mapUploadAgency.get(record.upload_id);
    let agencyCode = record.content["agency code"] || agencyID;

    let projectID = record.content["project id"] ||
          record.content["project identification number"];

    switch (record.type) {
      case "cover":
        // ignore cover records
        break;

      case "certification":
        // ignore certification records
        break;

      case "subrecipient":{
        // handled in pass1
        break;
      }

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
        record.content["project identification number"] = projectID;
        record.content["status"] = mapProjectStatus.get(projectID);
        uniqueRecords[`${agencyCode}:project:${projectID}`] = record;
        break;

      // we have to assume none of these are duplicates, because two identical
      // records could both be valid, since we don't have anything like an
      // invoice number and there could be two expenditures in the same period
      case  "contracts":
      case  "grants":
      case  "loans":
      case  "transfers":
      case  "direct": {
        let srID = record.content["subrecipient id"];
        if (srID) {
          mapSubrecipientReferences.set(srID, record);

        } else {
          console.log(`${record.type} record is missing subrecipient ID`);
          console.dir(record.content);
        }
        uniqueRecords[uniqueID] = record;
        break;
      }

      case  "aggregate awards < 50000":
      case  "aggregate payments individual": {
        uniqueRecords[uniqueID] = record;
        break;
      }

      default:
        console.log("Unrecognized record:");
        console.dir(record);
        break;
    }
  });
  return {
    uniqueRecords,
    mapSubrecipientReferences
  };
}

module.exports = router;

/*                                  *  *  *                                   */
