<template>
  <div class="upload">
    <div v-if="upload">
      <h1>Upload</h1>
      <h4>{{ upload.filename }}</h4>
      <div>
        Uploaded by <b>{{ upload.created_by }}</b> at
        {{ upload.created_at }} ({{ fromNow(upload) }})
      </div>
      <table class="mt-3 table table-striped">
        <tbody>
          <tr :key="row.id" v-for="row in rows">
            <td>{{ row.id }}</td>
            <td>{{ preview(row) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      Loading...
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import _ from 'lodash'
export default {
  name: 'Upload',
  data: function () {
    return {
      id: this.$route.params.id
    }
  },
  computed: {
    upload: function () {
      return _.find(this.$store.state.uploads, d => d.id === this.id)
    },
    rows: function () {
      return _.filter(this.$store.state.documents, d => d.upload_id === this.id)
    }
  },
  methods: {
    fromNow: function (upload) {
      return moment(upload.created_at).fromNow()
    },
    preview: function (o) {
      const s = JSON.stringify(o, null, '  ')
      const maxLength = 120
      if (s.length < maxLength) {
        return s
      }
      return `${s.slice(0, maxLength)}...`
    }
  }
}
</script>

<style scoped>
.upload {
  margin: 0 auto;
  width: 90%;
}
</style>
