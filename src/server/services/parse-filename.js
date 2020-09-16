const { ValidationItem } = require("../lib/validation-log");
const { agencyByCode } = require("../db");

const expectedEndReportDate = process.env.END_REPORTING_DATE;

const parseFilename = async filename => {
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
  if (projectId === "InvalidProjectID") {
    valog.push(
      new ValidationItem({
        message: `Second part of file name must be a project id.`
      })
    );
  }

  const reportingDate = nameParts.shift();
  if (reportingDate !== expectedEndReportDate) {
    valog.push(
      new ValidationItem({
        message: `Third part of filename must match the reporting period end date (${expectedEndReportDate})`
      })
    );
  }

  const version_str = ((nameParts.pop() || "").match(/^v(\d+)$/) || [])[1];
  const version = parseInt(version_str, 10);
  if (!version) {
    valog.push(
      new ValidationItem({
        message: `Last part of filename must be a version number (e.g. -v3)`
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
  return { agencyCode, projectId, reportingDate, version, valog };
};

module.exports = {
  parseFilename
};
