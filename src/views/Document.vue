<template>
  <div class="document">
    <h1 class="mt-3">{{ title }}</h1>
    <div v-if="editing">
      <DocumentForm
        :name="type"
        :columns="columns"
        :record="record"
        :isNew="false"
        :onSave="updateDocument"
        :onCancel="cancelEditDocument"
      />
    </div>
    <div v-else>
      <table class="mt-3 table">
        <tbody>
          <tr :key="m" v-for="(column, m) in columns">
            <td style="width: 20%">
              <b>{{ columnTitle(column) }}</b>
            </td>
            <td style="width: 80%">
              <span v-if="column.foreignKey">
                <a :href="lookupLink(column, record)">{{
                  lookup(column, record)
                }}</a>
              </span>
              <span v-else>{{ record[column.name] }} </span>
            </td>
          </tr>
        </tbody>
      </table>
      <a
        href="#"
        @click="editDocument"
        class="btn btn-primary"
        v-if="canWriteToTable(user, type)"
        >Edit</a
      >
      <div :key="n" v-for="(child, n) in childTables()">
        <ChildDocuments :child="child" :parent="type" :id="id" />
      </div>
    </div>
  </div>
</template>

<script>
import ChildDocuments from "../components/ChildDocuments";
import DocumentForm from "../components/DocumentForm.vue";
import { titleize } from "../helpers/form-helpers";
import _ from "lodash";
const component = {
  name: "Document",
  components: {
    ChildDocuments,
    DocumentForm
  },
  data: function() {
    const type = this.$route.params.type;
    const id = parseInt(this.$route.params.id);
    const title = this.pageTitle(type, id);
    const table = this.getTable(type);
    const columns = this.getColumns(table);
    const record = this.getRecord(type, id);
    return {
      type,
      id,
      title,
      table,
      columns,
      record,
      editing: false
    };
  },
  computed: {
    user: function() {
      return this.$store.state.user;
    }
  },
  watch: {
    "$route.params.id": function(id) {
      id = parseInt(id);
      this.id = id;
      this.reload(this.type, this.id);
    },
    "$route.params.type": function(type) {
      this.type = type;
      this.reload(this.type, this.id);
    },
    "$store.state.documents": function() {
      this.reload(this.type, this.id);
    },
    "$store.state.configuration": function() {
      this.reload(this.type, this.id);
    }
  },
  methods: {
    canWriteToTable: function() {
      return false; // TODO
    },
    pageTitle(type, id) {
      return `${titleize(type)} ${id}`;
    },
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    reload: function(type, id) {
      if (type && id) {
        this.record = this.getRecord(type, id);
        const table = this.getTable(type);
        this.table = table;
        this.columns = this.getColumns(table);
        this.title = this.pageTitle(type, id);
      }
    },
    getTable(type) {
      const table = this.$store.getters.table(type);
      return table ? table.content : null;
    },
    getColumns(table) {
      return table ? table.columns : [];
    },
    getRecord(type, id) {
      const record = _.find(
        this.$store.state.documents,
        e => e.type == type && e.id == id
      );
      return record ? record.content : {};
    },
    childTables() {
      return _.chain(this.table)
        .get("relations", [])
        .map(t => t.hasMany)
        .compact()
        .value();
    },
    lookup(column, row) {
      const id = parseInt(row[column.name]);
      const related = _.find(this.$store.state.documents, r => {
        return r.type == column.foreignKey.table && r.id === id;
      });
      if (related) {
        return `${related[column.foreignKey.show]} (${row[column.name]})`;
      }
      return row[column.name];
    },
    lookupLink(column, row) {
      return `/#/documents/${column.foreignKey.table}/${row[column.name]}`;
    },
    editDocument(e) {
      e.preventDefault();
      this.editing = true;
    },
    updateDocument(record) {
      return this.$store.dispatch("updateDocument", {
        id: this.id,
        type: this.type,
        content: record
      });
    },
    cancelEditDocument() {
      this.editing = false;
    }
  }
};

export default component;
</script>

<style scoped>
.document {
  margin: 100px auto;
  width: 90%;
}
</style>
