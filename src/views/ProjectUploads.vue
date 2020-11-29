<template>
  <div class="project-uploads">
    <div class="row mt-3">
      <div class="col-12">
        <h3>Upload History: {{project.code}} {{project.name}}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <UploadHistory :uploads="uploads" />
      </div>
    </div>
  </div>
</template>

<script>
import UploadHistory from "../components/UploadHistory";
import _ from "lodash";
export default {
  components: {
    UploadHistory
  },
  data() {
    const id = parseInt(this.$route.params.id);
    return {
      id
    };
  },
  computed: {
    project() {
      return _.find(this.$store.state.projects, { id: this.id }) || {};
    },
    uploads() {
      return _.filter(this.$store.state.uploads, u => u.project_id == this.id);
    }
  }
};
</script>

<style scoped>
.project-uploads {
  width: 90%;
  margin: 0 auto;
}
</style>
