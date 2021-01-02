
<template>
  <div class="upload">
    <h1>Upload File</h1>
    <div v-if="uploadConfiguration">
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
            id="spreadsheet"
            name="spreadsheet"
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
      <div v-if="errors.length > 0">
        <h4>Validation Errors: {{ uploadedFilename }}</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Error</th>
              <th>Tab</th>
              <th>Row</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="n" class="table-danger" v-for="(error, n) in errors">
              <td>{{ error.message }}</td>
              <td>{{ titleize(error.tab) }}</td>
              <td>{{ error.row }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { titleize } from '../helpers/form-helpers'
import _ from 'lodash'
export default {
  name: 'NewUpload',
  data: function () {
    return {
      message: null,
      errors: [],
      files: null,
      uploading: false,
      uploadedFilename: null
    }
  },
  computed: {
    uploadConfiguration: function () {
      return this.$store.getters.template
    },
    uploadButtonLabel: function () {
      return this.uploading ? 'Uploading...' : 'Upload'
    },
    uploadDisabled: function () {
      return this.files === null || this.uploading
    }
  },
  methods: {
    titleize,
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
        let formData = new FormData()
        formData.append('spreadsheet', file)
        try {
          const r = await this.$store.dispatch('createUpload', formData)
          this.uploading = false
          form.reset()
          if ((r.errors || []).length > 0) {
            this.errors = r.errors
          } else {
            this.$store
              .dispatch('refreshDocuments')
              .then(() => this.$router.push({ path: `/` }))
          }
        } catch (e) {
          this.message = e.message
          this.uploading = false
        }
      }
    },
    cancelUpload (e) {
      e.preventDefault()
      this.$router.push({ path: '/' })
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
