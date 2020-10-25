<template>
  <div class="home">
    <div class="row" v-if="currentReportingPeriod">
      <div class="col-12">
        <h3>
          Reporting Period:
          {{ dateFormat(currentReportingPeriod.start_date) }} to
          {{ dateFormat(currentReportingPeriod.end_date) }}
        </h3>
      </div>
    </div>
    <div class="row buttons mt-5">
      <div class="col-12">
        <button class="btn btn-primary" @click="startUpload">
          Upload Spreadsheet
        </button>
      </div>
    </div>
    <h3 class="mt-3">Upload History</h3>
    <UploadHistory :uploads="uploads" />
  </div>
</template>

<script>
import UploadHistory from "../components/UploadHistory";
import moment from "moment";
import _ from "lodash";
export default {
  name: "Home",
  components: {
    UploadHistory
  },
  computed: {
    currentReportingPeriod: function() {
      return this.$store.getters.currentReportingPeriod;
    },
    template: function() {
      return _.find(this.$store.state.configuration.templates, t =>
        t.name.match(/agency/i)
      );
    },
    uploads: function() {
      return this.$store.state.uploads;
    }
  },
  methods: {
    startUpload(e) {
      e.preventDefault();
      this.$router.push({ path: "/new_upload" });
    },
    dateFormat: function(d) {
      return moment(d)
        .utc()
        .format("MM-DD-YYYY");
    }
  }
};
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
</style>
