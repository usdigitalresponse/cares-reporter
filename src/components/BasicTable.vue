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
      <tr :key="row.id" v-for="row in rows">
        <td :key="n" v-for="(column, n) in columns" :style="style(column)">
          <span v-if="column.primaryKey">
            <router-link :to="documentUrl(row)">{{
              row[column.name]
            }}</router-link>
          </span>
          <span v-else-if="column.foreignKey">
            <router-link :to="lookupLink(column, row)">{{
              lookup(column, row)
            }}</router-link>
          </span>
          <span v-else-if="column.format">
            {{ format(row[column.name], column.format) }}
          </span>
          <span v-else>
            {{ row[column.name] }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import { titleize } from "../helpers/form-helpers";
import _ from "lodash";
import numeral from "numeral";
export default {
  name: "BasicTable",
  props: {
    name: String,
    columns: Array,
    rows: Array
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    documentUrl(row) {
      return `/documents/${this.name}/${row.id}`;
    },
    lookup(column, row) {
      const id = parseInt(row[column.name]);
      const related = _.find(
        this.$store.state.documents[column.foreignKey.table],
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
