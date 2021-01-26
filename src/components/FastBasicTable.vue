<template>
  <table class="mt-3 table table-striped">
    <thead class="thead-light">
      <tr>
        <th :key="`th|${n}`" v-for="(column, n) in columns">
          {{ columnTitle(column) }}
        </th>
      </tr>
    </thead>
    <tbody :key="tKey" v-fastTable="(row) in rows">
    </tbody>
  </table>
</template>

<script>
import { titleize } from '../helpers/form-helpers'
export default {
  name: 'FastBasicTable',
  props: {
    name: String,
    columns: Array,
    rows: Array,
    row: Object,
    tKey: String // seems to be needed to trigger refresh
  },
  components: {
  },
  methods: {
    columnTitle (column) {
      return column.label ? column.label : titleize(column.name)
    },
    titleize
  },
  directives: {
    fastTable: {
      inserted: refresh,
      update: refresh
    }
  }
}

function refresh (el, binding, vnode, oldVnode) {
  // console.dir(binding)
  const rows = vnode.context.rows
  const cols = vnode.context.columns
  if (!rows.length) {
    return
  }

  requestAnimationFrame(() => {
    el.innerHTML = `Loading ${rows.length} records...`
    requestAnimationFrame(() => {
      const htmlRows = rows.map(row => {
        const htmlCells = cols.map(col => {
          if (col.href) {
            return `<td><a href="${col.href(row)}">${col.label}</a></td>`
          }
          return `<td>${row[col.name] || ''}</td>`
        })
        return `<tr>${htmlCells.join('')}</tr>`
      })
      el.innerHTML = htmlRows.join('')
    })
  })
}
</script>

<style scoped>
td:first-child {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: #e9ecef;
}

th:first-child {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
  z-index: 3;
}

th {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
