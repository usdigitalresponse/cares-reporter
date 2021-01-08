<template>
  <DataTable v-if="hasUploads" :table="table" :rows="rows" :user="user" />
  <span v-else>No uploads</span>
</template>

<script>
import DataTable from '../components/DataTable'
import DownloadIcon from './DownloadIcon'
import moment from 'moment'
export default {
  name: 'UploadHistory',
  props: {
    uploads: Array,
    views: Array
  },
  components: {
    DataTable
  },
  data: function () {
    const user = this.$store.state.user
    return {
      user,
      table: {
        views: this.views,
        columns: [
          { name: 'filename' },
          { name: 'agency' },
          { name: 'created_by' },
          { name: 'uploaded' },
          { component: DownloadIcon }
        ]
      }
    }
  },
  computed: {
    rows: function () {
      return this.uploads.map(u => {
        return {
          ...u,
          agency: this.agencyName(u.agency_id),
          uploaded: this.fromNow(u.created_at)
        }
      })
    },
    hasUploads () {
      return this.uploads && this.uploads.length > 0
    }
  },
  methods: {
    uploadUrl (upload) {
      return `/uploads/${upload.id}`
    },
    fromNow: function (t) {
      return moment(t).fromNow()
    },
    agencyName (id) {
      return this.$store.getters.agencyName(id)
    }
  }
}
</script>
