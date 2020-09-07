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
        <DataTableColumn
          :key="n"
          v-for="(column, n) in columns"
          :column="column"
          :row="row"
          :lookup="lookup"
        />
      </tr>
    </tbody>
  </table>
</template>

<script>
import DataTableColumn from "./DataTableColumn";
import { titleize } from "../helpers/form-helpers";
export default {
  name: "BasicTable",
  props: {
    name: String,
    columns: Array,
    rows: Array,
    lookup: Function
  },
  components: {
    DataTableColumn
  },
  methods: {
    columnTitle(column) {
      return column.label ? column.label : titleize(column.name);
    },
    titleize
  }
};
</script>
