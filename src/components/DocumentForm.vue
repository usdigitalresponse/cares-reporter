<template>
  <div>
    <form class="form" @submit="doSubmit">
      <FormGroups :columns="columns" :record="record" />
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
    onCancel: Function
  },
  components: {
    FormGroups
  },
  data: function() {
    const buttonLabel = `${this.isNew ? "Create" : "Update"} ${titleize(
      singular(this.type)
    )}`;
    return {
      buttonLabel,
      validationMessages: [],
      saving: false
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
      this.validate(this.columns, this.record)
        .then(messages => {
          this.validationMessages = messages;
          if (_.isEmpty(messages)) {
            return this.saveRecord();
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
    saveRecord() {
      const path = this.nextPath();
      if (_.isFunction(this.onSave)) {
        return this.onSave(this.record).then(() => this.$router.push({ path }));
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
