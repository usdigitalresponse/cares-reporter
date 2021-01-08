<template>
  <div class="data">
    <h2>Projects</h2>
    <div class="mb-4">
      <router-link to="/new_project" class="btn btn-primary"
        >Create New Project</router-link
      >
    </div>
    <div>
      <DataTable v-if="projects" :table="table" :rows="projects" :user="user" />
    </div>
  </div>
</template>

<script>
import DataTable from '../components/DataTable'
import ProjectLink from '../components/ProjectLink'
import ProjectUploadsLink from '../components/ProjectUploadsLink'
import _ from 'lodash'
export default {
  name: 'Projects',
  components: {
    DataTable
  },
  data: function () {
    const user = this.$store.state.user
    return {
      user,
      table: {
        views: [
          {
            name: 'Group by Agency',
            groupBy: 'agency_code'
          }
        ],
        columns: [
          { label: 'Project Code', component: ProjectUploadsLink },
          { name: 'name' },
          { name: 'status' },
          { name: 'agency_code', label: 'Agency Code' },
          { name: 'number_of_uploads', label: 'Number of Uploads' },
          { component: ProjectLink }
        ]
      }
    }
  },
  watch: {
    '$store.state.projects': function (projects) {
      this.projects = projects
    }
  },
  computed: {
    projects: function () {
      const byId = _.keyBy(this.$store.state.projects, 'id')
      const uploads = _.groupBy(this.$store.state.uploads, u => {
        const project = byId[u.project_id]
        return _.get(project, 'code', '')
      })
      return _.map(this.$store.state.projects, p => {
        return {
          ...p,
          number_of_uploads: _.get(uploads, p.code, []).length
        }
      })
    }
  }
}
</script>
<style scoped>
.data {
  width: 90%;
  margin: 0 auto;
}
table {
  width: 100%;
  margin: 50px auto;
}
h2,
td {
  text-align: left;
}
</style>
