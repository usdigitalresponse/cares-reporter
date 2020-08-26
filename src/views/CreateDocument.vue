<template>
  <div class="document">
    <h1 class="mt-3">{{ title }}</h1>
    <DocumentForm
      :type="type"
      :columns="columns"
      :record="record"
      :isNew="true"
      :onSave="createDocument"
      :onCancel="cancelCreateDocument"
      :foreignKeyValues="foreignKeyValues"
    />
  </div>
</template>

<script>
import DocumentForm from "../components/DocumentForm.vue";
import { titleize, singular } from "../helpers/form-helpers";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
export default {
  name: "CreateDocument",
  props: {},
  components: {
    DocumentForm
  },
  data: function() {
    const type = this.$route.params.type;
    const table = this.getTable(type);
    const columns = table ? table.columns.filter(c => !c.generated) : [];
    const title = titleize(type);
    const buttonLabel = `Save ${titleize(singular(type))}`;
    const record = this.initializeRecord(columns, this.$route.query);
    return {
      type,
      title,
      columns,
      buttonLabel,
      validationMessages: [],
      record,
      saving: false
    };
  },
  watch: {
    "$store.state.configuration": function() {
      const table = this.getTable(this.type);
      this.table = table;
      this.columns = table ? table.columns.filter(c => !c.generated) : [];
    }
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    nextPath() {
      const query = this.$route.query;
      // if we got here from parent document, go back there
      if (query.back && query.id) {
        return `/documents/${query.back}/${query.id}`;
      }
      // otherwise, just go to the list of documents of this type
      return `/documents/${this.type}`;
    },
    initializeRecord(columns, query) {
      return _.reduce(
        columns,
        (acc, column) => {
          if (query[column.name]) {
            acc[column.name] = query[column.name];
          } else if (column.default) {
            acc[column.name] = column.default;
          } else if (column.uuid) {
            acc[column.name] = uuidv4();
          } else {
            acc[column.name] = "";
          }
          return acc;
        },
        {}
      );
    },
    foreignKeyValues(column) {
      return this.$store.getters.foreignKeyValues(column);
    },
    createDocument(record) {
      return this.$store.dispatch("createDocument", {
        type: this.type,
        content: record
      });
    },
    cancelCreateDocument() {
      this.$router.push({ path: this.nextPath() });
    },
    getTable: function(name) {
      return _.find(this.$store.getters.tables, t => t.name === name);
    }
  }
};
</script>

<style scoped>
.document {
  width: 90%;
  margin: 0 auto;
}
</style>
