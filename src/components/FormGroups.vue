<template>
  <div>
    <div class="form-group" :key="n" v-for="(column, n) in columns">
      <label>{{ columnTitle(column) }}</label>
      <div v-if="column.foreignKey">
        <select
          class="form-control"
          :name="column.name"
          v-model="record[column.name]"
        >
          <option
            :key="n"
            :value="option.value"
            v-for="(option, n) in foreignKeyValues(column)"
            >{{ option.name }}</option
          >
        </select>
      </div>
      <div v-else-if="column.allowedValues">
        <select
          class="form-control"
          :name="column.name"
          v-model="record[column.name]"
        >
          <option :key="n" v-for="(option, n) in column.allowedValues">{{
            option
          }}</option>
        </select>
      </div>
      <div v-else-if="column.rows > 0">
        <textarea
          class="form-control"
          :rows="column.rows"
          :name="column.name"
          v-model="record[column.name]"
        />
      </div>
      <div v-else>
        <input
          class="form-control"
          :name="column.name"
          :disabled="column.generated"
          v-model="record[column.name]"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { columnTitle } from "../helpers/form-helpers";
//import _ from "lodash";
export default {
  name: "FormGroups",
  props: {
    columns: Array,
    record: Object
  },
  methods: {
    columnTitle,
    foreignKeyValues() {
      //foreignKeyValues(column) {
      //const lookup = _.chain(this.$store, `state.documents.${column.foreignKey.table}`, [])
      //return _.map(lookup, (e) => {
      //    return { value: e.id, name: e[column.foreignKey.show] }
      //})
      return []; // FIXME
    }
  }
};
</script>
