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
              lookupValue(column, row)
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
import numeral from "numeral";
import _ from "lodash";
export default {
  name: "BasicTable",
  props: {
    name: String,
    columns: Array,
    rows: Array,
    lookup: Function
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize,
    documentUrl(row) {
      return `/documents/${this.name}/${row.id}`;
    },
    lookupValue(column, row) {
      if (_.isFunction(this.lookup)) {
        return this.lookup(column, row);
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
