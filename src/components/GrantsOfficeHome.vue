<template>
  <div class="home">
    <h1>Dashboard</h1>
    <div>
      <div v-if="template">
        <h2 class="mt-3">Download</h2>
        <div>
          <a :href="downloadUrl()" class="btn btn-primary"
            >Download Treasury Report</a
          >
        </div>
      </div>
      <h2 class="mt-3">Record Summary</h2>
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
      <h2 class="mt-3">Upload History</h2>
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
