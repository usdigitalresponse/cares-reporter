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

module.exports = {
  closeReportingPeriod,
  getPeriodSummaries:  getSummaries,
  getPriorPeriodSummaries
};

/*  getSummaries() returns the summaries for a reporting period. If no
  reporting period is specified, it returns summaries for the current
  reporting period.
  */
async function getSummaries(reporting_period_id) {
  if (!reporting_period_id){
    reporting_period_id = await getCurrentReportingPeriodID();
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

/* getPriorPeriodSummares() finds all the summaries for periods before the report_period_id argument
  */
async function getPriorPeriodSummaries(reporting_period_id) {

  const query = `select p.id, p.start_date, p.end_date
    from reporting_periods p, reporting_periods r
    where p.end_date < r.start_date and r.id = ${reporting_period_id}
    order by p.end_date, p.id desc
    limit 1`;
  const result = await knex.raw(query).then(r => r.rows ? r.rows[0] : null);
  if (!result) {
    return { periodSummaries: [] };
  }
  return getSummaries(result.id);
}

/* closeReportingPeriod() closes a reporting period by writing the period
  summaries to the database.
  */
async function closeReportingPeriod(reporting_period_id) {
  let errLog = [];

  let { periodSummaries, closed } = await getPeriodSummaries(reporting_period_id);

  if (closed) {
    return [`Reporting period ${reporting_period_id} is already closed`];
  }

  periodSummaries.forEach(async periodSummary => {
    try {
      await knex("period_summaries").insert(periodSummary);

    } catch (err) {
      errLog.push(err.detail);
    }
  });
  if (errLog.length) {
    return errLog;
  }

  closed = (await getPeriodSummaries(reporting_period_id)).closed;
  if ( !closed ) {
    return [`Failed to close reporting period ${reporting_period_id}`];
  }

  return null;
}
/*                                 *  *  *                                    */
