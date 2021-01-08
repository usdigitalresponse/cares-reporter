<template>
  <div class="import">
    <h1 class="mt-3">Import {{ upload ? upload.filename : "" }}</h1>
    <div class="mt-3">
      <div v-if="loading">
        Loading...
      </div>
      <div v-else>
        <UploadData :id="id" :data="data" :upload="upload" />
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import UploadData from '../components/UploadData.vue'
import { get } from '../store'
export default {
  name: 'ImportManager',
  props: {},
  components: {
    UploadData
  },
  data: function () {
    const id = this.$route.params.id
    const upload = _.find(this.$store.state.uploads, u => u.id === id)
    return {
      id,
      upload,
      data: {},
      loading: true
    }
  },
  mounted: function () {
    this.loading = true
    get(`/api/uploads/${this.id}`)
      .then(r => r.json())
      .then(r => {
        const data = r.data
        this.loading = false
        this.data = data
      })
  },
  watch: {
    '$store.state.uploads': function (uploads) {
      this.upload = _.find(uploads, u => u.id === this.id)
    }
  },
  methods: {}
}
</script>

<style scoped>
.import {
  width: 90%;
  margin: 0 auto;
}
</style>
