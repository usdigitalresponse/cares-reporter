/*
--------------------------------------------------------------------------------
-                                 projects.js
--------------------------------------------------------------------------------
  A project record in postgres looks like this:
   id          | integer |
   code        | text    |
   name        | text    |
   agency_id   | integer |
   status      | text    |
   description | text    |
*/

const knex = require("./connection");
const { getCurrentReportingPeriodID } = require("./settings");

async function createProject(project) {
  project.created_in_period = await getCurrentReportingPeriodID();
  return knex
    .insert(project)
    .into("projects")
    .returning(["id"])
    .then(response => {
      return {
        ...project,
        id: response[0].id
      };
    });
}

function updateProject(project) {
  return knex("projects")
    .where("id", project.id)
    .update({
      code: project.code,
      name: project.name,
      agency_id: project.agency_id,
      status: project.status,
      description: project.description
    });
}

function projects() {
  return knex("projects")
    .select(
      "projects.*",
      "agencies.code as agency_code",
      "agencies.name as agency_name"
    )
    .leftJoin("agencies", "projects.agency_id", "agencies.id")
    .orderBy("name");
}


function getProject(projectCode) {
  return projectByCode(projectCode)
    .then(r => r[0]);
}

function projectByCode(code) {
  return knex("projects")
    .select("*")
    .where({ code });
}

function projectById(id) {
  return knex("projects")
    .select("*")
    .where({ id })
    .then(r => r[0]);
}

/* updateProjectStatus() updates a project status from an uploaded agency
  spreadsheet
  */
async function updateProjectStatus(projectCode, documents){
  // get the project id for this upload from the cover page
  // then find that row in the projects page and use it to update
  // the database for that project.
  projectCode = fixProjectCode(projectCode);
  let projectRecord= await getProject(projectCode);

  if (!projectRecord) {
    return new Error(`Project record ${projectCode} not found.`);
  }

  let status = null;
  for (let i = 0; i<documents.length; i++) {
    let row = documents[i];
    if ( row.type === "cover" ) {
      status = row.content.status;
      break;
    }
  }

  if ( !status ) {
    return new Error(`Status is missing from Cover sheet.`);
  }

  // console.log(`Project "${projectCode}" status is "${status}"`);
  let ok = await knex("projects")
    .where("code", projectCode)
    .update({
      status:status
    });

  // console.log(`updated project status and description`);

  if ( !ok ){
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
    code = (`000${code}`).substr(-3);
  }
  return code;
}

module.exports = {
  createProject,
  fixProjectCode,
  getProject,
  getProjects,
  projectByCode,
  projectById,
  projects,
  updateProject,
  updateProjectStatus
};

/*                                 *  *  *                                    */
