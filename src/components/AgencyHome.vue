<template>
  <div class="home">
    <h1>Dashboard</h1>
    <div>
      <h2 class="mt-3">Upload</h2>
      <div>
        <button class="btn btn-primary" @click="startUpload">
          Upload Spreadsheet
        </button>
      </div>
    </div>
    <h2 class="mt-3">Upload History</h2>
    <UploadHistory :uploads="uploads" />
  </div>
</template>

<script>
import UploadHistory from "../components/UploadHistory";
import _ from "lodash";
export default {
  name: "Home",
  components: {
    UploadHistory
  },
  computed: {
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
