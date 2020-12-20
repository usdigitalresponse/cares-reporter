/*
--------------------------------------------------------------------------------
-                           db/period-summaries.js
--------------------------------------------------------------------------------
  A period-summary record in postgres looks like this:

    id                  | integer       |
    reporting_period_id | integer       |
    project_code        | text          |
    award_type          | text          |
    award_number        | text          |
    current_obligation  | numeric(19,2) |
    current_expenditure | numeric(19,2) |
*/
const knex = require("./connection");
const { documentsWithProjectCode } = require("./documents");
const { getCurrentReportingPeriodID } = require("./settings");
const { isClosed } = require("./reporting-periods");
const _=require("lodash");

module.exports = {
  getPeriodSummaries: getSummaries
};

/*  getSummaries() returns the summaries for a reporting period. If no
  reporting period is specified, it returns summaries for the current
  reporting period.
  */
async function getSummaries(reporting_period_id) {
  if (!reporting_period_id){
    console.log(`getSummaries()`);
    reporting_period_id = await getCurrentReportingPeriodID();
    if (_.isError(reporting_period_id)) {
      throw new Error("this is bad");
    }
  }
  let periodSummaries = await knex("period_summaries")
  .select("*")
  .where("reporting_period_id", reporting_period_id);

  if (periodSummaries.length) {
    return { periodSummaries, errors: [] };
  }


  let summaryData = await generateSummaries(reporting_period_id);

  if (summaryData.errors.length) {
    return summaryData;
  }

  if ( await isClosed(reporting_period_id) ) {
    summaryData.errors = await saveSummaries(summaryData.periodSummaries);
  }

  return summaryData;
}

async function saveSummaries(periodSummaries) {
  let errLog =[];

  for (let i=0; i<periodSummaries.length; i++) {
    try {
      await knex("period_summaries").insert(periodSummaries[i]);

    } catch (err) {
      errLog.push(err.detail);
    }
  }

  return errLog;
}

async function generateSummaries(reporting_period_id) {
  let periodSummaries = [];
  let errLog =[];

  let mapPeriodSummaries = new Map();
  let documents = await documentsWithProjectCode(reporting_period_id);
  if (_.isError(documents)){
    return {
      errors: documents.message
    };
  }
  if (documents.length === 0){
    return {
      periodSummaries,
      errors: [`No records in period ${reporting_period_id}`]
    };
  }

  documents.forEach(document => {
    let awardNumber;
    let obligation = document.content["current quarter obligation"];
    let amount = document.content["cost or expenditure amount"] || 0;
    let jsonRow = document.content;

    switch ( document.type ) {
      case "contracts":
        awardNumber = jsonRow["contract number"];
        break;
      case "grants":
        awardNumber = jsonRow["award number"];
        break;
      case "loans":
        awardNumber = jsonRow["loan number"];
        amount = jsonRow["total payment amount"];
        break;
      case "transfers":
        awardNumber = jsonRow["transfer number"];
        break;
      case "direct":
        // date needed in key for Airtable issue #92
        awardNumber = `${jsonRow["subrecipient id"]}:${jsonRow["obligation date"]}`;
        break;
    }

    switch ( document.type ) {
      case "contracts":
      case "grants":
      case "loans":
      case "transfers":
      case "direct":{
        let key =`${document.project_code}:${document.type}:${awardNumber}`;
        let rec = mapPeriodSummaries.get(key);
        if (rec) {
          if (obligation !== rec.current_obligation) {
            errLog.push(
              `Multiple current quarter obligations for ${key} - ${obligation}`
            );
          }
          rec.current_expenditure += amount;

        } else {
          mapPeriodSummaries.set(key, {
            reporting_period_id : reporting_period_id,
            project_code : document.project_code,
            award_type: document.type,
            award_number: awardNumber,
            current_obligation: obligation,
            current_expenditure: amount
          });
        }
        break;
      }
      default:
        // ignore the other sheets
        break;
    }
  });

  mapPeriodSummaries.forEach(
    periodSummary => periodSummaries.push(periodSummary)
  );
  // console.dir(periodSummaries);
  return { periodSummaries, errors: errLog };
}

/*                                 *  *  *                                    */
