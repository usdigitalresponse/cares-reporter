/*
--------------------------------------------------------------------------------
-                                 projects.js
--------------------------------------------------------------------------------
  fixCellFormats() attempts to identify the cells in a sheet that contain
  dates or dollar amounts, and attempts to make them appear in Excel
  correctly formatted.
*/

const knex = require("./connection");

/* updateProject() updates a project record from an uploaded agency
  spreadsheet
  */
async function updateProject(projectCode, documents){
  // get the project id for this upload from the cover page
  // then find that row in the projects page and use it to update
  // the database for that project.
  projectCode = fixProjectCode(projectCode);
  let projectRecord=null;
  // console.log(`UpdateProject() projectCode is - ${projectCode}`);

  for (let i = 0; i<documents.length; i++) {
    let row = documents[i];

    if ( row.type === "projects"){
      // console.dir(row);
      /*{
          type: 'projects',
          user_id: '1',
          content: {
            'agency code': 'DPS01',
            'project name': 'Coronavirus Relief - Depa...',
            'project identification number': '763691',
            description: "To provide funds to purchase pers...",
            'naming convention': 'DPS01-763691-093020-v1.xlsx'
          }
        }
        */
      // console.log(`"${code}" === "${projectCode}": ${code === projectCode}`);
      let code = fixProjectCode(row.content["project identification number"]);
      if (code === projectCode) {
        projectRecord = row.content;
        break;
      }
    }
  }
  if (!projectRecord) {
    console.log(`Project record ${projectCode} not found.`);
    return new Error(`Project record ${projectCode} not found.`);
  }
  // console.log(`projectRecord`);
  // console.dir(projectRecord);

  let status;
  for (let i = 0; i<documents.length; i++) {
    let row = documents[i];
    if ( row.type === "cover" ) {
      status = row.content.status;
      break;
    }
  }
  // console.log(`Project ${projectCode} Status "${status}"`);
  /*
   id          | integer |
   code        | text    |
   name        | text    |
   agency_id   | integer |
   status      | text    |
   description | text    |
  */
  let ok = await knex("projects")
    .where("code", projectCode)
    .update({
      status:status,
      description:projectRecord.description
    });

  // console.log(`updated project status and description`);

  if ( !ok ){
    console.log(`Failed to update status of project ${projectCode}`);
    return new Error(`Failed to update status of project ${projectCode}`);
  }

  return null;
}

async function getProjects() {
  return knex("projects")
    .select("*");
}

function fixProjectCode(code) {
  code = String(code);
  if (code.length < 3 ){
    code = ("000" + code).substr(-3);
  }
  return code;
}

module.exports = {
  getProjects,
  updateProject
};

/*                                 *  *  *                                    */
