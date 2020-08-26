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
import FormGroups from "./FormGroups.vue";
import {
  titleize,
  singular,
  validate,
  columnTitle
} from "../helpers/form-helpers";
import _ from "lodash";
export default {
  name: "DocumentForm",
  props: {
    type: String,
    columns: Array,
    record: Object,
    id: Number,
    isNew: Boolean,
    onSave: Function,
    onCancel: Function,
    onDone: Function,
    foreignKeyValues: Function
  },
  components: {
    FormGroups
  },
  data: function() {
    const buttonLabel = `${this.isNew ? "Create" : "Update"} ${titleize(
      singular(this.type)
    )}`;
    const editorRecord = {
      ...this.record,
      settings: JSON.stringify(this.record.settings, null, "  ")
    };
    return {
      buttonLabel,
      validationMessages: [],
      saving: false,
      editorRecord
    };
  },
  watch: {},
  methods: {
    columnTitle,
    titleize,
    validate,
    doSubmit(e) {
      e.preventDefault();
      this.saving = true;
      this.buttonLabel = `${this.isNew ? "Creating" : "Updating"} ${titleize(
        singular(this.type)
      )}...`;
      Promise.resolve(this.validate(this.columns, this.editorRecord))
        .then(([validatedRecord, messages]) => {
          this.validationMessages = messages;
          if (_.isEmpty(messages)) {
            return this.saveRecord(validatedRecord);
          } else {
            return false;
          }
          // FIXME should there be positive confirmation that a record was written?
        })
        .then(() => {
          this.buttonLabel = `${this.isNew ? "Create" : "Update"} ${titleize(
            singular(this.type)
          )}`;
          this.saving = false;
        });
    },
    saveRecord(record) {
      if (_.isFunction(this.onSave)) {
        return this.onSave(record).then(() => {
          if (_.isFunction(this.onDone)) {
            return this.onDone();
          } else {
            this.$router.push({ path: this.nextPath() });
          }
        });
      }
    },
    nextPath() {
      const query = this.$route.query;
      // if we got here from parent document, go back there
      if (query.back && query.id) {
        return `/documents/${query.back}/${query.id}`;
      }
      // otherwise, just go to the list of documents of this type
      return `/documents/${this.type}`;
    },
    cancelEditDocument(e) {
      e.preventDefault();
      if (_.isFunction(this.onCancel)) {
        this.onCancel();
      }
    }
  }
};
</script>
