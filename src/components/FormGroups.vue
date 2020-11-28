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
            v-for="(option, n) in getForeignKeyValues(column)"
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
          <option
            :key="n"
            :value="optionValue(option)"
            v-for="(option, n) in column.allowedValues"
            >{{ optionName(option) }}</option
          >
        </select>
      </div>
      <div v-else-if="column.rows > 0 || column.json">
        <textarea
          class="form-control"
          :rows="column.rows ? column.rows : 10"
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
import _ from "lodash";
export default {
  name: "FormGroups",
  props: {
    columns: Array,
    record: Object,
    foreignKeyValues: Function
  },
  methods: {
    columnTitle,
    getForeignKeyValues(column) {
      if (_.isFunction(this.foreignKeyValues)) {
        return this.foreignKeyValues(column);
      }
      return [];
    },
    optionValue(option) {
      return _.isObject(option) ? option.value : option;
    },
    optionName(option) {
      return _.isObject(option) ? option.name : option;
    }
  }
};
</script>
