const express = require("express");
const { requireAdminUser, requireUser } = require("../access-helpers");

const router = express.Router();
const {
  agencyById,
  projects,
  getProject,
  createProject,
  updateProject
} = require("../db");

router.get("/", requireUser, function(req, res) {
  projects().then(projects => res.json({ projects }));
});

async function validateProject(req, res, next) {
  const { name, code, agency_id } = req.body;
  if (!name) {
    res.status(400).send("Project requires a name");
    return;
  }
  if (!code) {
    res.status(400).send("Project requires a code");
    return;
  }
  if (agency_id) {
    const agency = await agencyById(agency_id);
    if (!agency) {
      res.status(400).send("Invalid agency");
      return;
    }
  } else {
    res.status(400).send("Project requires agency");
    return;
  }
  next();
}

router.post("/", requireAdminUser, validateProject, function(req, res, next) {
  console.log("POST /projects", req.body);
  const { code, name, agency_id } = req.body;
  const project = {
    code,
    name,
    agency_id
  };
  createProject(project)
    .then(result => res.json({ project: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("Project with that code already exists");
      } else {
        next(e);
      }
    });
});

router.put("/:id", requireAdminUser, validateProject, async function(
  req,
  res,
  next
) {
  console.log("PUT /projects/:id", req.body);
  let project = await getProject(req.params.id);
  if (!project) {
    res.status(400).send("Project not found");
    return;
  }
  const { code, name, agency_id } = req.body;
  project = {
    ...project,
    code,
    name,
    agency_id
  };
  updateProject(project)
    .then(result => res.json({ project: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("Project with that code already exists");
      } else {
        next(e);
      }
    });
});

module.exports = router;
