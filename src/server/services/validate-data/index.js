const _ = require('lodash')
const tabValidators = [
  require('./certification'),
  require('./cover'),
  require('./subrecipients'),
  require('./contracts'),
  require('./grants'),
  require('./loans'),
  require('./transfers'),
  require('./direct')
]
const { getSubrecipientsHash } = require('./helpers')
const { format } = require('date-fns')

const validateData = (documents, fileParts, reportingPeriod, periodSummaries, firstReportingPeriodStartDate) => {
  const groupedDocuments = _.groupBy(documents, 'type')
  const subrecipientsHash = getSubrecipientsHash(groupedDocuments.subrecipient)

  const validateContext = {
    fileParts,
    firstReportingPeriodStartDate: format(firstReportingPeriodStartDate, 'yyyy-MM-dd'),
    reportingPeriod: {
      startDate: format(reportingPeriod.start_date, 'yyyy-MM-dd'),
      endDate: format(reportingPeriod.end_date, 'yyyy-MM-dd'),
      periodOfPerformanceEndDate: format(
        reportingPeriod.period_of_performance_end_date,
        'yyyy-MM-dd'
      ),
      crfEndDate: format(reportingPeriod.crf_end_date, 'yyyy-MM-dd')
    },
    subrecipientsHash,
    tags: reportingPeriod.validation_rule_tags,
    periodSummaries
  }
  return _.flatMap(tabValidators, tabValidator => {
    return _.take(tabValidator(groupedDocuments, validateContext), 100)
  })
}

module.exports = { validateData }
