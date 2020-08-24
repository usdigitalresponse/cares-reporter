<template>
  <div>
    <div class="mt-3 row">
      <div class="col-3">
        <div v-if="hasViews">
          <select class="form-control" v-model="viewName" @change="changeView">
            <option>Standard View</option>
            <option :key="view.name" v-for="view in views">{{
              view.name
            }}</option>
          </select>
        </div>
      </div>
      <div class="col-6">
        <input
          class="form-control"
          @input="onSearchChange"
          placeholder="Search..."
        />
      </div>
      <div class="col-3 float-right" v-if="canWriteToTable(user, name)">
        <router-link class="btn btn-primary" :to="createUrl">{{
          createNewLabel
        }}</router-link>
      </div>
    </div>
    <div class="row">
      <div v-if="groupBy">
        <GroupedTable
          :name="name"
          :columns="columns"
          :rows="filteredRows()"
          :groupBy="groupBy"
          :search="search"
        />
      </div>
      <div v-else>
        <BasicTable :name="name" :columns="columns" :rows="filteredRows()" />
      </div>
    </div>
  </div>
</template>

<script>
import BasicTable from "./BasicTable.vue";
import GroupedTable from "./GroupedTable.vue";
import { titleize, singular, canWriteToTable } from "../helpers/form-helpers";
import _ from "lodash";
const component = {
  name: "Table",
  components: {
    BasicTable,
    GroupedTable
  },
  props: {
    table: Object,
    rows: Array
  },
  data: function() {
    const name = this.table ? this.table.name : "";
    const viewName = "Standard View";
    const groupBy = null;
    const createNewLabel = `Create New ${titleize(singular(name))}`;
    const d = {
      name,
      createUrl: `/create/${name}`,
      search: "",
      createNewLabel,
      viewName,
      groupBy
    };
    return d;
  },
  computed: {
    user: function() {
      return this.$store.state.user;
    },
    columns: function() {
      if (!this.table) {
        return [];
      }
      const view = _.find(this.table.views, v => v.name == this.viewName);
      if (!view || !view.columns) {
        return this.table.columns;
      }
      return view.columns.map(n => {
        return _.find(this.table.columns, c => c.name == n);
      });
    },
    views: function() {
      return this.table ? this.table.views : [];
    },
    hasViews: function() {
      return this.views && this.views.length > 0;
    }
  },
  watch: {
    table: function(table) {
      this.createUrl = `/create/${table.name}`;
      this.createNewLabel = `Create New ${titleize(singular(table.name))}`;
      this.viewName = "Standard View";
      this.groupBy = null;
    }
  },
  methods: {
    canWriteToTable,
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    getGroupBy(viewName) {
      const view = _.find(this.table.views, v => v.name == viewName);
      return view ? view.groupBy : null;
    },
    onSearchChange(e) {
      e.preventDefault();
      this.search = e.target.value;
    },
    filteredRows() {
      if (!this.search) {
        return this.rows;
      }
      return this.rows.filter(row => {
        const search = this.search.toLowerCase();
        const match = _.some(this.columns, column => {
          const value = `${row[column.name]}`;
          return value.toLowerCase().indexOf(search) >= 0;
        });
        return match;
      });
    },
    documentUrl(row) {
      return `/documents/${this.table.name}/${row.id}`;
    },
    lookup(column, row) {
      const id = parseInt(row[column.name]);
      const related = _.find(
        this.$store.state.tables[column.foreignKey.table],
        r => r.id === id
      );
      if (related) {
        return `${related[column.foreignKey.show]} (${row[column.name]})`;
      }
      return row[column.name];
    },
    lookupLink(column, row) {
      return `/documents/${column.foreignKey.table}/${row[column.name]}`;
    },
    changeView(e) {
      e.preventDefault();
      const viewName = e.target.value;
      this.viewName = viewName;
      this.groupBy = this.getGroupBy(viewName);
    }
  }
};

export default component;
</script>
