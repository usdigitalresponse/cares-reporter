<template>
  <div class="home">
    <h2>Dashboard</h2>
    <div>
      <div class="row">
        <div v-if="template" class="col-4">
          <h3 class="mt-3">Downloads</h3>
          <div>
            <a :href="downloadUrl()" class="btn btn-primary"
              >Download Treasury Report</a
            >
          </div>
        </div>
        <div class="mt-3 col-4" v-if="currentReportingPeriod">
          <h3>Current Reporting Period</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ dateFormat(currentReportingPeriod.start_date) }}</td>
                <td>{{ dateFormat(currentReportingPeriod.end_date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-3 col-4">
          <h3>Record Summary</h3>
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr :key="table.name" v-for="table in tables">
                <td>
                  <router-link :to="dataUrl(table)">{{
                    titleize(table.name)
                  }}</router-link>
                </td>
                <td>{{ documentCount(table.name) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <h3 class="mt-3">Upload History</h3>
      <UploadHistory :uploads="uploads" />
    </div>
  </div>
</template>

<script>
import UploadHistory from "../components/UploadHistory";
import { titleize } from "../helpers/form-helpers";
import moment from "moment";
import _ from "lodash";
export default {
  name: "GrantsOfficeHome",
  components: {
    UploadHistory
  },
  data: function() {
    return {
      currentReportingPeriod: this.$store.getters.currentReportingPeriod
    };
  },
  computed: {
    template: function() {
      return _.find(this.$store.state.configuration.templates, t =>
        t.name.match(/agency/i)
      );
    },
    tables: function() {
      return this.$store.state.configuration.tables;
    },
    uploads: function() {
      return this.$store.state.uploads;
    },
    groups: function() {
      return this.$store.getters.documentGroups;
    }
  },
  watch: {
    "$store.state.applicationSettings": function() {
      this.currentReportingPeriod = this.$store.getters.currentReportingPeriod;
    },
    "$store.state.reportingPeriods": function() {
      this.currentReportingPeriod = this.$store.getters.currentReportingPeriod;
    }
  },
  methods: {
    titleize,
    downloadUrl() {
      return `/api/exports/${this.template.id}`;
    },
    documentCount(tableName) {
      const records = this.groups[tableName];
      return _.filter(records, r => r.type === tableName).length;
    },
    dataUrl(table) {
      return `/documents/${table.name}`;
    },
    uploadUrl(upload) {
      return `/uploads/${upload.id}`;
    },
    templateName(t) {
      const template = this.$store.getters.template(t.configuration_id);
      return template ? template.name : "";
    },
    fromNow: function(t) {
      return moment(t).fromNow();
    },
    dateFormat: function(d) {
      return moment(d).format("MM-DD-YYYY");
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
</style>
