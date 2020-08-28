<template>
  <div class="upload">
    <h1>UploadFile</h1>

    <div v-if="uploadConfiguration">
      <h2>{{ uploadConfiguration.name }}</h2>
      <form method="post" encType="multipart/form-data" @submit="uploadFile">
        <div class="form-group">
          <label>Type of Upload</label>
          <select class="form-control" v-model="id">
            <option
              :key="template.id"
              v-for="template in templates"
              :value="template.id"
              >{{ template.name }}</option
            >
          </select>
        </div>
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
    </div>
  </div>
</template>

<script>
import _ from "lodash";
export default {
  name: "NewUpload",
  data: function() {
    const id = parseInt(this.$route.params.id);
    return {
      id,
      message: null
    };
  },
  computed: {
    templates: function() {
      return this.$store.getters.templates;
    },
    uploadConfiguration: function() {
      return _.find(
        this.$store.state.configuration.templates,
        u => u.id === this.id
      );
    }
  },
  methods: {
    uploadFile: async function(e) {
      e.preventDefault();
      const file = _.get(this.$refs, "files.files[0]");
      if (file) {
        this.message = null;
        let formData = new FormData();
        formData.append("configuration_id", this.id);
        formData.append("spreadsheet", file);
        try {
          const r = await this.$store.dispatch("createUpload", formData);
          this.$router.push({ path: `/imports/${r.upload.id}` });
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
