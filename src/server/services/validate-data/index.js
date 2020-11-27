const _ = require("lodash");
const tabValidators = [
  require("./certification"),
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
  const groupedDocuments = _.groupBy(documents, "type");
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient);

  const validateContext = {
    fileParts,
    reportingPeriod: {
      startDate: format(reportingPeriod.start_date, "yyyy-MM-dd"),
      endDate: format(reportingPeriod.end_date, "yyyy-MM-dd"),
      periodOfPerformanceEndDate: format(
        reportingPeriod.period_of_performance_end_date,
        "yyyy-MM-dd"
      )
    },
    subrecipientsHash
  };

  return _.flatMap(tabValidators, tabValidator => {
    return _.take(tabValidator(groupedDocuments, validateContext), 100);
  });
};

module.exports = { validateData };
