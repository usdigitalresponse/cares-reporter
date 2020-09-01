<template>
  <table class="table table-striped" id="upload-history">
    <thead>
      <tr>
        <th>Id</th>
        <th>Filename</th>
        <th>Uploaded By</th>
        <th>Agency</th>
        <th>Uploaded</th>
      </tr>
    </thead>
    <tbody>
      <tr :key="upload.id" v-for="upload in uploads">
        <td>
          <router-link :to="uploadUrl(upload)">{{ upload.id }}</router-link>
        </td>
        <td>{{ upload.filename }}</td>
        <td>{{ upload.created_by }}</td>
        <td>{{ agencyName(upload.agency_id) }}</td>
        <td>{{ fromNow(upload.created_at) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import moment from "moment";
export default {
  name: "UploadHistory",
  props: {
    uploads: Array
  },
  methods: {
    uploadUrl(upload) {
      return `/uploads/${upload.id}`;
    },
    fromNow: function(t) {
      return moment(t).fromNow();
    },
    agencyName(id) {
      return this.$store.getters.agencyName(id);
    }
  }
};
</script>
