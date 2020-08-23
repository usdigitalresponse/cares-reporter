<template>
  <table class="mt-3 table table-striped">
    <thead>
      <tr>
        <th :key="n" v-for="(column, n) in columns">
          {{ columnTitle(column) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(groupRows, key) in groups">
        <tr :key="`${keyPrefix}-${key}`">
          <td :colspan="columns.length">
            {{ titleize(groupBy) }}: <b>{{ key }}</b>
          </td>
        </tr>
        <tr :key="`${groupBy}-${search}-${m}`" v-for="(row, m) in groupRows">
          <td :key="n" v-for="(column, n) in columns" :style="style(column)">
            <span v-if="column.primaryKey">
              <a :href="documentUrl(row)">{{ row[column.name] }}</a>
            </span>
            <span v-else-if="column.foreignKey">
              <a :href="lookupLink(column, row)">{{ lookup(column, row) }}</a>
            </span>
            <span v-else-if="column.format">
              {{ format(row[column.name], column.format) }}
            </span>
            <span v-else>
              {{ row[column.name] }}
            </span>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script>
import { titleize } from "../helpers/form-helpers";
import numeral from "numeral";
import _ from "lodash";
export default {
  name: "GroupedTable",
  props: {
    name: String,
    columns: Array,
    rows: Array,
    groupBy: String,
    search: String
  },
  data: function() {
    const groups = _.groupBy(this.rows, this.groupBy);
    const keyPrefix = `${this.groupBy}-${this.search}`;
    return {
      groups,
      keyPrefix
    };
  },
  watch: {
    rows: function(newRows) {
      this.groups = _.groupBy(newRows, this.groupBy);
    },
    groupBy: function(newGroupBy) {
      this.groups = _.groupBy(this.rows, newGroupBy);
    }
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    documentUrl(row) {
      return `/#/documents/${this.name}/${row.id}`;
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
      return `/#/documents/${column.foreignKey.table}/${row[column.name]}`;
    },
    format(value, fmt) {
      return numeral(value).format(fmt);
    },
    style(column) {
      if (column.format) {
        return "text-align: right";
      }
      return "";
    }
  }
};
</script>
