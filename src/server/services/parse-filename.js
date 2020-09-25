const { ValidationItem } = require("../lib/validation-log");
const { agencyByCode } = require("../db");
const { currentReportingPeriod } = require("../db/settings");
const { format } = require("date-fns");

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
          message: `The agency code "${agencyCode}" in the filename is not valid.`
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

  const currentPeriod = await currentReportingPeriod();
  const endDate = (currentPeriod || {}).end_date;
  if (!endDate) throw new Error(`Error finding currentReportingPeriod`);
  const expectedEndReportDate = format(endDate, "MMddyyyy");
  const reportingDate = nameParts.shift();
  if (reportingDate !== expectedEndReportDate) {
    valog.push(
      new ValidationItem({
        message: `The filename's reporting period end date "${reportingDate}" does not match the current reporting period end date set up in the application "${expectedEndReportDate}"`
      })
    );
  }

  const version_str = ((nameParts.pop() || "").match(/^v(\d+)$/) || [])[1];
  const version = parseInt(version_str, 10);
  if (!version) {
    valog.push(
      new ValidationItem({
        message: `Filename is missing the version number`
      })
    );
  }

  if (valog.length) {
    // put this on the front of the error list
    valog.unshift(
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
