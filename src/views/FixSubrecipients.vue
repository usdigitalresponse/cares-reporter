<template>
<div class="uploads">
  <table class="table table-striped">
    <thead>
      <tr>
        <th>ID</th>
        <th>Filename</th>
        <th>Created At</th>
        <th>Created By</th>
        <th>Subrecipient Count</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr :key="i" v-for="(upload, i) in uploads">
        <td>{{upload.id}}</td>
        <td>{{upload.filename}}</td>
        <td>{{upload.created_at}}</td>
        <td>{{upload.created_by}}</td>
        <td>{{upload.subrecipients.length}}</td>
        <th><a href="#" @click.prevent="fix(upload.id)">Fix</a></th>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import _ from "lodash";
export default {
  name: "UploadFix",
  data() {
    return {};
  },
  computed: {
    uploads() {
      return _.map(this.$store.state.uploads, u => {
        return {
          ...u,
          subrecipients: _.filter(this.$store.state.documents, d => {
            return d.upload_id == u.id && d.type == "subrecipient";
          })
        };
      });
    }
  },
  methods: {
    fix(id) {
      fetch(`/api/fix-subrecipients/${id}`, 
        { method: "POST", credentials: "include" });
    }
  }
};
</script>

<style scoped>
.uploads {
  width: 90%;
  margin: 0 auto;
}
</style>
