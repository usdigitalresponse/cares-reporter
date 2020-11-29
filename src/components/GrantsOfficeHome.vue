<template>
  <div class="home">
    <div>
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
        <div class="col-4">
          <a :href="downloadUrl()" class="btn btn-primary"
            >Download Treasury Report</a
          >
        </div>
        <div class="col-4">
          <a href="/new_upload" class="btn btn-secondary"
            >Upload Agency Spreadsheet</a
          >
        </div>
        <div class="col-4">
          <a :href="downloadTemplateUrl" class="btn btn-secondary" download
            >Download Empty Template</a
          >
        </div>
      </div>
      <div class="row mt-5">
        <div class="col-12">
          <h3 class="mt-3">Record Summary</h3>
        </div>
        <table class="table table-borderless">
          <thead>
            <tr>
              <th :key="table.name" v-for="table in tables">
                {{ titleize(table.name) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :key="table.name" v-for="table in tables" class="count">
                <span v-if="documentCount(table.name) > 0">
                  <router-link :to="dataUrl(table)">{{
                    documentCount(table.name)
                  }}</router-link>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row mt-3">
        <div class="col-12">
          <h3>Upload History</h3>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <UploadHistory :uploads="uploads" :views="uploadHistoryViews" />
        </div>
      </div>
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
  data() {
    return {
      uploadHistoryViews:  [
        {
          name: "Group by Agency",
          groupBy: "agency"
        }
      ]
    };
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
    tables: function() {
      return this.$store.state.configuration.tables;
    },
    uploads: function() {
      return this.$store.state.uploads;
    },
    groups: function() {
      return this.$store.getters.documentGroups;
    },
    downloadTemplateUrl() {
      const template = this.$store.getters.reportingTemplate;
      return `/templates/${encodeURIComponent(template)}`;
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
      return `/api/exports`;
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
    fromNow: function(t) {
      return moment(t).fromNow();
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
.count {
  text-align: center;
  font-size: 30px;
  font-weight: bold;
}
.buttons {
  text-align: center;
}
</style>
