<template>
  <div class="upload">
    <h1>Upload File</h1>
    <div v-if="uploadConfiguration">
      <form method="post" encType="multipart/form-data" @submit="uploadFile">
        <div class="form-group">
          <input
            class="form-control"
            type="file"
            id="spreadsheet"
            name="spreadsheet"
            ref="files"
          />
        </div>
        <div class="form-group">
          <button class="btn btn-primary" type="submit" @click="uploadFile">
            Upload
          </button>
          <a class="ml-5" href="#" @click="cancelUpload">Cancel</a>
        </div>
      </form>
      <div class="mt-3 alert alert-danger" v-if="message">{{ message }}</div>
      <div v-if="errors.length > 0">
        <h4>Validation Errors</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Tab</th>
              <th>Row</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="n" class="table-danger" v-for="(error, n) in errors">
              <td>{{ titleize(error.tab) }}</td>
              <td>{{ error.row }}</td>
              <td>{{ error.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { titleize } from "../helpers/form-helpers";
import _ from "lodash";
export default {
  name: "NewUpload",
  data: function() {
    return {
      message: null,
      errors: []
    };
  },
  computed: {
    uploadConfiguration: function() {
      return this.$store.getters.template;
    }
  },
  methods: {
    titleize,
    uploadFile: async function(e) {
      e.preventDefault();
      const file = _.get(this.$refs, "files.files[0]");
      if (file) {
        this.message = null;
        this.errors = [];
        let formData = new FormData();
        formData.append("spreadsheet", file);
        try {
          const r = await this.$store.dispatch("createUpload", formData);
          if ((r.errors || []).length > 0) {
            this.errors = r.errors;
          } else {
            this.$router.push({ path: `/` });
          }
        } catch (e) {
          this.message = e.message;
        }
      }
    },
    cancelUpload(e) {
      e.preventDefault();
      this.$router.push({ path: "/" });
    }
  }
};
</script>

<style scoped>
.upload {
  width: 90%;
  margin: 0 auto;
}
</style>
