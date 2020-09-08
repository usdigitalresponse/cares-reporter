<template>
  <div class="data">
    <h1>Projects</h1>
    <DataTable v-if="projects" :table="table" :rows="projects" :user="user" />
  </div>
</template>

<script>
import DataTable from "../components/DataTable";
export default {
  name: "Projects",
  components: {
    DataTable
  },
  data: function() {
    const user = this.$store.state.user;
    return {
      user,
      table: {
        views: [],
        columns: [{ name: "id" }, { name: "code" }, { name: "name" }]
      }
    };
  },
  watch: {
    "$store.state.projects": function(projects) {
      this.projects = projects;
    }
  },
  computed: {
    projects: function() {
      return this.$store.state.projects;
    }
  }
};
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
