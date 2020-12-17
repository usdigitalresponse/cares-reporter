/*
--------------------------------------------------------------------------------
-                           db/period-summaries.js
--------------------------------------------------------------------------------
  A period-summary record in postgres looks like this:

    id                  | integer       |
    reporting_period_id | integer       |
    project_id          | integer       |
    type                | text          |
    current_obligation  | numeric(19,2) |
    current_expenditure | numeric(19,2) |
*/
const knex = require("./connection");
const { documentsWithProjectCode } = require("./documents");

module.exports = {
  getPeriodSummaries
};

/*  getPeriodSummaries() returns the summaries for a reporting period. If no
  reporting period is specified, it returns summaries for the current
  reporting period.
  */
async function getPeriodSummaries(reporting_period_id) {
  let periodSummaries = await knex("period_summaries")
  .select("*")
  .where("id", reporting_period_id);

  if (periodSummaries.length) {
    return { periodSummaries, closed:true };
  }

  periodSummaries = [];
  let mapPeriodSummaries = new Map();
  let documents = await documentsWithProjectCode(reporting_period_id);
  documents.forEach(document => {
    let amount = document.content["cost or expenditure amount"] || 0;
    let obligation = document.content["current quarter obligation"];

    switch ( document.type ) {
      case "contracts":
      case "grants":
      case "loans":
        amount = document.content["total payment amount"];
        // eslint-disable-next-line no-fallthrough
      case "transfers":
      case "direct":{
        let key =`${document.project_code}:${document.type}`;
        let rec = mapPeriodSummaries.get(key);
        if (rec) {
          rec.current_expenditure += amount;
          if (obligation !== rec.current_obligation) {
            console.log(`Multiple current quarter obligations for ${key} - ${obligation}`);
            console.dir(rec);
            // throw new Error(
            //   `Multiple current quarter obligations for the same project`
            // );
          }

        } else {
          mapPeriodSummaries.set(key, {
            reporting_period_id : reporting_period_id,
            project_id : document.project_code,
            type: document.type,
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
  console.dir(periodSummaries);
  return { periodSummaries, closed:false };
}

/*                                 *  *  *                                    */
