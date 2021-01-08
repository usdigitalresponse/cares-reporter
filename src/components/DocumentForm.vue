<template>
  <div>
    <form class="form" @submit="doSubmit">
      <FormGroups
        :columns="columns"
        :record="editorRecord"
        :foreignKeyValues="foreignKeyValues"
      />
      <div class="form-group">
        <button
          class="btn btn-primary"
          @click="doSubmit"
          :disabled="saving"
          type="submit"
        >
          {{ buttonLabel }}
        </button>
        <a class="ml-5" href="#" @click="cancelEditDocument">Cancel</a>
      </div>
    </form>
    <div class="mt-3 alert alert-danger" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div
      :key="n"
      v-for="(message, n) in validationMessages"
      class="mt-3 alert alert-danger"
    >
      {{ message }}
    </div>
  </div>
</template>

<script>
import FormGroups from './FormGroups.vue'
import {
  titleize,
  singular,
  validate,
  columnTitle
} from '../helpers/form-helpers'
import _ from 'lodash'
export default {
  name: 'DocumentForm',
  props: {
    type: String,
    columns: Array,
    record: Object,
    id: Number,
    isNew: Boolean,
    onSave: Function,
    onCancel: Function,
    onDone: Function,
    foreignKeyValues: Function,
    errorMessage: String
  },
  components: {
    FormGroups
  },
  data: function () {
    const buttonLabel = `${this.isNew ? 'Create' : 'Update'} ${titleize(
      singular(this.type)
    )}`
    const editorRecord = {
      ...this.record,
      settings: JSON.stringify(this.record.settings, null, '  ')
    }
    return {
      buttonLabel,
      validationMessages: [],
      saving: false,
      editorRecord
    }
  },
  watch: {
    record: function (r) {
      this.editorRecord = r
    }
  },
  methods: {
    columnTitle,
    titleize,
    validate,
    doSubmit: async function (e) {
      e.preventDefault()
      this.saving = true
      this.buttonLabel = `${this.isNew ? 'Creating' : 'Updating'} ${titleize(
        singular(this.type)
      )}...`
      return Promise.resolve(this.validate(this.columns, this.editorRecord))
        .then(({ validatedRecord, messages }) => {
          this.validationMessages = messages
          if (_.isEmpty(messages)) {
            return this.saveRecord(validatedRecord)
          } else {
            return false
          }
        })
        .finally(() => {
          this.buttonLabel = `${this.isNew ? 'Create' : 'Update'} ${titleize(
            singular(this.type)
          )}`
          this.saving = false
        })
    },
    saveRecord (record) {
      if (_.isFunction(this.onSave)) {
        return Promise.resolve(this.onSave(record)).finally(
          () => (this.saving = false)
        )
      }
      return Promise.resolve(null)
    },
    cancelEditDocument (e) {
      e.preventDefault()
      if (_.isFunction(this.onCancel)) {
        this.onCancel()
      }
    }
  }
}
</script>
