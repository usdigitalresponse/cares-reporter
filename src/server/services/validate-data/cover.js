const { ValidationItem } = require("../../lib/validation-log");

function validateCover(documents, fileParts) {
  const valog = [];
  const tabItem = "cover";
  const fileProjectId = fileParts.projectId.replace(/^0*/, "");
  const fileAgencyCode = fileParts.agencyCode;

  if (documents && documents.length > 0) {
    const { content } = documents[0];
    const row = 2;

    const tabAgencyCode = content["agency code"].toString();
    if (tabAgencyCode !== fileAgencyCode) {
      valog.push(
        new ValidationItem({
          message: `${tabItem}'s "agency code" (${tabAgencyCode}) must match file name's "agency code" (${fileAgencyCode})`,
          tab: tabItem,
          row: row
        })
      );
    }

    const tabProjectId = content["project id"].toString().replace(/^0*/, "");
    if (tabProjectId !== fileProjectId) {
      valog.push(
        new ValidationItem({
          message: `${tabItem}'s "project id" (${tabProjectId}) must match file name's "project id" (${fileProjectId})`,
          tab: tabItem,
          row: row
        })
      );
    }
  } else {
    valog.push(
      new ValidationItem({
        message: `${tabItem} requires a row with "agency code" and "project id"`,
        tab: tabItem
      })
    );
  }
  return valog;
}

module.exports = validateCover;
