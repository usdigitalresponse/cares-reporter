const { ValidationItem } = require("../../lib/validation-log");

const validateContracts = (documents = [], subrecipientsHash, fileParts) => {
  const valog = [];
  const tabItem = "contract";

  documents.forEach(({ content }, row) => {
    if (!subrecipientsHash[content["subrecipient id"]]) {
      valog.push(
        new ValidationItem({
          message: `Each ${tabItem} row must have a "subrecipient id" which is included in the "subrecipient" tab`,
          tab: "contracts",
          row: row + 2
        })
      );
    }
    const fileProjectId = fileParts.projectId.replace(/^0*/, "");
    const tabProjectId = content["project id"].toString().replace(/^0*/, "");
    if (tabProjectId !== fileProjectId) {
      valog.push(
        new ValidationItem({
          message: `${tabItem}'s "project id" (${tabProjectId}) must match file name's "project id" (${fileProjectId})`,
          tab: "contracts",
          row: row + 2
        })
      );
    }
  });
  return valog;
};

module.exports = validateContracts;
