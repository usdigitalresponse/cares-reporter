<template>
  <div class="reporting-period">
    <h1>Reporting Period</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="ReportingPeriod"
        :columns="fields"
        :record="editReportingPeriod"
        :id="editReportingPeriod.id"
        :isNew="isNew"
        :onSave="onSave"
        :onCancel="onCancel"
        :onDone="onDone"
        :errorMessage="errorMessage"
      />
    </div>
  </div>
</template>

<script>
import DocumentForm from '../components/DocumentForm'
import moment from 'moment'
import _ from 'lodash'
export default {
  name: 'ReportingPeriod',
  components: {
    DocumentForm
  },
  data: function () {
    let id = 0
    if (this.$route && this.$route.params && this.$route.params.id) {
      id = parseInt(this.$route.params.id)
    }
    return {
      id,
      isNew: !id,
      editReportingPeriod: this.findReportingPeriod(id),
      errorMessage: null
    }
  },
  computed: {
    loading: function () {
      return this.id !== 0 && !this.editReportingPeriod
    },
    fields: function () {
      return [
        { name: 'name', required: true },
        { name: 'start_date', label: 'Reporting Period Start Date', required: true, date: true },
        { name: 'end_date', label: 'Reporting Period End Date', required: true, date: true },
        { name: 'period_of_performance_end_date', required: true, date: true },
        { name: 'crf_end_date', label: 'CRF End Date', required: true, date: true }
      ]
    },
    dateFields: function () {
      return this.fields.filter(f => f.date).map(f => f.name)
    }
  },
  watch: {
    '$store.state.reportingPeriods': function () {
      this.editReportingPeriod = this.findReportingPeriod(this.id)
    }
  },
  methods: {
    findReportingPeriod (id) {
      const r = _.find(this.$store.state.allReportingPeriods, { id })
      if (r) {
        const result = { ...r }
        this.dateFields.forEach(f => {
          result[f] = this.formatDate(result[f])
        })
        return result
      }
      return {}
    },
    onSave (reportingPeriod) {
      const updatedReportingPeriod = {
        ...this.editReportingPeriod,
        ...reportingPeriod
      }
      // convert everything back to sortable format
      this.dateFields.forEach(f => {
        const v = updatedReportingPeriod[f]
        if (v) {
          updatedReportingPeriod[f] = moment(v, 'MM/DD/YYYY').utc().format('YYYY-MM-DD')
        }
      })
      return this.$store
        .dispatch(
          this.isNew ? 'createReportingPeriod' : 'updateReportingPeriod',
          updatedReportingPeriod
        )
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message))
    },
    onCancel () {
      this.onDone()
    },
    onDone () {
      this.$router.push('/reporting_periods')
    },
    formatDate (d) {
      if (d) {
        const dt = moment(d)
        if (dt.isValid()) {
          return dt.format('MM/DD/YYYY')
        }
      }
      return ''
    }
  }
}
</script>

<style scoped>
.reporting-period {
  width: 90%;
  margin: 0 auto;
}
</style>
