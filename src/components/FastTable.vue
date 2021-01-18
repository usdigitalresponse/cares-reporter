<template>
  <div>
    <div class="row">
      <div class="col-12">
        <FastBasicTable
          :name="name"
          :columns="columns"
          :rows="filteredRows()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import FastBasicTable from './FastBasicTable.vue'
import { titleize, singular } from '../helpers/form-helpers'
import _ from 'lodash'
const component = {
  name: 'Table',
  components: {
    FastBasicTable
  },
  props: {
    table: Object,
    rows: Array,
    user: Object,
  },
  data: function () {
    const name = this.table ? this.table.name : ''
    const createNewLabel = `Create New ${titleize(singular(name))}`
    return {
      name,
      createUrl: `/create/${name}`,
      search: '',
      createNewLabel,
    }
  },
  computed: {
    columns: function () {
      return (this.table || {}).columns || []
    },
  },
  watch: {
    table: function (table) {
      this.createUrl = `/create/${table.name}`
      this.createNewLabel = `Create New ${titleize(singular(table.name))}`
    }
  },
  methods: {
    titleize,
    filteredRows () {
      return this.rows
    },
  }
}

export default component
</script>
