const _ = require("lodash");
const tabValidators = [
  require("./cover"),
  require("./subrecipients"),
  require("./contracts"),
  require("./grants"),
  require("./loans"),
  require("./transfers"),
  require("./direct")
];
const { getSubrecipientsHash } = require("./helpers");
const { format } = require("date-fns");

const validateData = (documents, fileParts, reportingPeriod) => {
  const valog = [];
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient);

  const validateContext = {
    fileParts,
    reportingPeriod: {
      startDate: format(reportingPeriod.start_date, "yyyy-MM-dd"),
      endDate: format(reportingPeriod.end_date, "yyyy-MM-dd")
    },
    subrecipientsHash
  };

  _.each(tabValidators, validator => {
    const tabValog = validator(groupedDocuments, validateContext);
    valog.push(...tabValog.slice(0, 100));
  });

  return valog;
};

module.exports = { validateData };
