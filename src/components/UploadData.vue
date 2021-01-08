<template>
  <div>
    <form @submit="startImport">
      <div class="form-group" v-if="data.length > 1">
        <label>View</label>
        <select class="form-control" @change="changeView" v-model="view">
          <option>All Tabs</option>
          <option :key="sheet.name" v-for="sheet in data">{{
            sheet.name
          }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Settings</label>
      </div>
      <div class="mt-4">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="uploading"
          @click="startImport"
        >
          {{ buttonLabel }}
        </button>
      </div>
      <div class="mt-5" :key="n" v-for="(sheet, n) in data">
        <div v-if="view == 'All Tabs' || sheet.name == view">
          <h4>Tab: {{ sheet.name }}</h4>
          <div class="form-group">
            <label>Table</label>
            <select
              class="form-control"
              v-model="settings.names[sheet.name]"
              @change.prevent="e => selectTable(sheet.name, e.target.value)"
            >
              <option>ignore</option>
              <option :key="table.name" v-for="table in tables">{{
                table.name
              }}</option>
            </select>
          </div>
          <table class="table table-striped">
            <thead v-if="settings.names[sheet.name] != 'ignore'">
              <td :key="c" v-for="(column, c) in settings.columns[sheet.name]">
                <select
                  class="form-control"
                  v-model="settings.columns[sheet.name][c]"
                >
                  <option value="ignore">ignore</option>
                  <option
                    :key="o"
                    :value="o"
                    v-for="o in settings.tableColumns[sheet.name]"
                    >{{ o }}</option
                  >
                </select>
              </td>
            </thead>
            <tbody>
              <tr :key="m" v-for="(row, m) in firstRows(sheet)">
                <td :key="n" v-for="(column, n) in row">
                  {{ column }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mb-5" v-if="rowsToShow[sheet.name] < sheet.data.length">
            <a href="#" @click.prevent="() => (rowsToShow[sheet.name] += 10)"
              >More rows...</a
            >
          </div>
        </div>
      </div>
    </form>
    <div
      :key="n"
      v-for="(message, n) in validationMessages"
      class="mt-3 alert alert-danger"
    >
      {{ message }}
    </div>
  </div>
</template>

<script>
import { post } from '../store'
const _ = require('lodash')
export default {
  name: 'UploadData',
  props: {
    id: String,
    data: Array,
    upload: Object
  },
  components: {},
  data: function () {
    const settings = this.buildSettings()
    const rowsToShow = this.initializeRowsToShow()
    const view = this.data ? this.data[0].name : 'All Tabs'
    return {
      settings,
      buttonLabel: 'Import',
      uploading: false,
      validationMessages: [],
      rowsToShow,
      view
    }
  },
  computed: {
    tables: function () {
      return this.$store.state.configuration.tables
    },
    uploadConfigurations: function () {
      return this.$store.state.configuration.templates
    }
  },
  methods: {
    firstRows: function (sheet) {
      return sheet.data.slice(0, this.rowsToShow[sheet.name])
    },
    startImport (e) {
      e.preventDefault()
      this.validationMessages = this.validate()
      if (this.validationMessages.length === 0) {
        this.uploading = true
        this.buttonLabel = 'Importing...'
        const sheets = _.chain(this.data)
          .reject(sheet => this.settings.names[sheet.name] === 'ignore')
          .map(sheet => {
            return {
              tabName: sheet.name,
              type: this.settings.names[sheet.name],
              columns: this.settings.columns[sheet.name]
            }
          })
          .value()

        post(`/api/imports/${this.id}`, { sheets })
          .then(({ documents }) => {
            this.$store.dispatch('importDocuments', { documents })
          })
          .then(() => {
            this.uploading = false
            this.buttonLabel = 'Import'
            this.$router.push({ path: '/' })
          })
      }
    },
    validate () {
      const messages = []
      let selected = 0
      this.data.forEach(sheet => {
        if (this.settings.names[sheet.name] !== 'ignore') {
          selected++
          const columns = this.settings.columns[sheet.name].filter(
            c => c !== 'ignore'
          )
          if (columns.length === 0) {
            messages.push(
              `Select at least one column to import on tab ${sheet.name}`
            )
          }
          const uniqueColumns = _.uniq(columns)
          if (uniqueColumns.length !== columns.length) {
            messages.push(`Each column must be unique on tab ${sheet.name}`)
          }
        }
      })
      if (selected === 0) {
        messages.push('Nothing selected to import')
      }
      return messages
    },
    columnsForTable (tableName) {
      const table = this.$store.getters.table(tableName)
      if (!table) {
        return []
      }
      return _.chain(table)
        .get('content.columns', [])
        .reject(c => c.primaryKey)
        .map('name')
        .value()
    },
    selectTable (sheetName, tableName) {
      this.settings.names[sheetName] = tableName
      this.settings.tableColumns[sheetName] = this.columnsForTable(tableName)
    },
    sheetNames () {
      return this.data.map(s => s.name)
    },
    initializeNames () {
      return this.sheetNames().reduce((acc, n) => {
        acc[n] = 'ignore'
        return acc
      }, {})
    },
    initializeRowsToShow () {
      return this.sheetNames().reduce((acc, n) => {
        acc[n] = 10
        return acc
      }, {})
    },
    initializeColumns () {
      return this.data.reduce((acc, sheet) => {
        const n = sheet.data.length > 0 ? sheet.data[0].length : 0
        acc[sheet.name] = Array(n).fill('ignore')
        return acc
      }, {})
    },
    changeView (e) {
      e.preventDefault()
      this.view = e.target.value
    },
    buildSettings () {
      const result = {
        names: this.initializeNames(),
        columns: this.initializeColumns(),
        tableColumns: {}
      }
      const configuration = this.$store.getters.template()
      const settings = _.get(configuration, 'content.settings')
      if (settings) {
        settings.forEach(s => {
          result.names[s.sheetName] = s.tableName
          result.columns[s.sheetName] = s.columns
          result.tableColumns[s.sheetName] = this.columnsForTable(s.tableName)
        })
      }
      return result
    }
  }
}
</script>
