const { ValidationItem } = require("../lib/validation_log");
const { agencyByCode } = require("../db");

const validateFilename = async filename => {
  const valog = [];
  const [, name, ext] = filename.match(/^(.*)\.([^.]+)$/) || [];
  if (ext !== "xlsx") {
    valog.push(
      new ValidationItem({
        message: `Uploaded file must have ".xlsx" extension`
      })
    );
  }
  const nameParts = (name || "").split("-");

  const agencyCode = nameParts.shift();

  if (!agencyCode) {
    valog.push(
      new ValidationItem({
        message: `First part of file name must be an agency code.`
      })
    );
  } else {
    const result = await agencyByCode(agencyCode);
    if (result.length < 1) {
      valog.push(
        new ValidationItem({
          message: `First part of file name "${agencyCode}" is not a valid agency code.`
        })
      );
    }
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

  const reportingDate = nameParts.shift();
  // TODO: match against expected reporting date from config instead of hard coded.
  const expectedEndReportDate = "06302020";
  if (reportingDate !== expectedEndReportDate) {
    valog.push(
      new ValidationItem({
        message: `Third part of filename must match the reporting period end date (${expectedEndReportDate})`
      })
    );
  }

  const version = nameParts.pop();
  if (!/^v\d+/.test(version)) {
    valog.push(
      new ValidationItem({
        message: `Last part of filename must be a version number (e.g. _v3)`
      })
    );
  }

  if (valog.length) {
    valog.push(
      new ValidationItem({
        message: `Uploaded file name must match pattern
      <agency abbrev>-<project id>-<reporting due date>-v<version number>.xlsx
      Example: EOH-013-06302020-v1.xlsx
      `
      })
    );
  }
  return valog;
};

module.exports = {
  validateFilename
};
