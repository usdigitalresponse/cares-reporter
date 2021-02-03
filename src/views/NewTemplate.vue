<template>
  <div class="upload">
    <h1>Upload Template</h1>
    <form
      method="post"
      encType="multipart/form-data"
      ref="form"
      @submit.prevent="uploadFile"
    >
      <div class="form-group">
        <input
          class="form-control"
          type="file"
          id="template"
          name="template"
          @change="changeFiles"
          ref="files"
        />
      </div>
      <div class="form-group">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="uploadDisabled"
          @click.prevent="uploadFile"
        >
          {{ uploadButtonLabel }}
        </button>
        <a class="ml-3" href="#" @click="cancelUpload">Cancel</a>
      </div>
    </form>
    <div class="mt-3 alert alert-danger" v-if="message">{{ message }}</div>
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'NewTemplate',
  data: function () {
    return {
      reportingPeriodId: this.$route.params.id,
      message: null,
      files: null,
      uploading: false,
      uploadedFilename: null
    }
  },
  computed: {
    uploadButtonLabel: function () {
      return this.uploading ? 'Uploading...' : 'Upload'
    },
    uploadDisabled: function () {
      return this.files === null || this.uploading
    }
  },
  methods: {
    changeFiles () {
      this.files = this.$refs.files.files
    },
    uploadFile: async function () {
      const file = _.get(this.$refs, 'files.files[0]')
      const form = _.get(this.$refs, 'form')
      if (file) {
        this.uploadedFilename = file.name
        this.uploading = true
        this.message = null
        this.errors = []
        const formData = new FormData()
        formData.append('template', file)
        try {
          const params = {
            formData,
            reportingPeriodId: this.reportingPeriodId
          }
          const r = await this.$store.dispatch('createTemplate', params)
          this.uploading = false
          form.reset()
          if (r.errorMessage) {
            this.message = r.errorMessage
          } else {
            this.$router.push({ path: '/reporting_periods' })
          }
        } catch (e) {
          this.message = e.errorMessage
          this.uploading = false
        }
      }
    },
    cancelUpload (e) {
      e.preventDefault()
      this.$router.push({ path: '/reporting_periods' })
    }
  }
}
</script>

<style scoped>
.upload {
  width: 90%;
  margin: 0 auto;
}
</style>
