<template>
  <DataTable v-if="uploads" :table="table" :rows="rows" :user="user" />
</template>

<script>
import DataTable from "../components/DataTable";
import moment from "moment";
export default {
  name: "UploadHistory",
  props: {
    uploads: Array
  },
  components: {
    DataTable
  },
  data: function() {
    const user = this.$store.state.user;
    return {
      user,
      table: {
        views: [
          {
            name: "Group by Agency",
            groupBy: "agency"
          }
        ],
        columns: [
          { name: "filename" },
          { name: "agency" },
          { name: "created_by" },
          { name: "uploaded" }
        ]
      }
    };
  },
  computed: {
    rows: function() {
      return this.uploads.map(u => {
        return {
          ...u,
          agency: this.agencyName(u.agency_id),
          uploaded: this.fromNow(u.created_at)
        };
      });
    }
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
