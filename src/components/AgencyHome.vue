<template>
  <div class="home">
    <div class="row buttons mt-5">
      <div class="col-6" v-show="viewingCurrentPeriod">
        <button class="btn btn-primary" @click.prevent="startUpload">
          Upload Spreadsheet
        </button>
      </div>
      <div class="col-6" v-show="viewingCurrentPeriod">
        <a :href="downloadTemplateUrl" class="btn btn-secondary" download
          >Download Empty Template</a
        >
      </div>

      <div class="closed" v-show="!viewingCurrentPeriod">
        This reporting period is closed.
      </div>
    </div>
    <h3 class="mt-3">Upload History</h3>
    <UploadHistory :uploads="uploads" :views="uploadHistoryViews" />
  </div>
</template>

<script>
import UploadHistory from '../components/UploadHistory'
import moment from 'moment'
import _ from 'lodash'
export default {
  name: 'Home',
  components: {
    UploadHistory
  },
  data () {
    return {
      uploadHistoryViews: [
        {
          name: 'Group by Agency',
          groupBy: 'agency'
        }
      ]
    }
  },
  computed: {
    viewingCurrentPeriod () {
      return this.$store.getters.viewPeriodIsCurrent
    },
    currentReportingPeriod: function () {
      return this.$store.getters.currentReportingPeriod
    },
    template: function () {
      return _.find(this.$store.state.configuration.templates, t =>
        t.name.match(/agency/i)
      )
    },
    uploads: function () {
      return this.$store.state.uploads
    },
    downloadTemplateUrl () {
      const template = this.$store.getters.reportingTemplate
      return `/templates/${encodeURIComponent(template)}`
    }
  },
  methods: {
    startUpload () {
      if (this.viewingCurrentPeriod) {
        this.$router.push({ path: '/new_upload' })
      }
    },
    dateFormat: function (d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY')
    }
  }
}
</script>

<style scoped>
.home {
  width: 90%;
  margin: 0 auto;
}
h2,
td,
pre {
  text-align: left;
}
.buttons {
  text-align: center;
}
.closed {
    padding: .5rem 0;
}
</style>
