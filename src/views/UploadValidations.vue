<template>
<div class="validation-messages">
  <div v-if="uploadId">
    <div v-if="validating">
      Validating...
    </div>
    <div v-else>
      <div v-if="errors.length > 0">
        <h4>Validation Errors: {{ upload.filename }}</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Error</th>
              <th>Tab</th>
              <th>Row</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="n" class="table-danger" v-for="(error, n) in errors">
              <td>{{ error.message }}</td>
              <td>{{ titleize(error.tab) }}</td>
              <td>{{ error.row }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <h4>No Validation Errors: {{ upload.filename }}</h4>
      </div>
    </div>
  </div>
  <div v-else>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Filename</th>
          <th>Created At</th>
          <th>Created By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr :key="i" v-for="(upload, i) in uploads">
          <td><router-link :to="uploadUrl(upload)">{{ upload.id }}</router-link></td>
          <td>{{upload.filename}}</td>
          <td>{{upload.created_at}}</td>
          <td>{{upload.created_by}}</td>
          <td><DownloadIcon :row="upload" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script>
import DownloadIcon from "../components/DownloadIcon";
import _ from "lodash";
import { titleize } from "../helpers/form-helpers";
export default {
  name: "UploadValidations",
  components: {
    DownloadIcon
  },
  data: function() {
    const uploadId = parseInt(this.$route.params.id) || 0;
    return {
      uploadId,
      validating: false,
      success: true,
      errors: []
    };
  },
  watch: {
    "$route.params.id": function(id) {
      this.uploadId = parseInt(id) || 0;
      this.revalidate();
    }
  },
  computed: {
    upload() {
      if (this.uploadId) {
        return _.find(this.$store.state.uploads, { id: this.uploadId });
      }
      return null;
    },
    uploads() {
      return _.chain(this.$store.state.uploads)
        .groupBy(u => u.filename.replace(/-v.*xlsx$$/,""))
        .map(v => _.last(_.sortBy(v, "created_at")))
        .sortBy("created_at")
        .reverse()
        .value();
    }
  },
  mounted() {
    if (this.uploadId) {
      this.revalidate();
    }
  },
  methods: {
    revalidate: function() {
      this.validating = true;
      this.success = false;
      this.errors = [];
      return fetch(`/api/validations/${this.uploadId}`, 
        { method: "POST", credentials: "include" })
        .then(r => r.json())
        .then(m => {
          this.success = m.success;
          this.errors = m.errors || [];
          this.validating = false;
        });
    },
    uploadUrl: function(upload) {
      return `/upload-validations/${upload.id}`;
    },
    titleize
  }
};
</script>

<style scoped>
.validation-messages {
  width: 90%;
  margin: 0 auto;
}
</style>
