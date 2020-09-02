const { ValidationItem } = require("../lib/validation_log");

const validateFilename = filename => {
  const valog = [];
  const [, name, ext] = filename.match(/^(.*)\.([^.]+)$/) || [];
  if (ext !== "xlsx") {
    valog.push(
      new ValidationItem({
        message: `Uploaded file must have ".xlsx" extension`
      })
    );
  }
  const nameParts = (name || "").split("_");

  const agency = nameParts.shift();
  // TODO: specific rules for agency abbreviation
  if (!agency) {
    valog.push(
      new ValidationItem({
        message: `First part of file name must be an agency abbreviation.`
      })
    );
  }

  const projectId = nameParts.shift();
  // TODO: specific rules for project id
  if (!projectId) {
    valog.push(
      new ValidationItem({
        message: `Second part of file name must be a project id.`
      })
    );
  }

  const version = nameParts.pop();
  console.log("version", version);
  if (!/^v\d+/.test(version)) {
    valog.push(
      new ValidationItem({
        message: `Last part of filename must be a version number (e.g. _v3)`
      })
    );
  }

  const reportingDate = nameParts.pop();
  // TODO: match against expected reporting date from config instead of hard coded.
  const expectedEndReportDate = "06302020";
  if (reportingDate !== expectedEndReportDate) {
    valog.push(
      new ValidationItem({
        message: `Second to last part of filename must be the end report date (${expectedEndReportDate})`
      })
    );
  }

  if (valog.length) {
    valog.push(
      new ValidationItem({
        message: `Uploaded file name must match pattern
      <agency abbrev>_<project id>_<short project name>_<reporting due date>_v<version number>.xlsx
      Example: EOH_Covid-Supp-013_ppe_06302020_v1.xlsx
      `
      })
    );
  }
  return valog;
};

module.exports = {
  validateFilename
};
