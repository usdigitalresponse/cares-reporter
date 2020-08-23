<template>
  <div class="home">
    <h1>Home</h1>
    <div>
      <h2 class="mt-3">Records</h2>
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
      <h2 class="mt-3">Templates</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr :key="template.id" v-for="template in templates">
            <td>{{ template.id }}</td>
            <td>{{ template.name }}</td>
            <td>
              <router-link :to="newUploadUrl(template)">Upload</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <h2 class="mt-3">Uploads</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Id</th>
            <th>Filename</th>
            <th>Template</th>
            <th>Uploaded By</th>
            <th>Uploaded At</th>
            <th>From Now</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="upload.id" v-for="upload in uploads">
            <td>
              <router-link :to="uploadUrl(upload)">{{ upload.id }}</router-link>
            </td>
            <td>{{ upload.filename }}</td>
            <td>{{ templateName(upload) }}</td>
            <td>{{ upload.created_by }}</td>
            <td>{{ upload.created_at }}</td>
            <td>{{ fromNow(upload.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { titleize } from "../helpers/form-helpers";
import moment from "moment";
import _ from "lodash";
export default {
  name: "Home",
  components: {},
  computed: {
    tables: function() {
      return this.$store.state.configuration.tables;
    },
    templates: function() {
      return this.$store.state.configuration.templates;
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
    documentCount(tableName) {
      const records = this.groups[tableName];
      return _.filter(records, r => r.type === tableName).length;
    },
    dataUrl(table) {
      return `/documents/${table.name}`;
    },
    newUploadUrl(template) {
      return `/new_upload/${template.id}`;
    },
    uploadUrl(upload) {
      return `/uploads/${upload.id}`;
    },
    importUrl(upload) {
      return `/imports/${upload.id}`;
    },
    templateName() {
      return "Agency Template";
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
