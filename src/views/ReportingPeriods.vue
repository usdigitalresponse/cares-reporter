<template>
  <div class="reporting-periods">
    <h2>Reporting Periods</h2>
    <table class="mt-3 table table-striped">
      <thead class="thead-light">
        <tr>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Certified At</th>
        </tr>
      </thead>
      <tbody :key="n" v-for="(p, n) in reportingPeriods">
        <tr :key="n">
          <td>{{ p.name }}</td>
          <td>{{ p.start_date }}</td>
          <td>{{ p.end_date }}</td>
          <td>
            <span v-if="isCurrentReportingPeriod(p)">
              <button
                  class="btn btn-primary"
                  data-toggle="modal"
                  data-target="#certify-reporting-period"
                  :disabled="certifying"
              >{{ certifyLabel }}</button>
            </span>
            <span v-else>
              {{ p.certified_at }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-3 alert alert-danger" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div class="modal modal-fade" tabindex="-1" role="dialog" id="certify-reporting-period">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Certify Reporting Period</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Certify the <b>{{ currentReportingPeriodName }}</b> period?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" @click.prevent="handleCertify">Certify</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportingPeriods',
  data: function () {
    return {
      certifying: false,
      errorMessage: null
    }
  },
  computed: {
    user: function () {
      return this.$store.state.user
    },
    reportingPeriods: function () {
      return this.$store.state.reportingPeriods
    },
    currentReportingPeriodName () {
      return this.$store.getters.currentReportingPeriod.name
    },
    currentReportingPeriodId () {
      return this.$store.getters.currentReportingPeriod.id
    },
    certifyLabel () {
      return this.certifying ? 'Certifying Reporting Period...' : 'Certify Reporting Period'
    }
  },
  methods: {
    isCurrentReportingPeriod: function (p) {
      if (this.$store.getters.currentReportingPeriod) {
        return p.id === this.$store.getters.currentReportingPeriod.id
      }
      return false
    },
    reportPeriodUrl: function (p) {
      return `/reporting_periods/${p.id}`
    },
    handleCertify: function () {
      const el = window.$('#certify-reporting-period')
      if (el) {
        el.modal('hide')
        this.certifying = true
        this.errorMessage = null
        this.$store.dispatch('closeReportingPeriod', this.currentReportingPeriodId)
          .then((r) => {
            if (!r.ok) {
              r.text().then(errorMessage => {
                this.errorMessage = errorMessage
              })
            }
            this.certifying = false
          })
      }
    }
  }
}
</script>

<style scoped>
.reporting-periods {
  width: 90%;
  margin: 0 auto;
}
table {
  width: 100%;
  margin: 50px auto;
}
h2,
td {
  text-align: left;
}
</style>
